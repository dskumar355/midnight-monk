import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const t = useTheme();
  const { admin, logout } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    api.getKitchenOrders(admin.kitchenId).then(setOrders).catch(() => { });
    api.getKitchen(admin.kitchenId).then(k => setIsOpen(k.isOpen)).catch(() => { });
  }, [admin]);

  const handleToggle = async () => {
    if (loadingToggle) return;
    setLoadingToggle(true);
    try {
      const res = await api.toggleKitchen(admin.kitchenId);
      setIsOpen(res.isOpen);
    } catch { } // error handling
    setLoadingToggle(false);
  };

  if (!admin) return null;

  const handleLogout = () => { logout(); navigate("/login/admin"); };
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const STATUS_C = { Placed: "#3498db", Preparing: "#e67e22", "Out for Delivery": "#9b59b6", Delivered: "#27ae60" };

  const sections = [
    { icon: "📋", title: "Orders", desc: "View & update order statuses", btn: "VIEW ORDERS", path: "/admin/orders", color: "#805ad5" },
    { icon: "🍲", title: "Menu", desc: "Add, edit or remove menu items", btn: "MANAGE MENU", path: "/admin/menu", color: "#F5A623" },
    { icon: "📊", title: "Analytics", desc: "Orders and revenue insights", btn: "VIEW ANALYTICS", path: "/admin/analytics", color: "#27ae60" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={admin.kitchenName || "Admin"} onLogout={handleLogout} />

      <div style={{ padding: "28px 24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Welcome Banner */}
        <div style={{ backgroundColor: "#0f0f1a", borderRadius: "16px", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#fff", margin: "0 0 6px 0" }}>🍳 Kitchen Dashboard</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Welcome back, <strong style={{ color: "#F5A623" }}>{admin.username}</strong> · {admin.kitchenName}</p>
          </div>
          <div onClick={handleToggle} style={{ backgroundColor: isOpen ? "#27ae60" : "#e53e3e", borderRadius: "20px", padding: "6px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: loadingToggle ? 0.6 : 1 }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{isOpen ? "🟢 ONLINE" : "🔴 OFFLINE"}</span>
            <span style={{ fontSize: "9px", opacity: 0.8 }}>| Toggle</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {[["📦", "Total Orders", orders.length], ["✅", "Delivered", delivered], ["💰", "Revenue", `₹${revenue.toFixed(0)}`]].map(([icon, label, val]) => (
            <div key={label} style={{ backgroundColor: t.card, borderRadius: "12px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow, textAlign: "center" }}>
              <span style={{ fontSize: "28px" }}>{icon}</span>
              <p style={{ fontSize: "22px", fontWeight: "900", color: t.text, margin: "8px 0 4px 0" }}>{val}</p>
              <p style={{ fontSize: "11px", color: t.mutedText, margin: 0, fontWeight: "700", letterSpacing: "0.5px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Section Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
          {sections.map((s, i) => (
            <div key={i} style={{ backgroundColor: t.card, borderRadius: "16px", padding: "22px", border: t.cardBorder, boxShadow: t.shadow, display: "flex", flexDirection: "column", gap: "14px" }}>
              <span style={{ fontSize: "32px" }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: "15px", fontWeight: "800", color: t.text, margin: "0 0 4px 0" }}>{s.title}</p>
                <p style={{ fontSize: "12px", color: t.subText, margin: 0 }}>{s.desc}</p>
              </div>
              <button onClick={() => navigate(s.path)} style={{ backgroundColor: s.color, color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Segoe UI',sans-serif" }}>
                {s.btn} →
              </button>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div style={{ backgroundColor: t.card, borderRadius: "14px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: 0 }}>Recent Orders</h3>
              <button onClick={() => navigate("/admin/orders")} style={{ background: "none", border: "none", color: t.accent, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>View All →</button>
            </div>
            {orders.slice(0, 4).map(order => (
              <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${t.dark ? "#2a2a3e" : "#f5f5f5"}` }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: t.text, margin: "0 0 2px 0" }}>#{order.id?.slice(-6).toUpperCase()}</p>
                  <p style={{ fontSize: "11px", color: t.subText, margin: 0 }}>{order.user?.name}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: t.accent, margin: "0 0 2px 0" }}>₹{order.total}</p>
                  <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", backgroundColor: (STATUS_C[order.status] || "#888") + "22", color: STATUS_C[order.status] || "#888" }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
    </div>
  );
}