import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function Checkout() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, totalPrice, kitchenId, clearCart } = useCart();
  const { addOrder, loading } = useOrders();

  // Redirect if not logged in or cart is empty
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" }, replace: true });
      return;
    }
    if (!cart || cart.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [user, cart, navigate]);

  // Address
  const [flat, setFlat]       = useState("");
  const [street, setStreet]   = useState("");
  const [city, setCity]       = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError]     = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod" | "online"
  const [processing, setProcessing]       = useState(false);

  // Coupon
  const [couponCode, setCouponCode]       = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(null); // { code, discount, message }
  const [couponError, setCouponError]     = useState("");

  const fullAddress = flat && street && city && pincode ? `${flat}, ${street}, ${city} - ${pincode}` : "";
  const discount = couponApplied?.discount || 0;
  const finalTotal = Math.max(0, totalPrice - discount);

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Apply Coupon ──
  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) { setCouponError("Enter a coupon code"); return; }
    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(couponCode.trim(), totalPrice);
      setCouponApplied({ code: res.code, discount: res.discount, message: res.message });
    } catch (err) {
      setCouponError(err.message || "Invalid coupon");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  // ── Place Order ──
  const handleOrder = async () => {
    if (processing) return;
    setError("");
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    if (!cart || cart.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (!flat || !street || !city || !pincode) {
      setError("Please fill all address fields");
      return;
    }
    setProcessing(true);

    try {
      // Step 1: Place the order
      const res = await addOrder({
        user:      { name: user.name, mobile: user.mobile },
        kitchenId: kitchenId || cart[0]?.kitchenId || cart[0]?.kitchen_id,
        items:     cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, kitchenId: i.kitchenId })),
        total:     finalTotal,
        address:   fullAddress,
      });

      if (!res.success) {
        if (typeof res.error === "string" && (res.error.includes("Invalid or expired token") || res.error.includes("token"))) {
          logout();
          navigate("/login", { state: { from: "/checkout" } });
          return;
        }
        setError(res.error || "Failed to place order");
        setProcessing(false);
        return;
      }

      // Mark coupon as used
      if (couponApplied?.code) {
        try { await api.useCoupon(couponApplied.code); } catch {}
      }

      // Step 2: Handle payment
      if (paymentMethod === "online") {
        await handleOnlinePayment(res.order);
      } else {
        // COD — verified success
        clearCart();
        navigate("/order-success", { state: { order: res.order, paymentMethod: "cod" } });
      }
    } catch (err) {
      if (typeof err.message === "string" && (err.message.includes("Invalid or expired token") || err.message.includes("token"))) {
        logout();
        navigate("/login", { state: { from: "/checkout" } });
        return;
      }
      setError(err.message || "Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  // ── Online Payment (Razorpay) ──
  const handleOnlinePayment = async (order) => {
    try {
      const paymentOrder = await api.createPaymentOrder(finalTotal, order.id);

      if (paymentOrder.mock) {
        setError("Online payment gateway requires active Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET). Please select Cash on Delivery to complete your order.");
        setProcessing(false);
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Midnight Monk 🌙",
        description: `Order #${(order.id || "").slice(-6).toUpperCase()}`,
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appOrderId: order.id,
              paymentMethod: "online",
            });
            clearCart();
            navigate("/order-success", { state: { order, paymentMethod: "online", paid: true } });
          } catch (vErr) {
            setError(vErr.message || "Payment verification failed. Please contact support.");
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          contact: user?.mobile || "",
        },
        theme: { color: "#C9783E" },
        modal: {
          ondismiss: () => {
            setError("Online payment was cancelled. Your cart is preserved — you can try again or choose Cash on Delivery.");
            setProcessing(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setError("Razorpay checkout SDK is not loaded. Please select Cash on Delivery to proceed.");
        setProcessing(false);
      }
    } catch (err) {
      setError(err.message || "Online payment unavailable. Please select Cash on Delivery.");
      setProcessing(false);
    }
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

      <div style={{ padding:"24px", maxWidth:"560px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"16px" }}>

        {/* ── Order Summary ── */}
        <div style={card(t)}>
          <h3 style={section(t)}>🧾 Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${t.dark?"#2a2a3e":"#f5f5f5"}`, fontSize:"14px", color:t.subText }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight:"700", color:t.text }}>₹{(item.price*item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"12px", fontSize:"14px", color:t.subText }}>
            <span>Subtotal</span>
            <span style={{ fontWeight:"700", color:t.text }}>₹{totalPrice.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"6px", fontSize:"14px" }}>
              <span style={{ color:"#27ae60", fontWeight:"700" }}>🎟️ Coupon Discount</span>
              <span style={{ color:"#27ae60", fontWeight:"800" }}>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"10px", borderTop:`1.5px solid ${t.dark?"#2a2a3e":"#f0f0f0"}`, marginTop:"8px" }}>
            <span style={{ fontSize:"16px", fontWeight:"900", color:t.text }}>Total</span>
            <span style={{ color:t.accent, fontSize:"20px", fontWeight:"900" }}>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* ── 🎟️ Coupon Code ── */}
        <div style={card(t)}>
          <h3 style={section(t)}>🎟️ Apply Coupon</h3>
          {couponApplied ? (
            <div style={{
              backgroundColor: "#27ae6015", border: "1.5px solid #27ae6044",
              borderRadius: "10px", padding: "12px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#27ae60", margin: "0 0 2px 0" }}>
                  {couponApplied.message}
                </p>
                <p style={{ fontSize: "11px", color: t.subText, margin: 0 }}>
                  Code: <strong>{couponApplied.code}</strong>
                </p>
              </div>
              <button onClick={removeCoupon} style={{
                background: "none", border: "none", color: "#e53e3e",
                fontSize: "12px", fontWeight: "700", cursor: "pointer",
              }}>Remove</button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Enter coupon code"
                  style={{
                    flex: 1, border: `1.5px solid ${couponError ? "#e53e3e" : (t.dark?"#2a2a3e":"#e0e0e0")}`,
                    borderRadius: "8px", padding: "10px 14px", fontSize: "14px",
                    outline: "none", fontFamily: "'Segoe UI',sans-serif",
                    backgroundColor: t.input, color: t.text, letterSpacing: "1px",
                    fontWeight: "700",
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  style={{
                    backgroundColor: t.accent, color: "#fff", border: "none",
                    borderRadius: "8px", padding: "10px 18px", fontSize: "13px",
                    fontWeight: "700", cursor: "pointer", fontFamily: "'Segoe UI',sans-serif",
                    opacity: couponLoading ? 0.7 : 1,
                  }}
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
              {couponError && (
                <p style={{ fontSize: "12px", color: "#e53e3e", margin: "6px 0 0 0", fontWeight: "600" }}>
                  ⚠️ {couponError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 📍 Delivery Address ── */}
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
            <div style={{ marginTop:"14px", backgroundColor:t.bgSoft, borderRadius:"8px", padding:"10px 14px", border:`1px solid ${t.border}` }}>
              <p style={{ fontSize:"11px", color:t.mutedText, fontWeight:"700", margin:"0 0 4px 0" }}>DELIVERY TO</p>
              <p style={{ fontSize:"13px", color:t.text, fontWeight:"600", margin:0 }}>{fullAddress}</p>
            </div>
          )}
        </div>

        {/* ── 💳 Payment Method ── */}
        <div style={card(t)}>
          <h3 style={section(t)}>💳 Payment Method</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { key: "cod", icon: "💵", label: "Cash on Delivery", desc: "Pay when your food arrives" },
              { key: "online", icon: "💳", label: "Pay Online", desc: "UPI / Card / Netbanking via Razorpay" },
            ].map(m => (
              <div
                key={m.key}
                onClick={() => setPaymentMethod(m.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px", borderRadius: "12px",
                  border: paymentMethod === m.key
                    ? `2px solid ${t.accent}`
                    : `1.5px solid ${t.dark ? "#2a2a3e" : "#e0e0e0"}`,
                  backgroundColor: paymentMethod === m.key
                    ? (t.dark ? "#1a1a2e" : "#fff8ed")
                    : "transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {/* Radio */}
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  border: `2px solid ${paymentMethod === m.key ? t.accent : (t.dark ? "#3a3a4e" : "#ccc")}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {paymentMethod === m.key && (
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: t.accent }} />
                  )}
                </div>
                <span style={{ fontSize: "20px" }}>{m.icon}</span>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: t.text, margin: "0 0 2px 0" }}>{m.label}</p>
                  <p style={{ fontSize: "11px", color: t.subText, margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {!user && (
            <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "10px", background: "#fff8ed", border: `1px solid ${t.accent}55`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div>
                <p style={{ color: t.text, fontSize: "13px", fontWeight: "800", margin: "0 0 3px" }}>Want a faster checkout?</p>
                <p style={{ color: t.subText, fontSize: "11px", margin: 0 }}>Sign in to save your details and track orders.</p>
              </div>
              <button onClick={() => navigate("/login", { state: { from: "/checkout" } })} style={{ flexShrink: 0, background: "transparent", color: t.accentText, border: `1px solid ${t.accent}`, borderRadius: "8px", padding: "8px 12px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
                SIGN IN
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ backgroundColor:t.dark?"rgba(229,62,62,0.1)":"#fff5f5", border:"1px solid #fed7d7", borderRadius:"8px", padding:"12px", color:"#e53e3e", fontSize:"13px", fontWeight:"600" }}>⚠️ {error}</div>}

        {/* ── Place Order Button ── */}
        <button
          onClick={handleOrder}
          disabled={loading || processing}
          style={{
            ...btnStyle(t),
            opacity: (loading || processing) ? 0.55 : 1,
            cursor: (loading || processing) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          {processing ? (
            <>⏳ Processing...</>
          ) : paymentMethod === "online" ? (
            <>💳 Pay ₹{finalTotal.toFixed(2)} & Place Order</>
          ) : (
            <>🛵 Place Order · ₹{finalTotal.toFixed(2)} (COD)</>
          )}
        </button>

        {/* Security badge */}
        <p style={{ textAlign: "center", fontSize: "11px", color: t.mutedText, margin: "0 0 20px 0" }}>
          🔒 Secured by Razorpay · 256-bit SSL encryption
        </p>
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

const card    = (t) => ({ backgroundColor:t.card, borderRadius:"16px", padding:"20px", border:t.cardBorder, boxShadow:t.shadow });
const section = (t) => ({ fontSize:"13px", fontWeight:"800", color:t.text, margin:"0 0 14px 0", letterSpacing:"0.5px" });
const btnStyle= (t) => ({ backgroundColor:t.accent, color:"#fff", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:"700", cursor:"pointer", width:"100%", boxShadow:"0 4px 14px rgba(245,166,35,0.4)", fontFamily:"'Segoe UI',sans-serif" });
