import { Routes, Route } from "react-router-dom";

/* USER PAGES */
import Landing      from "./pages/Landing.jsx";
import Login        from "./pages/Login.jsx";
import Register     from "./pages/Register.jsx";
import Kitchens     from "./pages/Kitchens.jsx";
import Menu         from "./pages/Menu.jsx";
import Cart         from "./pages/Cart.jsx";
import Checkout     from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders       from "./pages/Orders.jsx";

/* KITCHEN ADMIN */
import AdminLogin     from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminMenu      from "./pages/AdminMenu.jsx";
import AdminOrders    from "./pages/AdminOrders.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";

/* MASTER ADMIN */
import MasterAdminLogin     from "./pages/MasterAdminLogin.jsx";
import MasterAdminDashboard from "./pages/MasterAdminDashboard.jsx";
import MasterOrders         from "./pages/MasterOrders.jsx";
import MasterKitchens       from "./pages/MasterKitchens.jsx";
import MasterAnalytics      from "./pages/MasterAnalytics.jsx";
import MasterAdminAdmins    from "./pages/MasterAdminAdmins.jsx";
import MasterSupport        from "./pages/MasterSupport.jsx";

export default function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/"            element={<Landing />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/login/user"  element={<Login />} />
      <Route path="/register"    element={<Register />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/master/login" element={<MasterAdminLogin />} />

      {/* USER */}
      <Route path="/kitchens"      element={<Kitchens />} />
      <Route path="/menu"          element={<Menu />} />
      <Route path="/cart"          element={<Cart />} />
      <Route path="/checkout"      element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/orders"        element={<Orders />} />

      {/* KITCHEN ADMIN */}
      <Route path="/admin"            element={<AdminDashboard />} />
      <Route path="/admin/menu"       element={<AdminMenu />} />
      <Route path="/admin/orders"     element={<AdminOrders />} />
      <Route path="/admin/analytics"  element={<AdminAnalytics />} />

      {/* MASTER ADMIN */}
      <Route path="/master"            element={<MasterAdminDashboard />} />
      <Route path="/master/orders"     element={<MasterOrders />} />
      <Route path="/master/kitchens"   element={<MasterKitchens />} />
      <Route path="/master/analytics"  element={<MasterAnalytics />} />
      <Route path="/master/admins"     element={<MasterAdminAdmins />} />
      <Route path="/master/support"    element={<MasterSupport />} />

      {/* 404 */}
      <Route path="*" element={<h2 style={{ padding: 40 }}>404 — Page not found</h2>} />

    </Routes>
  );
}