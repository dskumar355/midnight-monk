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
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    if (!admin) { navigate("/kitchen-admin/login"); return; }
    const loadData = () => {
      api.getKitchenOrders(admin.kitchenId).then(setOrders).catch(() => { });
      api.getKitchen(admin.kitchenId).then(k => setIsOpen(k.isOpen)).catch(() => { });
    };
    loadData();
    api.getMenu(admin.kitchenId).then(setMenuItems).catch(() => { }).finally(() => setMenuLoading(false));

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
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

  const handleLogout = () => { logout(); navigate("/kitchen-admin/login"); };
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const delivered = orders.filter(o => (o.status || "").toUpperCase() === "DELIVERED").length;
  const STATUS_C = {
    ORDER_PLACED: "#3498db",
    ACCEPTED: "#0ea5e9",
    PREPARING: "#e67e22",
    READY: "#8b5cf6",
    ASSIGNED: "#7c3aed",
    PICKED_UP: "#f97316",
    OUT_FOR_DELIVERY: "#22c55e",
    DELIVERED: "#16a34a",
    CANCELLED: "#e53e3e",
    Placed: "#3498db",
    Preparing: "#e67e22",
    "Out for Delivery": "#22c55e",
    Delivered: "#16a34a",
  };

  const sections = [
    { icon: "📋", title: "Orders", desc: "View & update order statuses", btn: "VIEW ORDERS", path: "/kitchen-admin/orders", color: "#805ad5" },
    { icon: "🍲", title: "Food Items", desc: "Access food cards and change names, prices, or images", btn: "MANAGE FOOD ITEMS", path: "/kitchen-admin/menu", color: "#F5A623" },
    { icon: "📊", title: "Analytics", desc: "Orders and revenue insights", btn: "VIEW ANALYTICS", path: "/kitchen-admin/analytics", color: "#27ae60" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={admin.kitchenName || "Admin"} onLogout={handleLogout} />

      <div style={{ padding: "clamp(16px, 4vw, 28px) clamp(14px, 3vw, 24px)", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Welcome Banner */}
        <div style={{ backgroundColor: "#0f0f1a", borderRadius: "16px", padding: "clamp(16px, 3vw, 24px) clamp(18px, 4vw, 28px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "clamp(17px, 3vw, 20px)", fontWeight: "900", color: "#fff", margin: "0 0 6px 0" }}>🍳 Kitchen Dashboard</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Welcome back, <strong style={{ color: "#F5A623" }}>{admin.username}</strong> · {admin.kitchenName}</p>
          </div>
          <div onClick={handleToggle} style={{ backgroundColor: isOpen ? "#27ae60" : "#e53e3e", borderRadius: "20px", padding: "6px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: loadingToggle ? 0.6 : 1 }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{isOpen ? "🟢 ONLINE" : "🔴 OFFLINE"}</span>
            <span style={{ fontSize: "9px", opacity: 0.8 }}>| Toggle</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "16px" }}>
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

        {/* Food item access */}
        <section style={{ backgroundColor: t.card, borderRadius: "16px", padding: "22px", border: t.cardBorder, boxShadow: t.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "800", color: t.accent, letterSpacing: "1px", margin: "0 0 5px" }}>KITCHEN CATALOG</p>
              <h3 style={{ fontSize: "20px", fontWeight: "900", color: t.text, margin: 0 }}>Food Items & Images</h3>
              <p style={{ fontSize: "12px", color: t.subText, margin: "6px 0 0" }}>Change the image, price, name, or availability of any food card.</p>
            </div>
            <button onClick={() => navigate("/kitchen-admin/menu")} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "11px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" }}>
              OPEN ALL FOOD ITEMS →
            </button>
          </div>

          {menuLoading ? (
            <p style={{ color: t.subText, fontSize: "13px", margin: 0 }}>Loading food cards...</p>
          ) : menuItems.length === 0 ? (
            <p style={{ color: t.subText, fontSize: "13px", margin: 0 }}>No food cards yet. Open Food Items to add the first one.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px" }}>
              {menuItems.slice(0, 6).map(item => (
                <div key={item.id} style={{ border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden", backgroundColor: t.bg }}>
                  <img src={item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"} alt={item.name} style={{ width: "100%", height: "100px", objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "10px" }}>
                    <p style={{ color: t.text, fontSize: "13px", fontWeight: "800", margin: "0 0 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                    <button onClick={() => navigate("/kitchen-admin/menu")} style={{ width: "100%", background: "transparent", color: t.accent, border: `1px solid ${t.borderStrong}`, borderRadius: "7px", padding: "7px", fontSize: "10px", fontWeight: "800", cursor: "pointer" }}>
                      EDIT IMAGE / CARD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div style={{ backgroundColor: t.card, borderRadius: "14px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: 0 }}>Recent Orders</h3>
              <button onClick={() => navigate("/kitchen-admin/orders")} style={{ background: "none", border: "none", color: t.accent, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>View All →</button>
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
