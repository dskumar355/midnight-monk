import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ title, backPath, backLabel, onLogout, rightContent }) {
  const navigate = useNavigate();
  const t = useTheme();

  return (
    <div style={{
      backgroundColor: t.navBg,
      borderBottom: t.navBorder,
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: t.shadow,
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Left — back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {backPath && (
          <button onClick={() => navigate(backPath)} style={{
            background: "none", border: `1.5px solid ${t.cardBorder.split(" ")[2]}`,
            borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
            fontSize: "12px", color: t.subText, fontFamily: "'Segoe UI', sans-serif",
          }}>
            ← {backLabel || "Back"}
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🌙</span>
          <span style={{ fontSize: "15px", fontWeight: "800", color: t.text, letterSpacing: "0.5px" }}>
            {title || "Midnight Monk"}
          </span>
        </div>
      </div>

      {/* Right — extra content + theme toggle + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {rightContent}

        {/* Dark/Light Toggle */}
        <button onClick={t.toggle} style={{
          backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0",
          border: "none", borderRadius: "20px",
          padding: "6px 14px", cursor: "pointer",
          fontSize: "13px", fontWeight: "700",
          color: t.text, fontFamily: "'Segoe UI', sans-serif",
          display: "flex", alignItems: "center", gap: "6px",
          transition: "all 0.2s",
        }}>
          {t.dark ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* Logout */}
        {onLogout && (
          <button onClick={onLogout} style={{
            backgroundColor: "transparent",
            border: "1.5px solid #e53e3e",
            color: "#e53e3e", borderRadius: "8px",
            padding: "6px 14px", fontWeight: "700",
            fontSize: "12px", cursor: "pointer",
            fontFamily: "'Segoe UI', sans-serif",
            letterSpacing: "0.5px",
          }}>
            LOGOUT
          </button>
        )}
      </div>
    </div>
  );
}