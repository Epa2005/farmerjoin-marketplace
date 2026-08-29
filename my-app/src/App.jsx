import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context
import { CartProvider } from "./context/CartContext";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Register from "./pages/Register";
import FarmerDetails from "./pages/FarmerDetails";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import CooperativeDashboard from "./pages/CooperativeDashboard";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import Orders from "./pages/Orders";
import OrderSuccess from "./pages/OrderSuccess";
import FarmerProfile from "./pages/FarmerProfile";
import SubscriptionBoxes from "./pages/SubscriptionBoxes";
import UserManagement from "./pages/UserManagement";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AIDashboard from "./pages/AIDashboard";
import AgriAI from "./pages/AgriAI";
import EditUserProfile from "./pages/EditUserProfile";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import initRuntimeConfig from './runtimeConfig';
import { setApiBaseUrl } from './api';
import API from "./api";

let runtimeConfigInitialized = false;
let heartbeatStarted = false;

function App() {
  useEffect(() => {
    if (runtimeConfigInitialized) {
      return;
    }
    runtimeConfigInitialized = true;

    // Initialize runtime configuration (if /config.json exists)
    (async () => {
      const cfg = await initRuntimeConfig();
      if (cfg?.API_URL) setApiBaseUrl(cfg.API_URL);
      if (window.__API_URL) setApiBaseUrl(window.__API_URL);
      // If window.__SUPABASE was set, frontend helpers will use it
    })();
  }, []);

  useEffect(() => {
    if (heartbeatStarted) {
      return;
    }
    heartbeatStarted = true;

    let intervalId;
    let timeoutId;

    const sendHeartbeat = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        await API.post("/presence/heartbeat");
      } catch (error) {
        // Presence should never block the user experience.
      }
    };

    // Delay the first heartbeat slightly so initial page bootstrap does not
    // compete with other startup requests in development.
    timeoutId = window.setTimeout(sendHeartbeat, 15000);
    intervalId = window.setInterval(sendHeartbeat, 60000);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
      heartbeatStarted = false;
    };
  }, []);

  const HIDE_CHECKOUT = (import.meta.env.VITE_HIDE_CHECKOUT === 'true' || import.meta.env.VITE_HIDE_CHECKOUT === '1');
  return (
    <CartProvider>
      <Router>
        <Layout>
          <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/register" element={<Register />} />
                <Route path="/farmer-details" element={<FarmerDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/farmer/:farmerId" element={<FarmerProfile />} />
                <Route path="/subscription-boxes" element={<SubscriptionBoxes />} />

                {/* Buyer Dashboard (protected) */}
                <Route
                  path="/buyer-dashboard"
                  element={
                    <ProtectedRoute role="buyer">
                      <BuyerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Dashboard (protected) */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Settings (protected) */}
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />

                {/* Cooperative Dashboard (protected) */}
                <Route
                  path="/cooperative-dashboard"
                  element={
                    <ProtectedRoute role="cooperative">
                      <CooperativeDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Farmer/Cooperative Dashboard (protected for both roles) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* User Management (protected for managers) */}
                <Route
                  path="/user-management"
                  element={
                    <ProtectedRoute role="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Sub Admin Dashboard (protected for sub_admins) */}
                <Route
                  path="/sub-admin-dashboard"
                  element={
                    <ProtectedRoute role="sub_admin">
                      <SubAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* AI Dashboard (protected for authenticated users) */}
                <Route
                  path="/ai-dashboard"
                  element={
                    <ProtectedRoute>
                      <AIDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Edit Product (protected for farmers) */}
                <Route
                  path="/edit-product/:productId"
                  element={
                    <ProtectedRoute role="farmer">
                      <EditProduct />
                    </ProtectedRoute>
                  }
                />

                {/* Add Product (protected for farmers) */}
                <Route
                  path="/add-product"
                  element={
                    <ProtectedRoute role="farmer">
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />

                {/* Orders (protected for buyers) */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute role="buyer">
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                {/* Cart (protected for buyers) */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute role="buyer">
                      <Cart />
                    </ProtectedRoute>
                  }
                />

                {/* Checkout (protected for buyers) */}
                <Route
                  path="/checkout"
                  element={
                    HIDE_CHECKOUT ? (
                      <Navigate to="/" replace />
                    ) : (
                      <ProtectedRoute role="buyer">
                        <Checkout />
                      </ProtectedRoute>
                    )
                  }
                />


                {/* Products (protected for all authenticated users) */}
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  }
                />

                {/* Product Detail (public - visitors can view without login) */}
                <Route path="/products/:productId" element={<ProductDetail />} />

                {/* Agri AI assistant (public) */}
                <Route path="/agri-ai" element={<AgriAI />} />

                {/* Edit User Profile (protected for all authenticated users) */}
                <Route
                  path="/edit-profile"
                  element={
                    <ProtectedRoute>
                      <EditUserProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback: redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* Auth Redirect for direct access */}
                <Route path="/auth-redirect" element={<AuthRedirect />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Layout>
      </Router>
    </CartProvider>
  );
}

export default App;
