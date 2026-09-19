from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from config import Config

from routes.auth_routes import auth_routes
from routes.kitchen_routes import kitchen_routes
from routes.menu_routes import menu_routes
from routes.order_routes import order_routes
from routes.admin_routes import admin_routes
from routes.rating_routes import rating_routes
from routes.coupon_routes import coupon_routes
from routes.payment_routes import payment_routes
from routes.security_routes import security_routes
from routes.notification_routes import notification_routes
from utils.security import add_security_headers
import os
from flask import send_from_directory, jsonify

app = Flask(__name__)
app.config.from_object(Config)

# Upload directory setup
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "delivery_proofs")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ✅ CORS — restrict to allowed origins
CORS(app, resources={r"/api/*": {"origins": app.config.get("ALLOWED_ORIGINS", "*")}})

# ✅ Socket.IO — real-time order status updates
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    logger=False,
    engineio_logger=False,
)

# ✅ Rate Limiter
from utils.limiter import limiter
limiter.init_app(app)

# ✅ Register blueprints
app.register_blueprint(auth_routes,         url_prefix="/api/auth")
app.register_blueprint(kitchen_routes,      url_prefix="/api/kitchens")
app.register_blueprint(menu_routes,         url_prefix="/api/menu")
app.register_blueprint(order_routes,        url_prefix="/api/orders")
app.register_blueprint(admin_routes,        url_prefix="/api/admin")
app.register_blueprint(rating_routes,       url_prefix="/api/ratings")
app.register_blueprint(coupon_routes,       url_prefix="/api/coupons")
app.register_blueprint(payment_routes,      url_prefix="/api/payments")
app.register_blueprint(security_routes,     url_prefix="/api/security")
app.register_blueprint(notification_routes, url_prefix="/api/notifications")

# Serve uploaded delivery proof photos
@app.route("/api/uploads/delivery_proofs/<path:filename>")
def serve_delivery_proof(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.after_request
def apply_security_headers(response):
    return add_security_headers(response)

# ─────────────────────────────────────────
# 🔌 SOCKET.IO EVENTS
# ─────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    pass  # client connected

@socketio.on("join_order")
def on_join_order(data):
    """Client joins a room named after their order ID to receive live updates."""
    order_id = data.get("orderId")
    if order_id:
        join_room(f"order_{order_id}")

@socketio.on("join_kitchen")
def on_join_kitchen(data):
    """Kitchen admin joins their kitchen room to get notified of new orders."""
    kitchen_id = data.get("kitchenId")
    if kitchen_id:
        join_room(f"kitchen_{kitchen_id}")

# ─────────────────────────────────────────
# 📣 Helper — broadcast order status update
# Called from order_routes after status change
# ─────────────────────────────────────────
def emit_order_update(order_id, status, kitchen_id=None):
    """Emit real-time order status update to all subscribers."""
    payload = {"orderId": order_id, "status": status}
    socketio.emit("order_status_update", payload, room=f"order_{order_id}")
    if kitchen_id:
        socketio.emit("kitchen_order_update", payload, room=f"kitchen_{kitchen_id}")

def emit_rider_location(order_id, tracking_payload):
    """Emit live GPS coordinate update to customer tracking room."""
    socketio.emit("rider_location_update", tracking_payload, room=f"order_{order_id}")

# Make emit helpers available to other modules
app.emit_order_update = emit_order_update
app.emit_rider_location = emit_rider_location

# ─────────────────────────────────────────
# 🌐 Health check endpoints
# ─────────────────────────────────────────
@app.route("/")
def home():
    return {"message": "🌙 Midnight Monk Backend Running", "status": "ok", "socketio": "enabled"}

@app.route("/api/health")
@app.route("/health")
def health_check():
    from datetime import datetime
    from database.db import client
    db_status = "connected"
    try:
        client.admin.command("ping")
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    is_healthy = db_status == "connected"
    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": "Midnight Monk API",
        "database": db_status,
        "socketio": "enabled",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }, 200 if is_healthy else 503

@app.errorhandler(404)
def not_found(e):
    return {"error": "Route not found"}, 404

@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal server error"}, 500

if __name__ == "__main__":
    socketio.run(app, debug=True, port=8000, host="0.0.0.0", allow_unsafe_werkzeug=True, use_reloader=True)