import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const token = localStorage.getItem("mm_admin_token");
      if (!token) return null;
      return JSON.parse(localStorage.getItem("mm_admin")) || null;
    }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const handleAuthExpired = (e) => {
      if (!e.detail || e.detail.role === "admin") setAdmin(null);
    };
    window.addEventListener("mm_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("mm_auth_expired", handleAuthExpired);
  }, []);

  const login = async (username, password) => {
    setLoading(true); setError("");
    try {
      const res = await api.adminLogin(username, password);
      localStorage.setItem("mm_admin_token", res.token);
      localStorage.setItem("mm_admin", JSON.stringify(res.admin));
      setAdmin(res.admin);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_admin_token");
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