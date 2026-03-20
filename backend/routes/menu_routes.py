from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import menu_collection
from models.menu_model import create_menu_item, format_menu_item, validate_menu_item
from utils.helpers import require_role
from datetime import datetime

menu_routes = Blueprint("menu_routes", __name__)

# ─────────────────────────────────────────
# 🍽️ GET MENU BY KITCHEN ID
# GET /api/menu/<kitchen_id>
# Used by Menu.jsx to load food items
# ─────────────────────────────────────────
@menu_routes.route("/<kitchen_id>", methods=["GET"])
def get_menu(kitchen_id):
    category = request.args.get("category")  # optional filter ?category=Veg

    query = {"kitchen_id": kitchen_id, "available": True}
    if category and category.lower() != "all":
        query["category"] = category

    items = list(menu_collection.find(query))
    return jsonify([format_menu_item(i) for i in items]), 200


# ─────────────────────────────────────────
# ➕ ADD MENU ITEM (Kitchen Admin only)
# POST /api/menu/add
# Used by AdminMenu.jsx
# ─────────────────────────────────────────
@menu_routes.route("/add", methods=["POST"])
def add_item():
    payload, err = require_role(request, "kitchen_admin")
    if err:
        return jsonify(err[0]), err[1]

    data       = request.json or {}
    name       = data.get("name", "").strip()
    price      = data.get("price")
    kitchen_id = data.get("kitchen_id", payload.get("kitchenId", "")).strip()
    category   = data.get("category", "Main Course")
    description= data.get("description", "")
    calories   = data.get("calories")
    protein    = data.get("protein")
    discount   = data.get("discount", 0)
    image      = data.get("image_url") or data.get("image")

    # Validate
    is_valid, error = validate_menu_item(name, price, kitchen_id, category)
    if not is_valid:
        return jsonify({"error": error}), 400

    item   = create_menu_item(name, price, kitchen_id, category, description, calories, protein, discount, image)
    result = menu_collection.insert_one(item)
    created = menu_collection.find_one({"_id": result.inserted_id})

    return jsonify({
        "message": "Menu item added successfully",
        "item":    format_menu_item(created)
    }), 201


# ─────────────────────────────────────────
# ✏️ UPDATE MENU ITEM (Kitchen Admin only)
# PUT /api/menu/<item_id>
# ─────────────────────────────────────────
@menu_routes.route("/<item_id>", methods=["PUT"])
def update_item(item_id):
    payload, err = require_role(request, "kitchen_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    update_fields = {}

    if "name" in data:        update_fields["food_name"]   = data["name"].strip()
    if "price" in data:       update_fields["price"]       = float(data["price"])
    if "category" in data:    update_fields["category"]    = data["category"]
    if "description" in data: update_fields["description"] = data["description"]
    if "calories" in data:    update_fields["calories"]    = data["calories"]
    if "protein" in data:     update_fields["protein"]     = data["protein"]
    if "discount" in data:    update_fields["discount"]    = float(data["discount"])
    if "available" in data:   update_fields["available"]   = bool(data["available"])
    if "image" in data:       update_fields["image"]       = data["image"]
    if "image_url" in data:   update_fields["image"]       = data["image_url"]

    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    try:
        result = menu_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_fields}
        )
    except Exception:
        return jsonify({"error": "Invalid item ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Menu item not found"}), 404

    updated = menu_collection.find_one({"_id": ObjectId(item_id)})
    return jsonify({
        "message": "Menu item updated successfully",
        "item":    format_menu_item(updated)
    }), 200


# ─────────────────────────────────────────
# 🗑️ DELETE MENU ITEM (Kitchen Admin only)
# DELETE /api/menu/<item_id>
# ─────────────────────────────────────────
@menu_routes.route("/delete/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    payload, err = require_role(request, "kitchen_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        result = menu_collection.delete_one({"_id": ObjectId(item_id)})
    except Exception:
        return jsonify({"error": "Invalid item ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Menu item not found"}), 404

    return jsonify({"message": "Menu item deleted successfully"}), 200


# ─────────────────────────────────────────
# 🔄 TOGGLE AVAILABILITY (Kitchen Admin only)
# PATCH /api/menu/toggle/<item_id>
# ─────────────────────────────────────────
@menu_routes.route("/toggle/<item_id>", methods=["PATCH"])
def toggle_availability(item_id):
    payload, err = require_role(request, "kitchen_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        item = menu_collection.find_one({"_id": ObjectId(item_id)})
    except Exception:
        return jsonify({"error": "Invalid item ID"}), 400

    if not item:
        return jsonify({"error": "Menu item not found"}), 404

    new_status = not item.get("available", True)
    menu_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"available": new_status, "updatedAt": datetime.utcnow().isoformat()}}
    )

    return jsonify({
        "message":   f"Item {'enabled' if new_status else 'disabled'} successfully",
        "available": new_status
    }), 200


# ─────────────────────────────────────────
# 🌱 SEED DEFAULT MENU (run once)
# POST /api/menu/seed
# ─────────────────────────────────────────
@menu_routes.route("/seed", methods=["POST"])
def seed_menu():
    default_items = [
        # k1 — Night Bites (Indian)
        {"name": "Butter Chicken",       "price": 199, "kitchen_id": "k1", "category": "Non Veg",   "description": "Creamy tomato-based chicken curry", "calories": 450, "protein": 32, "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop"},
        {"name": "Paneer Butter Masala", "price": 179, "kitchen_id": "k1", "category": "Veg",       "description": "Rich paneer in buttery tomato gravy", "calories": 380, "protein": 18, "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop"},
        {"name": "Veg Thali",            "price": 249, "kitchen_id": "k1", "category": "Veg",       "description": "Authentic full vegetarian platter with rice, roti & mixed curries", "calories": 650, "protein": 22, "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop"},
        {"name": "Chicken Biryani",      "price": 229, "kitchen_id": "k1", "category": "Non Veg",   "description": "Aromatic basmati rice with chicken",  "calories": 520, "protein": 38, "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop"},
        {"name": "Masala Chai",          "price":  49, "kitchen_id": "k1", "category": "Drinks",    "description": "Spiced Indian tea",                   "calories":  80, "protein":  2, "image": "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?q=80&w=800&auto=format&fit=crop"},

        # k2 — Midnight Meals (Fast Food)
        {"name": "Classic Burger",       "price": 149, "kitchen_id": "k2", "category": "Fast Food", "description": "Juicy beef patty with fresh veggies",  "calories": 480, "protein": 28, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"},
        {"name": "Margherita Pizza",     "price": 199, "kitchen_id": "k2", "category": "Veg",       "description": "Classic tomato and mozzarella pizza",  "calories": 420, "protein": 16, "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop"},
        {"name": "Chicken Wings",        "price": 179, "kitchen_id": "k2", "category": "Non Veg",   "description": "Crispy spiced chicken wings",           "calories": 390, "protein": 34, "image": "https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?q=80&w=800&auto=format&fit=crop"},
        {"name": "French Fries",         "price":  89, "kitchen_id": "k2", "category": "Fast Food", "description": "Golden crispy fries with dip",          "calories": 320, "protein":  4, "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=800&auto=format&fit=crop"},
        {"name": "Cold Coffee",          "price":  99, "kitchen_id": "k2", "category": "Drinks",    "description": "Chilled coffee with cream",             "calories": 180, "protein":  4, "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop"},
    ]

    seeded = []
    for item_data in default_items:
        existing = menu_collection.find_one({
            "food_name":  item_data["name"],
            "kitchen_id": item_data["kitchen_id"]
        })
        if not existing:
            item = create_menu_item(
                item_data["name"], item_data["price"], item_data["kitchen_id"],
                item_data["category"], item_data["description"],
                item_data.get("calories"), item_data.get("protein"),
                0, item_data.get("image")
            )
            menu_collection.insert_one(item)
            seeded.append(item_data["name"])

    return jsonify({
        "message": "Menu seeded successfully",
        "seeded":  seeded,
        "total":   len(seeded)
    }), 201