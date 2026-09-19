import gridfs
from pymongo import MongoClient
from config import Config

# ✅ Connect to MongoDB Atlas using Config class
client = MongoClient(Config.MONGO_URI)
db = client[Config.DATABASE_NAME]
fs = gridfs.GridFS(db)

# ✅ Collections — one for each data type
users_collection        = db["users"]
admins_collection       = db["admins"]
delivery_partners_collection = db["delivery_partners"]
kitchens_collection     = db["kitchens"]
menu_collection         = db["menu"]
orders_collection       = db["orders"]
support_collection      = db["support"]
master_admins_collection = db["master_admins"]
audit_logs_collection   = db["audit_logs"]
coupons_collection      = db["coupons"]
notifications_collection = db["notifications"]
notification_tokens_collection = db["notification_tokens"]

# Helpful indexes for delivery operations & high-throughput querying
try:
    # Delivery Partners
    delivery_partners_collection.create_index([("username", 1)], unique=False)
    delivery_partners_collection.create_index([("role", 1)])
    delivery_partners_collection.create_index([("account_status", 1)])
    delivery_partners_collection.create_index([("is_online", 1)])
    delivery_partners_collection.create_index([("active_order_id", 1)])
    delivery_partners_collection.create_index([("is_online", 1), ("active_order_id", 1)])

    # Orders - Compound indexes for sorting & filtering
    orders_collection.create_index([("kitchen_id", 1), ("createdAt", -1)])
    orders_collection.create_index([("user.mobile", 1), ("createdAt", -1)])
    orders_collection.create_index([("delivery_assignment.partner_id", 1), ("status", 1)])
    orders_collection.create_index([("status", 1), ("createdAt", -1)])
    orders_collection.create_index([("order_type", 1), ("scheduled_for", 1)])
    orders_collection.create_index([("createdAt", -1)])
    orders_collection.create_index([("id", 1)])

    # Kitchens
    kitchens_collection.create_index([("kitchen_id", 1)])
    kitchens_collection.create_index([("is_open", 1)])

    # Menu
    menu_collection.create_index([("kitchen_id", 1), ("category", 1)])
    menu_collection.create_index([("kitchen_id", 1), ("is_available", 1)])

    # Users & Admins
    users_collection.create_index([("mobile", 1)])
    admins_collection.create_index([("username", 1)])

    # Audit, Coupons & Notifications
    audit_logs_collection.create_index([("target_id", 1)])
    audit_logs_collection.create_index([("createdAt", -1)])
    coupons_collection.create_index([("code", 1)])
    notifications_collection.create_index([("user_id", 1), ("createdAt", -1)])
    notifications_collection.create_index([("order_id", 1)])
    notification_tokens_collection.create_index([("user_id", 1)])
    notification_tokens_collection.create_index([("token", 1)], unique=False)
except Exception as e:
    pass

def ping_db():
    """Test MongoDB connection on startup"""
    try:
        client.admin.command("ping")
        print("✅ MongoDB Atlas connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# ✅ Ping on import
ping_db()
