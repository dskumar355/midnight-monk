import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

const STEPS = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
const STATUS_COLORS = { Placed:"#3498db", Preparing:"#e67e22", "Out for Delivery":"#9b59b6", Delivered:"#27ae60" };

export default function Orders() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { orders, fetchUserOrders, loading } = useOrders();
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchUserOrders(user.mobile);
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, display:"flex", alignItems:"center", justifyContent:"center", color:t.text, fontFamily:"'Segoe UI',sans-serif" }}>
      🌙 Loading orders...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif" }}>
      <Navbar title="My Orders" backPath="/kitchens" backLabel="Home" onLogout={handleLogout} />

      <div style={{ padding:"24px", maxWidth:"700px", margin:"0 auto" }}>

        {/* Filters */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
          {["All", "Placed", "Preparing", "Out for Delivery", "Delivered"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"6px 14px", borderRadius:"20px", border:"none", cursor:"pointer",
              fontSize:"12px", fontWeight:"700", fontFamily:"'Segoe UI',sans-serif",
              backgroundColor: filter===f ? STATUS_COLORS[f]||t.accent : (t.dark?"#2a2a3e":"#f0f0f0"),
              color: filter===f ? "#fff" : t.subText,
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:t.subText, display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
            <span style={{ fontSize:"52px" }}>📦</span>
            <p style={{ fontSize:"16px", fontWeight:"700", color:t.text }}>No orders yet</p>
            <button onClick={() => navigate("/kitchens")} style={{ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"12px 24px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
              Order Now
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {filtered.map(order => <OrderCard key={order.id} order={order} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, t }) {
  const stepIdx = STEPS.indexOf(order.status);
  const color   = STATUS_COLORS[order.status] || "#888";
  const isActive = order.status !== "Delivered";

  return (
    <div style={{ backgroundColor:t.card, borderRadius:"16px", padding:"20px", border:t.cardBorder, boxShadow:t.shadow }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <div>
          <p style={{ fontSize:"14px", fontWeight:"800", color:t.text, margin:"0 0 3px 0" }}>
            Order #{order.id?.slice(-8).toUpperCase()}
          </p>
          <p style={{ fontSize:"11px", color:t.mutedText, margin:0 }}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
          </p>
        </div>
        <div style={{ backgroundColor:color+"22", color, fontSize:"11px", fontWeight:"700", padding:"4px 10px", borderRadius:"6px" }}>
          {order.status}
        </div>
      </div>

      {/* Items */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"14px" }}>
        {order.items?.map((item, i) => (
          <span key={i} style={{ backgroundColor:t.dark?"#2a2a3e":"#f7f7f7", border:`1px solid ${t.dark?"#3a3a4e":"#eee"}`, borderRadius:"6px", padding:"4px 10px", fontSize:"12px", color:t.subText }}>
            {item.name} ×{item.quantity}
          </span>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom:"14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
          {STEPS.map((step, i) => (
            <div key={step} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", flex:1 }}>
              <div style={{
                width:"26px", height:"26px", borderRadius:"50%",
                backgroundColor: i <= stepIdx ? color : (t.dark?"#2a2a3e":"#e0e0e0"),
                color: i <= stepIdx ? "#fff" : t.mutedText,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", fontWeight:"700",
              }}>
                {i < stepIdx ? "✓" : i === stepIdx ? "●" : "○"}
              </div>
              <p style={{ fontSize:"9px", color: i<=stepIdx ? color : t.mutedText, fontWeight: i<=stepIdx?"700":"400", textAlign:"center", margin:0 }}>
                {step}
              </p>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div style={{ height:"3px", backgroundColor:t.dark?"#2a2a3e":"#e0e0e0", borderRadius:"2px", position:"relative", margin:"0 13px" }}>
          <div style={{ height:"100%", backgroundColor:color, borderRadius:"2px", width:`${(stepIdx/3)*100}%`, transition:"width 0.4s ease" }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", borderTop:`1px solid ${t.dark?"#2a2a3e":"#f0f0f0"}`, paddingTop:"12px", fontSize:"13px" }}>
        <span style={{ color:t.subText }}>🛵 {order.riderName || "Rider assigned"}</span>
        <span style={{ color:t.subText }}>📍 {order.address}</span>
        <span style={{ color:t.accent, fontWeight:"700", marginLeft:"auto" }}>₹{order.total}</span>
        {isActive && (
          <span style={{ backgroundColor:t.dark?"#1a1a2e":"#0f0f1a", color:t.accent, fontWeight:"800", padding:"3px 10px", borderRadius:"6px", fontSize:"12px" }}>
            OTP: {order.otp}
          </span>
        )}
      </div>

      {/* ETA */}
      {isActive && order.eta && (
        <div style={{ marginTop:"10px", backgroundColor:color+"11", borderRadius:"8px", padding:"8px 12px", border:`1px solid ${color}33` }}>
          <p style={{ fontSize:"12px", color, fontWeight:"700", margin:0 }}>⏱️ Estimated delivery: {order.eta}</p>
        </div>
      )}
    </div>
  );
}