import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useNewTranslation } from "../hooks/useNewTranslation";
import { useDatabaseTranslation } from "../hooks/useDatabaseTranslation";

function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useNewTranslation();
  const { translateUserRole, formatDate, useTranslatedUsers } = useDatabaseTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  const [farmers, setFarmers] = useState([]);
  const translatedFarmers = useTranslatedUsers(farmers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    cooperative_name: "",
    location: "",
    role: "farmer"
  });
  const [creating, setCreating] = useState(false);

  // ML Question State
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await API.get("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const users = statsResponse.data;
      const farmersCount = users.filter(u => u.role === 'farmer').length;
      const buyersCount = users.filter(u => u.role === 'buyer').length;
      const adminsCount = users.filter(u => u.role === 'admin').length;

      setStats({
        totalUsers: users.length,
        totalFarmers: farmersCount,
        totalBuyers: buyersCount,
        totalProducts: 0, // Will fetch separately
        totalOrders: 0 // Will fetch separately
      });

      // Fetch farmers list
      const farmersResponse = await API.get("/farmers/admin/farmers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmers(farmersResponse.data);

    } catch (err) {
      console.error("Dashboard error:", err);
      setError(t('failedToLoadDashboard'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      let response;
      
      if (createForm.role === "farmer") {
        response = await API.post("/farmers/admin/create-farmer", createForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(`${t('farmerAccountCreated')}\n${t('emailLabel')}: ${createForm.email}\n${t('passwordLabel')}: ${createForm.password}`);
      } else if (createForm.role === "cooperative") {
        response = await API.post("/cooperative/admin/create-cooperative", createForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(`${t('cooperativeAccountCreated')}\n${t('emailLabel')}: ${createForm.email}\n${t('passwordLabel')}: ${createForm.password}`);
      }
      
      // Reset form and close modal
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        cooperative_name: "",
        location: "",
        role: "farmer"
      });
      setShowCreateModal(false);
      
      // Refresh farmers list
      fetchDashboardData();
      
    } catch (err) {
      console.error("Create account error:", err);
      setError(err?.response?.data?.message || t('failedToCreateAccount'));
    } finally {
      setCreating(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setQuestionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/ml/ask-question", 
        { 
          question: question.trim(),
          context: "admin_dashboard",
          language: "en" // Admin dashboard primarily in English
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setResponse(res.data.data.response);
        
        // Show language detection info in console for debugging
        console.log('Admin Dashboard Language Detection:', {
          detected: res.data.data.detectedLanguage,
          responseLanguage: res.data.data.language,
          question: question.trim()
        });
        
        setQuestionHistory(prev => [
          { 
            question: question.trim(), 
            response: res.data.data.response, 
            timestamp: new Date(),
            detectedLanguage: res.data.data.detectedLanguage,
            responseLanguage: res.data.data.language,
            learning: res.data.data.learning
          },
          ...prev
        ]);
        setQuestion("");
      }
    } catch (err) {
      console.error("Error asking question:", err);
      // Fallback response if ML endpoint fails
      if (err.response?.status === 404) {
        setResponse("AI assistant is currently unavailable. Please try again later or contact support.");
      } else {
        setResponse("Sorry, I couldn't process your question. Please try again.");
      }
    } finally {
      setQuestionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboard')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{t('welcomeAdmin')}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('farmers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('buyers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBuyers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('products')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Farmers Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{t('recentFarmers')}</h3>
            
            {farmers.length === 0 ? (
              <p className="text-gray-500">{t('noFarmersFound')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('email')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('phone')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('location')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('joined')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {translatedFarmers.slice(0, 5).map((farmer) => (
                      <tr key={farmer.farmer_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {farmer.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {farmer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {farmer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {farmer.location || t('notSpecified')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {farmer.created_at_formatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ML Question Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Question Input */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Ask AI Assistant</h3>
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ask about system management, analytics, or insights
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., How many users are active? What are the top selling products?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                  disabled={questionLoading}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {question.length}/500 characters
                </div>
              </div>
              <button
                type="submit"
                disabled={questionLoading || !question.trim()}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {questionLoading ? "Processing..." : "Ask Question"}
              </button>
            </form>
          </div>

          {/* Response Display */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 AI Response</h3>
            {response ? (
              <div className="space-y-4">
                {questionHistory.length > 0 && questionHistory[0].detectedLanguage === 'rw' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs font-medium text-green-800">
                        🇷🇼 Kinyarwanda Detected - Responding in Kinyarwanda
                      </span>
                    </div>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800">{response}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleString()}
                  {questionHistory.length > 0 && (
                    <span className="ml-2">
                      • Language: {questionHistory[0].responseLanguage === 'rw' ? '🇷🇼 Kinyarwanda' : '🇺🇸 English'}
                    </span>
                  )}
                  {questionHistory.length > 0 && questionHistory[0].learning && (
                    <span className="ml-2">
                      • Confidence: {Math.round(questionHistory[0].learning.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p>Ask a question to see AI response here</p>
              </div>
            )}
          </div>
        </div>

        {/* Question History */}
        {questionHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Question History</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {questionHistory.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      Q
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{item.question}</p>
                        {item.detectedLanguage === 'rw' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            🇷🇼 Kinyarwanda
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.response}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">{item.timestamp.toLocaleString()}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Language: {item.responseLanguage === 'rw' ? '🇷🇼' : '🇺🇸'}
                          </span>
                          {item.learning && (
                            <span className="text-xs text-gray-500">
                              • {Math.round(item.learning.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('createFarmerAccount')}</h3>
            <p className="text-gray-600 mb-4">{t('createFarmerDescription')}</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t(createForm.role === "cooperative" ? "createCooperative" : "createFarmer")}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('viewAllUsers')}</h3>
            <p className="text-gray-600 mb-4">{t('manageUsersDescription')}</p>
            <button 
              onClick={() => navigate("/user-management")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('manageUsers')}
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('systemSettings')}</h3>
            <p className="text-gray-600 mb-4">{t('systemSettingsDescription')}</p>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {t('settings')}
            </button>
          </div>
        </div>
      </main>

      {/* Create Farmer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t(createForm.role === "cooperative" ? "createCooperativeAccountTitle" : "createFarmerAccountTitle")}
            </h3>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t(createForm.role === "cooperative" ? "enterCooperativeFullName" : "enterFullName")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t(createForm.role === "cooperative" ? "enterCooperativeEmail" : "enterEmail")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('enterPhone')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('enterPassword')}
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cooperativeName')}</label>
                  <input
                    type="text"
                    required
                    value={createForm.cooperative_name}
                    onChange={(e) => setCreateForm({...createForm, cooperative_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('cooperativeOrFarmName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
                  <input
                    type="text"
                    required
                    value={createForm.location}
                    onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={t('districtProvince')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('accountType')}</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="farmer">{t('farmer')}</option>
                    <option value="cooperative">{t('cooperative')}</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError("");
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? t('creating') : t('createAccount')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
