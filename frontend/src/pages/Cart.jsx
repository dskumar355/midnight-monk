import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function Cart() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();
  const handleLogout = () => { logout(); navigate("/login"); };

  if (cart.length === 0) return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif" }}>
      <Navbar title="My Cart" backPath="/menu" backLabel="Menu" onLogout={handleLogout} />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"70vh", gap:"16px" }}>
        <span style={{ fontSize:"60px" }}>🛒</span>
        <p style={{ fontSize:"16px", fontWeight:"700", color:t.text, fontFamily:"'Segoe UI',sans-serif" }}>Your cart is empty</p>
        <button onClick={() => navigate("/menu")} style={{ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"12px 24px", fontSize:"14px", fontWeight:"700", cursor:"pointer" }}>Browse Menu</button>
      </div>
      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", backgroundColor:t.bg, fontFamily:"'Segoe UI',sans-serif", paddingBottom:"20px" }}>
      <Navbar title="My Cart" backPath="/menu" backLabel="Menu" onLogout={handleLogout} />
      <div style={{ padding:"24px", maxWidth:"600px", margin:"0 auto" }}>
        <h2 style={{ fontSize:"18px", fontWeight:"800", color:t.text, marginBottom:"20px" }}>🛒 {totalItems} item{totalItems>1?"s":""} in cart</h2>

        <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"24px" }}>
          {cart.map(item => (
            <div key={item.id} style={{ backgroundColor:t.card, borderRadius:"12px", padding:"16px", border:t.cardBorder, boxShadow:t.shadow, display:"flex", alignItems:"center", gap:"14px" }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:"15px", fontWeight:"800", color:t.text, margin:"0 0 4px 0" }}>{item.name}</p>
                <p style={{ fontSize:"13px", color:t.accent, margin:0, fontWeight:"700" }}>₹{item.price} each</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <button onClick={() => updateQuantity(item.id, item.quantity-1)} style={{ width:"30px", height:"30px", borderRadius:"50%", border:`1.5px solid ${t.accent}`, backgroundColor:"transparent", color:t.accent, fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700" }}>−</button>
                <span style={{ fontSize:"15px", fontWeight:"800", color:t.text, minWidth:"20px", textAlign:"center" }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity+1)} style={{ width:"30px", height:"30px", borderRadius:"50%", border:"none", backgroundColor:t.accent, color:"#fff", fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700" }}>+</button>
              </div>
              <div style={{ textAlign:"right", minWidth:"70px" }}>
                <p style={{ fontSize:"15px", fontWeight:"800", color:t.text, margin:"0 0 4px 0" }}>₹{(item.price*item.quantity).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.id)} style={{ background:"none", border:"none", color:"#e53e3e", fontSize:"12px", cursor:"pointer", fontWeight:"700" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ backgroundColor:t.card, borderRadius:"14px", padding:"20px", border:t.cardBorder, boxShadow:t.shadow, marginBottom:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ color:t.subText, fontSize:"14px" }}>Subtotal ({totalItems} items)</span>
            <span style={{ color:t.text, fontWeight:"700" }}>₹{totalPrice.toFixed(2)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ color:t.subText, fontSize:"14px" }}>Delivery fee</span>
            <span style={{ color:"#27ae60", fontWeight:"700" }}>FREE</span>
          </div>
          <div style={{ borderTop:`1px solid ${t.dark?"#2a2a3e":"#f0f0f0"}`, paddingTop:"12px", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"16px", fontWeight:"800", color:t.text }}>Total</span>
            <span style={{ fontSize:"18px", fontWeight:"900", color:t.accent }}>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={() => navigate("/checkout")} style={{ width:"100%", backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"10px", padding:"16px", fontSize:"15px", fontWeight:"700", cursor:"pointer", boxShadow:"0 4px 14px rgba(245,166,35,0.4)", fontFamily:"'Segoe UI',sans-serif" }}>
          Proceed to Checkout →
        </button>
      </div>

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}