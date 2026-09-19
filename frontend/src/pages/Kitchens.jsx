import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";
import Skeleton from "../components/Skeleton";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80",
];

export default function Kitchens() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useUserAuth();
  const t = useTheme();

  const [kitchens, setKitchens] = useState([]);
  const [allKitchens, setAllKitchens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    api.getAllKitchens()
      .then(data => {
        // Use exact backend kitchens - do NOT filter out any valid kitchens
        setAllKitchens(data || []);
        setKitchens(data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "open", label: "Open Now" },
    { key: "nearby", label: "Nearby" },
    { key: "under30", label: "Under 30 min" },
    { key: "veg", label: "Vegetarian" },
    { key: "toprated", label: "Top Rated" },
  ];

  const filtered = useMemo(() => {
    let list = allKitchens;

    if (filterMode === "open") {
      list = list.filter(k => k.isOpen !== false);
    }

    if (filterMode === "under30") {
      list = list.filter(k => {
        const mins = Number(k.deliveryTime?.split("-")[1] || k.eta || 30);
        return mins <= 30;
      });
    }

    if (filterMode === "veg") {
      list = list.filter(k => /veg|vegetarian|pure veg|vegan/i.test(k.tag || "") || /veg|vegetarian/i.test(k.name || ""));
    }

    if (filterMode === "toprated") {
      list = list.filter(k => Number(k.rating || 4.5) >= 4.5);
    }

    if (filterMode === "nearby") {
      list = [...list].sort(() => Math.random() - 0.5);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(k =>
        k.name?.toLowerCase().includes(q) ||
        k.tag?.toLowerCase().includes(q) ||
        k.location?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allKitchens, filterMode, search]);

  const selectKitchen = (kitchen) => {
    localStorage.setItem("selectedKitchen", kitchen.kitchen_id);
    localStorage.setItem("selectedKitchenName", kitchen.name);
    localStorage.setItem("selectedKitchenIsOpen", String(kitchen.isOpen !== false));
    navigate("/menu");
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setError("");
      navigator.geolocation.getCurrentPosition(
        () => {
          setFilterMode("nearby");
          setAllKitchens(prev => [...prev].sort(() => Math.random() - 0.5));
        },
        () => setError("Location access denied. Showing all kitchens.")
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const openCount = allKitchens.filter(k => k.isOpen !== false).length;

  if (loading && allKitchens.length === 0) return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      <Navbar title="Midnight Monk" onLogout={handleLogout} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 24px" }}>
        <Skeleton height="420px" borderRadius="28px" style={{ marginBottom: "18px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height="220px" borderRadius="22px" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg || "#FFFFFF", color: t.text }}>
      <Navbar
        title="Kitchens"
        backPath="/"
        backLabel="Home"
        onLogout={handleLogout}
        rightContent={
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => navigate("/profile")} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.text, borderRadius: "10px", padding: "8px 12px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Profile</button>
            <button onClick={() => navigate("/orders")} style={{ background: t.accent, border: "none", color: t.accentText, borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Orders</button>
          </div>
        }
      />

      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 24px 70px" }}>
        <section style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "28px", boxShadow: t.shadow, padding: "clamp(24px, 5vw, 52px)", marginBottom: "24px" }}>
          <div style={{ maxWidth: "700px" }}>
            <p style={{ color: t.accentStrong, fontSize: "11px", fontWeight: "900", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 14px" }}>Late-night dining, made simple</p>
            <h1 style={{ color: t.text, fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 0.96, letterSpacing: "-0.04em", margin: "0 0 18px" }}>Find your next<br />favorite kitchen.</h1>
            <p style={{ color: t.textSoft, fontSize: "16px", lineHeight: 1.6, maxWidth: "570px", margin: "0 0 26px" }}>Browse warm local kitchens, choose what sounds good, and let us bring it to your door.</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: t.bgSoft, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "7px 14px" }}>
              <span style={{ fontSize: "18px" }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search kitchens or cuisines" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: t.text, fontSize: "14px" }} />
              {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", color: t.mutedText, cursor: "pointer", fontSize: "16px" }}>✕</button>}
            </div>
          </div>
        </section>

        {error && <div style={{ background: t.card, color: t.text, border: "1px solid rgba(183,122,97,0.3)", borderRadius: "12px", padding: "12px 14px", marginBottom: "18px", fontSize: "13px" }}>⚠️ {error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: t.accentStrong, fontSize: "11px", fontWeight: "900", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>Open around you</p>
            <h2 style={{ color: t.text, fontSize: "32px", letterSpacing: "-0.03em", margin: 0 }}>Choose a kitchen</h2>
          </div>
          <span style={{ color: t.textSoft, fontSize: "13px" }}>{openCount} open {openCount === 1 ? "kitchen" : "kitchens"}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "22px" }}>
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => { if (f.key === "nearby") { requestLocation(); return; } setFilterMode(f.key); }} style={{ flexShrink: 0, padding: "9px 14px", borderRadius: "999px", border: `1px solid ${filterMode === f.key ? t.borderStrong : t.border}`, background: filterMode === f.key ? t.accentSoft : t.card, color: filterMode === f.key ? t.accentText : t.textSoft, fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>{f.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "56px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🍽️</div>
            <h3 style={{ color: t.text, margin: "0 0 8px" }}>No kitchens found</h3>
            <p style={{ color: t.textSoft, margin: "0 0 18px", fontSize: "13px" }}>Try another search or clear your filters.</p>
            <button onClick={() => { setSearch(""); setFilterMode("all"); }} style={{ background: t.accent, color: t.accentText, border: "none", borderRadius: "10px", padding: "10px 16px", fontWeight: "800", cursor: "pointer" }}>Show all kitchens</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
            {filtered.map((k, index) => <KitchenCard key={k.id || k.kitchen_id || `${k.name}-${index}`} kitchen={k} t={t} onSelect={selectKitchen} />)}
          </div>
        )}
      </main>
      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}

function KitchenCard({ kitchen: k, t, onSelect }) {
  const canInteract = k.canOrderNow || k.canPreorder || k.isOpen !== false;
  const isCurrentlyOpen = k.businessStatus === "OPEN" || (k.canOrderNow && k.isOpen !== false);
  const isPreorder = k.businessStatus === "PREORDER_AVAILABLE" || (!k.canOrderNow && k.canPreorder);
  const isTempClosed = k.businessStatus === "TEMPORARILY_CLOSED" || k.is_temporarily_closed;

  const imageUrl = k.image || FALLBACK_IMAGES[(k.name?.length || 0 + (k.location?.length || 0)) % FALLBACK_IMAGES.length];
  const rating = Number(k.rating || 4.5).toFixed(1);
  const eta = k.deliveryTime || k.eta || "20-30 min";

  let statusBadgeColor = "#22c55e";
  let statusBadgeBg = "rgba(34,197,94,0.18)";
  let statusText = "Open now";

  if (isTempClosed) {
    statusBadgeColor = "#f87171";
    statusBadgeBg = "rgba(239,68,68,0.22)";
    statusText = "Temporarily Closed";
  } else if (isCurrentlyOpen) {
    statusBadgeColor = "#4ade80";
    statusBadgeBg = "rgba(34,197,94,0.22)";
    statusText = "🟢 Open now";
  } else if (isPreorder) {
    statusBadgeColor = "#c084fc";
    statusBadgeBg = "rgba(168,85,247,0.25)";
    statusText = `🌙 Pre-order Open (${k.nextOpening || "Tonight"})`;
  } else {
    statusBadgeColor = "#94a3b8";
    statusBadgeBg = "rgba(148,163,184,0.22)";
    statusText = `Closed · Opens ${k.opening_time || "22:00"}`;
  }

  return (
    <div
      onClick={() => canInteract && onSelect(k)}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: t.shadow,
        cursor: canInteract ? "pointer" : "not-allowed",
        opacity: canInteract ? 1 : 0.65,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        if (canInteract) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = "rgba(168,177,159,0.35)";
        }
      }}
      onMouseLeave={e => {
        if (canInteract) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = t.border;
        }
      }}
    >
      <div style={{ position: "relative" }}>
        <img src={imageUrl} alt={k.name} style={{ width: "100%", height: "230px", objectFit: "cover", display: "block" }} />
        <div style={{
          position: "absolute",
          left: "14px",
          top: "14px",
          background: statusBadgeBg,
          border: `1.5px solid ${statusBadgeColor}`,
          color: statusBadgeColor,
          borderRadius: "999px",
          padding: "6px 12px",
          fontSize: "11px",
          fontWeight: "800",
          letterSpacing: "0.06em",
          backdropFilter: "blur(6px)",
        }}>
          {statusText}
        </div>
      </div>

      <div style={{ padding: "18px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, color: t.text, fontSize: "24px", lineHeight: 1.1 }}>{k.name}</h3>
          <span style={{ color: t.accentText, background: t.accentSoft, borderRadius: "999px", padding: "5px 8px", fontSize: "12px", fontWeight: "800" }}>★ {rating}</span>
        </div>

        <p style={{ margin: "0 0 10px", color: t.textSoft, fontSize: "13px" }}>{k.tag || "Late-night favorites"}</p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          <span style={{ background: t.bgSoft, color: t.textSoft, border: `1px solid ${t.border}`, borderRadius: "999px", padding: "5px 10px", fontSize: "11px", fontWeight: "700" }}>
            🕒 {k.opening_time || "22:00"} – {k.closing_time || "06:00"}
          </span>
          <span style={{ background: t.bgSoft, color: t.textSoft, border: `1px solid ${t.border}`, borderRadius: "999px", padding: "5px 10px", fontSize: "11px", fontWeight: "700" }}>
            ⚡ {eta}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", borderTop: `1px solid ${t.border}`, paddingTop: "14px" }}>
          <div style={{ color: t.mutedText, fontSize: "12px", fontWeight: "600" }}>📍 {k.location || "Vadodara"}</div>
          <button style={{
            background: isCurrentlyOpen ? t.accent : isPreorder ? "#9333ea" : "transparent",
            color: (isCurrentlyOpen || isPreorder) ? "#fff" : t.textSoft,
            border: (isCurrentlyOpen || isPreorder) ? "none" : `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "10px 14px",
            fontWeight: "800",
            fontSize: "12px",
            cursor: canInteract ? "pointer" : "not-allowed",
          }}>
            {isCurrentlyOpen ? "Order Now →" : isPreorder ? "Pre-order →" : "Closed"}
          </button>
        </div>
      </div>
    </div>
  );
}
