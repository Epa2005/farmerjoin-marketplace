import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";

function Login() {
  const { t, language, changeLanguage } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      let user = res.data?.user || (res.data && typeof res.data === 'object' ? res.data : null);

      console.log("Extracted user data:", user);
      console.log("User role:", user?.role);

      // If backend returns token but not user role, decode JWT to extract role
      const parseJwt = (t) => {
        try {
          const payload = t.split('.')[1];
          const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
          return decoded;
        } catch (e) {
          return null;
        }
      };

      if (token) {
        if (!user || !user.role) {
          const payload = parseJwt(token);
          if (payload) {
            user = user || {};
            if (!user.user_id && payload.user_id) user.user_id = payload.user_id;
            if (!user.role && payload.role) user.role = payload.role;
            if (!user.email && payload.email) user.email = payload.email;
          }
        }
      }

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
        else if (userRole === "sub_admin") targetRoute = "/sub-admin-dashboard";
        else if (userRole === "admin") targetRoute = "/admin-dashboard";
        else targetRoute = "/dashboard"; // Default to dashboard for any farmer-like role

        console.log("Final target route:", targetRoute);
        navigate(targetRoute, { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/20 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full space-y-8">
          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {t('welcomeBack', 'Welcome Back')}
              </h2>
              <p className="text-gray-600">
                {t('signInToAccount', 'Sign in to your account')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress', 'Email Address')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@farm.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password', 'Password')}</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('enterPassword', 'Enter your password')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('signingIn', 'Signing in...')}</span>
                    </span>
                  ) : (
                    <span>{t('signIn', 'Sign In')}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {t('dontHaveAccount', "Don't have an account?")}{' '}
                <Link
                  to="/register"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200"
                >
                  {t('register', 'Register')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
