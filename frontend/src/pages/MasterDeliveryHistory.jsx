import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useMasterAuth } from "../context/MasterAuthContext";

export default function MasterDeliveryHistory() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!master) { navigate('/master/login'); return; }
    api.getDeliveryHistory().then(setHistory).catch(() => {});
  }, [master]);

  if (!master) return null;

  return (
    <div style={{padding:24}}>
      <button style={{marginBottom:16}} onClick={() => navigate('/master')}>← Dashboard</button>
      <h2>Delivery History</h2>
      <div>
        {history.map(o => (
          <div key={o.id} style={{border:'1px solid #eee',padding:12,borderRadius:8,marginBottom:8}}>
            <div><strong>#{String(o.id).slice(-8).toUpperCase()}</strong> · {o.status}</div>
            <div>{o.user?.name} · {o.kitchenId}</div>
            <div>Partner: {o.deliveryAssignment?.partner_name || '—'}</div>
            <div>Delivered at: {o.deliveryAssignment?.delivered_at || o.updatedAt}</div>
          </div>
        ))}
        {!history.length && <p>No history found</p>}
      </div>
    </div>
  );
}
