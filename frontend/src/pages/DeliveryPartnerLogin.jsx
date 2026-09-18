import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeliveryAuth } from "../context/DeliveryAuthContext";

export default function DeliveryPartnerLogin() {
  const navigate = useNavigate();
  const { login, loading } = useDeliveryAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username || !password) return setError("Username and password required");
    const res = await login(username, password);
    if (res.success) navigate("/delivery");
    else setError(res.error);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🛵</div>
        <h2 style={S.title}>Delivery Partner</h2>
        <p style={S.sub}>Sign in to manage pickups, routes, and deliveries</p>
        <div style={S.demo}>
          <span>Demo account</span>
          <strong>rider1 / rider123</strong>
        </div>
        <input style={S.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input style={S.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        {error && <div style={S.error}>{error}</div>}
        <button style={S.btn} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #081420, #132a3b 58%, #f5a623)" },
  card: { width: "100%", maxWidth: "420px", background: "rgba(10,18,27,0.92)", color: "#fff7eb", borderRadius: "24px", padding: "34px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.28)" },
  icon: { fontSize: "44px", textAlign: "center" },
  title: { margin: 0, textAlign: "center", fontSize: "28px" },
  sub: { margin: 0, textAlign: "center", color: "#c8d2dc", fontSize: "13px" },
  demo: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "11px 12px", borderRadius: "12px", background: "rgba(245,166,35,0.12)", color: "#ffd486", fontSize: "12px" },
  input: { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", padding: "13px 14px", fontSize: "14px", outline: "none" },
  error: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.32)", color: "#fecaca", padding: "10px 12px", borderRadius: "10px", fontSize: "12px" },
  btn: { border: "none", borderRadius: "12px", background: "#f5a623", color: "#111", padding: "13px", fontWeight: "800", cursor: "pointer" },
};
