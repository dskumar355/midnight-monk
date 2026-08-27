import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const CATEGORIES = ["All", "Veg", "Non Veg", "Fast Food", "Drinks"];
const CAT_COLORS = { Veg: "#91C3A8", "Non Veg": "#D97C6C", "Fast Food": "#E2C992", Drinks: "#C9A96E", "Main Course": "#B89AF5", Snacks: "#F4C98A" };

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
  }, [kitchenId, navigate]);

  const filtered = items.filter(i => {
    const matchCat = category === "All" || i.category === category;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getQty = (id) => cart.find(i => i.id === id)?.quantity || 0;
  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", color: t.text, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>☾</div>
        <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: t.accent }}>Loading menu</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.dark ? "rgba(201,169,110,0.1)" : "rgba(201,169,110,0.12)"}, transparent 28%), ${t.bg}`, color: t.text, paddingBottom: "110px" }}>
      <Navbar title={kitchenName || "Menu"} backPath="/kitchens" backLabel="Kitchens" onLogout={handleLogout} rightContent={<span style={{ color: t.textSoft, fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{items.length} items</span>} />

      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "28px", overflow: "hidden", boxShadow: t.shadow, marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <img src={items[0]?.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"} alt={kitchenName} style={{ width: "100%", height: "250px", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,9,11,0.22), rgba(8,9,11,0.7))" }} />
          </div>

          <div style={{ padding: "22px 24px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accent }}>Kitchen</div>
                <h1 style={{ margin: "8px 0 0", fontSize: "54px", lineHeight: 0.9, color: t.text }}>{kitchenName || "Late Night Kitchen"}</h1>
              </div>
              <div style={{ background: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "10px 12px", color: t.accentText, fontWeight: "800" }}>★ 4.8</div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", color: t.mutedText, fontSize: "13px", fontWeight: "600" }}>
              <span>⚡ 20-30 min</span>
              <span>📍 Downtown</span>
              <span>💳 Premium quality</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>⌕</span>
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "18px 18px 18px 52px", borderRadius: "16px", border: `1px solid ${t.border}`, background: t.dark ? "rgba(8,9,11,0.5)" : "rgba(255,255,255,0.8)", color: t.text, fontSize: "14px", outline: "none", boxShadow: search ? `0 0 0 4px ${t.accentSoft}` : "none" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: category === c ? "1px solid rgba(201,169,110,0.18)" : `1px solid ${t.border}`,
              background: category === c ? t.accentSoft : (t.dark ? "rgba(255,255,255,0.02)" : "rgba(17,17,17,0.02)"),
              color: category === c ? t.accentText : t.textSoft,
              fontWeight: "800",
              cursor: "pointer",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: "11px",
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "22px", boxShadow: t.shadow, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <img src={item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"} alt={item.name} style={{ width: "100%", height: "220px", objectFit: "cover" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 18px 0" }}>
                <div style={{ background: `${CAT_COLORS[item.category] || t.accent}22`, color: CAT_COLORS[item.category] || t.accentText, borderRadius: "999px", padding: "6px 10px", fontSize: "10px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.category || "Signature"}</div>
                <div style={{ color: t.accent, fontWeight: "900", fontSize: "18px" }}>₹{item.price}</div>
              </div>

              <div style={{ padding: "16px 18px 18px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "30px", color: t.text }}>{item.name}</h3>
                <p style={{ margin: "0 0 16px", color: t.textSoft, fontSize: "13px", lineHeight: 1.6 }}>{item.description || "Carefully prepared to elevate your after-dark craving."}</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: t.mutedText, fontSize: "12px", fontWeight: "700" }}>{item.calories ? `🔥 ${item.calories} kcal` : "Freshly made"}</div>
                  {getQty(item.id) > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "12px", background: t.accentSoft, border: `1px solid ${t.border}` }}>
                      <button onClick={() => updateQuantity(item.id, getQty(item.id) - 1)} style={{ background: "transparent", border: "none", color: t.accentText, fontSize: "20px", cursor: "pointer", fontWeight: "800", padding: 0 }}>−</button>
                      <span style={{ minWidth: "18px", textAlign: "center", color: t.text, fontWeight: "800" }}>{getQty(item.id)}</span>
                      <button onClick={() => addToCart(item)} style={{ background: "transparent", border: "none", color: t.accentText, fontSize: "20px", cursor: "pointer", fontWeight: "800", padding: 0 }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} style={{ background: t.accent, color: "#111", border: "none", borderRadius: "12px", padding: "10px 18px", fontWeight: "800", cursor: "pointer" }}>Add</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalItems > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(8,9,11,0.96))", borderTop: `1px solid ${t.border}`, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -14px 30px rgba(0,0,0,0.22)" }}>
          <div>
            <div style={{ color: t.textSoft, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cart total</div>
            <div style={{ color: "#fff", fontSize: "18px", fontWeight: "800" }}>{totalItems} item{totalItems > 1 ? "s" : ""} · ₹{totalPrice.toFixed(2)}</div>
          </div>
          <button onClick={() => navigate("/cart")} style={{ background: t.accent, color: "#111", border: "none", borderRadius: "12px", padding: "12px 18px", fontWeight: "800", cursor: "pointer" }}>View cart →</button>
        </div>
      )}

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}