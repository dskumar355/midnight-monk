import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MasterCoupons() {
  const navigate = useNavigate();
  const t = useTheme();
  const { master, logout } = useMasterAuth();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    code: "", discountType: "percent", discountValue: "10",
    minOrder: "0", maxDiscount: "100", usageLimit: "100", expiresAt: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    loadCoupons();
  }, [master]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.getAllCoupons();
      setCoupons(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "MNM";
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code });
  };

  const handleCreate = async () => {
    setError(""); setSuccess("");
    if (!form.discountValue || parseFloat(form.discountValue) <= 0) {
      setError("Discount value must be greater than 0"); return;
    }
    setCreating(true);
    try {
      const res = await api.createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrder: parseFloat(form.minOrder || 0),
        maxDiscount: parseFloat(form.maxDiscount || 100),
        usageLimit: parseInt(form.usageLimit || 100),
        expiresAt: form.expiresAt || "",
      });
      setCoupons(prev => [res.coupon, ...prev]);
      setForm(emptyForm);
      setSuccess(`Coupon "${res.coupon.code}" created!`);
      setShowForm(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const handleToggle = async (coupon) => {
    try {
      const res = await api.toggleCoupon(coupon.id);
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: res.isActive } : c));
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      await api.deleteCoupon(coupon.id);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
    } catch (err) { setError(err.message); }
  };

  const handleLogout = () => { logout(); navigate("/master/login"); };

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsage = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>
      Loading coupons...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title="Coupon Management" backPath="/master" backLabel="Dashboard" onLogout={handleLogout} />

      <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
          {[["🎟️", "Total Coupons", totalCoupons], ["✅", "Active", activeCoupons], ["📊", "Total Usage", totalUsage]].map(([icon, label, val]) => (
            <div key={label} style={{ backgroundColor: t.card, borderRadius: "12px", padding: "20px", border: t.cardBorder, boxShadow: t.shadow, textAlign: "center" }}>
              <span style={{ fontSize: "28px" }}>{icon}</span>
              <p style={{ fontSize: "22px", fontWeight: "900", color: t.text, margin: "8px 0 4px 0" }}>{val}</p>
              <p style={{ fontSize: "10px", color: t.mutedText, margin: 0, fontWeight: "700", letterSpacing: "0.5px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ backgroundColor: t.dark ? "#3a1f1f" : "#fff5f5", border: `1px solid ${t.dark ? "#5a2f2f" : "#fed7d7"}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#e53e3e", fontSize: "13px", fontWeight: "600" }}>
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#e53e3e", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: t.dark ? "#1f3a2a" : "#e6f9f0", border: `1px solid ${t.dark ? "#2f5a3f" : "#b7ebd4"}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#27ae60", fontSize: "13px", fontWeight: "600" }}>
            ✅ {success}
          </div>
        )}

        {/* Toggle Form Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "10px",
            padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer",
            marginBottom: "20px", fontFamily: "'Segoe UI',sans-serif", letterSpacing: "0.5px",
          }}
        >
          {showForm ? "✕ Cancel" : "➕ Create Coupon"}
        </button>

        {/* Create Form */}
        {showForm && (
          <div style={{
            backgroundColor: t.card, borderRadius: "14px", padding: "24px",
            border: t.cardBorder, boxShadow: t.shadow, marginBottom: "24px",
          }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: t.text, margin: "0 0 18px 0" }}>
              🎟️ New Coupon
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Code */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Coupon Code</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    style={{ ...inputStyle(t), flex: 1 }}
                    placeholder="e.g. SAVE20 (auto if empty)"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                  <button onClick={generateCode} style={{
                    backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0", border: "none",
                    borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
                    fontSize: "11px", fontWeight: "700", color: t.text,
                    fontFamily: "'Segoe UI',sans-serif", whiteSpace: "nowrap",
                  }}>
                    🎲 Generate
                  </button>
                </div>
              </div>

              {/* Discount Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Discount Type</label>
                <select
                  style={{ ...inputStyle(t), cursor: "pointer" }}
                  value={form.discountType}
                  onChange={e => setForm({ ...form, discountType: e.target.value })}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Discount Value {form.discountType === "percent" ? "(%)" : "(₹)"}</label>
                <input
                  style={inputStyle(t)}
                  type="number" min="0" placeholder="10"
                  value={form.discountValue}
                  onChange={e => setForm({ ...form, discountValue: e.target.value })}
                />
              </div>

              {/* Min Order */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Min Order Amount (₹)</label>
                <input
                  style={inputStyle(t)}
                  type="number" min="0" placeholder="0"
                  value={form.minOrder}
                  onChange={e => setForm({ ...form, minOrder: e.target.value })}
                />
              </div>

              {/* Max Discount */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Max Discount (₹)</label>
                <input
                  style={inputStyle(t)}
                  type="number" min="0" placeholder="100"
                  value={form.maxDiscount}
                  onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                />
              </div>

              {/* Usage Limit */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={labelStyle(t)}>Usage Limit</label>
                <input
                  style={inputStyle(t)}
                  type="number" min="1" placeholder="100"
                  value={form.usageLimit}
                  onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                />
              </div>

              {/* Expiry */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", gridColumn: "span 2" }}>
                <label style={labelStyle(t)}>Expiry Date (optional)</label>
                <input
                  style={inputStyle(t)}
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={handleCreate} disabled={creating}
              style={{
                backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "10px",
                padding: "12px 28px", fontSize: "14px", fontWeight: "700", cursor: "pointer",
                marginTop: "18px", fontFamily: "'Segoe UI',sans-serif", opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        )}

        {/* Coupons Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {coupons.map(coupon => (
            <div key={coupon.id} style={{
              backgroundColor: t.card, borderRadius: "14px", padding: "20px",
              border: t.cardBorder, boxShadow: t.shadow,
              opacity: coupon.isActive ? 1 : 0.6, transition: "all 0.2s",
              position: "relative", overflow: "hidden",
            }}>
              {/* Active/Inactive ribbon */}
              <div style={{
                position: "absolute", top: "12px", right: "12px",
                backgroundColor: coupon.isActive ? (t.dark ? "#1f3a2a" : "#e6f9f0") : (t.dark ? "#3a1f1f" : "#fff5f5"),
                color: coupon.isActive ? "#27ae60" : "#e53e3e",
                fontSize: "10px", fontWeight: "700", padding: "3px 10px",
                borderRadius: "20px",
              }}>
                {coupon.isActive ? "● Active" : "● Inactive"}
              </div>

              {/* Code */}
              <div style={{
                backgroundColor: t.dark ? "#2a2a3e" : "#f8f6f1", borderRadius: "8px",
                padding: "10px 14px", display: "inline-block", marginBottom: "14px",
              }}>
                <span style={{ fontSize: "18px", fontWeight: "900", color: t.accent, letterSpacing: "2px", fontFamily: "monospace" }}>
                  {coupon.code}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: t.subText, fontWeight: "600" }}>Discount</span>
                  <span style={{ fontSize: "14px", color: t.text, fontWeight: "800" }}>
                    {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: t.subText, fontWeight: "600" }}>Min Order</span>
                  <span style={{ fontSize: "13px", color: t.text, fontWeight: "700" }}>₹{coupon.minOrder}</span>
                </div>
                {coupon.discountType === "percent" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: t.subText, fontWeight: "600" }}>Max Discount</span>
                    <span style={{ fontSize: "13px", color: t.text, fontWeight: "700" }}>₹{coupon.maxDiscount}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: t.subText, fontWeight: "600" }}>Usage</span>
                  <span style={{ fontSize: "13px", color: t.text, fontWeight: "700" }}>
                    {coupon.usedCount || 0} / {coupon.usageLimit}
                  </span>
                </div>
                {coupon.expiresAt && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: t.subText, fontWeight: "600" }}>Expires</span>
                    <span style={{ fontSize: "12px", color: t.text, fontWeight: "600" }}>
                      {new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Usage bar */}
              <div style={{ height: "4px", backgroundColor: t.dark ? "#2a2a3e" : "#f0f0f0", borderRadius: "2px", marginBottom: "14px" }}>
                <div style={{
                  height: "100%", borderRadius: "2px", transition: "width 0.5s",
                  backgroundColor: (coupon.usedCount || 0) >= coupon.usageLimit ? "#e53e3e" : t.accent,
                  width: `${Math.min(((coupon.usedCount || 0) / coupon.usageLimit) * 100, 100)}%`,
                }} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleToggle(coupon)} style={{
                  flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'Segoe UI',sans-serif", border: "none",
                  backgroundColor: coupon.isActive ? (t.dark ? "#3a2f1f" : "#fff8ee") : (t.dark ? "#1f3a2a" : "#e6f9f0"),
                  color: coupon.isActive ? "#e67e22" : "#27ae60",
                }}>
                  {coupon.isActive ? "⏸ Deactivate" : "▶ Activate"}
                </button>
                <button onClick={() => handleDelete(coupon)} style={{
                  padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'Segoe UI',sans-serif",
                  backgroundColor: t.dark ? "#3a1f1f" : "#fff5f5",
                  color: "#e53e3e", border: `1px solid ${t.dark ? "#5a2f2f" : "#fed7d7"}`,
                }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {coupons.length === 0 && !loading && (
          <div style={{
            textAlign: "center", padding: "60px 20px", color: t.subText,
            backgroundColor: t.card, borderRadius: "14px", border: t.cardBorder,
          }}>
            <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🎟️</p>
            <p style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 6px 0" }}>No coupons yet</p>
            <p style={{ fontSize: "12px", color: t.mutedText }}>Create your first coupon to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper style functions ───
const labelStyle = (t) => ({
  fontSize: "10px", fontWeight: "800", color: t.subText,
  letterSpacing: "0.8px", textTransform: "uppercase",
});

const inputStyle = (t) => ({
  border: t.cardBorder, borderRadius: "8px", padding: "10px 12px",
  fontSize: "13px", outline: "none", fontFamily: "'Segoe UI',sans-serif",
  backgroundColor: t.dark ? "#1a1a2e" : "#fff", color: t.text,
});
