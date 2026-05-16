import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  // If no specific role is required, just check if user is authenticated
  if (!role) {
    return children;
  }

  if (user?.role) {
    const userRole = user.role.toLowerCase();
    const requiredRole = role.toLowerCase();
    
    if (userRole !== requiredRole) {
      // Logged in but wrong role - redirect to appropriate dashboard
      if (userRole === "buyer") {
        return <Navigate to="/buyer-dashboard" replace />;
      } else if (userRole === "farmer" || userRole === "cooperative") {
        return <Navigate to="/dashboard" replace />;
      } else if (userRole === "admin") {
        return <Navigate to="/admin-dashboard" replace />;
      } else {
        // Default to dashboard for farmers and cooperatives, otherwise home
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
