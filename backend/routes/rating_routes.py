from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import db, orders_collection, kitchens_collection
from utils.helpers import require_auth
from datetime import datetime

rating_routes = Blueprint("rating_routes", __name__)
ratings_collection = db["ratings"]

# ─────────────────────────────────────────
# ⭐ SUBMIT RATING (User — after delivery)
# POST /api/ratings/submit
# ─────────────────────────────────────────
@rating_routes.route("/submit", methods=["POST"])
def submit_rating():
    payload, err = require_auth(request)
    if err:
        return jsonify(err[0]), err[1]

    data       = request.json or {}
    order_id   = data.get("orderId", "").strip()
    kitchen_id = data.get("kitchenId", "").strip()
    stars      = data.get("stars")
    review     = data.get("review", "").strip()

    if not order_id or not kitchen_id:
        return jsonify({"error": "Order ID and Kitchen ID are required"}), 400
    if stars is None or not (1 <= int(stars) <= 5):
        return jsonify({"error": "Stars must be between 1 and 5"}), 400

    # Check order exists and is Delivered
    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") != "Delivered":
        return jsonify({"error": "Can only rate delivered orders"}), 400

    # Check if already rated
    existing = ratings_collection.find_one({"orderId": order_id})
    if existing:
        return jsonify({"error": "You've already rated this order"}), 409

    # Save rating
    rating_doc = {
        "orderId":   order_id,
        "kitchenId": kitchen_id,
        "userId":    payload.get("id", ""),
        "userName":  payload.get("name", "User"),
        "stars":     int(stars),
        "review":    review,
        "createdAt": datetime.utcnow().isoformat(),
    }
    ratings_collection.insert_one(rating_doc)

    # Update kitchen's average rating
    all_ratings = list(ratings_collection.find({"kitchenId": kitchen_id}))
    avg = round(sum(r["stars"] for r in all_ratings) / len(all_ratings), 1) if all_ratings else 0

    kitchens_collection.update_one(
        {"kitchen_id": kitchen_id},
        {"$set": {
            "rating":       avg,
            "rating_label": f"{avg} rating",
            "reviews":      len(all_ratings),
            "updatedAt":    datetime.utcnow().isoformat(),
        }}
    )

    return jsonify({
        "message": "Rating submitted successfully",
        "avgRating": avg,
        "totalReviews": len(all_ratings),
    }), 201


# ─────────────────────────────────────────
# ⭐ GET RATINGS FOR A KITCHEN
# GET /api/ratings/kitchen/<kitchen_id>
# ─────────────────────────────────────────
@rating_routes.route("/kitchen/<kitchen_id>", methods=["GET"])
def get_kitchen_ratings(kitchen_id):
    ratings = list(
        ratings_collection.find({"kitchenId": kitchen_id})
        .sort("createdAt", -1)
        .limit(20)
    )
    formatted = [{
        "id":        str(r["_id"]),
        "orderId":   r.get("orderId", ""),
        "userName":  r.get("userName", "User"),
        "stars":     r.get("stars", 5),
        "review":    r.get("review", ""),
        "createdAt": r.get("createdAt", ""),
    } for r in ratings]

    return jsonify(formatted), 200


# ─────────────────────────────────────────
# ⭐ CHECK IF ORDER IS RATED
# GET /api/ratings/check/<order_id>
# ─────────────────────────────────────────
@rating_routes.route("/check/<order_id>", methods=["GET"])
def check_rating(order_id):
    existing = ratings_collection.find_one({"orderId": order_id})
    return jsonify({"rated": bool(existing)}), 200
