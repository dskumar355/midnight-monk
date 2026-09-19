import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";

/* USER PAGES - LAZY LOADED */
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Kitchens = lazy(() => import("./pages/Kitchens.jsx"));
const Menu = lazy(() => import("./pages/Menu.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.jsx"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage.jsx"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

/* KITCHEN ADMIN - LAZY LOADED */
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminMenu = lazy(() => import("./pages/AdminMenu.jsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.jsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.jsx"));

/* MASTER ADMIN - LAZY LOADED */
const MasterAdminLogin = lazy(() => import("./pages/MasterAdminLogin.jsx"));
const MasterAdminDashboard = lazy(() => import("./pages/MasterAdminDashboard.jsx"));
const MasterOrders = lazy(() => import("./pages/MasterOrders.jsx"));
const MasterKitchens = lazy(() => import("./pages/MasterKitchens.jsx"));
const MasterAnalytics = lazy(() => import("./pages/MasterAnalytics.jsx"));
const MasterAdminAdmins = lazy(() => import("./pages/MasterAdminAdmins.jsx"));
const MasterSupport = lazy(() => import("./pages/MasterSupport.jsx"));
const MasterCoupons = lazy(() => import("./pages/MasterCoupons.jsx"));
const MasterAuditLogs = lazy(() => import("./pages/MasterAuditLogs.jsx"));
const MasterDeliveryPartners = lazy(() => import("./pages/MasterDeliveryPartners.jsx"));
const MasterActiveDeliveries = lazy(() => import("./pages/MasterActiveDeliveries.jsx"));
const MasterDeliveryHistory = lazy(() => import("./pages/MasterDeliveryHistory.jsx"));

/* DELIVERY PARTNER - LAZY LOADED */
const DeliveryPartnerLogin = lazy(() => import("./pages/DeliveryPartnerLogin.jsx"));
const DeliveryPartnerDashboard = lazy(() => import("./pages/DeliveryPartnerDashboard.jsx"));

const PageLoader = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a12",
    color: "#F5A623",
    fontFamily: "'Segoe UI', sans-serif"
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>🌙</div>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px" }}>MIDNIGHT MONK</div>
    </div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/flow" replace />} />
        <Route path="/flow" element={<Landing />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/user" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/delivery/login" element={<DeliveryPartnerLogin />} />

        {/* DEDICATED SEPARATE ADMIN LOGIN ROUTES */}
        <Route path="/kitchen-admin/login" element={<AdminLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/master-admin/login" element={<MasterAdminLogin />} />
        <Route path="/master/login" element={<MasterAdminLogin />} />

        {/* USER */}
        <Route path="/kitchens" element={<Kitchens />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<PrivateRoute role="user"><Checkout /></PrivateRoute>} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<PrivateRoute role="user"><Orders /></PrivateRoute>} />
        <Route path="/track-order/:orderId" element={<TrackOrder />} />
        <Route path="/profile" element={<PrivateRoute role="user"><Profile /></PrivateRoute>} />

        {/* KITCHEN ADMIN PORTAL */}
        <Route path="/kitchen-admin" element={<Navigate to="/kitchen-admin/dashboard" replace />} />
        <Route path="/kitchen-admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/kitchen-admin/menu" element={<PrivateRoute role="admin"><AdminMenu /></PrivateRoute>} />
        <Route path="/kitchen-admin/orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
        <Route path="/kitchen-admin/analytics" element={<PrivateRoute role="admin"><AdminAnalytics /></PrivateRoute>} />

        {/* Legacy /admin aliases */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/menu" element={<PrivateRoute role="admin"><AdminMenu /></PrivateRoute>} />
        <Route path="/admin/orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
        <Route path="/admin/analytics" element={<PrivateRoute role="admin"><AdminAnalytics /></PrivateRoute>} />

        {/* MASTER ADMIN PORTAL */}
        <Route path="/master-admin" element={<Navigate to="/master-admin/dashboard" replace />} />
        <Route path="/master-admin/dashboard" element={<PrivateRoute role="master"><MasterAdminDashboard /></PrivateRoute>} />
        <Route path="/master-admin/orders" element={<PrivateRoute role="master"><MasterOrders /></PrivateRoute>} />
        <Route path="/master-admin/kitchens" element={<PrivateRoute role="master"><MasterKitchens /></PrivateRoute>} />
        <Route path="/master-admin/analytics" element={<PrivateRoute role="master"><MasterAnalytics /></PrivateRoute>} />
        <Route path="/master-admin/admins" element={<PrivateRoute role="master"><MasterAdminAdmins /></PrivateRoute>} />
        <Route path="/master-admin/support" element={<PrivateRoute role="master"><MasterSupport /></PrivateRoute>} />
        <Route path="/master-admin/coupons" element={<PrivateRoute role="master"><MasterCoupons /></PrivateRoute>} />
        <Route path="/master-admin/audit" element={<PrivateRoute role="master"><MasterAuditLogs /></PrivateRoute>} />
        <Route path="/master-admin/delivery-partners" element={<PrivateRoute role="master"><MasterDeliveryPartners /></PrivateRoute>} />
        <Route path="/master-admin/active-deliveries" element={<PrivateRoute role="master"><MasterActiveDeliveries /></PrivateRoute>} />
        <Route path="/master-admin/delivery-history" element={<PrivateRoute role="master"><MasterDeliveryHistory /></PrivateRoute>} />

        {/* Legacy /master aliases */}
        <Route path="/master" element={<PrivateRoute role="master"><MasterAdminDashboard /></PrivateRoute>} />
        <Route path="/master/dashboard" element={<PrivateRoute role="master"><MasterAdminDashboard /></PrivateRoute>} />
        <Route path="/master/orders" element={<PrivateRoute role="master"><MasterOrders /></PrivateRoute>} />
        <Route path="/master/kitchens" element={<PrivateRoute role="master"><MasterKitchens /></PrivateRoute>} />
        <Route path="/master/analytics" element={<PrivateRoute role="master"><MasterAnalytics /></PrivateRoute>} />
        <Route path="/master/admins" element={<PrivateRoute role="master"><MasterAdminAdmins /></PrivateRoute>} />
        <Route path="/master/support" element={<PrivateRoute role="master"><MasterSupport /></PrivateRoute>} />
        <Route path="/master/coupons" element={<PrivateRoute role="master"><MasterCoupons /></PrivateRoute>} />
        <Route path="/master/audit" element={<PrivateRoute role="master"><MasterAuditLogs /></PrivateRoute>} />
        <Route path="/master/delivery-partners" element={<PrivateRoute role="master"><MasterDeliveryPartners /></PrivateRoute>} />
        <Route path="/master/active-deliveries" element={<PrivateRoute role="master"><MasterActiveDeliveries /></PrivateRoute>} />
        <Route path="/master/delivery-history" element={<PrivateRoute role="master"><MasterDeliveryHistory /></PrivateRoute>} />

        {/* DELIVERY PARTNER */}
        <Route path="/delivery" element={<PrivateRoute role="delivery"><DeliveryPartnerDashboard /></PrivateRoute>} />
        <Route path="/delivery/dashboard" element={<PrivateRoute role="delivery"><DeliveryPartnerDashboard /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}
