import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError("");
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    if (!cleanUser || !cleanPass) { setError("Username and password required"); return; }
    const res = await login(cleanUser, cleanPass);
    if (res.success) navigate("/kitchen-admin/dashboard");
    else {
      if (res.error?.includes("Failed to fetch") || res.error?.includes("NetworkError")) {
        setError("Backend is waking up (Render free tier). Please wait 15 seconds and try again.");
      } else {
        setError(res.error || "Login failed");
      }
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🍳</div>
        <h2 style={S.title}>Kitchen Admin</h2>
        <p style={S.sub}>Sign in to manage your kitchen</p>

        {/* Quick Demo Credentials */}
        <div style={{ background: "#fef9f0", border: "1px dashed #e2a855", borderRadius: "10px", padding: "10px 12px", fontSize: "12px" }}>
          <div style={{ fontWeight: "800", color: "#9c6317", marginBottom: "6px", fontSize: "11px", letterSpacing: "0.5px" }}>
            DEMO KITCHEN LOGINS (1-CLICK FILL):
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={() => { setUsername("admin1"); setPassword("1234"); setError(""); }}
              style={{ background: "#fff", border: "1px solid #e2a855", borderRadius: "6px", padding: "6px 10px", textAlign: "left", fontSize: "11px", cursor: "pointer", fontWeight: "600", color: "#333", display: "flex", justifyContent: "space-between" }}
            >
              <span>🍳 <b>Night Bites (k1)</b></span>
              <span style={{ color: "#e2a855", fontWeight: "700" }}>admin1 / 1234</span>
            </button>
            <button
              type="button"
              onClick={() => { setUsername("admin2"); setPassword("1234"); setError(""); }}
              style={{ background: "#fff", border: "1px solid #e2a855", borderRadius: "6px", padding: "6px 10px", textAlign: "left", fontSize: "11px", cursor: "pointer", fontWeight: "600", color: "#333", display: "flex", justifyContent: "space-between" }}
            >
              <span>🥘 <b>Midnight Meals (k2)</b></span>
              <span style={{ color: "#e2a855", fontWeight: "700" }}>admin2 / 1234</span>
            </button>
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>USERNAME</label>
          <input
            style={S.input}
            placeholder="e.g. admin1"
            value={username}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div style={S.field}>
          <label style={S.label}>PASSWORD</label>
          <input
            style={S.input}
            type="password"
            placeholder="Enter password"
            value={password}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleLogin()}
          />
        </div>
        {error && <div style={S.error}>⚠️ {error}</div>}
        <button style={{...S.btn, opacity: loading ? 0.7 : 1}} onClick={handleLogin} disabled={loading}>
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
        <button style={S.link} onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    </div>
  );
}

const S = {
  page:  {minHeight:"100vh",backgroundColor:"#f7f7f7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"},
  card:  {backgroundColor:"#fff",borderRadius:"20px",padding:"40px 36px",boxShadow:"0 10px 40px rgba(0,0,0,0.1)",width:"100%",maxWidth:"400px",display:"flex",flexDirection:"column",gap:"16px"},
  icon:  {fontSize:"40px",textAlign:"center"},
  title: {fontSize:"22px",fontWeight:"900",color:"#1a1a1a",margin:0,textAlign:"center"},
  sub:   {fontSize:"13px",color:"#888",margin:0,textAlign:"center"},
  field: {display:"flex",flexDirection:"column",gap:"6px"},
  label: {fontSize:"10px",fontWeight:"800",letterSpacing:"1px",color:"#333"},
  input: {border:"1.5px solid #e0e0e0",borderRadius:"8px",padding:"12px 14px",fontSize:"14px",outline:"none",fontFamily:"'Segoe UI',sans-serif"},
  error: {backgroundColor:"#fff5f5",border:"1px solid #fed7d7",borderRadius:"6px",padding:"10px",color:"#e53e3e",fontSize:"12px",fontWeight:"600"},
  btn:   {backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"14px",fontSize:"14px",fontWeight:"700",cursor:"pointer",letterSpacing:"1px",fontFamily:"'Segoe UI',sans-serif"},
  link:  {background:"none",border:"none",color:"#888",fontSize:"12px",cursor:"pointer",textDecoration:"underline",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"},
};