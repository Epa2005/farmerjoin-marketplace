import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useDatabaseTranslation } from "../hooks/useDatabaseTranslation";

function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    province: "",
    district: "",
    sector: "",
    cell: "",
    role: "farmer"
  });
  const [creating, setCreating] = useState(false);


  // Order Management State
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

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
      setStats(statsResponse.data);

      // Fetch farmers
      const farmersResponse = await API.get("/admin/farmers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmers(farmersResponse.data.farmers || []);

      // Fetch orders
      try {
        const token = localStorage.getItem("token");
        const ordersResponse = await API.get("/admin/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(ordersResponse.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      let response;
      
      // Create structured location data for backend
      const formData = {
        ...createForm,
        location: createForm.province && createForm.district && createForm.sector 
          ? `${createForm.province},${createForm.district},${createForm.sector}${createForm.cell ? ',' + createForm.cell : ''}`
          : createForm.location
      };
      
      if (createForm.role === "farmer") {
        response = await API.post("/farmers/admin/create-farmer", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await API.post("/cooperative/admin/create-cooperative", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data) {
        setShowCreateModal(false);
        setCreateForm({
          full_name: "",
          email: "",
          phone: "",
          password: "",
          cooperative_name: "",
          location: "",
          province: "",
          district: "",
          sector: "",
          cell: "",
          role: "farmer"
        });
        // Refresh farmers list
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Create account error:", err);
      setError(err?.response?.data?.message || "Failed to create account");
    } finally {
      setCreating(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('farmerJoinAdmin')}</h1>
                <p className="text-emerald-400 text-sm">{t('agriculturalManagementSystem')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/settings')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/20"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('settings')}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
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

        {/* Modern Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
          {['overview', 'orders', 'farmers', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{t('welcomeToFarmerJoinAdmin')}</h2>
                  <p className="text-emerald-100 text-lg">{t('manageMarketplaceEase')}</p>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <p className="text-sm text-emerald-100">{t('systemStatus')}</p>
                      <p className="text-lg font-semibold">{t('online')}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <p className="text-sm text-emerald-100">{t('lastUpdated')}</p>
                      <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="bg-blue-500/20 rounded-full px-2 py-1">
                    <span className="text-blue-300 text-xs font-medium">+12%</span>
                  </div>
                </div>
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-1">Total Users</p>
                  <p className="text-4xl font-bold text-white mb-2">{stats.totalUsers}</p>
                  <p className="text-blue-400 text-xs">Active accounts</p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="bg-emerald-500/20 rounded-full px-2 py-1">
                    <span className="text-emerald-300 text-xs font-medium">+8%</span>
                  </div>
                </div>
                <div>
                  <p className="text-emerald-300 text-sm font-medium mb-1">Farmers</p>
                  <p className="text-4xl font-bold text-white mb-2">{stats.totalFarmers}</p>
                  <p className="text-emerald-400 text-xs">Registered farmers</p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="bg-purple-500/20 rounded-full px-2 py-1">
                    <span className="text-purple-300 text-xs font-medium">+15%</span>
                  </div>
                </div>
                <div>
                  <p className="text-purple-300 text-sm font-medium mb-1">Buyers</p>
                  <p className="text-4xl font-bold text-white mb-2">{stats.totalBuyers}</p>
                  <p className="text-purple-400 text-xs">Active buyers</p>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="bg-orange-500/20 rounded-full px-2 py-1">
                    <span className="text-orange-300 text-xs font-medium">+23%</span>
                  </div>
                </div>
                <div>
                  <p className="text-orange-300 text-sm font-medium mb-1">Products</p>
                  <p className="text-4xl font-bold text-white mb-2">{stats.totalProducts}</p>
                  <p className="text-orange-400 text-xs">{t('listedProducts')}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 backdrop-blur-md rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t('quickActions')}</h3>
                  <div className="w-10 h-10 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-indigo-500/30"
                  >
                    {t('createNewFarmer')}
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-indigo-500/30"
                  >
                    {t('viewRecentOrders')}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-md rounded-xl p-6 border border-pink-500/30 hover:border-pink-400/50 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t('recentActivity')}</h3>
                  <div className="w-10 h-10 bg-pink-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-pink-300">{t('newFarmersToday')}</span>
                    <span className="text-white font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-pink-300">{t('ordersPending')}</span>
                    <span className="text-white font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-pink-300">{t('productsListed')}</span>
                    <span className="text-white font-medium">47</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 backdrop-blur-md rounded-xl p-6 border border-teal-500/30 hover:border-teal-400/50 transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t('systemHealth')}</h3>
                  <div className="w-10 h-10 bg-teal-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-teal-300">{t('apiStatus')}</span>
                    <span className="text-teal-400 font-medium">{t('healthy')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-teal-300">{t('database')}</span>
                    <span className="text-teal-400 font-medium">{t('connected')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-teal-300">{t('uptime')}</span>
                    <span className="text-teal-400 font-medium">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="px-6 py-4">
              <h3 className="text-xl font-semibold text-white mb-4">Order Management</h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Buyer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                    {orders.map((order, index) => (
                        <tr key={`${order.order_id}-${index}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            #{order.order_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div>
                              <div className="font-medium text-white">{order.buyer_name}</div>
                              <div className="text-gray-400 text-xs">{order.buyer_email}</div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div>
                            <div className="font-medium text-white">{order.farmer_name}</div>
                            <div className="text-gray-400 text-xs">{order.farmer_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ${order.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.order_status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            order.order_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Farmers Tab */}
        {activeTab === 'farmers' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">{t('farmersManagement')}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t('manageRegisterNewFarmers')}</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('createFarmerAccount')}
                </button>
              </div>
              {farmers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <p className="text-gray-400">{t('noFarmersFound')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{t('name')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{t('email')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{t('phone')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{t('location')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{t('joined')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                    {translatedFarmers.slice(0, 5).map((farmer) => (
                      <tr key={farmer.farmer_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {farmer.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {farmer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {farmer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {farmer.province && farmer.district && farmer.sector 
                            ? `${farmer.province}, ${farmer.district}, ${farmer.sector}${farmer.cell ? ', ' + farmer.cell : ''}`
                            : farmer.location || t('notSpecified')
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
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
           )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
            <div className="px-6 py-4">
              <h3 className="text-xl font-semibold text-white mb-4">{t('usersManagement')}</h3>
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1" />
                  </svg>
                </div>
                <p className="text-gray-400">{t('userManagementAvailable')}</p>
                <button 
                  onClick={() => navigate("/user-management")}
                  className="mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
                >
                  {t('goToUserManagement')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Farmer Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {createForm.role === 'farmer' ? t('createFarmerAccount') : t('createCooperativeAccount')}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Credential Checklist */}
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-emerald-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('requiredCredentials')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.role ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('accountType')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.full_name ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('fullName')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.email ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('email')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.phone ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('phone')}</span>
                  </div>
                  {createForm.role === 'cooperative' && (
                    <div className="flex items-center text-xs">
                      <div className={`w-3 h-3 rounded-full mr-2 ${createForm.cooperative_name ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      <span className="text-gray-600 dark:text-gray-400">{t('cooperativeName')}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.province ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('province')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.district ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('district')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.sector ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('sector')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.cell ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('cell')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-3 h-3 rounded-full mr-2 ${createForm.password ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-600 dark:text-gray-400">{t('password')}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t('completionStatus')}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {(() => {
                        let filled = 0;
                        let total = 9;
                        if (createForm.role) filled++;
                        if (createForm.full_name) filled++;
                        if (createForm.email) filled++;
                        if (createForm.phone) filled++;
                        if (createForm.province) filled++;
                        if (createForm.district) filled++;
                        if (createForm.sector) filled++;
                        if (createForm.cell) filled++;
                        if (createForm.password) filled++;
                        if (createForm.role === 'cooperative') {
                          total = 10;
                          if (createForm.cooperative_name) filled++;
                        }
                        return `${Math.round((filled / total) * 100)}%`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('accountType')}
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="farmer">{t('farmer')}</option>
                    <option value="cooperative">{t('cooperative')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    placeholder={t('enterFullName')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    placeholder={t('enterEmail')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder={t('enterPhone')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {createForm.role === 'cooperative' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('cooperativeName')}
                    </label>
                    <input
                      type="text"
                      value={createForm.cooperative_name}
                      onChange={(e) => setCreateForm({...createForm, cooperative_name: e.target.value})}
                      placeholder={t('enterCooperativeName')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('province')}
                  </label>
                  <input
                    type="text"
                    value={createForm.province}
                    onChange={(e) => setCreateForm({...createForm, province: e.target.value})}
                    placeholder={t('enterProvince')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('district')}
                  </label>
                  <input
                    type="text"
                    value={createForm.district}
                    onChange={(e) => setCreateForm({...createForm, district: e.target.value})}
                    placeholder={t('enterDistrict')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('sector')}
                  </label>
                  <input
                    type="text"
                    value={createForm.sector}
                    onChange={(e) => setCreateForm({...createForm, sector: e.target.value})}
                    placeholder={t('enterSector')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cell')}
                  </label>
                  <input
                    type="text"
                    value={createForm.cell}
                    onChange={(e) => setCreateForm({...createForm, cell: e.target.value})}
                    placeholder={t('enterCell')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('password')}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      placeholder={t('enterPassword')}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setCreateForm({...createForm, password: generatePassword()})}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {t('generate')}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? t('creating') : t('createAccount')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
