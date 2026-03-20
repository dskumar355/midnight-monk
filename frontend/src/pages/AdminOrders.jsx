import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useOrders } from "../context/OrderContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const STEPS = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
const STATUS_C = { Placed: "#3498db", Preparing: "#e67e22", "Out for Delivery": "#9b59b6", Delivered: "#27ae60" };

export default function AdminOrders() {
  const navigate = useNavigate();
  const t = useTheme();
  const { admin, logout } = useAdminAuth();
  const { orders, fetchKitchenOrders, updateOrderStatus, loading } = useOrders();
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    fetchKitchenOrders(admin.kitchenId);

    const interval = setInterval(() => {
      fetchKitchenOrders(admin.kitchenId);
    }, 10000);
    return () => clearInterval(interval);
  }, [admin]);

  const handleNext = async (order) => {
    const next = STEPS[STEPS.indexOf(order.status) + 1];
    if (!next) return;
    setUpdating(order.id);
    await updateOrderStatus(order.id, next);
    setUpdating(null);
  };

  const handleLogout = () => { logout(); navigate("/login/admin"); };
  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>Loading orders...</div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={`Orders — ${admin?.kitchenName}`} backPath="/admin" backLabel="Dashboard" onLogout={handleLogout}
        rightContent={<span style={{ backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", color: t.subText, fontWeight: "700" }}>{orders.length} total</span>}
      />

      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["All", "Placed", "Preparing", "Out for Delivery", "Delivered"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: "700", fontFamily: "'Segoe UI',sans-serif",
              backgroundColor: filter === f ? (STATUS_C[f] || t.accent) : (t.dark ? "#2a2a3e" : "#f0f0f0"),
              color: filter === f ? "#fff" : t.subText,
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: t.subText, fontSize: "16px" }}>📦 No orders found</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map(order => (
              <div key={order.id} style={{ backgroundColor: t.card, borderRadius: "14px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 4px 0" }}>#{order.id?.slice(-8).toUpperCase()}</p>
                    <p style={{ fontSize: "13px", color: t.subText, margin: "0 0 2px 0" }}>{order.user?.name} · {order.user?.mobile}</p>
                    <p style={{ fontSize: "12px", color: t.mutedText, margin: 0 }}>📍 {order.address}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-block", backgroundColor: (STATUS_C[order.status] || "#888") + "22", color: STATUS_C[order.status] || "#888", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", marginBottom: "6px" }}>
                      {order.status}
                    </div>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: t.accent, margin: "4px 0" }}>₹{order.total}</p>
                    <p style={{ fontSize: "12px", color: t.dark ? "#F5A623" : "#1a1a2e", fontWeight: "800", margin: 0 }}>OTP: {order.otp}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {order.items?.map((item, i) => (
                    <span key={i} style={{ backgroundColor: t.dark ? "#2a2a3e" : "#f7f7f7", border: `1px solid ${t.dark ? "#3a3a4e" : "#eee"}`, borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: t.subText }}>
                      {item.name} ×{item.quantity}
                    </span>
                  ))}
                </div>

                {order.status !== "Delivered" && (
                  <button onClick={() => handleNext(order)} disabled={updating === order.id} style={{
                    width: "100%", backgroundColor: t.dark ? "#1a1a2e" : "#0f0f1a", color: "#F5A623",
                    border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px",
                    fontWeight: "700", cursor: "pointer", opacity: updating === order.id ? 0.6 : 1,
                    fontFamily: "'Segoe UI',sans-serif",
                  }}>
                    {updating === order.id ? "Updating..." : `Mark as ${STEPS[STEPS.indexOf(order.status) + 1]} →`}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
    </div>
  );
}