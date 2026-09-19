from datetime import datetime
import random
import math

KITCHEN_COORDINATES = {
    "k1": {"lat": 22.3102, "lng": 73.1755, "name": "Night Bites"},
    "k2": {"lat": 22.3215, "lng": 73.1812, "name": "Midnight Meals"},
}
DEFAULT_KITCHEN_COORDS = {"lat": 22.3100, "lng": 73.1750, "name": "Midnight Monk Kitchen"}


def calculate_distance(lat1, lon1, lat2, lon2):
    """Approximate distance in km using haversine formula."""
    try:
        R = 6371.0
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return 2.5


def validate_coordinates(lat, lng):
    """Validate latitude and longitude ranges."""
    try:
        lat_f = float(lat)
        lng_f = float(lng)
        if -90.0 <= lat_f <= 90.0 and -180.0 <= lng_f <= 180.0:
            return True, lat_f, lng_f
        return False, None, None
    except (ValueError, TypeError):
        return False, None, None


def generate_otp():
    """Generate a 4-digit delivery OTP."""
    return random.randint(1000, 9999)


def create_order(user, kitchen_id, items, total, address,
                 customer_location=None, delivery_instructions=None, food_instructions=None,
                 order_type="IMMEDIATE", scheduled_for=None):
    """
    Create a new order document for MongoDB.
    Correctly persists real customer coordinates, instructions, and preorder metadata.
    """
    user = user or {"name": "Guest Customer", "mobile": ""}
    payment_method = (user.get("paymentMethod") or "COD").strip().upper()
    is_cod = payment_method == "COD"
    kitchen_coord = KITCHEN_COORDINATES.get(kitchen_id.strip(), DEFAULT_KITCHEN_COORDS)

    # ── Accurate Customer Location Resolution ──
    # If real GPS coordinates provided from browser checkout, use them directly!
    has_real_gps = False
    cust_lat = None
    cust_lng = None
    accuracy = 15.0

    if customer_location and isinstance(customer_location, dict):
        raw_lat = customer_location.get("latitude") or customer_location.get("lat")
        raw_lng = customer_location.get("longitude") or customer_location.get("lng")
        is_valid, val_lat, val_lng = validate_coordinates(raw_lat, raw_lng)
        if is_valid:
            cust_lat = round(val_lat, 6)
            cust_lng = round(val_lng, 6)
            accuracy = float(customer_location.get("accuracy") or 12.0)
            has_real_gps = True

    if not has_real_gps:
        # Fallback default point near kitchen only when user denies location
        cust_lat = round(kitchen_coord["lat"] + 0.012, 6)
        cust_lng = round(kitchen_coord["lng"] + 0.008, 6)
        accuracy = 100.0

    dist_km = round(max(0.8, calculate_distance(kitchen_coord["lat"], kitchen_coord["lng"], cust_lat, cust_lng)), 2)
    eta_mins = max(10, round(dist_km * 3 + 10))

    is_preorder = str(order_type).upper() == "PREORDER"
    initial_status = "SCHEDULED" if is_preorder else "ORDER_PLACED"

    # Sanitized Instructions (Max 500 chars)
    deliv_instr = str(delivery_instructions).strip()[:500] if delivery_instructions else None
    food_instr = str(food_instructions).strip()[:500] if food_instructions else None

    captured_at = customer_location.get("captured_at") if customer_location else datetime.utcnow().isoformat()

    now_iso = datetime.utcnow().isoformat()

    return {
        # ✅ User info
        "user": {
            "name":   user.get("name", ""),
            "mobile": user.get("mobile", ""),
            "id":     user.get("id", ""),
        },

        # ✅ Kitchen
        "kitchen_id": kitchen_id.strip(),

        # ✅ Items — array of cart items
        "items": items,

        # ✅ Pricing
        "total": float(total),

        # ✅ Delivery
        "address": address.strip(),
        "otp": generate_otp(),
        "eta_minutes": eta_mins,

        # ✅ Instructions
        "delivery_instructions": deliv_instr,
        "food_instructions":     food_instr,

        # ✅ Customer Location Metadata
        "customer_location": {
            "latitude": cust_lat,
            "longitude": cust_lng,
            "accuracy": accuracy,
            "is_exact_gps": has_real_gps,
            "captured_at": captured_at,
        },

        # ✅ Preorder Scheduling
        "order_type": "PREORDER" if is_preorder else "IMMEDIATE",
        "scheduled_for": scheduled_for if is_preorder else None,
        "preorder_status": "SCHEDULED" if is_preorder else None,

        # ✅ Delivery Proof Photo
        "delivery_proof": None,

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

        "status": initial_status,

        # ✅ Live Tracking with explicit separated locations
        "tracking": {
            "kitchen_lat": kitchen_coord["lat"],
            "kitchen_lng": kitchen_coord["lng"],
            "customer_lat": cust_lat,
            "customer_lng": cust_lng,
            "customer_accuracy": accuracy,
            "rider_lat": kitchen_coord["lat"],
            "rider_lng": kitchen_coord["lng"],
            "rider_progress": 0.0,
            "eta_minutes": eta_mins,
            "distance_km": dist_km,
            "started_at": None,
            "last_updated": now_iso,
            "is_real_gps": False,
        },

        # ✅ Timestamps
        "date":      now_iso,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }


def format_order(order):
    """
    Format a MongoDB order document for API response.
    Maps to exact frontend OrderContext + Orders.jsx structure.
    Safely handles both legacy orders and new feature fields.
    """
    if not order:
        return None

    partner_id = order.get("delivery_assignment", {}).get("partner_id") or ""
    user_id = str(order.get("user", {}).get("_id") or order.get("user", {}).get("id") or order.get("user_id", "") or "")

    return {
        "id":                    str(order["_id"]),
        "order_id":              str(order["_id"]),
        "user":                  order.get("user", {}),
        "userId":                user_id,
        "user_id":               user_id,
        "kitchenId":             order.get("kitchen_id", ""),
        "kitchen_id":            order.get("kitchen_id", ""),
        "items":                 order.get("items", []),
        "total":                 order.get("total", 0),
        "address":               order.get("address", ""),
        "status":                order.get("status", "ORDER_PLACED"),
        "riderName":             order.get("delivery_assignment", {}).get("partner_name", ""),
        "riderPhone":            order.get("delivery_assignment", {}).get("partner_phone", ""),
        "deliveryPartnerId":     partner_id,
        "delivery_partner_id":   partner_id,
        "otp":                   order.get("otp", 0),
        "etaMinutes":            order.get("eta_minutes", 20),
        "paymentMethod":         order.get("payment_method", "COD"),
        "paymentStatus":         order.get("payment_status", "Pending"),
        "deliveryAssignment":    order.get("delivery_assignment", {}),
        "delivery_assignment":   order.get("delivery_assignment", {}),
        "tracking":              order.get("tracking", {}),
        "cod":                   order.get("cod", {}),
        "date":                  order.get("date", ""),
        "createdAt":             order.get("createdAt", ""),
        "updatedAt":             order.get("updatedAt", ""),

        # Feature 1: Delivery Proof
        "deliveryProof":         order.get("delivery_proof"),
        "delivery_proof":        order.get("delivery_proof"),

        # Feature 2: Customer Location
        "customerLocation":      order.get("customer_location"),
        "customer_location":     order.get("customer_location"),

        # Feature 3: Instructions
        "deliveryInstructions":  order.get("delivery_instructions"),
        "delivery_instructions": order.get("delivery_instructions"),
        "foodInstructions":      order.get("food_instructions"),
        "food_instructions":     order.get("food_instructions"),

        # Feature 4: Preorder
        "orderType":             order.get("order_type", "IMMEDIATE"),
        "order_type":            order.get("order_type", "IMMEDIATE"),
        "scheduledFor":          order.get("scheduled_for"),
        "scheduled_for":         order.get("scheduled_for"),
        "preorderStatus":        order.get("preorder_status"),
        "preorder_status":       order.get("preorder_status"),
    }


def validate_order(user, kitchen_id, items, total, address):
    """
    Validate order fields before saving.
    Returns (is_valid, error_message)
    """
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
    "SCHEDULED": ["READY_FOR_PREPARATION", "ACCEPTED", "CANCELLED"],
    "READY_FOR_PREPARATION": ["ACCEPTED", "PREPARING", "CANCELLED"],
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
