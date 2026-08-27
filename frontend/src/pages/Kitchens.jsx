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

const collectionCards = [
  { title: "Late Night Cravings", desc: "Burgers, fries & midnight bites", image: FALLBACK_IMAGES[0] },
  { title: "Comfort Food", desc: "Warm indulgence after dark", image: FALLBACK_IMAGES[1] },
  { title: "Chef's Picks", desc: "Curated signatures for the night", image: FALLBACK_IMAGES[2] },
  { title: "Pure Vegetarian", desc: "Plant-forward & comforting", image: FALLBACK_IMAGES[3] },
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
        const visibleKitchens = data.filter(k => k.name?.toLowerCase() !== "night bites");
        setAllKitchens(visibleKitchens);
        setKitchens(visibleKitchens);
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

  const secondaryFeatured = filtered.slice(1, 3).length ? filtered.slice(1, 3) : allKitchens.slice(1, 3).length ? allKitchens.slice(1, 3) : [
    { name: "Monk Table", tag: "North Indian", rating: 4.7, location: "Old City", image: FALLBACK_IMAGES[1] },
    { name: "Midnight Crave", tag: "Street Food", rating: 4.6, location: "Lakefront", image: FALLBACK_IMAGES[2] },
  ];

  const quickBites = useMemo(() => {
    const base = filtered.length ? filtered : allKitchens;
    return base.slice(0, 5).map((k, index) => ({
      ...k,
      image: k.image || FALLBACK_IMAGES[(index + (k.name?.length || 0)) % FALLBACK_IMAGES.length],
    }));
  }, [filtered, allKitchens]);

  const selectKitchen = (kitchen) => {
    if (kitchen.isOpen === false) return;
    localStorage.setItem("selectedKitchen", kitchen.kitchen_id);
    localStorage.setItem("selectedKitchenName", kitchen.name);
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
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: t.text }}>
      <Navbar
        title="Kitchens"
        backPath="/flow"
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

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.accentSoft}, transparent 28%), ${t.bg}`, color: t.text }}>
      <Navbar
        title="Midnight Monk"
        onLogout={handleLogout}
        rightContent={
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => navigate("/profile")} style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textSoft,
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}>
              Profile
            </button>
            <button onClick={() => navigate("/orders")} style={{
              backgroundColor: t.accent,
              color: t.accentText,
              border: "none",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
            }}>
              Orders
            </button>
          </div>
        }
      />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 24px 52px" }}>
        <section style={{
          border: `1px solid ${t.border}`,
          background: t.dark ? "linear-gradient(135deg, rgba(41,37,33,0.96), rgba(35,32,28,0.8))" : "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(239,233,220,0.9))",
          borderRadius: "30px",
          boxShadow: t.shadow,
          overflow: "hidden",
          marginBottom: "28px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
            <div style={{ padding: "42px 42px 38px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 12px", borderRadius: "999px", border: `1px solid ${t.border}`, background: t.dark ? "rgba(255,255,255,0.02)" : "rgba(39,37,31,0.02)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accentStrong }}>
                <span>☾</span> Late-night concierge
              </div>

              <h1 style={{ fontSize: "60px", margin: "18px 0 18px", lineHeight: 0.93, color: t.text }}>
                WHEN THE CITY<br />SLEEPS,<br />WE KEEP THE<br />KITCHEN OPEN.
              </h1>

              <p style={{ maxWidth: "520px", fontSize: "17px", color: t.textSoft, marginBottom: "30px" }}>
                Curated late-night dining from kitchens around you — refined, warm, and made for the after-hours city.
              </p>

              <div style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  background: t.dark ? "rgba(8,9,11,0.4)" : "rgba(255,255,255,0.55)",
                  minWidth: "220px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  maxWidth: "360px",
                }}>
                  <span style={{ fontSize: "18px" }}>📍</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: t.mutedText, letterSpacing: "0.12em", textTransform: "uppercase" }}>Delivering to</div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>Vadodara, Gujarat</div>
                  </div>
                </div>

                <button onClick={() => requestLocation()} style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  color: t.text,
                  borderRadius: "14px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}>
                  Change location
                </button>
              </div>

              <div style={{ position: "relative", maxWidth: "600px" }}>
                <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>⌕</span>
                <input
                  type="text"
                  placeholder="Search kitchens, dishes, cuisines..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "18px 18px 18px 48px",
                    borderRadius: "18px",
                    border: `1px solid ${t.border}`,
                    background: t.dark ? "rgba(14,17,22,0.62)" : "rgba(255,255,255,0.52)",
                    color: t.text,
                    fontSize: "15px",
                    outline: "none",
                    boxShadow: search ? `0 0 0 4px ${t.accentSoft}` : "none",
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: t.mutedText,
                    fontSize: "18px",
                    cursor: "pointer",
                  }}>✕</button>
                )}
              </div>
            </div>

          </div>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", border: `1px solid ${t.border}`, borderRadius: "18px", padding: "10px", background: t.dark ? "rgba(18,20,25,0.7)" : "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
            {filterOptions.map(f => (
              <button
                key={f.key}
                onClick={() => { if (f.key === "nearby") { requestLocation(); return; } setFilterMode(f.key); }}
                style={{
                  padding: "10px 16px",
                  background: filterMode === f.key ? t.accentSoft : "transparent",
                  border: filterMode === f.key ? `1px solid ${t.borderStrong}` : `1px solid ${t.border}`,
                  color: filterMode === f.key ? t.accentText : t.textSoft,
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {error && <div style={{ color: t.text, background: "rgba(183,122,97,0.08)", border: "1px solid rgba(183,122,97,0.22)", padding: "12px 14px", borderRadius: "12px", marginBottom: "20px" }}>⚠️ {error}</div>}

        <section style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "8px" }}>Kitchen selection</div>
              <h2 style={{ fontSize: "42px", margin: 0, color: t.text }}>Curated kitchens</h2>
            </div>
            <button onClick={() => setFilterMode("toprated")} style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: "999px", padding: "10px 14px", color: t.textSoft, cursor: "pointer" }}>See all</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px" }}>
            {secondaryFeatured.map(k => (
              <div key={k.kitchen_id || k.name} onClick={() => selectKitchen(k)} style={{ cursor: "pointer", background: t.card, borderRadius: "22px", overflow: "hidden", border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                <img src={k.image || FALLBACK_IMAGES[0]} alt={k.name} style={{ width: "100%", height: "260px", objectFit: "cover" }} />
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "26px", color: t.text }}>{k.name}</h3>
                    <span style={{ color: t.accentStrong, fontSize: "12px", fontWeight: "800" }}>★ {Number(k.rating || 4.7).toFixed(1)}</span>
                  </div>
                  <p style={{ margin: "0 0 12px", color: t.textSoft, fontSize: "13px" }}>{k.tag || "Late-night dining"}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", color: t.mutedText, fontSize: "12px" }}>
                    <span>⚡ {k.deliveryTime || "20-30 min"}</span>
                    <span>{k.location || "City center"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong }}>Curated for midnight</div>
              <h2 style={{ margin: "8px 0 0", fontSize: "42px", color: t.text }}>Collections</h2>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "18px" }}>
            {collectionCards.map(item => (
              <div key={item.title} style={{ position: "relative", borderRadius: "22px", overflow: "hidden", height: "200px", border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.78))" }} />
                <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#efe2ca" }}>Curated</div>
                  <h3 style={{ color: "#fff", fontSize: "28px", margin: "8px 0 4px" }}>{item.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong }}>Quick bites</div>
              <h2 style={{ margin: "8px 0 0", fontSize: "42px", color: t.text }}>Quick Munchies</h2>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "16px" }}>
            {quickBites.map((k, idx) => (
              <div key={`${k.kitchen_id || k.name}-${idx}`} onClick={() => selectKitchen(k)} style={{ cursor: "pointer", background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", overflow: "hidden", boxShadow: t.shadow }}>
                <img src={k.image} alt={k.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                <div style={{ padding: "14px 12px 16px" }}>
                  <h3 style={{ margin: 0, fontSize: "24px", color: t.text }}>{k.name}</h3>
                  <div style={{ fontSize: "12px", color: t.mutedText, marginTop: "8px" }}>{k.location || "Late night"}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "22px" }}>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: "28px", background: t.card, boxShadow: t.shadow, padding: "22px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong }}>Hyperlocal network</div>
              <h2 style={{ margin: "8px 0 20px", fontSize: "42px", color: t.text }}>Your night. Your neighborhood.</h2>
              <div style={{ height: "260px", borderRadius: "22px", background: "linear-gradient(135deg, rgba(201,120,62,0.08), rgba(39,37,31,0.64)), url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: "18%", top: "42%", width: "16px", height: "16px", borderRadius: "50%", background: t.accent, boxShadow: "0 0 0 12px rgba(168,177,159,0.22)" }} />
                <div style={{ position: "absolute", left: "52%", top: "32%", width: "16px", height: "16px", borderRadius: "50%", background: t.accent, boxShadow: "0 0 0 12px rgba(168,177,159,0.22)" }} />
                <div style={{ position: "absolute", left: "62%", top: "52%", width: "16px", height: "16px", borderRadius: "50%", background: t.accent, boxShadow: "0 0 0 12px rgba(168,177,159,0.22)" }} />
              </div>
            </div>

            <div style={{ border: `1px solid ${t.border}`, borderRadius: "28px", background: t.card, boxShadow: t.shadow, padding: "22px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong }}>Delivery radius</div>
              <h3 style={{ margin: "12px 0 18px", fontSize: "30px", color: t.text }}>Available around you</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {allKitchens.slice(0, 4).map((k, i) => (
                  <div key={k.kitchen_id || `${k.name}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${t.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: t.text }}>{k.name}</div>
                      <div style={{ fontSize: "12px", color: t.mutedText }}>{k.location || "Nearby"}</div>
                    </div>
                    <span style={{ color: t.accentStrong, fontSize: "12px", fontWeight: "800" }}>{k.deliveryTime || "20-30 min"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "10px" }}>How it works</div>
          <h2 style={{ margin: 0, fontSize: "42px", color: t.text }}>A bespoke midnight ritual</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px", marginTop: "18px" }}>
            {[
              { step: "01", title: "Discover", text: "Find kitchens open near you and choose your mood." },
              { step: "02", title: "Order", text: "Curate your menu from signature dishes and midnight favorites." },
              { step: "03", title: "Enjoy", text: "Fresh food arrives locally without compromise or delay." },
            ].map(item => (
              <div key={item.step} style={{ border: `1px solid ${t.border}`, borderRadius: "22px", background: t.card, boxShadow: t.shadow, padding: "24px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "14px" }}>{item.step}</div>
                <h3 style={{ color: t.text, margin: "0 0 10px", fontSize: "30px" }}>{item.title}</h3>
                <p style={{ margin: 0, color: t.textSoft, fontSize: "14px" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {filtered.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "30px 0 80px" }}>
            <div style={{ fontSize: "52px", marginBottom: "10px" }}>🍽️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "30px", color: t.text }}>No kitchens match your search</h3>
            <button onClick={() => setSearch("")} style={{ background: t.accent, color: t.accentText, border: "none", borderRadius: "12px", padding: "12px 20px", fontWeight: "800", cursor: "pointer" }}>Clear search</button>
          </div>
        ) : (
          <section style={{ marginTop: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {filtered.map((k, index) => (
                <KitchenCard key={k.id || k.kitchen_id || `${k.name}-${index}`} kitchen={k} t={t} onSelect={selectKitchen} />
              ))}
            </div>
          </section>
        )}
      </div>

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}

function KitchenCard({ kitchen: k, t, onSelect }) {
  const isOpen = k.isOpen !== false;
  const imageUrl = k.image || FALLBACK_IMAGES[(k.name?.length || 0 + (k.location?.length || 0)) % FALLBACK_IMAGES.length];
  const rating = Number(k.rating || 4.8).toFixed(1);
  const reviewCount = k.reviews || "120+";
  const eta = k.deliveryTime || k.eta || "20-30 min";

  return (
    <div
      onClick={() => onSelect(k)}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: t.shadow,
        cursor: isOpen ? "pointer" : "not-allowed",
        opacity: isOpen ? 1 : 0.72,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "rgba(168,177,159,0.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = t.border;
      }}
    >
      <div style={{ position: "relative" }}>
        <img src={imageUrl} alt={k.name} style={{ width: "100%", height: "230px", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", left: "14px", top: "14px", background: "rgba(39,37,31,0.72)", border: `1px solid ${t.border}`, color: "#efe2ca", borderRadius: "999px", padding: "6px 10px", fontSize: "10px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {isOpen ? "Open now" : "Closed"}
        </div>
      </div>

      <div style={{ padding: "18px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <h3 style={{ margin: 0, color: t.text, fontSize: "30px", lineHeight: 1 }}>{k.name}</h3>
          <span style={{ color: t.accentText, background: t.accentSoft, borderRadius: "999px", padding: "5px 8px", fontSize: "12px", fontWeight: "800" }}>★ {rating}</span>
        </div>

        <p style={{ margin: "0 0 14px", color: t.textSoft, fontSize: "13px" }}>{k.tag || "Late-night favorites"}</p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          <span style={{ background: t.bgSoft, color: t.textSoft, border: `1px solid ${t.border}`, borderRadius: "999px", padding: "7px 10px", fontSize: "11px", fontWeight: "700" }}>★ {rating} ({reviewCount})</span>
          <span style={{ background: t.bgSoft, color: t.textSoft, border: `1px solid ${t.border}`, borderRadius: "999px", padding: "7px 10px", fontSize: "11px", fontWeight: "700" }}>⚡ {eta}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", borderTop: `1px solid ${t.border}`, paddingTop: "14px" }}>
          <div style={{ color: t.mutedText, fontSize: "12px", fontWeight: "600" }}>📍 {k.location || "Downtown"}</div>
          <button style={{ background: isOpen ? t.accent : "transparent", color: isOpen ? t.accentText : t.textSoft, border: isOpen ? "none" : `1px solid ${t.border}`, borderRadius: "12px", padding: "10px 12px", fontWeight: "800", cursor: isOpen ? "pointer" : "not-allowed" }}>
            {isOpen ? "Explore →" : "Closed"}
          </button>
        </div>
      </div>
    </div>
  );
}
