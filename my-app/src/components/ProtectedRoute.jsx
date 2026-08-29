import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }

  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no specific role is required, just check if user is authenticated
  if (!role) {
    return children;
  }
  // Ensure we have a role; if missing, try to decode from token
  const parseJwt = (t) => {
    try {
      const payload = t.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return null;
    }
  };

  if (!user?.role && token) {
    const payload = parseJwt(token);
    if (payload && payload.role) {
      user.role = payload.role;
    }
  }

  const requiredRoles = Array.isArray(role)
    ? role.map((r) => String(r).toLowerCase())
    : [String(role).toLowerCase()];

  if (user?.role) {
    const userRole = user.role.toLowerCase();

    if (!requiredRoles.includes(userRole)) {
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
