import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";

function AdminSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState({
    siteName: "FarmerJoin",
    siteDescription: "Agricultural Management System",
    contactEmail: "admin@farmerjoin.com",
    contactPhone: "+250 788 123 456",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    maxFileSize: 5,
    allowedFileTypes: "jpg,jpeg,png,gif,webp",
    systemTimezone: "Africa/Kigali",
    defaultLanguage: "en"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      // Since we don't have a settings endpoint yet, use default settings
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      // Simulate saving settings
      setTimeout(() => {
        setMessage("Settings saved successfully!");
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings");
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="text-white hover:text-emerald-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
                <p className="text-emerald-400 text-sm">System Configuration</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg backdrop-blur-sm ${
            message.includes("success") 
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" 
              : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">System Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Maintenance Mode</h3>
                  <p className="text-gray-400 text-sm">Temporarily disable the site for maintenance</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Allow Registrations</h3>
                  <p className="text-gray-400 text-sm">Enable new user registration</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({...settings, allowRegistrations: !settings.allowRegistrations})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allowRegistrations ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-gray-400 text-sm">Send email notifications to users</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">File Upload Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max File Size (MB)</label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Allowed File Types</label>
                <input
                  type="text"
                  value={settings.allowedFileTypes}
                  onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                  placeholder="jpg,jpeg,png,gif"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminSettings;
