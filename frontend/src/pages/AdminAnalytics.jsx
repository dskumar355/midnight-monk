import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const t = useTheme();
  const { admin, logout } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/orders/kitchen/${admin.kitchenId}`)
      .then(r => r.json()).then(setOrders).finally(() => setLoading(false));
  }, [admin]);

  const handleLogout = () => { logout(); navigate("/login/admin"); };

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const pending = orders.filter(o => o.status !== "Delivered").length;
  const avgOrder = orders.length ? (revenue / orders.length).toFixed(0) : 0;

  const dishCounts = {};
  orders.forEach(o => o.items?.forEach(item => {
    dishCounts[item.name] = (dishCounts[item.name] || 0) + item.quantity;
  }));
  const topDishes = Object.entries(dishCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const statusBreakdown = ["Placed", "Preparing", "Out for Delivery", "Delivered"].map(s => ({
    status: s, count: orders.filter(o => o.status === s).length,
  }));
  const STATUS_C = { Placed: "#3498db", Preparing: "#e67e22", "Out for Delivery": "#9b59b6", Delivered: "#27ae60" };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>Loading analytics...</div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={`Analytics — ${admin?.kitchenName}`} backPath="/admin" backLabel="Dashboard" onLogout={handleLogout} />

      <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {[["📦", "Total Orders", orders.length], ["💰", "Revenue", `₹${revenue.toFixed(0)}`], ["✅", "Delivered", delivered], ["💳", "Avg Order", `₹${avgOrder}`]].map(([icon, label, val]) => (
            <div key={label} style={{ backgroundColor: t.card, borderRadius: "12px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow, textAlign: "center" }}>
              <span style={{ fontSize: "28px" }}>{icon}</span>
              <p style={{ fontSize: "20px", fontWeight: "900", color: t.text, margin: "8px 0 4px 0" }}>{val}</p>
              <p style={{ fontSize: "10px", color: t.mutedText, margin: 0, fontWeight: "700", letterSpacing: "0.5px" }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Top Dishes */}
          <div style={{ backgroundColor: t.card, borderRadius: "14px", padding: "22px", border: t.cardBorder, boxShadow: t.shadow }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 16px 0" }}>🍽️ Top Dishes</h3>
            {topDishes.length === 0 ? (
              <p style={{ color: t.mutedText, fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No orders yet</p>
            ) : topDishes.map(([name, count], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${t.dark ? "#2a2a3e" : "#f5f5f5"}` }}>
                <span style={{ fontSize: "13px", fontWeight: "900", color: t.accent, minWidth: "24px" }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: t.text, fontWeight: "600", margin: "0 0 4px 0" }}>{name}</p>
                  <div style={{ height: "4px", backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0", borderRadius: "2px" }}>
                    <div style={{ height: "100%", backgroundColor: t.accent, borderRadius: "2px", width: `${Math.min((count / topDishes[0][1]) * 100, 100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: t.subText, fontWeight: "700" }}>{count} orders</span>
              </div>
            ))}
          </div>

          {/* Status Breakdown */}
          <div style={{ backgroundColor: t.card, borderRadius: "14px", padding: "22px", border: t.cardBorder, boxShadow: t.shadow }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 16px 0" }}>📊 Order Status</h3>
            {statusBreakdown.map(({ status, count }) => (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: STATUS_C[status], minWidth: "110px" }}>{status}</span>
                <div style={{ flex: 1, height: "8px", backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0", borderRadius: "4px" }}>
                  <div style={{ height: "100%", backgroundColor: STATUS_C[status], borderRadius: "4px", width: `${orders.length ? (count / orders.length) * 100 : 0}%`, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: "800", color: t.text, minWidth: "20px" }}>{count}</span>
              </div>
            ))}
            {orders.length === 0 && <p style={{ color: t.mutedText, fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No orders yet</p>}
          </div>
        </div>
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
    </div>
  );
}