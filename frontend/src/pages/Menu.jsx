import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const CATEGORIES = ["All", "Veg", "Non Veg", "Fast Food", "Drinks"];
const CAT_COLORS = { Veg: "#27ae60", "Non Veg": "#e74c3c", "Fast Food": "#e67e22", Drinks: "#3498db", "Main Course": "#9b59b6", Snacks: "#f39c12" };

export default function Menu() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCart();
  const kitchenId = localStorage.getItem("selectedKitchen");
  const kitchenName = localStorage.getItem("selectedKitchenName");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!kitchenId) { navigate("/kitchens"); return; }
    api.getMenu(kitchenId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [kitchenId]);

  const filtered = items.filter(i => {
    const matchCat = category === "All" || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const getQty = (id) => cart.find(i => i.id === id)?.quantity || 0;
  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>
      🌙 Loading menu...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif", paddingBottom: "90px" }}>
      <Navbar title={kitchenName || "Menu"} backPath="/kitchens" backLabel="Kitchens" onLogout={handleLogout}
        rightContent={
          <span style={{ fontSize: "13px", color: t.subText }}>{items.length} items</span>
        }
      />

      <div style={{ padding: "20px 24px" }}>
        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: t.cardBorder, backgroundColor: t.card, color: t.text, fontSize: "14px", outline: "none", fontFamily: "'Segoe UI',sans-serif", boxSizing: "border-box" }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "7px 16px", borderRadius: "20px", cursor: "pointer",
              fontSize: "13px", fontWeight: "700", border: "none",
              backgroundColor: category === c ? t.accent : (t.dark ? "#2a2a3e" : "#f0f0f0"),
              color: category === c ? "#fff" : t.subText,
              fontFamily: "'Segoe UI',sans-serif",
            }}>{c}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="mm-grid-menu-items">
          {filtered.map(item => (
            <div key={item.id} style={{ backgroundColor: t.card, borderRadius: "16px", border: t.cardBorder, boxShadow: t.shadow, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>

              {/* Left Side: Info */}
              <div style={{ flex: 1, paddingRight: "10px" }}>
                <div style={{ display: "inline-block", backgroundColor: CAT_COLORS[item.category] + "22", color: CAT_COLORS[item.category] || "#888", fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {item.category}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: t.text, margin: "0 0 6px 0" }}>{item.name}</h3>
                <span style={{ fontSize: "15px", fontWeight: "800", color: t.text, display: "block", marginBottom: "8px" }}>₹{item.price}</span>
                {item.description && <p style={{ fontSize: "13px", color: t.subText, margin: "0 0 8px 0", lineHeight: "1.4" }}>{item.description}</p>}
                {item.calories && <p style={{ fontSize: "11px", color: t.mutedText, margin: "0" }}>🔥 {item.calories} kcal {item.protein ? `· 💪 ${item.protein}g` : ""}</p>}
              </div>

              {/* Right Side: Image & Add Button */}
              <div style={{ position: "relative", width: "120px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "16px", backgroundColor: t.dark ? "#1a1a2e" : "#eee", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "16px", backgroundColor: t.dark ? "#2a2a3e" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>🍲</div>
                )}

                <div style={{ marginTop: "-16px", zIndex: 2 }}>
                  {getQty(item.id) > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "90px", backgroundColor: t.dark ? "#2a2a3e" : "#fff", borderRadius: "8px", padding: "6px 8px", border: `1.5px solid ${t.accent}`, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                      <button onClick={() => updateQuantity(item.id, getQty(item.id) - 1)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: t.accent, fontWeight: "900", padding: 0 }}>−</button>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: t.accent }}>{getQty(item.id)}</span>
                      <button onClick={() => addToCart(item)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: t.accent, fontWeight: "900", padding: 0 }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} style={{ width: "90px", backgroundColor: t.dark ? "#1a1a2e" : "#fff", color: t.accent, border: `1.5px solid ${t.dark ? t.accent : "#e0e0e0"}`, borderRadius: "8px", padding: "8px 0", fontSize: "14px", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center", transition: "all 0.2s" }}>
                      ADD
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: t.dark ? "#1a1a2e" : "#1a1a2e", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.2)" }}>
          <span style={{ fontSize: "14px" }}>{totalItems} item{totalItems > 1 ? "s" : ""} · ₹{totalPrice.toFixed(2)}</span>
          <button onClick={() => navigate("/cart")} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            View Cart →
          </button>
        </div>
      )}

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}