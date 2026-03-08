import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_admin")) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const login = async (username, password) => {
    setLoading(true); setError("");
    try {
      const res = await api.adminLogin(username, password);
      localStorage.setItem("mm_token", res.token);
      localStorage.setItem("mm_admin", JSON.stringify(res.admin));
      setAdmin(res.admin);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_admin");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading, error }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}