import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { useUserAuth } from "../context/UserAuthContext";

const quickLinks = [
  { title: "Best Sellers", icon: "🍕", to: "/kitchens" },
  { title: "Late Night Picks", icon: "🌙", to: "/collections" },
  { title: "How it works", icon: "⚡", to: "/how-it-works" },
];

const steps = [
  "Choose your location",
  "Discover nearby kitchens",
  "Explore dishes",
  "Place your order",
  "Track your order",
];

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTheme();
  const { logout } = useUserAuth();
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  useEffect(() => {
    if (location.pathname === "/") {
      const timeout = setTimeout(() => {
        document.getElementById("discover-home")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: t.text }}>
      <Navbar
        onLogout={handleLogout}
        rightContent={
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textSoft, borderRadius: "10px", padding: "8px 12px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
            Sign In
          </button>
        }
      />

      <div id="discover-home" style={{ maxWidth: "1200px", margin: "0 auto", padding: "34px 24px 80px" }}>
        <section
          style={{
            background: t.dark ? "linear-gradient(135deg, rgba(46,41,34,0.98), rgba(31,28,24,0.9))" : "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(245,238,226,0.96))",
            border: `1px solid ${t.border}`,
            borderRadius: "30px",
            boxShadow: t.shadow,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 0,
          }}
        >
          <div style={{ padding: "42px 36px 32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "999px", border: `1px solid ${t.border}`, background: t.dark ? "rgba(255,255,255,0.02)" : "rgba(39,37,31,0.02)", color: t.accentStrong, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "800" }}>
              <span>☾</span> Late-night concierge
            </div>

            <h1 style={{ margin: "18px 0 16px", fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 0.92, color: t.text }}>
              Midnight cravings,<br />made elegant.
            </h1>

            <p style={{ margin: 0, maxWidth: "560px", fontSize: "18px", color: t.textSoft, lineHeight: 1.7 }}>
              Discover warm kitchens, curated collections, and late-night favorites built for the after-hours city.
            </p>

            <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link to="/kitchens" style={{ background: t.accent, color: "#111", border: "none", borderRadius: "14px", padding: "14px 22px", fontWeight: "800", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Explore kitchens
              </Link>
              <Link to="/collections" style={{ background: "transparent", border: `1px solid ${t.borderStrong}`, borderRadius: "14px", padding: "14px 22px", color: t.text, fontWeight: "800", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Browse collections
              </Link>
            </div>

            <div style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", border: `1px solid ${t.border}`, borderRadius: "999px", background: t.dark ? "rgba(255,255,255,0.02)" : "rgba(39,37,31,0.02)", padding: "9px 12px", fontWeight: "700", fontSize: "13px", color: t.textSoft }}>
                <span>📍</span> Vadodara, Gujarat
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", border: `1px solid ${t.border}`, borderRadius: "999px", background: t.dark ? "rgba(255,255,255,0.02)" : "rgba(39,37,31,0.02)", padding: "9px 12px", fontWeight: "700", fontSize: "13px", color: t.textSoft }}>
                <span>⚡</span> 20–30 min delivery
              </div>
            </div>
          </div>

          <div style={{ minHeight: "430px", background: "linear-gradient(180deg, rgba(39,37,31,0.1), rgba(39,37,31,0.52)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat" }} />
        </section>

        <section style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
          {quickLinks.map((item) => (
            <Link key={item.title} to={item.to} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "22px", boxShadow: t.shadow, padding: "18px 16px", textDecoration: "none", color: t.text }}>
              <div style={{ fontSize: "26px", marginBottom: "10px" }}>{item.icon}</div>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "8px" }}>Explore</div>
              <div style={{ fontSize: "22px", fontWeight: "800" }}>{item.title}</div>
            </Link>
          ))}
        </section>

        <section style={{ marginTop: "40px", background: t.card, border: `1px solid ${t.border}`, borderRadius: "26px", boxShadow: t.shadow, padding: "26px 22px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "14px" }}>How it works</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {steps.map((step, index) => (
              <div key={step} style={{ background: t.dark ? "rgba(255,255,255,0.02)" : "rgba(39,37,31,0.02)", border: `1px solid ${t.border}`, borderRadius: "18px", padding: "18px 16px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: t.accent, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", marginBottom: "12px" }}>{index + 1}</div>
                <div style={{ fontWeight: "800", fontSize: "16px", lineHeight: 1.5 }}>{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: "18px", background: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: t.accentStrong, fontSize: "10px", fontWeight: "900", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "5px" }}>Team access</div>
            <div style={{ color: t.text, fontSize: "16px", fontWeight: "800" }}>Admin portals</div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to="/login/admin" style={{ background: t.accent, color: t.accentText, borderRadius: "10px", padding: "10px 14px", fontSize: "11px", fontWeight: "800" }}>Kitchen Admin Login</Link>
            <Link to="/master/login" style={{ background: "transparent", color: t.text, border: `1px solid ${t.borderStrong}`, borderRadius: "10px", padding: "10px 14px", fontSize: "11px", fontWeight: "800" }}>Master Admin Login</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
