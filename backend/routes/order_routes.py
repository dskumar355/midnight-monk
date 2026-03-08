from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import orders_collection
from models.order_model import create_order, format_order, validate_order, get_next_status
from utils.helpers import require_auth, require_role
from datetime import datetime

order_routes = Blueprint("order_routes", __name__)

# ─────────────────────────────────────────
# ➕ PLACE ORDER (User)
# POST /api/orders/create
# Called from Checkout.jsx handlePayment()
# ─────────────────────────────────────────
@order_routes.route("/create", methods=["POST"])
def create():
    data       = request.json or {}
    user       = data.get("user", {})
    kitchen_id = data.get("kitchenId", "").strip()
    items      = data.get("items", [])
    total      = data.get("total")
    address    = data.get("address", "").strip()

    # Validate
    is_valid, error = validate_order(user, kitchen_id, items, total, address)
    if not is_valid:
        return jsonify({"error": error}), 400

    order  = create_order(user, kitchen_id, items, total, address)
    result = orders_collection.insert_one(order)
    created = orders_collection.find_one({"_id": result.inserted_id})

    return jsonify({
        "message": "Order placed successfully",
        "order":   format_order(created)
    }), 201


# ─────────────────────────────────────────
# 📦 GET USER ORDERS
# GET /api/orders/user/<mobile>
# Called from Orders.jsx
# ─────────────────────────────────────────
@order_routes.route("/user/<mobile>", methods=["GET"])
def get_user_orders(mobile):
    orders = list(orders_collection.find({"user.mobile": mobile}).sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 🍳 GET KITCHEN ORDERS (Kitchen Admin)
# GET /api/orders/kitchen/<kitchen_id>
# Called from AdminOrders.jsx
# ─────────────────────────────────────────
@order_routes.route("/kitchen/<kitchen_id>", methods=["GET"])
def get_kitchen_orders(kitchen_id):
    orders = list(orders_collection.find({"kitchen_id": kitchen_id}).sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 👑 GET ALL ORDERS (Master Admin)
# GET /api/orders/all
# Called from MasterOrders.jsx
# ─────────────────────────────────────────
@order_routes.route("/all", methods=["GET"])
def get_all_orders():
    orders = list(orders_collection.find().sort("createdAt", -1))
    return jsonify([format_order(o) for o in orders]), 200


# ─────────────────────────────────────────
# 🔄 UPDATE ORDER STATUS (Kitchen Admin)
# PATCH /api/orders/status/<order_id>
# Called from AdminOrders.jsx updateOrderStatus()
# ─────────────────────────────────────────
@order_routes.route("/status/<order_id>", methods=["PATCH"])
def update_status(order_id):
    data       = request.json or {}
    new_status = data.get("status", "").strip()

    valid_statuses = ["Placed", "Preparing", "Out for Delivery", "Delivered"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Validate status transition
    current_status = order.get("status", "Placed")
    expected_next  = get_next_status(current_status)
    if new_status != expected_next:
        return jsonify({
            "error": f"Invalid status transition: '{current_status}' → '{new_status}'. Expected next: '{expected_next}'"
        }), 400

    orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status, "updatedAt": datetime.utcnow().isoformat()}}
    )

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})
    return jsonify({
        "message": f"Order status updated to '{new_status}'",
        "order":   format_order(updated)
    }), 200


# ─────────────────────────────────────────
# 📊 GET ORDER STATS (Master Admin)
# GET /api/orders/stats
# Called from MasterAnalytics.jsx
# ─────────────────────────────────────────
@order_routes.route("/stats", methods=["GET"])
def get_stats():
    all_orders = list(orders_collection.find())

    total_orders    = len(all_orders)
    total_revenue   = sum(o.get("total", 0) for o in all_orders)
    delivered       = len([o for o in all_orders if o.get("status") == "Delivered"])
    pending         = len([o for o in all_orders if o.get("status") != "Delivered"])
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