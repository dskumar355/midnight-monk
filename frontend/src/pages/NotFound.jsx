import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function NotFound() {
    const t = useTheme();
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
            <h1 style={{ color: t.accent, fontSize: "72px", margin: "0 0 16px 0" }}>404</h1>
            <h2 style={{ color: t.text, margin: "0 0 8px 0" }}>Page Not Found</h2>
            <p style={{ color: t.subText, marginBottom: "24px" }}>Oops! The page you are looking for doesn't exist.</p>
            <button onClick={() => navigate("/")} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
                Go Home
            </button>
        </div>
    );
}
