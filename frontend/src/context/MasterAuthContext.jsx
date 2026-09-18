import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const MasterAuthContext = createContext();

export function MasterAuthProvider({ children }) {
  const [master, setMaster] = useState(() => {
    try {
      const token = localStorage.getItem("mm_master_token");
      if (!token) return null;
      return JSON.parse(localStorage.getItem("mm_master")) || null;
    }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const handleAuthExpired = (e) => {
      if (!e.detail || e.detail.role === "master") setMaster(null);
    };
    window.addEventListener("mm_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("mm_auth_expired", handleAuthExpired);
  }, []);

  const login = async (username, password) => {
    setLoading(true); setError("");
    try {
      const res = await api.masterLogin(username, password);
      localStorage.setItem("mm_master_token",  res.token);
      localStorage.setItem("mm_master", JSON.stringify(res.master));
      setMaster(res.master);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_master_token");
    localStorage.removeItem("mm_master");
    setMaster(null);
  };

  return (
    <MasterAuthContext.Provider value={{ master, login, logout, loading, error }}>
      {children}
    </MasterAuthContext.Provider>
  );
}

export function useMasterAuth() {
  return useContext(MasterAuthContext);
}