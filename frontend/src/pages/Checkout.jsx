import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function Checkout() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, totalPrice, kitchenId, clearCart } = useCart();
  const { addOrder, loading } = useOrders();

  const [flat, setFlat]       = useState("");
  const [street, setStreet]   = useState("");
  const [city, setCity]       = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError]     = useState("");

  const fullAddress = flat && street && city && pincode ? `${flat}, ${street}, ${city} - ${pincode}` : "";
  const handleLogout = () => { logout(); navigate("/login"); };

  const handleOrder = async () => {
    setError("");
    if (!flat || !street || !city || !pincode) { setError("Please fill all address fields"); return; }
    if (!user) { setError("Please login first"); return; }
    const res = await addOrder({
      user:      { name: user.name, mobile: user.mobile },
      kitchenId: kitchenId || cart[0]?.kitchenId || cart[0]?.kitchen_id,
      items:     cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, kitchenId: i.kitchenId })),
      total:     totalPrice,
      address:   fullAddress,
    });
    if (res.success) { clearCart(); navigate("/order-success", { state: { order: res.order } }); }
    else setError(res.error || "Failed to place order");
  };

  if (cart.length === 0) return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif" }}>
      <Navbar title="Checkout" backPath="/cart" backLabel="Cart" onLogout={handleLogout} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"70vh", gap:"16px" }}>
        <span style={{ fontSize:"48px" }}>🛒</span>
        <p style={{ color:t.text, fontWeight:"700" }}>Your cart is empty</p>
        <button onClick={() => navigate("/menu")} style={btnStyle(t)}>Browse Menu</button>
      </div>
      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif" }}>
      <Navbar title="Checkout" backPath="/cart" backLabel="Cart" onLogout={handleLogout} />

      <div style={{ padding:"24px", maxWidth:"560px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"20px" }}>

        {/* Order Summary */}
        <div style={card(t)}>
          <h3 style={section(t)}>🧾 Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.dark?"#2a2a3e":"#f5f5f5"}`, fontSize:"14px", color:t.subText }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight:"700", color:t.text }}>₹{(item.price*item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"12px", fontSize:"15px", fontWeight:"700", color:t.text }}>
            <span>Total</span>
            <span style={{ color:t.accent, fontSize:"18px", fontWeight:"900" }}>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Address */}
        <div style={card(t)}>
          <h3 style={section(t)}>📍 Delivery Address</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <Field label="Flat / House No." value={flat}     onChange={setFlat}    placeholder="e.g. Flat 4B" t={t} />
            <Field label="Street / Area"    value={street}   onChange={setStreet}  placeholder="e.g. MG Road" t={t} />
            <div style={{ display:"flex", gap:"12px" }}>
              <Field label="City"    value={city}    onChange={setCity}    placeholder="e.g. Bangalore" t={t} />
              <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="560001" maxLength={6} t={t} />
            </div>
          </div>
          {fullAddress && (
            <div style={{ marginTop:"14px", backgroundColor:t.dark?"#0f0f1a":"#f9f5ff", borderRadius:"8px", padding:"10px 14px", border:`1px solid ${t.dark?"#3a2a5e":"#e9d5ff"}` }}>
              <p style={{ fontSize:"11px", color:t.mutedText, fontWeight:"700", margin:"0 0 4px 0" }}>DELIVERY TO</p>
              <p style={{ fontSize:"13px", color:t.text, fontWeight:"600", margin:0 }}>{fullAddress}</p>
            </div>
          )}
        </div>

        {error && <div style={{ backgroundColor:t.dark?"rgba(229,62,62,0.1)":"#fff5f5", border:"1px solid #fed7d7", borderRadius:"8px", padding:"12px", color:t.danger, fontSize:"13px", fontWeight:"600" }}>⚠️ {error}</div>}

        <button onClick={handleOrder} disabled={loading} style={{ ...btnStyle(t), opacity: loading ? 0.7 : 1 }}>
          {loading ? "Placing Order..." : `🛵 Place Order · ₹${totalPrice.toFixed(2)}`}
        </button>
      </div>

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, maxLength, t }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px", flex:1 }}>
      <label style={{ fontSize:"10px", fontWeight:"800", color:t.subText, letterSpacing:"0.8px" }}>{label}</label>
      <input style={{ border:`1.5px solid ${t.dark?"#2a2a3e":"#e0e0e0"}`, borderRadius:"8px", padding:"10px 12px", fontSize:"14px", outline:"none", fontFamily:"'Segoe UI',sans-serif", backgroundColor:t.input, color:t.text }}
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
    </div>
  );
}

const card    = (t) => ({ backgroundColor:t.card, borderRadius:"14px", padding:"20px", border:t.cardBorder, boxShadow:t.shadow });
const section = (t) => ({ fontSize:"13px", fontWeight:"800", color:t.text, margin:"0 0 14px 0", letterSpacing:"0.5px" });
const btnStyle= (t) => ({ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"10px", padding:"16px", fontSize:"15px", fontWeight:"700", cursor:"pointer", width:"100%", boxShadow:"0 4px 14px rgba(245,166,35,0.4)", fontFamily:"'Segoe UI',sans-serif" });