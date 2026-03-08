import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useUserAuth();
  const [name, setName]     = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError]   = useState("");

  const handleLogin = async () => {
    setError("");
    if (!name.trim())          { setError("Please enter your name"); return; }
    if (mobile.length !== 10)  { setError("Mobile number must be 10 digits"); return; }
    const res = await login(name, mobile);
    if (res.success) navigate("/kitchens");
    else setError(res.error);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.left}>
          <img src="/monk.png" alt="Monk" style={S.img} onError={e => e.target.style.display="none"} />
          <div style={S.badge}><span>🌙</span><span style={S.badgeText}>Midnight Monk</span></div>
        </div>
        <div style={S.right}>
          <div style={S.brandRow}>
            <div style={S.avatar}>🌙</div>
            <div>
              <p style={S.brandName}>MIDNIGHT MONK</p>
              <p style={S.brandSub}>Welcome back!</p>
            </div>
          </div>
          <Field label="FULL NAME" icon="👤" value={name} onChange={setName} placeholder="Enter your name" />
          <Field label="MOBILE NUMBER" icon="📞" value={mobile} placeholder="10-digit mobile number"
            onChange={v => setMobile(v.replace(/\D/g,""))} maxLength={10}
            onKeyDown={e => e.key==="Enter" && handleLogin()} />
          {error && <div style={S.error}>⚠️ {error}</div>}
          <button style={{...S.btn, opacity: loading ? 0.7 : 1}} onClick={handleLogin} disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
          <div style={S.links}>
            <button style={S.link} onClick={() => navigate("/login/admin")}>Sign in as Kitchen Admin</button>
            <span style={{color:"#ccc"}}>|</span>
            <button style={S.link} onClick={() => navigate("/master/login")}>Sign in as Master Admin</button>
          </div>
          <div style={{textAlign:"center"}}>
            <button style={{...S.link, color:"#F5A623"}} onClick={() => navigate("/register")}>New user? Register here</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder, maxLength, onKeyDown }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      <label style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1px",color:"#333"}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",backgroundColor:"#f5f5f5",borderRadius:"8px",padding:"0 14px",border:"1.5px solid #ebebeb"}}>
        <span style={{fontSize:"15px",marginRight:"10px",opacity:0.5}}>{icon}</span>
        <input style={{flex:1,border:"none",background:"transparent",outline:"none",padding:"12px 0",fontSize:"14px",color:"#222",fontFamily:"'Segoe UI',sans-serif"}}
          placeholder={placeholder} value={value} maxLength={maxLength}
          onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} />
      </div>
    </div>
  );
}

const S = {
  page: {minHeight:"100vh",backgroundColor:"#f7f7f7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif",padding:"20px"},
  card: {borderRadius:"20px",boxShadow:"0 10px 40px rgba(0,0,0,0.12)",display:"flex",overflow:"hidden",width:"100%",maxWidth:"620px",minHeight:"420px"},
  left: {flex:"0 0 230px",position:"relative",overflow:"hidden"},
  img:  {width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"},
  badge:{position:"absolute",bottom:"14px",left:"50%",transform:"translateX(-50%)",backgroundColor:"rgba(15,15,26,0.75)",backdropFilter:"blur(6px)",border:"1px solid rgba(245,166,35,0.5)",borderRadius:"20px",padding:"5px 14px",display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"},
  badgeText:{fontSize:"11px",fontWeight:"700",color:"#F5A623",letterSpacing:"0.5px"},
  right:{flex:1,padding:"36px 32px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"16px",backgroundColor:"#ffffff"},
  brandRow:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"},
  avatar:{width:"38px",height:"38px",borderRadius:"50%",backgroundColor:"#fdf6ec",border:"2px solid #F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0},
  brandName:{fontSize:"12px",fontWeight:"900",color:"#1a1a1a",margin:0,letterSpacing:"1px"},
  brandSub:{fontSize:"11px",color:"#aaa",margin:"2px 0 0 0"},
  error:{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"#fff5f5",border:"1px solid #fed7d7",borderRadius:"6px",padding:"8px 12px",color:"#e53e3e",fontSize:"12px",fontWeight:"600"},
  btn:{backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"14px",fontSize:"14px",fontWeight:"700",letterSpacing:"1.5px",cursor:"pointer",width:"100%",boxShadow:"0 4px 14px rgba(245,166,35,0.4)",fontFamily:"'Segoe UI',sans-serif"},
  links:{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:"8px"},
  link:{background:"none",border:"none",color:"#888",fontSize:"11px",cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"'Segoe UI',sans-serif"},
};