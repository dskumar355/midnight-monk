import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { subscribeToOrder } from "../services/socket";
import { requestNotificationPermission, notifyOrderStatus } from "../services/pushNotifications";
import Navbar from "../components/Navbar";
import RatingModal from "../components/RatingModal";
import LeafletTrackingMap from "../components/LeafletTrackingMap";

const STEPS = ["ORDER_PLACED", "ACCEPTED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_C = { ORDER_PLACED: "#3498db", ACCEPTED: "#0ea5e9", PREPARING: "#e67e22", READY: "#8b5cf6", ASSIGNED: "#7c3aed", PICKED_UP: "#f97316", OUT_FOR_DELIVERY: "#22c55e", DELIVERED: "#16a34a" };

const getAvatar = (name) => {
  const avatars = ["🧑", "👨", "🧔", "👦", "🧑", "👨", "🧔", "👦", "🧑", "👨"];
  return avatars[(name?.charCodeAt(0) || 0) % avatars.length];
};

// ── Geocode address using OpenStreetMap Nominatim (free, no API key) ──
async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) { }
  return null;
}

// ── Interpolate between two points ──
function interpolate(start, end, t) {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { orders, fetchUserOrders, loading } = useOrders();
  const { clearCart, addToCart } = useCart();
  const [filter, setFilter] = useState("All");
  const [animIn, setAnimIn] = useState(false);
  const [reorderToast, setReorderToast] = useState("");
  const [ratingOrder, setRatingOrder] = useState(null); // order being rated
  const [ratedOrderIds, setRatedOrderIds] = useState(new Set());
  const [liveToast, setLiveToast] = useState(""); // socket update toast
  const socketUnsubs = useRef([]);

  const handleReorder = (order) => {
    // Clear existing cart and load items from this order
    clearCart();
    const kitchenId = order.kitchenId || order.kitchen_id;
    const kitchenName = order.kitchenName || order.kitchen_name || "Kitchen";
    order.items?.forEach(item => {
      // Add item quantity times
      for (let i = 0; i < (item.quantity || 1); i++) {
        addToCart({
          id: item.id || item.menu_id,
          name: item.name,
          price: item.price,
          kitchenId: kitchenId,
          kitchen_id: kitchenId,
        });
      }
    });
    // Store kitchen selection
    if (kitchenId) localStorage.setItem("selectedKitchen", kitchenId);
    if (kitchenName) localStorage.setItem("selectedKitchenName", kitchenName);

    setReorderToast(`🛒 ${order.items?.length} item${order.items?.length !== 1 ? "s" : ""} added to cart!`);
    setTimeout(() => {
      setReorderToast("");
      navigate("/cart");
    }, 1200);
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchUserOrders(user.mobile);
    setTimeout(() => setAnimIn(true), 100);
    // Request push notification permission
    requestNotificationPermission();

    const interval = setInterval(() => fetchUserOrders(user.mobile, { silent: true }), 15000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Subscribe to Socket.IO for each active order ──
  useEffect(() => {
    // Cleanup old subscriptions
    socketUnsubs.current.forEach(fn => fn?.());
    socketUnsubs.current = [];

    const activeOrders = orders.filter(o => o.status !== "DELIVERED");
    activeOrders.forEach(order => {
      const unsub = subscribeToOrder(order.id, (data) => {
        setLiveToast(`🔔 Order #${order.id.slice(-6).toUpperCase()}: ${data.status}`);
        setTimeout(() => setLiveToast(""), 4000);
        fetchUserOrders(user.mobile, { silent: true }); // silent refresh order list
        notifyOrderStatus(order.id, data.status); // Browser push notification
      });
      socketUnsubs.current.push(unsub);
    });

    return () => socketUnsubs.current.forEach(fn => fn?.());
  }, [orders]);

  // ── Check rated status for delivered orders ──
  useEffect(() => {
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
    deliveredOrders.forEach(async (order) => {
      if (!ratedOrderIds.has(order.id)) {
        try {
          const res = await api.checkRating(order.id);
          if (res.rated) {
            setRatedOrderIds(prev => new Set([...prev, order.id]));
          }
        } catch { /* ignore */ }
      }
    });
  }, [orders]);


  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading && orders.length === 0) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "48px", animation: "spin 1.2s linear infinite" }}>🌙</div>
      <p style={{ color: t.subText, fontSize: "14px", fontWeight: "600" }}>Fetching your orders...</p>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.dark ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.12)"}, transparent 28%), ${t.bg}`, fontFamily: "'Inter', sans-serif" }}>
      <Navbar title="My Orders" backPath="/kitchens" backLabel="Home" onLogout={handleLogout}
        rightContent={
          <button onClick={() => navigate("/kitchens")} style={{ backgroundColor: t.accent, color: "#111", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
            + Order More
          </button>
        }
      />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(16px, 4vw, 28px) clamp(14px, 3vw, 24px) 56px" }}>
        <div style={{ marginBottom: "20px", opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(12px)", transition: "all 0.4s ease" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accent }}>Your experience</div>
          <h2 style={{ fontSize: "clamp(28px, 6vw, 52px)", fontWeight: "700", color: t.text, margin: "10px 0 6px 0", lineHeight: 1.05 }}>Your Orders</h2>
          <p style={{ fontSize: "14px", color: t.textSoft, margin: 0 }}>{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {['All', 'ORDER_PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: filter === f ? "1px solid rgba(201,169,110,0.25)" : `1px solid ${t.border}`,
              background: filter === f ? t.accentSoft : (t.dark ? "rgba(255,255,255,0.02)" : "rgba(17,17,17,0.02)"),
              color: filter === f ? t.accentText : t.textSoft,
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "64px" }}>🛵</span>
            <p style={{ fontSize: "22px", fontWeight: "800", color: t.text, margin: 0 }}>No orders here</p>
            <p style={{ fontSize: "13px", color: t.textSoft, margin: 0 }}>You haven't ordered anything yet</p>
            <button onClick={() => navigate("/kitchens")} style={{ background: t.accent, color: "#111", border: "none", borderRadius: "12px", padding: "13px 28px", fontSize: "14px", fontWeight: "800", cursor: "pointer", marginTop: "8px" }}>
              🍽️ Explore Kitchens
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {filtered.map((order, idx) => (
              <div key={order.id} style={{ opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(12px)", transition: `all 0.4s ease ${idx * 0.08}s` }}>
                <OrderCard order={order} t={t} onReorder={handleReorder} onRate={() => setRatingOrder(order)} isRated={ratedOrderIds.has(order.id)} />
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "28px", paddingBottom: "20px" }}>
            <button onClick={() => navigate("/kitchens")} style={{ background: "transparent", color: t.accent, border: `1px solid ${t.borderStrong}`, borderRadius: "12px", padding: "12px 26px", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}>
              🛵 Order More Food
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {reorderToast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#27ae60", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", boxShadow: "0 8px 24px rgba(39,174,96,0.4)", zIndex: 9999, animation: "slideUp 0.3s ease" }}>
          {reorderToast}
        </div>
      )}

      {liveToast && (
        <div style={{ position: "fixed", top: "80px", right: "16px", backgroundColor: "#3498db", color: "#fff", padding: "12px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: "700", boxShadow: "0 8px 24px rgba(52,152,219,0.4)", zIndex: 9999, animation: "slideUp 0.3s ease", maxWidth: "280px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🔔</span> {liveToast}
        </div>
      )}

      {ratingOrder && (
        <RatingModal order={ratingOrder} t={t} onClose={() => setRatingOrder(null)} onSubmitted={() => { setRatedOrderIds(prev => new Set([...prev, ratingOrder.id])); }} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ORDER CARD
// ═══════════════════════════════════════════════
function OrderCard({ order, t, onReorder, onRate, isRated }) {
  const navigate = useNavigate();
  const stepIdx = STEPS.indexOf(order.status);
  const color = STATUS_C[order.status] || "#888";
  const isActive = order.status !== "DELIVERED";
  const showMap = order.status === "OUT_FOR_DELIVERY";

  const riderName = order.riderName || "Delivery Partner";
  const riderPhone = order.riderPhone || "9876543210";
  const avatar = getAvatar(riderName);

  const callPartner = () => window.open(`tel:${riderPhone}`);

  return (
    <div style={{ backgroundColor: t.card, borderRadius: "18px", overflow: "hidden", border: t.cardBorder, boxShadow: t.shadow }}>

      {/* Status Banner */}
      <div style={{ backgroundColor: color, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>{order.status === "OUT_FOR_DELIVERY" ? "🛵" : order.status === "DELIVERED" ? "✅" : "📦"}</span>
          <span style={{ fontSize: "13px", fontWeight: "800", color: "#fff" }}>{order.status}</span>
        </div>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div style={{ padding: "18px" }}>

        {/* Order ID + Amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: "900", color: t.text, margin: "0 0 2px 0" }}>Order #{order.id?.slice(-8).toUpperCase()}</p>
            <p style={{ fontSize: "11px", color: t.mutedText, margin: 0 }}>{order.items?.length} item{order.items?.length > 1 ? "s" : ""}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "18px", fontWeight: "900", color: t.accent, margin: "0 0 4px 0" }}>₹{order.total}</p>
            {isActive && (
              <span style={{ backgroundColor: t.dark ? "#1a1a2e" : "#0f0f1a", color: "#F5A623", fontWeight: "800", padding: "3px 10px", borderRadius: "6px", fontSize: "11px" }}>
                OTP: {order.otp}
              </span>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
          {order.items?.map((item, i) => (
            <span key={i} style={{ backgroundColor: t.dark ? "#2a2a3e" : "#f7f7f7", border: `1px solid ${t.dark ? "#3a3a4e" : "#eee"}`, borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: t.subText, fontWeight: "600" }}>
              {item.name} ×{item.quantity}
            </span>
          ))}
        </div>

        {/* Progress Steps */}
        <div style={{ backgroundColor: t.dark ? "#0f0f1a" : "#f9f9f9", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", overflowX: "auto", paddingBottom: "4px", gap: "6px" }}>
            {STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "55px", flex: 1 }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  backgroundColor: i <= stepIdx ? color : (t.dark ? "#2a2a3e" : "#e0e0e0"),
                  color: i <= stepIdx ? "#fff" : t.mutedText,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: "800",
                  boxShadow: i === stepIdx ? `0 0 0 4px ${color}33` : "none",
                  animation: i === stepIdx ? "pulse 2s infinite" : "none",
                  transition: "all 0.3s",
                }}>{i < stepIdx ? "✓" : i === stepIdx ? "●" : "○"}</div>
                <p style={{ fontSize: "9px", color: i <= stepIdx ? color : t.mutedText, fontWeight: i <= stepIdx ? "700" : "400", textAlign: "center", margin: 0, wordBreak: "break-word", lineHeight: 1.2 }}>{step.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
          <div style={{ height: "4px", backgroundColor: t.dark ? "#2a2a3e" : "#e0e0e0", borderRadius: "2px", margin: "0 14px" }}>
            <div style={{ height: "100%", backgroundColor: color, borderRadius: "2px", width: `${stepIdx <= 0 ? 0 : (stepIdx / (STEPS.length - 1)) * 100}%`, transition: "width 0.6s ease", boxShadow: `0 0 6px ${color}` }} />
          </div>
        </div>

        {/* ── 🗺️ LIVE ORDER TRACKING BUTTON ── */}
        {isActive && (
          <button
            onClick={() => navigate(`/track-order/${order.id}`)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "14px",
              background: "linear-gradient(135deg, #C9783E, #9F4F2D)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(201,120,62,0.3)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span>🗺️</span> Open Live Order Tracking →
          </button>
        )}

        {/* 🗺️ LIVE MAP — shows for out for delivery orders */}
        {showMap && (
          <RiderMap order={order} t={t} color={color} />
        )}

        {/* Delivery Partner */}
        <div style={{ backgroundColor: t.dark ? "#1a1a2e" : "#f0f7ff", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", border: `1px solid ${t.dark ? "#2a3a5e" : "#dbeafe"}` }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: t.mutedText, margin: "0 0 8px 0", letterSpacing: "0.8px" }}>DELIVERY PARTNER</p>
          {!order.deliveryAssignment?.partner_name && <p style={{ margin: 0, fontSize: "12px", color: t.subText }}>A partner will be assigned once the kitchen finishes prep.</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                {avatar}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: "800", color: t.text, margin: "0 0 2px 0" }}>{riderName}</p>
                <p style={{ fontSize: "11px", color: t.subText, margin: 0 }}>📞 +91 {riderPhone}</p>
              </div>
            </div>
            {isActive && (
              <button onClick={callPartner} style={{ backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Segoe UI',sans-serif" }}>
                📞 Call
              </button>
            )}
          </div>
        </div>

        {/* Address */}
        <div style={{ backgroundColor: t.dark ? "#1a2a3a" : "#f0fdf4", borderRadius: "12px", padding: "12px 14px", border: `1px solid ${t.dark ? "#2a4a2a" : "#bbf7d0"}`, marginBottom: "14px" }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: t.mutedText, margin: "0 0 6px 0", letterSpacing: "0.8px" }}>DELIVERY ADDRESS</p>
          <p style={{ fontSize: "13px", color: t.text, fontWeight: "600", margin: 0 }}>📍 {order.address}</p>
        </div>

        {/* ── 🔁 REORDER BUTTON ── */}
        {order.status === "Delivered" && (
          <div style={{ display: "flex", gap: "10px" }}>
            {/* Reorder */}
            <button
              onClick={() => onReorder(order)}
              style={{
                flex: 1, padding: "12px",
                background: `linear-gradient(135deg, ${t.accent}, #e67e22)`,
                color: "#fff", border: "none", borderRadius: "12px",
                fontSize: "13px", fontWeight: "800", cursor: "pointer",
                fontFamily: "'Segoe UI', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                boxShadow: `0 4px 16px ${t.accent}44`,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              🔁 Reorder
            </button>

            {/* Rate */}
            {isRated ? (
              <div style={{
                flex: 1, padding: "12px",
                backgroundColor: "#27ae6022", border: "1.5px solid #27ae6044",
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px",
              }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#27ae60" }}>✅ Rated</span>
              </div>
            ) : (
              <button
                onClick={() => onRate(order)}
                style={{
                  flex: 1, padding: "12px",
                  background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
                  color: "#fff", border: "none", borderRadius: "12px",
                  fontSize: "13px", fontWeight: "800", cursor: "pointer",
                  fontFamily: "'Segoe UI', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  boxShadow: "0 4px 16px #9b59b644",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                ⭐ Rate
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  RIDER MAP COMPONENT (Leaflet + OpenStreetMap Live Tracking)
// ═══════════════════════════════════════════════
function RiderMap({ order, t, color }) {
  const navigate = useNavigate();

  const trackingData = {
    order_id: order.id,
    status: order.status,
    rider: {
      lat: order.tracking?.rider_lat,
      lng: order.tracking?.rider_lng,
      name: order.riderName || "Delivery Partner",
      phone: order.riderPhone || "9876543210",
    },
    customer: {
      lat: order.tracking?.customer_lat,
      lng: order.tracking?.customer_lng,
      address: order.address,
    },
    kitchen: {
      lat: order.tracking?.kitchen_lat,
      lng: order.tracking?.kitchen_lng,
      name: order.kitchenName || "Kitchen",
      kitchen_id: order.kitchenId,
    },
    eta_minutes: order.tracking?.eta_minutes || order.etaMinutes || 15,
    distance_km: order.tracking?.distance_km || 3.2,
    progress: order.tracking?.rider_progress || 0.45,
  };

  return (
    <div style={{ marginBottom: "14px" }}>
      <LeafletTrackingMap
        trackingData={trackingData}
        orderStatus={order.status}
        etaMinutes={trackingData.eta_minutes}
        distanceKm={trackingData.distance_km}
        height="240px"
        t={t}
      />
      <button
        onClick={() => navigate(`/track-order/${order.id}`)}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "10px",
          backgroundColor: t.dark ? "rgba(201,120,62,0.15)" : "#FFF8EE",
          color: t.accent || "#C9783E",
          border: `1.5px solid ${t.accent || "#C9783E"}`,
          borderRadius: "10px",
          fontSize: "12px",
          fontWeight: "800",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <span>🗺️</span> Full Screen Live Tracking →
      </button>
    </div>
  );
}
