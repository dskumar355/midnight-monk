import jwt
import hashlib
from datetime import datetime, timedelta
from config import Config

# ─────────────────────────────────────────
# 🔐 PASSWORD HASHING (SHA256)
# Using hashlib instead of bcrypt to avoid
# binary dependency issues
# ─────────────────────────────────────────
def hash_password(password):
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(plain_password, hashed_password):
    """Verify a plain password against a SHA256 hash"""
    return hash_password(plain_password) == hashed_password

# ─────────────────────────────────────────
# 🎟️ JWT TOKEN GENERATION & VERIFICATION
# ─────────────────────────────────────────
def generate_token(payload):
    """
    Generate a JWT token with expiry.
    payload: dict with user/admin info (id, role, etc.)
    """
    payload["exp"] = datetime.utcnow() + timedelta(seconds=Config.JWT_EXPIRY)
    payload["iat"] = datetime.utcnow()

    token = jwt.encode(
        payload,
        Config.SECRET_KEY,
        algorithm="HS256"
    )
    return token

def verify_token(token):
    """
    Verify and decode a JWT token.
    Returns payload dict if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            Config.SECRET_KEY,
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# ─────────────────────────────────────────
# 🛡️ AUTH MIDDLEWARE HELPER
# Use this in routes to protect endpoints
# ─────────────────────────────────────────
def get_token_from_request(request):
    """Extract Bearer token from request headers"""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "").strip()
    return None

def require_auth(request):
    """
    Verify request has valid token.
    Returns (payload, error_response)
    Usage:
        payload, err = require_auth(request)
        if err: return err
    """
    token = get_token_from_request(request)
    if not token:
        return None, ({"error": "No token provided"}, 401)

    payload = verify_token(token)
    if not payload:
        return None, ({"error": "Invalid or expired token"}, 401)

    return payload, None

def require_role(request, role):
    """
    Verify request has valid token AND correct role.
    """
    payload, err = require_auth(request)
    if err:
        return None, err

    roles_allowed = role if isinstance(role, list) else [role]
    if payload.get("role") not in roles_allowed:
        return None, ({"error": f"Access denied. Required role: {role}"}, 403)

    return payload, None

# ─────────────────────────────────────────
# 🔧 UTILITY HELPERS
# ─────────────────────────────────────────
def success_response(data, message="Success", status=200):
    """Standard success response format"""
    return {"message": message, "data": data}, status

def error_response(message, status=400):
    """Standard error response format"""
    return {"error": message}, status

def paginate(collection_list, page=1, per_page=20):
    """Simple pagination helper"""
    start = (page - 1) * per_page
    end   = start + per_page
    return {
        "items":    collection_list[start:end],
        "total":    len(collection_list),
        "page":     page,
        "per_page": per_page,
        "pages":    (len(collection_list) + per_page - 1) // per_page,
    }