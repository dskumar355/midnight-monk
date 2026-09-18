from datetime import datetime

VALID_DELIVERY_ROLES = {
    "delivery_partner",
    "delivery_manager",
    "delivery_supervisor",
    "delivery_admin",
}

VALID_ACCOUNT_STATUSES = {"PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"}
VALID_VEHICLE_TYPES = {"BIKE", "SCOOTER", "BICYCLE", "WALKING", "OTHER"}
VALID_WORK_STATUSES = {"AVAILABLE", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "BUSY"}


def create_delivery_partner(username, password, name, phone, vehicle_number="", role="delivery_partner", **extra):
    role = (role or "delivery_partner").strip()
    if role not in VALID_DELIVERY_ROLES:
        role = "delivery_partner"

    vehicle_type = (extra.get("vehicle_type") or "BIKE").strip().upper()
    if vehicle_type not in VALID_VEHICLE_TYPES:
        vehicle_type = "OTHER"

    account_status = (extra.get("account_status") or "ACTIVE").strip().upper()
    if account_status not in VALID_ACCOUNT_STATUSES:
        account_status = "ACTIVE"

    work_status = (extra.get("work_status") or "AVAILABLE").strip().upper()
    if work_status not in VALID_WORK_STATUSES:
        work_status = "AVAILABLE"

    now = datetime.utcnow().isoformat()
    partner = {
        "username": (username or "").strip(),
        "password": password,
        "name": (name or "").strip(),
        "phone": str(phone or "").strip(),
        "email": (extra.get("email") or "").strip(),
        "profile_image": (extra.get("profile_image") or "").strip(),
        "role": role,
        "vehicle_type": vehicle_type,
        "vehicle_number": (vehicle_number or "").strip(),
        "service_area": (extra.get("service_area") or "").strip(),
        "max_delivery_radius": extra.get("max_delivery_radius", 8),
        "account_status": account_status,
        "is_online": bool(extra.get("is_online", False)),
        "availability_status": "ONLINE" if bool(extra.get("is_online", False)) else "OFFLINE",
        "work_status": work_status,
        "current_order_id": extra.get("current_order_id"),
        "active_order_id": extra.get("active_order_id"),
        "notes": (extra.get("notes") or "").strip(),
        "date_of_birth": (extra.get("date_of_birth") or "").strip(),
        "registration_date": extra.get("registration_date") or now,
        "last_active_at": extra.get("last_active_at") or now,
        "total_deliveries": int(extra.get("total_deliveries", 0) or 0),
        "completed_deliveries": int(extra.get("completed_deliveries", 0) or 0),
        "cancelled_deliveries": int(extra.get("cancelled_deliveries", 0) or 0),
        "failed_deliveries": int(extra.get("failed_deliveries", 0) or 0),
        "today_deliveries": int(extra.get("today_deliveries", 0) or 0),
        "createdAt": now,
        "updatedAt": now,
    }
    return partner


def format_delivery_partner(partner):
    if not partner:
        return None

    return {
        "id": str(partner.get("_id")),
        "username": partner.get("username", ""),
        "name": partner.get("name", ""),
        "phone": partner.get("phone", ""),
        "email": partner.get("email", ""),
        "profileImage": partner.get("profile_image", ""),
        "vehicleType": partner.get("vehicle_type", "BIKE"),
        "vehicleNumber": partner.get("vehicle_number", ""),
        "serviceArea": partner.get("service_area", ""),
        "maxDeliveryRadius": partner.get("max_delivery_radius", 8),
        "role": partner.get("role", "delivery_partner"),
        "accountStatus": partner.get("account_status", "ACTIVE"),
        "isOnline": bool(partner.get("is_online", False)),
        "availabilityStatus": partner.get("availability_status", "OFFLINE"),
        "workStatus": partner.get("work_status", "AVAILABLE"),
        "activeOrderId": str(partner.get("active_order_id")) if partner.get("active_order_id") else None,
        "currentOrderId": str(partner.get("current_order_id")) if partner.get("current_order_id") else None,
        "notes": partner.get("notes", ""),
        "registrationDate": partner.get("registration_date") or partner.get("createdAt", ""),
        "lastActiveAt": partner.get("last_active_at") or partner.get("updatedAt", ""),
        "totalDeliveries": int(partner.get("total_deliveries", 0) or 0),
        "completedDeliveries": int(partner.get("completed_deliveries", 0) or 0),
        "cancelledDeliveries": int(partner.get("cancelled_deliveries", 0) or 0),
        "failedDeliveries": int(partner.get("failed_deliveries", 0) or 0),
        "todayDeliveries": int(partner.get("today_deliveries", 0) or 0),
        "createdAt": partner.get("createdAt", ""),
        "updatedAt": partner.get("updatedAt", ""),
        "dateOfBirth": partner.get("date_of_birth", ""),
    }
