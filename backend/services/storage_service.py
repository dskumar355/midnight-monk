"""Storage Service — Persistent Delivery Proof Photo Management

Supports:
1. Cloudinary CDN (when CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME is configured):
   Direct CDN storage, returns HTTPS URL, stores zero image bytes in MongoDB.
2. MongoDB GridFS (default fallback for Render without external storage):
   Streams binary chunks into dedicated `fs.files` & `fs.chunks` collections.
   Never bloats `orders` collection documents with large base64 strings.
   Survives Render container restarts with 100% data persistence on MongoDB Atlas.
"""
import os
from datetime import datetime
from bson import ObjectId

cloudinary_configured = False
try:
    import cloudinary
    import cloudinary.uploader
    if os.getenv("CLOUDINARY_URL") or os.getenv("CLOUDINARY_CLOUD_NAME"):
        cloudinary_configured = True
        print("☁️ Cloudinary storage configured for persistent uploads.")
except ImportError:
    pass

def save_delivery_proof_photo(order_id, file_bytes, filename, mime_type="image/jpeg"):
    """
    Save delivery proof image to Cloudinary (if configured) or MongoDB GridFS.
    Returns dict with storage metadata: { photo_url, storage_provider, gridfs_id, filename }.
    """
    if not file_bytes:
        return None, "No file bytes provided"

    # Option 1: Cloudinary CDN
    if cloudinary_configured:
        try:
            upload_result = cloudinary.uploader.upload(
                file_bytes,
                folder="midnight_monk/delivery_proofs",
                public_id=f"proof_{order_id}_{int(datetime.utcnow().timestamp())}",
                resource_type="image"
            )
            secure_url = upload_result.get("secure_url") or upload_result.get("url")
            return {
                "photo_url": secure_url,
                "storage_provider": "cloudinary",
                "gridfs_id": None,
                "filename": filename,
            }, None
        except Exception as e:
            print(f"⚠️ Cloudinary upload failed, falling back to GridFS: {e}")

    # Option 2: MongoDB GridFS (Isolated persistent binary storage in Atlas)
    try:
        from database.db import fs
        file_id = fs.put(
            file_bytes,
            filename=filename,
            content_type=mime_type,
            order_id=str(order_id),
            upload_date=datetime.utcnow()
        )
        return {
            "photo_url": f"/api/orders/{order_id}/delivery-proof-image",
            "storage_provider": "gridfs",
            "gridfs_id": str(file_id),
            "filename": filename,
        }, None
    except Exception as e:
        return None, f"GridFS storage failed: {e}"

def get_delivery_proof_stream(order):
    """
    Retrieve binary image data and mimetype from GridFS for an order.
    Returns (bytes_data, mimetype) or (None, None).
    """
    if not order or not order.get("delivery_proof"):
        return None, None

    proof = order["delivery_proof"]
    gridfs_id = proof.get("gridfs_id")

    if gridfs_id:
        try:
            from database.db import fs
            oid = ObjectId(gridfs_id) if ObjectId.is_valid(gridfs_id) else gridfs_id
            grid_out = fs.get(oid)
            return grid_out.read(), getattr(grid_out, "content_type", None) or "image/jpeg"
        except Exception as e:
            print(f"⚠️ GridFS read error: {e}")

    # Fallback to stored base64 if legacy order
    photo_data = proof.get("photo_data")
    if photo_data:
        import base64
        if "base64," in photo_data:
            _, encoded = photo_data.split("base64,", 1)
            return base64.b64decode(encoded), "image/jpeg"
        return base64.b64decode(photo_data), "image/jpeg"

    return None, None
