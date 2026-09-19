from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from database.db import notifications_collection, notification_tokens_collection
from utils.helpers import require_auth

notification_routes = Blueprint("notification_routes", __name__)


# ─────────────────────────────────────────
# 📲 REGISTER NOTIFICATION DEVICE TOKEN (FCM)
# POST /api/notifications/register-token
# ─────────────────────────────────────────
@notification_routes.route("/register-token", methods=["POST"])
def register_token():
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    token = (data.get("token") or "").strip()
    platform = (data.get("platform") or "web").strip()

    if not token:
        return jsonify({"error": "Device token is required"}), 400

    user_id = str(payload.get("id"))
    role = str(payload.get("role", "user"))

    now_iso = datetime.utcnow().isoformat()

    # Upsert token
    notification_tokens_collection.update_one(
        {"token": token},
        {
            "$set": {
                "user_id": user_id,
                "role": role,
                "platform": platform,
                "active": True,
                "updatedAt": now_iso,
            },
            "$setOnInsert": {
                "createdAt": now_iso,
            }
        },
        upsert=True
    )

    return jsonify({"message": "Device token registered successfully", "active": True}), 200


# ─────────────────────────────────────────
# 🔔 GET NOTIFICATIONS HISTORY
# GET /api/notifications
# ─────────────────────────────────────────
@notification_routes.route("", methods=["GET"])
@notification_routes.route("/", methods=["GET"])
def get_notifications():
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    user_id = str(payload.get("id"))

    # Fetch last 40 notifications for this user
    cursor = notifications_collection.find({"user_id": user_id}).sort("createdAt", -1).limit(40)
    notifications = []
    unread_count = 0

    for doc in cursor:
        is_read = bool(doc.get("read", False))
        if not is_read:
            unread_count += 1
        notifications.append({
            "id": str(doc["_id"]),
            "orderId": doc.get("order_id"),
            "type": doc.get("type", "GENERAL"),
            "title": doc.get("title", ""),
            "body": doc.get("body", ""),
            "read": is_read,
            "readAt": doc.get("read_at"),
            "createdAt": doc.get("createdAt"),
            "data": doc.get("data", {}),
        })

    return jsonify({
        "notifications": notifications,
        "unreadCount": unread_count,
    }), 200


# ─────────────────────────────────────────
# ✅ MARK SINGLE NOTIFICATION AS READ
# PATCH /api/notifications/<id>/read
# ─────────────────────────────────────────
@notification_routes.route("/<notif_id>/read", methods=["PATCH"])
def mark_as_read(notif_id):
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    user_id = str(payload.get("id"))
    now_iso = datetime.utcnow().isoformat()

    try:
        res = notifications_collection.update_one(
            {"_id": ObjectId(notif_id), "user_id": user_id},
            {"$set": {"read": True, "read_at": now_iso}}
        )
        if res.matched_count == 0:
            return jsonify({"error": "Notification not found"}), 404
        return jsonify({"message": "Marked as read"}), 200
    except Exception as e:
        return jsonify({"error": "Invalid notification ID"}), 400


# ─────────────────────────────────────────
# ✅ MARK ALL NOTIFICATIONS AS READ
# PATCH /api/notifications/read-all
# ─────────────────────────────────────────
@notification_routes.route("/read-all", methods=["PATCH"])
def mark_all_read():
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    user_id = str(payload.get("id"))
    now_iso = datetime.utcnow().isoformat()

    notifications_collection.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": now_iso}}
    )

    return jsonify({"message": "All notifications marked as read"}), 200
