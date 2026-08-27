"""Security utilities — 2FA, account lockout, audit logging, security headers."""
import os
import random
import hashlib
from datetime import datetime, timedelta
from database.db import db

# Collections
otp_collection = db["otps"]
audit_collection = db["audit_logs"]
lockout_collection = db["account_lockouts"]

# ── OTP Generation & Verification ──
def generate_otp(mobile, purpose="login"):
    """Generate a 6-digit OTP for the given mobile number."""
    otp = str(random.randint(100000, 999999))
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    
    # Store OTP with 5-minute expiry
    otp_collection.update_one(
        {"mobile": mobile, "purpose": purpose},
        {"$set": {
            "otp_hash": otp_hash,
            "attempts": 0,
            "createdAt": datetime.utcnow().isoformat(),
            "expiresAt": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
        }},
        upsert=True
    )
    
    # In production, send OTP via Twilio
    # For now, log it (and optionally send via notification_service)
    print(f"🔐 [OTP] Mobile: +91{mobile} | OTP: {otp} | Purpose: {purpose}")
    
    try:
        from services.notification_service import send_sms
        send_sms(mobile, f"🌙 Midnight Monk: Your OTP is {otp}. Valid for 5 minutes. Do not share.")
    except Exception:
        pass
    
    return otp  # Return for testing; in production, only send via SMS


def verify_otp(mobile, otp_input, purpose="login"):
    """Verify OTP. Returns (success, message)."""
    record = otp_collection.find_one({"mobile": mobile, "purpose": purpose})
    
    if not record:
        return False, "No OTP requested for this number"
    
    # Check expiry
    if record.get("expiresAt", "") < datetime.utcnow().isoformat():
        otp_collection.delete_one({"_id": record["_id"]})
        return False, "OTP expired. Please request a new one."
    
    # Check max attempts (prevent brute force)
    if record.get("attempts", 0) >= 5:
        otp_collection.delete_one({"_id": record["_id"]})
        return False, "Too many attempts. Please request a new OTP."
    
    # Increment attempts
    otp_collection.update_one(
        {"_id": record["_id"]},
        {"$inc": {"attempts": 1}}
    )
    
    # Verify
    otp_hash = hashlib.sha256(otp_input.encode()).hexdigest()
    if otp_hash == record.get("otp_hash"):
        otp_collection.delete_one({"_id": record["_id"]})  # One-time use
        return True, "OTP verified successfully"
    
    return False, "Invalid OTP"


# ── Account Lockout ──
def check_lockout(identifier):
    """Check if an account is locked out. Returns (locked, message)."""
    record = lockout_collection.find_one({"identifier": identifier})
    if not record:
        return False, None
    
    if record.get("locked_until", "") > datetime.utcnow().isoformat():
        remaining = datetime.fromisoformat(record["locked_until"]) - datetime.utcnow()
        mins = max(1, int(remaining.total_seconds() / 60))
        return True, f"Account locked. Try again in {mins} minute(s)."
    
    # Lockout expired — reset
    lockout_collection.delete_one({"_id": record["_id"]})
    return False, None


def record_failed_login(identifier):
    """Record a failed login attempt. Lock after 5 failures."""
    record = lockout_collection.find_one({"identifier": identifier})
    
    if not record:
        lockout_collection.insert_one({
            "identifier": identifier,
            "failures": 1,
            "first_failure": datetime.utcnow().isoformat(),
        })
        return
    
    failures = record.get("failures", 0) + 1
    update = {"$set": {"failures": failures}}
    
    if failures >= 5:
        # Lock for 15 minutes
        update["$set"]["locked_until"] = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
        update["$set"]["failures"] = 0
    
    lockout_collection.update_one({"_id": record["_id"]}, update)


def clear_lockout(identifier):
    """Clear lockout on successful login."""
    lockout_collection.delete_one({"identifier": identifier})


# ── Audit Logging ──
def log_audit(actor, action, details=None):
    """Log an admin action for audit trail."""
    audit_collection.insert_one({
        "actor": actor,
        "action": action,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
        "ip": None,  # Set from request in route
    })


def get_audit_logs(limit=50):
    """Get recent audit logs."""
    logs = list(audit_collection.find().sort("timestamp", -1).limit(limit))
    for log in logs:
        log["id"] = str(log.pop("_id"))
    return logs


# ── Security Headers Middleware ──
def add_security_headers(response):
    """Add security headers to every response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    return response
