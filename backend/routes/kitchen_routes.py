from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import kitchens_collection, admins_collection
from models.kitchen_model import create_kitchen, create_kitchen_admin, format_kitchen, format_admin, validate_kitchen
from utils.helpers import require_role, hash_password
from datetime import datetime

kitchen_routes = Blueprint("kitchen_routes", __name__)

# ─────────────────────────────────────────
# 🍽️ GET ALL KITCHENS
# GET /api/kitchens/all
# Used by Kitchens.jsx to load kitchen cards
# ─────────────────────────────────────────
@kitchen_routes.route("/all", methods=["GET"])
def get_kitchens():
    kitchens = list(kitchens_collection.find({"is_open": True}))
    return jsonify([format_kitchen(k) for k in kitchens]), 200


# ─────────────────────────────────────────
# 🍽️ GET SINGLE KITCHEN BY kitchen_id
# GET /api/kitchens/<kitchen_id>
# e.g. /api/kitchens/k1
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>", methods=["GET"])
def get_kitchen(kitchen_id):
    kitchen = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    if not kitchen:
        return jsonify({"error": "Kitchen not found"}), 404
    return jsonify(format_kitchen(kitchen)), 200


# ─────────────────────────────────────────
# ➕ CREATE KITCHEN (Master Admin only)
# POST /api/kitchens/create
# ─────────────────────────────────────────
@kitchen_routes.route("/create", methods=["POST"])
def create():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    name       = data.get("name", "").strip()
    kitchen_id = data.get("kitchen_id", "").strip()
    owner      = data.get("owner", "")
    location   = data.get("location", "")
    tag        = data.get("tag", "*open now, fast prep")
    rating     = data.get("rating", 4.5)

    # Validate
    is_valid, error = validate_kitchen(name, kitchen_id)
    if not is_valid:
        return jsonify({"error": error}), 400

    # Check duplicate kitchen_id
    existing = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    if existing:
        return jsonify({"error": f"Kitchen with ID '{kitchen_id}' already exists"}), 409

    kitchen = create_kitchen(name, kitchen_id, owner, location, tag, rating)
    result  = kitchens_collection.insert_one(kitchen)
    created = kitchens_collection.find_one({"_id": result.inserted_id})

    return jsonify({
        "message": "Kitchen created successfully",
        "kitchen": format_kitchen(created)
    }), 201


# ─────────────────────────────────────────
# ✏️ UPDATE KITCHEN (Master Admin only)
# PUT /api/kitchens/<kitchen_id>
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>", methods=["PUT"])
def update_kitchen(kitchen_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    update_fields = {}

    if "name" in data:       update_fields["kitchen_name"] = data["name"].strip()
    if "owner" in data:      update_fields["owner_name"]   = data["owner"].strip()
    if "location" in data:   update_fields["location"]     = data["location"].strip()
    if "tag" in data:        update_fields["tag"]          = data["tag"].strip()
    if "rating" in data:     update_fields["rating"]       = float(data["rating"])
    if "is_open" in data:    update_fields["is_open"]      = bool(data["is_open"])

    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    result = kitchens_collection.update_one(
        {"kitchen_id": kitchen_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Kitchen not found"}), 404

    updated = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    return jsonify({
        "message": "Kitchen updated successfully",
        "kitchen": format_kitchen(updated)
    }), 200


# ─────────────────────────────────────────
# 🔄 TOGGLE KITCHEN STATUS (Kitchen Admin only)
# PATCH /api/kitchens/<kitchen_id>/toggle
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>/toggle", methods=["PATCH"])
def toggle_open(kitchen_id):
    payload, err = require_role(request, ["kitchen_admin", "master_admin"])
    if err:
        return jsonify(err[0]), err[1]

    if payload.get("role") == "kitchen_admin" and payload.get("kitchenId") != kitchen_id:
        return jsonify({"error": "Unauthorized"}), 403

    kitchen = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    if not kitchen:
        return jsonify({"error": "Kitchen not found"}), 404

    new_status = not kitchen.get("is_open", True)
    kitchens_collection.update_one(
        {"kitchen_id": kitchen_id},
        {"$set": {"is_open": new_status, "updatedAt": datetime.utcnow().isoformat()}}
    )
    return jsonify({"message": "Status updated", "isOpen": new_status}), 200



# ─────────────────────────────────────────
# 🗑️ DELETE KITCHEN (Master Admin only)
# DELETE /api/kitchens/<kitchen_id>
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>", methods=["DELETE"])
def delete_kitchen(kitchen_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    result = kitchens_collection.delete_one({"kitchen_id": kitchen_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Kitchen not found"}), 404

    return jsonify({"message": f"Kitchen '{kitchen_id}' deleted successfully"}), 200


# ─────────────────────────────────────────
# 🌱 SEED KITCHENS (run once)
# POST /api/kitchens/seed
# ─────────────────────────────────────────
@kitchen_routes.route("/seed", methods=["POST"])
def seed_kitchens():
    kitchens = [
        create_kitchen("Night Bites",    "k1", tag="*open now, fast prep", rating=4.8),
        create_kitchen("Midnight Meals", "k2", tag="*open now, fast prep", rating=4.0),
    ]
    seeded = []
    for k in kitchens:
        existing = kitchens_collection.find_one({"kitchen_id": k["kitchen_id"]})
        if not existing:
            kitchens_collection.insert_one(k)
            seeded.append(k["kitchen_id"])

    return jsonify({
        "message": "Kitchens seeded",
        "seeded":  seeded,
        "skipped": [k["kitchen_id"] for k in kitchens if k["kitchen_id"] not in seeded]
    }), 201