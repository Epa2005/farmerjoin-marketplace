import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError(t('fullNameRequired'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError(t('invalidEmail'));
      return;
    }
    if (!form.phone.trim() || form.phone.length < 6) {
      setError(t('invalidPhone'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstError = validationErrors[0]?.msg || 'Validation failed';
        setError(firstError);
      } else if (err.response?.data?.message === "Email already registered") {
        setError(t('emailAlreadyRegistered') || "This email is already registered");
      } else if (err.response?.status === 0) {
        setError(t('networkError') || "Network error: Unable to connect to server. Please check your connection.");
      } else if (err.code === "ECONNREFUSED") {
        setError(t('cannotConnectToServer') || "Cannot connect to server. Please make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || err.message || (t('registrationFailed') || "Registration failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-primary-400/30 to-teal-400/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-teal-400/30 to-cyan-400/30 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-primary-400/20 rounded-full filter blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-600 to-teal-600 rounded-3xl mb-8 shadow-2xl backdrop-blur-sm animate-float">
            <span className="text-4xl">🌾</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">{t('createBuyerAccount') || 'Create Buyer Account'}</h2>
          <p className="text-lg text-gray-600 font-secondary leading-relaxed">{t('joinAsBuyer') || 'Join our agricultural marketplace as a buyer'}</p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-xl text-sm animate-slide-up">
                {t('registrationSuccessRedirecting') || 'Registration successful! Redirecting to login...'}
              </div>
            )}

            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-xl text-sm animate-slide-up">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2 font-ui">{t('fullName') || 'Full Name'}</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder={t('enterFullName') || "Enter your full name"}
                  className="input-field"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 font-ui">{t('emailAddress') || 'Email Address'}</label>
                <input
                  id="email"
                  type="email"
                  placeholder={t('enterEmail') || "Enter your email"}
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 font-ui">{t('phoneNumber') || 'Phone Number'}</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder={t('enterPhoneNumber') || "Enter your phone number"}
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 font-ui">{t('password') || 'Password'}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('enterPassword') || "Enter your password"}
                    className="input-field pr-12"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('registering') || 'Registering...'}
                  </span>
                ) : (
                  <span>{t('createAccount') || 'Create Account'}</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-gray-600">
              {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                {t('signIn') || 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
