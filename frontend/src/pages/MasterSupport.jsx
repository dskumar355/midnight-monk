import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { useSupport } from "../context/SupportContext";
import { useNavigate } from "react-router-dom";

export default function MasterSupport() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const { tickets, fetchTickets, resolveTicket, loading } = useSupport();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    fetchTickets();
  }, [master]);

  const filtered = tickets.filter(t => {
    const matchFilter = filter === "All" || t.status === filter;
    const matchSearch = !search || t.user?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const open     = tickets.filter(t => t.status === "Open").length;
  const resolved = tickets.filter(t => t.status === "Resolved").length;

  if (loading) return <div style={S.centered}>Loading tickets...</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>Support Tickets</h2>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {[["🎧","Total",tickets.length],["🔴","Open",open],["✅","Resolved",resolved]].map(([icon,label,val]) => (
          <div key={label} style={S.stat}>
            <span style={{fontSize:"24px"}}>{icon}</span>
            <p style={S.statVal}>{val}</p>
            <p style={S.statLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <input style={S.search} placeholder="🔍 Search by user or category..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={S.filters}>
          {["All","Open","Resolved"].map(f => (
            <button key={f} style={{...S.filterBtn, ...(filter===f ? S.filterActive:{})}}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Tickets */}
      <div style={S.list}>
        {filtered.map(ticket => (
          <div key={ticket.id} style={S.card}>
            <div style={S.cardRow}>
              <div style={S.avatar}>{ticket.user?.[0]?.toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={S.topRow}>
                  <span style={S.user}>{ticket.user}</span>
                  <span style={S.typeBadge(ticket.senderType)}>{ticket.senderType}</span>
                  <span style={S.statusBadge(ticket.status)}>{ticket.status}</span>
                </div>
                <p style={S.category}>📂 {ticket.category}</p>
                <p style={S.message}>{ticket.message}</p>
                <p style={S.date}>{new Date(ticket.date).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
              </div>
              {ticket.status === "Open" && (
                <button style={S.resolveBtn} onClick={() => resolveTicket(ticket.id)}>✅ Resolve</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={S.empty}>No tickets found</div>}
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
  stats:    {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px"},
  stat:     {backgroundColor:"#fff",borderRadius:"12px",padding:"20px",textAlign:"center",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  statVal:  {fontSize:"24px",fontWeight:"900",color:"#1a1a1a",margin:"8px 0 4px 0"},
  statLabel:{fontSize:"11px",color:"#888",margin:0,fontWeight:"700"},
  controls: {display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"},
  search:   {border:"1.5px solid #e0e0e0",borderRadius:"8px",padding:"12px 16px",fontSize:"14px",outline:"none",fontFamily:"'Segoe UI',sans-serif",backgroundColor:"#fff"},
  filters:  {display:"flex",gap:"8px"},
  filterBtn:{padding:"7px 16px",borderRadius:"20px",border:"1.5px solid #ddd",background:"#fff",fontSize:"12px",cursor:"pointer",color:"#555",fontWeight:"600"},
  filterActive:{backgroundColor:"#F5A623",color:"#fff",border:"1.5px solid #F5A623"},
  list:     {display:"flex",flexDirection:"column",gap:"12px"},
  card:     {backgroundColor:"#fff",borderRadius:"12px",padding:"16px",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  cardRow:  {display:"flex",gap:"14px",alignItems:"flex-start"},
  avatar:   {width:"40px",height:"40px",borderRadius:"50%",backgroundColor:"#1a1a2e",color:"#F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"900",flexShrink:0},
  topRow:   {display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px",flexWrap:"wrap"},
  user:     {fontSize:"14px",fontWeight:"800",color:"#1a1a1a"},
  typeBadge:(t)=>({backgroundColor:t==="admin"?"#fff8ee":"#f0f4ff",color:t==="admin"?"#F5A623":"#3498db",fontSize:"10px",fontWeight:"700",padding:"2px 7px",borderRadius:"5px"}),
  statusBadge:(s)=>({backgroundColor:s==="Open"?"#fff5f5":"#e6f9f0",color:s==="Open"?"#e53e3e":"#27ae60",fontSize:"10px",fontWeight:"700",padding:"2px 7px",borderRadius:"5px"}),
  category: {fontSize:"12px",color:"#888",margin:"2px 0 6px 0"},
  message:  {fontSize:"13px",color:"#444",margin:"0 0 6px 0"},
  date:     {fontSize:"11px",color:"#aaa",margin:0},
  resolveBtn:{backgroundColor:"#e6f9f0",color:"#27ae60",border:"1px solid #b7ebd4",borderRadius:"8px",padding:"8px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",flexShrink:0},
  empty:    {textAlign:"center",padding:"40px",color:"#888"},
};