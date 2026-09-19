import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import { subscribeToKitchen } from "../services/socket";
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
  const [kitchenDoc, setKitchenDoc] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    opening_time: "22:00",
    closing_time: "06:00",
    preorder_enabled: true,
    is_temporarily_closed: false,
    prep_lead_time_minutes: 20,
  });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  useEffect(() => {
    if (!admin) { navigate("/kitchen-admin/login"); return; }
    const loadData = () => {
      api.getKitchenOrders(admin.kitchenId).then(setOrders).catch(() => { });
      api.getKitchen(admin.kitchenId).then(k => {
        setIsOpen(k.isOpen);
        setKitchenDoc(k);
        setScheduleForm({
          opening_time: k.opening_time || "22:00",
          closing_time: k.closing_time || "06:00",
          preorder_enabled: k.preorder_enabled !== false,
          is_temporarily_closed: Boolean(k.is_temporarily_closed),
          prep_lead_time_minutes: k.prep_lead_time_minutes || 20,
        });
      }).catch(() => { });
    };
    loadData();
    api.getMenu(admin.kitchenId).then(setMenuItems).catch(() => { }).finally(() => setMenuLoading(false));

    // Real-time updates via Socket.IO
    const unsub = subscribeToKitchen(admin.kitchenId, () => {
      loadData();
    });

    // Fallback polling relaxed to 20 seconds
    const interval = setInterval(loadData, 20000);
    return () => {
      if (unsub) unsub();
      clearInterval(interval);
    };
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

  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    setScheduleSaving(true);
    setScheduleMsg("");
    try {
      const res = await api.updateKitchenSettings(admin.kitchenId, scheduleForm);
      setKitchenDoc(res.kitchen);
      setScheduleMsg("✅ Operating hours and schedule updated successfully!");
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleMsg("");
      }, 1200);
    } catch (err) {
      setScheduleMsg(`⚠️ ${err.message || "Failed to update schedule"}`);
    } finally {
      setScheduleSaving(false);
    }
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "20px",
                padding: "6px 14px",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              🕒 Hours & Schedule
            </button>
            <div onClick={handleToggle} style={{ backgroundColor: isOpen ? "#27ae60" : "#e53e3e", borderRadius: "20px", padding: "6px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: loadingToggle ? 0.6 : 1 }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{isOpen ? "🟢 ONLINE" : "🔴 OFFLINE"}</span>
              <span style={{ fontSize: "9px", opacity: 0.8 }}>| Toggle</span>
            </div>
          </div>
        </div>

        {/* Schedule & Operating Hours Modal */}
        {showScheduleModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}>
            <div style={{
              backgroundColor: "#0f0f1a",
              border: "1.5px solid #F5A623",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              color: "#fff",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, color: "#F5A623", fontSize: "18px" }}>
                  🕒 Operating Hours & Schedule
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ background: "none", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                Configure overnight shifts (e.g. 22:00 to 06:00). When the kitchen is closed, customers can place pre-orders if pre-order is enabled.
              </p>

              {scheduleMsg && (
                <div style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: scheduleMsg.startsWith("✅") ? "rgba(39,174,96,0.15)" : "rgba(229,62,62,0.15)",
                  color: scheduleMsg.startsWith("✅") ? "#2ecc71" : "#e74c3c",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "14px",
                }}>
                  {scheduleMsg}
                </div>
              )}

              <form onSubmit={handleSaveSchedule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#cbd5e1", marginBottom: "6px" }}>
                      OPENING TIME (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.opening_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, opening_time: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#cbd5e1", marginBottom: "6px" }}>
                      CLOSING TIME (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.closing_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, closing_time: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#cbd5e1", marginBottom: "6px" }}>
                    PREPARATION LEAD TIME (MINUTES)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={scheduleForm.prep_lead_time_minutes}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, prep_lead_time_minutes: parseInt(e.target.value) || 20 }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#fff", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    Kitchen order alerts will fire this many minutes prior to scheduled pre-order delivery.
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={scheduleForm.preorder_enabled}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, preorder_enabled: e.target.checked }))}
                    />
                    <span>🌙 Allow Customer Pre-orders when kitchen is closed</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "#f87171" }}>
                    <input
                      type="checkbox"
                      checked={scheduleForm.is_temporarily_closed}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, is_temporarily_closed: e.target.checked }))}
                    />
                    <span>⏸️ Temporarily Closed (Kitchen Emergency / Pause all orders)</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "transparent", border: "1px solid #334155", color: "#cbd5e1", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scheduleSaving}
                    style={{ flex: 2, padding: "10px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#111", fontWeight: "800", cursor: "pointer" }}
                  >
                    {scheduleSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
