import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      
      console.log("Login API Response:", res.data);
      console.log("Response structure:", {
        hasToken: !!res.data?.token,
        hasAccessToken: !!res.data?.access_token,
        hasUser: !!res.data?.user,
        userRole: res.data?.user?.role,
        directUserRole: res.data?.role,
        fullUser: res.data?.user,
        fullResponse: res.data
      });
      
      const token = res.data?.token || res.data?.access_token;
      const user = res.data?.user || res.data;
      
      console.log("Extracted user data:", user);
      console.log("User role:", user?.role);

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Navigate based on role
        let targetRoute = "/dashboard"; // Default to dashboard for farmers and cooperatives
        const userRole = (user.role || "").toLowerCase();
        
        console.log("Navigating to:", targetRoute, "for role:", userRole);
        
        if (userRole === "buyer") targetRoute = "/buyer-dashboard";
        else if (userRole === "farmer") targetRoute = "/dashboard";
        else if (userRole === "cooperative") targetRoute = "/dashboard"; // Cooperatives also use the main dashboard
        else if (userRole === "admin") targetRoute = "/admin-dashboard";
        else targetRoute = "/dashboard"; // Default to dashboard for any farmer-like role
        
        console.log("Final target route:", targetRoute);
        window.location.href = targetRoute;
      } else {
        console.error("Invalid login response - missing token or user");
        setError("Invalid login response");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-primary-400/30 to-teal-400/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-teal-400/30 to-cyan-400/30 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-primary-400/20 rounded-full filter blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">grass</div>
      <div className="absolute top-20 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>seedling</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>herb</div>
      <div className="absolute bottom-10 right-10 text-4xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>leaf</div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          {/* Login Card */}
          <div className="glass p-8 rounded-3xl shadow-2xl animate-slide-up">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow">
                  <span className="text-4xl">grass</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-lg text-gray-600">
                Sign in to your account seedling
              </p>
            </div>
            
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-xl mt-6 flex items-center space-x-2 animate-slide-up">
                <span className="text-xl">warning</span>
                <span>{error}</span>
              </div>
            )}
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@farm.com"
                    className="input-field"
                  />
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>grass</span>
                      <span>Sign in</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-6 pt-6 border-t border-emerald-100">
              <Link 
                to="/register" 
                className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center space-x-1 transition-colors duration-200"
              >
                <span>🌱</span>
                <span>Don't have acount? Register</span>
              </Link>
            </div>
          </div>

          {/* Quick Demo Access */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100">
            <p className="text-center text-sm text-gray-600 mb-2">🧪 Quick Demo Access:</p>
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">Email: lio2005@gmail.com</p>
              <p className="text-xs text-gray-500">Password: epa123?/</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
