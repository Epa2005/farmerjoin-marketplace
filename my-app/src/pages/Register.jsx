import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function Register() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useTranslation();
  const countryCodes = [
    { code: "+250", label: "Rwanda (+250)" },
    { code: "+254", label: "Kenya (+254)" },
    { code: "+255", label: "Tanzania (+255)" },
    { code: "+256", label: "Uganda (+256)" },
    { code: "+257", label: "Burundi (+257)" },
    { code: "+251", label: "Ethiopia (+251)" },
    { code: "+1", label: "USA/Canada (+1)" },
    { code: "+33", label: "France (+33)" }
  ];

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    country_code: "+250",
    phone_number: "",
    password: "",
    role: "buyer"
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
    const localPhone = form.phone_number.replace(/\D/g, "");
    const fullPhone = `${form.country_code}${localPhone}`;

    if (!form.full_name.trim()) {
      setError(t('fullNameRequired'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError(t('invalidEmail'));
      return;
    }
    if (localPhone.length < 6 || !/^\+?[1-9]\d{7,14}$/.test(fullPhone)) {
      setError(t('invalidPhone'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: fullPhone,
        password: form.password,
        role: form.role
      };

      if (form.role === "farmer") {
        const res = await API.post("/auth/register", payload);
        setSuccess(true);
        setTimeout(() => {
          navigate("/farmer-details", { state: { userId: res.data.user_id, email: form.email } });
        }, 1500);
      } else {
        payload.role = "buyer";
        const res = await API.post("/auth/register", payload);
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstError = validationErrors[0]?.msg || 'Validation failed';
        setError(firstError);
      } else if (err.response?.data?.alreadyExists) {
        const isPhone = String(err.response?.data?.message || '').toLowerCase().includes('phone');
        setError(isPhone
          ? (t('phoneAlreadyRegistered') || 'This phone number is already registered. Try signing in instead.')
          : (t('emailAlreadyRegistered') || 'This email is already registered. Try signing in instead.'));
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/20 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('createAccount', 'Create Account')}</h2>
            <p className="text-sm sm:text-base text-gray-600">{t('joinMarketplace', 'Join our agricultural marketplace')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{form.role === 'farmer' ? (t('accountCreatedRedirect', 'Account created! Setting up your farmer profile...')) : (t('registrationSuccessRedirecting', 'Registration successful! Redirecting to login...'))}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">{t('accountType', 'I want to join as')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center justify-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${form.role === 'buyer' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="radio" name="role" value="buyer" checked={form.role === 'buyer'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="sr-only" />
                    <div className="text-center">
                      <svg className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 ${form.role === 'buyer' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className={`text-sm font-semibold ${form.role === 'buyer' ? 'text-emerald-700' : 'text-gray-600'}`}>{t('buyer', 'Buyer')}</span>
                    </div>
                  </label>
                  <label className={`relative flex items-center justify-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${form.role === 'farmer' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="radio" name="role" value="farmer" checked={form.role === 'farmer'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="sr-only" />
                    <div className="text-center">
                      <svg className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 ${form.role === 'farmer' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      <span className={`text-sm font-semibold ${form.role === 'farmer' ? 'text-emerald-700' : 'text-gray-600'}`}>{t('farmer', 'Farmer')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('fullName', 'Full Name')}</label>
                <input id="full_name" type="text" placeholder={t('enterFullName', 'Enter your full name')} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('emailAddress', 'Email Address')}</label>
                <input id="email" type="email" placeholder={t('enterEmail') || "Enter your email"} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('phoneNumber', 'Phone Number')}</label>
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-2 sm:gap-3">
                  <select id="country_code" className="w-full px-2 sm:px-3 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-sm sm:text-base" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })}>
                    {countryCodes.map((country) => (
                      <option key={country.code} value={country.code}>{country.label}</option>
                    ))}
                  </select>
                  <input id="phone" type="tel" inputMode="numeric" placeholder={t('enterPhoneNumber') || "Enter your phone number"} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/[^\d]/g, '') })} required />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('password', 'Password')}</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} placeholder={t('enterPassword', 'Enter your password')} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12 text-sm sm:text-base" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors">
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

            <div>
              <button type="submit" disabled={loading} className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('registering', 'Registering...')}</span>
                  </span>
                ) : (
                  <span>{form.role === 'farmer' ? (t('registerAsFarmer', 'Register as Farmer')) : (t('createAccount', 'Create Account'))}</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {t('alreadyHaveAccount', 'Already have an account?')}{' '}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
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
