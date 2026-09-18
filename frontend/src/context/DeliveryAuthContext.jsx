import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const DeliveryAuthContext = createContext();

export function DeliveryAuthProvider({ children }) {
  const [partner, setPartner] = useState(() => {
    try {
      const token = localStorage.getItem("mm_delivery_token");
      if (!token) return null;
      return JSON.parse(localStorage.getItem("mm_delivery_partner")) || null;
    }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuthExpired = (e) => {
      if (!e.detail || e.detail.role === "delivery") setPartner(null);
    };
    window.addEventListener("mm_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("mm_auth_expired", handleAuthExpired);
  }, []);

  const login = async (username, password) => {
    setLoading(true); setError("");
    try {
      const res = await api.deliveryLogin(username, password);
      localStorage.setItem("mm_delivery_token", res.token);
      localStorage.setItem("mm_delivery_partner", JSON.stringify(res.partner));
      setPartner(res.partner);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_delivery_token");
    localStorage.removeItem("mm_delivery_partner");
    setPartner(null);
  };

  const updatePartner = (updatedPartner) => {
    localStorage.setItem("mm_delivery_partner", JSON.stringify(updatedPartner));
    setPartner(updatedPartner);
  };

  return (
    <DeliveryAuthContext.Provider value={{ partner, login, logout, updatePartner, loading, error }}>
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth() {
  return useContext(DeliveryAuthContext);
}
