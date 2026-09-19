import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { useOrders } from "../context/OrderContext";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../services/api";

const STATUS_COLORS = { ORDER_PLACED:"#3498db", ACCEPTED:"#0ea5e9", PREPARING:"#e67e22", READY:"#8b5cf6", ASSIGNED:"#7c3aed", PICKED_UP:"#f97316", OUT_FOR_DELIVERY:"#22c55e", DELIVERED:"#16a34a" };

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
    pending:  orders.filter(o => o.status !== "DELIVERED").length,
    delivered:orders.filter(o => o.status === "DELIVERED").length,
  };

  if (loading) return <div style={S.centered}>Loading orders...</div>;

  const [selectedProof, setSelectedProof] = useState(null);

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
          {["All","ORDER_PLACED","ACCEPTED","PREPARING","READY","ASSIGNED","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED"].map(s => (
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <p style={{ ...S.orderId, margin: 0 }}>#{order.id?.slice(-8).toUpperCase()}</p>
                  {order.order_type === "PREORDER" && (
                    <span style={{ backgroundColor: "#9333ea20", color: "#9333ea", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px" }}>
                      🌙 PRE-ORDER
                    </span>
                  )}
                </div>
                <p style={S.customer}>{order.user?.name} · {order.user?.mobile}</p>
                <p style={S.address}>📍 {order.address}</p>
                {order.scheduled_for && (
                  <p style={{ ...S.address, color: "#9333ea", fontWeight: "700" }}>
                    🕒 Scheduled: {new Date(order.scheduled_for).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={S.badge(order.status)}>{order.status}</div>
                <p style={S.total}>₹{order.total}</p>
                <p style={S.kitchen}>🍽️ {order.kitchenId}</p>
                {order.deliveryAssignment?.partner_name && <p style={S.kitchen}>🛵 {order.deliveryAssignment.partner_name} · {order.deliveryAssignment.partner_phone}</p>}
                {order.delivery_proof?.photo_url && (
                  <button
                    onClick={() => setSelectedProof(order.delivery_proof)}
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid #22c55e",
                      color: "#15803d",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                  >
                    📸 Proof Photo
                  </button>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {(order.food_instructions || order.delivery_instructions) && (
              <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "8px 12px", margin: "8px 0", border: "1px solid #e2e8f0", fontSize: "11px" }}>
                {order.food_instructions && (
                  <div style={{ color: "#d97706", marginBottom: "3px" }}>
                    <strong>🍽️ Kitchen:</strong> {order.food_instructions}
                  </div>
                )}
                {order.delivery_instructions && (
                  <div style={{ color: "#0284c7" }}>
                    <strong>🛵 Rider:</strong> {order.delivery_instructions}
                  </div>
                )}
              </div>
            )}

            <div style={S.items}>
              {order.items?.map((item, i) => (
                <span key={i} style={S.item}>{item.name} ×{item.quantity}</span>
              ))}
            </div>
            {order.paymentMethod === "COD" && <p style={S.address}>Cash to collect: ₹{order.cod?.amount_expected || order.total} · {order.cod?.collection_status || "PENDING"}</p>}
          </div>
        ))}
        {filtered.length === 0 && <div style={S.empty}>No orders found</div>}
      </div>

      {/* Proof Photo Modal */}
      {selectedProof && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px",
        }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", maxWidth: "480px", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Verified Delivery Proof</h3>
              <button onClick={() => setSelectedProof(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>
            <img src={resolveMediaUrl(selectedProof.photo_url || selectedProof.photo_data)} alt="Delivery Proof" style={{ width: "100%", maxHeight: "350px", objectFit: "contain", borderRadius: "8px", border: "1px solid #eee" }} />
            <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
              Rider: <strong>{selectedProof.delivery_partner_name || "Partner"}</strong> · {selectedProof.captured_at ? new Date(selectedProof.captured_at).toLocaleString() : ""}
            </p>
            <button onClick={() => setSelectedProof(null)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#F5A623", border: "none", color: "#fff", fontWeight: "800", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:     {minHeight:"100vh",backgroundColor:"#FFFFFF",fontFamily:"'Segoe UI',sans-serif",padding:"24px"},
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
  item:     {backgroundColor:"#FFFFFF",border:"1px solid #eee",borderRadius:"5px",padding:"3px 8px",fontSize:"11px",color:"#555"},
  empty:    {textAlign:"center",padding:"40px",color:"#888"},
};
