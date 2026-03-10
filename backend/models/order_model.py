from datetime import datetime
import random

# ✅ 10 Delivery Partners — MUST match frontend Orders.jsx DELIVERY_PARTNERS array exactly
DELIVERY_PARTNERS = [
    { "name": "Ravi Kumar",    "phone": "9876543210" },
    { "name": "Suresh Babu",  "phone": "9845612378" },
    { "name": "Arjun Singh",  "phone": "9731245680" },
    { "name": "Kiran Reddy",  "phone": "9632587410" },
    { "name": "Mohan Das",    "phone": "9512348765" },
    { "name": "Vijay Naidu",  "phone": "9487561230" },
    { "name": "Rahul Verma",  "phone": "9356124780" },
    { "name": "Anil Sharma",  "phone": "9246813570" },
    { "name": "Deepak Rao",   "phone": "9135724680" },
    { "name": "Sanjay Gupta", "phone": "9024681357" },
]

def get_delivery_partner(order_id=None):
    """
    Pick a delivery partner deterministically based on order_id
    so the same order always gets the same partner.
    Falls back to random if no order_id provided.
    """
    if order_id:
        idx = ord(str(order_id)[-1]) % len(DELIVERY_PARTNERS)
    else:
        idx = random.randint(0, len(DELIVERY_PARTNERS) - 1)
    return DELIVERY_PARTNERS[idx]


def generate_otp():
    """Generate a 4-digit delivery OTP"""
    return random.randint(1000, 9999)


def create_order(user, kitchen_id, items, total, address):
    """
    Create a new order document for MongoDB.
    Matches OrderContext.jsx addOrder() fields exactly.
    """
    partner = get_delivery_partner()  # random at creation time

    return {
        # ✅ User info
        "user": {
            "name":   user.get("name", ""),
            "mobile": user.get("mobile", ""),
        },

        # ✅ Kitchen
        "kitchen_id": kitchen_id.strip(),

        # ✅ Items — array of cart items
        # Each item: { id, name, price, quantity, kitchenId }
        "items": items,

        # ✅ Pricing
        "total": float(total),

        # ✅ Delivery
        "address":     address.strip(),
        "rider_name":  partner["name"],
        "rider_phone": partner["phone"],
        "otp":         generate_otp(),
        "eta_minutes": random.choice([15, 20, 25, 30]),  # realistic ETA

        # ✅ Status — matches frontend STEPS array
        # "Placed" → "Preparing" → "Out for Delivery" → "Delivered"
        "status": "Placed",

        # ✅ Timestamps
        "date":      datetime.utcnow().isoformat(),
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }


def format_order(order):
    """
    Format a MongoDB order document for API response.
    Maps to exact frontend OrderContext + Orders.jsx structure.
    """
    if not order:
        return None

    return {
        "id":         str(order["_id"]),          # ✅ frontend uses order.id
        "user":       order.get("user", {}),
        "kitchenId":  order.get("kitchen_id", ""), # ✅ frontend uses order.kitchenId
        "items":      order.get("items", []),
        "total":      order.get("total", 0),
        "address":    order.get("address", ""),
        "status":     order.get("status", "Placed"),
        "riderName":  order.get("rider_name", "Delivery Partner"),  # ✅ frontend uses order.riderName
        "riderPhone": order.get("rider_phone", ""),                 # ✅ frontend uses order.riderPhone
        "otp":        order.get("otp", 0),
        "etaMinutes": order.get("eta_minutes", 20),
        "date":       order.get("date", ""),
        "createdAt":  order.get("createdAt", ""),
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
    "Delivered":        None,  # terminal state
}

def get_next_status(current_status):
    """Get the next valid status for an order"""
    return STATUS_FLOW.get(current_status)