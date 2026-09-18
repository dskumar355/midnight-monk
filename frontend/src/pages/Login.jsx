import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useUserAuth();
  const [name, setName]     = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError]   = useState("");

  const handleCardMove = (event) => {
    const card = event.currentTarget;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    card.style.setProperty("--my", `${(y + 0.5) * 100}%`);
    card.style.setProperty("--shadow-x", `${Math.round(x * 18)}px`);
    card.style.setProperty("--shadow-y", `${Math.round(10 + y * 14)}px`);
    card.style.setProperty("--rotate-x", `${(-y * 2.2).toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${(x * 2.2).toFixed(2)}deg`);
    card.classList.add("is-hovered");
  };

  // Standard login
  const handleLogin = async () => {
    setError("");
    if (!name.trim())          { setError("Please enter your name"); return; }
    if (mobile.length !== 10)  { setError("Mobile number must be 10 digits"); return; }
    const res = await login(name, mobile);
    if (res.success) {
      const redirectParam = new URLSearchParams(location.search).get("redirect");
      const target = location.state?.from || redirectParam || "/kitchens";
      navigate(target);
    } else {
      setError(res.error);
    }
  };

  return (
    <div style={S.page}>
      <div
        className="login-card"
        style={{ ...S.card, "--mx": "50%", "--my": "50%", "--shadow-x": "0px", "--shadow-y": "10px", "--rotate-x": "0deg", "--rotate-y": "0deg" }}
        onMouseMove={handleCardMove}
        onMouseLeave={(event) => {
          const card = event.currentTarget;
          card.classList.remove("is-hovered");
          card.style.setProperty("--shadow-x", "0px");
          card.style.setProperty("--shadow-y", "10px");
          card.style.setProperty("--rotate-x", "0deg");
          card.style.setProperty("--rotate-y", "0deg");
        }}
      >
        <div className="login-card-left" style={S.left}>
          <img src="/monk.png" alt="Monk" style={S.img} onError={e => e.target.style.display="none"} />
          <div style={S.badge}><span>🌙</span><span style={S.badgeText}>Midnight Monk</span></div>
        </div>
        <div className="login-card-right" style={S.right}>
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

          <div style={{textAlign:"center"}}>
            <button style={{...S.link, color:"#F5A623"}} onClick={() => navigate("/register", { state: location.state })}>New user? Register here</button>
          </div>
        </div>
      </div>
      <style>{`
        .login-card {
          box-shadow: var(--shadow-x) var(--shadow-y) 34px rgba(245,166,35,0.30), 0 0 0 1px rgba(245,166,35,0.20);
          transform: perspective(900px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
          transition: box-shadow 0.12s ease-out, transform 0.12s ease-out;
          isolation: isolate;
        }
        .login-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          background: radial-gradient(circle at var(--mx) var(--my), rgba(255,190,74,0.95) 0%, rgba(245,166,35,0.38) 20%, rgba(245,166,35,0.08) 48%, transparent 72%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0;
          z-index: 3;
          transition: opacity 0.12s ease-out;
        }
        .login-card.is-hovered::before { opacity: 1; }
        .login-card-left, .login-card-right { position: relative; z-index: 1; }
        @media (max-width: 640px) {
          .login-card {
            flex-direction: column;
            max-width: 430px;
            min-height: 0;
          }
          .login-card-left {
            flex: 0 0 170px !important;
          }
          .login-card-right {
            padding: 26px 20px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-card { transition: box-shadow 0.2s ease !important; }
          .login-card:hover { transform: none !important; }
        }
      `}</style>
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
  page: {minHeight:"100vh",backgroundColor:"#FFFCF8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif",padding:"20px"},
  card: {borderRadius:"20px",display:"flex",overflow:"hidden",width:"100%",maxWidth:"660px",minHeight:"420px",position:"relative"},
  left: {flex:"0 0 230px",position:"relative",overflow:"hidden"},
  img:  {width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"},
  badge:{position:"absolute",bottom:"14px",left:"50%",transform:"translateX(-50%)",backgroundColor:"rgba(15,15,26,0.75)",backdropFilter:"blur(6px)",border:"1px solid rgba(245,166,35,0.5)",borderRadius:"20px",padding:"5px 14px",display:"flex",alignItems:"center",gap:"6px",whiteSpace:"nowrap"},
  badgeText:{fontSize:"11px",fontWeight:"700",color:"#F5A623",letterSpacing:"0.5px"},
  right:{flex:1,padding:"32px 28px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"14px",backgroundColor:"#ffffff"},
  brandRow:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"2px"},
  avatar:{width:"38px",height:"38px",borderRadius:"50%",backgroundColor:"#fdf6ec",border:"2px solid #F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0},
  brandName:{fontSize:"12px",fontWeight:"900",color:"#1a1a1a",margin:0,letterSpacing:"1px"},
  brandSub:{fontSize:"11px",color:"#aaa",margin:"2px 0 0 0"},
  error:{display:"flex",alignItems:"center",gap:"8px",backgroundColor:"#fff5f5",border:"1px solid #fed7d7",borderRadius:"6px",padding:"8px 12px",color:"#e53e3e",fontSize:"12px",fontWeight:"600"},
  btn:{backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"14px",fontSize:"14px",fontWeight:"700",letterSpacing:"1.5px",cursor:"pointer",width:"100%",boxShadow:"0 4px 14px rgba(245,166,35,0.4)",fontFamily:"'Segoe UI',sans-serif"},
  modeTab:{borderRadius:"8px",padding:"8px 16px",fontSize:"12px",fontWeight:"700",cursor:"pointer",flex:1,fontFamily:"'Segoe UI',sans-serif",transition:"all 0.2s"},
  links:{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:"8px"},
  link:{background:"none",border:"none",color:"#888",fontSize:"11px",cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"'Segoe UI',sans-serif"},
};
