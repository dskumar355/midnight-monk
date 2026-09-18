from datetime import datetime
import random
import math

KITCHEN_COORDINATES = {
    "k1": {"lat": 22.3102, "lng": 73.1755, "name": "Night Bites"},
    "k2": {"lat": 22.3215, "lng": 73.1812, "name": "Midnight Meals"},
}
DEFAULT_KITCHEN_COORDS = {"lat": 22.3100, "lng": 73.1750, "name": "Midnight Monk Kitchen"}


def calculate_distance(lat1, lon1, lat2, lon2):
    """Approximate distance in km using haversine formula"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_customer_coords(address, kitchen_coord):
    """Deterministically generate customer coordinates near kitchen based on address"""
    h = sum(ord(c) for c in (address or "Midnight Monk Delivery Address"))
    offset_lat = (((h * 13) % 41) - 20) * 0.0008
    offset_lng = (((h * 17) % 43) - 21) * 0.0009
    if abs(offset_lat) < 0.004:
        offset_lat = 0.010 if offset_lat >= 0 else -0.010
    if abs(offset_lng) < 0.004:
        offset_lng = 0.012 if offset_lng >= 0 else -0.012
    return {
        "lat": round(kitchen_coord["lat"] + offset_lat, 6),
        "lng": round(kitchen_coord["lng"] + offset_lng, 6)
    }


def generate_otp():
    """Generate a 4-digit delivery OTP"""
    return random.randint(1000, 9999)


def create_order(user, kitchen_id, items, total, address):
    """
    Create a new order document for MongoDB.
    Matches OrderContext.jsx addOrder() fields exactly.
    """
    user = user or {"name": "Guest Customer", "mobile": ""}
    payment_method = (user.get("paymentMethod") or "COD").strip().upper()
    is_cod = payment_method == "COD"
    kitchen_coord = KITCHEN_COORDINATES.get(kitchen_id.strip(), DEFAULT_KITCHEN_COORDS)
    cust_coord = get_customer_coords(address, kitchen_coord)
    dist_km = round(max(1.2, calculate_distance(kitchen_coord["lat"], kitchen_coord["lng"], cust_coord["lat"], cust_coord["lng"])), 1)
    eta_mins = random.choice([15, 20, 25, 30])

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
        "address": address.strip(),
        "otp": generate_otp(),
        "eta_minutes": random.choice([15, 20, 25, 30]),
        "delivery_assignment": {
            "partner_id": None,
            "partner_name": "",
            "partner_phone": "",
            "assigned_at": None,
            "accepted_at": None,
            "picked_up_at": None,
            "out_for_delivery_at": None,
            "delivered_at": None,
            "delivery_status": "WAITING_FOR_ASSIGNMENT",
            "delivery_notes": "",
        },
        "payment_method": payment_method,
        "payment_status": "Pending" if is_cod else "Paid",
        "cod": {
            "required": is_cod,
            "amount_expected": float(total) if is_cod else 0,
            "amount_collected": 0,
            "collection_timestamp": None,
            "collection_status": "PENDING" if is_cod else "COLLECTED",
        },

        "status": "ORDER_PLACED",

        # ✅ Live Tracking
        "tracking": {
            "kitchen_lat": kitchen_coord["lat"],
            "kitchen_lng": kitchen_coord["lng"],
            "customer_lat": cust_coord["lat"],
            "customer_lng": cust_coord["lng"],
            "rider_lat": kitchen_coord["lat"],
            "rider_lng": kitchen_coord["lng"],
            "rider_progress": 0.0,
            "eta_minutes": eta_mins,
            "distance_km": dist_km,
            "started_at": None,
            "last_updated": datetime.utcnow().isoformat(),
        },

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

    partner_id = order.get("delivery_assignment", {}).get("partner_id") or ""
    user_id = str(order.get("user", {}).get("_id") or order.get("user_id", "") or "")

    return {
        "id":                  str(order["_id"]),          # ✅ frontend uses order.id
        "order_id":            str(order["_id"]),          # ✅ alias for consistency
        "user":                order.get("user", {}),
        "userId":              user_id,
        "user_id":             user_id,
        "kitchenId":           order.get("kitchen_id", ""), # ✅ frontend uses order.kitchenId
        "kitchen_id":          order.get("kitchen_id", ""), # ✅ backend alias
        "items":               order.get("items", []),
        "total":               order.get("total", 0),
        "address":             order.get("address", ""),
        "status":              order.get("status", "ORDER_PLACED"),
        "riderName":           order.get("delivery_assignment", {}).get("partner_name", ""),
        "riderPhone":          order.get("delivery_assignment", {}).get("partner_phone", ""),
        "deliveryPartnerId":   partner_id,
        "delivery_partner_id": partner_id,
        "otp":                 order.get("otp", 0),
        "etaMinutes":          order.get("eta_minutes", 20),
        "paymentMethod":       order.get("payment_method", "COD"),
        "paymentStatus":       order.get("payment_status", "Pending"),
        "deliveryAssignment":  order.get("delivery_assignment", {}),
        "delivery_assignment": order.get("delivery_assignment", {}),
        "tracking":            order.get("tracking", {}),
        "cod":                 order.get("cod", {}),
        "date":                order.get("date", ""),
        "createdAt":           order.get("createdAt", ""),
    }


def validate_order(user, kitchen_id, items, total, address):
    """
    Validate order fields before saving.
    Returns (is_valid, error_message)
    """
    # Browsing and checkout support guests; authentication remains optional.
    if not user:
        user = {"name": "Guest Customer", "mobile": ""}
    if not user.get("name"):
        return False, "Customer name is required"
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


STATUS_FLOW = {
    "ORDER_PLACED": ["ACCEPTED", "CANCELLED", "PAYMENT_FAILED"],
    "ACCEPTED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY", "CANCELLED"],
    "READY": ["ASSIGNED", "CANCELLED"],
    "ASSIGNED": ["PICKED_UP", "REJECTED", "CANCELLED"],
    "PICKED_UP": ["OUT_FOR_DELIVERY"],
    "OUT_FOR_DELIVERY": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": [],
    "REJECTED": [],
    "PAYMENT_FAILED": [],
}

def get_next_status(current_status):
    next_steps = STATUS_FLOW.get(current_status, [])
    return next_steps[0] if next_steps else None


def is_valid_transition(current_status, new_status):
    return new_status in STATUS_FLOW.get(current_status, [])
