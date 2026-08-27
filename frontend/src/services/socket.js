// ✅ Socket.IO service — real-time order status updates
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket.IO connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket.IO disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("🔌 Socket.IO connection error:", err.message);
    });
  }
  return socket;
}

// Join a room to receive updates for a specific order
export function subscribeToOrder(orderId, callback) {
  const s = getSocket();
  s.emit("join_order", { orderId });
  s.on("order_status_update", (data) => {
    if (data.orderId === orderId) callback(data);
  });
  return () => s.off("order_status_update");
}

// Join a kitchen room for incoming order notifications
export function subscribeToKitchen(kitchenId, callback) {
  const s = getSocket();
  s.emit("join_kitchen", { kitchenId });
  s.on("kitchen_order_update", callback);
  return () => s.off("kitchen_order_update");
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
