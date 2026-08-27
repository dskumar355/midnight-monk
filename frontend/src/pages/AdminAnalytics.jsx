import { useEffect, useState, useMemo } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import SupportWidget from "../components/SupportWidget";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const t = useTheme();
  const { admin, logout } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredKpi, setHoveredKpi] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredHour, setHoveredHour] = useState(null);

  useEffect(() => {
    if (!admin) { navigate("/login/admin"); return; }
    api.getKitchenOrders(admin.kitchenId)
      .then(data => setOrders(data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [admin]);

  const handleLogout = () => { logout(); navigate("/login/admin"); };

  // ── KPI computations ──
  const revenue = useMemo(() => orders.reduce((s, o) => s + (o.total || 0), 0), [orders]);
  const delivered = useMemo(() => orders.filter(o => o.status === "Delivered").length, [orders]);
  const pending = useMemo(() => orders.filter(o => o.status !== "Delivered").length, [orders]);
  const avgOrder = useMemo(() => orders.length ? (revenue / orders.length).toFixed(0) : 0, [orders, revenue]);
  const totalItems = useMemo(() => orders.reduce((s, o) => s + (o.items || []).reduce((is, it) => is + (it.quantity || 1), 0), 0), [orders]);

  // ── Revenue Trend (last 7 days) ──
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const dayOrders = orders.filter(o => (o.createdAt || '').startsWith(key));
      const rev = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
      days.push({ key, label, revenue: rev, orders: dayOrders.length });
    }
    return days;
  }, [orders]);

  const maxRevenue = useMemo(() => Math.max(...last7Days.map(d => d.revenue), 1), [last7Days]);

  // ── Peak Hours Heatmap ──
  const peakHours = useMemo(() => {
    const hours = Array(24).fill(0);
    orders.forEach(o => {
      if (o.createdAt) {
        const h = new Date(o.createdAt).getHours();
        hours[h]++;
      }
    });
    return hours;
  }, [orders]);

  const maxHourOrders = useMemo(() => Math.max(...peakHours, 1), [peakHours]);

  // ── Top 5 Dishes ──
  const topDishes = useMemo(() => {
    const dishCounts = {};
    orders.forEach(o => o.items?.forEach(item => {
      dishCounts[item.name] = (dishCounts[item.name] || 0) + (item.quantity || 1);
    }));
    return Object.entries(dishCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  // ── Order Status Breakdown ──
  const statusBreakdown = useMemo(() => {
    return ["Placed", "Preparing", "Out for Delivery", "Delivered"].map(s => ({
      status: s, count: orders.filter(o => o.status === s).length,
    }));
  }, [orders]);
  const STATUS_C = { Placed: "#3498db", Preparing: "#e67e22", "Out for Delivery": "#9b59b6", Delivered: "#27ae60" };
  const STATUS_EMOJI = { Placed: "🆕", Preparing: "🍳", "Out for Delivery": "🚀", Delivered: "✅" };

  // ── Customer Leaderboard ──
  const topCustomers = useMemo(() => {
    const customers = {};
    orders.forEach(o => {
      const name = o.user?.name || 'Unknown';
      const mobile = o.user?.mobile || '';
      const k = mobile || name;
      if (!customers[k]) customers[k] = { name, mobile, orders: 0, spent: 0 };
      customers[k].orders++;
      customers[k].spent += o.total || 0;
    });
    return Object.values(customers).sort((a, b) => b.orders - a.orders).slice(0, 5);
  }, [orders]);

  // ── Category Split (Veg vs Non-Veg) ──
  const categorySplit = useMemo(() => {
    let veg = 0, nonVeg = 0, unknown = 0;
    orders.forEach(o => o.items?.forEach(item => {
      const cat = (item.category || item.type || '').toLowerCase();
      if (cat.includes('veg') && !cat.includes('non')) veg += (item.quantity || 1);
      else if (cat.includes('non') || cat.includes('non-veg') || cat.includes('nonveg')) nonVeg += (item.quantity || 1);
      else unknown += (item.quantity || 1);
    }));
    return { veg, nonVeg, unknown, total: veg + nonVeg + unknown };
  }, [orders]);

  // ── Hour label helper ──
  const hourLabel = (h) => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  };

  // ── Heat color helper ──
  const heatColor = (count) => {
    if (count === 0) return t.dark ? '#1e1e2e' : '#eee';
    const ratio = count / maxHourOrders;
    if (ratio < 0.33) return t.dark ? '#3a3a4a' : '#c8c8c8';
    if (ratio < 0.66) return '#F5A623';
    return '#e74c3c';
  };

  // ── Card style helper ──
  const cardStyle = {
    backgroundColor: t.dark ? 'rgba(30,30,50,0.8)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '24px',
    border: t.cardBorder,
    boxShadow: t.shadow,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const sectionTitle = (emoji, text) => (
    <h3 style={{
      fontSize: '15px', fontWeight: '800', color: t.text, margin: '0 0 18px 0',
      display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Segoe UI',sans-serif",
    }}>
      <span style={{ fontSize: '20px' }}>{emoji}</span> {text}
    </h3>
  );

  // ── Loading state ──
  if (loading) return (
    <div style={{
      minHeight: '100vh', backgroundColor: t.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: t.text, fontFamily: "'Segoe UI',sans-serif", flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', border: `3px solid ${t.dark ? '#333' : '#ddd'}`,
        borderTopColor: t.accent, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: '14px', fontWeight: '600', color: t.subText }}>Loading analytics...</span>
    </div>
  );

  const kpis = [
    { icon: '📦', label: 'Total Orders', value: orders.length, color: '#805ad5' },
    { icon: '💰', label: 'Revenue', value: `₹${revenue.toFixed(0)}`, color: '#27ae60' },
    { icon: '✅', label: 'Delivered', value: delivered, color: '#2ecc71' },
    { icon: '⏳', label: 'Pending', value: pending, color: '#e67e22' },
    { icon: '📊', label: 'Avg Order', value: `₹${avgOrder}`, color: '#3498db' },
    { icon: '🍽️', label: 'Items Sold', value: totalItems, color: '#e74c3c' },
  ];

  const MEDAL = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <Navbar title={`Analytics — ${admin?.kitchenName}`} backPath="/admin" backLabel="Dashboard" onLogout={handleLogout} />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      `}</style>

      <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          borderRadius: '18px', padding: '24px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'fadeUp 0.5s ease',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>📈 Advanced Analytics</h2>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
              {orders.length} total orders · Last updated just now
            </p>
          </div>
          <div style={{
            backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: '12px', padding: '10px 16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#F5A623', margin: 0 }}>₹{revenue.toFixed(0)}</p>
            <p style={{ fontSize: '9px', fontWeight: '700', color: '#999', margin: '2px 0 0 0', letterSpacing: '1px' }}>LIFETIME</p>
          </div>
        </div>

        {/* ── Row 1: 6 KPI Cards ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '14px',
        }}>
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              onMouseEnter={() => setHoveredKpi(i)}
              onMouseLeave={() => setHoveredKpi(null)}
              style={{
                ...cardStyle,
                padding: '18px 14px',
                textAlign: 'center',
                cursor: 'default',
                transform: hoveredKpi === i ? 'translateY(-4px)' : 'none',
                boxShadow: hoveredKpi === i ? `0 8px 24px ${kpi.color}33` : t.shadow,
                animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                borderTop: `3px solid ${kpi.color}`,
              }}
            >
              <span style={{ fontSize: '26px' }}>{kpi.icon}</span>
              <p style={{
                fontSize: '20px', fontWeight: '900', color: t.text,
                margin: '8px 0 4px 0', fontFamily: "'Segoe UI',sans-serif",
              }}>{kpi.value}</p>
              <p style={{
                fontSize: '9px', color: t.mutedText, margin: 0,
                fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase',
              }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Row 2: Revenue Trend (Full Width) ── */}
        <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.3s both' }}>
          {sectionTitle('📈', 'Revenue Trend — Last 7 Days')}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px',
            paddingTop: '10px',
          }}>
            {last7Days.map((day, i) => {
              const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isHovered = hoveredBar === i;
              return (
                <div
                  key={day.key}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: t.dark ? '#222' : '#333', color: '#fff',
                      padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                      whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                    }}>
                      ₹{day.revenue.toFixed(0)} · {day.orders} orders
                    </div>
                  )}
                  {/* Bar */}
                  <div style={{
                    width: '100%', maxWidth: '52px',
                    height: `${Math.max(pct, 4)}%`,
                    background: isHovered
                      ? 'linear-gradient(180deg, #F5A623, #e74c3c)'
                      : 'linear-gradient(180deg, #805ad5, #3498db)',
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'all 0.3s ease',
                    animation: `growBar 0.6s ease ${i * 0.08}s both`,
                    transformOrigin: 'bottom',
                    cursor: 'pointer',
                    boxShadow: isHovered ? '0 4px 16px rgba(128,90,213,0.4)' : 'none',
                  }} />
                  {/* Revenue label */}
                  <span style={{
                    fontSize: '10px', fontWeight: '700', color: t.subText,
                    marginTop: '6px', fontFamily: "'Segoe UI',sans-serif",
                  }}>₹{day.revenue >= 1000 ? `${(day.revenue / 1000).toFixed(1)}k` : day.revenue.toFixed(0)}</span>
                  {/* Day label */}
                  <span style={{
                    fontSize: '11px', fontWeight: '700', color: t.text,
                    marginTop: '2px', fontFamily: "'Segoe UI',sans-serif",
                  }}>{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 3: Peak Hours Heatmap (Full Width) ── */}
        <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.4s both' }}>
          {sectionTitle('🕐', 'Peak Hours Heatmap')}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '110px' }}>
            {peakHours.map((count, h) => {
              const pct = maxHourOrders > 0 ? (count / maxHourOrders) * 100 : 0;
              const isHov = hoveredHour === h;
              return (
                <div
                  key={h}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                  onMouseEnter={() => setHoveredHour(h)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {isHov && (
                    <div style={{
                      position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: t.dark ? '#222' : '#333', color: '#fff',
                      padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700',
                      whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                    }}>
                      {hourLabel(h)}: {count} orders
                    </div>
                  )}
                  <div style={{
                    width: '100%',
                    height: `${Math.max(pct, 6)}%`,
                    backgroundColor: heatColor(count),
                    borderRadius: '3px 3px 1px 1px',
                    transition: 'all 0.25s ease',
                    transform: isHov ? 'scaleY(1.1)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    cursor: 'pointer',
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {[0, 6, 12, 18, 23].map(h => (
              <span key={h} style={{ fontSize: '9px', fontWeight: '700', color: t.mutedText }}>{hourLabel(h)}</span>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
            {[
              { label: 'Low', color: t.dark ? '#3a3a4a' : '#c8c8c8' },
              { label: 'Medium', color: '#F5A623' },
              { label: 'High', color: '#e74c3c' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: l.color }} />
                <span style={{ fontSize: '10px', color: t.subText, fontWeight: '600' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 4: Top Dishes | Order Status (2 Columns) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
          {/* Top 5 Dishes */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.5s both' }}>
            {sectionTitle('🍽️', 'Top 5 Dishes')}
            {topDishes.length === 0 ? (
              <p style={{ color: t.mutedText, fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>No order data yet</p>
            ) : topDishes.map(([name, count], i) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
                borderBottom: `1px solid ${t.dark ? '#2a2a3e' : '#f0f0f0'}`,
              }}>
                <span style={{ fontSize: '18px' }}>{MEDAL[i]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: t.text, fontWeight: '700', margin: '0 0 5px 0', fontFamily: "'Segoe UI',sans-serif" }}>{name}</p>
                  <div style={{
                    height: '6px', backgroundColor: t.dark ? '#2a2a3e' : '#f0f0f0', borderRadius: '3px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: 'linear-gradient(90deg, #805ad5, #3498db)',
                      width: `${Math.min((count / topDishes[0][1]) * 100, 100)}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
                <span style={{
                  fontSize: '12px', color: t.accent, fontWeight: '800',
                  backgroundColor: `${t.accent}15`, padding: '3px 8px', borderRadius: '6px',
                }}>{count}</span>
              </div>
            ))}
          </div>

          {/* Order Status Breakdown */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.55s both' }}>
            {sectionTitle('📊', 'Order Status')}
            {orders.length === 0 ? (
              <p style={{ color: t.mutedText, fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>No orders yet</p>
            ) : statusBreakdown.map(({ status, count }) => (
              <div key={status} style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
              }}>
                <span style={{ fontSize: '16px' }}>{STATUS_EMOJI[status]}</span>
                <span style={{
                  fontSize: '11px', fontWeight: '700', color: STATUS_C[status],
                  minWidth: '100px', fontFamily: "'Segoe UI',sans-serif",
                }}>{status}</span>
                <div style={{
                  flex: 1, height: '10px',
                  backgroundColor: t.dark ? '#2a2a3e' : '#f0f0f0', borderRadius: '5px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '5px',
                    backgroundColor: STATUS_C[status],
                    width: `${orders.length ? (count / orders.length) * 100 : 0}%`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: '900', color: t.text, minWidth: '28px', textAlign: 'right',
                  fontFamily: "'Segoe UI',sans-serif",
                }}>{count}</span>
              </div>
            ))}
            {/* Pie-style summary */}
            {orders.length > 0 && (
              <div style={{
                marginTop: '10px', padding: '14px', borderRadius: '10px',
                backgroundColor: t.dark ? 'rgba(39,174,96,0.08)' : 'rgba(39,174,96,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: t.subText }}>Delivery Rate</span>
                <span style={{
                  fontSize: '18px', fontWeight: '900', color: '#27ae60',
                  fontFamily: "'Segoe UI',sans-serif",
                }}>{orders.length ? ((delivered / orders.length) * 100).toFixed(1) : 0}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 5: Customer Leaderboard | Category Split (2 Columns) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
          {/* Customer Leaderboard */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.6s both' }}>
            {sectionTitle('👥', 'Customer Leaderboard')}
            {topCustomers.length === 0 ? (
              <p style={{ color: t.mutedText, fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>No customers yet</p>
            ) : topCustomers.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
                borderBottom: `1px solid ${t.dark ? '#2a2a3e' : '#f0f0f0'}`,
              }}>
                <span style={{ fontSize: '18px' }}>{MEDAL[i]}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: t.text, margin: '0 0 2px 0', fontFamily: "'Segoe UI',sans-serif" }}>
                    {c.name}
                  </p>
                  {c.mobile && (
                    <p style={{ fontSize: '10px', color: t.mutedText, margin: 0 }}>{c.mobile}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: t.accent, margin: '0 0 2px 0' }}>
                    {c.orders} orders
                  </p>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: t.subText, margin: 0 }}>
                    ₹{c.spent.toFixed(0)} spent
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Category Split */}
          <div style={{ ...cardStyle, animation: 'fadeUp 0.5s ease 0.65s both' }}>
            {sectionTitle('🥗', 'Category Split')}
            {categorySplit.total === 0 ? (
              <p style={{ color: t.mutedText, fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>No item data available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Stacked bar */}
                <div style={{
                  height: '28px', borderRadius: '14px', overflow: 'hidden',
                  display: 'flex', width: '100%',
                }}>
                  {categorySplit.veg > 0 && (
                    <div style={{
                      width: `${(categorySplit.veg / categorySplit.total) * 100}%`,
                      background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'width 0.6s ease',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>VEG</span>
                    </div>
                  )}
                  {categorySplit.nonVeg > 0 && (
                    <div style={{
                      width: `${(categorySplit.nonVeg / categorySplit.total) * 100}%`,
                      background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'width 0.6s ease',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>NON-VEG</span>
                    </div>
                  )}
                  {categorySplit.unknown > 0 && (
                    <div style={{
                      width: `${(categorySplit.unknown / categorySplit.total) * 100}%`,
                      background: t.dark ? 'linear-gradient(90deg, #555, #666)' : 'linear-gradient(90deg, #bbb, #ccc)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'width 0.6s ease',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>OTHER</span>
                    </div>
                  )}
                </div>

                {/* Stats cards */}
                {[
                  { icon: '🥬', label: 'Veg', value: categorySplit.veg, color: '#27ae60' },
                  { icon: '🍗', label: 'Non-Veg', value: categorySplit.nonVeg, color: '#e74c3c' },
                  { icon: '🍱', label: 'Other', value: categorySplit.unknown, color: '#999' },
                ].filter(c => c.value > 0).map(c => (
                  <div key={c.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '10px',
                    backgroundColor: `${c.color}10`,
                    border: `1px solid ${c.color}20`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{c.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: t.text, fontFamily: "'Segoe UI',sans-serif" }}>{c.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: c.color, fontFamily: "'Segoe UI',sans-serif" }}>
                        {c.value}
                      </span>
                      <span style={{ fontSize: '11px', color: t.subText, marginLeft: '6px', fontWeight: '600' }}>
                        ({categorySplit.total ? ((c.value / categorySplit.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer spacer */}
        <div style={{ height: '40px' }} />
      </div>

      <SupportWidget senderName={admin?.username} senderType="admin" />
    </div>
  );
}