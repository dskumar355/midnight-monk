import { useState } from "react";
import { useSupport } from "../context/SupportContext";

export default function SupportWidget({ senderName, senderType = "user" }) {
  const { createTicket } = useSupport();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "success"
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const categories =
    senderType === "admin"
      ? ["Order Issue", "Menu Problem", "Payment", "Technical Bug", "Other"]
      : ["Order Issue", "Delivery Problem", "Payment", "App Bug", "Other"];

  const handleSubmit = () => {
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError("Please describe your issue (min 10 characters)");
      return;
    }
    createTicket({
      user: senderName || "Anonymous",
      senderType,
      category,
      message: message.trim(),
    });
    setStep("success");
    setError("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("form");
      setCategory("");
      setMessage("");
      setError("");
    }, 300);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        style={{
          ...styles.floatBtn,
          backgroundColor: isOpen ? "#e53e3e" : "#0f0f1a",
        }}
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        title="Support"
      >
        {isOpen ? "✕" : "🎧"}
        <span style={styles.floatLabel}>{isOpen ? "Close" : "Help"}</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={styles.panel}>
          {/* Panel Header */}
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderLeft}>
              <div style={styles.panelIcon}>👑</div>
              <div>
                <p style={styles.panelTitle}>CONTACT SUPPORT</p>
                <p style={styles.panelSub}>We'll get back to you shortly</p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={handleClose}>✕</button>
          </div>

          {step === "form" ? (
            <div style={styles.panelBody}>
              {/* Sender Info */}
              <div style={styles.senderBadge}>
                <span style={styles.senderIcon}>
                  {senderType === "admin" ? "🍳" : "👤"}
                </span>
                <span style={styles.senderName}>
                  {senderName || "Anonymous"} &nbsp;·&nbsp;
                  <span style={styles.senderType}>
                    {senderType === "admin" ? "Kitchen Admin" : "User"}
                  </span>
                </span>
              </div>

              {/* Category */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>ISSUE CATEGORY</label>
                <div style={styles.categories}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      style={{
                        ...styles.catBtn,
                        ...(category === cat ? styles.catBtnActive : {}),
                      }}
                      onClick={() => { setCategory(cat); setError(""); }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>DESCRIBE YOUR ISSUE</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Tell us what's going wrong... (min 10 characters)"
                  value={message}
                  rows={4}
                  onChange={(e) => { setMessage(e.target.value); setError(""); }}
                />
                <span style={styles.charCount}>{message.length} chars</span>
              </div>

              {/* Error */}
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span>
                  <span style={styles.errorText}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button style={styles.submitBtn} onClick={handleSubmit}>
                🚀 SEND TO MASTER ADMIN
              </button>
            </div>
          ) : (
            /* Success */
            <div style={styles.successBody}>
              <div style={styles.successIcon}>✅</div>
              <p style={styles.successTitle}>Ticket Submitted!</p>
              <p style={styles.successText}>
                Your query has been sent to the Master Admin. We'll resolve it shortly.
              </p>
              <div style={styles.ticketPreview}>
                <p style={styles.ticketPreviewLabel}>CATEGORY</p>
                <p style={styles.ticketPreviewValue}>{category}</p>
                <p style={styles.ticketPreviewLabel}>YOUR MESSAGE</p>
                <p style={styles.ticketPreviewValue}>{message}</p>
              </div>
              <button style={styles.doneBtn} onClick={handleClose}>
                DONE
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const styles = {
  // Floating button
  floatBtn: {
    position: "fixed",
    bottom: "90px",
    right: "28px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "12px 18px",
    borderRadius: "50px",
    border: "2px solid #F5A623",
    color: "#F5A623",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    transition: "background 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
  },
  floatLabel: {
    fontSize: "13px",
    letterSpacing: "0.5px",
  },

  // Panel
  panel: {
    position: "fixed",
    bottom: "155px",
    right: "28px",
    zIndex: 999,
    width: "340px",
    backgroundColor: "#fff",
    borderRadius: "18px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
    border: "1.5px solid #efefef",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
  },
  panelHeader: {
    backgroundColor: "#0f0f1a",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  panelIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#1a1a2e",
    border: "2px solid #F5A623",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  panelTitle: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#F5A623",
    letterSpacing: "1px",
    margin: 0,
  },
  panelSub: {
    fontSize: "10px",
    color: "#666",
    margin: "2px 0 0 0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Form body
  panelBody: {
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxHeight: "480px",
    overflowY: "auto",
  },
  senderBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    padding: "8px 12px",
    border: "1.5px solid #efefef",
  },
  senderIcon: { fontSize: "16px" },
  senderName: { fontSize: "12px", fontWeight: "600", color: "#333" },
  senderType: { color: "#F5A623", fontWeight: "700" },

  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "10px", fontWeight: "800", letterSpacing: "1px", color: "#555" },

  categories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  catBtn: {
    backgroundColor: "#f5f5f5",
    border: "1.5px solid #e0e0e0",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#555",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
  catBtnActive: {
    backgroundColor: "#0f0f1a",
    border: "1.5px solid #F5A623",
    color: "#F5A623",
  },

  textarea: {
    width: "100%",
    border: "1.5px solid #e8e8e8",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#333",
    outline: "none",
    resize: "vertical",
    fontFamily: "'Segoe UI', sans-serif",
    backgroundColor: "#fafafa",
    boxSizing: "border-box",
  },
  charCount: {
    fontSize: "10px",
    color: "#bbb",
    textAlign: "right",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#fff5f5",
    border: "1px solid #fed7d7",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  errorText: { color: "#e53e3e", fontSize: "12px", fontWeight: "600" },

  submitBtn: {
    backgroundColor: "#0f0f1a",
    color: "#F5A623",
    border: "2px solid #F5A623",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    width: "100%",
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Success
  successBody: {
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  successIcon: { fontSize: "44px" },
  successTitle: { fontSize: "16px", fontWeight: "800", color: "#1a1a1a", margin: 0 },
  successText: { fontSize: "12px", color: "#888", textAlign: "center", margin: 0, lineHeight: 1.6 },
  ticketPreview: {
    width: "100%",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    padding: "12px 14px",
    border: "1.5px solid #efefef",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  ticketPreviewLabel: { fontSize: "9px", fontWeight: "700", color: "#bbb", letterSpacing: "1px", margin: 0 },
  ticketPreviewValue: { fontSize: "12px", color: "#333", fontWeight: "600", margin: "0 0 6px 0" },
  doneBtn: {
    backgroundColor: "#F5A623",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 32px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
  },
};