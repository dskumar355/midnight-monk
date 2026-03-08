import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SupportWidget from "../components/SupportWidget";
import { useUserAuth } from "../context/UserAuthContext";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { user } = useUserAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>🌙</div>
          <p style={styles.brandName}>Midnight Monk</p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        <div style={{
          ...styles.card,
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}>

          {/* Success Icon */}
          <div style={styles.iconRing}>
            <div style={styles.iconInner}>🎉</div>
          </div>

          {/* Text */}
          <h1 style={styles.title}>ORDER PLACED!</h1>
          <p style={styles.subtitle}>
            Your delicious food is being prepared by our kitchen.
          </p>

          {/* Info Pills */}
          <div style={styles.infoPills}>
            <div style={styles.pill}>
              <span style={styles.pillIcon}>🕐</span>
              <div>
                <p style={styles.pillLabel}>ESTIMATED TIME</p>
                <p style={styles.pillValue}>15–20 minutes</p>
              </div>
            </div>
            <div style={styles.pill}>
              <span style={styles.pillIcon}>🛵</span>
              <div>
                <p style={styles.pillLabel}>STATUS</p>
                <p style={styles.pillValue}>Preparing your order</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Buttons */}
          <div style={styles.actions}>
            <button
              style={styles.primaryBtn}
              onClick={() => navigate("/orders")}
            >
              📦 TRACK MY ORDER
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate("/kitchens")}
            >
              🍽️ ORDER MORE FOOD
            </button>
          </div>
        </div>

        {/* Decorative Steps */}
        <div style={{
          ...styles.stepsRow,
          opacity: show ? 1 : 0,
          transition: "opacity 0.7s ease 0.3s",
        }}>
          {[
            { icon: "✅", label: "Order Placed" },
            { icon: "👨‍🍳", label: "Being Prepared" },
            { icon: "🛵", label: "Out for Delivery" },
            { icon: "🏠", label: "Delivered" },
          ].map((step, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepCircle,
                backgroundColor: i === 0 ? "#F5A623" : "#f0f0f0",
                color: i === 0 ? "#fff" : "#bbb",
              }}>
                {step.icon}
              </div>
              <p style={{
                ...styles.stepLabel,
                color: i === 0 ? "#F5A623" : "#bbb",
                fontWeight: i === 0 ? "700" : "500",
              }}>
                {step.label}
              </p>
              {i < 3 && <div style={styles.stepConnector} />}
              <SupportWidget senderName={user?.name} senderType="user" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f7f7",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#fff",
    borderBottom: "1.5px solid #efefef",
    padding: "16px 40px",
    display: "flex",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#fdf6ec",
    border: "2px solid #F5A623",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  brandName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    gap: "28px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    border: "1.5px solid #efefef",
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
    padding: "44px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    maxWidth: "460px",
    width: "100%",
    textAlign: "center",
  },
  iconRing: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    backgroundColor: "#fff8ee",
    border: "3px solid #F5A623",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 8px #fdf6ec",
  },
  iconInner: {
    fontSize: "38px",
    lineHeight: 1,
  },
  title: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#1a1a1a",
    margin: 0,
    letterSpacing: "1.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
    lineHeight: 1.6,
    maxWidth: "300px",
  },
  infoPills: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    width: "100%",
  },
  pill: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fdf6ec",
    borderRadius: "12px",
    padding: "14px 16px",
    border: "1.5px solid #fde8b8",
    textAlign: "left",
  },
  pillIcon: { fontSize: "22px", flexShrink: 0 },
  pillLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#bbb",
    letterSpacing: "1px",
    margin: 0,
    textTransform: "uppercase",
  },
  pillValue: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "3px 0 0 0",
  },
  divider: {
    height: "1px",
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  primaryBtn: {
    backgroundColor: "#F5A623",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 14px rgba(245,166,35,0.35)",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    border: "1.5px solid #e0e0e0",
    color: "#555",
    borderRadius: "10px",
    padding: "13px",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    cursor: "pointer",
    width: "100%",
  },

  // Steps row
  stepsRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "0px",
    position: "relative",
    maxWidth: "460px",
    width: "100%",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    position: "relative",
  },
  stepCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    zIndex: 1,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: "11px",
    margin: 0,
    textAlign: "center",
    letterSpacing: "0.3px",
  },
  stepConnector: {
    position: "absolute",
    top: "22px",
    left: "calc(50% + 22px)",
    width: "calc(100% - 44px)",
    height: "2px",
    backgroundColor: "#e0e0e0",
    zIndex: 0,
  },
};
