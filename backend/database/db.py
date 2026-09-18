from pymongo import MongoClient
from config import Config

# ✅ Connect to MongoDB Atlas using Config class
client = MongoClient(Config.MONGO_URI)
db = client[Config.DATABASE_NAME]

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

# Helpful indexes for delivery operations
try:
    delivery_partners_collection.create_index([("username", 1)], unique=False)
    delivery_partners_collection.create_index([("role", 1)])
    delivery_partners_collection.create_index([("account_status", 1)])
    delivery_partners_collection.create_index([("is_online", 1)])
    delivery_partners_collection.create_index([("active_order_id", 1)])
    orders_collection.create_index([("delivery_assignment.partner_id", 1)])
    orders_collection.create_index([("status", 1)])
    orders_collection.create_index([("createdAt", -1)])
    audit_logs_collection.create_index([("target_id", 1)])
except Exception:
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
