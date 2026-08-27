import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

const steps = [
  { number: "01", title: "Choose your location", description: "Select the area you want to order from and discover kitchens nearby." },
  { number: "02", title: "Discover nearby kitchens", description: "Browse curated kitchens, late-night favorites, and quick-delivery options." },
  { number: "03", title: "Explore dishes", description: "Find the dishes, combos, and cuisines that match your mood and timing." },
  { number: "04", title: "Place your order", description: "Add items to your cart, choose payment, and confirm your late-night order." },
  { number: "05", title: "Track your order", description: "Follow every step from kitchen prep to delivery and enjoy a smooth experience." },
];

export default function HowItWorksPage() {
  const t = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at top, ${t.dark ? "rgba(201,169,110,0.10)" : "rgba(201,169,110,0.14)"}, transparent 28%), ${t.bg}`, color: t.text }}>
      <Navbar />

      <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "42px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: "38px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "12px" }}>Midnight Monk flow</div>
          <h1 style={{ fontSize: "52px", margin: 0, lineHeight: 1.05, color: t.text }}>How it works</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: "24px",
                padding: "22px 20px",
                boxShadow: t.shadow,
              }}
            >
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.accentStrong, marginBottom: "10px" }}>{step.number}</div>
              <h3 style={{ margin: "0 0 10px", fontSize: "26px", lineHeight: 1.1 }}>{step.title}</h3>
              <p style={{ margin: 0, color: t.textSoft, lineHeight: 1.7, fontSize: "14px" }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
