import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";

const defaultForm = {
  username: "",
  password: "",
  name: "",
  phone: "",
  email: "",
  vehicleType: "BIKE",
  vehicleNumber: "",
  serviceArea: "",
  maxDeliveryRadius: 8,
  accountStatus: "ACTIVE",
  notes: "",
};

export default function MasterDeliveryPartners() {
  const navigate = useNavigate();
  const { master, logout } = useMasterAuth();
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!master) {
      navigate("/master/login");
      return;
    }
    loadPartners();
  }, [master]);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await api.getDeliveryPartners();
      setPartners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const q = search.toLowerCase();
      const matchesQuery = !q || [partner.name, partner.phone, partner.email, partner.username, partner.id].join(" ").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || partner.accountStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [partners, search, statusFilter]);

  const handleSubmit = async () => {
    try {
      const response = await api.createDeliveryPartner(form);
      setPartners((prev) => [response.partner, ...prev]);
      setForm(defaultForm);
      alert("Delivery partner created successfully");
    } catch (err) {
      alert(err.message || "Unable to create partner");
    }
  };

  const handleStatus = async (partnerId, accountStatus) => {
    try {
      const response = await api.updatePartnerStatus(partnerId, accountStatus);
      setPartners((prev) => prev.map((p) => (p.id === partnerId ? response.partner : p)));
    } catch (err) {
      alert(err.message || "Status update failed");
    }
  };

  const handleAvailability = async (partnerId, isOnline) => {
    try {
      const response = await api.updatePartnerAvailability(partnerId, isOnline);
      setPartners((prev) => prev.map((p) => (p.id === partnerId ? response.partner : p)));
    } catch (err) {
      alert(err.message || "Availability update failed");
    }
  };

  if (!master) return null;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
          <div>
            <p style={S.kicker}>Delivery Management</p>
            <h2 style={S.title}>Delivery Partners</h2>
          </div>
        </div>
        <button style={S.logout} onClick={() => { logout(); navigate("/master/login"); }}>Logout</button>
      </div>

      <div style={S.layout}>
        <section style={S.card}>
          <h3 style={S.sectionTitle}>+ Add Delivery Partner</h3>
          <div style={S.grid}>
            {[
              ["Username", "username"],
              ["Password", "password"],
              ["Full Name", "name"],
              ["Phone", "phone"],
              ["Email", "email"],
              ["Vehicle Number", "vehicleNumber"],
              ["Service Area", "serviceArea"],
            ].map(([label, key]) => (
              <div key={key} style={S.field}>
                <label style={S.label}>{label}</label>
                <input
                  style={S.input}
                  type={key === "password" ? "password" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div style={S.field}>
              <label style={S.label}>Vehicle</label>
              <select style={S.input} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                {['BIKE', 'SCOOTER', 'BICYCLE', 'WALKING', 'OTHER'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Account Status</label>
              <select style={S.input} value={form.accountStatus} onChange={(e) => setForm({ ...form, accountStatus: e.target.value })}>
                {['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Max Delivery Radius (km)</label>
              <input style={S.input} type="number" value={form.maxDeliveryRadius} onChange={(e) => setForm({ ...form, maxDeliveryRadius: Number(e.target.value || 8) })} />
            </div>
            <div style={{ ...S.field, gridColumn: "1 / -1" }}>
              <label style={S.label}>Notes</label>
              <textarea style={{ ...S.input, minHeight: 80 }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button style={S.primaryButton} onClick={handleSubmit}>Create Partner</button>
        </section>

        <section style={S.card}>
          <div style={S.tableHeader}>
            <h3 style={S.sectionTitle}>Partner List</h3>
            <div style={S.inlineControls}>
              <input style={S.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partner" />
              <select style={S.input} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? <p style={S.empty}>Loading partners…</p> : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Partner</th>
                    <th style={S.th}>Phone</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Online</th>
                    <th style={S.th}>Work</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id}>
                      <td style={S.td}>
                        <div style={S.partnerCell}>
                          <div style={S.avatar}>{(partner.name || partner.username || "P").charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={S.name}>{partner.name || partner.username}</div>
                            <div style={S.meta}>{partner.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>{partner.phone || "—"}</td>
                      <td style={S.td}><span style={{ ...S.badge, background: partner.accountStatus === "ACTIVE" ? "#ecfdf5" : "#fff7ed", color: partner.accountStatus === "ACTIVE" ? "#047857" : "#b45309" }}>{partner.accountStatus || "ACTIVE"}</span></td>
                      <td style={S.td}><button style={{ ...S.smallButton, background: partner.isOnline ? "#16a34a" : "#64748b" }} onClick={() => handleAvailability(partner.id, !partner.isOnline)}>{partner.isOnline ? "Online" : "Offline"}</button></td>
                      <td style={S.td}>{partner.workStatus || "AVAILABLE"}</td>
                      <td style={S.td}>
                        <div style={S.actionGroup}>
                          <button style={S.smallButton} onClick={() => handleStatus(partner.id, "ACTIVE")}>Activate</button>
                          <button style={S.warnButton} onClick={() => handleStatus(partner.id, "SUSPENDED")}>Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPartners.length && <p style={S.empty}>No partners matched your search.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "Segoe UI, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  back: { background: "transparent", border: "1px solid #dbe3ef", borderRadius: "10px", padding: "10px 14px", fontWeight: 700, cursor: "pointer" },
  kicker: { margin: 0, color: "#f59e0b", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" },
  title: { margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#0f172a" },
  logout: { background: "#0f172a", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 16px", fontWeight: 700, cursor: "pointer" },
  layout: { display: "grid", gridTemplateColumns: "minmax(320px, 420px) minmax(0,1fr)", gap: "24px", alignItems: "start" },
  card: { background: "#fff", borderRadius: "18px", padding: "20px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)", border: "1px solid #edf2f7" },
  sectionTitle: { margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#0f172a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" },
  input: { border: "1px solid #dfe7ef", borderRadius: "10px", padding: "10px 12px", fontSize: 14, color: "#0f172a", background: "#fff" },
  primaryButton: { marginTop: "16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 16px", fontWeight: 800, width: "100%", cursor: "pointer" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  inlineControls: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  search: { border: "1px solid #dfe7ef", borderRadius: "10px", padding: "10px 12px", minWidth: "180px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", padding: "10px 8px", borderBottom: "1px solid #edf2f7" },
  td: { fontSize: 14, color: "#1e293b", padding: "12px 8px", borderBottom: "1px solid #edf2f7", verticalAlign: "middle" },
  partnerCell: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 },
  name: { fontWeight: 800 },
  meta: { fontSize: 12, color: "#64748b" },
  badge: { display: "inline-block", borderRadius: "999px", padding: "5px 10px", fontSize: 11, fontWeight: 800 },
  actionGroup: { display: "flex", flexWrap: "wrap", gap: "8px" },
  smallButton: { border: "none", borderRadius: "8px", padding: "6px 10px", background: "#111827", color: "#fff", fontWeight: 700, cursor: "pointer" },
  warnButton: { border: "none", borderRadius: "8px", padding: "6px 10px", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" },
  empty: { color: "#64748b", padding: "12px 0", fontSize: 14 },
};
