import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiShoppingBag, FiMapPin, FiChevronDown } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useUserAuth } from "../context/UserAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useOrders } from "../context/OrderContext";

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
  "/admin": "/login/admin",
  "/master": "/master/login",
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

  const profileRef = useRef(null);
  const locationRef = useRef(null);

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
                  fontSize: isScrolled ? "15px" : "18px",
                  fontWeight: "900",
                  color: t.text,
                  letterSpacing: "0.14em",
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
              <div ref={locationRef} style={{ position: "relative" }}>
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
            <nav style={{ display: "flex", alignItems: "center", gap: "26px", justifyContent: "center", flex: 0 }}>
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
            {rightContent || (admin ? (
              <button
                onClick={() => navigate("/login/admin")}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  color: t.text,
                  padding: isScrolled ? "8px 10px" : "10px 12px",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                SIGN IN
              </button>
            ) : (
              <>
            <button
              onClick={() => navigate("/orders")}
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
              title="Orders"
            >
              <FiShoppingBag size={14} />
              {!isScrolled && <span>ORDERS</span>}
              {activeOrdersCount > 0 && (
                <span
                  style={{
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "999px",
                    background: t.accent,
                    color: t.accentText,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "800",
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
                {!isScrolled && <span>PROFILE</span>}
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
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
