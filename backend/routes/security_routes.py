from flask import Blueprint, request, jsonify
from utils.security import (
    generate_otp, verify_otp, check_lockout, record_failed_login,
    clear_lockout, log_audit, get_audit_logs
)
from utils.helpers import generate_token, require_role
from database.db import db
from datetime import datetime

security_routes = Blueprint("security_routes", __name__)
users_collection = db["users"]

# ── Request OTP ──
@security_routes.route("/request-otp", methods=["POST"])
def request_otp():
    data = request.json or {}
    mobile = data.get("mobile", "").strip()
    
    if not mobile or len(mobile) < 10:
        return jsonify({"error": "Valid mobile number required"}), 400
    
    # Check lockout
    locked, msg = check_lockout(f"otp_{mobile}")
    if locked:
        return jsonify({"error": msg}), 429
    
    otp = generate_otp(mobile)
    return jsonify({
        "message": "OTP sent successfully",
        "debug_otp": otp,  # Remove in production!
    }), 200


# ── Verify OTP & Login ──
@security_routes.route("/verify-otp", methods=["POST"])
def verify_otp_route():
    data = request.json or {}
    mobile = data.get("mobile", "").strip()
    otp = data.get("otp", "").strip()
    name = data.get("name", "").strip()
    
    if not mobile or not otp:
        return jsonify({"error": "Mobile and OTP required"}), 400
    
    # Check lockout
    locked, msg = check_lockout(f"otp_{mobile}")
    if locked:
        return jsonify({"error": msg}), 429
    
    success, message = verify_otp(mobile, otp)
    
    if not success:
        record_failed_login(f"otp_{mobile}")
        return jsonify({"error": message}), 400
    
    clear_lockout(f"otp_{mobile}")
    
    # Find or create user
    user = users_collection.find_one({"mobile": mobile})
    if not user:
        users_collection.insert_one({
            "name": name or f"User {mobile[-4:]}",
            "mobile": mobile,
            "verified": True,
            "createdAt": datetime.utcnow().isoformat(),
        })
        user = users_collection.find_one({"mobile": mobile})
    else:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"verified": True}}
        )
    
    # Generate JWT
    token = generate_token({
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "mobile": mobile,
        "role": "user",
        "verified": True,
    })
    
    log_audit(mobile, "otp_login", {"ip": request.remote_addr})
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "name": user.get("name", ""),
            "mobile": mobile,
            "verified": True,
        }
    }), 200


# ── Get Audit Logs (Master Admin) ──
@security_routes.route("/audit-logs", methods=["GET"])
def get_audits():
    payload, err = require_role(request, "master_admin")
    if err:
        return jsonify(err[0]), err[1]
    limit = int(request.args.get("limit", 50))
    logs = get_audit_logs(limit)
    return jsonify(logs), 200
