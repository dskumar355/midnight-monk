from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import db
from datetime import datetime
import random, string
from utils.helpers import require_role

coupon_routes = Blueprint("coupon_routes", __name__)
coupons_collection = db["coupons"]

# POST /api/coupons/create — Master Admin creates a coupon
@coupon_routes.route("/create", methods=["POST"])
def create_coupon():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]
    data = request.json or {}
    code = data.get("code", "").strip().upper()
    if not code:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    discount_type = data.get("discountType", "percent")  # "percent" or "flat"
    discount_value = float(data.get("discountValue", 10))
    min_order = float(data.get("minOrder", 0))
    max_discount = float(data.get("maxDiscount", 100))
    usage_limit = int(data.get("usageLimit", 100))
    expires_at = data.get("expiresAt", "")
    
    # Check duplicate
    if coupons_collection.find_one({"code": code}):
        return jsonify({"error": f"Coupon code '{code}' already exists"}), 409
    
    coupon = {
        "code": code,
        "discountType": discount_type,
        "discountValue": discount_value,
        "minOrder": min_order,
        "maxDiscount": max_discount,
        "usageLimit": usage_limit,
        "usedCount": 0,
        "isActive": True,
        "expiresAt": expires_at,
        "createdAt": datetime.utcnow().isoformat(),
    }
    result = coupons_collection.insert_one(coupon)
    coupon["id"] = str(result.inserted_id)
    coupon.pop("_id", None)
    return jsonify({"message": "Coupon created", "coupon": coupon}), 201


# POST /api/coupons/validate — User validates a coupon code
@coupon_routes.route("/validate", methods=["POST"])
def validate_coupon():
    data = request.json or {}
    code = data.get("code", "").strip().upper()
    order_total = float(data.get("orderTotal", 0))
    
    if not code:
        return jsonify({"error": "Coupon code is required"}), 400
    
    coupon = coupons_collection.find_one({"code": code})
    if not coupon:
        return jsonify({"error": "Invalid coupon code"}), 404
    if not coupon.get("isActive", True):
        return jsonify({"error": "This coupon has been deactivated"}), 400
    if coupon.get("usedCount", 0) >= coupon.get("usageLimit", 100):
        return jsonify({"error": "This coupon has reached its usage limit"}), 400
    if coupon.get("expiresAt") and coupon["expiresAt"] < datetime.utcnow().isoformat():
        return jsonify({"error": "This coupon has expired"}), 400
    if order_total < coupon.get("minOrder", 0):
        return jsonify({"error": f"Minimum order ₹{coupon['minOrder']} required for this coupon"}), 400
    
    # Calculate discount
    if coupon["discountType"] == "percent":
        discount = round(order_total * coupon["discountValue"] / 100, 2)
        discount = min(discount, coupon.get("maxDiscount", 9999))
    else:
        discount = coupon["discountValue"]
    
    return jsonify({
        "valid": True,
        "code": code,
        "discountType": coupon["discountType"],
        "discountValue": coupon["discountValue"],
        "discount": discount,
        "message": f"🎉 Coupon applied! You save ₹{discount:.0f}"
    }), 200


# POST /api/coupons/use — Increment usage after order placed
@coupon_routes.route("/use", methods=["POST"])
def use_coupon():
    data = request.json or {}
    code = data.get("code", "").strip().upper()
    if not code:
        return jsonify({"error": "Code required"}), 400
    result = coupons_collection.update_one(
        {"code": code},
        {"$inc": {"usedCount": 1}}
    )
    return jsonify({"success": result.modified_count > 0}), 200


# GET /api/coupons/all — Master Admin gets all coupons
@coupon_routes.route("/all", methods=["GET"])
def get_all_coupons():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]
    coupons = list(coupons_collection.find().sort("createdAt", -1))
    formatted = []
    for c in coupons:
        c["id"] = str(c.pop("_id"))
        formatted.append(c)
    return jsonify(formatted), 200


# PATCH /api/coupons/<coupon_id>/toggle — Toggle active/inactive
@coupon_routes.route("/<coupon_id>/toggle", methods=["PATCH"])
def toggle_coupon(coupon_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]
    try:
        coupon = coupons_collection.find_one({"_id": ObjectId(coupon_id)})
    except:
        return jsonify({"error": "Invalid coupon ID"}), 400
    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404
    new_status = not coupon.get("isActive", True)
    coupons_collection.update_one(
        {"_id": ObjectId(coupon_id)},
        {"$set": {"isActive": new_status}}
    )
    return jsonify({"isActive": new_status, "message": f"Coupon {'activated' if new_status else 'deactivated'}"}), 200


# DELETE /api/coupons/<coupon_id>
@coupon_routes.route("/<coupon_id>", methods=["DELETE"])
def delete_coupon(coupon_id):
    try:
        result = coupons_collection.delete_one({"_id": ObjectId(coupon_id)})
    except:
        return jsonify({"error": "Invalid ID"}), 400
    if result.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Coupon deleted"}), 200
