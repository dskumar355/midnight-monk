import { useState } from "react";
import { api } from "../services/api";

// ── Star Rating Component ──
function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          style={{
            fontSize: "32px",
            cursor: disabled ? "default" : "pointer",
            transition: "transform 0.15s",
            transform: (hovered || value) >= star ? "scale(1.2)" : "scale(1)",
            filter: (hovered || value) >= star ? "none" : "grayscale(1) opacity(0.4)",
          }}
        >⭐</span>
      ))}
    </div>
  );
}

// ── Rating Modal ──
export default function RatingModal({ order, onClose, onSubmitted, t }) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const LABELS = ["", "Poor 😞", "Fair 🙂", "Good 😊", "Great 😄", "Amazing! 🤩"];

  const handleSubmit = async () => {
    if (!stars) { setError("Please select a star rating"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.submitRating({
        orderId: order.id,
        kitchenId: order.kitchenId,
        stars,
        review: review.trim(),
      });
      onSubmitted?.(res.avgRating);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: "20px",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: t.card, borderRadius: "24px", padding: "32px 28px",
        maxWidth: "400px", width: "100%", border: t.cardBorder,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        animation: "slideUp 0.3s ease",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⭐</div>
          <h2 style={{ fontSize: "20px", fontWeight: "900", color: t.text, margin: "0 0 6px 0" }}>
            Rate Your Order
          </h2>
          <p style={{ fontSize: "13px", color: t.subText, margin: 0 }}>
            How was your experience with <strong style={{ color: t.accent }}>
              {order.kitchenName || "the kitchen"}
            </strong>?
          </p>
        </div>

        {/* Stars */}
        <StarPicker value={stars} onChange={setStars} />
        {stars > 0 && (
          <p style={{ textAlign: "center", fontSize: "14px", fontWeight: "700", color: "#F5A623", margin: "10px 0 0 0" }}>
            {LABELS[stars]}
          </p>
        )}

        {/* Review Text */}
        <div style={{ margin: "20px 0" }}>
          <textarea
            placeholder="Tell us more... (optional)"
            value={review}
            onChange={e => setReview(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: "12px",
              border: `1.5px solid ${t.dark ? "#2a2a3e" : "#e0e0e0"}`,
              backgroundColor: t.bg, color: t.text, fontSize: "13px",
              fontFamily: "'Segoe UI', sans-serif", outline: "none",
              resize: "none", boxSizing: "border-box", lineHeight: 1.5,
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#e53e3e", fontSize: "12px", textAlign: "center", margin: "0 0 12px 0", fontWeight: "600" }}>
            ⚠️ {error}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", border: `1.5px solid ${t.dark ? "#2a2a3e" : "#e0e0e0"}`,
            borderRadius: "10px", backgroundColor: "transparent", color: t.subText,
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
            fontFamily: "'Segoe UI', sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !stars} style={{
            flex: 2, padding: "12px",
            background: stars ? "linear-gradient(135deg, #F5A623, #e67e22)" : "#ccc",
            border: "none", borderRadius: "10px", color: "#fff",
            fontSize: "13px", fontWeight: "800", cursor: stars ? "pointer" : "not-allowed",
            fontFamily: "'Segoe UI', sans-serif",
            boxShadow: stars ? "0 4px 14px rgba(245,166,35,0.4)" : "none",
          }}>
            {submitting ? "Submitting..." : "⭐ Submit Rating"}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
