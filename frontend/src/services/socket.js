// ✅ Socket.IO service — real-time order status updates
import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  if (typeof window !== "undefined" && window.location) {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocalhost) {
      return "https://midnight-monk-1.onrender.com";
    }
  }
  return envUrl || "http://localhost:8000";
};

const SOCKET_URL = resolveSocketUrl();

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

  const onStatus = (data) => {
    if (data?.orderId === orderId) callback(data);
  };
  const onLocation = (data) => {
    if (data?.orderId === orderId) callback(data);
  };

  s.on("order_status_update", onStatus);
  s.on("rider_location_update", onLocation);

  return () => {
    s.off("order_status_update", onStatus);
    s.off("rider_location_update", onLocation);
  };
}

// Join a kitchen room for incoming order notifications
export function subscribeToKitchen(kitchenId, callback) {
  const s = getSocket();
  s.emit("join_kitchen", { kitchenId });
  s.on("kitchen_order_update", callback);
  return () => s.off("kitchen_order_update", callback);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
