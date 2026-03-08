import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function MasterAnalytics() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    api.getOrderStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, [master]);

  if (loading) return <div style={S.centered}>Loading analytics...</div>;
  if (!stats)  return <div style={S.centered}>No data available</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>Analytics</h2>
      </div>

      {/* KPI Cards */}
      <div style={S.kpis}>
        {[
          ["📦","Total Orders",   stats.totalOrders],
          ["💰","Total Revenue",  `₹${stats.totalRevenue?.toFixed(2)}`],
          ["✅","Delivered",      stats.delivered],
          ["⏳","Pending",        stats.pending],
          ["💳","Avg Order Value",`₹${stats.avgOrderValue}`],
        ].map(([icon,label,val]) => (
          <div key={label} style={S.kpi}>
            <span style={{fontSize:"28px"}}>{icon}</span>
            <p style={S.kpiVal}>{val}</p>
            <p style={S.kpiLabel}>{label}</p>
          </div>
        ))}
      </div>

      <div style={S.grid}>
        {/* Revenue by Kitchen */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>💰 Revenue by Kitchen</h3>
          {Object.entries(stats.kitchenRevenue || {}).map(([kid, rev]) => (
            <div key={kid} style={S.barRow}>
              <span style={S.barLabel}>{kid}</span>
              <div style={S.barTrack}>
                <div style={{...S.bar, width:`${Math.min((rev / (stats.totalRevenue||1)) * 100, 100)}%`}} />
              </div>
              <span style={S.barVal}>₹{rev}</span>
            </div>
          ))}
          {Object.keys(stats.kitchenRevenue||{}).length === 0 && <p style={S.empty}>No data yet</p>}
        </div>

        {/* Top Dishes */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>🍽️ Top Dishes</h3>
          {(stats.topDishes || []).map((dish, i) => (
            <div key={dish.name} style={S.dishRow}>
              <span style={S.rank}>#{i+1}</span>
              <span style={S.dishName}>{dish.name}</span>
              <span style={S.dishCount}>{dish.count} orders</span>
            </div>
          ))}
          {(stats.topDishes||[]).length === 0 && <p style={S.empty}>No orders yet</p>}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:      {minHeight:"100vh",backgroundColor:"#f7f7f7",fontFamily:"'Segoe UI',sans-serif",padding:"24px"},
  centered:  {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#666",fontFamily:"'Segoe UI',sans-serif"},
  header:    {display:"flex",alignItems:"center",gap:"16px",marginBottom:"24px"},
  back:      {background:"none",border:"1.5px solid #ddd",borderRadius:"8px",padding:"8px 14px",cursor:"pointer",fontSize:"13px",color:"#555"},
  title:     {fontSize:"20px",fontWeight:"800",color:"#1a1a1a",margin:0},
  kpis:      {display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"16px",marginBottom:"24px"},
  kpi:       {backgroundColor:"#fff",borderRadius:"12px",padding:"20px",textAlign:"center",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  kpiVal:    {fontSize:"20px",fontWeight:"900",color:"#1a1a1a",margin:"8px 0 4px 0"},
  kpiLabel:  {fontSize:"10px",color:"#888",margin:0,fontWeight:"700"},
  grid:      {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"},
  card:      {backgroundColor:"#fff",borderRadius:"14px",padding:"24px",border:"1.5px solid #efefef",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"},
  cardTitle: {fontSize:"14px",fontWeight:"800",color:"#333",margin:"0 0 16px 0"},
  barRow:    {display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"},
  barLabel:  {fontSize:"12px",fontWeight:"700",color:"#555",minWidth:"30px"},
  barTrack:  {flex:1,height:"8px",backgroundColor:"#f0f0f0",borderRadius:"4px",overflow:"hidden"},
  bar:       {height:"100%",backgroundColor:"#F5A623",borderRadius:"4px",transition:"width 0.5s ease"},
  barVal:    {fontSize:"12px",fontWeight:"700",color:"#F5A623",minWidth:"60px",textAlign:"right"},
  dishRow:   {display:"flex",alignItems:"center",gap:"12px",padding:"10px 0",borderBottom:"1px solid #f5f5f5"},
  rank:      {fontSize:"13px",fontWeight:"900",color:"#F5A623",minWidth:"28px"},
  dishName:  {flex:1,fontSize:"13px",color:"#333",fontWeight:"600"},
  dishCount: {fontSize:"12px",color:"#888",fontWeight:"600"},
  empty:     {color:"#aaa",fontSize:"13px",textAlign:"center",padding:"20px 0"},
};