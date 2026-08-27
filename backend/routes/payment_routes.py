from flask import Blueprint, request, jsonify
from database.db import orders_collection
from bson import ObjectId
from datetime import datetime
import hashlib
import hmac
import os
import json

payment_routes = Blueprint("payment_routes", __name__)

# ─────────────────────────────────────────
# Razorpay config (test keys by default)
# Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in env for production
# ─────────────────────────────────────────
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_demo123456789")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "demo_secret_key_for_testing")

def get_razorpay_client():
    """Get Razorpay client if SDK is installed, else return None."""
    try:
        import razorpay
        return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except ImportError:
        return None


# ─────────────────────────────────────────
# 💳 CREATE PAYMENT ORDER
# POST /api/payments/create-order
# Creates a Razorpay order or a mock order for testing
# ─────────────────────────────────────────
@payment_routes.route("/create-order", methods=["POST"])
def create_payment_order():
    data = request.json or {}
    amount = data.get("amount")  # in INR
    order_id = data.get("orderId", "")  # app's order ID

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    amount_paise = int(float(amount) * 100)  # Razorpay uses paise

    client = get_razorpay_client()
    if client:
        try:
            rz_order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"order_{order_id[-8:] if order_id else 'new'}",
                "payment_capture": 1,
            })
            return jsonify({
                "orderId": rz_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "keyId": RAZORPAY_KEY_ID,
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Mock order for demo/testing (no Razorpay SDK)
        mock_id = f"order_mock_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        return jsonify({
            "orderId": mock_id,
            "amount": amount_paise,
            "currency": "INR",
            "keyId": RAZORPAY_KEY_ID,
            "mock": True,
        }), 200


# ─────────────────────────────────────────
# ✅ VERIFY PAYMENT
# POST /api/payments/verify
# Verifies Razorpay payment signature or accepts mock
# ─────────────────────────────────────────
@payment_routes.route("/verify", methods=["POST"])
def verify_payment():
    data = request.json or {}
    razorpay_order_id = data.get("razorpay_order_id", "")
    razorpay_payment_id = data.get("razorpay_payment_id", "")
    razorpay_signature = data.get("razorpay_signature", "")
    app_order_id = data.get("appOrderId", "")
    payment_method = data.get("paymentMethod", "online")
    is_mock = data.get("mock", False)

    if is_mock or razorpay_order_id.startswith("order_mock_"):
        # Mock verification — always succeeds in test mode
        payment_record = {
            "appOrderId": app_order_id,
            "razorpayOrderId": razorpay_order_id,
            "razorpayPaymentId": razorpay_payment_id or f"pay_mock_{datetime.utcnow().strftime('%H%M%S')}",
            "paymentMethod": payment_method,
            "status": "captured",
            "verified": True,
            "mock": True,
            "createdAt": datetime.utcnow().isoformat(),
        }

        # Update order with payment info
        if app_order_id:
            try:
                orders_collection.update_one(
                    {"_id": ObjectId(app_order_id)},
                    {"$set": {
                        "payment": payment_record,
                        "paymentStatus": "paid",
                        "updatedAt": datetime.utcnow().isoformat(),
                    }}
                )
            except Exception:
                pass

        return jsonify({
            "verified": True,
            "message": "Payment verified (test mode)",
            "payment": payment_record,
        }), 200

    # Real Razorpay signature verification
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return jsonify({"error": "Missing payment details"}), 400

    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    verified = hmac.compare_digest(expected_signature, razorpay_signature)

    if verified:
        payment_record = {
            "appOrderId": app_order_id,
            "razorpayOrderId": razorpay_order_id,
            "razorpayPaymentId": razorpay_payment_id,
            "paymentMethod": payment_method,
            "status": "captured",
            "verified": True,
            "createdAt": datetime.utcnow().isoformat(),
        }

        if app_order_id:
            try:
                orders_collection.update_one(
                    {"_id": ObjectId(app_order_id)},
                    {"$set": {
                        "payment": payment_record,
                        "paymentStatus": "paid",
                        "updatedAt": datetime.utcnow().isoformat(),
                    }}
                )
            except Exception:
                pass

        return jsonify({
            "verified": True,
            "message": "Payment verified successfully",
            "payment": payment_record,
        }), 200
    else:
        return jsonify({"verified": False, "error": "Payment verification failed"}), 400


# ─────────────────────────────────────────
# 📊 GET PAYMENT STATUS
# GET /api/payments/status/<order_id>
# ─────────────────────────────────────────
@payment_routes.route("/status/<order_id>", methods=["GET"])
def payment_status(order_id):
    try:
        order = orders_collection.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return jsonify({"error": "Invalid order ID"}), 400

    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({
        "paymentStatus": order.get("paymentStatus", "pending"),
        "payment": order.get("payment", {}),
    }), 200
