import { useEffect, useState, useMemo } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function MasterAnalytics() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [stats, setStats] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    Promise.all([
      api.getOrderStats(),
      api.getAllOrders()
    ])
      .then(([s, orders]) => {
        setStats(s);
        setAllOrders(Array.isArray(orders) ? orders : (orders.orders || []));
      })
      .finally(() => setLoading(false));
  }, [master]);

  /* ── Revenue Trend (last 7 days) ── */
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const dayOrders = allOrders.filter(o => (o.createdAt || '').startsWith(key));
      const rev = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
      days.push({ key, label, revenue: rev, orders: dayOrders.length });
    }
    return days;
  }, [allOrders]);

  /* ── Peak Hours ── */
  const peakHours = useMemo(() => {
    const hours = Array(24).fill(0);
    allOrders.forEach(o => {
      if (o.createdAt) { const h = new Date(o.createdAt).getHours(); hours[h]++; }
    });
    return hours;
  }, [allOrders]);

  /* ── Revenue by Kitchen ── */
  const kitchenRevenue = useMemo(() => {
    const map = {};
    allOrders.forEach(o => {
      const name = o.kitchen?.name || o.kitchenId || 'Unknown';
      map[name] = (map[name] || 0) + (o.total || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allOrders]);

  /* ── Top 10 Dishes ── */
  const topDishes = useMemo(() => {
    const map = {};
    allOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.name || 'Unknown';
        map[name] = (map[name] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allOrders]);

  /* ── Order Status Funnel ── */
  const statusFunnel = useMemo(() => {
    const counts = { placed: 0, preparing: 0, out: 0, delivered: 0 };
    allOrders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (s === 'delivered') { counts.placed++; counts.preparing++; counts.out++; counts.delivered++; }
      else if (s === 'out for delivery') { counts.placed++; counts.preparing++; counts.out++; }
      else if (s === 'preparing') { counts.placed++; counts.preparing++; }
      else { counts.placed++; }
    });
    return counts;
  }, [allOrders]);

  /* ── Customer Growth ── */
  const userGrowth = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const users = new Set();
      allOrders.filter(o => (o.createdAt || '').startsWith(key)).forEach(o => users.add(o.user?.mobile || o.user?.name));
      days.push({ label, count: users.size });
    }
    return days;
  }, [allOrders]);

  /* ── Payment Split ── */
  const paymentSplit = useMemo(() => {
    let cod = 0, online = 0;
    allOrders.forEach(o => {
      if (o.paymentStatus === 'paid' || o.payment?.status === 'captured') online++;
      else cod++;
    });
    return { cod, online };
  }, [allOrders]);

  /* ── Derived KPIs ── */
  const totalOrders = stats?.totalOrders || allOrders.length;
  const totalRevenue = stats?.totalRevenue || allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const delivered = stats?.delivered || allOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const pending = stats?.pending || (totalOrders - delivered);
  const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;
  const activeKitchens = new Set(allOrders.map(o => o.kitchen?.name || o.kitchenId)).size;

  const maxRev = Math.max(...last7Days.map(d => d.revenue), 1);
  const maxHour = Math.max(...peakHours, 1);
  const maxKitchenRev = kitchenRevenue.length > 0 ? kitchenRevenue[0][1] : 1;
  const maxUserGrowth = Math.max(...userGrowth.map(d => d.count), 1);
  const funnelMax = statusFunnel.placed || 1;

  if (loading) return <div style={S.centered}>Loading analytics...</div>;
  if (!stats && allOrders.length === 0) return <div style={S.centered}>No data available</div>;

  const payTotal = paymentSplit.cod + paymentSplit.online || 1;

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>Advanced Analytics</h2>
      </div>

      {/* ── KPI Cards ── */}
      <div style={S.kpis}>
        {[
          ["📦", "Total Orders", totalOrders, "#4A90D9"],
          ["💰", "Revenue", `₹${Number(totalRevenue).toLocaleString('en-IN')}`, "#F5A623"],
          ["✅", "Delivered", delivered, "#27AE60"],
          ["⏳", "Pending", pending, "#E67E22"],
          ["💳", "Avg Order", `₹${avgOrder}`, "#8E44AD"],
          ["🏪", "Active Kitchens", activeKitchens, "#16A085"],
        ].map(([icon, label, val, color]) => (
          <div key={label} style={S.kpi}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>{icon}</div>
            <p style={{ ...S.kpiVal, color }}>{val}</p>
            <p style={S.kpiLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Trend (full width) ── */}
      <div style={{ ...S.card, marginBottom: "20px" }}>
        <h3 style={S.cardTitle}>📈 Revenue Trend — Last 7 Days</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "180px", paddingTop: "12px" }}>
          {last7Days.map(d => (
            <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#F5A623", marginBottom: "4px" }}>₹{d.revenue}</span>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", borderRadius: "6px 6px 0 0",
                  height: `${(d.revenue / maxRev) * 100}%`,
                  background: "linear-gradient(180deg, #F5A623 0%, #F7C56E 100%)",
                  transition: "height 0.6s ease", minHeight: d.revenue > 0 ? "4px" : "0px"
                }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#888", marginTop: "6px" }}>{d.label}</span>
              <span style={{ fontSize: "10px", color: "#aaa" }}>{d.orders} ord</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Peak Hours Heatmap (full width) ── */}
      <div style={{ ...S.card, marginBottom: "20px" }}>
        <h3 style={S.cardTitle}>🕐 Peak Hours Heatmap</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: "3px" }}>
          {peakHours.map((count, h) => {
            const intensity = count / maxHour;
            return (
              <div key={h} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
              }}>
                <div style={{
                  width: "100%", paddingBottom: "100%", borderRadius: "4px",
                  backgroundColor: count === 0 ? "#f0f0f0" : `rgba(245, 166, 35, ${0.15 + intensity * 0.85})`,
                  transition: "background-color 0.4s ease", position: "relative"
                }}>
                  <span style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                    fontSize: "9px", fontWeight: "700", color: intensity > 0.5 ? "#fff" : "#999"
                  }}>{count}</span>
                </div>
                <span style={{ fontSize: "8px", color: "#aaa", fontWeight: "600" }}>
                  {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Revenue by Kitchen | Top Dishes ── */}
      <div style={{ ...S.grid2, marginBottom: "20px" }}>
        {/* Revenue by Kitchen */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>💰 Revenue by Kitchen</h3>
          {kitchenRevenue.length === 0 && <p style={S.empty}>No data yet</p>}
          {kitchenRevenue.map(([name, rev]) => (
            <div key={name} style={S.barRow}>
              <span style={{ ...S.barLabel, minWidth: "80px" }}>{name}</span>
              <div style={S.barTrack}>
                <div style={{
                  height: "100%", borderRadius: "4px",
                  width: `${(rev / maxKitchenRev) * 100}%`,
                  background: "linear-gradient(90deg, #F5A623, #F7C56E)",
                  transition: "width 0.6s ease"
                }} />
              </div>
              <span style={S.barVal}>₹{Number(rev).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        {/* Top 10 Dishes */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>🍽️ Top 10 Dishes</h3>
          {topDishes.length === 0 && <p style={S.empty}>No orders yet</p>}
          {topDishes.map(([name, count], i) => (
            <div key={name} style={S.dishRow}>
              <span style={{
                ...S.rank,
                backgroundColor: i < 3 ? "#FFF8ED" : "transparent",
                borderRadius: "6px", padding: "2px 8px"
              }}>#{i + 1}</span>
              <span style={S.dishName}>{name}</span>
              <span style={S.dishCount}>{count} sold</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Customer Growth | Payment Split ── */}
      <div style={{ ...S.grid2, marginBottom: "20px" }}>
        {/* Customer Growth */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>👤 Customer Growth — Unique Users / Day</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "140px", paddingTop: "8px" }}>
            {userGrowth.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#16A085", marginBottom: "4px" }}>{d.count}</span>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%", borderRadius: "6px 6px 0 0",
                    height: `${(d.count / maxUserGrowth) * 100}%`,
                    background: "linear-gradient(180deg, #16A085 0%, #76D7C4 100%)",
                    transition: "height 0.6s ease", minHeight: d.count > 0 ? "4px" : "0px"
                  }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#888", marginTop: "6px" }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Split */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>💳 Payment Method Split</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "16px" }}>
            {/* Donut-style visual */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px" }}>
              <div style={{ position: "relative", width: "120px", height: "120px" }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F5A623" strokeWidth="3"
                    strokeDasharray={`${(paymentSplit.online / payTotal) * 100} ${100 - (paymentSplit.online / payTotal) * 100}`}
                    strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#4A90D9" strokeWidth="3"
                    strokeDasharray={`${(paymentSplit.cod / payTotal) * 100} ${100 - (paymentSplit.cod / payTotal) * 100}`}
                    strokeDashoffset={`-${(paymentSplit.online / payTotal) * 100}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  fontSize: "14px", fontWeight: "900", color: "#333"
                }}>{paymentSplit.cod + paymentSplit.online}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#F5A623" }} />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Online</span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#F5A623" }}>{paymentSplit.online} ({((paymentSplit.online / payTotal) * 100).toFixed(0)}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#4A90D9" }} />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>COD</span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#4A90D9" }}>{paymentSplit.cod} ({((paymentSplit.cod / payTotal) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Status Funnel (full width) ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>🔄 Order Status Funnel</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
          {[
            ["Placed", statusFunnel.placed, "#4A90D9"],
            ["Preparing", statusFunnel.preparing, "#F5A623"],
            ["Out for Delivery", statusFunnel.out, "#E67E22"],
            ["Delivered", statusFunnel.delivered, "#27AE60"],
          ].map(([label, count, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#555", minWidth: "120px" }}>{label}</span>
              <div style={{ flex: 1, height: "28px", backgroundColor: "#f5f5f5", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", borderRadius: "8px",
                  width: `${(count / funnelMax) * 100}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  transition: "width 0.8s ease",
                  display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "10px"
                }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{count}</span>
                </div>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color, minWidth: "50px", textAlign: "right" }}>
                {((count / funnelMax) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const S = {
  page: {
    minHeight: "100vh", backgroundColor: "#FFFFFF",
    fontFamily: "'Segoe UI', sans-serif", padding: "24px", maxWidth: "1200px", margin: "0 auto"
  },
  centered: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#666", fontFamily: "'Segoe UI', sans-serif", fontSize: "15px"
  },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" },
  back: {
    background: "none", border: "1.5px solid #ddd", borderRadius: "8px",
    padding: "8px 14px", cursor: "pointer", fontSize: "13px", color: "#555",
    fontFamily: "'Segoe UI', sans-serif", fontWeight: "600",
    transition: "border-color 0.2s"
  },
  title: { fontSize: "22px", fontWeight: "800", color: "#1a1a1a", margin: 0 },

  kpis: {
    display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px", marginBottom: "24px"
  },
  kpi: {
    backgroundColor: "#fff", borderRadius: "12px", padding: "18px 12px", textAlign: "center",
    border: "1.5px solid #efefef", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: "transform 0.2s, box-shadow 0.2s"
  },
  kpiVal: { fontSize: "20px", fontWeight: "900", margin: "4px 0 4px 0" },
  kpiLabel: { fontSize: "10px", color: "#888", margin: 0, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },

  card: {
    backgroundColor: "#fff", borderRadius: "14px", padding: "24px",
    border: "1.5px solid #efefef", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  cardTitle: { fontSize: "14px", fontWeight: "800", color: "#333", margin: "0 0 16px 0" },

  barRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  barLabel: { fontSize: "12px", fontWeight: "700", color: "#555", minWidth: "30px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  barTrack: { flex: 1, height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", overflow: "hidden" },
  barVal: { fontSize: "12px", fontWeight: "700", color: "#F5A623", minWidth: "70px", textAlign: "right" },

  dishRow: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f5f5f5" },
  rank: { fontSize: "13px", fontWeight: "900", color: "#F5A623", minWidth: "36px", textAlign: "center" },
  dishName: { flex: 1, fontSize: "13px", color: "#333", fontWeight: "600" },
  dishCount: { fontSize: "12px", color: "#888", fontWeight: "600" },

  empty: { color: "#aaa", fontSize: "13px", textAlign: "center", padding: "20px 0" },
};
