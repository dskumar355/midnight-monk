import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("mm_user_token") || localStorage.getItem("mm_token");
      if (!token) return null;
      return JSON.parse(localStorage.getItem("mm_user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Listen for auth-expired event triggered by 401 response
  useEffect(() => {
    const handleAuthExpired = (e) => {
      if (!e.detail || e.detail.role === "user") {
        setUser(null);
      }
    };
    window.addEventListener("mm_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("mm_auth_expired", handleAuthExpired);
  }, []);

  const login = async (name, mobile) => {
    setLoading(true); setError("");
    try {
      const res = await api.userLogin(name, mobile);
      localStorage.setItem("mm_user_token", res.token);
      localStorage.setItem("mm_token", res.token); // legacy fallback
      localStorage.setItem("mm_user",  JSON.stringify(res.user));
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const register = async (name, mobile, confirmMobile) => {
    setLoading(true); setError("");
    try {
      const res = await api.userRegister(name, mobile, confirmMobile);
      localStorage.setItem("mm_user_token", res.token);
      localStorage.setItem("mm_token", res.token); // legacy fallback
      localStorage.setItem("mm_user",  JSON.stringify(res.user));
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_user_token");
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem("mm_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <UserAuthContext.Provider value={{ user, login, register, logout, updateUser, loading, error }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}