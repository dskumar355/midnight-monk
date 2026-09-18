import { Navigate, Routes, Route } from "react-router-dom";

/* USER PAGES */
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Kitchens from "./pages/Kitchens.jsx";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import CollectionsPage from "./pages/CollectionsPage.jsx";
import HowItWorksPage from "./pages/HowItWorksPage.jsx";
import NotFound from "./pages/NotFound.jsx";

/* KITCHEN ADMIN */
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminMenu from "./pages/AdminMenu.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";

/* MASTER ADMIN */
import MasterAdminLogin from "./pages/MasterAdminLogin.jsx";
import DeliveryPartnerLogin from "./pages/DeliveryPartnerLogin.jsx";
import DeliveryPartnerDashboard from "./pages/DeliveryPartnerDashboard.jsx";
import MasterAdminDashboard from "./pages/MasterAdminDashboard.jsx";
import MasterOrders from "./pages/MasterOrders.jsx";
import MasterKitchens from "./pages/MasterKitchens.jsx";
import MasterAnalytics from "./pages/MasterAnalytics.jsx";
import MasterAdminAdmins from "./pages/MasterAdminAdmins.jsx";
import MasterSupport from "./pages/MasterSupport.jsx";
import MasterCoupons from "./pages/MasterCoupons.jsx";
import MasterAuditLogs from "./pages/MasterAuditLogs.jsx";
import MasterDeliveryPartners from "./pages/MasterDeliveryPartners.jsx";
import MasterActiveDeliveries from "./pages/MasterActiveDeliveries.jsx";
import MasterDeliveryHistory from "./pages/MasterDeliveryHistory.jsx";

import PrivateRoute from "./components/PrivateRoute.jsx";

export default function App() {
  return (
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
  );
}
