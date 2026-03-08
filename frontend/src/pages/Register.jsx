import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    confirmMobile: "",
  });
  const [error, setError] = useState("");

  const handleRegister = () => {
    if (!form.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (form.mobile.length !== 10) {
      setError("Mobile number must be 10 digits");
      return;
    }
    if (form.mobile !== form.confirmMobile) {
      setError("Mobile numbers do not match");
      return;
    }
    // Navigate to login after registration
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Left — Illustration */}
        <div style={styles.illustrationSide}>
          <img
            src="/monk-logo.png"
            alt="Midnight Monk"
            style={styles.monkImg}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={styles.badge}>
            <span style={styles.badgeIcon}>🌙</span>
            <span style={styles.badgeText}>Midnight<br />Monk</span>
          </div>
        </div>

        {/* Right — Form */}
        <div style={styles.formSide}>
          {/* Brand */}
          <div style={styles.brandRow}>
            <div style={styles.brandAvatar}>🌙</div>
            <div>
              <p style={styles.brandName}>MIDNIGHT MONK</p>
              <p style={styles.brandSub}>Create your account</p>
            </div>
          </div>

          {/* Full Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>FULL NAME</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                style={styles.input}
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
              />
            </div>
          </div>

          {/* Mobile */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>MOBILE NUMBER</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📞</span>
              <input
                style={styles.input}
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.mobile}
                onChange={(e) => { setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") }); setError(""); }}
              />
            </div>
          </div>

          {/* Confirm Mobile */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>CONFIRM MOBILE</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📞</span>
              <input
                style={styles.input}
                placeholder="Re-enter mobile number"
                maxLength={10}
                value={form.confirmMobile}
                onChange={(e) => { setForm({ ...form, confirmMobile: e.target.value.replace(/\D/g, "") }); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Register Button */}
          <button style={styles.registerBtn} onClick={handleRegister}>
            CREATE ACCOUNT
          </button>

          {/* Login Link */}
          <div style={styles.loginRow}>
            <span style={styles.loginText}>Already have an account?</span>
            <button style={styles.loginLink} onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f7f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    width: "100%",
    maxWidth: "620px",
    minHeight: "400px",
  },
  illustrationSide: {
    backgroundColor: "#fdf6ec",
    flex: "0 0 220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "30px 20px",
  },
  monkImg: {
    width: "160px",
    height: "180px",
    objectFit: "contain",
  },
  badge: {
    position: "absolute",
    bottom: "28px",
    right: "18px",
    backgroundColor: "#1a1a2e",
    borderRadius: "10px",
    padding: "6px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#fff",
    lineHeight: 1.4,
  },
  badgeIcon: { fontSize: "14px", marginBottom: "2px" },
  badgeText: { fontSize: "9px", fontWeight: "700", textAlign: "center", letterSpacing: "0.5px" },
  formSide: {
    flex: 1,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "16px",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "4px",
  },
  brandAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#fdf6ec",
    border: "2px solid #F5A623",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  brandName: { fontSize: "13px", fontWeight: "900", color: "#1a1a1a", margin: 0, letterSpacing: "1px" },
  brandSub: { fontSize: "11px", color: "#999", margin: "2px 0 0 0" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "10px", fontWeight: "800", letterSpacing: "1px", color: "#333", textTransform: "uppercase" },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    padding: "0 14px",
    border: "1.5px solid #ebebeb",
  },
  inputIcon: { fontSize: "14px", marginRight: "10px", opacity: 0.5 },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    padding: "11px 0",
    fontSize: "14px",
    color: "#222",
    fontFamily: "'Segoe UI', sans-serif",
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
  registerBtn: {
    backgroundColor: "#F5A623",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 14px rgba(245,166,35,0.35)",
    fontFamily: "'Segoe UI', sans-serif",
    marginTop: "4px",
  },
  loginRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  loginText: { fontSize: "12px", color: "#888" },
  loginLink: {
    background: "none",
    border: "none",
    color: "#F5A623",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    padding: 0,
    fontFamily: "'Segoe UI', sans-serif",
    textDecoration: "underline",
  },
};