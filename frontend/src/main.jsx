import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";
import { UserAuthProvider } from "./context/UserAuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { MasterAuthProvider } from "./context/MasterAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";
import { SupportProvider } from "./context/SupportContext.jsx";

import "./styles/global.css";
import "./styles/Responsive.css" // ✅ Mobile breakpoints

import ErrorBoundary from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <MasterAuthProvider>
            <AdminAuthProvider>
              <UserAuthProvider>
                <CartProvider>
                  <OrderProvider>
                    <SupportProvider>
                      <App />
                    </SupportProvider>
                  </OrderProvider>
                </CartProvider>
              </UserAuthProvider>
            </AdminAuthProvider>
          </MasterAuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);