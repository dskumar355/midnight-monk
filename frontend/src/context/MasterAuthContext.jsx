import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const MasterAuthContext = createContext();

export function MasterAuthProvider({ children }) {
  const [master, setMaster] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_master")) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const login = async (username, password) => {
    setLoading(true); setError("");
    try {
      const res = await api.masterLogin(username, password);
      localStorage.setItem("mm_token",  res.token);
      localStorage.setItem("mm_master", JSON.stringify(res.master));
      setMaster(res.master);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_token");
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