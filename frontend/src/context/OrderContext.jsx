import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Auto-fetch user orders on mount if logged in
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("mm_user");
      const token = localStorage.getItem("mm_user_token") || localStorage.getItem("mm_token");
      if (userStr && token) {
        const u = JSON.parse(userStr);
        if (u?.mobile) {
          fetchUserOrders(u.mobile);
        }
      }
    } catch {}
  }, []);

  // ✅ Place order — calls backend
  const addOrder = async (orderData) => {
    setLoading(true); setError("");
    try {
      const res = await api.placeOrder(orderData);
      setOrders(prev => [res.order, ...prev]);
      return { success: true, order: res.order };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  };

  // ✅ Fetch user orders from backend
  const fetchUserOrders = async (mobile, { silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(""); }
    try {
      const data = await api.getUserOrders(mobile);
      setOrders(data);
      return data;
    } catch (err) {
      if (!silent) setError(err.message);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ Fetch kitchen orders (supports silent background sync)
  const fetchKitchenOrders = async (kitchenId, { silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(""); }
    try {
      const data = await api.getKitchenOrders(kitchenId);
      setOrders(data);
      return data;
    } catch (err) {
      if (!silent) setError(err.message);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ Fetch all orders (master admin)
  const fetchAllOrders = async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(""); }
    try {
      const data = await api.getAllOrders();
      setOrders(data);
      return data;
    } catch (err) {
      if (!silent) setError(err.message);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDeliveryOrders = async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(""); }
    try {
      const data = await api.getDeliveryOrders();
      setOrders(data);
      return data;
    } catch (err) {
      if (!silent) setError(err.message);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ Upsert order dynamically without full refetch
  const upsertOrder = (updatedOrder) => {
    if (!updatedOrder?.id) return;
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === updatedOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      }
      return [updatedOrder, ...prev];
    });
  };

  // ✅ Update order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await api.updateOrderStatus(orderId, status);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? res.order : o)
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateDeliveryStatus = async (orderId, status, payload = {}) => {
    try {
      const res = await api.updateDeliveryStatus(orderId, status, payload);
      setOrders(prev => prev.map(o => o.id === orderId ? res.order : o));
      return { success: true, order: res.order };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <OrderContext.Provider value={{
      orders, loading, error,
      addOrder,
      fetchUserOrders,
      fetchKitchenOrders,
      fetchAllOrders,
      fetchDeliveryOrders,
      updateOrderStatus,
      updateDeliveryStatus,
      upsertOrder,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
