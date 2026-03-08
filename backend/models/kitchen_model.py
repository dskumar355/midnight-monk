from datetime import datetime

def create_kitchen(name, kitchen_id, owner=None, location=None, tag=None, rating=4.5):
    """
    Create a new kitchen document for MongoDB.
    kitchen_id must match frontend: 'k1', 'k2', etc.
    """
    return {
        "kitchen_id":   kitchen_id,        # ✅ matches frontend localStorage "selectedKitchen"
        "kitchen_name": name.strip(),
        "owner_name":   owner or "",
        "location":     location or "",
        "tag":          tag or "*open now, fast prep",
        "rating":       rating,
        "reviews":      0,
        "rating_label": f"{rating} rating",
        "is_open":      True,
        "createdAt":    datetime.utcnow().isoformat(),
        "updatedAt":    datetime.utcnow().isoformat(),
    }

def create_kitchen_admin(username, password, kitchen_id, kitchen_name):
    """
    Create a kitchen admin document.
    Matches AdminAuthContext: { username, password, kitchenId, kitchenName }
    """
    return {
        "username":     username.strip(),
        "password":     password,           # ✅ store hashed in routes
        "kitchen_id":   kitchen_id,         # ✅ matches frontend kitchenId
        "kitchen_name": kitchen_name.strip(),
        "role":         "kitchen_admin",
        "createdAt":    datetime.utcnow().isoformat(),
        "updatedAt":    datetime.utcnow().isoformat(),
    }

def format_kitchen(kitchen):
    """
    Format a MongoDB kitchen document for API response.
    Converts _id to string, maps to frontend-expected fields.
    """
    if not kitchen:
        return None
    return {
        "id":           str(kitchen["_id"]),
        "kitchen_id":   kitchen.get("kitchen_id", ""),
        "name":         kitchen.get("kitchen_name", ""),
        "owner":        kitchen.get("owner_name", ""),
        "location":     kitchen.get("location", ""),
        "tag":          kitchen.get("tag", "*open now, fast prep"),
        "rating":       kitchen.get("rating", 4.5),
        "reviews":      kitchen.get("reviews", 0),
        "ratingLabel":  kitchen.get("rating_label", ""),
        "isOpen":       kitchen.get("is_open", True),
        "createdAt":    kitchen.get("createdAt", ""),
    }

def format_admin(admin):
    """
    Format kitchen admin for API response — never expose password.
    """
    if not admin:
        return None
    return {
        "id":           str(admin["_id"]),
        "username":     admin.get("username", ""),
        "kitchenId":    admin.get("kitchen_id", ""),
        "kitchenName":  admin.get("kitchen_name", ""),
        "role":         admin.get("role", "kitchen_admin"),
        "createdAt":    admin.get("createdAt", ""),
    }

def validate_kitchen(name, kitchen_id):
    """
    Validate kitchen fields.
    Returns (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, "Kitchen name is required"
    if not kitchen_id or not kitchen_id.strip():
        return False, "Kitchen ID is required"
    return True, None