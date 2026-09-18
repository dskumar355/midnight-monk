"""Create the local demo account used by the delivery-partner portal."""

from database.db import delivery_partners_collection
from models.delivery_partner_model import create_delivery_partner
from utils.helpers import hash_password


DEMO_USERNAME = "rider1"
DEMO_PASSWORD = "rider123"


def seed_demo_delivery_partner():
    partner = create_delivery_partner(
        username=DEMO_USERNAME,
        password=hash_password(DEMO_PASSWORD),
        name="Aarav Rider",
        phone="9876543210",
        vehicle_number="DL 01 MNM 101",
    )

    result = delivery_partners_collection.update_one(
        {"username": DEMO_USERNAME},
        {"$setOnInsert": partner},
        upsert=True,
    )

    if result.upserted_id:
        print(f"Created demo delivery partner: {DEMO_USERNAME}")
    else:
        print(f"Demo delivery partner already exists: {DEMO_USERNAME}")


if __name__ == "__main__":
    seed_demo_delivery_partner()
