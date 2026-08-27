import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useOrders } from "../context/OrderContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

export default function Profile() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout, updateUser } = useUserAuth();
  const { orders, fetchUserOrders } = useOrders();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchUserOrders(user.mobile);
    setTimeout(() => setAnimIn(true), 80);
  }, [user, fetchUserOrders, navigate]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleSave = async () => {
    if (!name.trim() || name.trim() === user.name) { setEditMode(false); return; }
    setSaving(true);
    try {
      const res = await api.updateProfile(name.trim());
      localStorage.setItem("mm_token", res.token);
      if (updateUser) updateUser(res.user);
      setSaveMsg("✅ Name updated successfully!");
      setEditMode(false);
    } catch (err) {
      setSaveMsg(`❌ ${err.message || "Failed to save."}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  if (!user) return null;

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const initials = user.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "MM";

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: "📦", color: t.accent },
    { label: "Delivered", value: deliveredOrders, icon: "✅", color: t.success },
    { label: "Total Spent", value: `₹${totalSpent.toFixed(0)}`, icon: "💰", color: t.accentStrong },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.dark ? "rgba(201,169,110,0.09)" : "rgba(201,169,110,0.12)"}, transparent 26%), ${t.bg}`, fontFamily: "'Inter', sans-serif" }}>
      <Navbar title="My Profile" backPath="/kitchens" backLabel="Home" onLogout={handleLogout} />

      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "30px 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "22px" }}>
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: "28px",
            boxShadow: t.shadow,
            padding: "28px 24px",
            textAlign: "center",
          }}>
            <div style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C9A96E, #E2C992)",
              color: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "900",
              margin: "0 auto 18px",
              boxShadow: "0 18px 34px rgba(201,169,110,0.3)",
            }}>{initials}</div>

            {editMode ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  autoFocus
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: `1px solid ${t.borderStrong}`,
                    background: t.input,
                    color: t.text,
                    fontSize: "16px",
                    fontWeight: "700",
                    outline: "none",
                    minWidth: "180px",
                    textAlign: "center",
                  }}
                />
                <button onClick={handleSave} disabled={saving} style={{ background: t.accent, color: "#111", border: "none", borderRadius: "10px", padding: "10px 14px", fontWeight: "800", cursor: "pointer" }}>
                  {saving ? "..." : "Save"}
                </button>
                <button onClick={() => { setEditMode(false); setName(user.name); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textSoft, borderRadius: "10px", padding: "10px 14px", fontWeight: "700", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: "42px", color: t.text }}>{user.name}</h2>
                <button onClick={() => setEditMode(true)} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.accent, borderRadius: "999px", padding: "7px 12px", fontWeight: "800", cursor: "pointer" }}>
                  Edit profile
                </button>
              </div>
            )}

            {saveMsg && <p style={{ marginTop: "14px", color: t.success, fontWeight: "700" }}>{saveMsg}</p>}

            <div style={{ marginTop: "22px", display: "inline-flex", alignItems: "center", gap: "8px", background: t.bgSoft, border: `1px solid ${t.border}`, borderRadius: "999px", padding: "8px 14px" }}>
              <span>📱</span>
              <span style={{ fontWeight: "700", color: t.text }}>+91 {user.mobile}</span>
              <span style={{ background: "rgba(145,195,168,0.12)", color: t.success, borderRadius: "999px", padding: "4px 8px", fontSize: "10px", fontWeight: "800" }}>Verified</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", boxShadow: t.shadow, padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: t.mutedText, marginTop: "6px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "22px", boxShadow: t.shadow, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accent }}>Account</div>
                <h3 style={{ fontSize: "32px", margin: "8px 0 0", color: t.text }}>Preferences</h3>
              </div>

              {[
                { icon: "📦", label: "My Orders", action: () => navigate("/orders") },
                { icon: "🏠", label: "Browse Kitchens", action: () => navigate("/kitchens") },
                { icon: "🕶️", label: "Night mode", action: () => t.toggle() },
                { icon: "🔒", label: "Privacy & Security", action: () => navigate("/profile") },
              ].map((item, i, arr) => (
                <button key={item.label} onClick={item.action} style={{ width: "100%", background: "transparent", border: "none", borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", color: t.text, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}><span style={{ fontSize: "18px" }}>{item.icon}</span><span style={{ fontWeight: "700", fontSize: "15px" }}>{item.label}</span></span>
                  <span style={{ color: t.mutedText }}>›</span>
                </button>
              ))}
            </div>

            <button onClick={handleLogout} style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(217,124,108,0.12))", color: t.text, border: `1px solid ${t.borderStrong}`, borderRadius: "14px", padding: "15px 18px", fontWeight: "800", cursor: "pointer" }}>
              🚪 Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
