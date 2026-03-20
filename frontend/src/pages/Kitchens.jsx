import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";
import Skeleton from "../components/Skeleton";

export default function Kitchens() {
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();
  const t = useTheme();
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    api.getKitchens()
      .then(data => setKitchens(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectKitchen = (kitchen) => {
    localStorage.setItem("selectedKitchen", kitchen.kitchen_id);
    localStorage.setItem("selectedKitchenName", kitchen.name);
    navigate("/menu");
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setError("");
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          setFilterMode("nearby");
          setKitchens(prev => [...prev].sort(() => Math.random() - 0.5)); // Simulate sorting by distance
          setLoading(false);
        },
        () => {
          setError("Location access denied. Showing all kitchens.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading && kitchens.length === 0) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <Navbar title="Midnight Monk" onLogout={handleLogout} />
      <div style={{ padding: "28px 24px" }}>
        <Skeleton height="30px" width="150px" style={{ marginBottom: "8px" }} />
        <Skeleton height="15px" width="200px" style={{ marginBottom: "28px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "900px" }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height="120px" borderRadius="16px" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <Navbar
        title="Midnight Monk"
        onLogout={handleLogout}
        rightContent={
          <button onClick={() => navigate("/orders")} style={{
            backgroundColor: t.accent, color: "#fff", border: "none",
            borderRadius: "8px", padding: "6px 14px", fontSize: "12px",
            fontWeight: "700", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif",
          }}>
            📦 My Orders
          </button>
        }
      />

      <div style={{ padding: "28px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: t.text, margin: "0 0 4px 0" }}>
            Hey {user?.name?.split(" ")[0] || "there"} 👋
          </h2>
          <p style={{ color: t.subText, margin: "0 0 16px 0", fontSize: "14px" }}>Choose your kitchen for tonight</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setFilterMode("all"); api.getKitchens().then(setKitchens); }} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", backgroundColor: filterMode === "all" ? t.accent : (t.dark ? "#2a2a3e" : "#e0e0e0"), color: filterMode === "all" ? "#fff" : t.text, cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>All Kitchens</button>
            <button onClick={requestLocation} style={{ padding: "6px 14px", borderRadius: "20px", border: "none", backgroundColor: filterMode === "nearby" ? t.accent : (t.dark ? "#2a2a3e" : "#e0e0e0"), color: filterMode === "nearby" ? "#fff" : t.text, cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>📍 Nearby Me</button>
          </div>
        </div>

        {error && <div style={{ color: t.danger, marginBottom: "16px" }}>❌ {error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "900px" }}>
          {kitchens.map(k => (
            <div key={k.id} onClick={() => selectKitchen(k)} style={{
              backgroundColor: t.card, borderRadius: "16px", padding: "20px",
              cursor: "pointer", border: t.cardBorder, boxShadow: t.shadow,
              transition: "transform 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <span style={{ fontSize: "32px" }}>🍽️</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: t.text, margin: "0 0 4px 0" }}>{k.name}</h3>
                  <p style={{ fontSize: "12px", color: t.accent, margin: 0 }}>{k.tag}</p>
                </div>
                <div style={{ backgroundColor: "#e6f9f0", color: "#27ae60", fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "6px" }}>OPEN</div>
              </div>
              <div style={{ display: "flex", gap: "16px", borderTop: `1px solid ${t.dark ? "#2a2a3e" : "#f0f0f0"}`, paddingTop: "12px" }}>
                <span style={{ fontSize: "13px", color: t.subText }}>⭐ {k.rating}</span>
                {k.location && <span style={{ fontSize: "13px", color: t.mutedText }}>📍 {k.location}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}