import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function MasterKitchens() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [kitchens, setKitchens] = useState([]);
  const [form, setForm]         = useState({ name:"", kitchen_id:"", owner:"", location:"", tag:"*open now, fast prep", rating:"4.5" });
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    api.getKitchens().then(setKitchens);
  }, [master]);

  const handleAdd = async () => {
    setError("");
    if (!form.name || !form.kitchen_id) { setError("Name and Kitchen ID required"); return; }
    setAdding(true);
    try {
      const res = await api.createKitchen({ ...form, rating: parseFloat(form.rating) });
      setKitchens(prev => [...prev, res.kitchen]);
      setForm({ name:"", kitchen_id:"", owner:"", location:"", tag:"*open now, fast prep", rating:"4.5" });
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (kitchenId) => {
    if (!confirm("Delete this kitchen?")) return;
    await api.deleteKitchen(kitchenId);
    setKitchens(prev => prev.filter(k => k.kitchen_id !== kitchenId));
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>Kitchens</h2>
      </div>

      <div style={S.layout}>
        {/* Add Form */}
        <div style={S.formCard}>
          <h3 style={S.section}>➕ Add Kitchen</h3>
          {[["Kitchen Name *","name","Night Bites"],["Kitchen ID *","kitchen_id","k3"],["Owner Name","owner",""],["Location","location",""],["Tag","tag",""],["Rating","rating","4.5"]].map(([label,key,ph]) => (
            <div key={key} style={S.field}>
              <label style={S.label}>{label}</label>
              <input style={S.input} placeholder={ph} value={form[key]}
                onChange={e => setForm({...form,[key]:e.target.value})} />
            </div>
          ))}
          {error && <div style={S.error}>⚠️ {error}</div>}
          <button style={{...S.addBtn, opacity: adding ? 0.7 : 1}} onClick={handleAdd} disabled={adding}>
            {adding ? "Adding..." : "Add Kitchen"}
          </button>
        </div>

        {/* Kitchens List */}
        <div style={S.list}>
          {kitchens.map(k => (
            <div key={k.id} style={S.card}>
              <div style={S.cardRow}>
                <div>
                  <div style={S.openBadge}>OPEN</div>
                  <h3 style={S.kitchenName}>{k.name}</h3>
                  <p style={S.meta}>🆔 {k.kitchen_id} · ⭐ {k.rating}</p>
                  {k.location && <p style={S.meta}>📍 {k.location}</p>}
                  <p style={S.tag}>{k.tag}</p>
                </div>
                <button style={S.deleteBtn} onClick={() => handleDelete(k.kitchen_id)}>🗑️ Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:     {minHeight:"100vh",backgroundColor:"#f7f7f7",fontFamily:"'Segoe UI',sans-serif",padding:"24px"},
  header:   {display:"flex",alignItems:"center",gap:"16px",marginBottom:"24px"},
  back:     {background:"none",border:"1.5px solid #ddd",borderRadius:"8px",padding:"8px 14px",cursor:"pointer",fontSize:"13px",color:"#555"},
  title:    {fontSize:"20px",fontWeight:"800",color:"#1a1a1a",margin:0},
  layout:   {display:"grid",gridTemplateColumns:"320px 1fr",gap:"24px",alignItems:"start"},
  formCard: {backgroundColor:"#fff",borderRadius:"14px",padding:"24px",border:"1.5px solid #efefef",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",position:"sticky",top:"24px",display:"flex",flexDirection:"column",gap:"12px"},
  section:  {fontSize:"14px",fontWeight:"800",color:"#333",margin:0},
  field:    {display:"flex",flexDirection:"column",gap:"5px"},
  label:    {fontSize:"10px",fontWeight:"800",color:"#555",letterSpacing:"0.8px"},
  input:    {border:"1.5px solid #e0e0e0",borderRadius:"8px",padding:"10px 12px",fontSize:"13px",outline:"none",fontFamily:"'Segoe UI',sans-serif"},
  error:    {backgroundColor:"#fff5f5",border:"1px solid #fed7d7",borderRadius:"6px",padding:"10px",color:"#e53e3e",fontSize:"12px"},
  addBtn:   {backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
  list:     {display:"flex",flexDirection:"column",gap:"12px"},
  card:     {backgroundColor:"#fff",borderRadius:"12px",padding:"20px",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  cardRow:  {display:"flex",justifyContent:"space-between",alignItems:"flex-start"},
  openBadge:{display:"inline-block",backgroundColor:"#e6f9f0",color:"#27ae60",fontSize:"10px",fontWeight:"800",padding:"3px 8px",borderRadius:"5px",marginBottom:"8px"},
  kitchenName:{fontSize:"16px",fontWeight:"800",color:"#1a1a1a",margin:"0 0 4px 0"},
  meta:     {fontSize:"12px",color:"#666",margin:"2px 0"},
  tag:      {fontSize:"11px",color:"#F5A623",margin:"4px 0 0 0"},
  deleteBtn:{backgroundColor:"#fff5f5",color:"#e53e3e",border:"1px solid #fed7d7",borderRadius:"8px",padding:"8px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer"},
};