import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

const CAT_COLORS = {
  Veg: "#91C3A8",
  "Non Veg": "#D97C6C",
  "Fast Food": "#E2C992",
  Drinks: "#C9A96E",
  "Main Course": "#B89AF5",
  Snacks: "#F4C98A",
};

export default function Menu() {
  const navigate = useNavigate();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCart();
  const kitchenId = localStorage.getItem("selectedKitchen");
  const storedKitchenName = localStorage.getItem("selectedKitchenName");

  const [items, setItems] = useState([]);
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [kitchenIsOpen, setKitchenIsOpen] = useState(
    localStorage.getItem("selectedKitchenIsOpen") !== "false"
  );

  useEffect(() => {
    if (!kitchenId) {
      navigate("/kitchens");
      return;
    }

    Promise.all([
      api.getMenu(kitchenId),
      api.getKitchen(kitchenId).catch(() => null),
    ])
      .then(([menuData, kitchenData]) => {
        // Strict 1:1 mapping: only use items belonging to this kitchen from backend
        setItems(menuData || []);
        if (kitchenData) {
          setKitchen(kitchenData);
          if (typeof kitchenData.isOpen === "boolean") {
            setKitchenIsOpen(kitchenData.isOpen);
            localStorage.setItem("selectedKitchenIsOpen", String(kitchenData.isOpen));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [kitchenId, navigate]);

  // Derive categories dynamically from actual items present in this kitchen
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
    return ["All", ...cats];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchCat = category === "All" || i.category === category;
      const matchSearch = (i.name || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, category, search]);

  const getQty = (id) => cart.find((i) => i.id === id)?.quantity || 0;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const kitchenDisplayName = kitchen?.name || storedKitchenName || "Kitchen Menu";
  const kitchenRating = kitchen?.rating ? Number(kitchen.rating).toFixed(1) : "4.5";
  const kitchenLocation = kitchen?.location || "Vadodara";
  const kitchenTag = kitchen?.tag || "Late-night dining";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: t.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: t.text,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>☾</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: t.accent,
            }}
          >
            Loading menu
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, ${
          t.dark ? "rgba(201,169,110,0.1)" : "rgba(201,169,110,0.12)"
        }, transparent 28%), ${t.bg}`,
        color: t.text,
        paddingBottom: "110px",
      }}
    >
      <Navbar
        title={kitchenDisplayName}
        backPath="/kitchens"
        backLabel="Kitchens"
        onLogout={handleLogout}
        rightContent={
          <span
            style={{
              color: t.textSoft,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        }
      />

      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px 0" }}>
        {/* ── Kitchen Header Card ── */}
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: t.shadow,
            marginBottom: "24px",
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src={
                items[0]?.image ||
                "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
              }
              alt={kitchenDisplayName}
              style={{
                width: "100%",
                height: "250px",
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(8,9,11,0.22), rgba(8,9,11,0.7))",
              }}
            />
          </div>

          <div style={{ padding: "22px 24px 26px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: t.accent,
                  }}
                >
                  Kitchen
                </div>
                <h1
                  style={{
                    margin: "8px 0 0",
                    fontSize: "44px",
                    lineHeight: 1.1,
                    color: t.text,
                  }}
                >
                  {kitchenDisplayName}
                </h1>
              </div>
              <div
                style={{
                  background: t.accentSoft,
                  border: `1px solid ${t.border}`,
                  borderRadius: "14px",
                  padding: "10px 14px",
                  color: t.accentText,
                  fontWeight: "800",
                  fontSize: "15px",
                }}
              >
                ★ {kitchenRating}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                color: t.mutedText,
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              <span>⚡ 20-30 min</span>
              <span>📍 {kitchenLocation}</span>
              {kitchenTag && <span>✨ {kitchenTag}</span>}
            </div>
          </div>
        </div>

        {/* ── Closed Kitchen Banner ── */}
        {!kitchenIsOpen && (
          <div
            style={{
              background: t.dark
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "18px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ fontSize: "28px" }}>🌙</span>
            <div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "15px",
                  color: "#EF4444",
                }}
              >
                This kitchen is currently closed for orders
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: t.textSoft,
                  marginTop: "2px",
                }}
              >
                You can browse the menu below. Ordering will be enabled once the kitchen opens.
              </div>
            </div>
          </div>
        )}

        {/* ── Search Bar (if items exist) ── */}
        {items.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                }}
              >
                ⌕
              </span>
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "18px 18px 18px 52px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  background: t.dark
                    ? "rgba(8,9,11,0.5)"
                    : "rgba(255,255,255,0.8)",
                  color: t.text,
                  fontSize: "14px",
                  outline: "none",
                  boxShadow: search ? `0 0 0 4px ${t.accentSoft}` : "none",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Dynamic Category Filter Tabs (only if > 1 category) ── */}
        {categories.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border:
                    category === c
                      ? "1px solid rgba(201,169,110,0.18)"
                      : `1px solid ${t.border}`,
                  background:
                    category === c
                      ? t.accentSoft
                      : t.dark
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(17,17,17,0.02)",
                  color: category === c ? t.accentText : t.textSoft,
                  fontWeight: "800",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* ── Menu Items Grid / Empty State ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {filtered.length === 0 ? (
            /* ── Proper Empty Menu State (Requirement 9) ── */
            <div
              style={{
                gridColumn: "1 / -1",
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: "22px",
                padding: "60px 24px",
                textAlign: "center",
                boxShadow: t.shadow,
              }}
            >
              <div style={{ fontSize: "44px", marginBottom: "14px" }}>🍲</div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: t.text,
                }}
              >
                {items.length === 0
                  ? "No menu items available"
                  : "No matching dishes found"}
              </h3>
              <p
                style={{
                  margin: "0 auto 20px",
                  color: t.textSoft,
                  fontSize: "14px",
                  maxWidth: "460px",
                  lineHeight: "1.6",
                }}
              >
                {items.length === 0
                  ? `"${kitchenDisplayName}" has not added any dishes to their menu yet. Please explore our other open kitchens.`
                  : "Try clearing your search query or selecting a different category."}
              </p>
              {items.length === 0 ? (
                <button
                  onClick={() => navigate("/kitchens")}
                  style={{
                    background: t.accent,
                    color: t.accentText,
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 24px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(201,120,62,0.3)",
                  }}
                >
                  Browse Other Kitchens →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  style={{
                    background: t.accent,
                    color: t.accentText,
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: "22px",
                  boxShadow: t.shadow,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <img
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 18px 0",
                  }}
                >
                  <div
                    style={{
                      background: `${CAT_COLORS[item.category] || t.accent}22`,
                      color: CAT_COLORS[item.category] || t.accentText,
                      borderRadius: "999px",
                      padding: "6px 10px",
                      fontSize: "10px",
                      fontWeight: "800",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.category || "Main Course"}
                  </div>
                  <div
                    style={{
                      color: t.accent,
                      fontWeight: "900",
                      fontSize: "18px",
                    }}
                  >
                    ₹{item.price}
                  </div>
                </div>

                <div style={{ padding: "16px 18px 18px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "26px",
                      lineHeight: 1.15,
                      color: t.text,
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: t.textSoft,
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description ||
                      "Carefully prepared to elevate your after-dark craving."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        color: t.mutedText,
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {item.calories ? `🔥 ${item.calories} kcal` : "Freshly made"}
                    </div>
                    {kitchenIsOpen && getQty(item.id) > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          background: t.accentSoft,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.id, getQty(item.id) - 1)
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: t.accentText,
                            fontSize: "20px",
                            cursor: "pointer",
                            fontWeight: "800",
                            padding: 0,
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            minWidth: "18px",
                            textAlign: "center",
                            color: t.text,
                            fontWeight: "800",
                          }}
                        >
                          {getQty(item.id)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: t.accentText,
                            fontSize: "20px",
                            cursor: "pointer",
                            fontWeight: "800",
                            padding: 0,
                          }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!kitchenIsOpen}
                        onClick={() => kitchenIsOpen && addToCart(item)}
                        style={{
                          background: kitchenIsOpen
                            ? t.accent
                            : t.dark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                          color: kitchenIsOpen ? "#111" : t.mutedText,
                          border: "none",
                          borderRadius: "12px",
                          padding: "10px 18px",
                          fontWeight: "800",
                          cursor: kitchenIsOpen ? "pointer" : "not-allowed",
                        }}
                      >
                        {kitchenIsOpen ? "Add" : "Closed"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(180deg, rgba(17,19,24,0.9), rgba(8,9,11,0.96))",
            borderTop: `1px solid ${t.border}`,
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -14px 30px rgba(0,0,0,0.22)",
            zIndex: 999,
          }}
        >
          <div>
            <div
              style={{
                color: t.textSoft,
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Cart total
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              {totalItems} item{totalItems > 1 ? "s" : ""} · ₹
              {totalPrice.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => navigate("/cart")}
            style={{
              background: t.accent,
              color: "#111",
              border: "none",
              borderRadius: "12px",
              padding: "12px 18px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            View cart →
          </button>
        </div>
      )}

      <SupportWidget senderName={user?.name} senderType="user" />
    </div>
  );
}