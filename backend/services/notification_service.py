"""Notification Service — handles email and SMS notifications.

This module provides a pluggable notification system.
Currently uses console logging as a fallback.
For production, configure:
- TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE for SMS
- SENDGRID_API_KEY, FROM_EMAIL for email
"""
import os
from datetime import datetime

# ─── SMS via Twilio (optional) ───
def send_sms(to_phone, message):
    """Send SMS notification. Falls back to console log if Twilio not configured."""
    twilio_sid = os.getenv("TWILIO_SID")
    twilio_token = os.getenv("TWILIO_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE")
    
    if twilio_sid and twilio_token and twilio_phone:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            client.messages.create(
                body=message,
                from_=twilio_phone,
                to=f"+91{to_phone}"
            )
            print(f"📱 SMS sent to {to_phone}: {message[:50]}...")
            return True
        except Exception as e:
            print(f"⚠️ SMS failed: {e}")
            return False
    else:
        # Fallback: log to console
        print(f"📱 [SMS LOG] To: +91{to_phone} | {message}")
        return True


# ─── Email via SendGrid (optional) ───
def send_email(to_email, subject, body_html):
    """Send email notification. Falls back to console log if SendGrid not configured."""
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("FROM_EMAIL", "noreply@midnightmonk.com")
    
    if sendgrid_key:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            sg = sendgrid.SendGridAPIClient(api_key=sendgrid_key)
            mail = Mail(
                from_email=Email(from_email),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", body_html)
            )
            sg.client.mail.send.post(request_body=mail.get())
            print(f"📧 Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            print(f"⚠️ Email failed: {e}")
            return False
    else:
        print(f"📧 [EMAIL LOG] To: {to_email} | Subject: {subject}")
        return True


# ─── Order Notification Templates ───
def notify_order_placed(user_phone, user_name, order_id, total):
    """Notify user that their order has been placed."""
    msg = f"🌙 Hi {user_name}! Your Midnight Monk order #{order_id[-6:].upper()} for ₹{total:.0f} has been placed. Track it in the app!"
    send_sms(user_phone, msg)

def notify_order_status(user_phone, user_name, order_id, status):
    """Notify user of order status change."""
    status_msgs = {
        "Preparing": f"🍳 {user_name}, your order #{order_id[-6:].upper()} is now being prepared!",
        "Out for Delivery": f"🛵 {user_name}, your order #{order_id[-6:].upper()} is out for delivery!",
        "Delivered": f"✅ {user_name}, your order #{order_id[-6:].upper()} has been delivered. Enjoy! 🌙",
    }
    msg = status_msgs.get(status, f"📦 Order #{order_id[-6:].upper()} status: {status}")
    send_sms(user_phone, msg)

def notify_kitchen_new_order(kitchen_name, order_id, items_count, total):
    """Log new order notification for kitchen (would be push notification in production)."""
    print(f"🔔 [KITCHEN] New order #{order_id[-6:].upper()} at {kitchen_name}: {items_count} items, ₹{total:.0f}")
