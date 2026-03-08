import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { useOrders } from "../context/OrderContext";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = { Placed:"#3498db", Preparing:"#e67e22", "Out for Delivery":"#9b59b6", Delivered:"#27ae60" };

export default function MasterOrders() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const { orders, fetchAllOrders, loading } = useOrders();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    fetchAllOrders();
  }, [master]);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.user?.name?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search);
    const matchFilter = filter === "All" || o.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total:    orders.length,
    revenue:  orders.reduce((s, o) => s + (o.total || 0), 0),
    pending:  orders.filter(o => o.status !== "Delivered").length,
    delivered:orders.filter(o => o.status === "Delivered").length,
  };

  if (loading) return <div style={S.centered}>Loading orders...</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>All Orders</h2>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[["📦","Total Orders",stats.total],["💰","Revenue",`₹${stats.revenue}`],["⏳","Pending",stats.pending],["✅","Delivered",stats.delivered]].map(([icon,label,val]) => (
          <div key={label} style={S.stat}>
            <span style={{fontSize:"24px"}}>{icon}</span>
            <p style={S.statVal}>{val}</p>
            <p style={S.statLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={S.controls}>
        <input style={S.search} placeholder="🔍 Search by name or order ID..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <div style={S.filters}>
          {["All","Placed","Preparing","Out for Delivery","Delivered"].map(s => (
            <button key={s} style={{...S.filterBtn, ...(filter===s ? S.filterActive : {})}}
              onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div style={S.list}>
        {filtered.map(order => (
          <div key={order.id} style={S.card}>
            <div style={S.cardRow}>
              <div>
                <p style={S.orderId}>#{order.id?.slice(-8).toUpperCase()}</p>
                <p style={S.customer}>{order.user?.name} · {order.user?.mobile}</p>
                <p style={S.address}>📍 {order.address}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={S.badge(order.status)}>{order.status}</div>
                <p style={S.total}>₹{order.total}</p>
                <p style={S.kitchen}>🍽️ {order.kitchenId}</p>
              </div>
            </div>
            <div style={S.items}>
              {order.items?.map((item, i) => (
                <span key={i} style={S.item}>{item.name} ×{item.quantity}</span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={S.empty}>No orders found</div>}
      </div>
    </div>
  );
}

const S = {
  page:     {minHeight:"100vh",backgroundColor:"#f7f7f7",fontFamily:"'Segoe UI',sans-serif",padding:"24px"},
  centered: {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#666",fontFamily:"'Segoe UI',sans-serif"},
  header:   {display:"flex",alignItems:"center",gap:"16px",marginBottom:"24px"},
  back:     {background:"none",border:"1.5px solid #ddd",borderRadius:"8px",padding:"8px 14px",cursor:"pointer",fontSize:"13px",color:"#555"},
  title:    {fontSize:"20px",fontWeight:"800",color:"#1a1a1a",margin:0},
  stats:    {display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"24px"},
  stat:     {backgroundColor:"#fff",borderRadius:"12px",padding:"20px",textAlign:"center",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  statVal:  {fontSize:"22px",fontWeight:"900",color:"#1a1a1a",margin:"8px 0 4px 0"},
  statLabel:{fontSize:"11px",color:"#888",margin:0,fontWeight:"700"},
  controls: {display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"},
  search:   {border:"1.5px solid #e0e0e0",borderRadius:"8px",padding:"12px 16px",fontSize:"14px",outline:"none",fontFamily:"'Segoe UI',sans-serif",backgroundColor:"#fff"},
  filters:  {display:"flex",gap:"8px",flexWrap:"wrap"},
  filterBtn:{padding:"7px 14px",borderRadius:"20px",border:"1.5px solid #ddd",background:"#fff",fontSize:"12px",cursor:"pointer",color:"#555",fontWeight:"600"},
  filterActive:{backgroundColor:"#F5A623",color:"#fff",border:"1.5px solid #F5A623"},
  list:     {display:"flex",flexDirection:"column",gap:"12px"},
  card:     {backgroundColor:"#fff",borderRadius:"12px",padding:"16px",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  cardRow:  {display:"flex",justifyContent:"space-between",marginBottom:"10px"},
  orderId:  {fontSize:"13px",fontWeight:"800",color:"#1a1a1a",margin:"0 0 3px 0"},
  customer: {fontSize:"12px",color:"#555",margin:"0 0 3px 0"},
  address:  {fontSize:"11px",color:"#888",margin:0},
  badge:    (s)=>({display:"inline-block",backgroundColor:(STATUS_COLORS[s]||"#888")+"22",color:STATUS_COLORS[s]||"#888",fontSize:"10px",fontWeight:"700",padding:"3px 8px",borderRadius:"5px",marginBottom:"4px"}),
  total:    {fontSize:"15px",fontWeight:"800",color:"#F5A623",margin:"3px 0"},
  kitchen:  {fontSize:"11px",color:"#888",margin:0},
  items:    {display:"flex",flexWrap:"wrap",gap:"6px"},
  item:     {backgroundColor:"#f7f7f7",border:"1px solid #eee",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",color:"#555"},
  empty:    {textAlign:"center",padding:"40px",color:"#888"},
};