import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function MasterAdminAdmins() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [admins, setAdmins]   = useState([]);
  const [form, setForm]       = useState({ username:"", password:"", kitchenId:"", kitchenName:"" });
  const [adding, setAdding]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    api.getAllAdmins().then(setAdmins);
  }, [master]);

  const handleAdd = async () => {
    setError("");
    if (!form.username || !form.password || !form.kitchenId || !form.kitchenName)
      { setError("All fields required"); return; }
    setAdding(true);
    try {
      const res = await api.createAdmin(form);
      setAdmins(prev => [...prev, res.admin]);
      setForm({ username:"", password:"", kitchenId:"", kitchenName:"" });
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this admin?")) return;
    await api.deleteAdmin(id);
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>Kitchen Admins</h2>
      </div>

      <div style={S.layout}>
        {/* Form */}
        <div style={S.formCard}>
          <h3 style={S.section}>➕ Add Admin</h3>
          {[["Username *","username","admin3"],["Password *","password","secret123"],["Kitchen ID *","kitchenId","k3"],["Kitchen Name *","kitchenName","Night Kitchen"]].map(([label,key,ph]) => (
            <div key={key} style={S.field}>
              <label style={S.label}>{label}</label>
              <input style={S.input} placeholder={ph} value={form[key]}
                type={key==="password"?"password":"text"}
                onChange={e => setForm({...form,[key]:e.target.value})} />
            </div>
          ))}
          {error && <div style={S.error}>⚠️ {error}</div>}
          <button style={{...S.addBtn, opacity: adding ? 0.7 : 1}} onClick={handleAdd} disabled={adding}>
            {adding ? "Adding..." : "Add Admin"}
          </button>
        </div>

        {/* Admins List */}
        <div style={S.list}>
          {admins.map(admin => (
            <div key={admin.id} style={S.card}>
              <div style={S.cardRow}>
                <div style={S.avatar}>{admin.username?.[0]?.toUpperCase()}</div>
                <div style={{flex:1}}>
                  <p style={S.username}>{admin.username}</p>
                  <p style={S.meta}>🍽️ {admin.kitchenName} · 🆔 {admin.kitchenId}</p>
                  <div style={S.roleBadge}>{admin.role}</div>
                </div>
                <button style={S.deleteBtn} onClick={() => handleDelete(admin.id)}>🗑️ Remove</button>
              </div>
            </div>
          ))}
          {admins.length === 0 && <div style={S.empty}>No admins yet</div>}
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
  layout:   {display:"grid",gridTemplateColumns:"300px 1fr",gap:"24px",alignItems:"start"},
  formCard: {backgroundColor:"#fff",borderRadius:"14px",padding:"24px",border:"1.5px solid #efefef",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",position:"sticky",top:"24px",display:"flex",flexDirection:"column",gap:"12px"},
  section:  {fontSize:"14px",fontWeight:"800",color:"#333",margin:0},
  field:    {display:"flex",flexDirection:"column",gap:"5px"},
  label:    {fontSize:"10px",fontWeight:"800",color:"#555",letterSpacing:"0.8px"},
  input:    {border:"1.5px solid #e0e0e0",borderRadius:"8px",padding:"10px 12px",fontSize:"13px",outline:"none",fontFamily:"'Segoe UI',sans-serif"},
  error:    {backgroundColor:"#fff5f5",border:"1px solid #fed7d7",borderRadius:"6px",padding:"10px",color:"#e53e3e",fontSize:"12px"},
  addBtn:   {backgroundColor:"#F5A623",color:"#fff",border:"none",borderRadius:"8px",padding:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
  list:     {display:"flex",flexDirection:"column",gap:"12px"},
  card:     {backgroundColor:"#fff",borderRadius:"12px",padding:"16px",border:"1.5px solid #efefef",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"},
  cardRow:  {display:"flex",alignItems:"center",gap:"14px"},
  avatar:   {width:"44px",height:"44px",borderRadius:"50%",backgroundColor:"#1a1a2e",color:"#F5A623",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:"900",flexShrink:0},
  username: {fontSize:"15px",fontWeight:"800",color:"#1a1a1a",margin:"0 0 3px 0"},
  meta:     {fontSize:"12px",color:"#666",margin:"0 0 6px 0"},
  roleBadge:{display:"inline-block",backgroundColor:"#fff8ee",color:"#F5A623",fontSize:"10px",fontWeight:"700",padding:"3px 8px",borderRadius:"5px"},
  deleteBtn:{backgroundColor:"#fff5f5",color:"#e53e3e",border:"1px solid #fed7d7",borderRadius:"8px",padding:"8px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer"},
  empty:    {textAlign:"center",padding:"40px",color:"#888"},
};