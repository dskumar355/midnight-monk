from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import orders_collection, delivery_partners_collection
from models.order_model import create_order, format_order, validate_order, get_next_status, is_valid_transition
from utils.helpers import require_auth, require_role
from datetime import datetime
from services.notification_service import notify_order_placed, notify_order_status, notify_kitchen_new_order

order_routes = Blueprint("order_routes", __name__)

# ─────────────────────────────────────────
# ➕ PLACE ORDER (User)
# POST /api/orders/create
# Called from Checkout.jsx handlePayment()
# ─────────────────────────────────────────
@order_routes.route("/create", methods=["POST"])
def create():
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    role = payload.get("role")
    if role and role != "user":
        return jsonify({"error": "Only customers can place orders. Please sign in with a customer account."}), 403

    data       = request.json or {}
    kitchen_id = (data.get("kitchenId") or data.get("kitchen_id") or "").strip()
    items      = data.get("items", [])
    address    = data.get("address", "").strip()
    payment_method = data.get("paymentMethod") or data.get("payment_method") or "COD"
    coupon_code = (data.get("couponCode") or data.get("coupon_code") or "").strip().upper()

    user_info = {
        "id":     payload.get("id"),
        "name":   payload.get("name") or data.get("user", {}).get("name", "Customer"),
        "mobile": payload.get("mobile") or data.get("user", {}).get("mobile", ""),
        "paymentMethod": payment_method
    }

    # 1. Basic input validation
    if not items or len(items) == 0:
        return jsonify({"error": "Order must contain at least one item"}), 400
    if not address:
        return jsonify({"error": "Delivery address is required"}), 400
    if not kitchen_id:
        return jsonify({"error": "Kitchen ID is required"}), 400

    # 2. Verify Kitchen exists and is OPEN
    from database.db import kitchens_collection, menu_collection, coupons_collection
    kitchen = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    if not kitchen:
        return jsonify({"error": "Kitchen not found"}), 404
    if not kitchen.get("is_open", True):
        return jsonify({"error": f"'{kitchen.get('kitchen_name', 'Kitchen')}' is currently closed and not accepting orders."}), 400

    # 3. Server-side Price & Availability Verification
    verified_items = []
    subtotal = 0.0
    for itm in items:
        item_id = itm.get("id") or itm.get("menu_id")
        qty = int(itm.get("quantity", 1))
        if qty <= 0:
            return jsonify({"error": "Invalid item quantity"}), 400

        db_item = None
        try:
            db_item = menu_collection.find_one({"_id": ObjectId(item_id)})
        except Exception:
            db_item = menu_collection.find_one({"_id": item_id})

        if not db_item:
            db_item = menu_collection.find_one({"food_name": itm.get("name"), "kitchen_id": kitchen_id})

        if not db_item:
            return jsonify({"error": f"Item '{itm.get('name')}' is no longer on the menu"}), 400

        if not db_item.get("available", True):
            return jsonify({"error": f"Item '{db_item.get('food_name')}' is currently unavailable"}), 400

        orig_price = float(db_item.get("price", 0))
        discount_pct = float(db_item.get("discount", 0))
        unit_price = round(orig_price - (orig_price * discount_pct / 100), 2)
        subtotal += unit_price * qty

        verified_items.append({
            "id": str(db_item["_id"]),
            "name": db_item.get("food_name"),
            "price": unit_price,
            "quantity": qty,
            "kitchenId": kitchen_id,
        })

    # 4. Handle Coupon Verification if applied
    discount_amount = 0.0
    if coupon_code:
        coupon = coupons_collection.find_one({"code": coupon_code, "isActive": True})
        if coupon:
            if coupon.get("discountType") == "percent":
                discount_amount = round(subtotal * float(coupon.get("discountValue", 0)) / 100, 2)
                discount_amount = min(discount_amount, float(coupon.get("maxDiscount", 9999)))
            else:
                discount_amount = float(coupon.get("discountValue", 0))

    final_total = round(max(0.0, subtotal - discount_amount), 2)

    # 5. Create Order
    order = create_order(user_info, kitchen_id, verified_items, final_total, address)
    result = orders_collection.insert_one(order)
    created = orders_collection.find_one({"_id": result.inserted_id})

    # 6. Send notifications
    try:
        notify_order_placed(user_info.get("mobile", ""), user_info.get("name", "Customer"), str(result.inserted_id), final_total)
        notify_kitchen_new_order(kitchen_id, str(result.inserted_id), len(verified_items), final_total)
        from flask import current_app
        emit_fn = getattr(current_app, "emit_order_update", None)
        if emit_fn:
            emit_fn(str(result.inserted_id), "ORDER_PLACED", kitchen_id)
    except Exception:
        pass

    return jsonify({
        "message": "Order placed successfully",
        "order": format_order(created)
    }), 201


# ─────────────────────────────────────────
# 📦 GET USER ORDERS
# GET /api/orders/user/<mobile>
# Called from Orders.jsx
# ─────────────────────────────────────────
@order_routes.route("/user/<mobile>", methods=["GET"])
def get_user_orders(mobile):
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    role = payload.get("role")
    if role == "user":
        token_mobile = str(payload.get("mobile") or "").strip()
        if token_mobile != mobile:
            return jsonify({"error": "Unauthorized access to user orders"}), 403
    elif role not in ["master_admin", "admin"]:
        return jsonify({"error": "Unauthorized"}), 403

    orders = list(orders_collection.find({"user.mobile": mobile}).sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 🍳 GET KITCHEN ORDERS (Kitchen Admin)
# GET /api/orders/kitchen/<kitchen_id>
# Called from AdminOrders.jsx
# ─────────────────────────────────────────
@order_routes.route("/kitchen/<kitchen_id>", methods=["GET"])
def get_kitchen_orders(kitchen_id):
    payload, err = require_role(request, ["kitchen_admin", "master_admin"])
    if err:
        return jsonify(err[0]), err[1]
    if payload.get("role") == "kitchen_admin" and payload.get("kitchenId") != kitchen_id:
        return jsonify({"error": "Unauthorized"}), 403

    orders = list(orders_collection.find({"kitchen_id": kitchen_id}).sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 👑 GET ALL ORDERS (Master Admin)
# GET /api/orders/all
# Called from MasterOrders.jsx
# ─────────────────────────────────────────
@order_routes.route("/all", methods=["GET"])
def get_all_orders():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    orders = list(orders_collection.find().sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 🔄 UPDATE ORDER STATUS (Kitchen Admin)
# PATCH /api/orders/status/<order_id>
# Called from AdminOrders.jsx updateOrderStatus()
# ─────────────────────────────────────────
@order_routes.route("/status/<order_id>", methods=["PATCH"])
@order_routes.route("/kitchen/status/<order_id>", methods=["PATCH"])
def update_status(order_id):
    payload, err = require_role(request, "kitchen_admin")
    if err:
        return jsonify(err[0]), err[1]

    data       = request.json or {}
    new_status = data.get("status", "").strip()

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("kitchen_id") != payload.get("kitchenId"):
        return jsonify({"error": "You can only update orders for your own kitchen"}), 403

    # Validate status transition
    current_status = order.get("status", "ORDER_PLACED")
    allowed_statuses = ["ACCEPTED", "PREPARING", "READY", "CANCELLED"]
    if new_status not in allowed_statuses:
        return jsonify({"error": f"Kitchen cannot set status to '{new_status}'"}), 400
    if not is_valid_transition(current_status, new_status):
        expected_next = get_next_status(current_status)
        return jsonify({
            "error": f"Invalid status transition: '{current_status}' → '{new_status}'. Expected next: '{expected_next}'"
        }), 400

    update_doc = {"status": new_status, "updatedAt": datetime.utcnow().isoformat()}
    orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": update_doc}
    )

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})

    # ✅ Emit real-time Socket.IO event
    try:
        from flask import current_app
        emit_fn = getattr(current_app, "emit_order_update", None)
        if emit_fn:
            kitchen_id = updated.get("kitchen_id", "")
            emit_fn(order_id, new_status, kitchen_id)
    except Exception:
        pass  # non-critical — don't fail the request

    # Send SMS/Email notification
    try:
        order_user = updated.get("user", {})
        notify_order_status(
            order_user.get("mobile", ""),
            order_user.get("name", "Customer"),
            order_id,
            new_status
        )
    except Exception:
        pass  # non-critical

    return jsonify({
        "message": f"Order status updated to '{new_status}'",
        "order":   format_order(updated)
    }), 200


@order_routes.route("/delivery/me", methods=["GET"])
def get_partner_orders():
    payload, err = require_role(request, "delivery_partner")
    if err:
        return jsonify(err[0]), err[1]

    partner_id = payload.get("id")
    orders = list(orders_collection.find({
        "$or": [
            {"delivery_assignment.partner_id": partner_id},
            {"status": "READY"},
        ]
    }).sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


@order_routes.route("/delivery/dashboard", methods=["GET"])
def get_partner_dashboard():
    payload, err = require_role(request, "delivery_partner")
    if err:
        return jsonify(err[0]), err[1]

    partner = delivery_partners_collection.find_one({"_id": ObjectId(payload.get("id"))})
    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404

    orders = list(orders_collection.find({"delivery_assignment.partner_id": payload.get("id")}))
    today = datetime.utcnow().date().isoformat()
    today_orders = [o for o in orders if (o.get("updatedAt") or "").startswith(today)]
    active_order = next((format_order(o) for o in orders if o.get("status") in ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]), None)

    return jsonify({
        "partner": {
            "id": str(partner["_id"]),
            "name": partner.get("name", ""),
            "username": partner.get("username", ""),
            "phone": partner.get("phone", ""),
            "vehicleNumber": partner.get("vehicle_number", ""),
            "isOnline": partner.get("is_online", False),
            "availabilityStatus": partner.get("availability_status", "Offline"),
        },
        "assignedOrders": [format_order(o) for o in orders if o.get("status") == "ASSIGNED"],
        "activeDelivery": active_order,
        "completedDeliveries": [format_order(o) for o in orders if o.get("status") == "DELIVERED"][:10],
        "todayDeliveryCount": len([o for o in today_orders if o.get("status") == "DELIVERED"]),
        "todayEarnings": 0,
    }), 200


@order_routes.route("/delivery/availability", methods=["PATCH"])
def update_partner_availability():
    payload, err = require_role(request, "delivery_partner")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    is_online = bool(data.get("isOnline"))
    partner = delivery_partners_collection.find_one({"_id": ObjectId(payload.get("id"))})
    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404

    active_order = orders_collection.find_one({
        "delivery_assignment.partner_id": payload.get("id"),
        "status": {"$in": ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]},
    })
    if not is_online and active_order:
        return jsonify({"error": "Cannot go offline with an active delivery"}), 400

    availability_status = "Online" if is_online else "Offline"
    delivery_partners_collection.update_one(
        {"_id": ObjectId(payload.get("id"))},
        {"$set": {"is_online": is_online, "availability_status": availability_status, "updatedAt": datetime.utcnow().isoformat()}}
    )
    updated = delivery_partners_collection.find_one({"_id": ObjectId(payload.get("id"))})
    return jsonify({"partner": {
        "id": str(updated["_id"]),
        "isOnline": updated.get("is_online", False),
        "availabilityStatus": updated.get("availability_status", "Offline"),
    }}), 200


@order_routes.route("/delivery/status/<order_id>", methods=["PATCH"])
def update_delivery_status(order_id):
    payload, err = require_role(request, "delivery_partner")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    new_status = data.get("status", "").strip()
    notes = data.get("notes", "").strip()
    cash_collected = data.get("cashCollected")

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404

    current_status = order.get("status", "ORDER_PLACED")
    current_partner_id = order.get("delivery_assignment", {}).get("partner_id")

    if new_status == "ASSIGNED":
        partner = delivery_partners_collection.find_one({"_id": ObjectId(payload.get("id"))})
        if not partner or not partner.get("is_online"):
            return jsonify({"error": "You must be online to accept deliveries"}), 400
        if current_status != "READY":
            return jsonify({"error": "Only READY orders can be accepted"}), 400
        if current_partner_id and current_partner_id != payload.get("id"):
            return jsonify({"error": "Order already assigned"}), 403
    else:
        if current_partner_id != payload.get("id"):
            return jsonify({"error": "You can only modify your own delivery"}), 403
        if not is_valid_transition(current_status, new_status):
            return jsonify({"error": f"Invalid status transition: '{current_status}' → '{new_status}'"}), 400

    now = datetime.utcnow().isoformat()
    delivery_assignment = order.get("delivery_assignment", {})
    update_doc = {
        "status": new_status,
        "updatedAt": now,
        "delivery_assignment.delivery_notes": notes or delivery_assignment.get("delivery_notes", ""),
    }

    if new_status == "ASSIGNED":
        update_doc.update({
            "delivery_assignment.partner_id": payload.get("id"),
            "delivery_assignment.partner_name": payload.get("name", ""),
            "delivery_assignment.partner_phone": payload.get("phone", ""),
            "delivery_assignment.assigned_at": now,
            "delivery_assignment.delivery_status": "ASSIGNED",
        })
        delivery_partners_collection.update_one(
            {"_id": ObjectId(payload.get("id"))},
            {"$set": {"active_order_id": order_id, "availability_status": "Has Active Delivery", "updatedAt": now}}
        )
    elif new_status == "PICKED_UP":
        update_doc.update({
            "delivery_assignment.picked_up_at": now,
            "delivery_assignment.delivery_status": "PICKED_UP",
        })
    elif new_status == "OUT_FOR_DELIVERY":
        update_doc.update({
            "delivery_assignment.out_for_delivery_at": now,
            "delivery_assignment.delivery_status": "OUT_FOR_DELIVERY",
            "tracking.started_at": now,
        })
    elif new_status == "DELIVERED":
        expected_otp = str(order.get("otp") or "").strip()
        provided_otp = str(data.get("otp") or data.get("deliveryOtp") or "").strip()
        if expected_otp and provided_otp != expected_otp:
            return jsonify({"error": "Invalid Delivery OTP. Please verify the 4-digit code with the customer."}), 400

        update_doc.update({
            "delivery_assignment.delivered_at": now,
            "delivery_assignment.delivery_status": "DELIVERED",
            "tracking.rider_progress": 1.0,
            "tracking.eta_minutes": 0,
            "tracking.distance_km": 0.0,
        })
        if order.get("payment_method") == "COD":
            expected_amount = order.get("cod", {}).get("amount_expected", order.get("total", 0))
            collected_amount = expected_amount if cash_collected is None else float(cash_collected)
            update_doc.update({
                "payment_status": "Paid",
                "cod.amount_collected": collected_amount,
                "cod.collection_timestamp": now,
                "cod.collection_status": "COLLECTED" if collected_amount >= expected_amount else "FAILED",
            })
        delivery_partners_collection.update_one(
            {"_id": ObjectId(payload.get("id"))},
            {"$set": {"active_order_id": None, "availability_status": "Waiting for Assignment", "updatedAt": now}}
        )

    orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": update_doc})
    updated = orders_collection.find_one({"_id": ObjectId(order_id)})

    # ✅ Emit real-time Socket.IO event
    try:
        from flask import current_app
        emit_fn = getattr(current_app, "emit_order_update", None)
        if emit_fn:
            kitchen_id = updated.get("kitchen_id", "")
            emit_fn(order_id, new_status, kitchen_id)
    except Exception:
        pass

    # Send SMS/Email notification
    try:
        order_user = updated.get("user", {})
        notify_order_status(
            order_user.get("mobile", ""),
            order_user.get("name", "Customer"),
            order_id,
            new_status
        )
    except Exception:
        pass

    return jsonify({"message": "Delivery status updated", "order": format_order(updated)}), 200


# ─────────────────────────────────────────
# 🗺️ GET ORDER TRACKING
# GET /api/orders/<order_id>/tracking
# Called from TrackOrder.jsx
# ─────────────────────────────────────────
@order_routes.route("/<order_id>/tracking", methods=["GET"])
def get_order_tracking(order_id):
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Security check: User can only track their own order,
    # Kitchen admin can only track their kitchen's orders,
    # Delivery partner can track their assigned order,
    # Master admin can track all.
    role = payload.get("role")
    if role == "master_admin":
        pass
    elif role == "kitchen_admin":
        if order.get("kitchen_id") != payload.get("kitchenId"):
            return jsonify({"error": "Unauthorized access to order tracking"}), 403
    elif role == "delivery_partner":
        assigned_id = order.get("delivery_assignment", {}).get("partner_id")
        if assigned_id and assigned_id != payload.get("id"):
            return jsonify({"error": "Unauthorized access to order tracking"}), 403
    elif role == "user":
        user_mobile = str(order.get("user", {}).get("mobile") or "").strip()
        user_id = str(order.get("user", {}).get("id") or "").strip()
        token_mobile = str(payload.get("mobile") or "").strip()
        token_id = str(payload.get("id") or "").strip()
        is_owner = (user_mobile and token_mobile and user_mobile == token_mobile) or (user_id and token_id and user_id == token_id)
        if not is_owner:
            return jsonify({"error": "Unauthorized access to order tracking"}), 403
    else:
        return jsonify({"error": "Unauthorized access"}), 403

    # Tracking data setup / migration for older orders
    tracking = order.get("tracking") or {}
    kitchen_id = order.get("kitchen_id", "k1")
    from models.order_model import KITCHEN_COORDINATES, DEFAULT_KITCHEN_COORDS, get_customer_coords, calculate_distance
    from database.db import kitchens_collection

    kitchen_doc = kitchens_collection.find_one({"kitchen_id": kitchen_id}) or {}
    kitchen_name = kitchen_doc.get("kitchen_name") or kitchen_doc.get("name") or "Midnight Monk Kitchen"

    kitchen_coords = KITCHEN_COORDINATES.get(kitchen_id, DEFAULT_KITCHEN_COORDS)
    kitchen_lat = tracking.get("kitchen_lat", kitchen_coords["lat"])
    kitchen_lng = tracking.get("kitchen_lng", kitchen_coords["lng"])

    if "customer_lat" not in tracking or "customer_lng" not in tracking:
        cust_coords = get_customer_coords(order.get("address", ""), {"lat": kitchen_lat, "lng": kitchen_lng})
        customer_lat = cust_coords["lat"]
        customer_lng = cust_coords["lng"]
    else:
        customer_lat = tracking["customer_lat"]
        customer_lng = tracking["customer_lng"]

    total_dist = round(max(1.0, calculate_distance(kitchen_lat, kitchen_lng, customer_lat, customer_lng)), 1)
    status = order.get("status", "ORDER_PLACED")

    # Delivery partner GPS tracking logic
    now_dt = datetime.utcnow()

    if status == "DELIVERED":
        progress = 1.0
        rider_lat = customer_lat
        rider_lng = customer_lng
        eta_minutes = 0
        distance_km = 0.0
    elif status == "OUT_FOR_DELIVERY":
        # Check if real GPS location has been pushed
        if tracking.get("is_real_gps") and tracking.get("rider_lat") is not None:
            rider_lat = tracking.get("rider_lat")
            rider_lng = tracking.get("rider_lng")
            distance_km = tracking.get("distance_km")
            if distance_km is None:
                distance_km = round(max(0.05, calculate_distance(rider_lat, rider_lng, customer_lat, customer_lng)), 2)
            eta_minutes = tracking.get("eta_minutes")
            if eta_minutes is None:
                eta_minutes = max(1, round(distance_km * 2.5 + 2))
            progress = min(0.98, max(0.05, 1.0 - (distance_km / total_dist))) if total_dist > 0 else 0.5
        elif tracking.get("rider_lat") is not None and tracking.get("rider_lng") is not None:
            # Fallback to last known position
            rider_lat = tracking["rider_lat"]
            rider_lng = tracking["rider_lng"]
            distance_km = round(max(0.05, calculate_distance(rider_lat, rider_lng, customer_lat, customer_lng)), 2)
            eta_minutes = max(1, round(distance_km * 2.5 + 2))
            progress = min(0.98, max(0.05, 1.0 - (distance_km / total_dist))) if total_dist > 0 else 0.5
        else:
            # Waiting for rider's first GPS ping; rider is at kitchen
            rider_lat = kitchen_lat
            rider_lng = kitchen_lng
            distance_km = total_dist
            eta_minutes = order.get("eta_minutes", 15)
            progress = 0.0
    else:
        # Preparing / Ready / Assigned / Picked Up: Rider is at or waiting at Kitchen
        progress = 0.0
        rider_lat = tracking.get("rider_lat", kitchen_lat)
        rider_lng = tracking.get("rider_lng", kitchen_lng)
        eta_minutes = order.get("eta_minutes", 20)
        distance_km = total_dist

    delivery_partner = order.get("delivery_assignment", {})
    rider_name = delivery_partner.get("partner_name") or "Delivery Partner"
    rider_phone = delivery_partner.get("partner_phone") or "9876543210"

    response_payload = {
        "order_id": str(order["_id"]),
        "status": status,
        "is_real_gps": bool(tracking.get("is_real_gps")),
        "last_gps_update": tracking.get("last_updated"),
        "rider": {
            "lat": rider_lat,
            "lng": rider_lng,
            "accuracy": tracking.get("accuracy"),
            "speed": tracking.get("speed"),
            "heading": tracking.get("heading"),
            "name": rider_name,
            "phone": rider_phone,
        },
        "customer": {
            "lat": customer_lat,
            "lng": customer_lng,
            "name": order.get("user", {}).get("name", "Customer"),
            "address": order.get("address", ""),
        },
        "kitchen": {
            "lat": kitchen_lat,
            "lng": kitchen_lng,
            "name": kitchen_name,
            "kitchen_id": kitchen_id,
        },
        "eta_minutes": eta_minutes,
        "distance_km": distance_km,
        "progress": round(progress, 3),
        "delivery_assignment": delivery_partner,
        "items": order.get("items", []),
        "total": order.get("total", 0),
        "otp": order.get("otp"),
        "created_at": order.get("createdAt"),
        "updated_at": order.get("updatedAt"),
        "kitchen_name": kitchen_name,
        "customer_address": order.get("address", ""),
        "tracking": {
            "kitchen_lat": kitchen_lat,
            "kitchen_lng": kitchen_lng,
            "customer_lat": customer_lat,
            "customer_lng": customer_lng,
            "rider_lat": rider_lat,
            "rider_lng": rider_lng,
            "is_real_gps": bool(tracking.get("is_real_gps")),
            "last_updated": tracking.get("last_updated"),
            "accuracy": tracking.get("accuracy"),
        },
    }

    return jsonify(response_payload), 200


# ─────────────────────────────────────────
# 📍 UPDATE DELIVERY PARTNER GPS LOCATION (Delivery Partner)
# POST /api/orders/delivery/location
# Called from DeliveryPartnerDashboard.jsx
# ─────────────────────────────────────────
@order_routes.route("/delivery/location", methods=["POST"])
def update_delivery_location():
    payload, err = require_role(request, "delivery_partner")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    order_id = data.get("orderId") or data.get("order_id")
    lat = data.get("lat")
    lng = data.get("lng")
    accuracy = data.get("accuracy")
    speed = data.get("speed")
    heading = data.get("heading")

    if not order_id:
        return jsonify({"error": "orderId is required"}), 400

    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid latitude or longitude format"}), 400

    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
        return jsonify({"error": "Latitude must be between -90 and 90, and longitude between -180 and 180"}), 400

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        order = None

    if not order:
        return jsonify({"error": "Order not found"}), 404

    assigned_id = order.get("delivery_assignment", {}).get("partner_id")
    if str(assigned_id) != str(payload.get("id")):
        return jsonify({"error": "You are not assigned to deliver this order"}), 403

    status = order.get("status")
    if status not in ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]:
        return jsonify({"error": f"Cannot update GPS location for order with status '{status}'"}), 400

    from models.order_model import calculate_distance, KITCHEN_COORDINATES, DEFAULT_KITCHEN_COORDS, get_customer_coords
    tracking = order.get("tracking") or {}
    kitchen_id = order.get("kitchen_id", "k1")
    kitchen_coords = KITCHEN_COORDINATES.get(kitchen_id, DEFAULT_KITCHEN_COORDS)
    kitchen_lat = tracking.get("kitchen_lat", kitchen_coords["lat"])
    kitchen_lng = tracking.get("kitchen_lng", kitchen_coords["lng"])

    if "customer_lat" not in tracking or "customer_lng" not in tracking:
        cust_coords = get_customer_coords(order.get("address", ""), {"lat": kitchen_lat, "lng": kitchen_lng})
        customer_lat = cust_coords["lat"]
        customer_lng = cust_coords["lng"]
    else:
        customer_lat = tracking["customer_lat"]
        customer_lng = tracking["customer_lng"]

    remaining_distance = round(max(0.05, calculate_distance(lat, lng, customer_lat, customer_lng)), 2)
    eta_minutes = max(1, round(remaining_distance * 2.5 + 2))
    now_iso = datetime.utcnow().isoformat()

    orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "tracking.rider_lat": lat,
            "tracking.rider_lng": lng,
            "tracking.accuracy": accuracy,
            "tracking.speed": speed,
            "tracking.heading": heading,
            "tracking.distance_km": remaining_distance,
            "tracking.eta_minutes": eta_minutes,
            "tracking.is_real_gps": True,
            "tracking.last_updated": now_iso,
        }}
    )

    delivery_partners_collection.update_one(
        {"_id": ObjectId(payload.get("id"))},
        {"$set": {
            "current_lat": lat,
            "current_lng": lng,
            "last_active": now_iso,
        }}
    )

    # Real-time broadcast
    broadcast_data = {
        "orderId": order_id,
        "is_real_gps": True,
        "status": status,
        "rider": {
            "lat": lat,
            "lng": lng,
            "accuracy": accuracy,
            "speed": speed,
            "heading": heading,
            "name": order.get("delivery_assignment", {}).get("partner_name", "Delivery Partner"),
            "phone": order.get("delivery_assignment", {}).get("partner_phone", ""),
        },
        "distance_km": remaining_distance,
        "eta_minutes": eta_minutes,
        "last_updated": now_iso,
    }

    try:
        from flask import current_app
        emit_loc_fn = getattr(current_app, "emit_rider_location", None)
        if emit_loc_fn:
            emit_loc_fn(order_id, broadcast_data)
        else:
            from app import socketio
            socketio.emit("rider_location_update", broadcast_data, room=f"order_{order_id}")
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": "GPS location updated successfully",
        "location": {
            "lat": lat,
            "lng": lng,
            "accuracy": accuracy,
            "distance_km": remaining_distance,
            "eta_minutes": eta_minutes,
            "last_updated": now_iso,
        }
    }), 200


# ─────────────────────────────────────────
# 📊 GET ORDER STATS (Master Admin)
# GET /api/orders/stats
# Called from MasterAnalytics.jsx
# ─────────────────────────────────────────
@order_routes.route("/stats", methods=["GET"])
def get_stats():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    all_orders = list(orders_collection.find())

    total_orders    = len(all_orders)
    total_revenue   = sum(o.get("total", 0) for o in all_orders)
    delivered       = len([o for o in all_orders if o.get("status") == "DELIVERED"])
    pending         = len([o for o in all_orders if o.get("status") != "DELIVERED"])
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

    # Revenue by kitchen
    kitchen_revenue = {}
    for o in all_orders:
        kid = o.get("kitchen_id", "unknown")
        kitchen_revenue[kid] = kitchen_revenue.get(kid, 0) + o.get("total", 0)

    # Top dishes
    dish_counts = {}
    for o in all_orders:
        for item in o.get("items", []):
            name = item.get("name", "Unknown")
            dish_counts[name] = dish_counts.get(name, 0) + item.get("quantity", 1)

    top_dishes = sorted(dish_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        "totalOrders":    total_orders,
        "totalRevenue":   total_revenue,
        "delivered":      delivered,
        "pending":        pending,
        "avgOrderValue":  avg_order_value,
        "kitchenRevenue": kitchen_revenue,
        "topDishes":      [{"name": d[0], "count": d[1]} for d in top_dishes],
    }), 200


# ─────────────────────────────────────────
# 🗑️ DELETE ORDER (Master Admin only)
# DELETE /api/orders/<order_id>
# ─────────────────────────────────────────
@order_routes.route("/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        result = orders_collection.delete_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"message": "Order deleted successfully"}), 200
