from datetime import datetime
import hashlib

def hash_password(password):
    """Simple SHA256 hash for password"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password, hashed_password):
    """Verify a plain password against hashed"""
    return hash_password(plain_password) == hashed_password

def create_user(name, mobile):
    """
    Create a new user document for MongoDB.
    Users log in with name + mobile (no password needed per frontend logic).
    """
    return {
        "name": name.strip(),
        "mobile": str(mobile).strip(),
        "role": "user",
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }

def format_user(user):
    """
    Format a MongoDB user document for API response.
    Removes sensitive fields, converts _id to string.
    """
    if not user:
        return None
    return {
        "id":        str(user["_id"]),
        "name":      user.get("name", ""),
        "mobile":    user.get("mobile", ""),
        "role":      user.get("role", "user"),
        "createdAt": user.get("createdAt", ""),
    }

def validate_user(name, mobile):
    """
    Validate user input fields.
    Returns (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, "Name is required"
    if not mobile or len(str(mobile).strip()) != 10:
        return False, "Mobile number must be 10 digits"
    if not str(mobile).isdigit():
        return False, "Mobile number must contain only digits"
    return True, None