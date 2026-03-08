import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const SupportContext = createContext();

export function SupportProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const createTicket = async (data) => {
    try {
      const res = await api.createTicket(data);
      return { success: true, ticketId: res.ticketId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets();
      setTickets(data);
      return data;
    } catch (err) {
      return [];
    } finally { setLoading(false); }
  };

  const resolveTicket = async (ticketId) => {
    try {
      await api.resolveTicket(ticketId);
      setTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, status: "Resolved" } : t)
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <SupportContext.Provider value={{ tickets, loading, createTicket, fetchTickets, resolveTicket }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  return useContext(SupportContext);
}