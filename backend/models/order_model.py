from datetime import datetime
import random

def generate_otp():
    """Generate a 4-digit delivery OTP"""
    return random.randint(1000, 9999)

def create_order(user, kitchen_id, items, total, address):
    """
    Create a new order document for MongoDB.
    Matches OrderContext.jsx addOrder() fields exactly.
    """
    return {
        # ✅ User info — matches frontend user object
        "user": {
            "name":   user.get("name", ""),
            "mobile": user.get("mobile", ""),
        },

        # ✅ Kitchen
        "kitchen_id":  kitchen_id.strip(),

        # ✅ Items — array of cart items
        # Each item: { id, name, price, quantity, kitchenId, image? }
        "items": items,

        # ✅ Pricing
        "total":       float(total),

        # ✅ Delivery
        "address":     address.strip(),
        "rider_name":  "Delivery Partner",
        "rider_phone": "9876543210",
        "otp":         generate_otp(),
        "eta_minutes": 15,

        # ✅ Status — matches frontend steps array
        # "Placed" → "Preparing" → "Out for Delivery" → "Delivered"
        "status":      "Placed",

        # ✅ Timestamps
        "date":        datetime.utcnow().isoformat(),
        "createdAt":   datetime.utcnow().isoformat(),
        "updatedAt":   datetime.utcnow().isoformat(),
    }

def format_order(order):
    """
    Format a MongoDB order document for API response.
    Maps to exact frontend OrderContext + Orders.jsx structure.
    """
    if not order:
        return None
    return {
        "id":          str(order["_id"]),       # ✅ frontend uses order.id
        "user":        order.get("user", {}),
        "kitchenId":   order.get("kitchen_id", ""),  # ✅ frontend uses order.kitchenId
        "items":       order.get("items", []),
        "total":       order.get("total", 0),
        "address":     order.get("address", ""),
        "status":      order.get("status", "Placed"),
        "riderName":   order.get("rider_name", "Delivery Partner"),
        "riderPhone":  order.get("rider_phone", ""),
        "otp":         order.get("otp", 0),
        "etaMinutes":  order.get("eta_minutes", 15),
        "date":        order.get("date", ""),
        "createdAt":   order.get("createdAt", ""),
    }

def validate_order(user, kitchen_id, items, total, address):
    """
    Validate order fields before saving.
    Returns (is_valid, error_message)
    """
    if not user or not user.get("name"):
        return False, "User info is required"
    if not kitchen_id or not kitchen_id.strip():
        return False, "Kitchen ID is required"
    if not items or len(items) == 0:
        return False, "Order must have at least one item"
    if total is None:
        return False, "Total is required"
    try:
        if float(total) <= 0:
            return False, "Total must be greater than 0"
    except (ValueError, TypeError):
        return False, "Total must be a valid number"
    if not address or not address.strip():
        return False, "Delivery address is required"
    return True, None

# ✅ Valid status transitions — prevents invalid status jumps
STATUS_FLOW = {
    "Placed":           "Preparing",
    "Preparing":        "Out for Delivery",
    "Out for Delivery": "Delivered",
    "Delivered":        None,   # terminal state
}

def get_next_status(current_status):
    """Get the next valid status for an order"""
    return STATUS_FLOW.get(current_status)