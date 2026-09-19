import { useEffect, useRef, useState, useCallback, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// In-memory cache for road network routes
const routeCache = new Map();

// ── Haversine Distance Calculation (km) ──
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ── Create Leaflet DivIcon with inline SVG (eliminates Vite missing asset icon 404s) ──
function createCustomDivIcon(emoji, bg, border = "#FFFFFF", pulse = false) {
  const pulseHtml = pulse
    ? `<span style="
        position: absolute;
        top: -4px; left: -4px; right: -4px; bottom: -4px;
        border-radius: 50%;
        background-color: ${bg};
        opacity: 0.4;
        animation: leaflet-marker-pulse 2s infinite ease-out;
        pointer-events: none;
      "></span>`
    : "";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        ${pulseHtml}
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${bg};
          border: 3px solid ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.45);
          position: relative;
          z-index: 2;
          cursor: pointer;
        ">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

function LeafletTrackingMap({
  trackingData,
  orderStatus = "ORDER_PLACED",
  etaMinutes,
  distanceKm,
  isRealGps = false,
  secondsAgo = null,
  height = "380px",
  t = {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const kitchenMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const polylineRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastRiderPosRef = useRef(null);
  const boundsFittedRef = useRef(false);
  const lastRouteKeyRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const riderCoord = trackingData?.rider?.lat && trackingData?.rider?.lng ? trackingData.rider : null;
  const kitchenCoord = trackingData?.kitchen?.lat && trackingData?.kitchen?.lng ? trackingData.kitchen : null;
  const customerCoord = trackingData?.customer?.lat && trackingData?.customer?.lng ? trackingData.customer : null;

  const isOutForDelivery = orderStatus === "OUT_FOR_DELIVERY";
  const isDelivered = orderStatus === "DELIVERED";

  // Calculate local distance fallback if distanceKm is missing
  const activeDistance = distanceKm != null
    ? distanceKm
    : riderCoord && customerCoord
    ? calculateHaversineDistance(riderCoord.lat, riderCoord.lng, customerCoord.lat, customerCoord.lng)
    : kitchenCoord && customerCoord
    ? calculateHaversineDistance(kitchenCoord.lat, kitchenCoord.lng, customerCoord.lat, customerCoord.lng)
    : 3.2;

  const activeEta = etaMinutes != null
    ? etaMinutes
    : isDelivered
    ? 0
    : Math.max(5, Math.round(activeDistance * 4));

  // ── Auto-fit map bounds so Kitchen, Rider, Customer are visible ──
  const fitMapBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const points = [];
    if (kitchenCoord) points.push([kitchenCoord.lat, kitchenCoord.lng]);
    if (customerCoord) points.push([customerCoord.lat, customerCoord.lng]);
    if (riderCoord && (isOutForDelivery || isDelivered)) {
      points.push([riderCoord.lat, riderCoord.lng]);
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
        });
      } catch (err) {
        console.warn("Could not fit Leaflet map bounds:", err);
      }
    }
  }, [kitchenCoord, customerCoord, riderCoord, isOutForDelivery, isDelivered]);

  // ── Smooth interpolation for rider marker movement ──
  const animateRiderMarker = useCallback((startPos, endPos, duration = 1200) => {
    if (!riderMarkerRef.current || !startPos || !endPos) return;

    if (startPos.lat === endPos.lat && startPos.lng === endPos.lng) {
      riderMarkerRef.current.setLatLng([endPos.lat, endPos.lng]);
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const curLat = startPos.lat + (endPos.lat - startPos.lat) * ease;
      const curLng = startPos.lng + (endPos.lng - startPos.lng) * ease;

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([curLat, curLng]);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        lastRiderPosRef.current = endPos;
      }
    };

    animFrameRef.current = requestAnimationFrame(frame);
  }, []);

  // ── Initialize Leaflet Map ──
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center fallback (default to kitchen or customer, or fallback location)
    const initialCenter = kitchenCoord
      ? [kitchenCoord.lat, kitchenCoord.lng]
      : customerCoord
      ? [customerCoord.lat, customerCoord.lng]
      : [22.31, 73.17];

    try {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap HTTPS Tile Layer with required attribution
      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

      // Invalidate size once rendered in case container resized
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      setLoading(false);
    } catch (err) {
      console.warn("⚠️ Failed to initialize Leaflet map:", err);
      setMapError("Failed to initialize OpenStreetMap.");
      setUsingFallback(true);
      setLoading(false);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // ── Update Markers and Polylines when coordinates or status change ──
  useEffect(() => {
    if (!mapInstanceRef.current || usingFallback) return;
    const map = mapInstanceRef.current;

    // 1. Kitchen Marker
    if (kitchenCoord) {
      const kitchenLatLng = [kitchenCoord.lat, kitchenCoord.lng];
      if (!kitchenMarkerRef.current) {
        const icon = createCustomDivIcon("📍", "#E67E22", "#FFFFFF");
        const marker = L.marker(kitchenLatLng, { icon, title: "Kitchen" }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;padding:4px 6px;color:#111;font-size:12px;">
            <strong style="color:#C9783E;font-size:13px;">📍 Kitchen</strong><br/>
            <strong>${trackingData?.kitchen?.name || "Midnight Monk Kitchen"}</strong>
          </div>
        `);
        kitchenMarkerRef.current = marker;
      } else {
        kitchenMarkerRef.current.setLatLng(kitchenLatLng);
      }
    }

    // 2. Customer Marker
    if (customerCoord) {
      const customerLatLng = [customerCoord.lat, customerCoord.lng];
      if (!customerMarkerRef.current) {
        const icon = createCustomDivIcon("📍", "#16A34A", "#FFFFFF");
        const marker = L.marker(customerLatLng, { icon, title: "Delivery Destination" }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;padding:4px 6px;color:#111;font-size:12px;">
            <strong style="color:#16A34A;font-size:13px;">📍 Delivery Address</strong><br/>
            <span>${trackingData?.customer?.address || "Customer Location"}</span>
          </div>
        `);
        customerMarkerRef.current = marker;
      } else {
        customerMarkerRef.current.setLatLng(customerLatLng);
      }
    }

    // 3. Delivery Partner / Rider Marker
    if (riderCoord) {
      const riderLatLng = [riderCoord.lat, riderCoord.lng];
      if (!riderMarkerRef.current) {
        const icon = createCustomDivIcon("🛵", "#C9783E", "#FFDFBA", isOutForDelivery);
        const marker = L.marker(riderLatLng, { icon, zIndexOffset: 1000, title: "Delivery Partner" }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;padding:4px 6px;color:#111;font-size:12px;">
            <strong style="color:#C9783E;font-size:13px;">🛵 Delivery Partner</strong><br/>
            <strong>${trackingData?.rider?.name || "Delivery Partner"}</strong><br/>
            <span style="color:#666;">Status: ${isOutForDelivery ? "On The Way" : isDelivered ? "Delivered" : "At Kitchen"}</span>
          </div>
        `);
        riderMarkerRef.current = marker;
        lastRiderPosRef.current = riderCoord;
      } else {
        const prevPos = lastRiderPosRef.current || riderCoord;
        animateRiderMarker(prevPos, riderCoord);
      }

      // Accuracy Circle
      const acc = riderCoord.accuracy || trackingData?.accuracy;
      if (acc && acc > 0 && acc <= 500) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(riderLatLng, {
            radius: acc,
            color: "#C9783E",
            weight: 1,
            fillColor: "#C9783E",
            fillOpacity: 0.12,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng(riderLatLng);
          accuracyCircleRef.current.setRadius(acc);
        }
      } else if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }

    // 4. Render Route Polyline (Delivery Partner → Customer or Kitchen → Customer)
    const origin = isOutForDelivery && riderCoord ? riderCoord : kitchenCoord;
    const destination = customerCoord;

    if (origin && destination) {
      const routeKey = `${isOutForDelivery ? "OUT" : "PREP"}:${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}->${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;

      if (lastRouteKeyRef.current !== routeKey) {
        lastRouteKeyRef.current = routeKey;

        const applyRoute = (latLngs) => {
          if (polylineRef.current) {
            polylineRef.current.setLatLngs(latLngs);
          } else {
            polylineRef.current = L.polyline(latLngs, {
              color: "#C9783E",
              weight: 5,
              opacity: 0.85,
              lineJoin: "round",
            }).addTo(map);
          }
        };

        if (routeCache.has(routeKey)) {
          applyRoute(routeCache.get(routeKey));
        } else {
          // Fetch driving road route from OSRM (cached per trip endpoints), with immediate fallback to straight polyline
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

          fetch(osrmUrl)
            .then((res) => res.json())
            .then((data) => {
              if (data?.routes?.[0]?.geometry?.coordinates) {
                // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                const latLngs = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
                routeCache.set(routeKey, latLngs);
                applyRoute(latLngs);
              } else {
                throw new Error("No OSRM geometry");
              }
            })
            .catch(() => {
              // Graceful fallback to direct polyline between points
              const fallbackPoints = [
                [origin.lat, origin.lng],
                [destination.lat, destination.lng],
              ];
              applyRoute(fallbackPoints);
            });
        }
      }
    }

    // Auto-fit bounds on initial coordinate arrival
    if (!boundsFittedRef.current && (customerCoord || kitchenCoord)) {
      fitMapBounds();
      boundsFittedRef.current = true;
    }
  }, [trackingData, isOutForDelivery, isDelivered, fitMapBounds, animateRiderMarker, usingFallback]);

  // If using fallback simulation map due to missing container or initialization error
  if (usingFallback) {
    return (
      <FallbackSimulationMap
        trackingData={trackingData}
        orderStatus={orderStatus}
        etaMinutes={activeEta}
        distanceKm={activeDistance}
        height={height}
        mapError={mapError}
      />
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "16px",
        overflow: "hidden",
        border: `1.5px solid ${t.border || "rgba(201,120,62,0.2)"}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        backgroundColor: "#1e293b",
      }}
    >
      {/* ── Top Bar: Live Status Pill & Recenter Button ── */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15,23,42,0.88)",
            color: "#FFDFBA",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)",
            pointerEvents: "auto",
            border: "1px solid rgba(201,120,62,0.3)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isDelivered ? "#22c55e" : "#eab308",
              boxShadow: isDelivered
                ? "0 0 8px #22c55e"
                : "0 0 8px #eab308",
            }}
          />
          {isDelivered
            ? "Order Delivered"
            : isOutForDelivery
            ? (isRealGps || trackingData?.is_real_gps)
              ? `🟢 Live GPS: On the way ${secondsAgo != null ? `(${secondsAgo}s ago)` : ""}`
              : "Connecting to Rider GPS..."
            : "Preparing at Kitchen"}
        </div>

        {/* Recenter Button */}
        <button
          onClick={fitMapBounds}
          title="Recenter Map"
          style={{
            backgroundColor: "rgba(15,23,42,0.88)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            backdropFilter: "blur(6px)",
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C9783E")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(15,23,42,0.88)")
          }
        >
          🎯 Recenter
        </button>
      </div>

      {/* ── Loading Overlay ── */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1001,
            backgroundColor: "rgba(15,23,42,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #334155",
              borderTop: "3px solid #C9783E",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "600" }}>
            Loading Map...
          </span>
        </div>
      )}

      {/* ── Leaflet Map Target DOM Node ── */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />

      {/* ── Map Legend & Metrics Strip ── */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "12px",
          right: "12px",
          zIndex: 1000,
          backgroundColor: "rgba(15,23,42,0.85)",
          borderRadius: "10px",
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "11px",
            color: "#cbd5e1",
            fontWeight: "600",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            📍 Kitchen
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            🛵 Delivery Partner
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            📍 Customer
          </span>
        </div>

        {/* Live Metrics */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          <span style={{ color: "#94a3b8" }}>
            Distance:{" "}
            <strong style={{ color: "#f8fafc" }}>
              {activeDistance} km
            </strong>
          </span>
          <span style={{ color: "#94a3b8" }}>
            ETA:{" "}
            <strong style={{ color: "#22c55e" }}>
              {isDelivered ? "Delivered" : `${activeEta} min`}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  FALLBACK SIMULATION MAP
//  Shown if Leaflet container cannot initialize or coordinates lag
// ════════════════════════════════════════════════════════════════
function FallbackSimulationMap({
  trackingData,
  orderStatus,
  etaMinutes,
  distanceKm,
  height,
  mapError,
}) {
  const isDelivered = orderStatus === "DELIVERED";
  const isOut = orderStatus === "OUT_FOR_DELIVERY";

  const progress =
    trackingData?.progress !== undefined
      ? Math.min(100, Math.max(0, trackingData.progress * 100))
      : isDelivered
      ? 100
      : isOut
      ? 50
      : 5;

  return (
    <div
      style={{
        height,
        width: "100%",
        backgroundColor: "#0f172a",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', sans-serif",
        backgroundImage: "radial-gradient(#1e293b 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        overflow: "hidden",
        borderRadius: "16px",
        border: "1.5px solid rgba(201,120,62,0.2)",
      }}
    >
      {/* Simulation Info Badge */}
      <div
        style={{
          backgroundColor: "rgba(30,41,59,0.92)",
          border: "1px solid rgba(201,120,62,0.3)",
          borderRadius: "10px",
          padding: "10px 14px",
          maxWidth: "calc(100% - 24px)",
          marginTop: "10px",
          zIndex: 2,
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: "0 0 4px 0",
            fontSize: "13px",
            fontWeight: "700",
            color: "#F5A623",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🗺️</span>
          <span>{mapError || "Live Order Tracking"}</span>
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: "#94a3b8",
            lineHeight: "1.4",
          }}
        >
          Showing live order route simulation.
        </p>
      </div>

      {/* Interactive Vector Route Simulation */}
      <div
        style={{
          position: "relative",
          height: "120px",
          margin: "auto 0",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "40px",
            right: "40px",
            height: "8px",
            backgroundColor: "#334155",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#C9783E",
              borderRadius: "4px",
              transition: "width 0.8s ease-in-out",
              boxShadow: "0 0 10px #C9783E",
            }}
          />
        </div>

        {/* Kitchen Marker (Left) */}
        <div
          style={{
            position: "absolute",
            left: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#e67e22",
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            📍
          </div>
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "11px",
              fontWeight: "700",
              marginTop: "4px",
            }}
          >
            {trackingData?.kitchen?.name || "Kitchen"}
          </span>
        </div>

        {/* Rider Marker (Animated along path) */}
        <div
          style={{
            position: "absolute",
            left: `calc(40px + (100% - 80px) * ${progress / 100} - 22px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 4,
            transition: "left 0.8s ease-in-out",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#C9783E",
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 4px 16px rgba(201,120,62,0.6)",
            }}
          >
            🛵
          </div>
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#FFDFBA",
              fontSize: "10px",
              fontWeight: "800",
              padding: "2px 6px",
              borderRadius: "4px",
              marginTop: "3px",
              whiteSpace: "nowrap",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {trackingData?.rider?.name || "Rider"}
          </span>
        </div>

        {/* Customer Marker (Right) */}
        <div
          style={{
            position: "absolute",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#16a34a",
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            📍
          </div>
          <span
            style={{
              color: "#cbd5e1",
              fontSize: "11px",
              fontWeight: "700",
              marginTop: "4px",
            }}
          >
            You
          </span>
        </div>
      </div>

      {/* Status & Metrics Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(15,23,42,0.8)",
          borderRadius: "10px",
          padding: "10px 16px",
          border: "1px solid rgba(255,255,255,0.06)",
          zIndex: 2,
          marginBottom: "10px",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 2px 0",
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            DELIVERY DISTANCE
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "900",
              color: "#f8fafc",
            }}
          >
            {distanceKm} km
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 2px 0",
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            TRIP PROGRESS
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "900",
              color: "#C9783E",
            }}
          >
            {Math.round(progress)}%
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: "0 0 2px 0",
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            ESTIMATED TIME
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "900",
              color: "#22c55e",
            }}
          >
            {isDelivered ? "Delivered" : `${etaMinutes} min`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(LeafletTrackingMap);
