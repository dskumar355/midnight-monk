import { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

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
  const fetchUserOrders = async (mobile) => {
    setLoading(true); setError("");
    try {
      const data = await api.getUserOrders(mobile);
      setOrders(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally { setLoading(false); }
  };

  // ✅ Fetch kitchen orders
  const fetchKitchenOrders = async (kitchenId) => {
    setLoading(true); setError("");
    try {
      const data = await api.getKitchenOrders(kitchenId);
      setOrders(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally { setLoading(false); }
  };

  // ✅ Fetch all orders (master admin)
  const fetchAllOrders = async () => {
    setLoading(true); setError("");
    try {
      const data = await api.getAllOrders();
      setOrders(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally { setLoading(false); }
  };

  // ✅ Update order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await api.updateOrderStatus(orderId, status);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status } : o)
      );
      return { success: true };
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
      updateOrderStatus,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}