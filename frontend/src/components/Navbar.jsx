import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiShoppingBag, FiShoppingCart, FiPackage, FiMapPin, FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useOrders } from "../context/OrderContext";
import { useCart } from "../context/CartContext";

const defaultLocations = [
  "Vadodara, Gujarat",
  "Ahmedabad, Gujarat",
  "Mumbai, Maharashtra",
  "Delhi, NCR",
  "Bengaluru, Karnataka",
  "Jaipur, Rajasthan",
];

const defaultBackPaths = {
  "/flow": "/login",
  "/kitchens": "/flow",
  "/collections": "/flow",
  "/how-it-works": "/flow",
  "/kitchen-admin": "/kitchen-admin/login",
  "/kitchen-admin/dashboard": "/kitchen-admin/login",
  "/master-admin": "/master-admin/login",
  "/master-admin/dashboard": "/master-admin/login",
  "/admin": "/kitchen-admin/login",
  "/master": "/master-admin/login",
};

export default function Navbar({ title, backPath, backLabel, onLogout, rightContent }) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTheme();
  const { user, logout } = useUserAuth();
  const { admin } = useAdminAuth();
  const resolvedBackPath = backPath || defaultBackPaths[location.pathname];
  const resolvedBackLabel = backLabel || (resolvedBackPath === "/login" ? "Login" : "Back");
  const { orders } = useOrders();
  const { totalItems } = useCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      return localStorage.getItem("mm_location") || "Vadodara, Gujarat";
    } catch {
      return "Vadodara, Gujarat";
    }
  });
  const [locationQuery, setLocationQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mm_location", selectedLocation);
    } catch {}
  }, [selectedLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (locationRef.current && !locationRef.current.contains(event.target)) setLocationOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) return onLogout();
    logout();
    navigate("/login");
  };

  const activeOrdersCount = orders.filter(order => order.status && order.status !== "Delivered").length;

  const profileItems = [
    { label: "My Profile", icon: "👤", action: () => navigate("/profile") },
    { label: "My Orders", icon: "📦", action: () => navigate("/orders") },
    { label: "Addresses", icon: "📍", action: () => navigate("/profile") },
    { label: "Settings", icon: "⚙️", action: () => navigate("/profile") },
    { label: "Logout", icon: "🚪", action: handleLogout, danger: true },
  ];

  const filteredLocations = locationQuery.trim()
    ? defaultLocations.filter(item => item.toLowerCase().includes(locationQuery.toLowerCase()))
    : defaultLocations;

  return (
    <>
      <style>{`
        .navbar-desktop-nav {
          display: flex;
        }
        .navbar-mobile-toggle {
          display: none !important;
        }
        .navbar-desktop-location {
          display: block;
        }
        .navbar-desktop-btn-label {
          display: inline;
        }
        @media (max-width: 768px) {
          .navbar-desktop-nav {
            display: none !important;
          }
          .navbar-mobile-toggle {
            display: inline-flex !important;
          }
          .navbar-desktop-location {
            display: none !important;
          }
          .navbar-desktop-btn-label {
            display: none !important;
          }
        }
      `}</style>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 120,
          background: t.navBg,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: t.navBorder,
          boxShadow: isScrolled ? (t.dark ? "0 12px 28px rgba(0,0,0,0.12)" : "0 12px 26px rgba(79,63,43,0.08)") : "none",
          transition: "all 0.25s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: isScrolled ? "12px 18px" : "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            transition: "all 0.25s ease",
            minHeight: isScrolled ? "64px" : "72px",
          }}
        >
          {/* LEFT: Logo + Location */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
            {resolvedBackPath && (
              <button
                onClick={() => navigate(resolvedBackPath)}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  color: t.textSoft,
                  padding: "8px 10px",
                  fontSize: "11px",
                  fontWeight: "800",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ← {resolvedBackLabel}
              </button>
            )}
            <button
              onClick={() => navigate(user ? "/flow" : "/login")}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: t.text,
                minWidth: 0,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: isScrolled ? "28px" : "32px",
                  height: isScrolled ? "28px" : "32px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #f1e9db, #cbbd9d 50%, #8e8b85 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isScrolled ? "13px" : "14px",
                  boxShadow: "0 8px 18px rgba(39,37,31,0.08)",
                  flexShrink: 0,
                }}
              >
                ☾
              </div>

              <span
                style={{
                  fontSize: isScrolled ? "14px" : "clamp(13px, 3.5vw, 18px)",
                  fontWeight: "900",
                  color: t.text,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  transition: "all 0.25s ease",
                }}
              >
                MIDNIGHT MONK
              </span>
            </button>

            {!title && (
              <div ref={locationRef} className="navbar-desktop-location" style={{ position: "relative" }}>
                <button
                  onClick={() => setLocationOpen(!locationOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "transparent",
                    border: `1px solid ${t.border}`,
                    borderRadius: "999px",
                    padding: isScrolled ? "6px 10px" : "8px 12px",
                    color: t.textSoft,
                    cursor: "pointer",
                    minWidth: 0,
                    maxWidth: "180px",
                    marginLeft: "12px",
                    fontSize: isScrolled ? "11px" : "12px",
                    fontWeight: "700",
                    transition: "all 0.25s ease",
                  }}
                  title={selectedLocation}
                >
                  <FiMapPin size={14} color={t.accentStrong} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedLocation}
                  </span>
                  <FiChevronDown size={12} />
                </button>

                {locationOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "calc(100% + 8px)",
                      width: "280px",
                      background: t.card,
                      border: `1px solid ${t.border}`,
                      borderRadius: "14px",
                      boxShadow: t.shadow,
                      zIndex: 130,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${t.border}` }}>
                      <input
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        placeholder="Search location"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: `1px solid ${t.border}`,
                          background: t.input,
                          color: t.text,
                          outline: "none",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      {filteredLocations.map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setSelectedLocation(item);
                            setLocationOpen(false);
                            setLocationQuery("");
                          }}
                          style={{
                            width: "100%",
                            background: selectedLocation === item ? t.accentSoft : "transparent",
                            border: "none",
                            color: t.text,
                            padding: "10px 14px",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "12px",
                            borderBottom: `1px solid ${t.border}`,
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTER: Navigation (only on main pages) */}
          {!title && (
            <nav className="navbar-desktop-nav" style={{ alignItems: "center", gap: "26px", justifyContent: "center", flex: 0 }}>
              <button
                onClick={() => navigate("/kitchens")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: t.textSoft,
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                  transition: "color 0.2s ease",
                }}
              >
                KITCHENS
              </button>
              <button
                onClick={() => navigate("/how-it-works")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: t.textSoft,
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                  transition: "color 0.2s ease",
                }}
              >
                HOW IT WORKS
              </button>
            </nav>
          )}

          {/* RIGHT: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {rightContent ? (
              rightContent
            ) : (
              <>
                {/* Dedicated Cart Button */}
                <button
                  onClick={() => navigate("/cart")}
                  style={{
                    background: location.pathname === "/cart" ? (t.accentSoft || "rgba(201,120,62,0.15)") : "transparent",
                    border: `1px solid ${location.pathname === "/cart" ? (t.accent || "#C9783E") : t.border}`,
                    borderRadius: "10px",
                    color: location.pathname === "/cart" ? (t.accentText || t.accent || "#C9783E") : t.text,
                    padding: isScrolled ? "8px 10px" : "10px 12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  title="My Cart"
                >
                  <FiShoppingCart size={14} />
                  {!isScrolled && <span className="navbar-desktop-btn-label">CART</span>}
                  {totalItems > 0 && (
                    <span
                      style={{
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "999px",
                        background: t.accent || "#C9783E",
                        color: t.accentText || "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: "800",
                        padding: "0 4px",
                      }}
                    >
                      {totalItems}
                    </span>
                  )}
                </button>

                {!user ? (
                  <button
                    onClick={() => navigate("/login", { state: { from: location.pathname } })}
                    style={{
                      background: t.accentSoft || "rgba(201,120,62,0.15)",
                      border: `1.5px solid ${t.accent || "#C9783E"}`,
                      borderRadius: "10px",
                      color: t.accentText || t.accent || "#C9783E",
                      padding: isScrolled ? "8px 14px" : "10px 16px",
                      fontSize: "12px",
                      fontWeight: "800",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    SIGN IN
                  </button>
                ) : (
                  <>
                    {/* Dedicated Active Orders Button */}
                    <button
                      onClick={() => navigate("/orders")}
                      style={{
                        background: location.pathname === "/orders" ? (t.accentSoft || "rgba(201,120,62,0.15)") : "transparent",
                        border: `1px solid ${location.pathname === "/orders" ? (t.accent || "#C9783E") : t.border}`,
                        borderRadius: "10px",
                        color: location.pathname === "/orders" ? (t.accentText || t.accent || "#C9783E") : t.text,
                        padding: isScrolled ? "8px 10px" : "10px 12px",
                        fontSize: "12px",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                      }}
                      title="Active Orders"
                    >
                      <FiPackage size={14} />
                      {!isScrolled && <span className="navbar-desktop-btn-label">ORDERS</span>}
                      {activeOrdersCount > 0 && (
                        <span
                          style={{
                            minWidth: "16px",
                            height: "16px",
                            borderRadius: "999px",
                            background: t.accent || "#C9783E",
                            color: t.accentText || "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "9px",
                            fontWeight: "800",
                            padding: "0 4px",
                          }}
                        >
                          {activeOrdersCount}
                        </span>
                      )}
                    </button>

                    <div ref={profileRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${t.border}`,
                          borderRadius: "10px",
                          color: t.text,
                          padding: isScrolled ? "8px 10px" : "10px 12px",
                          fontSize: "12px",
                          fontWeight: "800",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                        }}
                        title="Profile"
                      >
                        <FiUser size={14} />
                        {!isScrolled && <span className="navbar-desktop-btn-label">PROFILE</span>}
                        <FiChevronDown size={11} />
                      </button>

                      {profileOpen && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            width: "200px",
                            background: t.card,
                            border: `1px solid ${t.border}`,
                            borderRadius: "12px",
                            boxShadow: t.shadow,
                            overflow: "hidden",
                            zIndex: 130,
                          }}
                        >
                          {profileItems.map((item, i) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                item.action();
                                setProfileOpen(false);
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                padding: "11px 12px",
                                color: item.danger ? t.danger : t.text,
                                background: "transparent",
                                border: "none",
                                borderBottom: i < profileItems.length - 1 ? `1px solid ${t.border}` : "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: "12px",
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span>{item.icon}</span>
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Mobile Menu Toggle Button */}
                <button
                  className="navbar-mobile-toggle"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Toggle Navigation Menu"
                  style={{
                    background: mobileMenuOpen ? (t.accentSoft || "rgba(201,120,62,0.15)") : "transparent",
                    border: `1px solid ${mobileMenuOpen ? (t.accent || "#C9783E") : t.border}`,
                    borderRadius: "10px",
                    color: mobileMenuOpen ? (t.accentText || t.accent || "#C9783E") : t.text,
                    padding: "8px 10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: `1px solid ${t.border}`,
              background: t.card || t.navBg,
              padding: "16px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
            }}
          >
            {/* Delivery location selector for Mobile */}
            <div style={{ paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: t.textSoft, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Delivery Location
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: t.input, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "8px 12px" }}>
                <FiMapPin size={14} color={t.accentStrong} />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: t.text,
                    fontSize: "12px",
                    fontWeight: "700",
                    width: "100%",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {defaultLocations.map((loc) => (
                    <option key={loc} value={loc} style={{ background: t.card, color: t.text }}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => { navigate("/kitchens"); setMobileMenuOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                color: t.text,
                fontSize: "14px",
                fontWeight: "700",
                padding: "8px 4px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>🍽️ Browse Kitchens</span>
              <span style={{ color: t.textSoft, fontSize: "12px" }}>→</span>
            </button>

            <button
              onClick={() => { navigate("/how-it-works"); setMobileMenuOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                color: t.text,
                fontSize: "14px",
                fontWeight: "700",
                padding: "8px 4px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>💡 How It Works</span>
              <span style={{ color: t.textSoft, fontSize: "12px" }}>→</span>
            </button>

            <button
              onClick={() => { navigate("/cart"); setMobileMenuOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                color: t.text,
                fontSize: "14px",
                fontWeight: "700",
                padding: "8px 4px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                🛒 Cart
              </span>
              {totalItems > 0 && (
                <span
                  style={{
                    background: t.accent || "#C9783E",
                    color: t.accentText || "#fff",
                    fontSize: "11px",
                    fontWeight: "800",
                    borderRadius: "999px",
                    padding: "2px 8px",
                  }}
                >
                  {totalItems} items
                </span>
              )}
            </button>

            {user && (
              <>
                <button
                  onClick={() => { navigate("/orders"); setMobileMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    color: t.text,
                    fontSize: "14px",
                    fontWeight: "700",
                    padding: "8px 4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    📦 My Orders
                  </span>
                  {activeOrdersCount > 0 && (
                    <span
                      style={{
                        background: t.accent || "#C9783E",
                        color: t.accentText || "#fff",
                        fontSize: "11px",
                        fontWeight: "800",
                        borderRadius: "999px",
                        padding: "2px 8px",
                      }}
                    >
                      {activeOrdersCount} active
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    color: t.text,
                    fontSize: "14px",
                    fontWeight: "700",
                    padding: "8px 4px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>👤 My Profile</span>
                  <span style={{ color: t.textSoft, fontSize: "12px" }}>→</span>
                </button>

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "transparent",
                    border: `1px solid ${t.danger || "#ff4d4f"}`,
                    color: t.danger || "#ff4d4f",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "10px 16px",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                >
                  🚪 Logout
                </button>
              </>
            )}

            {!user && (
              <button
                onClick={() => { navigate("/login", { state: { from: location.pathname } }); setMobileMenuOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: t.accent || "#C9783E",
                  color: t.accentText || "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "800",
                  padding: "11px 16px",
                  cursor: "pointer",
                  marginTop: "6px",
                }}
              >
                Sign In / Create Account
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
}
