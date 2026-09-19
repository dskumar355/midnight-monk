import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterAuth } from "../context/MasterAuthContext";

export default function MasterAdminLogin() {
  const navigate = useNavigate();
  const { login, loading } = useMasterAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError("");
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    if (!cleanUser || !cleanPass) { setError("Username and password required"); return; }
    const res = await login(cleanUser, cleanPass);
    if (res.success) navigate("/master-admin/dashboard");
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
        <div style={S.icon}>👑</div>
        <h2 style={S.title}>Master Admin</h2>
        <p style={S.sub}>Full system access</p>

        {/* Quick Demo Credentials */}
        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px dashed rgba(245,166,35,0.3)", borderRadius: "10px", padding: "10px 12px", fontSize: "12px" }}>
          <div style={{ fontWeight: "800", color: "#F5A623", marginBottom: "6px", fontSize: "11px", letterSpacing: "0.5px" }}>
            DEMO MASTER LOGIN (1-CLICK FILL):
          </div>
          <button
            type="button"
            onClick={() => { setUsername("master"); setPassword("master123"); setError(""); }}
            style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "6px", padding: "7px 10px", textAlign: "left", fontSize: "11px", cursor: "pointer", fontWeight: "600", color: "#fff", display: "flex", justifyContent: "space-between" }}
          >
            <span>👑 <b>Platform Admin</b></span>
            <span style={{ color: "#F5A623", fontWeight: "700" }}>master / master123</span>
          </button>
        </div>

        <div style={S.field}>
          <label style={S.label}>USERNAME</label>
          <input
            style={S.input}
            placeholder="master"
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
  page:  {minHeight:"100vh",backgroundColor:"#FFFCF8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"},
  card:  {backgroundColor:"#1a1a2e",border:"1px solid rgba(245,166,35,0.3)",borderRadius:"20px",padding:"40px 36px",width:"100%",maxWidth:"400px",display:"flex",flexDirection:"column",gap:"16px",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"},
  icon:  {fontSize:"40px",textAlign:"center"},
  title: {fontSize:"22px",fontWeight:"900",color:"#fff",margin:0,textAlign:"center"},
  sub:   {fontSize:"13px",color:"rgba(255,255,255,0.4)",margin:0,textAlign:"center"},
  field: {display:"flex",flexDirection:"column",gap:"6px"},
  label: {fontSize:"10px",fontWeight:"800",letterSpacing:"1px",color:"rgba(255,255,255,0.5)"},
  input: {backgroundColor:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"12px 14px",fontSize:"14px",outline:"none",color:"#fff",fontFamily:"'Segoe UI',sans-serif"},
  error: {backgroundColor:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.3)",borderRadius:"6px",padding:"10px",color:"#e74c3c",fontSize:"12px",fontWeight:"600"},
  btn:   {backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"14px",fontSize:"14px",fontWeight:"700",cursor:"pointer",letterSpacing:"1px",fontFamily:"'Segoe UI',sans-serif"},
  link:  {background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"12px",cursor:"pointer",textDecoration:"underline",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"},
};
