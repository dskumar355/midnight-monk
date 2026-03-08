import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={styles.page}>
      {/* LEFT SECTION */}
      <div style={styles.left}>
        {/* Logo + Brand */}
        <div style={styles.brandRow}>
          <img
            src="/monk-logo.png"
            alt="Midnight Monk"
            style={styles.logoImg}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div>
            <h1 style={styles.brandName}>MIDNIGHT MONK</h1>
            <p style={styles.tagline}>
              Late-Night Food Delivery,<br />Reimagined
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link to="/login" style={styles.ctaBtn}>
          GET STARTED
        </Link>
      </div>

      {/* RIGHT SECTION */}
      <div style={styles.right}>
        {/* Top Cards Row */}
        <div style={styles.cardRow}>
          <Link to="/menu" style={styles.card}>
            <div style={styles.cardIcons}>🍕🍟🍔</div>
            <p style={styles.cardLabel}>
              <strong>EXPLORE</strong><br />BEST SELLERS
            </p>
          </Link>
          <Link to="/login" style={styles.card}>
            <div style={styles.cardIcons}>📱</div>
            <p style={styles.cardLabel}>
              <strong>MAAN</strong><br />IT DORKS
            </p>
          </Link>
        </div>

        {/* How It Works */}
        <div style={styles.howItWorks}>
          <p style={styles.howTitle}>HOW IT WORKS</p>
          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepNum}>1</div>
              <p style={styles.stepText}>Scan your kitchen process</p>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNum}>2</div>
              <p style={styles.stepText}>View the online you means</p>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.step}>
              <div style={styles.stepNum}>3</div>
              <p style={styles.stepText}>Check the steps and practi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "100vh",
    padding: "60px 80px",
    backgroundColor: "#ffffff",
    fontFamily: "'Segoe UI', sans-serif",
    gap: "40px",
    boxSizing: "border-box",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    flex: 1,
    maxWidth: "380px",
  },
  brandRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "20px",
  },
  logoImg: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #f0f0f0",
  },
  brandName: {
    fontSize: "32px",
    fontWeight: "900",
    color: "#1a1a1a",
    margin: 0,
    letterSpacing: "1px",
    lineHeight: 1.1,
  },
  tagline: {
    fontSize: "16px",
    color: "#555",
    margin: "8px 0 0 0",
    lineHeight: 1.5,
    fontWeight: "400",
  },
  ctaBtn: {
    display: "inline-block",
    backgroundColor: "#F5A623",
    color: "#fff",
    padding: "16px 48px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "15px",
    letterSpacing: "1.5px",
    textAlign: "center",
    width: "fit-content",
    boxShadow: "0 4px 14px rgba(245,166,35,0.4)",
    transition: "background 0.2s, transform 0.1s",
  },
  right: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
    maxWidth: "480px",
  },
  cardRow: {
    display: "flex",
    flexDirection: "row",
    gap: "16px",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    border: "1.5px solid #e8e8e8",
    borderRadius: "14px",
    padding: "20px 16px",
    textAlign: "center",
    textDecoration: "none",
    color: "#1a1a1a",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.2s, transform 0.15s",
    cursor: "pointer",
  },
  cardIcons: {
    fontSize: "28px",
    marginBottom: "10px",
  },
  cardLabel: {
    fontSize: "13px",
    margin: 0,
    lineHeight: 1.5,
    color: "#222",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  howItWorks: {
    backgroundColor: "#fff",
    border: "1.5px solid #e8e8e8",
    borderRadius: "14px",
    padding: "24px 28px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  howTitle: {
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#333",
    margin: "0 0 18px 0",
    textTransform: "uppercase",
  },
  steps: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: "8px",
  },
  step: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  stepNum: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#F5A623",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: "11px",
    color: "#666",
    margin: 0,
    lineHeight: 1.4,
  },
  arrow: {
    fontSize: "18px",
    color: "#F5A623",
    fontWeight: "700",
    paddingTop: "6px",
    flexShrink: 0,
  },
};