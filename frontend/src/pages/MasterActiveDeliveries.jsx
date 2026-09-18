import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";

export default function MasterActiveDeliveries() {
  const navigate = useNavigate();
  const { master, logout } = useMasterAuth();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [deliveryData, partnerData] = await Promise.all([
        api.getActiveDeliveries(),
        api.getDeliveryPartners(),
      ]);
      setOrders(deliveryData || []);
      setPartners(partnerData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!master) {
      navigate("/master/login");
      return;
    }
    load();
  }, [master]);

  const assignPartner = async (orderId, partnerId) => {
    try {
      const response = await api.assignDelivery(orderId, partnerId);
      alert(response.message || "Delivery assigned");
      await load();
    } catch (err) {
      alert(err.message || "Assignment failed");
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
            <h2 style={S.title}>Active Deliveries</h2>
          </div>
        </div>
        <button style={S.logout} onClick={() => { logout(); navigate("/master/login"); }}>Logout</button>
      </div>

      {loading ? <p style={S.empty}>Loading deliveries…</p> : (
        <div style={S.grid}>
          {orders.map((order) => {
            const partnerOptions = partners.filter((p) => p.accountStatus === "ACTIVE" && p.isOnline && !p.activeOrderId);
            return (
              <div key={order.id} style={S.card}>
                <div style={S.row}>
                  <div>
                    <div style={S.label}>Order #{String(order.id).slice(-8).toUpperCase()}</div>
                    <h3 style={S.orderTitle}>{order.status}</h3>
                  </div>
                  <div style={S.amount}>₹{Number(order.total || 0).toFixed(2)}</div>
                </div>

                <p style={S.meta}>Customer: {order.user?.name || "Customer"}</p>
                <p style={S.meta}>Kitchen: {order.kitchenId || "Kitchen"}</p>
                <p style={S.meta}>Payment: {order.paymentMethod || "COD"}</p>
                <p style={S.meta}>Assigned: {order.deliveryAssignment?.partner_name || "Unassigned"}</p>
                <div style={S.actions}>
                  <select
                    style={S.select}
                    defaultValue=""
                    onChange={(e) => {
                      const partnerId = e.target.value;
                      if (partnerId) assignPartner(order.id, partnerId);
                    }}
                  >
                    <option value="">Assign partner</option>
                    {partnerOptions.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.name} — {partner.isOnline ? "ONLINE" : "OFFLINE"}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          {!orders.length && <p style={S.empty}>No active deliveries found.</p>}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "Segoe UI, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  back: { background: "transparent", border: "1px solid #dbe3ef", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", fontWeight: 700 },
  kicker: { margin: 0, color: "#10b981", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" },
  title: { margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#0f172a" },
  logout: { background: "#0f172a", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 16px", fontWeight: 700, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" },
  card: { background: "#fff", border: "1px solid #edf2f7", borderRadius: "18px", padding: "20px", boxShadow: "0 8px 22px rgba(15,23,42,0.04)" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  label: { fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" },
  orderTitle: { margin: "8px 0 0", fontSize: 22, fontWeight: 900, color: "#0f172a" },
  amount: { fontWeight: 900, fontSize: 20, color: "#0f172a" },
  meta: { margin: "8px 0", color: "#475569", fontSize: 14 },
  actions: { marginTop: "14px" },
  select: { width: "100%", border: "1px solid #dfe7ef", borderRadius: "10px", padding: "10px 12px", fontSize: 14, background: "#fff" },
  empty: { color: "#64748b", fontSize: 14, padding: "8px 0" },
};
