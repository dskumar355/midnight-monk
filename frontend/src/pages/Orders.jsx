import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

const STEPS = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
const STATUS_C = { Placed: "#3498db", Preparing: "#e67e22", "Out for Delivery": "#9b59b6", Delivered: "#27ae60" };

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
  const [filter, setFilter] = useState("All");
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchUserOrders(user.mobile);
    setTimeout(() => setAnimIn(true), 100);

    const interval = setInterval(() => {
      fetchUserOrders(user.mobile);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const handleLogout = () => { logout(); navigate("/login"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: "48px", animation: "spin 1.2s linear infinite" }}>🌙</div>
      <p style={{ color: t.subText, fontSize: "14px", fontWeight: "600" }}>Fetching your orders...</p>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title="My Orders" backPath="/kitchens" backLabel="Home" onLogout={handleLogout}
        rightContent={
          <button onClick={() => navigate("/kitchens")} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "'Segoe UI',sans-serif" }}>
            + Order More
          </button>
        }
      />

      {/* Inject Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px", opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(16px)", transition: "all 0.4s ease" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: t.text, margin: "0 0 4px 0" }}>Your Orders 📦</h2>
          <p style={{ fontSize: "13px", color: t.subText, margin: 0 }}>{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["All", "Placed", "Preparing", "Out for Delivery", "Delivered"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: "20px", border: "none", cursor: "pointer",
              fontSize: "11px", fontWeight: "700", fontFamily: "'Segoe UI',sans-serif",
              backgroundColor: filter === f ? (STATUS_C[f] || t.accent) : (t.dark ? "#2a2a3e" : "#f0f0f0"),
              color: filter === f ? "#fff" : t.subText, transition: "all 0.2s",
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "64px" }}>🛵</span>
            <p style={{ fontSize: "18px", fontWeight: "800", color: t.text, margin: 0 }}>No orders here</p>
            <p style={{ fontSize: "13px", color: t.subText, margin: 0 }}>You haven't ordered anything yet</p>
            <button onClick={() => navigate("/kitchens")} style={{ backgroundColor: t.accent, color: "#fff", border: "none", borderRadius: "10px", padding: "13px 28px", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(245,166,35,0.4)", marginTop: "8px" }}>
              🍽️ Explore Kitchens
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((order, idx) => (
              <div key={order.id} style={{ opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(20px)", transition: `all 0.4s ease ${idx * 0.08}s` }}>
                <OrderCard order={order} t={t} />
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "28px", paddingBottom: "20px" }}>
            <button onClick={() => navigate("/kitchens")} style={{
              backgroundColor: "transparent", color: t.accent, border: `2px solid ${t.accent}`,
              borderRadius: "10px", padding: "12px 32px", fontSize: "14px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'Segoe UI',sans-serif", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accent; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = t.accent; }}
            >🛵 Order More Food</button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ORDER CARD
// ═══════════════════════════════════════════════
function OrderCard({ order, t }) {
  const stepIdx = STEPS.indexOf(order.status);
  const color = STATUS_C[order.status] || "#888";
  const isActive = order.status !== "Delivered";
  const showMap = order.status === "Out for Delivery" || order.status === "Preparing" || order.status === "Placed";

  const riderName = order.riderName || "Delivery Partner";
  const riderPhone = order.riderPhone || "9876543210";
  const avatar = getAvatar(riderName);

  const callPartner = () => window.open(`tel:${riderPhone}`);

  return (
    <div style={{ backgroundColor: t.card, borderRadius: "18px", overflow: "hidden", border: t.cardBorder, boxShadow: t.shadow }}>

      {/* Status Banner */}
      <div style={{ backgroundColor: color, padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>
            {order.status === "Placed" ? "📋" : order.status === "Preparing" ? "🍳" : order.status === "Out for Delivery" ? "🛵" : "✅"}
          </span>
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            {STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 }}>
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
                <p style={{ fontSize: "9px", color: i <= stepIdx ? color : t.mutedText, fontWeight: i <= stepIdx ? "700" : "400", textAlign: "center", margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>
          <div style={{ height: "4px", backgroundColor: t.dark ? "#2a2a3e" : "#e0e0e0", borderRadius: "2px", margin: "0 14px" }}>
            <div style={{ height: "100%", backgroundColor: color, borderRadius: "2px", width: `${(stepIdx / 3) * 100}%`, transition: "width 0.6s ease", boxShadow: `0 0 6px ${color}` }} />
          </div>
        </div>

        {/* 🗺️ LIVE MAP — shows for all active orders */}
        {showMap && (
          <RiderMap order={order} t={t} color={color} />
        )}

        {/* Delivery Partner */}
        <div style={{ backgroundColor: t.dark ? "#1a1a2e" : "#f0f7ff", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", border: `1px solid ${t.dark ? "#2a3a5e" : "#dbeafe"}` }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: t.mutedText, margin: "0 0 8px 0", letterSpacing: "0.8px" }}>DELIVERY PARTNER</p>
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
        <div style={{ backgroundColor: t.dark ? "#1a2a1a" : "#f0fdf4", borderRadius: "12px", padding: "12px 14px", border: `1px solid ${t.dark ? "#2a4a2a" : "#bbf7d0"}` }}>
          <p style={{ fontSize: "10px", fontWeight: "800", color: t.mutedText, margin: "0 0 6px 0", letterSpacing: "0.8px" }}>DELIVERY ADDRESS</p>
          <p style={{ fontSize: "13px", color: t.text, fontWeight: "600", margin: 0 }}>📍 {order.address}</p>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  RIDER MAP COMPONENT (Leaflet + simulated GPS)
// ═══════════════════════════════════════════════
function RiderMap({ order, t, color }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const riderMarker = useRef(null);
  const animFrame = useRef(null);
  const progressRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(order.etaMinutes || 20);
  const [coords, setCoords] = useState(null);

  // Kitchen coords — use a fixed offset from delivery address
  // (simulates kitchen being ~1-2km away)
  const getKitchenCoord = (userCoord) => ({
    lat: userCoord.lat + (Math.random() * 0.02 - 0.01) + 0.012,
    lng: userCoord.lng + (Math.random() * 0.02 - 0.01) + 0.008,
  });

  useEffect(() => {
    // Geocode the delivery address
    geocodeAddress(order.address).then(coord => {
      if (coord) {
        setCoords(coord);
      } else {
        // Fallback: use Bangalore center if geocoding fails
        setCoords({ lat: 12.9716, lng: 77.5946 });
      }
      setLoading(false);
    });
  }, [order.address]);

  useEffect(() => {
    if (!coords || !mapRef.current || mapInstance.current) return;

    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      const userCoord = coords;
      const kitchenCoord = getKitchenCoord(userCoord);
      const midCoord = interpolate(kitchenCoord, userCoord, 0.5);

      // Init map centered between kitchen and user
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView([midCoord.lat, midCoord.lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      // ── User destination marker (home icon) ──
      const userIcon = L.divIcon({
        html: `<div style="background:#27ae60;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
                 <span style="transform:rotate(45deg);font-size:16px">🏠</span>
               </div>`,
        iconSize: [36, 36], iconAnchor: [18, 36], className: "",
      });

      // ── Kitchen marker ──
      const kitchenIcon = L.divIcon({
        html: `<div style="background:#e67e22;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
                 <span style="font-size:16px">🍳</span>
               </div>`,
        iconSize: [34, 34], iconAnchor: [17, 17], className: "",
      });

      // ── Rider marker (animated 🛵) ──
      const riderIcon = L.divIcon({
        html: `<div id="rider-pin" style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.4);transition:all 0.3s">
                 <span style="font-size:20px">🛵</span>
               </div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], className: "",
      });

      L.marker([userCoord.lat, userCoord.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("📍 Your Location");

      L.marker([kitchenCoord.lat, kitchenCoord.lng], { icon: kitchenIcon })
        .addTo(map)
        .bindPopup("🍳 Kitchen");

      // ── Dashed route line ──
      L.polyline([
        [kitchenCoord.lat, kitchenCoord.lng],
        [userCoord.lat, userCoord.lng],
      ], {
        color: color, weight: 3, dashArray: "8, 8", opacity: 0.7,
      }).addTo(map);

      // ── Rider starts at kitchen ──
      const rider = L.marker([kitchenCoord.lat, kitchenCoord.lng], { icon: riderIcon }).addTo(map);
      riderMarker.current = rider;
      mapInstance.current = map;

      // ── Animate rider along the route ──
      // Full journey = 60 seconds simulation (looks real)
      const DURATION = 60000;
      const startTime = Date.now() - (progressRef.current * DURATION);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t_val = Math.min(elapsed / DURATION, 1);
        progressRef.current = t_val;

        const pos = interpolate(kitchenCoord, userCoord, t_val);
        rider.setLatLng([pos.lat, pos.lng]);

        // Update ETA countdown
        const remaining = Math.max(0, Math.round((1 - t_val) * (order.etaMinutes || 20)));
        setEta(remaining);

        if (t_val < 1) {
          animFrame.current = requestAnimationFrame(animate);
        } else {
          // Rider reached destination
          rider.setLatLng([userCoord.lat, userCoord.lng]);
          setEta(0);
        }
      };

      animFrame.current = requestAnimationFrame(animate);
      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [coords]);

  if (loading) return (
    <div style={{ height: "200px", borderRadius: "12px", backgroundColor: t.dark ? "#1a1a2e" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", color: t.subText, fontSize: "13px", fontWeight: "600" }}>
      🗺️ Loading map...
    </div>
  );

  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Map Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: "12px", fontWeight: "800", color: t.text }}>
            {order.status === "Out for Delivery" ? "Rider is on the way!" : order.status === "Preparing" ? "Order being prepared" : "Order placed"}
          </span>
        </div>
        <span style={{ fontSize: "12px", fontWeight: "700", color: color }}>
          {eta > 0 ? `⏱️ ${eta} min away` : "🎉 Arriving now!"}
        </span>
      </div>

      {/* Map Container */}
      <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: `2px solid ${color}33`, boxShadow: `0 4px 16px ${color}22` }}>
        <div ref={mapRef} style={{ height: "220px", width: "100%" }} />

        {/* Legend overlay */}
        <div style={{ position: "absolute", bottom: "10px", left: "10px", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: "8px", padding: "6px 10px", zIndex: 1000, display: "flex", gap: "12px" }}>
          <span style={{ fontSize: "11px", color: "#fff" }}>🍳 Kitchen</span>
          <span style={{ fontSize: "11px", color: "#fff" }}>🛵 Rider</span>
          <span style={{ fontSize: "11px", color: "#fff" }}>🏠 You</span>
        </div>
      </div>
    </div>
  );
}