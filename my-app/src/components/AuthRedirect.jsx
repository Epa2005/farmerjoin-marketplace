import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    console.log("AuthRedirect - Checking authentication:");
    console.log("Token exists:", !!token);
    console.log("User data:", user);
    console.log("User role:", user?.role);

    if (token && user) {
      // User is logged in, redirect to appropriate dashboard
      const userRole = (user.role || "").toLowerCase();
      
      console.log("User role (lowercase):", userRole);
      
      if (userRole === "buyer") {
        console.log("Redirecting to buyer dashboard");
        navigate("/buyer-dashboard");
      } else if (userRole === "farmer") {
        console.log("Redirecting to farmer dashboard");
        navigate("/dashboard");
      } else if (userRole === "cooperative") {
        console.log("Redirecting to cooperative dashboard");
        navigate("/cooperative-dashboard");
      } else if (userRole === "admin") {
        console.log("Redirecting to admin dashboard");
        navigate("/admin-dashboard");
      } else {
        // Default to dashboard for farmers, otherwise home
        console.log("Unknown role, defaulting to farmer dashboard");
        navigate("/dashboard");
      }
    } else {
      // User is not logged in, redirect to home
      console.log("User not authenticated, redirecting to home");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div>
    </div>
  );
};

export default AuthRedirect;
