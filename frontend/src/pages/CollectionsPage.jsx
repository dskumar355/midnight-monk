import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

const collections = [
  { title: "Open Late", description: "Late-night comfort and quick bites for after-hours cravings.", accent: "#C9783E" },
  { title: "Midnight Cravings", description: "Bold flavors, loaded bowls, and hungry-night classics.", accent: "#9F4F2D" },
  { title: "Under 30 Minutes", description: "Fast delivery favorites without compromising on taste.", accent: "#D39A54" },
  { title: "Vegetarian Nights", description: "Hearty veg picks with comforting warmth and spice.", accent: "#7C8E6F" },
  { title: "Date Night", description: "Elegant plates and cozy pairings for slow evenings.", accent: "#B76753" },
  { title: "Comfort Food", description: "Soul-soothing, nostalgic dishes that hit just right.", accent: "#C9783E" },
  { title: "Top Rated", description: "Most loved by the Midnight Monk community tonight.", accent: "#D8B267" },
];

export default function CollectionsPage() {
  const t = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.dark ? "rgba(201,169,110,0.10)" : "rgba(201,169,110,0.14)"}, transparent 28%), ${t.bg}`, color: t.text }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: "26px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "10px" }}>Curated for nights</div>
          <h1 style={{ fontSize: "52px", margin: 0, lineHeight: 1.05, color: t.text }}>Collections</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "22px" }}>
          {collections.map((item) => (
            <Link
              key={item.title}
              to="/kitchens"
              style={{
                display: "block",
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: "22px",
                boxShadow: t.shadow,
                overflow: "hidden",
                textDecoration: "none",
                color: t.text,
              }}
            >
              <div style={{ height: "190px", background: `linear-gradient(135deg, ${item.accent}22, rgba(0,0,0,0.15)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80) center/cover no-repeat` }} />
              <div style={{ padding: "20px 18px 22px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "10px" }}>Collection</div>
                <h3 style={{ margin: 0, fontSize: "28px", lineHeight: 1.1 }}>{item.title}</h3>
                <p style={{ margin: "10px 0 0", color: t.textSoft, lineHeight: 1.6, fontSize: "14px" }}>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
