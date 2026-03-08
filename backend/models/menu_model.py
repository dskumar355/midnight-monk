from datetime import datetime

def create_menu_item(name, price, kitchen_id, category="Main Course",
                     description="", calories=None, protein=None,
                     discount=0, image=None):
    """
    Create a new menu item document for MongoDB.
    Matches AdminMenu.jsx fields exactly.
    """
    return {
        "food_name":   name.strip(),
        "price":       float(price),
        "kitchen_id":  kitchen_id.strip(),   # ✅ matches frontend kitchenId (k1, k2)
        "category":    category,             # ✅ Veg / Non Veg / Fast Food / Drinks
        "description": description.strip() if description else "",
        "calories":    int(calories) if calories else None,
        "protein":     int(protein) if protein else None,
        "discount":    float(discount) if discount else 0,
        "image":       image or None,        # ✅ base64 or URL
        "available":   True,
        "createdAt":   datetime.utcnow().isoformat(),
        "updatedAt":   datetime.utcnow().isoformat(),
    }

def format_menu_item(item):
    """
    Format a MongoDB menu item for API response.
    Maps to frontend cart/menu item structure.
    """
    if not item:
        return None

    price    = float(item.get("price", 0))
    discount = float(item.get("discount", 0))
    final_price = round(price - (price * discount / 100), 2)

    return {
        "id":          str(item["_id"]),
        "name":        item.get("food_name", ""),
        "price":       final_price,             # ✅ discounted price for cart
        "originalPrice": price,
        "kitchen_id":  item.get("kitchen_id", ""),
        "kitchenId":   item.get("kitchen_id", ""),  # ✅ alias for frontend
        "category":    item.get("category", ""),
        "description": item.get("description", ""),
        "calories":    item.get("calories"),
        "protein":     item.get("protein"),
        "discount":    item.get("discount", 0),
        "image":       item.get("image"),
        "available":   item.get("available", True),
        "createdAt":   item.get("createdAt", ""),
    }

def validate_menu_item(name, price, kitchen_id, category):
    """
    Validate menu item fields.
    Returns (is_valid, error_message)
    """
    VALID_CATEGORIES = ["Veg", "Non Veg", "Fast Food", "Drinks", "Main Course", "Snacks"]

    if not name or not name.strip():
        return False, "Food name is required"
    if price is None:
        return False, "Price is required"
    try:
        if float(price) <= 0:
            return False, "Price must be greater than 0"
    except (ValueError, TypeError):
        return False, "Price must be a valid number"
    if not kitchen_id or not kitchen_id.strip():
        return False, "Kitchen ID is required"
    if category and category not in VALID_CATEGORIES:
        return False, f"Category must be one of: {', '.join(VALID_CATEGORIES)}"
    return True, None