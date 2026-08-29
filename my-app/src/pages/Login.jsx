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
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email: email.trim(), password });

      const token = res.data?.token || res.data?.access_token;
      let user = res.data?.user || (res.data && typeof res.data === 'object' ? res.data : null);

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
        try {
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: user }));
        } catch (e) { }

        let targetRoute = "/dashboard";
        const userRole = (user.role || "").toLowerCase();
        if (userRole === "buyer") targetRoute = "/buyer-dashboard";
        else if (userRole === "farmer") targetRoute = "/dashboard";
        else if (userRole === "cooperative") targetRoute = "/dashboard";
        else if (userRole === "sub_admin") targetRoute = "/sub-admin-dashboard";
        else if (userRole === "admin") targetRoute = "/admin-dashboard";
        else targetRoute = "/dashboard";

        navigate(targetRoute, { replace: true });
      } else {
        console.error("Invalid login response - missing token or user");
        setError("Invalid login response");
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const byField = {};
        err.response.data.errors.forEach((validationError) => {
          const field = validationError.field || validationError.param;
          if (field) byField[field] = validationError.msg || validationError.message;
        });
        if (Object.keys(byField).length > 0) {
          setFieldErrors(byField);
          setError(t('fixFields', 'Please fix the highlighted fields.'));
        } else {
          setError(err.response?.data?.message || "Login failed");
        }
      } else if (err.response?.status === 401) {
        setFieldErrors({});
        setError("Invalid email or password");
      } else if (err.response?.status === 0) {
        setError(t('networkError') || "Network error: Unable to connect to server. Please check your connection.");
      } else {
        setFieldErrors({});
        setError(err.response?.data?.message || err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm sm:text-base ${
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/20 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {t('welcomeBack', 'Welcome Back')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {t('signInToAccount', 'Sign in to your account')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('emailAddress', 'Email Address')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="farmer@farm.com"
                    autoComplete="email"
                    className={inputClass(fieldErrors.email)}
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('password', 'Password')}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder={t('enterPassword', 'Enter your password')}
                    autoComplete="current-password"
                    className={inputClass(fieldErrors.password)}
                  />
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end -mt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                >
                  {t('forgotPassword', 'Forgot password?')}
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

            <div className="text-center mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
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
