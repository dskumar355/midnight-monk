from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import admins_collection, support_collection, orders_collection
from models.kitchen_model import create_kitchen_admin, format_admin
from utils.helpers import require_role, hash_password
from datetime import datetime

admin_routes = Blueprint("admin_routes", __name__)

# ─────────────────────────────────────────
# 👑 CREATE KITCHEN ADMIN (Master Admin)
# POST /api/admin/create
# Called from MasterAdminAdmins.jsx
# ─────────────────────────────────────────
@admin_routes.route("/create", methods=["POST"])
def create_admin():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data         = request.json or {}
    username     = data.get("username", "").strip()
    password     = data.get("password", "").strip()
    kitchen_id   = data.get("kitchenId", "").strip()
    kitchen_name = data.get("kitchenName", "").strip()

    if not username or not password or not kitchen_id or not kitchen_name:
        return jsonify({"error": "username, password, kitchenId and kitchenName are required"}), 400

    # Check duplicate
    existing = admins_collection.find_one({"username": username})
    if existing:
        return jsonify({"error": f"Admin '{username}' already exists"}), 409

    admin = create_kitchen_admin(username, hash_password(password), kitchen_id, kitchen_name)
    result = admins_collection.insert_one(admin)
    created = admins_collection.find_one({"_id": result.inserted_id})

    return jsonify({
        "message": "Kitchen admin created successfully",
        "admin":   format_admin(created)
    }), 201


# ─────────────────────────────────────────
# 📋 GET ALL KITCHEN ADMINS (Master Admin)
# GET /api/admin/all
# Called from MasterAdminAdmins.jsx
# ─────────────────────────────────────────
@admin_routes.route("/all", methods=["GET"])
def get_all_admins():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    admins = list(admins_collection.find({"role": "kitchen_admin"}))
    return jsonify([format_admin(a) for a in admins]), 200


# ─────────────────────────────────────────
# 🗑️ DELETE KITCHEN ADMIN (Master Admin)
# DELETE /api/admin/<admin_id>
# ─────────────────────────────────────────
@admin_routes.route("/<admin_id>", methods=["DELETE"])
def delete_admin(admin_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        result = admins_collection.delete_one({"_id": ObjectId(admin_id)})
    except Exception:
        return jsonify({"error": "Invalid admin ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Admin not found"}), 404

    return jsonify({"message": "Kitchen admin deleted successfully"}), 200


# ─────────────────────────────────────────
# ✏️ UPDATE KITCHEN ADMIN (Master Admin)
# PUT /api/admin/<admin_id>
# ─────────────────────────────────────────
@admin_routes.route("/<admin_id>", methods=["PUT"])
def update_admin(admin_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    update_fields = {}

    if "password" in data:     update_fields["password"]     = hash_password(data["password"])
    if "kitchenId" in data:    update_fields["kitchen_id"]   = data["kitchenId"].strip()
    if "kitchenName" in data:  update_fields["kitchen_name"] = data["kitchenName"].strip()
    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    try:
        result = admins_collection.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": update_fields}
        )
    except Exception:
        return jsonify({"error": "Invalid admin ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Admin not found"}), 404

    updated = admins_collection.find_one({"_id": ObjectId(admin_id)})
    return jsonify({
        "message": "Admin updated successfully",
        "admin":   format_admin(updated)
    }), 200


# ─────────────────────────────────────────
# 🎧 GET ALL SUPPORT TICKETS (Master Admin)
# GET /api/admin/support
# Called from MasterSupport.jsx
# ─────────────────────────────────────────
@admin_routes.route("/support", methods=["GET"])
def get_support_tickets():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    tickets = list(support_collection.find().sort("date", -1))
    return jsonify([{
        "id":         str(t["_id"]),
        "user":       t.get("user", ""),
        "senderType": t.get("senderType", "user"),
        "category":   t.get("category", ""),
        "message":    t.get("message", ""),
        "status":     t.get("status", "Open"),
        "date":       t.get("date", ""),
    } for t in tickets]), 200


# ─────────────────────────────────────────
# ➕ CREATE SUPPORT TICKET (User/Admin)
# POST /api/admin/support/create
# Called from SupportWidget.jsx
# ─────────────────────────────────────────
@admin_routes.route("/support/create", methods=["POST"])
def create_ticket():
    data = request.json or {}
    user        = data.get("user", "").strip()
    sender_type = data.get("senderType", "user")
    category    = data.get("category", "").strip()
    message     = data.get("message", "").strip()

    if not user or not message:
        return jsonify({"error": "User and message are required"}), 400

    ticket = {
        "user":       user,
        "senderType": sender_type,
        "category":   category,
        "message":    message,
        "status":     "Open",
        "date":       datetime.utcnow().isoformat(),
        "createdAt":  datetime.utcnow().isoformat(),
    }
    result = support_collection.insert_one(ticket)

    return jsonify({
        "message":  "Support ticket created successfully",
        "ticketId": str(result.inserted_id)
    }), 201


# ─────────────────────────────────────────
# ✅ RESOLVE SUPPORT TICKET (Master Admin)
# PATCH /api/admin/support/<ticket_id>
# ─────────────────────────────────────────
@admin_routes.route("/support/<ticket_id>", methods=["PATCH"])
def resolve_ticket(ticket_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        result = support_collection.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": "Resolved", "updatedAt": datetime.utcnow().isoformat()}}
        )
    except Exception:
        return jsonify({"error": "Invalid ticket ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Ticket not found"}), 404

    return jsonify({"message": "Ticket resolved successfully"}), 200


# ─────────────────────────────────────────
# 📊 MASTER DASHBOARD STATS
# GET /api/admin/dashboard-stats
# Called from MasterAdminDashboard.jsx
# ─────────────────────────────────────────
@admin_routes.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    total_admins   = admins_collection.count_documents({"role": "kitchen_admin"})
    total_orders   = orders_collection.count_documents({})
    total_revenue  = sum(o.get("total", 0) for o in orders_collection.find())
    open_tickets   = support_collection.count_documents({"status": "Open"})

    return jsonify({
        "totalAdmins":  total_admins,
        "totalOrders":  total_orders,
        "totalRevenue": total_revenue,
        "openTickets":  open_tickets,
    }), 200