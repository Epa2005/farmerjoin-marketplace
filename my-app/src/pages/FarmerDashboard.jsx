import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import Footer from '../components/Footer';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, monthly: 0, growth: 0 });
  const [weather, setWeather] = useState({ temp: 22, condition: 'Sunny', forecast: [] });
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    initializeWeather();
    initializeNotifications();
  }, []);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(scrollPercent);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || (user?.role !== 'farmer' && user?.role !== 'cooperative')) {
        navigate('/login');
        return;
      }

      // Fetch profile based on user role
      let profileRes;
      if (user.role === 'farmer') {
        profileRes = await API.get('/farmer/profile');
        setFarmerData(profileRes.data);
      } else if (user.role === 'cooperative') {
        profileRes = await API.get('/cooperative/profile');
        setFarmerData(profileRes.data);
      }

      // Fetch products
      const productsRes = await API.get('/products');
      // Filter products by current farmer if we have farmer data
      const farmerProducts = profileRes?.data ? 
        (productsRes.data || []).filter(product => product.farmer_id === profileRes.data.farmer_id) : 
        (productsRes.data || []);
      setProducts(farmerProducts);

      // Fetch orders
      const ordersRes = await API.get('/farmer/orders');
      setOrders(ordersRes.data || []);

      // Calculate earnings
      calculateEarnings(ordersRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (ordersData) => {
    const totalEarnings = ordersData.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const currentMonth = new Date().getMonth();
    const monthlyEarnings = ordersData
      .filter(order => new Date(order.created_at).getMonth() === currentMonth)
      .reduce((sum, order) => sum + (order.total_price || 0), 0);
    
    setEarnings({
      total: totalEarnings,
      monthly: monthlyEarnings,
      growth: Math.floor(Math.random() * 30) + 10 // Mock growth percentage
    });
  };

  const initializeWeather = () => {
    // Mock weather data
    setWeather({
      temp: 22,
      condition: 'Partly Cloudy',
      forecast: [
        { day: 'Mon', temp: 24, condition: 'Sunny' },
        { day: 'Tue', temp: 22, condition: 'Cloudy' },
        { day: 'Wed', temp: 20, condition: 'Rainy' },
        { day: 'Thu', temp: 23, condition: 'Sunny' },
        { day: 'Fri', temp: 25, condition: 'Sunny' }
      ]
    });
  };

  const initializeNotifications = () => {
    // Mock notifications
    setNotifications([
      { id: 1, type: 'order', message: 'New order received!', time: '2 min ago', read: false },
      { id: 2, type: 'stock', message: 'Low stock alert: Tomatoes', time: '1 hour ago', read: false },
      { id: 3, type: 'payment', message: 'Payment received for Order #123', time: '3 hours ago', read: true }
    ]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Advanced Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌾</span>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Farmer Dashboard</h1>
              </div>
              {farmerData && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {farmerData.full_name?.charAt(0) || 'F'}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {farmerData.full_name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div key={notification.id} className={`p-4 border-b border-gray-100 dark:border-gray-700 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'products', label: '📦 Products', icon: '📦' },
              { id: 'orders', label: '🛒 Orders', icon: '🛒' },
              { id: 'earnings', label: '💰 Earnings', icon: '💰' },
              { id: 'profile', label: '👤 Profile', icon: '👤' },
              { id: 'weather', label: '🌤️ Weather', icon: '🌤️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="📦 Total Products" 
                value={products.length} 
                color="emerald"
                trend="+12%"
              />
              <StatCard 
                title="🛒 Total Orders" 
                value={orders.length} 
                color="blue"
                trend="+8%"
              />
              <StatCard 
                title="💰 Total Earnings" 
                value={`$${earnings.total}`} 
                color="green"
                trend={`+${earnings.growth}%`}
              />
              <StatCard 
                title="⏳ Pending Orders" 
                value={orders.filter(o => o.status === 'pending').length} 
                color="yellow"
                trend="2 new"
              />
            </div>

            {/* Weather Widget */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold mb-2">🌤️ Today's Weather</h3>
                  <p className="text-3xl font-bold">{weather.temp}°C</p>
                  <p className="text-lg">{weather.condition}</p>
                  <p className="text-sm mt-2">Perfect for farming! 🌱</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold mb-2">5-Day Forecast</p>
                  <div className="space-y-1">
                    {weather.forecast.map((day, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{day.day}</span>
                        <span>{day.temp}°C {day.condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.order_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order #{order.order_id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.created_at}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${order.total_price || 0}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📦 Product Management</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="grains">Grains</option>
                </select>
                <Link
                  to="/add-product"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ➕ Add Product
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.product_name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{product.product_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{product.category}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-emerald-600">${product.price}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.quantity > 10 ? 'bg-green-100 text-green-800' :
                        product.quantity > 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Stock: {product.quantity}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                        ✏️ Edit
                      </button>
                      <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🛒 Order Management</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.order_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">${order.total_price || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">View</button>
                          <button className="text-green-600 hover:text-green-900">Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Earnings & Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
                <p className="text-3xl font-bold">${earnings.total}</p>
                <p className="text-sm mt-2">All time revenue</p>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Monthly Earnings</h3>
                <p className="text-3xl font-bold">${earnings.monthly}</p>
                <p className="text-sm mt-2">This month</p>
              </div>
              <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Growth Rate</h3>
                <p className="text-3xl font-bold">+{earnings.growth}%</p>
                <p className="text-sm mt-2">vs last month</p>
              </div>
            </div>

            {/* Sales Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Sales Analytics</h3>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">📊 Chart.js integration coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👤 Profile Management</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {farmerData?.full_name?.charAt(0) || 'F'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{farmerData?.full_name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{farmerData?.email}</p>
                  <p className="text-gray-600 dark:text-gray-400">{farmerData?.phone}</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">✅ Verified Farmer</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm Location</label>
                  <input
                    type="text"
                    defaultValue={farmerData?.location}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm Type</label>
                  <input
                    type="text"
                    defaultValue={farmerData?.farm_type}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About Your Farm</label>
                <textarea
                  rows={4}
                  defaultValue={farmerData?.description}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mt-6 flex space-x-4">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  💾 Save Changes
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  🖼️ Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🌤️ Weather & Farming Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Current Weather</h3>
                <div className="text-center">
                  <p className="text-5xl font-bold mb-2">{weather.temp}°C</p>
                  <p className="text-xl mb-4">{weather.condition}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>💨 Wind: 12 km/h</p>
                      <p>💧 Humidity: 65%</p>
                    </div>
                    <div>
                      <p>🌅 Sunrise: 6:00 AM</p>
                      <p>🌇 Sunset: 6:30 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🌱 Farming Tips</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500">✅</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Perfect day for planting vegetables</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500">💧</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Water your crops in the morning for best results</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-500">⚠️</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Expect rain tomorrow - prepare drainage</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-500">🌾</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Good conditions for harvesting grains</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 5-Day Forecast */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-4">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{day.day}</p>
                    <p className="text-2xl mb-2">{day.temp}°C</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{day.condition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, color, trend }) => {
  const colorClasses = {
    emerald: 'from-emerald-400 to-emerald-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
    purple: 'from-purple-400 to-purple-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-xl p-6 text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-right">
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
