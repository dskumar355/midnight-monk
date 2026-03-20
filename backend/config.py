import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ✅ MongoDB Atlas
    MONGO_URI = os.getenv(
        "MONGO_URI",
        "mongodb+srv://Saikumar0319:sai123@midnightmonk.w63vctf.mongodb.net/?appName=midnightmonk"
    )
    DATABASE_NAME = os.getenv("DATABASE_NAME", "midnight_monk")

    # ✅ JWT Secret
    SECRET_KEY = os.getenv("SECRET_KEY", "midnightmonksecret_changeme_in_production")

    # ✅ JWT expiry (in seconds) — 7 days
    JWT_EXPIRY = 60 * 60 * 24 * 7

    # ✅ Environment
    DEBUG = os.getenv("FLASK_ENV", "development") == "development"

    # ✅ CORS Origins
    _origins = os.getenv("ALLOWED_ORIGINS", "*")
    ALLOWED_ORIGINS = _origins if _origins == "*" else _origins.split(",")
