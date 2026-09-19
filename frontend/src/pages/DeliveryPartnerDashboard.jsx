import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useDeliveryAuth } from "../context/DeliveryAuthContext";
import { useOrders } from "../context/OrderContext";

const ACTIONS = {
  READY: { label: "Accept Delivery", next: "ASSIGNED" },
  ASSIGNED: { label: "Picked Up", next: "PICKED_UP" },
  PICKED_UP: { label: "Out for Delivery", next: "OUT_FOR_DELIVERY" },
  OUT_FOR_DELIVERY: { label: "Delivered", next: "DELIVERED" },
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 999;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DeliveryPartnerDashboard() {
  const navigate = useNavigate();
  const { partner, logout, updatePartner } = useDeliveryAuth();
  const { orders, fetchDeliveryOrders, updateDeliveryStatus, loading } = useOrders();
  const [dashboard, setDashboard] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [actionError, setActionError] = useState("");

  // Live GPS tracking state
  const [gpsStatus, setGpsStatus] = useState("IDLE"); // IDLE, SEARCHING, ACTIVE, PERMISSION_DENIED, UNAVAILABLE
  const [lastGpsCoords, setLastGpsCoords] = useState(null);
  const [gpsPingMsg, setGpsPingMsg] = useState("");
  const lastSentTimeRef = useRef(0);
  const lastSentCoordsRef = useRef(null);
  const lastUiTimeRef = useRef(0);
  const watchIdRef = useRef(null);
  const partnerRef = useRef(partner);
  partnerRef.current = partner;

  const activeDelivery = orders.find(
    (o) => o.status === "OUT_FOR_DELIVERY" || o.status === "PICKED_UP"
  );

  const load = async (silent = false) => {
    try {
      const [dashboardData] = await Promise.all([
        api.getDeliveryDashboard(),
        fetchDeliveryOrders({ silent }),
      ]);
      setDashboard(dashboardData);
      if (dashboardData?.partner) {
        const current = partnerRef.current;
        if (
          !current ||
          current.isOnline !== dashboardData.partner.isOnline ||
          current.name !== dashboardData.partner.name
        ) {
          updatePartner({ ...(current || {}), ...dashboardData.partner });
        }
      }
    } catch (err) {
      console.warn("Delivery dashboard load error:", err);
    }
  };

  useEffect(() => {
    if (!partner?.id) {
      navigate("/delivery/login");
      return;
    }
    load(false);
    const timer = setInterval(() => load(true), 15000);
    return () => clearInterval(timer);
  }, [partner?.id]);

  // ── Real Geolocation Tracking Effect ──
  useEffect(() => {
    const isOnline = dashboard?.partner?.isOnline;

    if (!isOnline || !activeDelivery) {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus(!isOnline ? "OFFLINE" : "IDLE");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsStatus("UNAVAILABLE");
      return;
    }

    setGpsStatus("SEARCHING");

    const onLocationSuccess = (pos) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      const now = Date.now();

      // Throttle UI updates: only re-render if 3s elapsed or moved >= 5m
      const prevCoords = lastSentCoordsRef.current;
      const distFromPrev = prevCoords ? getDistanceMeters(prevCoords.lat, prevCoords.lng, latitude, longitude) : 999;
      if (now - lastUiTimeRef.current >= 3000 || distFromPrev >= 5) {
        lastUiTimeRef.current = now;
        setLastGpsCoords({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          speed: speed != null ? Math.round(speed * 3.6) : null, // km/h
          heading,
          timestamp: new Date(),
        });
      }
      setGpsStatus("ACTIVE");

      // Throttling: minimum 5s interval AND (moved >= 10m OR elapsed >= 20s heartbeat)
      const timeElapsed = now - lastSentTimeRef.current;
      const distanceMoved = prevCoords
        ? getDistanceMeters(prevCoords.lat, prevCoords.lng, latitude, longitude)
        : 999;

      if (!prevCoords || (timeElapsed >= 5000 && (distanceMoved >= 10 || timeElapsed >= 20000))) {
        lastSentTimeRef.current = now;
        lastSentCoordsRef.current = { lat: latitude, lng: longitude };

        api.updateDeliveryLocation({
          orderId: activeDelivery.id,
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          speed,
          heading,
        }).catch((err) => console.warn("Could not push GPS to backend:", err));
      }
    };

    const onLocationError = (err) => {
      if (err.code === 1) {
        setGpsStatus("PERMISSION_DENIED");
      } else if (err.code === 3) {
        console.warn("GPS timeout, continuing to listen...");
      } else {
        setGpsStatus("UNAVAILABLE");
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [dashboard?.partner?.isOnline, activeDelivery?.id, activeDelivery?.status]);

  const sendManualGpsPing = (orderId) => {
    if (!("geolocation" in navigator)) {
      setGpsPingMsg("❌ Geolocation not supported");
      setTimeout(() => setGpsPingMsg(""), 3000);
      return;
    }
    setGpsPingMsg("📍 Requesting GPS fix...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        try {
          await api.updateDeliveryLocation({
            orderId,
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            speed,
            heading,
          });
          setLastGpsCoords({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            timestamp: new Date(),
          });
          setGpsStatus("ACTIVE");
          setGpsPingMsg("✅ GPS location broadcasted!");
          setTimeout(() => setGpsPingMsg(""), 3500);
        } catch (e) {
          setGpsPingMsg(`⚠️ ${e.message || "Failed to send GPS"}`);
          setTimeout(() => setGpsPingMsg(""), 3500);
        }
      },
      (err) => {
        setGpsPingMsg(`❌ GPS Error: ${err.message}`);
        setTimeout(() => setGpsPingMsg(""), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleOnline = async () => {
    const res = await api.updateDeliveryAvailability(!dashboard?.partner?.isOnline);
    setDashboard((prev) => ({ ...prev, partner: { ...prev.partner, ...res.partner } }));
    updatePartner({ ...partner, ...res.partner });
  };

  const handleAction = async (order) => {
    const action = ACTIONS[order.status];
    if (!action) return;
    setActionError("");

    if (action.next === "DELIVERED") {
      setOtpModalOrder(order);
      setOtpInput("");
      return;
    }

    setBusyId(order.id);
    try {
      const res = await updateDeliveryStatus(order.id, action.next);
      if (res?.error) {
        setActionError(res.error);
      } else {
        await load(true);
      }
    } catch (err) {
      setActionError(err.message || "Failed to update delivery status");
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmDelivery = async (e) => {
    if (e) e.preventDefault();
    if (!otpModalOrder) return;
    if (!otpInput.trim()) {
      setActionError("Please enter the 4-digit Delivery OTP from customer");
      return;
    }
    setBusyId(otpModalOrder.id);
    setActionError("");
    const payload = {
      otp: otpInput.trim(),
      ...(otpModalOrder.paymentMethod === "COD"
        ? { cashCollected: otpModalOrder.cod?.amount_expected || otpModalOrder.total }
        : {}),
    };
    try {
      const res = await updateDeliveryStatus(otpModalOrder.id, "DELIVERED", payload);
      if (res?.error) {
        setActionError(res.error);
      } else {
        setOtpModalOrder(null);
        setOtpInput("");
        await load(true);
      }
    } catch (err) {
      setActionError(err.message || "Failed to complete delivery");
    } finally {
      setBusyId("");
    }
  };

  const cards = [
    ["Status", dashboard?.partner?.availabilityStatus || "Offline"],
    ["Assigned Orders", dashboard?.assignedOrders?.length || 0],
    ["Today Deliveries", dashboard?.todayDeliveryCount || 0],
    ["Today Earnings", `₹${dashboard?.todayEarnings || 0}`],
  ];

  return (
    <div style={S.page}>
      <div style={S.top}>
        <div>
          <div style={S.eyebrow}>Delivery Partner Portal</div>
          <h1 style={S.title}>{dashboard?.partner?.name || partner?.name}</h1>
          <p style={S.sub}>{dashboard?.partner?.vehicleNumber || "Vehicle not added"} · {dashboard?.partner?.phone}</p>
        </div>
        <div style={S.actions}>
          <button style={{ ...S.toggle, background: dashboard?.partner?.isOnline ? "#16a34a" : "#475569" }} onClick={toggleOnline}>
            {dashboard?.partner?.isOnline ? "Go Offline" : "Go Online"}
          </button>
          <button style={S.logout} onClick={() => { logout(); navigate("/delivery/login"); }}>Logout</button>
        </div>
      </div>

      <div style={S.stats}>
        {cards.map(([label, value]) => <div key={label} style={S.statCard}><div style={S.statLabel}>{label}</div><div style={S.statValue}>{value}</div></div>)}
      </div>

      {/* ── Live Delivery GPS Status Card ── */}
      <div style={{
        background: gpsStatus === "ACTIVE"
          ? "rgba(34,197,94,0.12)"
          : gpsStatus === "SEARCHING"
          ? "rgba(234,179,8,0.12)"
          : gpsStatus === "PERMISSION_DENIED"
          ? "rgba(239,68,68,0.15)"
          : "rgba(15,23,42,0.6)",
        border: `1px solid ${
          gpsStatus === "ACTIVE"
            ? "rgba(34,197,94,0.3)"
            : gpsStatus === "SEARCHING"
            ? "rgba(234,179,8,0.3)"
            : gpsStatus === "PERMISSION_DENIED"
            ? "rgba(239,68,68,0.4)"
            : "rgba(148,163,184,0.15)"
        }`,
        borderRadius: "16px",
        padding: "14px 20px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>
            {gpsStatus === "ACTIVE"
              ? "🟢"
              : gpsStatus === "SEARCHING"
              ? "📡"
              : gpsStatus === "PERMISSION_DENIED"
              ? "📍"
              : "🛰️"}
          </span>
          <div>
            <div style={{ fontWeight: "800", fontSize: "14px", color: "#fff" }}>
              {gpsStatus === "ACTIVE"
                ? `Live GPS Active (±${lastGpsCoords?.accuracy || 10}m accuracy)`
                : gpsStatus === "SEARCHING"
                ? "Acquiring High-Accuracy GPS Satellite Fix..."
                : gpsStatus === "PERMISSION_DENIED"
                ? "Location Permission Blocked"
                : gpsStatus === "OFFLINE"
                ? "GPS Inactive (You are currently offline)"
                : "GPS Standby (Auto-activates when an order is in transit)"}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              {gpsStatus === "ACTIVE"
                ? `Coordinates: ${lastGpsCoords?.lat.toFixed(5)}, ${lastGpsCoords?.lng.toFixed(5)} · Broadcasting live to customer map`
                : gpsStatus === "PERMISSION_DENIED"
                ? "Please click the site settings icon in your browser address bar and set Location to 'Allow'."
                : "Customer map will receive real satellite coordinates using HTML5 Geolocation."}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {gpsPingMsg && (
            <span style={{ fontSize: "12px", color: "#F5A623", fontWeight: "700" }}>{gpsPingMsg}</span>
          )}
          {activeDelivery && (
            <button
              type="button"
              onClick={() => sendManualGpsPing(activeDelivery.id)}
              style={{
                background: "#f5a623",
                border: "none",
                borderRadius: "10px",
                color: "#111",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              📡 Send Instant Ping
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: "12px", padding: "12px 18px", color: "#fca5a5", marginBottom: "18px", fontWeight: "700", fontSize: "13px" }}>
          ⚠️ {actionError}
        </div>
      )}

      <div style={S.layout}>
        <section style={S.panel}>
          <h2 style={S.panelTitle}>Orders</h2>
          {loading && orders.length === 0 ? <p>Loading…</p> : orders.map((order) => {
            const action = ACTIONS[order.status];
            const isTransit = order.status === "OUT_FOR_DELIVERY" || order.status === "PICKED_UP";
            return (
              <div key={order.id} style={S.orderCard}>
                <div style={S.row}><strong>#{order.id.slice(-8).toUpperCase()}</strong><span style={S.badge}>{order.status}</span></div>
                <p style={S.meta}>{order.user?.name} · {order.user?.mobile || "No phone"}</p>
                <p style={S.meta}>Kitchen: {order.kitchenId}</p>
                <p style={S.meta}>Address: {order.address}</p>
                <p style={S.meta}>Payment: {order.paymentMethod} · {order.paymentStatus}</p>
                {order.paymentMethod === "COD" && <p style={S.cod}>Collect ₹{order.cod?.amount_expected || order.total}</p>}

                {isTransit && (
                  <div style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    margin: "12px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}>
                    <div>
                      <div style={{ color: "#86efac", fontWeight: "800", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                        Live GPS Tracking Active
                      </div>
                      {lastGpsCoords && (
                        <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
                          Accuracy: ±{lastGpsCoords.accuracy}m {lastGpsCoords.speed ? `· Speed: ${lastGpsCoords.speed} km/h` : ""}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => sendManualGpsPing(order.id)}
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                        padding: "5px 10px",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontWeight: "700",
                      }}
                    >
                      📡 GPS Ping
                    </button>
                  </div>
                )}

                <div style={S.items}>{order.items?.map((item, index) => <span key={index} style={S.item}>{item.name} x{item.quantity}</span>)}</div>
                {action && <button style={S.primary} disabled={busyId === order.id} onClick={() => handleAction(order)}>{busyId === order.id ? "Updating..." : action.label}</button>}
              </div>
            );
          })}
          {!loading && orders.length === 0 && <p style={S.empty}>No deliveries available right now.</p>}
        </section>

        <section style={S.panel}>
          <h2 style={S.panelTitle}>Recent Completed Deliveries</h2>
          {(dashboard?.completedDeliveries || []).map((order) => (
            <div key={order.id} style={S.doneCard}>
              <strong>#{order.id.slice(-8).toUpperCase()}</strong>
              <span>{order.user?.name}</span>
              <span>₹{order.total}</span>
            </div>
          ))}
          {!(dashboard?.completedDeliveries || []).length && <p style={S.empty}>No completed deliveries yet today.</p>}
        </section>
      </div>

      {/* OTP Verification Modal */}
      {otpModalOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}>
          <div style={{
            backgroundColor: "#0f172a",
            border: "1.5px solid #f5a623",
            borderRadius: "20px",
            padding: "28px",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#f5a623", fontSize: "20px" }}>🔐 Verify Customer OTP</h3>
            <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: "13px" }}>
              Please ask customer <strong>{otpModalOrder.user?.name}</strong> for the 4-digit Delivery OTP shown on their tracking screen.
            </p>

            {otpModalOrder.paymentMethod === "COD" && (
              <div style={{ background: "rgba(250,204,21,0.12)", border: "1px solid #facc15", borderRadius: "10px", padding: "10px 14px", color: "#fef08a", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
                💵 Collect ₹{otpModalOrder.cod?.amount_expected || otpModalOrder.total} Cash on Delivery
              </div>
            )}

            {actionError && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "8px 12px", color: "#fca5a5", fontSize: "12px", marginBottom: "14px" }}>
                ⚠️ {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmDelivery}>
              <label style={{ display: "block", color: "#cbd5e1", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>DELIVERY OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 4-digit OTP"
                autoFocus
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(148,163,184,0.3)",
                  background: "#1e293b",
                  color: "#fff",
                  fontSize: "20px",
                  letterSpacing: "6px",
                  textAlign: "center",
                  fontWeight: "900",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "20px",
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => { setOtpModalOrder(null); setOtpInput(""); setActionError(""); }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "10px",
                    padding: "12px",
                    color: "#cbd5e1",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === otpModalOrder.id}
                  style={{
                    flex: 1,
                    background: "#f5a623",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px",
                    color: "#111",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  {busyId === otpModalOrder.id ? "Verifying..." : "Verify & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(245,166,35,0.14), transparent 32%), #0b1220", color: "#e5edf5", padding: "clamp(16px, 4vw, 28px)" },
  top: { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "24px" },
  eyebrow: { color: "#f5a623", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "800" },
  title: { margin: "6px 0", fontSize: "clamp(24px, 5vw, 42px)" },
  sub: { margin: 0, color: "#94a3b8", fontSize: "13px" },
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  toggle: { border: "none", borderRadius: "12px", padding: "12px 18px", color: "#fff", fontWeight: "800", cursor: "pointer", minHeight: "44px" },
  logout: { border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#e5edf5", borderRadius: "12px", padding: "12px 18px", cursor: "pointer", minHeight: "44px" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 140px),1fr))", gap: "14px", marginBottom: "24px" },
  statCard: { background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: "18px", padding: "18px" },
  statLabel: { color: "#94a3b8", fontSize: "12px" },
  statValue: { fontSize: "26px", fontWeight: "900", marginTop: "8px" },
  layout: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "18px" },
  panel: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: "22px", padding: "clamp(14px, 3vw, 20px)" },
  panelTitle: { marginTop: 0, marginBottom: "16px", fontSize: "clamp(18px, 3vw, 22px)" },
  orderCard: { background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "16px", marginBottom: "12px", border: "1px solid rgba(148,163,184,0.12)" },
  row: { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  badge: { background: "rgba(245,166,35,0.12)", color: "#f5a623", borderRadius: "999px", padding: "5px 10px", fontSize: "11px", fontWeight: "800" },
  meta: { color: "#cbd5e1", fontSize: "13px", margin: "8px 0" },
  cod: { color: "#facc15", fontSize: "13px", fontWeight: "700" },
  items: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "12px 0" },
  item: { padding: "6px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", fontSize: "12px" },
  primary: { border: "none", background: "#f5a623", color: "#111", borderRadius: "10px", padding: "12px 14px", fontWeight: "800", cursor: "pointer", width: "100%", minHeight: "44px", fontSize: "14px" },
  doneCard: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", padding: "12px 0", borderBottom: "1px solid rgba(148,163,184,0.12)" },
  empty: { color: "#94a3b8" },
};
