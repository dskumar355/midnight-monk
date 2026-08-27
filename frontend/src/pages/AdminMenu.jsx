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
  const [preview, setPreview] = useState(""); // image preview URL
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    fetchMenu();
  }, [admin]);

  const fetchMenu = () => {
    api.getMenu(admin.kitchenId).then(setItems).finally(() => setLoading(false));
  };

  const handleImageUrlChange = (url) => {
    setForm({ ...form, image_url: url });
    // Validate and show preview
    if (url.trim() && (url.startsWith("http://") || url.startsWith("https://"))) {
      setPreview(url.trim());
    } else {
      setPreview("");
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      setForm(prev => ({ ...prev, image_url: image }));
      setPreview(image);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    setError("");
    if (!form.name || !form.price) { setError("Name and price required"); return; }
    setAdding(true);
    try {
      if (editingId) {
        await api.updateMenuItem(editingId, { ...form, price: parseFloat(form.price) });
      } else {
        await api.addMenuItem({ ...form, price: parseFloat(form.price), kitchen_id: admin.kitchenId });
      }
      setForm({ name: "", price: "", category: "Veg", description: "", calories: "", protein: "", discount: "0", image_url: "" });
      setPreview("");
      setEditingId(null);
      setShowAddForm(false);
      fetchMenu();
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      price: item.originalPrice ?? item.price ?? "",
      category: item.category || "Veg",
      description: item.description || "",
      calories: item.calories || "",
      protein: item.protein || "",
      discount: item.discount || "0",
      image_url: item.image_url || item.image || "",
    });
    setPreview(item.image_url || item.image || "");
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const inputStyle = {
    border: `1.5px solid ${t.dark ? "#2a2a3e" : "#e0e0e0"}`,
    borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
    outline: "none", fontFamily: "'Segoe UI',sans-serif",
    backgroundColor: t.input, color: t.text, width: "100%",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const vegColor = { "Veg": "#27ae60", "Non Veg": "#e53e3e", "Drinks": "#3498db", "Fast Food": "#e67e22", "Main Course": "#9b59b6", "Snacks": "#F5A623" };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>Loading menu...</div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={`Menu — ${admin?.kitchenName}`} backPath="/admin" backLabel="Dashboard" onLogout={handleLogout} />

      <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>

        {/* Header + Toggle Add Form */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: t.text, margin: "0 0 4px 0" }}>
              🍽️ Menu Items ({items.length})
            </h2>
            <p style={{ fontSize: "12px", color: t.subText, margin: 0 }}>Manage your kitchen's menu</p>
          </div>
          <button onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) setEditingId(null); }} style={{
            backgroundColor: showAddForm ? "#e53e3e" : t.accent, color: "#fff",
            border: "none", borderRadius: "10px", padding: "10px 20px",
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
            fontFamily: "'Segoe UI',sans-serif",
          }}>
            {showAddForm ? "✕ Cancel" : "➕ Add Item"}
          </button>
        </div>

        {/* ── Add Form (Collapsible) ── */}
        {showAddForm && (
          <div style={{
            backgroundColor: t.card, borderRadius: "18px", padding: "24px",
            border: t.cardBorder, boxShadow: t.shadow, marginBottom: "24px",
            animation: "slideDown 0.3s ease",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 16px 0" }}>
              {editingId ? "✏️ Edit Menu Item" : "📝 New Menu Item"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "14px", marginBottom: "14px" }}>
              {[
                ["Item Name *", "name", "text", "e.g., Butter Chicken"],
                ["Price (₹) *", "price", "number", "199"],
                ["Discount (%)", "discount", "number", "0"],
                ["Calories", "calories", "number", "450"],
                ["Protein (g)", "protein", "number", "32"],
              ].map(([label, key, type, ph]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>{label}</label>
                  <input style={inputStyle} type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px" }}>Description</label>
              <input style={inputStyle} placeholder="Short description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* ── 📸 Image URL with Preview ── */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "10px", fontWeight: "800", color: t.subText, letterSpacing: "0.8px", display: "block", marginBottom: "6px" }}>
                📸 Food Image
              </label>
              <input
                style={inputStyle}
                placeholder="https://images.unsplash.com/photo-..."
                value={form.image_url}
                onChange={e => handleImageUrlChange(e.target.value)}
              />
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "10px", border: `1px solid ${t.border}`, borderRadius: "10px", padding: "9px 12px", color: t.textSoft, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                📁 Upload image
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
              {preview && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <img
                    src={preview}
                    alt="Preview"
                    onError={() => setPreview("")}
                    style={{
                      width: "80px", height: "80px", borderRadius: "12px",
                      objectFit: "cover", border: `2px solid ${t.accent}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#27ae60", margin: "0 0 4px 0" }}>✅ Image preview loaded</p>
                    <p style={{ fontSize: "10px", color: t.mutedText, margin: 0, wordBreak: "break-all" }}>
                      {preview.length > 60 ? preview.slice(0, 60) + "..." : preview}
                    </p>
                  </div>
                </div>
              )}
              <p style={{ fontSize: "10px", color: t.mutedText, margin: "6px 0 0 0" }}>
                💡 Use a public image URL or upload an image from your device.
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: t.dark ? "rgba(229,62,62,0.1)" : "#fff5f5",
                border: "1px solid #fed7d7", borderRadius: "8px", padding: "10px",
                color: "#e53e3e", fontSize: "12px", marginBottom: "12px",
              }}>⚠️ {error}</div>
            )}

            <button onClick={handleAdd} disabled={adding} style={{
              backgroundColor: t.accent, color: "#fff", border: "none",
              borderRadius: "10px", padding: "12px 28px", fontSize: "14px",
              fontWeight: "700", cursor: "pointer", opacity: adding ? 0.7 : 1,
              fontFamily: "'Segoe UI',sans-serif",
              boxShadow: `0 4px 14px ${t.accent}44`,
            }}>
              {adding ? "Saving..." : editingId ? "✅ Save Changes" : "✅ Add Item"}
            </button>
          </div>
        )}

        {/* ── Items Grid ── */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🍽️</div>
            <p style={{ fontSize: "16px", fontWeight: "800", color: t.text }}>No menu items yet</p>
            <p style={{ fontSize: "13px", color: t.subText }}>Add your first item above</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "16px" }}>
            {items.map(item => (
              <div key={item.id} style={{
                backgroundColor: t.card, borderRadius: "16px", overflow: "hidden",
                border: t.cardBorder, boxShadow: t.shadow,
                opacity: item.available ? 1 : 0.55, transition: "all 0.2s",
              }}>
                {/* Image */}
                {(item.image_url || item.image) && (
                  <div style={{ position: "relative", height: "140px", overflow: "hidden" }}>
                    <img
                      src={item.image_url || item.image}
                      alt={item.name}
                      style={{
                        width: "100%", height: "100%", objectFit: "cover",
                        filter: item.available ? "none" : "grayscale(1)",
                      }}
                    />
                    {!item.available && (
                      <div style={{
                        position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: "800", color: "#fff",
                        letterSpacing: "1px",
                      }}>UNAVAILABLE</div>
                    )}
                    {/* Category Badge */}
                    <span style={{
                      position: "absolute", top: "8px", left: "8px",
                      backgroundColor: vegColor[item.category] || t.accent, color: "#fff",
                      padding: "3px 10px", borderRadius: "6px", fontSize: "10px",
                      fontWeight: "800",
                    }}>{item.category}</span>
                  </div>
                )}

                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 3px 0" }}>{item.name}</p>
                      {!(item.image_url || item.image) && (
                        <span style={{
                          fontSize: "9px", fontWeight: "700", padding: "2px 8px",
                          borderRadius: "4px", backgroundColor: (vegColor[item.category] || t.accent) + "22",
                          color: vegColor[item.category] || t.accent,
                        }}>{item.category}</span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "17px", fontWeight: "900", color: t.accent, margin: 0 }}>₹{item.price}</p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p style={{ fontSize: "11px", color: t.mutedText, margin: 0, textDecoration: "line-through" }}>₹{item.originalPrice}</p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p style={{ fontSize: "12px", color: t.subText, margin: "0 0 10px 0", lineHeight: 1.4 }}>{item.description}</p>
                  )}

                  {/* Nutrition */}
                  {(item.calories || item.protein) && (
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      {item.calories && (
                        <span style={{ fontSize: "10px", color: t.mutedText, fontWeight: "600" }}>🔥 {item.calories} cal</span>
                      )}
                      {item.protein && (
                        <span style={{ fontSize: "10px", color: t.mutedText, fontWeight: "600" }}>💪 {item.protein}g protein</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(item)} style={{
                      flex: 1, border: "none", borderRadius: "8px", padding: "8px",
                      fontSize: "12px", fontWeight: "700", cursor: "pointer",
                      backgroundColor: t.dark ? "#1a2638" : "#eef6ff", color: "#3498db",
                      fontFamily: "'Segoe UI',sans-serif",
                    }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleToggle(item.id)} style={{
                      flex: 1, border: "none", borderRadius: "8px", padding: "8px",
                      fontSize: "12px", fontWeight: "700", cursor: "pointer",
                      backgroundColor: item.available ? (t.dark ? "#2a1800" : "#fff8ee") : (t.dark ? "#0a2a0a" : "#e6f9f0"),
                      color: item.available ? "#e67e22" : "#27ae60",
                      fontFamily: "'Segoe UI',sans-serif",
                    }}>
                      {item.available ? "⏸ Disable" : "▶️ Enable"}
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{
                      border: "none", borderRadius: "8px", padding: "8px 14px",
                      fontSize: "12px", cursor: "pointer",
                      backgroundColor: t.dark ? "#2a0a0a" : "#fff5f5",
                      color: "#e53e3e", fontWeight: "700",
                      fontFamily: "'Segoe UI',sans-serif",
                    }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
