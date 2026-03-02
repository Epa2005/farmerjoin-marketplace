import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Logged in but wrong role - redirect to appropriate dashboard
    if (user.role === "buyer") {
      return <Navigate to="/buyer-dashboard" replace />;
    } else if (user.role === "farmer" || user.role === "cooperative") {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
