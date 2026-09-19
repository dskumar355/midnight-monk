"""Notification Service — handles In-App Notifications, Firebase Cloud Messaging (FCM) Push,
and SMS/Email fallback.

Architecture:
- In-App Notification History: Recorded into MongoDB `notifications` collection
- Push Notifications: Sent via Firebase Admin SDK (FCM) to registered device tokens
- Fallback: Graceful console logging if FCM service account is not yet configured
"""
import os
import json
from datetime import datetime
from database.db import notifications_collection, notification_tokens_collection

# ─── Firebase Admin SDK Initialization ───
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

    if sa_json:
        try:
            cred_dict = json.loads(sa_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("🔥 Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_JSON")
        except Exception as e:
            print(f"⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
    elif sa_path and os.path.exists(sa_path):
        try:
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print(f"🔥 Firebase Admin SDK initialized from file: {sa_path}")
        except Exception as e:
            print(f"⚠️ Failed to initialize Firebase from path: {e}")
    else:
        # Check if already initialized by default
        try:
            firebase_admin.get_app()
            firebase_initialized = True
        except ValueError:
            print("ℹ️ Firebase Admin SDK: No credentials configured. In-app notifications will work; push notifications will be simulated.")
except ImportError:
    print("ℹ️ firebase-admin library not installed. In-app notifications will work; push notifications will be simulated.")


# ─── In-App Notification Logging ───
def record_in_app_notification(user_id, order_id, ntype, title, body, data=None):
    """
    Store notification history in MongoDB `notifications` collection for the customer/admin.
    """
    if not user_id:
        return None

    doc = {
        "user_id": str(user_id),
        "order_id": str(order_id) if order_id else None,
        "type": ntype,
        "title": title,
        "body": body,
        "data": data or {},
        "read": False,
        "read_at": None,
        "createdAt": datetime.utcnow().isoformat(),
    }
    try:
        res = notifications_collection.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return doc
    except Exception as e:
        print(f"⚠️ Failed to record in-app notification: {e}")
        return None


# ─── FCM Push Notification Sender ───
def send_fcm_push(user_id, title, body, data=None):
    """
    Send Web Push Notification via Firebase Cloud Messaging to all active device tokens of user_id.
    """
    if not user_id:
        return 0

    tokens_cursor = notification_tokens_collection.find({"user_id": str(user_id), "active": True})
    tokens = [t.get("token") for t in tokens_cursor if t.get("token")]

    if not tokens:
        return 0

    if not firebase_initialized:
        print(f"🔔 [MOCK PUSH] User: {user_id} | Title: {title} | Body: {body}")
        return len(tokens)

    data_payload = {str(k): str(v) for k, v in (data or {}).items()}
    success_count = 0

    for token in tokens:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data_payload,
                token=token,
            )
            messaging.send(message)
            success_count += 1
        except Exception as e:
            err_str = str(e)
            print(f"⚠️ FCM push failed for token {token[:12]}...: {err_str}")
            # If token is invalid or unregistered, deactivate it
            if "Requested entity was not found" in err_str or "registration-token-not-registered" in err_str or "invalid-registration-token" in err_str:
                notification_tokens_collection.update_one({"token": token}, {"$set": {"active": False, "updatedAt": datetime.utcnow().isoformat()}})

    return success_count


# ─── Combined Trigger Function ───
def dispatch_order_notification(user_id, order_id, ntype, title, body, data=None):
    """Record in-app history AND send FCM push notification."""
    record_in_app_notification(user_id, order_id, ntype, title, body, data)
    send_fcm_push(user_id, title, body, data)


# ─── Order Transition Event Triggers ───

def notify_order_placed(user_phone, user_name, order_id, total, is_preorder=False, scheduled_time_str=None, user_id=None):
    """Triggered on order creation."""
    short_id = str(order_id)[-6:].upper()
    if is_preorder:
        title = "🌙 Preorder Scheduled"
        body = f"Hi {user_name}! Your preorder #{short_id} has been scheduled for {scheduled_time_str or 'upcoming shift'}."
    else:
        title = "🌙 Order Placed"
        body = f"Hi {user_name}! Your Midnight Monk order #{short_id} for ₹{total:.0f} has been placed."

    if user_id:
        dispatch_order_notification(user_id, order_id, "ORDER_PLACED", title, body, {
            "order_id": str(order_id),
            "type": "ORDER_PLACED",
            "url": f"/track-order/{order_id}",
        })


def notify_preorder_accepted(order):
    """Kitchen accepts a preorder."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")
    scheduled_for = order.get("scheduled_for", "")

    title = "✅ Preorder Accepted"
    body = f"Your order #{short_id} has been accepted by the kitchen. Scheduled for delivery: {scheduled_for}."
    dispatch_order_notification(user_id, order_id, "PREORDER_ACCEPTED", title, body, {
        "order_id": order_id,
        "type": "PREORDER_ACCEPTED",
        "url": f"/track-order/{order_id}",
    })


def notify_order_preparing(order):
    """Kitchen begins preparation."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")

    title = "🍳 Kitchen Started Preparing"
    body = f"The kitchen is now preparing your hot meal for order #{short_id}."
    dispatch_order_notification(user_id, order_id, "ORDER_PREPARING", title, body, {
        "order_id": order_id,
        "type": "ORDER_PREPARING",
        "url": f"/track-order/{order_id}",
    })


def notify_order_ready(order):
    """Food is packed & ready for pickup."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")

    title = "📦 Food is Ready"
    body = f"Order #{short_id} has been prepared and packed. Waiting for rider pickup."
    dispatch_order_notification(user_id, order_id, "ORDER_READY", title, body, {
        "order_id": order_id,
        "type": "ORDER_READY",
        "url": f"/track-order/{order_id}",
    })


def notify_rider_picked_up(order):
    """Rider picked up order from kitchen."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")
    rider_name = order.get("delivery_assignment", {}).get("partner_name") or "Rider"

    title = "🛵 Order Picked Up"
    body = f"{rider_name} has picked up your feast #{short_id} from the kitchen."
    dispatch_order_notification(user_id, order_id, "ORDER_PICKED_UP", title, body, {
        "order_id": order_id,
        "type": "ORDER_PICKED_UP",
        "url": f"/track-order/{order_id}",
    })


def notify_out_for_delivery(order):
    """Rider is on the way."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")

    title = "🚀 Out for Delivery"
    body = f"Your order #{short_id} is on the way! Watch the live rider on the tracking map."
    dispatch_order_notification(user_id, order_id, "OUT_FOR_DELIVERY", title, body, {
        "order_id": order_id,
        "type": "OUT_FOR_DELIVERY",
        "url": f"/track-order/{order_id}",
    })


def notify_order_delivered(order):
    """Order delivered with photo proof and OTP."""
    order_id = str(order.get("_id") or order.get("id"))
    short_id = order_id[-6:].upper()
    user = order.get("user") or {}
    user_id = str(user.get("_id") or user.get("id") or order.get("user_id") or "")

    title = "🎉 Order Delivered"
    body = f"Your Midnight Monk order #{short_id} has been delivered successfully. Delivery proof photo is available."
    dispatch_order_notification(user_id, order_id, "ORDER_DELIVERED", title, body, {
        "order_id": order_id,
        "type": "ORDER_DELIVERED",
        "url": f"/track-order/{order_id}",
    })


def notify_kitchen_new_order(kitchen_id, order_id, items_count, total, is_preorder=False, scheduled_time=None):
    """Log / notify kitchen admin of incoming orders."""
    short_id = str(order_id)[-6:].upper()
    if is_preorder:
        print(f"🔔 [KITCHEN PREORDER] New preorder #{short_id} at {kitchen_id} scheduled for {scheduled_time}: {items_count} items, ₹{total:.0f}")
    else:
        print(f"🔔 [KITCHEN] New order #{short_id} at {kitchen_id}: {items_count} items, ₹{total:.0f}")


def notify_order_status(user_phone, user_name, order_id, status):
    """Legacy SMS fallback logger."""
    short_id = str(order_id)[-6:].upper()
    print(f"📱 [SMS/STATUS] Order #{short_id} -> {status} for {user_name} ({user_phone})")
