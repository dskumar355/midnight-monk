import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";

export default function MasterAdminDashboard() {
  const { master, logout } = useMasterAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAdmins: "—", totalOrders: "—", totalRevenue: "—", openTickets: "—" });

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    api.getDashboardStats().then(setStats).catch(() => {});
  }, [master]);

  if (!master) return null;

  const sections = [
    { icon: "🍽️", title: "Kitchen Management", desc: "Add, edit, or remove kitchens from the platform", btnLabel: "MANAGE KITCHENS", path: "/master/kitchens", color: "#F5A623", bg: "#fff8ee", border: "#fde8b8" },
    { icon: "👨‍🍳", title: "Admin Accounts",     desc: "Create and manage kitchen admin logins",         btnLabel: "MANAGE ADMINS",   path: "/master/admins",   color: "#3182ce", bg: "#ebf8ff", border: "#bee3f8" },
    { icon: "📦", title: "All Orders",          desc: "Monitor all kitchen orders across the platform", btnLabel: "VIEW ORDERS",     path: "/master/orders",   color: "#805ad5", bg: "#faf5ff", border: "#e9d8fd" },
    { icon: "📊", title: "Platform Analytics",  desc: "Revenue trends, food demand and insights",       btnLabel: "VIEW ANALYTICS",  path: "/master/analytics",color: "#2e7d32", bg: "#e8f5e9", border: "#a5d6a7" },
    { icon: "🎧", title: "Support Tickets",     desc: "View and resolve user or admin queries",         btnLabel: "VIEW TICKETS",    path: "/master/support",  color: "#e53e3e", bg: "#fff5f5", border: "#fed7d7" },
  ];

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.avatar}>👑</div>
          <div>
            <p style={S.brandName}>MIDNIGHT MONK</p>
            <p style={S.brandSub}>Master Admin Portal</p>
          </div>
        </div>
        <button style={S.logoutBtn} onClick={() => { logout(); navigate("/master/login"); }}>
          LOGOUT
        </button>
      </div>

      {/* MAIN */}
      <div style={S.main}>

        {/* Welcome Banner */}
        <div style={S.welcomeBanner}>
          <div style={S.welcomeLeft}>
            <div style={{fontSize:"44px",lineHeight:1}}>👑</div>
            <div>
              <h1 style={S.welcomeTitle}>MASTER ADMIN DASHBOARD</h1>
              <p style={S.welcomeSub}>
                Full platform control · Welcome back,{" "}
                <strong style={{color:"#F5A623"}}>{master.username || "Master"}</strong>
              </p>
            </div>
          </div>
          <div style={S.welcomeBadge}>
            <span style={S.welcomeBadgeText}>⚡ SUPER ACCESS</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={S.statsRow}>
          {[
            { icon:"👨‍🍳", label:"ADMINS",       value: stats.totalAdmins },
            { icon:"📦",   label:"TOTAL ORDERS", value: stats.totalOrders },
            { icon:"💰",   label:"REVENUE",       value: stats.totalRevenue !== "—" ? `₹${stats.totalRevenue}` : "—" },
            { icon:"🎧",   label:"OPEN TICKETS",  value: stats.openTickets },
          ].map((stat, i) => (
            <div key={i} style={S.statCard}>
              <span style={{fontSize:"24px"}}>{stat.icon}</span>
              <div>
                <p style={S.statLabel}>{stat.label}</p>
                <p style={S.statValue}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section Cards */}
        <div style={S.grid}>
          {sections.map((s, i) => (
            <div key={i} style={{...S.card, border:`1.5px solid ${s.border}`}}>
              <div style={{...S.cardIconBox, backgroundColor: s.bg}}>
                <span style={{fontSize:"26px"}}>{s.icon}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px",flex:1}}>
                <p style={S.cardTitle}>{s.title}</p>
                <p style={S.cardDesc}>{s.desc}</p>
              </div>
              <button style={{...S.cardBtn, backgroundColor: s.color}} onClick={() => navigate(s.path)}>
                {s.btnLabel} →
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const S = {
  page:            {minHeight:"100vh",backgroundColor:"#f7f7f7",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column"},
  header:          {backgroundColor:"#0f0f1a",padding:"16px 40px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  headerLeft:      {display:"flex",alignItems:"center",gap:"14px"},
  avatar:          {width:"44px",height:"44px",borderRadius:"50%",backgroundColor:"#1a1a2e",border:"2px solid #F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"},
  brandName:       {fontSize:"14px",fontWeight:"900",color:"#F5A623",margin:0,letterSpacing:"1.5px"},
  brandSub:        {fontSize:"11px",color:"#666",margin:"2px 0 0 0"},
  logoutBtn:       {backgroundColor:"transparent",border:"1.5px solid #e53e3e",color:"#e53e3e",borderRadius:"8px",padding:"8px 18px",fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"'Segoe UI',sans-serif"},
  main:            {flex:1,padding:"36px 40px",maxWidth:"1100px",margin:"0 auto",width:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column",gap:"24px"},
  welcomeBanner:   {backgroundColor:"#0f0f1a",borderRadius:"16px",padding:"28px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px",boxShadow:"0 4px 20px rgba(15,15,26,0.15)"},
  welcomeLeft:     {display:"flex",alignItems:"center",gap:"18px"},
  welcomeTitle:    {fontSize:"20px",fontWeight:"900",color:"#ffffff",margin:0,letterSpacing:"1px"},
  welcomeSub:      {fontSize:"13px",color:"#888",margin:"6px 0 0 0"},
  welcomeBadge:    {backgroundColor:"#F5A623",borderRadius:"20px",padding:"8px 18px",flexShrink:0},
  welcomeBadgeText:{fontSize:"11px",fontWeight:"800",color:"#fff",letterSpacing:"1px"},
  statsRow:        {display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"},
  statCard:        {backgroundColor:"#fff",borderRadius:"12px",border:"1.5px solid #efefef",padding:"16px 20px",display:"flex",alignItems:"center",gap:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},
  statLabel:       {fontSize:"10px",fontWeight:"700",color:"#bbb",letterSpacing:"1px",margin:0},
  statValue:       {fontSize:"22px",fontWeight:"900",color:"#1a1a1a",margin:"4px 0 0 0"},
  grid:            {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"18px"},
  card:            {backgroundColor:"#fff",borderRadius:"16px",boxShadow:"0 2px 14px rgba(0,0,0,0.06)",padding:"24px",display:"flex",flexDirection:"column",gap:"14px"},
  cardIconBox:     {width:"54px",height:"54px",borderRadius:"14px",display:"flex",alignItems:"center",justifyContent:"center"},
  cardTitle:       {fontSize:"15px",fontWeight:"800",color:"#1a1a1a",margin:0},
  cardDesc:        {fontSize:"12px",color:"#999",margin:0,lineHeight:1.5},
  cardBtn:         {color:"#fff",border:"none",borderRadius:"8px",padding:"11px 16px",fontWeight:"700",fontSize:"12px",letterSpacing:"0.5px",cursor:"pointer",fontFamily:"'Segoe UI',sans-serif",marginTop:"4px",boxShadow:"0 3px 10px rgba(0,0,0,0.15)"},
};