import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { subscribeToOrder } from "../services/socket";
import Navbar from "../components/Navbar";
import LeafletTrackingMap from "../components/LeafletTrackingMap";

const STATUS_STEPS = [
  { key: "PREPARING", label: "Preparing", icon: "🍳", desc: "Kitchen is preparing your feast" },
  { key: "PICKED_UP", label: "Picked Up", icon: "📦", desc: "Order packed & picked up" },
  { key: "OUT_FOR_DELIVERY", label: "On The Way", icon: "🛵", desc: "Rider is heading your way" },
  { key: "DELIVERED", label: "Delivered", icon: "✅", desc: "Delivered at your doorstep" },
];

function getActiveStepIndex(status) {
  if (status === "DELIVERED") return 3;
  if (status === "OUT_FOR_DELIVERY") return 2;
  if (status === "PICKED_UP" || status === "ASSIGNED" || status === "READY") return 1;
  return 0; // ORDER_PLACED, ACCEPTED, PREPARING
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveToast, setLiveToast] = useState("");
  const pollTimerRef = useRef(null);

  const fetchTrackingData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await api.getOrderTracking(orderId);
      setTracking(data);
      setError(null);
    } catch (err) {
      console.warn("⚠️ Failed to load order tracking:", err.message);
      if (isInitial) {
        setError(err.message || "Failed to load order tracking");
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [orderId]);

  // ── Initial Fetch & Polling ──
  useEffect(() => {
    fetchTrackingData(true);

    // Poll every 6 seconds while order is active
    pollTimerRef.current = setInterval(() => {
      fetchTrackingData(false);
    }, 6000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTrackingData]);

  // ── Stop polling when order is DELIVERED or CANCELLED ──
  useEffect(() => {
    if (tracking?.status === "DELIVERED" || tracking?.status === "CANCELLED") {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  }, [tracking?.status]);

  const [secondsAgo, setSecondsAgo] = useState(null);

  useEffect(() => {
    if (!tracking?.last_gps_update) {
      setSecondsAgo(null);
      return;
    }
    const updateSecs = () => {
      try {
        const last = new Date(tracking.last_gps_update).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - last) / 1000));
        setSecondsAgo(diff);
      } catch {
        setSecondsAgo(null);
      }
    };
    updateSecs();
    const interval = setInterval(updateSecs, 1000);
    return () => clearInterval(interval);
  }, [tracking?.last_gps_update]);

  // ── Real-time Socket.IO subscription ──
  useEffect(() => {
    if (!orderId) return;

    const unsub = subscribeToOrder(orderId, (data) => {
      // If it's a live GPS location update
      if (data?.rider && data.rider.lat != null && data.rider.lng != null) {
        setTracking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            is_real_gps: true,
            last_gps_update: data.last_updated || new Date().toISOString(),
            status: data.status || prev.status,
            distance_km: data.distance_km != null ? data.distance_km : prev.distance_km,
            eta_minutes: data.eta_minutes != null ? data.eta_minutes : prev.eta_minutes,
            rider: {
              ...prev.rider,
              ...data.rider,
            },
            tracking: {
              ...(prev.tracking || {}),
              rider_lat: data.rider.lat,
              rider_lng: data.rider.lng,
              accuracy: data.rider.accuracy,
              is_real_gps: true,
              last_updated: data.last_updated,
            },
          };
        });
      } else if (data?.status) {
        setLiveToast(`🔔 Order update: ${data.status}`);
        setTimeout(() => setLiveToast(""), 4000);
        fetchTrackingData(false);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [orderId, fetchTrackingData]);

  const activeIndex = getActiveStepIndex(tracking?.status);
  const isDelivered = tracking?.status === "DELIVERED";
  const isOut = tracking?.status === "OUT_FOR_DELIVERY";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const callRider = () => {
    if (tracking?.rider?.phone) {
      window.open(`tel:${tracking.rider.phone}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: t.bg || "#0f0f1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        color: t.text || "#fff",
      }}>
        <div style={{ fontSize: "52px", animation: "bounceSpin 1.2s infinite" }}>🛵</div>
        <h3 style={{ margin: "16px 0 6px 0", color: t.accent || "#C9783E" }}>Loading Live Tracking...</h3>
        <p style={{ color: t.mutedText || "#888", fontSize: "13px", margin: 0 }}>Connecting with delivery fleet</p>
        <style>{`
          @keyframes bounceSpin {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: t.bg || "#0f0f1a", fontFamily: "'Segoe UI', sans-serif" }}>
        <Navbar title="Live Tracking" backPath="/orders" backLabel="Orders" onLogout={handleLogout} />
        <div style={{
          maxWidth: "460px",
          margin: "80px auto",
          padding: "36px 24px",
          backgroundColor: t.card || "#1a1a2e",
          borderRadius: "20px",
          textAlign: "center",
          border: `1px solid ${t.border || "rgba(201,120,62,0.2)"}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}>
          <span style={{ fontSize: "52px" }}>🔐</span>
          <h2 style={{ color: t.text || "#fff", margin: "14px 0 8px 0" }}>Sign In Required</h2>
          <p style={{ color: t.textSoft || "#aaa", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
            Please sign in to your Midnight Monk account to view real-time delivery tracking for this order.
          </p>
          <button
            onClick={() => navigate("/login", { state: { from: `/track-order/${orderId}` } })}
            style={{
              backgroundColor: t.accent || "#C9783E",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "13px 28px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🔑 Sign In to View Tracking
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    let displayError = error;
    if (typeof error === "string" && (error.includes("Failed to fetch") || error.includes("NetworkError"))) {
      displayError = "We couldn't connect to the server. Please check your internet connection or try again.";
    } else if (typeof error === "string" && (error.includes("Unauthorized") || error.includes("403"))) {
      displayError = "You do not have permission to view this order. Please log into the account that placed it.";
    } else if (typeof error === "string" && (error.includes("404") || error.toLowerCase().includes("not found"))) {
      displayError = "Order not found. Please check your order ID or view your recent orders.";
    }

    return (
      <div style={{ minHeight: "100vh", backgroundColor: t.bg || "#0f0f1a", fontFamily: "'Segoe UI', sans-serif" }}>
        <Navbar title="Live Tracking" backPath="/orders" backLabel="Orders" onLogout={handleLogout} />
        <div style={{
          maxWidth: "500px",
          margin: "80px auto",
          padding: "32px 24px",
          backgroundColor: t.card || "#1a1a2e",
          borderRadius: "20px",
          textAlign: "center",
          border: `1px solid ${t.border || "rgba(201,120,62,0.2)"}`,
        }}>
          <span style={{ fontSize: "52px" }}>⚠️</span>
          <h2 style={{ color: t.text || "#fff", margin: "14px 0 8px 0" }}>Tracking Unavailable</h2>
          <p style={{ color: t.textSoft || "#aaa", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
            {displayError}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => fetchTrackingData(true)}
              style={{
                backgroundColor: t.accent || "#C9783E",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "12px 22px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              🔄 Retry
            </button>
            <button
              onClick={() => navigate("/orders")}
              style={{
                backgroundColor: "transparent",
                color: t.accent || "#C9783E",
                border: `1px solid ${t.accent || "#C9783E"}`,
                borderRadius: "10px",
                padding: "12px 22px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              📦 View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: t.bg || "#0f0f1a",
      color: t.text || "#1a1a1a",
      fontFamily: "'Segoe UI', sans-serif",
      paddingBottom: "60px",
    }}>
      <Navbar
        title="Live Order Tracking"
        backPath="/orders"
        backLabel="My Orders"
        onLogout={handleLogout}
        rightContent={
          <button
            onClick={() => navigate("/kitchens")}
            style={{
              backgroundColor: t.accent || "#C9783E",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            + Order More
          </button>
        }
      />

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 16px" }}>
        {/* ── Order Header ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>🌙</span>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", color: t.accent || "#C9783E" }}>
                MIDNIGHT MONK TRACKING
              </span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: "900", margin: "0 0 4px 0", color: t.text || "#fff" }}>
              ORDER #{orderId?.slice(-8).toUpperCase()}
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: t.mutedText || "#888" }}>
              From <strong style={{ color: t.text }}>{tracking?.kitchen?.name || "Kitchen"}</strong>
            </p>
          </div>

          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <span style={{
              backgroundColor: isDelivered ? "#16a34a" : isOut ? "#C9783E" : "#3b82f6",
              color: "#fff",
              fontWeight: "800",
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}>
              {isDelivered ? "✅ Delivered" : isOut ? "🛵 Out for Delivery" : "🍳 Preparing"}
            </span>

            {tracking?.otp && !isDelivered && (
              <span style={{
                backgroundColor: "rgba(245,166,35,0.15)",
                color: "#F5A623",
                border: "1px solid rgba(245,166,35,0.4)",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "800",
              }}>
                Delivery OTP: {tracking.otp}
              </span>
            )}

            {isOut && (
              <span style={{
                backgroundColor: tracking?.is_real_gps ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                color: tracking?.is_real_gps ? "#4ade80" : "#facc15",
                border: `1px solid ${tracking?.is_real_gps ? "rgba(34,197,94,0.4)" : "rgba(234,179,8,0.4)"}`,
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: tracking?.is_real_gps ? "#22c55e" : "#eab308",
                  display: "inline-block",
                }} />
                {tracking?.is_real_gps
                  ? `Live GPS ${secondsAgo != null ? `(${secondsAgo}s ago)` : ""}`
                  : "Connecting Rider GPS..."}
              </span>
            )}
          </div>
        </div>

        {/* ── Status Stepper Bar ── */}
        <div style={{
          backgroundColor: t.card || "#1a1a2e",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "20px",
          border: `1px solid ${t.border || "rgba(201,120,62,0.15)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {/* Progress line behind steps */}
            <div style={{
              position: "absolute",
              top: "20px",
              left: "12%",
              right: "12%",
              height: "4px",
              backgroundColor: "rgba(255,255,255,0.08)",
              zIndex: 0,
            }}>
              <div style={{
                height: "100%",
                width: `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                backgroundColor: t.accent || "#C9783E",
                transition: "width 0.6s ease",
              }} />
            </div>

            {STATUS_STEPS.map((step, idx) => {
              const isPastOrCurrent = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={step.key} style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  zIndex: 1,
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: isCurrent
                      ? t.accent || "#C9783E"
                      : isPastOrCurrent
                      ? "#16a34a"
                      : (t.cardAlt || "#2a2a3e"),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    border: isCurrent ? "3px solid #fff" : "none",
                    boxShadow: isCurrent ? `0 0 14px ${t.accent || "#C9783E"}` : "none",
                    transition: "all 0.3s",
                  }}>
                    {isCurrent ? step.icon : isPastOrCurrent ? "✓" : step.icon}
                  </div>
                  <p style={{
                    margin: "8px 0 2px 0",
                    fontSize: "12px",
                    fontWeight: isPastOrCurrent ? "800" : "500",
                    color: isPastOrCurrent ? (t.text || "#fff") : (t.mutedText || "#666"),
                    textAlign: "center",
                  }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Map Layout (60-70vh on mobile, responsive desktop) ── */}
        <div style={{ marginBottom: "20px" }}>
          <LeafletTrackingMap
            trackingData={tracking}
            orderStatus={tracking?.status}
            etaMinutes={tracking?.eta_minutes}
            distanceKm={tracking?.distance_km}
            isRealGps={tracking?.is_real_gps}
            secondsAgo={secondsAgo}
            height="min(65vh, 480px)"
            t={t}
          />
        </div>

        {/* ── Tracking Info Cards Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}>
          {/* Card 1: Live Status & ETA */}
          <div style={{
            backgroundColor: t.card || "#1a1a2e",
            borderRadius: "16px",
            padding: "20px",
            border: `1px solid ${t.border || "rgba(201,120,62,0.15)"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: t.accent || "#C9783E", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                DELIVERY STATUS
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: "900", margin: "6px 0 8px 0", color: t.text || "#fff" }}>
                {isDelivered
                  ? "🎉 Order Delivered!"
                  : isOut
                  ? "🛵 Your order is on the way!"
                  : "🍳 Preparing your hot meal"}
              </h2>
              <p style={{ fontSize: "13px", color: t.textSoft || "#aaa", margin: 0 }}>
                {isDelivered
                  ? "Enjoy your food! Rate your experience from your orders page."
                  : isOut
                  ? "The rider has picked up your food and is riding towards your address."
                  : "The kitchen is packing your items with midnight care."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "18px", borderTop: `1px solid ${t.border || "rgba(255,255,255,0.08)"}`, paddingTop: "14px" }}>
              <div>
                <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: t.mutedText || "#888", fontWeight: "800" }}>ESTIMATED ARRIVAL</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#F5A623" }}>
                  {isDelivered ? "0 min" : `${tracking?.eta_minutes || 15} mins`}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: t.mutedText || "#888", fontWeight: "800" }}>DISTANCE</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: t.text || "#fff" }}>
                  {isDelivered ? "0.0 km" : `${tracking?.distance_km || 3.2} km`}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Delivery Partner & Destination */}
          <div style={{
            backgroundColor: t.card || "#1a1a2e",
            borderRadius: "16px",
            padding: "20px",
            border: `1px solid ${t.border || "rgba(201,120,62,0.15)"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            {/* Partner Details */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", color: t.mutedText || "#888", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                ASSIGNED RIDER
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(201,120,62,0.15)",
                    border: `2px solid ${t.accent || "#C9783E"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}>
                    🧑
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: t.text || "#fff" }}>
                      {tracking?.rider?.name || "Delivery Fleet Partner"}
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: t.mutedText || "#888" }}>
                      📞 +91 {tracking?.rider?.phone || "9876543210"}
                    </p>
                  </div>
                </div>

                {!isDelivered && (
                  <button
                    onClick={callRider}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📞 Call
                  </button>
                )}
              </div>
            </div>

            {/* Destination Address */}
            <div style={{
              backgroundColor: t.cardAlt || "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              padding: "10px 14px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{ margin: "0 0 2px 0", fontSize: "10px", fontWeight: "800", color: t.mutedText || "#888", textTransform: "uppercase" }}>
                DELIVERY ADDRESS
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: t.text || "#fff", fontWeight: "600" }}>
                📍 {tracking?.customer?.address || "Delivery Location"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Order Items Summary ── */}
        {tracking?.items && tracking.items.length > 0 && (
          <div style={{
            backgroundColor: t.card || "#1a1a2e",
            borderRadius: "16px",
            padding: "18px 20px",
            border: `1px solid ${t.border || "rgba(201,120,62,0.15)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "800", color: t.text || "#fff" }}>
                📦 ORDER SUMMARY ({tracking.items.length} item{tracking.items.length !== 1 ? "s" : ""})
              </span>
              <span style={{ fontSize: "16px", fontWeight: "900", color: t.accent || "#C9783E" }}>
                Total: ₹{tracking.total}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tracking.items.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: t.cardAlt || "rgba(255,255,255,0.04)",
                    border: `1px solid ${t.border || "rgba(255,255,255,0.08)"}`,
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: t.text || "#fff",
                  }}
                >
                  {item.name} ×{item.quantity || 1}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Toast Notification */}
      {liveToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: "700",
          boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
          zIndex: 9999,
          animation: "slideUpToast 0.3s ease",
        }}>
          {liveToast}
        </div>
      )}

      <style>{`
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
