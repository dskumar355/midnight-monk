// ✅ Central API service for Midnight Monk
// All backend calls go through here

const BASE_URL = import.meta.env.VITE_API_URL + "/api";

// ─────────────────────────────────────────
// 🔧 HELPER — make authenticated requests
// ─────────────────────────────────────────
const getHeaders = () => {
  const token = localStorage.getItem("mm_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
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
      headers: getHeaders(),
      body: JSON.stringify({ name, mobile }),
    }).then(handleResponse),

  userRegister: (name, mobile, confirmMobile) =>
    fetch(`${BASE_URL}/auth/user-register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, mobile, confirmMobile }),
    }).then(handleResponse),

  // Kitchen Admin
  adminLogin: (username, password) =>
    fetch(`${BASE_URL}/auth/admin-login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    }).then(handleResponse),

  // Master Admin
  masterLogin: (username, password) =>
    fetch(`${BASE_URL}/auth/master-login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    }).then(handleResponse),

  // Update user profile name
  updateProfile: (name) =>
    fetch(`${BASE_URL}/auth/update-profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    }).then(handleResponse),

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
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteKitchen: (kitchenId) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  toggleKitchen: (kitchenId) =>
    fetch(`${BASE_URL}/kitchens/${kitchenId}/toggle`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then(handleResponse),

  // ─────────────────────────────────────────
  // 🍲 MENU
  // ─────────────────────────────────────────
  getMenu: (kitchenId) =>
    fetch(`${BASE_URL}/menu/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  addMenuItem: (data) =>
    fetch(`${BASE_URL}/menu/add`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateMenuItem: (itemId, data) =>
    fetch(`${BASE_URL}/menu/${itemId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteMenuItem: (itemId) =>
    fetch(`${BASE_URL}/menu/delete/${itemId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  toggleMenuItem: (itemId) =>
    fetch(`${BASE_URL}/menu/toggle/${itemId}`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then(handleResponse),

  // ─────────────────────────────────────────
  // 📦 ORDERS
  // ─────────────────────────────────────────
  placeOrder: (data) =>
    fetch(`${BASE_URL}/orders/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getUserOrders: (mobile) =>
    fetch(`${BASE_URL}/orders/user/${mobile}`, { headers: getHeaders() }).then(handleResponse),

  getKitchenOrders: (kitchenId) =>
    fetch(`${BASE_URL}/orders/kitchen/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  getAllOrders: () =>
    fetch(`${BASE_URL}/orders/all`, { headers: getHeaders() }).then(handleResponse),

  updateOrderStatus: (orderId, status) =>
    fetch(`${BASE_URL}/orders/status/${orderId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  getOrderStats: () =>
    fetch(`${BASE_URL}/orders/stats`, { headers: getHeaders() }).then(handleResponse),

  // ─────────────────────────────────────────
  // 👑 ADMIN MANAGEMENT
  // ─────────────────────────────────────────
  getAllAdmins: () =>
    fetch(`${BASE_URL}/admin/all`, { headers: getHeaders() }).then(handleResponse),

  createAdmin: (data) =>
    fetch(`${BASE_URL}/admin/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteAdmin: (adminId) =>
    fetch(`${BASE_URL}/admin/${adminId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

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
    fetch(`${BASE_URL}/admin/support`, { headers: getHeaders() }).then(handleResponse),

  resolveTicket: (ticketId) =>
    fetch(`${BASE_URL}/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then(handleResponse),

  // ─────────────────────────────────────────
  // 📊 DASHBOARD STATS
  // ─────────────────────────────────────────
  getDashboardStats: () =>
    fetch(`${BASE_URL}/admin/dashboard-stats`, { headers: getHeaders() }).then(handleResponse),

  // ─────────────────────────────────────────
  // ⭐ RATINGS & REVIEWS
  // ─────────────────────────────────────────
  submitRating: (data) =>
    fetch(`${BASE_URL}/ratings/submit`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getKitchenRatings: (kitchenId) =>
    fetch(`${BASE_URL}/ratings/kitchen/${kitchenId}`, { headers: getHeaders() }).then(handleResponse),

  checkRating: (orderId) =>
    fetch(`${BASE_URL}/ratings/check/${orderId}`, { headers: getHeaders() }).then(handleResponse),

  // ─────────────────────────────────────────
  // 🎟️ COUPONS
  // ─────────────────────────────────────────
  validateCoupon: (code, orderTotal) =>
    fetch(`${BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code, orderTotal }),
    }).then(handleResponse),

  useCoupon: (code) =>
    fetch(`${BASE_URL}/coupons/use`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code }),
    }).then(handleResponse),

  getAllCoupons: () =>
    fetch(`${BASE_URL}/coupons/all`, { headers: getHeaders() }).then(handleResponse),

  createCoupon: (data) =>
    fetch(`${BASE_URL}/coupons/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  toggleCoupon: (id) =>
    fetch(`${BASE_URL}/coupons/${id}/toggle`, {
      method: "PATCH",
      headers: getHeaders(),
    }).then(handleResponse),

  deleteCoupon: (id) =>
    fetch(`${BASE_URL}/coupons/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  // ─────────────────────────────────────────
  // 💳 PAYMENTS
  // ─────────────────────────────────────────
  createPaymentOrder: (amount, orderId) =>
    fetch(`${BASE_URL}/payments/create-order`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount, orderId }),
    }).then(handleResponse),

  verifyPayment: (data) =>
    fetch(`${BASE_URL}/payments/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

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
    fetch(`${BASE_URL}/security/audit-logs?limit=${limit}`, { headers: getHeaders() }).then(handleResponse),
};