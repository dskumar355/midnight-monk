from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

KOLKATA = ZoneInfo("Asia/Kolkata")

def get_kolkata_now():
    """Return current localized datetime in Asia/Kolkata timezone."""
    return datetime.now(KOLKATA)

def parse_time_tuple(time_str, default=(22, 0)):
    """Parse 'HH:MM' string into (hour, minute)."""
    try:
        parts = (time_str or "").strip().split(":")
        return int(parts[0]), int(parts[1])
    except Exception:
        return default

def is_time_in_operating_window(target_time, open_time, close_time):
    """
    Check if target_time falls within [open_time, close_time).
    Properly handles overnight shifts crossing midnight (e.g. 22:00 -> 06:00).
    """
    if open_time <= close_time:
        return open_time <= target_time < close_time
    else:
        # Overnight window (e.g., 22:00 -> 06:00)
        return target_time >= open_time or target_time < close_time

def create_kitchen(name, kitchen_id, owner=None, location=None, tag=None, rating=4.5,
                   opening_time="22:00", closing_time="06:00", preorder_enabled=True,
                   prep_lead_time_minutes=20):
    """
    Create a new kitchen document for MongoDB.
    kitchen_id must match frontend: 'k1', 'k2', etc.
    """
    return {
        "kitchen_id":             kitchen_id,        # matches frontend localStorage "selectedKitchen"
        "kitchen_name":           name.strip(),
        "owner_name":             owner or "",
        "location":               location or "",
        "tag":                    tag or "*open now, fast prep",
        "rating":                 rating,
        "reviews":                0,
        "rating_label":           f"{rating} rating",
        "is_open":                True,             # Manual override toggle
        "is_temporarily_closed":  False,            # Temporary pause/emergency shutdown
        "opening_time":           opening_time,     # Default 10:00 PM
        "closing_time":           closing_time,     # Default 06:00 AM
        "preorder_enabled":       bool(preorder_enabled), # Enable scheduling ahead
        "holiday_dates":          [],               # List of 'YYYY-MM-DD' strings
        "prep_lead_time_minutes": int(prep_lead_time_minutes), # Minutes before delivery to start prep
        "createdAt":              datetime.utcnow().isoformat(),
        "updatedAt":              datetime.utcnow().isoformat(),
    }

def create_kitchen_admin(username, password, kitchen_id, kitchen_name):
    """
    Create a kitchen admin document.
    Matches AdminAuthContext: { username, password, kitchenId, kitchenName }
    """
    return {
        "username":     username.strip(),
        "password":     password,
        "kitchen_id":   kitchen_id,
        "kitchen_name": kitchen_name.strip(),
        "role":         "kitchen_admin",
        "createdAt":    datetime.utcnow().isoformat(),
        "updatedAt":    datetime.utcnow().isoformat(),
    }

def get_kitchen_business_status(kitchen, now_dt=None):
    """
    Determine accurate real-time business status for a kitchen in Asia/Kolkata timezone:
    - TEMPORARILY_CLOSED: kitchen temporarily paused by admin
    - CLOSED: outside operating hours or holiday, preorder disabled or manual toggle off
    - PREORDER_AVAILABLE: outside operating hours or upcoming shift, preorder enabled
    - OPEN: within operating shift, manual is_open is True, not temporarily closed
    """
    if not kitchen:
        return {"status": "CLOSED", "isOpen": False, "canOrderNow": False, "canPreorder": False, "message": "Kitchen not found"}

    now_k = now_dt or get_kolkata_now()
    cur_date_str = now_k.strftime("%Y-%m-%d")
    cur_time = now_k.time()

    is_temp_closed = bool(kitchen.get("is_temporarily_closed", False))
    if is_temp_closed:
        return {
            "status": "TEMPORARILY_CLOSED",
            "isOpen": False,
            "canOrderNow": False,
            "canPreorder": False,
            "badgeText": "Temporarily Closed",
            "nextOpening": "Temporarily unavailable",
        }

    holiday_dates = kitchen.get("holiday_dates") or []
    preorder_enabled = bool(kitchen.get("preorder_enabled", True))
    manual_open = bool(kitchen.get("is_open", True))

    open_h, open_m = parse_time_tuple(kitchen.get("opening_time", "22:00"), (22, 0))
    close_h, close_m = parse_time_tuple(kitchen.get("closing_time", "06:00"), (6, 0))
    open_time = time(open_h, open_m)
    close_time = time(close_h, close_m)

    in_operating_window = is_time_in_operating_window(cur_time, open_time, close_time)

    # Determine shift start & end for messaging
    next_opening_str = f"Opens at {open_time.strftime('%I:%M %p')}"
    if cur_date_str in holiday_dates:
        in_operating_window = False
        next_opening_str = f"Closed for holiday. Next shift at {open_time.strftime('%I:%M %p')}"

    if in_operating_window and manual_open:
        return {
            "status": "OPEN",
            "isOpen": True,
            "canOrderNow": True,
            "canPreorder": preorder_enabled,
            "badgeText": "Open Now",
            "nextOpening": f"Open until {close_time.strftime('%I:%M %p')}",
            "openingTime": kitchen.get("opening_time", "22:00"),
            "closingTime": kitchen.get("closing_time", "06:00"),
        }

    # Outside operating window or manual toggle off
    if preorder_enabled:
        return {
            "status": "PREORDER_AVAILABLE",
            "isOpen": False,
            "canOrderNow": False,
            "canPreorder": True,
            "badgeText": "Pre-Order Available",
            "nextOpening": next_opening_str,
            "openingTime": kitchen.get("opening_time", "22:00"),
            "closingTime": kitchen.get("closing_time", "06:00"),
        }
    else:
        return {
            "status": "CLOSED",
            "isOpen": False,
            "canOrderNow": False,
            "canPreorder": False,
            "badgeText": "Closed",
            "nextOpening": next_opening_str,
            "openingTime": kitchen.get("opening_time", "22:00"),
            "closingTime": kitchen.get("closing_time", "06:00"),
        }

def generate_valid_preorder_slots(kitchen, now_dt=None, slot_interval_minutes=30):
    """
    Generate chronological preorder delivery slots within the kitchen's upcoming operating shifts.
    Correctly spans overnight shifts across midnight.
    """
    now_k = now_dt or get_kolkata_now()
    if bool(kitchen.get("is_temporarily_closed", False)):
        return []
    if not bool(kitchen.get("preorder_enabled", True)):
        return []

    open_h, open_m = parse_time_tuple(kitchen.get("opening_time", "22:00"), (22, 0))
    close_h, close_m = parse_time_tuple(kitchen.get("closing_time", "06:00"), (6, 0))
    prep_lead = int(kitchen.get("prep_lead_time_minutes", 20))
    holiday_dates = set(kitchen.get("holiday_dates") or [])

    slots = []
    # Check current day and next 2 days to construct upcoming operating windows
    for day_offset in range(3):
        shift_base_date = (now_k + timedelta(days=day_offset)).date()
        shift_date_str = shift_base_date.strftime("%Y-%m-%d")
        if shift_date_str in holiday_dates:
            continue

        shift_start = datetime(
            shift_base_date.year, shift_base_date.month, shift_base_date.day,
            open_h, open_m, tzinfo=KOLKATA
        )
        if open_h >= close_h:
            # Shift ends on the next calendar morning
            shift_end = datetime(
                shift_base_date.year, shift_base_date.month, shift_base_date.day,
                close_h, close_m, tzinfo=KOLKATA
            ) + timedelta(days=1)
        else:
            shift_end = datetime(
                shift_base_date.year, shift_base_date.month, shift_base_date.day,
                close_h, close_m, tzinfo=KOLKATA
            )

        # Iterate from shift_start to shift_end in slot_interval_minutes
        curr_slot = shift_start
        while curr_slot < shift_end:
            # Slot must be at least prep_lead minutes in the future
            if curr_slot >= now_k + timedelta(minutes=prep_lead):
                time_label = curr_slot.strftime("%I:%M %p")
                if curr_slot.date() == now_k.date():
                    day_label = "Tonight" if curr_slot.hour >= 18 else "Today"
                elif curr_slot.date() == (now_k + timedelta(days=1)).date():
                    day_label = "Tomorrow"
                else:
                    day_label = curr_slot.strftime("%a, %b %d")

                slots.append({
                    "iso": curr_slot.isoformat(),
                    "date": curr_slot.strftime("%Y-%m-%d"),
                    "time": time_label,
                    "label": f"{day_label} · {time_label}",
                })
            curr_slot += timedelta(minutes=slot_interval_minutes)

        if len(slots) >= 24: # Cap to 24 slots (next 12 hours of operational time)
            break

    return slots[:24]

def validate_scheduled_time(kitchen, scheduled_iso_str, now_dt=None):
    """
    Independently validate a customer's scheduled preorder delivery time on the backend:
    1. Parse ISO timestamp with timezone awareness
    2. Must be in the future (at least prep lead time ahead)
    3. Must not be further than 72 hours out
    4. Kitchen must not be temporarily closed
    5. Preorder must be enabled on kitchen
    6. Date must not be a holiday/closed date
    7. Time must strictly fall within kitchen's operating window
    """
    if not kitchen:
        return False, "Kitchen not found", None

    if bool(kitchen.get("is_temporarily_closed", False)):
        return False, "This kitchen is temporarily closed and not accepting preorders.", None

    if not bool(kitchen.get("preorder_enabled", True)):
        return False, "Preordering is disabled for this kitchen.", None

    if not scheduled_iso_str:
        return False, "Scheduled delivery time is required for preorders.", None

    try:
        # Parse ISO string
        sched_dt = datetime.fromisoformat(scheduled_iso_str.replace("Z", "+00:00"))
        if sched_dt.tzinfo is None:
            sched_dt = sched_dt.replace(tzinfo=KOLKATA)
        else:
            sched_dt = sched_dt.astimezone(KOLKATA)
    except Exception as e:
        return False, f"Invalid scheduled time format: {e}", None

    now_k = now_dt or get_kolkata_now()
    prep_lead = int(kitchen.get("prep_lead_time_minutes", 20))

    if sched_dt <= now_k + timedelta(minutes=prep_lead - 1):
        return False, f"Preorder scheduled time must be at least {prep_lead} minutes in the future.", None

    if sched_dt > now_k + timedelta(days=3):
        return False, "Preorders cannot be placed more than 3 days in advance.", None

    sched_date_str = sched_dt.strftime("%Y-%m-%d")
    holiday_dates = set(kitchen.get("holiday_dates") or [])
    if sched_date_str in holiday_dates:
        return False, f"Kitchen is closed on {sched_date_str}.", None

    open_h, open_m = parse_time_tuple(kitchen.get("opening_time", "22:00"), (22, 0))
    close_h, close_m = parse_time_tuple(kitchen.get("closing_time", "06:00"), (6, 0))
    open_time = time(open_h, open_m)
    close_time = time(close_h, close_m)

    if not is_time_in_operating_window(sched_dt.time(), open_time, close_time):
        return False, (
            f"Scheduled time {sched_dt.strftime('%I:%M %p')} is outside operating hours "
            f"({open_time.strftime('%I:%M %p')} - {close_time.strftime('%I:%M %p')})."
        ), None

    return True, None, sched_dt

def format_kitchen(kitchen):
    """
    Format a MongoDB kitchen document for API response.
    Includes operating schedule, live status, and preorder slots.
    """
    if not kitchen:
        return None

    status_info = get_kitchen_business_status(kitchen)

    return {
        "id":                   str(kitchen["_id"]),
        "kitchen_id":           kitchen.get("kitchen_id", ""),
        "kitchenId":            kitchen.get("kitchen_id", ""),
        "name":                 kitchen.get("kitchen_name", ""),
        "kitchenName":          kitchen.get("kitchen_name", ""),
        "owner":                kitchen.get("owner_name", ""),
        "location":             kitchen.get("location", ""),
        "tag":                  kitchen.get("tag", "*open now, fast prep"),
        "rating":               kitchen.get("rating", 4.5),
        "reviews":              kitchen.get("reviews", 0),
        "ratingLabel":          kitchen.get("rating_label", ""),
        "isOpen":               status_info.get("isOpen", True),
        "is_open":              kitchen.get("is_open", True),
        "status":               status_info.get("status", "OPEN"),
        "badgeText":            status_info.get("badgeText", "Open"),
        "nextOpening":          status_info.get("nextOpening", ""),
        "canOrderNow":          status_info.get("canOrderNow", True),
        "canPreorder":          status_info.get("canPreorder", True),
        "openingTime":          kitchen.get("opening_time", "22:00"),
        "closingTime":          kitchen.get("closing_time", "06:00"),
        "isTemporarilyClosed":  bool(kitchen.get("is_temporarily_closed", False)),
        "preorderEnabled":      bool(kitchen.get("preorder_enabled", True)),
        "holidayDates":         kitchen.get("holiday_dates") or [],
        "prepLeadTimeMinutes":  int(kitchen.get("prep_lead_time_minutes", 20)),
        "preorderSlots":        generate_valid_preorder_slots(kitchen),
        "createdAt":            kitchen.get("createdAt", ""),
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