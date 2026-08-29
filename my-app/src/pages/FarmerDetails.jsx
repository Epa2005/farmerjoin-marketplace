import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { getProvinces, getDistricts, getSectors } from "../data/rwandaLocations";

function FarmerDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const userId = location.state?.userId;
  const email = location.state?.email;

  const [form, setForm] = useState({
    farm_name: "",
    bio: "",
    farm_type: "",
    province: "",
    district: "",
    sector: "",
    description: ""
  });
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/register");
    }
  }, [userId, navigate]);

  useEffect(() => {
    setDistricts(getDistricts(form.province));
    setForm(prev => ({ ...prev, district: "", sector: "" }));
    setSectors([]);
  }, [form.province]);

  useEffect(() => {
    setSectors(getSectors(form.province, form.district));
    setForm(prev => ({ ...prev, sector: "" }));
  }, [form.district, form.province]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.farm_name.trim()) {
      setError(t('farmNameRequired', 'Farm name is required'));
      return;
    }
    if (!form.province || !form.district || !form.sector) {
      setError(t('locationRequired', 'Please select your province, district, and sector'));
      return;
    }

    setLoading(true);
    try {
      await API.put(`/farmers/${userId}/details`, {
        farm_name: form.farm_name,
        bio: form.bio,
        farm_type: form.farm_type,
        province: form.province,
        district: form.district,
        sector: form.sector,
        description: form.description
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('updateFailed', 'Failed to save farmer details. Please try again.'));
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

      <div className="max-w-lg w-full space-y-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('farmerDetails', 'Farmer Details')}</h2>
            <p className="text-sm sm:text-base text-gray-600">{t('setupFarmProfile', 'Set up your farm profile')}</p>
            {email && <p className="text-xs sm:text-sm text-emerald-600 mt-1">{email}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('profileSavedRedirect', 'Profile saved! Redirecting to login...')}</span>
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

            <div>
              <label htmlFor="farm_name" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('farmName', 'Farm Name')} *</label>
              <input id="farm_name" type="text" placeholder={t('enterFarmName', 'e.g. Green Valley Farm')} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base" value={form.farm_name} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} required />
            </div>

            <div>
              <label htmlFor="farm_type" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('farmType', 'Farm Type')}</label>
              <select id="farm_type" className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-sm sm:text-base" value={form.farm_type} onChange={(e) => setForm({ ...form, farm_type: e.target.value })}>
                <option value="">{t('selectFarmType', 'Select farm type')}</option>
                <option value="Crops">{t('crops', 'Crops')}</option>
                <option value="Livestock">{t('livestock', 'Livestock')}</option>
                <option value="Mixed Farming">{t('mixedFarming', 'Mixed Farming')}</option>
                <option value="Dairy">{t('dairy', 'Dairy')}</option>
                <option value="Poultry">{t('poultry', 'Poultry')}</option>
                <option value="Fish Farming">{t('fishFarming', 'Fish Farming')}</option>
                <option value="Horticulture">{t('horticulture', 'Horticulture')}</option>
                <option value="Coffee/Tea">{t('coffeeTea', 'Coffee/Tea')}</option>
                <option value="Other">{t('other', 'Other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('location', 'Location')} *</label>
              <div className="space-y-3">
                <select className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-sm sm:text-base" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
                  <option value="">{t('selectProvince', 'Select Province')}</option>
                  {getProvinces().map((p) => (
                    <option key={p} value={p}>{p === 'Kigali' ? 'Kigali' : p + ' Province'}</option>
                  ))}
                </select>
                <select className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-sm sm:text-base" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} disabled={!form.province}>
                  <option value="">{t('selectDistrict', 'Select District')}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white text-sm sm:text-base" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} disabled={!form.district}>
                  <option value="">{t('selectSector', 'Select Sector')}</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('bio', 'Bio')}</label>
              <textarea id="bio" placeholder={t('enterBio', 'Tell us about your farm and experience')} rows={3} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{t('farmDescription', 'Farm Description')}</label>
              <textarea id="description" placeholder={t('enterFarmDescription', 'Describe your farm, products, and farming practices')} rows={3} className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <Link to="/login" className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 text-center text-sm sm:text-base">
                {t('skip', 'Skip')}
              </Link>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('saving', 'Saving...')}</span>
                  </span>
                ) : (
                  <span>{t('saveProfile', 'Save Profile')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FarmerDetails;
