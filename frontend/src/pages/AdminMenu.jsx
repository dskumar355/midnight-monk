import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const CATEGORIES = ["Veg", "Non Veg", "Fast Food", "Drinks", "Main Course", "Snacks"];

export default function AdminMenu() {
  const navigate = useNavigate();
  const t = useTheme();
  const { admin, logout } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", price: "", category: "Veg", description: "", calories: "", protein: "", discount: "0", image_url: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    fetchMenu();
  }, [admin]);

  const fetchMenu = () => {
    api.getMenu(admin.kitchenId).then(setItems).finally(() => setLoading(false));
  };

  const handleAdd = async () => {
    setError("");
    if (!form.name || !form.price) { setError("Name and price required"); return; }
    setAdding(true);
    try {
      await api.addMenuItem({ ...form, price: parseFloat(form.price), kitchen_id: admin.kitchenId });
      setForm({ name: "", price: "", category: "Veg", description: "", calories: "", protein: "", discount: "0", image_url: "" });
      fetchMenu();
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    await api.deleteMenuItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleToggle = async (id) => {
    await api.toggleMenuItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  const handleLogout = () => { logout(); navigate("/login/admin"); };
  const inputStyle = { border: `1.5px solid ${t.dark ? "#2a2a3e" : "#e0e0e0"}`, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'Segoe UI',sans-serif", backgroundColor: t.input, color: t.text };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>Loading menu...</div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={`Menu — ${admin?.kitchenName}`} backPath="/admin" backLabel="Dashboard" onLogout={handleLogout} />

      <div style={{ padding: "24px" }}>
        {/* Add Form */}
        <div style={{ backgroundColor: t.card, borderRadius: "14px", padding: "24px", border: t.cardBorder, boxShadow: t.shadow, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 16px 0" }}>➕ Add New Item</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px", marginBottom: "12px" }}>
            {[["Item Name *", "name", "text", ""], ["Price (₹) *", "price", "number", ""], ["Discount (%)", "discount", "number", "0"], ["Calories", "calories", "number", ""], ["Protein (g)", "protein", "number", ""]].map(([label, key, type, ph]) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>{label}</label>
                <input style={inputStyle} type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>Description</label>
            <input style={inputStyle} placeholder="Short description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>Image URL</label>
            <input style={inputStyle} placeholder="https://example.com/image.jpg" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
          {error && <div style={{ backgroundColor: t.dark ? "rgba(229,62,62,0.1)" : "#fff5f5", border: "1px solid #fed7d7", borderRadius: "6px", padding: "10px", color: "#e53e3e", fontSize: "12px", marginBottom: "12px" }}>⚠️ {error}</div>}
          <button onClick={handleAdd} disabled={adding} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer", opacity: adding ? 0.7 : 1 }}>
            {adding ? "Adding..." : "Add Item"}
          </button>
        </div>

        {/* Items Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
          {items.map(item => (
            <div key={item.id} style={{ backgroundColor: t.card, borderRadius: "12px", padding: "16px", border: t.cardBorder, boxShadow: t.shadow, opacity: item.available ? 1 : 0.6 }}>
              <div style={{ display: "flex", gap: "12px" }}>
                {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", backgroundColor: t.dark ? "#1a1a2e" : "#eee" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 3px 0" }}>{item.name}</p>
                      <p style={{ fontSize: "11px", color: t.subText, margin: 0 }}>{item.category}</p>
                    </div>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: t.accent, margin: 0 }}>₹{item.price}</p>
                  </div>
                  {item.description && <p style={{ fontSize: "12px", color: t.subText, margin: "0 0 12px 0" }}>{item.description}</p>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleToggle(item.id)} style={{ flex: 1, border: "none", borderRadius: "6px", padding: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", backgroundColor: item.available ? (t.dark ? "#2a1800" : "#fff8ee") : (t.dark ? "#0a2a0a" : "#e6f9f0"), color: item.available ? "#e67e22" : "#27ae60" }}>
                  {item.available ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ border: "none", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", cursor: "pointer", backgroundColor: t.dark ? "#2a0a0a" : "#fff5f5", color: "#e53e3e", fontWeight: "700" }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
    </div>
  );
}