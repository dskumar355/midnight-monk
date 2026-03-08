import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_user")) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const login = async (name, mobile) => {
    setLoading(true); setError("");
    try {
      const res = await api.userLogin(name, mobile);
      localStorage.setItem("mm_token", res.token);
      localStorage.setItem("mm_user",  JSON.stringify(res.user));
      setUser(res.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const register = async (name, mobile, confirmMobile) => {
    setLoading(true); setError("");
    try {
      const res = await api.userRegister(name, mobile, confirmMobile);
      localStorage.setItem("mm_token", res.token);
      localStorage.setItem("mm_user",  JSON.stringify(res.user));
      setUser(res.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    setUser(null);
  };

  return (
    <UserAuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}