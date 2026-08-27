import { useState } from "react";
import { useSupport } from "../context/SupportContext";

export default function SupportWidget({ senderName, senderType = "user" }) {
  const { createTicket } = useSupport();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("form");
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
      <button
        style={{
          ...styles.floatBtn,
          background: isOpen ? "linear-gradient(135deg, #9F4F2D, #C9783E)" : "linear-gradient(135deg, #D99A5E, #C9783E)",
          borderColor: isOpen ? "rgba(255,255,255,0.2)" : "rgba(159,79,45,0.18)",
          boxShadow: "0 14px 28px rgba(159,79,45,0.18)",
          color: "#fff8f0",
        }}
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        title="Support"
      >
        <span style={{ fontSize: "18px" }}>{isOpen ? "✕" : "☾"}</span>
        <span style={styles.floatLabel}>{isOpen ? "Close" : "Concierge"}</span>
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderLeft}>
              <div style={styles.panelIcon}>👑</div>
              <div>
                <p style={styles.panelTitle}>CONTACT SUPPORT</p>
                <p style={styles.panelSub}>We’ll get back to you shortly</p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={handleClose}>✕</button>
          </div>

          {step === "form" ? (
            <div style={styles.panelBody}>
              <div style={styles.senderBadge}>
                <span style={styles.senderIcon}>{senderType === "admin" ? "🍳" : "👤"}</span>
                <span style={styles.senderName}>
                  {senderName || "Anonymous"} &nbsp;·&nbsp;
                  <span style={styles.senderType}>{senderType === "admin" ? "Kitchen Admin" : "User"}</span>
                </span>
              </div>

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

              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span>
                  <span style={styles.errorText}>{error}</span>
                </div>
              )}

              <button style={styles.submitBtn} onClick={handleSubmit}>
                🚀 SEND TO MASTER ADMIN
              </button>
            </div>
          ) : (
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
              <button style={styles.doneBtn} onClick={handleClose}>DONE</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const styles = {
  floatBtn: {
    position: "fixed",
    bottom: "30px",
    right: "24px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.35)",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(0,0,0,0.25)",
    transition: "all 0.2s ease",
    fontFamily: "'Segoe UI', sans-serif",
    gap: "6px",
  },
  floatLabel: {
    display: "none",
  },

  panel: {
    position: "fixed",
    bottom: "98px",
    right: "24px",
    zIndex: 999,
    width: "340px",
    backgroundColor: "#fffaf3",
    borderRadius: "18px",
    boxShadow: "0 18px 40px rgba(159,79,45,0.12)",
    border: "1.5px solid rgba(159,79,45,0.12)",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
  },
  panelHeader: {
    backgroundColor: "#29231E",
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
    backgroundColor: "#362C27",
    border: "2px solid #C9783E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#FFF8F0",
    letterSpacing: "1px",
    fontWeight: "800",
  },
  panelSub: {
    margin: "3px 0 0",
    fontSize: "11px",
    color: "#d6c5b4",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    padding: 0,
    opacity: 0.8,
  },
  panelBody: {
    padding: "16px",
    backgroundColor: "#fffaf3",
  },
  senderBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#F3E5D0",
    border: "1px solid rgba(201,120,62,0.2)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "16px",
  },
  senderIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    fontSize: "12px",
  },
  senderName: {
    fontSize: "12px",
    color: "#2d2d2d",
    fontWeight: "700",
  },
  senderType: {
    color: "#C9783E",
    fontWeight: "800",
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.8px",
    color: "#6F6257",
    marginBottom: "8px",
  },
  categories: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  catBtn: {
    border: "1px solid rgba(159,79,45,0.12)",
    backgroundColor: "#f6efe5",
    color: "#473e37",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  catBtnActive: {
    backgroundColor: "#F3E5D0",
    borderColor: "#C9783E",
    color: "#8E4E2B",
  },
  textarea: {
    width: "100%",
    borderRadius: "10px",
    border: "1.5px solid rgba(159,79,45,0.12)",
    backgroundColor: "#f8f4ee",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#222",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "'Segoe UI', sans-serif",
  },
  charCount: {
    display: "block",
    textAlign: "right",
    color: "#7C7063",
    fontSize: "10px",
    marginTop: "4px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "#f7e7de",
    border: "1px solid rgba(183,103,83,0.2)",
    color: "#8E4A3A",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  errorText: {
    flex: 1,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#9F4F2D",
    color: "#fff8f0",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.6px",
    cursor: "pointer",
  },
  successBody: {
    padding: "18px 16px",
    textAlign: "center",
    backgroundColor: "#fffaf3",
  },
  successIcon: {
    fontSize: "36px",
    marginBottom: "10px",
  },
  successTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    fontWeight: "900",
    color: "#29231E",
  },
  successText: {
    margin: 0,
    fontSize: "12px",
    color: "#6F6257",
    lineHeight: 1.5,
  },
  ticketPreview: {
    textAlign: "left",
    backgroundColor: "#f8f4ee",
    border: "1px solid rgba(159,79,45,0.12)",
    borderRadius: "10px",
    padding: "12px",
    margin: "16px 0",
  },
  ticketPreviewLabel: {
    margin: "0 0 4px",
    fontSize: "10px",
    letterSpacing: "0.8px",
    color: "#7C7063",
    fontWeight: "800",
  },
  ticketPreviewValue: {
    margin: "0 0 12px",
    fontSize: "12px",
    color: "#29231E",
    wordBreak: "break-word",
  },
  doneBtn: {
    backgroundColor: "#C9783E",
    color: "#fff8f0",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    width: "100%",
  },
};