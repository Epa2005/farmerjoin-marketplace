import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Context
import { CartProvider } from "./context/CartContext";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Register from "./pages/Register";
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

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

function App() {
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
                <ProtectedRoute role="buyer">
                  <Checkout />
                </ProtectedRoute>
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

            {/* Product Detail (protected for all authenticated users) */}
            <Route
              path="/products/:productId"
              element={
                <ProtectedRoute>
                  <ProductDetail />
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
