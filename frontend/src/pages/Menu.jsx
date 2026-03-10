import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const CATEGORIES = ["All", "Veg", "Non Veg", "Fast Food", "Drinks"];
const CAT_COLORS  = { Veg:"#27ae60","Non Veg":"#e74c3c","Fast Food":"#e67e22",Drinks:"#3498db","Main Course":"#9b59b6",Snacks:"#f39c12" };

export default function Menu() {
  const navigate    = useNavigate();
  const t           = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCart();
  const kitchenId   = localStorage.getItem("selectedKitchen");
  const kitchenName = localStorage.getItem("selectedKitchenName");

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!kitchenId) { navigate("/kitchens"); return; }
    api.getMenu(kitchenId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [kitchenId]);

  const filtered = category === "All" ? items : items.filter(i => i.category === category);
  const getQty   = (id) => cart.find(i => i.id === id)?.quantity || 0;
  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading) return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, display:"flex", alignItems:"center", justifyContent:"center", color:t.text, fontFamily:"'Segoe UI',sans-serif" }}>
      🌙 Loading menu...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif", paddingBottom:"90px" }}>
      <Navbar title={kitchenName || "Menu"} backPath="/kitchens" backLabel="Kitchens" onLogout={handleLogout}
        rightContent={
          <span style={{ fontSize:"13px", color:t.subText }}>{items.length} items</span>
        }
      />

      <div style={{ padding:"20px 24px" }}>
        {/* Category Filter */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding:"7px 16px", borderRadius:"20px", cursor:"pointer",
              fontSize:"13px", fontWeight:"700", border:"none",
              backgroundColor: category===c ? t.accent : (t.dark ? "#2a2a3e" : "#f0f0f0"),
              color: category===c ? "#fff" : t.subText,
              fontFamily:"'Segoe UI',sans-serif",
            }}>{c}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:"16px" }}>
          {filtered.map(item => (
            <div key={item.id} style={{ backgroundColor:t.card, borderRadius:"14px", border:t.cardBorder, boxShadow:t.shadow, padding:"16px" }}>
              <div style={{ display:"inline-block", backgroundColor:CAT_COLORS[item.category]+"22", color:CAT_COLORS[item.category]||"#888", fontSize:"10px", fontWeight:"700", padding:"3px 8px", borderRadius:"4px", marginBottom:"8px" }}>
                {item.category}
              </div>
              <h3 style={{ fontSize:"15px", fontWeight:"800", color:t.text, margin:"0 0 6px 0" }}>{item.name}</h3>
              {item.description && <p style={{ fontSize:"12px", color:t.subText, margin:"0 0 6px 0" }}>{item.description}</p>}
              {item.calories && <p style={{ fontSize:"11px", color:t.mutedText, margin:"0 0 10px 0" }}>🔥 {item.calories} kcal {item.protein ? `· 💪 ${item.protein}g` : ""}</p>}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px" }}>
                <span style={{ fontSize:"16px", fontWeight:"800", color:t.accent }}>₹{item.price}</span>
                {getQty(item.id) > 0 ? (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", backgroundColor:t.dark?"#2a2a3e":"#fff8ee", borderRadius:"8px", padding:"4px 10px", border:`1.5px solid ${t.accent}` }}>
                    <button onClick={() => updateQuantity(item.id, getQty(item.id)-1)} style={{ background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:t.accent, fontWeight:"700" }}>−</button>
                    <span style={{ fontSize:"14px", fontWeight:"700", color:t.text, minWidth:"16px", textAlign:"center" }}>{getQty(item.id)}</span>
                    <button onClick={() => addToCart(item)} style={{ background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:t.accent, fontWeight:"700" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} style={{ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"7px 16px", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
                    + Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, backgroundColor:t.dark?"#1a1a2e":"#1a1a2e", color:"#fff", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 -4px 20px rgba(0,0,0,0.2)" }}>
          <span style={{ fontSize:"14px" }}>{totalItems} item{totalItems>1?"s":""} · ₹{totalPrice.toFixed(2)}</span>
          <button onClick={() => navigate("/cart")} style={{ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>
            View Cart →
          </button>
        </div>
      )}

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}