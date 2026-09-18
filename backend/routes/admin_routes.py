from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import admins_collection, support_collection, orders_collection, delivery_partners_collection, audit_logs_collection
from models.kitchen_model import create_kitchen_admin, format_admin
from models.delivery_partner_model import create_delivery_partner, format_delivery_partner
from models.order_model import format_order
from utils.helpers import require_role, hash_password
from datetime import datetime
import re

admin_routes = Blueprint("admin_routes", __name__)

VALID_DELIVERY_ROLES = {
    "delivery_partner",
    "delivery_manager",
    "delivery_supervisor",
    "delivery_admin",
}

VALID_ACCOUNT_STATUSES = {"PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"}
VALID_AVAILABILITY_STATUSES = {"ONLINE", "OFFLINE"}
VALID_WORK_STATUSES = {"AVAILABLE", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "BUSY"}


def _normalise_role(value):
    role = (value or "delivery_partner").strip()
    return role if role in VALID_DELIVERY_ROLES else "delivery_partner"


def _normalise_account_status(value):
    status = (value or "ACTIVE").strip().upper()
    return status if status in VALID_ACCOUNT_STATUSES else "ACTIVE"


def _normalise_availability(value):
    status = (value or "OFFLINE").strip().upper()
    return status if status in VALID_AVAILABILITY_STATUSES else "OFFLINE"


def _normalise_work_status(value):
    status = (value or "AVAILABLE").strip().upper()
    return status if status in VALID_WORK_STATUSES else "AVAILABLE"


def _log_admin_action(admin_id, action, target_id, previous_value=None, new_value=None):
    audit_logs_collection.insert_one({
        "admin_id": str(admin_id),
        "action": action,
        "target_id": str(target_id),
        "timestamp": datetime.utcnow().isoformat(),
        "previous_value": previous_value,
        "new_value": new_value,
    })


def _partner_is_eligible(partner):
    if not partner:
        return False
    if partner.get("account_status") not in {"ACTIVE"}:
        return False
    if partner.get("is_online") is not True:
        return False
    if partner.get("active_order_id"):
        return False
    return True


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


@admin_routes.route("/delivery-partners", methods=["GET"])
def get_delivery_partners():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    partners = list(delivery_partners_collection.find({"role": {"$in": list(VALID_DELIVERY_ROLES)}}).sort("createdAt", -1))
    return jsonify([format_delivery_partner(p) for p in partners]), 200


@admin_routes.route("/delivery-partners/<partner_id>", methods=["GET"])
def get_delivery_partner(partner_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        partner = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404

    return jsonify(format_delivery_partner(partner)), 200


@admin_routes.route("/delivery-partners/create", methods=["POST"])
def create_partner():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    name = (data.get("name") or "").strip()
    phone = str(data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    profile_image = (data.get("profileImage") or "").strip()
    vehicle_type = (data.get("vehicleType") or "BIKE").strip().upper()
    vehicle_number = (data.get("vehicleNumber") or "").strip()
    service_area = (data.get("serviceArea") or "").strip()
    max_delivery_radius = data.get("maxDeliveryRadius", 8)
    account_status = _normalise_account_status(data.get("accountStatus"))
    is_online = bool(data.get("isOnline", False))
    notes = (data.get("notes") or "").strip()
    role = _normalise_role(data.get("role"))

    if not username or not password or not name or not phone:
        return jsonify({"error": "Username, password, name and phone are required"}), 400

    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify({"error": "Invalid email format"}), 400

    if not vehicle_type:
        vehicle_type = "OTHER"

    existing = delivery_partners_collection.find_one({"username": username})
    if existing:
        return jsonify({"error": f"Delivery partner '{username}' already exists"}), 409

    partner = create_delivery_partner(
        username,
        hash_password(password),
        name,
        phone,
        vehicle_number=vehicle_number,
        role=role,
        email=email,
        profile_image=profile_image,
        vehicle_type=vehicle_type,
        service_area=service_area,
        max_delivery_radius=max_delivery_radius,
        account_status=account_status,
        is_online=is_online,
        availability_status="ONLINE" if is_online else "OFFLINE",
        work_status="AVAILABLE" if not is_online else "AVAILABLE",
        notes=notes,
        registration_date=datetime.utcnow().isoformat(),
        last_active_at=datetime.utcnow().isoformat(),
    )
    result = delivery_partners_collection.insert_one(partner)
    created = delivery_partners_collection.find_one({"_id": result.inserted_id})

    _log_admin_action(payload.get("id"), "DELIVERY_PARTNER_CREATED", result.inserted_id, None, partner.get("name"))

    return jsonify({
        "message": "Delivery partner created successfully",
        "partner": format_delivery_partner(created),
    }), 201


@admin_routes.route("/delivery-partners/<partner_id>", methods=["PUT"])
def update_partner(partner_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        existing = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not existing:
        return jsonify({"error": "Delivery partner not found"}), 404

    data = request.json or {}
    update_fields = {}
    if "name" in data: update_fields["name"] = (data["name"] or "").strip()
    if "phone" in data: update_fields["phone"] = str(data["phone"]).strip()
    if "email" in data: update_fields["email"] = (data["email"] or "").strip()
    if "profileImage" in data: update_fields["profile_image"] = (data["profileImage"] or "").strip()
    if "vehicleType" in data: update_fields["vehicle_type"] = (data["vehicleType"] or "BIKE").strip().upper()
    if "vehicleNumber" in data: update_fields["vehicle_number"] = (data["vehicleNumber"] or "").strip()
    if "serviceArea" in data: update_fields["service_area"] = (data["serviceArea"] or "").strip()
    if "maxDeliveryRadius" in data: update_fields["max_delivery_radius"] = data["maxDeliveryRadius"]
    if "accountStatus" in data: update_fields["account_status"] = _normalise_account_status(data["accountStatus"])
    if "notes" in data: update_fields["notes"] = (data["notes"] or "").strip()
    if "role" in data: update_fields["role"] = _normalise_role(data["role"])
    if "password" in data and str(data["password"]).strip():
        update_fields["password"] = hash_password(str(data["password"]).strip())
    if "isOnline" in data:
        online_value = bool(data["isOnline"])
        update_fields["is_online"] = online_value
        update_fields["availability_status"] = "ONLINE" if online_value else "OFFLINE"
    if "availabilityStatus" in data:
        status = _normalise_availability(data["availabilityStatus"])
        update_fields["availability_status"] = status
        update_fields["is_online"] = status == "ONLINE"
    if "workStatus" in data:
        update_fields["work_status"] = _normalise_work_status(data["workStatus"])
    update_fields["updatedAt"] = datetime.utcnow().isoformat()

    previous = dict(existing)
    try:
        result = delivery_partners_collection.update_one({"_id": ObjectId(partner_id)}, {"$set": update_fields})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Delivery partner not found"}), 404

    updated = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    _log_admin_action(payload.get("id"), "DELIVERY_PARTNER_UPDATED", partner_id, previous.get("name"), updated.get("name"))
    return jsonify({
        "message": "Delivery partner updated successfully",
        "partner": format_delivery_partner(updated),
    }), 200


@admin_routes.route("/delivery-partners/<partner_id>/status", methods=["PATCH"])
def update_delivery_partner_status(partner_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    new_status = _normalise_account_status(data.get("accountStatus"))
    if data.get("accountStatus") is None:
        return jsonify({"error": "accountStatus is required"}), 400

    try:
        existing = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not existing:
        return jsonify({"error": "Delivery partner not found"}), 404

    previous_status = existing.get("account_status", "ACTIVE")
    update_fields = {"account_status": new_status, "updatedAt": datetime.utcnow().isoformat()}
    if new_status == "SUSPENDED":
        update_fields["is_online"] = False
        update_fields["availability_status"] = "OFFLINE"
    if new_status == "ACTIVE":
        update_fields["work_status"] = "AVAILABLE"

    delivery_partners_collection.update_one({"_id": ObjectId(partner_id)}, {"$set": update_fields})
    _log_admin_action(payload.get("id"), f"DELIVERY_PARTNER_{new_status}", partner_id, previous_status, new_status)
    updated = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    return jsonify({"message": "Partner status updated", "partner": format_delivery_partner(updated)}), 200


@admin_routes.route("/delivery-partners/<partner_id>/availability", methods=["PATCH"])
def update_delivery_partner_availability(partner_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    is_online = bool(data.get("isOnline", False))

    try:
        partner = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404

    active_order = orders_collection.find_one({
        "delivery_assignment.partner_id": str(partner["_id"]),
        "status": {"$in": ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]},
    })
    if active_order and not is_online:
        return jsonify({"error": "Cannot force offline while a delivery is active"}), 400

    status = "ONLINE" if is_online else "OFFLINE"
    delivery_partners_collection.update_one(
        {"_id": ObjectId(partner_id)},
        {"$set": {"is_online": is_online, "availability_status": status, "work_status": "AVAILABLE" if is_online else "OFFLINE", "updatedAt": datetime.utcnow().isoformat()}}
    )
    updated = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    return jsonify({"message": "Availability updated", "partner": format_delivery_partner(updated)}), 200


@admin_routes.route("/delivery-partners/<partner_id>", methods=["DELETE"])
def delete_delivery_partner(partner_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    try:
        result = delivery_partners_collection.delete_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Delivery partner not found"}), 404

    _log_admin_action(payload.get("id"), "DELIVERY_PARTNER_DELETED", partner_id, None, None)
    return jsonify({"message": "Delivery partner deleted successfully"}), 200


@admin_routes.route("/deliveries", methods=["GET"])
def get_active_deliveries():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    orders = list(orders_collection.find({
        "status": {"$in": ["READY", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "WAITING_FOR_ASSIGNMENT"]}
    }).sort("createdAt", -1))
    return jsonify([{
        "id": str(o.get("_id")),
        "user": o.get("user", {}),
        "kitchenId": o.get("kitchen_id"),
        "total": o.get("total", 0),
        "status": o.get("status"),
        "paymentMethod": o.get("payment_method", "COD"),
        "deliveryAssignment": o.get("delivery_assignment", {}),
        "createdAt": o.get("createdAt"),
        "updatedAt": o.get("updatedAt"),
        "address": o.get("address", ""),
    } for o in orders]), 200


@admin_routes.route("/deliveries/history", methods=["GET"])
def get_delivery_history():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    orders = list(orders_collection.find({"status": {"$in": ["DELIVERED", "CANCELLED"]}}).sort("updatedAt", -1))
    return jsonify([{
        "id": str(o.get("_id")),
        "user": o.get("user", {}),
        "kitchenId": o.get("kitchen_id"),
        "total": o.get("total", 0),
        "status": o.get("status"),
        "paymentMethod": o.get("payment_method", "COD"),
        "deliveryAssignment": o.get("delivery_assignment", {}),
        "cod": o.get("cod", {}),
        "createdAt": o.get("createdAt"),
        "updatedAt": o.get("updatedAt"),
    } for o in orders]), 200


@admin_routes.route("/deliveries/<order_id>/assign", methods=["POST"])
def assign_delivery(order_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    partner_id = str(data.get("partnerId") or "").strip()
    if not partner_id:
        return jsonify({"error": "partnerId is required"}), 400

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404

    try:
        partner = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404
    if partner.get("account_status") != "ACTIVE":
        return jsonify({"error": "Delivery partner is not active"}), 400
    if partner.get("is_online") is not True:
        return jsonify({"error": "Delivery partner is offline"}), 400
    if partner.get("active_order_id"):
        return jsonify({"error": "Delivery partner already has an active delivery"}), 400

    if order.get("status") not in ["READY", "WAITING_FOR_ASSIGNMENT"]:
        return jsonify({"error": "Only READY or unassigned orders can be assigned"}), 400

    now = datetime.utcnow().isoformat()
    update_doc = {
        "status": "ASSIGNED",
        "updatedAt": now,
        "delivery_assignment.partner_id": str(partner["_id"]),
        "delivery_assignment.partner_name": partner.get("name", ""),
        "delivery_assignment.partner_phone": partner.get("phone", ""),
        "delivery_assignment.assigned_at": now,
        "delivery_assignment.delivery_status": "ASSIGNED",
        "delivery_assignment.delivery_notes": order.get("delivery_assignment", {}).get("delivery_notes", ""),
    }

    orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": update_doc})
    delivery_partners_collection.update_one(
        {"_id": ObjectId(partner_id)},
        {"$set": {"active_order_id": order_id, "work_status": "ASSIGNED", "availability_status": "ONLINE", "is_online": True, "updatedAt": now}}
    )
    _log_admin_action(payload.get("id"), "DELIVERY_ASSIGNED", order_id, order.get("delivery_assignment", {}).get("partner_id"), partner_id)

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})
    return jsonify({"message": "Delivery assigned successfully", "order": format_order(updated) if updated else None}), 200


@admin_routes.route("/deliveries/<order_id>/reassign", methods=["POST"])
def reassign_delivery(order_id):
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    data = request.json or {}
    partner_id = str(data.get("partnerId") or "").strip()
    if not partner_id:
        return jsonify({"error": "partnerId is required"}), 400

    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") == "DELIVERED":
        return jsonify({"error": "Cannot reassign a completed delivery"}), 400

    try:
        partner = delivery_partners_collection.find_one({"_id": ObjectId(partner_id)})
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    if not partner:
        return jsonify({"error": "Delivery partner not found"}), 404
    if partner.get("account_status") != "ACTIVE":
        return jsonify({"error": "Delivery partner is not active"}), 400
    if partner.get("is_online") is not True:
        return jsonify({"error": "Delivery partner is offline"}), 400
    if partner.get("active_order_id") and str(partner.get("active_order_id")) != str(order_id):
        return jsonify({"error": "Partner already has an active assignment"}), 400

    previous_partner_id = order.get("delivery_assignment", {}).get("partner_id")
    now = datetime.utcnow().isoformat()
    orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": {
        "status": "ASSIGNED",
        "updatedAt": now,
        "delivery_assignment.partner_id": str(partner["_id"]),
        "delivery_assignment.partner_name": partner.get("name", ""),
        "delivery_assignment.partner_phone": partner.get("phone", ""),
        "delivery_assignment.assigned_at": now,
        "delivery_assignment.delivery_status": "ASSIGNED",
    }})
    if previous_partner_id:
        delivery_partners_collection.update_one({"_id": ObjectId(previous_partner_id)}, {"$set": {"active_order_id": None, "work_status": "AVAILABLE", "updatedAt": now}})
    delivery_partners_collection.update_one({"_id": ObjectId(partner_id)}, {"$set": {"active_order_id": order_id, "work_status": "ASSIGNED", "updatedAt": now}})
    _log_admin_action(payload.get("id"), "DELIVERY_REASSIGNED", order_id, previous_partner_id, partner_id)

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})
    return jsonify({"message": "Delivery reassigned successfully", "order": format_order(updated)}), 200


@admin_routes.route("/delivery-performance", methods=["GET"])
def get_delivery_performance():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]

    partners = list(delivery_partners_collection.find({"role": {"$in": list(VALID_DELIVERY_ROLES)}}))
    total_partners = len(partners)
    online_now = len([p for p in partners if p.get("is_online")])
    active_deliveries = len([p for p in partners if p.get("active_order_id")])
    completed_today = len([o for o in orders_collection.find() if o.get("status") == "DELIVERED" and (o.get("updatedAt") or "").startswith(datetime.utcnow().date().isoformat())])
    pending_assignments = orders_collection.count_documents({"status": {"$in": ["READY", "WAITING_FOR_ASSIGNMENT"]}})

    performance = {
        "totalPartners": total_partners,
        "onlineNow": online_now,
        "activeDeliveries": active_deliveries,
        "completedToday": completed_today,
        "pendingAssignments": pending_assignments,
        "partners": [
            {
                "id": str(p.get("_id")),
                "name": p.get("name", ""),
                "completed": int(p.get("completed_deliveries", 0) or 0),
                "cancelled": int(p.get("cancelled_deliveries", 0) or 0),
                "averageDeliveryTime": "N/A",
                "activeDeliveries": 1 if p.get("active_order_id") else 0,
                "completionRate": "0%",
            }
            for p in partners
        ]
    }
    return jsonify(performance), 200


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
    total_partners = delivery_partners_collection.count_documents({"role": "delivery_partner"})
    online_partners = delivery_partners_collection.count_documents({"role": "delivery_partner", "is_online": True})

    return jsonify({
        "totalAdmins":  total_admins,
        "totalPartners": total_partners,
        "onlinePartners": online_partners,
        "totalOrders":  total_orders,
        "totalRevenue": total_revenue,
        "openTickets":  open_tickets,
    }), 200
