import { useEffect, useState } from "react";
import { useMasterAuth } from "../context/MasterAuthContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

function relativeTime(ts) {
  if (!ts) return "—";
  const now = Date.now();
  const then = new Date(ts.endsWith("Z") ? ts : ts + "Z").getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day(s) ago`;
}

function actionColor(action) {
  if (!action) return "#555";
  const a = action.toLowerCase();
  if (a.includes("login")) return "#2e7d32";
  if (a.includes("otp")) return "#1565c0";
  if (a.includes("admin") || a.includes("create") || a.includes("update") || a.includes("delete")) return "#e67e22";
  if (a.includes("error") || a.includes("fail")) return "#e53e3e";
  return "#555";
}

export default function MasterAuditLogs() {
  const navigate = useNavigate();
  const { master } = useMasterAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!master) { navigate("/master/login"); return; }
    api.getAuditLogs(100)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [master]);

  // ── Stats ──
  const totalEvents = logs.length;
  const uniqueActors = new Set(logs.map((l) => l.actor)).size;
  const now = Date.now();
  const recent24h = logs.filter((l) => {
    const ts = l.timestamp ? new Date(l.timestamp.endsWith("Z") ? l.timestamp : l.timestamp + "Z").getTime() : 0;
    return now - ts < 86400000;
  }).length;

  if (loading) return <div style={S.centered}>Loading audit logs...</div>;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.back} onClick={() => navigate("/master")}>← Dashboard</button>
        <h2 style={S.title}>🔐 Security Audit Logs</h2>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        {[
          ["📋", "Total Events", totalEvents],
          ["👤", "Unique Actors", uniqueActors],
          ["⏱️", "Last 24 Hours", recent24h],
        ].map(([icon, label, val]) => (
          <div key={label} style={S.statCard}>
            <span style={{ fontSize: "26px" }}>{icon}</span>
            <div>
              <p style={S.statVal}>{val}</p>
              <p style={S.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div style={S.card}>
        {logs.length === 0 ? (
          <p style={S.empty}>No audit events recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Actor</th>
                  <th style={S.th}>Action</th>
                  <th style={S.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i} style={i % 2 === 0 ? S.rowEven : S.rowOdd}>
                    <td style={S.td}>
                      <span style={S.timeMain}>{relativeTime(log.timestamp)}</span>
                      <span style={S.timeSub}>{log.timestamp ? new Date(log.timestamp.endsWith("Z") ? log.timestamp : log.timestamp + "Z").toLocaleString() : "—"}</span>
                    </td>
                    <td style={S.td}>
                      <span style={S.actor}>{log.actor || "—"}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, backgroundColor: actionColor(log.action) + "18", color: actionColor(log.action), border: `1px solid ${actionColor(log.action)}40` }}>
                        {log.action || "—"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={S.details}>
                        {log.details && Object.keys(log.details).length > 0
                          ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page:      { minHeight: "100vh", backgroundColor: "#FFFFFF", fontFamily: "'Segoe UI', sans-serif", padding: "24px" },
  centered:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "'Segoe UI', sans-serif" },
  header:    { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  back:      { background: "none", border: "1.5px solid #ddd", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontSize: "13px", color: "#555", fontFamily: "'Segoe UI', sans-serif" },
  title:     { fontSize: "20px", fontWeight: "800", color: "#1a1a1a", margin: 0 },

  statsRow:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" },
  statCard:  { backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", border: "1.5px solid #efefef", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" },
  statVal:   { fontSize: "22px", fontWeight: "900", color: "#1a1a1a", margin: 0 },
  statLabel: { fontSize: "10px", fontWeight: "700", color: "#888", letterSpacing: "1px", margin: "4px 0 0 0", textTransform: "uppercase" },

  card:      { backgroundColor: "#fff", borderRadius: "14px", padding: "24px", border: "1.5px solid #efefef", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  empty:     { color: "#aaa", fontSize: "13px", textAlign: "center", padding: "40px 0" },

  table:     { width: "100%", borderCollapse: "collapse", fontFamily: "'Segoe UI', sans-serif" },
  th:        { textAlign: "left", padding: "12px 14px", fontSize: "10px", fontWeight: "700", color: "#888", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "2px solid #efefef" },
  td:        { padding: "12px 14px", fontSize: "13px", color: "#333", verticalAlign: "top", borderBottom: "1px solid #f5f5f5" },
  rowEven:   { backgroundColor: "#fff" },
  rowOdd:    { backgroundColor: "#fafafa" },

  timeMain:  { display: "block", fontWeight: "600", color: "#1a1a1a", fontSize: "13px" },
  timeSub:   { display: "block", fontSize: "10px", color: "#aaa", marginTop: "2px" },
  actor:     { fontWeight: "700", color: "#2d3748", fontSize: "13px" },
  badge:     { display: "inline-block", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.3px" },
  details:   { fontSize: "12px", color: "#888", fontStyle: "italic" },
};
