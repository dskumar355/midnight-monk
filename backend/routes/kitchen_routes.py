from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import kitchens_collection, admins_collection
from models.kitchen_model import create_kitchen, create_kitchen_admin, format_kitchen, format_admin, validate_kitchen
from utils.helpers import require_role, hash_password
from datetime import datetime

kitchen_routes = Blueprint("kitchen_routes", __name__)

# ─────────────────────────────────────────
# 🍽️ GET ALL KITCHENS (only open)
# GET /api/kitchens/all
# ─────────────────────────────────────────
@kitchen_routes.route("/all", methods=["GET"])
def get_kitchens():
    kitchens = list(kitchens_collection.find({"is_open": True}))
    return jsonify([format_kitchen(k) for k in kitchens]), 200


# ─────────────────────────────────────────
# 🍽️ GET ALL KITCHENS (open + closed)
# GET /api/kitchens/all-public
# Used by Kitchens.jsx to show open/closed badges
# ─────────────────────────────────────────
@kitchen_routes.route("", methods=["GET"])
@kitchen_routes.route("/", methods=["GET"])
@kitchen_routes.route("/all-public", methods=["GET"])
def get_all_kitchens_public():
    kitchens = list(kitchens_collection.find({}))
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
# ⚙️ UPDATE KITCHEN SCHEDULE SETTINGS (Kitchen Admin & Master Admin)
# PATCH /api/kitchens/<kitchen_id>/settings
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>/settings", methods=["PATCH"])
def update_settings(kitchen_id):
    payload, err = require_role(request, ["kitchen_admin", "master_admin"])
    if err:
        return jsonify(err[0]), err[1]

    if payload.get("role") == "kitchen_admin" and payload.get("kitchenId") != kitchen_id:
        return jsonify({"error": "Unauthorized"}), 403

    kitchen = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    if not kitchen:
        return jsonify({"error": "Kitchen not found"}), 404

    data = request.json or {}
    update_fields = {}

    if "opening_time" in data or "openingTime" in data:
        update_fields["opening_time"] = (data.get("opening_time") or data.get("openingTime")).strip()
    if "closing_time" in data or "closingTime" in data:
        update_fields["closing_time"] = (data.get("closing_time") or data.get("closingTime")).strip()
    if "preorder_enabled" in data or "preorderEnabled" in data:
        val = data.get("preorder_enabled") if "preorder_enabled" in data else data.get("preorderEnabled")
        update_fields["preorder_enabled"] = bool(val)
    if "is_temporarily_closed" in data or "isTemporarilyClosed" in data:
        val = data.get("is_temporarily_closed") if "is_temporarily_closed" in data else data.get("isTemporarilyClosed")
        update_fields["is_temporarily_closed"] = bool(val)
    if "prep_lead_time_minutes" in data or "prepLeadTimeMinutes" in data:
        val = data.get("prep_lead_time_minutes") or data.get("prepLeadTimeMinutes")
        update_fields["prep_lead_time_minutes"] = max(5, min(120, int(val)))
    if "holiday_dates" in data or "holidayDates" in data:
        holidays = data.get("holiday_dates") or data.get("holidayDates") or []
        update_fields["holiday_dates"] = [str(h).strip() for h in holidays if str(h).strip()]

    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    kitchens_collection.update_one(
        {"kitchen_id": kitchen_id},
        {"$set": update_fields}
    )

    updated = kitchens_collection.find_one({"kitchen_id": kitchen_id})
    return jsonify({
        "message": "Kitchen schedule settings updated successfully",
        "kitchen": format_kitchen(updated)
    }), 200



# ─────────────────────────────────────────
# 🗑️ DELETE KITCHEN (Master Admin only)
# DELETE /api/kitchens/<kitchen_id>
# ─────────────────────────────────────────
@kitchen_routes.route("/<kitchen_id>", methods=["DELETE"])
def delete_kitchen(kitchen_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    # Try matching kitchen_id first, then ObjectId
    target_id = kitchen_id.strip()
    result = kitchens_collection.delete_one({"kitchen_id": target_id})
    if result.deleted_count == 0 and ObjectId.is_valid(target_id):
        # If deleted by ObjectId, find the kitchen_id for menu cleanup
        k_doc = kitchens_collection.find_one({"_id": ObjectId(target_id)})
        if k_doc:
            target_id = k_doc.get("kitchen_id", target_id)
        result = kitchens_collection.delete_one({"_id": ObjectId(target_id)})

    if result.deleted_count == 0:
        return jsonify({"error": "Kitchen not found"}), 404

    # Cascading cleanup: delete any menu items associated with this kitchen
    from database.db import menu_collection
    menu_collection.delete_many({"kitchen_id": target_id})

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

