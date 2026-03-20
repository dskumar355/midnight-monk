from flask import Blueprint, request, jsonify
from database.db import users_collection, admins_collection, master_admins_collection
from models.user_model import create_user, format_user, validate_user
from utils.helpers import generate_token, verify_token
import hashlib
from datetime import datetime
from utils.limiter import limiter

auth_routes = Blueprint("auth_routes", __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ─────────────────────────────────────────
# 👤 USER LOGIN (name + mobile)
# Matches Login.jsx handleUserLogin()
# ─────────────────────────────────────────
@auth_routes.route("/user-login", methods=["POST"])
@limiter.limit("10 per minute")
def user_login():
    data = request.json or {}
    name   = data.get("name", "").strip()
    mobile = data.get("mobile", "").strip()

    # Validate
    is_valid, error = validate_user(name, mobile)
    if not is_valid:
        return jsonify({"error": error}), 400

    # Find or create user
    existing_user = users_collection.find_one({"mobile": mobile})

    if existing_user:
        # Update name if changed
        users_collection.update_one(
            {"mobile": mobile},
            {"$set": {"name": name, "updatedAt": datetime.utcnow().isoformat()}}
        )
        user = users_collection.find_one({"mobile": mobile})
    else:
        # Auto-register new user
        new_user = create_user(name, mobile)
        result = users_collection.insert_one(new_user)
        user = users_collection.find_one({"_id": result.inserted_id})

    formatted = format_user(user)

    # Generate JWT
    token = generate_token({
        "id":     formatted["id"],
        "name":   formatted["name"],
        "mobile": formatted["mobile"],
        "role":   "user"
    })

    return jsonify({
        "message": "Login successful",
        "token":   token,
        "user":    formatted
    }), 200


# ─────────────────────────────────────────
# 👤 USER REGISTER (name + mobile + confirm)
# Matches Register.jsx handleRegister()
# ─────────────────────────────────────────
@auth_routes.route("/user-register", methods=["POST"])
@limiter.limit("10 per minute")
def user_register():
    data = request.json or {}
    name           = data.get("name", "").strip()
    mobile         = data.get("mobile", "").strip()
    confirm_mobile = data.get("confirmMobile", "").strip()

    # Validate
    is_valid, error = validate_user(name, mobile)
    if not is_valid:
        return jsonify({"error": error}), 400

    if mobile != confirm_mobile:
        return jsonify({"error": "Mobile numbers do not match"}), 400

    # Check duplicate
    existing = users_collection.find_one({"mobile": mobile})
    if existing:
        return jsonify({"error": "User with this mobile already exists"}), 409

    # Create user
    new_user = create_user(name, mobile)
    result = users_collection.insert_one(new_user)
    user = users_collection.find_one({"_id": result.inserted_id})
    formatted = format_user(user)

    token = generate_token({
        "id":     formatted["id"],
        "name":   formatted["name"],
        "mobile": formatted["mobile"],
        "role":   "user"
    })

    return jsonify({
        "message": "Registration successful",
        "token":   token,
        "user":    formatted
    }), 201


# ─────────────────────────────────────────
# 🍳 KITCHEN ADMIN LOGIN
# Matches AdminLogin.jsx
# ─────────────────────────────────────────
@auth_routes.route("/admin-login", methods=["POST"])
@limiter.limit("10 per minute")
def admin_login():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    admin = admins_collection.find_one({"username": username})

    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    # Verify password
    if admin.get("password") != hash_password(password):
        return jsonify({"error": "Invalid password"}), 401

    token = generate_token({
        "id":          str(admin["_id"]),
        "username":    admin.get("username"),
        "kitchenId":   admin.get("kitchen_id"),
        "kitchenName": admin.get("kitchen_name"),
        "role":        "kitchen_admin"
    })

    return jsonify({
        "message":     "Admin login successful",
        "token":       token,
        "admin": {
            "id":          str(admin["_id"]),
            "username":    admin.get("username"),
            "kitchenId":   admin.get("kitchen_id"),
            "kitchenName": admin.get("kitchen_name"),
            "role":        "kitchen_admin"
        }
    }), 200


# ─────────────────────────────────────────
# 👑 MASTER ADMIN LOGIN
# Matches MasterAdminLogin.jsx
# ─────────────────────────────────────────
@auth_routes.route("/master-login", methods=["POST"])
@limiter.limit("10 per minute")
def master_login():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    master = master_admins_collection.find_one({"username": username})

    if not master:
        return jsonify({"error": "Master admin not found"}), 404

    if master.get("password") != hash_password(password):
        return jsonify({"error": "Invalid password"}), 401

    token = generate_token({
        "id":       str(master["_id"]),
        "username": master.get("username"),
        "role":     "master_admin"
    })

    return jsonify({
        "message":  "Master admin login successful",
        "token":    token,
        "master": {
            "id":       str(master["_id"]),
            "username": master.get("username"),
            "role":     "master_admin"
        }
    }), 200


# ─────────────────────────────────────────
# 🔐 VERIFY TOKEN
# ─────────────────────────────────────────
@auth_routes.route("/verify", methods=["GET"])
def verify():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    return jsonify({"valid": True, "user": payload}), 200


# ─────────────────────────────────────────
# 🌱 SEED MASTER ADMIN (run once)
# POST /api/auth/seed-master
# ─────────────────────────────────────────
@auth_routes.route("/seed-master", methods=["POST"])
def seed_master():
    existing = master_admins_collection.find_one({"username": "master"})
    if existing:
        return jsonify({"message": "Master admin already exists"}), 200

    master_admins_collection.insert_one({
        "username":  "master",
        "password":  hash_password("master123"),
        "role":      "master_admin",
        "createdAt": datetime.utcnow().isoformat(),
    })
    return jsonify({"message": "Master admin seeded", "username": "master", "password": "master123"}), 201


# ─────────────────────────────────────────
# 🌱 SEED KITCHEN ADMINS (run once)
# POST /api/auth/seed-admins
# ─────────────────────────────────────────
@auth_routes.route("/seed-admins", methods=["POST"])
def seed_admins():
    admins = [
        {"username": "admin1", "password": hash_password("1234"), "kitchen_id": "k1", "kitchen_name": "Night Bites",    "role": "kitchen_admin", "createdAt": datetime.utcnow().isoformat()},
        {"username": "admin2", "password": hash_password("1234"), "kitchen_id": "k2", "kitchen_name": "Midnight Meals", "role": "kitchen_admin", "createdAt": datetime.utcnow().isoformat()},
    ]
    for admin in admins:
        existing = admins_collection.find_one({"username": admin["username"]})
        if not existing:
            admins_collection.insert_one(admin)

    return jsonify({"message": "Kitchen admins seeded", "admins": ["admin1 / 1234", "admin2 / 1234"]}), 201