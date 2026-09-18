// ✅ Central API service for Midnight Monk
// All backend calls go through here

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const BASE_URL = `${API_ROOT}/api`;

// ─────────────────────────────────────────
// 🔧 HELPER — make authenticated requests
// ─────────────────────────────────────────
export const detectCurrentRole = () => {
  if (typeof window !== "undefined" && window.location) {
    const path = window.location.pathname || "";
    if (path.startsWith("/master")) return "master";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/delivery")) return "delivery";
  }
  return "user";
};

export const getTokenForRole = (role) => {
  const targetRole = role || detectCurrentRole();
  if (targetRole === "admin") {
    return localStorage.getItem("mm_admin_token") || null;
  }
  if (targetRole === "master") {
    return localStorage.getItem("mm_master_token") || null;
  }
  if (targetRole === "delivery") {
    return localStorage.getItem("mm_delivery_token") || null;
  }
  return localStorage.getItem("mm_user_token") || localStorage.getItem("mm_token") || null;
};

const getHeaders = (role) => {
  const token = getTokenForRole(role);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res, role) => {
  const targetRole = role || detectCurrentRole();
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (res.status === 401) {
      // Clear expired authentication state for the relevant role
      if (targetRole === "user") {
        localStorage.removeItem("mm_user_token");
        localStorage.removeItem("mm_token");
        localStorage.removeItem("mm_user");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mm_auth_expired", { detail: { role: "user" } }));
        }
      } else if (targetRole === "admin") {
        localStorage.removeItem("mm_admin_token");
        localStorage.removeItem("mm_admin");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mm_auth_expired", { detail: { role: "admin" } }));
        }
      } else if (targetRole === "master") {
        localStorage.removeItem("mm_master_token");
        localStorage.removeItem("mm_master");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mm_auth_expired", { detail: { role: "master" } }));
        }
      } else if (targetRole === "delivery") {
        localStorage.removeItem("mm_delivery_token");
        localStorage.removeItem("mm_delivery_partner");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mm_auth_expired", { detail: { role: "delivery" } }));
        }
      }
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
};

// ─────────────────────────────────────────
// 🔐 AUTH
// ─────────────────────────────────────────
export const api = {
  // User
  userLogin: (name, mobile) =>
    fetch(`${BASE_URL}/auth/user-login`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify({ name, mobile }),
    }).then((res) => handleResponse(res, "user")),

  userRegister: (name, mobile, confirmMobile) =>
    fetch(`${BASE_URL}/auth/user-register`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify({ name, mobile, confirmMobile }),
    }).then((res) => handleResponse(res, "user")),

  // Kitchen Admin
  adminLogin: (username, password) =>
    fetch(`${BASE_URL}/auth/admin-login`, {
      method: "POST",
      headers: getHeaders("admin"),
      body: JSON.stringify({ username, password }),
    }).then((res) => handleResponse(res, "admin")),

  // Master Admin
  masterLogin: (username, password) =>
    fetch(`${BASE_URL}/auth/master-login`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify({ username, password }),
    }).then((res) => handleResponse(res, "master")),

  deliveryLogin: (username, password) =>
    fetch(`${BASE_URL}/auth/delivery-login`, {
      method: "POST",
      headers: getHeaders("delivery"),
      body: JSON.stringify({ username, password }),
    }).then((res) => handleResponse(res, "delivery")),

  // Update user profile name
  updateProfile: (name) =>
    fetch(`${BASE_URL}/auth/update-profile`, {
      method: "PATCH",
      headers: getHeaders("user"),
      body: JSON.stringify({ name }),
    }).then((res) => handleResponse(res, "user")),

  // ─────────────────────────────────────────
  // 🍽️ KITCHENS
  // ─────────────────────────────────────────
  getKitchens: () =>
    fetch(`${BASE_URL}/kitchens/all`, { headers: getHeaders() }).then(handleResponse),

  getAllKitchens: () =>
    fetch(`${BASE_URL}/kitchens/all-public`, { headers: getHeaders() }).then(handleResponse),

  getKitchen: (kitchenId) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  createKitchen: (data) =>
    fetch(`${BASE_URL}/kitchens/create`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  deleteKitchen: (kitchenId) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}`, {
      method: "DELETE",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  updateKitchen: (kitchenId, data) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}`, {
      method: "PUT",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  toggleKitchen: (kitchenId) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}/toggle`, {
      method: "PATCH",
      headers: getHeaders("admin"),
    }).then((res) => handleResponse(res, "admin")),

  // ─────────────────────────────────────────
  // 🍲 MENU
  // ─────────────────────────────────────────
  getMenu: (kitchenId) =>
    fetch(`${BASE_URL}/menu/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  addMenuItem: (data) =>
    fetch(`${BASE_URL}/menu/add`, {
      method: "POST",
      headers: getHeaders("admin"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "admin")),

  updateMenuItem: (itemId, data) =>
    fetch(`${BASE_URL}/menu/${itemId}`, {
      method: "PUT",
      headers: getHeaders("admin"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "admin")),

  deleteMenuItem: (itemId) =>
    fetch(`${BASE_URL}/menu/delete/${itemId}`, {
      method: "DELETE",
      headers: getHeaders("admin"),
    }).then((res) => handleResponse(res, "admin")),

  toggleMenuItem: (itemId) =>
    fetch(`${BASE_URL}/menu/toggle/${itemId}`, {
      method: "PATCH",
      headers: getHeaders("admin"),
    }).then((res) => handleResponse(res, "admin")),

  // ─────────────────────────────────────────
  // 📦 ORDERS
  // ─────────────────────────────────────────
  placeOrder: (data) =>
    fetch(`${BASE_URL}/orders/create`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "user")),

  getUserOrders: (mobile) =>
    fetch(`${BASE_URL}/orders/user/${mobile}`, { headers: getHeaders("user") }).then((res) => handleResponse(res, "user")),

  getKitchenOrders: (kitchenId) =>
    fetch(`${BASE_URL}/orders/kitchen/${kitchenId}`, { headers: getHeaders("admin") }).then((res) => handleResponse(res, "admin")),

  getAllOrders: () =>
    fetch(`${BASE_URL}/orders/all`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getDeliveryOrders: () =>
    fetch(`${BASE_URL}/orders/delivery/me`, { headers: getHeaders("delivery") }).then((res) => handleResponse(res, "delivery")),

  getDeliveryDashboard: () =>
    fetch(`${BASE_URL}/orders/delivery/dashboard`, { headers: getHeaders("delivery") }).then((res) => handleResponse(res, "delivery")),

  updateOrderStatus: (orderId, status) =>
    fetch(`${BASE_URL}/orders/status/${orderId}`, {
      method: "PATCH",
      headers: getHeaders("admin"),
      body: JSON.stringify({ status }),
    }).then((res) => handleResponse(res, "admin")),

  updateDeliveryStatus: (orderId, status, payload = {}) =>
    fetch(`${BASE_URL}/orders/delivery/status/${orderId}`, {
      method: "PATCH",
      headers: getHeaders("delivery"),
      body: JSON.stringify({ status, ...payload }),
    }).then((res) => handleResponse(res, "delivery")),

  updateDeliveryAvailability: (isOnline) =>
    fetch(`${BASE_URL}/orders/delivery/availability`, {
      method: "PATCH",
      headers: getHeaders("delivery"),
      body: JSON.stringify({ isOnline }),
    }).then((res) => handleResponse(res, "delivery")),

  updateDeliveryLocation: (data) =>
    fetch(`${BASE_URL}/orders/delivery/location`, {
      method: "POST",
      headers: getHeaders("delivery"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "delivery")),

  getOrderStats: () =>
    fetch(`${BASE_URL}/orders/stats`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getOrderTracking: (orderId) =>
    fetch(`${BASE_URL}/orders/${orderId}/tracking`, { headers: getHeaders() }).then(handleResponse),

  // ─────────────────────────────────────────
  // 👑 ADMIN MANAGEMENT
  // ─────────────────────────────────────────
  getAllAdmins: () =>
    fetch(`${BASE_URL}/admin/all`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getDeliveryPartners: () =>
    fetch(`${BASE_URL}/admin/delivery-partners`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getDeliveryPartner: (partnerId) =>
    fetch(`${BASE_URL}/admin/delivery-partners/${partnerId}`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getDeliveryPerformance: () =>
    fetch(`${BASE_URL}/admin/delivery-performance`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getActiveDeliveries: () =>
    fetch(`${BASE_URL}/admin/deliveries`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  getDeliveryHistory: () =>
    fetch(`${BASE_URL}/admin/deliveries/history`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  createAdmin: (data) =>
    fetch(`${BASE_URL}/admin/create`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  createDeliveryPartner: (data) =>
    fetch(`${BASE_URL}/admin/delivery-partners/create`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  updateDeliveryPartner: (partnerId, data) =>
    fetch(`${BASE_URL}/admin/delivery-partners/${partnerId}`, {
      method: "PUT",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  deleteAdmin: (adminId) =>
    fetch(`${BASE_URL}/admin/${adminId}`, {
      method: "DELETE",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  deleteDeliveryPartner: (partnerId) =>
    fetch(`${BASE_URL}/admin/delivery-partners/${partnerId}`, {
      method: "DELETE",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  assignDelivery: (orderId, partnerId) =>
    fetch(`${BASE_URL}/admin/deliveries/${orderId}/assign`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify({ partnerId }),
    }).then((res) => handleResponse(res, "master")),

  reassignDelivery: (orderId, partnerId) =>
    fetch(`${BASE_URL}/admin/deliveries/${orderId}/reassign`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify({ partnerId }),
    }).then((res) => handleResponse(res, "master")),

  updatePartnerStatus: (partnerId, accountStatus) =>
    fetch(`${BASE_URL}/admin/delivery-partners/${partnerId}/status`, {
      method: "PATCH",
      headers: getHeaders("master"),
      body: JSON.stringify({ accountStatus }),
    }).then((res) => handleResponse(res, "master")),

  updatePartnerAvailability: (partnerId, isOnline) =>
    fetch(`${BASE_URL}/admin/delivery-partners/${partnerId}/availability`, {
      method: "PATCH",
      headers: getHeaders("master"),
      body: JSON.stringify({ isOnline }),
    }).then((res) => handleResponse(res, "master")),

  // ─────────────────────────────────────────
  // 🎧 SUPPORT
  // ─────────────────────────────────────────
  createTicket: (data) =>
    fetch(`${BASE_URL}/admin/support/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getTickets: () =>
    fetch(`${BASE_URL}/admin/support`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  resolveTicket: (ticketId) =>
    fetch(`${BASE_URL}/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  // ─────────────────────────────────────────
  // 📊 DASHBOARD STATS
  // ─────────────────────────────────────────
  getDashboardStats: () =>
    fetch(`${BASE_URL}/admin/dashboard-stats`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  // ─────────────────────────────────────────
  // ⭐ RATINGS & REVIEWS
  // ─────────────────────────────────────────
  submitRating: (data) =>
    fetch(`${BASE_URL}/ratings/submit`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "user")),

  getKitchenRatings: (kitchenId) =>
    fetch(`${BASE_URL}/ratings/kitchen/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  checkRating: (orderId) =>
    fetch(`${BASE_URL}/ratings/check/${orderId}`, { headers: getHeaders("user") }).then((res) => handleResponse(res, "user")),

  // ─────────────────────────────────────────
  // 🎟️ COUPONS
  // ─────────────────────────────────────────
  validateCoupon: (code, orderTotal) =>
    fetch(`${BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify({ code, orderTotal }),
    }).then((res) => handleResponse(res, "user")),

  useCoupon: (code) =>
    fetch(`${BASE_URL}/coupons/use`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify({ code }),
    }).then((res) => handleResponse(res, "user")),

  getAllCoupons: () =>
    fetch(`${BASE_URL}/coupons/all`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),

  createCoupon: (data) =>
    fetch(`${BASE_URL}/coupons/create`, {
      method: "POST",
      headers: getHeaders("master"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "master")),

  toggleCoupon: (id) =>
    fetch(`${BASE_URL}/coupons/${id}/toggle`, {
      method: "PATCH",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  deleteCoupon: (id) =>
    fetch(`${BASE_URL}/coupons/${id}`, {
      method: "DELETE",
      headers: getHeaders("master"),
    }).then((res) => handleResponse(res, "master")),

  // ─────────────────────────────────────────
  // 💳 PAYMENTS
  // ─────────────────────────────────────────
  createPaymentOrder: (amount, orderId) =>
    fetch(`${BASE_URL}/payments/create-order`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify({ amount, orderId }),
    }).then((res) => handleResponse(res, "user")),

  verifyPayment: (data) =>
    fetch(`${BASE_URL}/payments/verify`, {
      method: "POST",
      headers: getHeaders("user"),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, "user")),

  // ─────────────────────────────────────────
  // 🔐 SECURITY / 2FA
  // ─────────────────────────────────────────
  requestOtp: (mobile) =>
    fetch(`${BASE_URL}/security/request-otp`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ mobile }),
    }).then(handleResponse),

  verifyOtp: (mobile, otp, name) =>
    fetch(`${BASE_URL}/security/verify-otp`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ mobile, otp, name }),
    }).then(handleResponse),

  getAuditLogs: (limit = 50) =>
    fetch(`${BASE_URL}/security/audit-logs?limit=${limit}`, { headers: getHeaders("master") }).then((res) => handleResponse(res, "master")),
};
