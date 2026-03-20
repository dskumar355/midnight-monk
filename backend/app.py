from flask import Flask
from flask_cors import CORS
from config import Config

from routes.auth_routes import auth_routes
from routes.kitchen_routes import kitchen_routes
from routes.menu_routes import menu_routes
from routes.order_routes import order_routes
from routes.admin_routes import admin_routes

app = Flask(__name__)
app.config.from_object(Config)

# ✅ CORS fix — restrict to allowed origins
CORS(app, resources={r"/api/*": {"origins": app.config.get("ALLOWED_ORIGINS", "*")}})

# ✅ Rate Limiter Setup (Protection against brute force)
from utils.limiter import limiter
limiter.init_app(app)

app.register_blueprint(auth_routes,    url_prefix="/api/auth")
app.register_blueprint(kitchen_routes, url_prefix="/api/kitchens")
app.register_blueprint(menu_routes,    url_prefix="/api/menu")
app.register_blueprint(order_routes,   url_prefix="/api/orders")
app.register_blueprint(admin_routes,   url_prefix="/api/admin")

@app.route("/")
def home():
    return {"message": "🌙 Midnight Monk Backend Running", "status": "ok"}

@app.errorhandler(404)
def not_found(e):
    return {"error": "Route not found"}, 404

@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal server error"}, 500

if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")