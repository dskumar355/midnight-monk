import { Routes, Route } from "react-router-dom";

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

/* KITCHEN ADMIN */
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminMenu from "./pages/AdminMenu.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";

/* MASTER ADMIN */
import MasterAdminLogin from "./pages/MasterAdminLogin.jsx";
import MasterAdminDashboard from "./pages/MasterAdminDashboard.jsx";
import MasterOrders from "./pages/MasterOrders.jsx";
import MasterKitchens from "./pages/MasterKitchens.jsx";
import MasterAnalytics from "./pages/MasterAnalytics.jsx";
import MasterAdminAdmins from "./pages/MasterAdminAdmins.jsx";
import MasterSupport from "./pages/MasterSupport.jsx";

import PrivateRoute from "./components/PrivateRoute.jsx";

export default function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/user" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/master/login" element={<MasterAdminLogin />} />

      {/* USER */}
      <Route path="/kitchens" element={<PrivateRoute role="user"><Kitchens /></PrivateRoute>} />
      <Route path="/menu" element={<PrivateRoute role="user"><Menu /></PrivateRoute>} />
      <Route path="/cart" element={<PrivateRoute role="user"><Cart /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute role="user"><Checkout /></PrivateRoute>} />
      <Route path="/order-success" element={<PrivateRoute role="user"><OrderSuccess /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute role="user"><Orders /></PrivateRoute>} />

      {/* KITCHEN ADMIN */}
      <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/menu" element={<PrivateRoute role="admin"><AdminMenu /></PrivateRoute>} />
      <Route path="/admin/orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
      <Route path="/admin/analytics" element={<PrivateRoute role="admin"><AdminAnalytics /></PrivateRoute>} />

      {/* MASTER ADMIN */}
      <Route path="/master" element={<PrivateRoute role="master"><MasterAdminDashboard /></PrivateRoute>} />
      <Route path="/master/orders" element={<PrivateRoute role="master"><MasterOrders /></PrivateRoute>} />
      <Route path="/master/kitchens" element={<PrivateRoute role="master"><MasterKitchens /></PrivateRoute>} />
      <Route path="/master/analytics" element={<PrivateRoute role="master"><MasterAnalytics /></PrivateRoute>} />
      <Route path="/master/admins" element={<PrivateRoute role="master"><MasterAdminAdmins /></PrivateRoute>} />
      <Route path="/master/support" element={<PrivateRoute role="master"><MasterSupport /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={<h2 style={{ padding: 40 }}>404 — Page not found</h2>} />

    </Routes>
  );
}