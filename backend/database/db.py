from pymongo import MongoClient
from config import Config

# ✅ Connect to MongoDB Atlas using Config class
client = MongoClient(Config.MONGO_URI)
db = client[Config.DATABASE_NAME]

# ✅ Collections — one for each data type
users_collection        = db["users"]
admins_collection       = db["admins"]
kitchens_collection     = db["kitchens"]
menu_collection         = db["menu"]
orders_collection       = db["orders"]
support_collection      = db["support"]
master_admins_collection = db["master_admins"]

def ping_db():
    """Test MongoDB connection on startup"""
    try:
        client.admin.command("ping")
        print("✅ MongoDB Atlas connected successfully!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# ✅ Ping on import
ping_db()