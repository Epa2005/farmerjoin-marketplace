import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useTranslation } from '../hooks/useTranslation';

const FarmerDashboard = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerData, setFarmerData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProduct, setPriceProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const wsRef = useRef(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
      window.location.href = '/login';
      return;
    }

    // Allow both farmers and cooperatives to access this dashboard
    if (user.role !== 'farmer' && user.role !== 'cooperative') {
      // Redirect to appropriate dashboard for other roles
      if (user.role === "buyer") {
        window.location.href = '/buyer-dashboard';
      } else if (user.role === "admin") {
        window.location.href = '/admin-dashboard';
      } else {
        window.location.href = '/login';
      }
      return;
    }

    // Fetch farmer data
    fetchFarmerData(token);
    fetchProducts(token);
    fetchOrders(token);
    fetchNotifications(token);
    
    // Setup WebSocket for real-time notifications
    setupWebSocket(token);

    // Ensure loading state is set to false after initial data fetch attempts
    Promise.all([
      fetchFarmerData(token),
      fetchProducts(token),
      fetchOrders(token),
      fetchNotifications(token)
    ]).catch(() => {
      // Even if some requests fail, ensure loading is set to false
      setLoading(false);
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchFarmerData = async (token) => {
    try {
      const res = await API.get('/farmer/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmerData(res.data);
    } catch (err) {
      console.error('Error fetching farmer data:', err);
      // Set farmerData from localStorage as fallback
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        setFarmerData({
          full_name: user.full_name,
          email: user.email,
          created_at: user.created_at || new Date().toISOString()
        });
      }
    }
  };

  const fetchProducts = async (token) => {
    try {
      const res = await API.get('/farmer/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (token) => {
    try {
      const res = await API.get('/farmer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchNotifications = async (token) => {
    try {
      const res = await API.get('/farmer/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsData = res.data.notifications || res.data || [];
      setNotifications(notificationsData);
      setUnreadCount(notificationsData?.filter(n => !n.read).length || notificationsData.length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const setupWebSocket = (token) => {
    // WebSocket setup for real-time notifications
    const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };
    
    wsRef.current = ws;
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await API.put(`/farmer/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await API.put('/farmer/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/farmer/products/${productToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts(prev => prev.filter(p => p.product_id !== productToDelete));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const addStock = async () => {
    if (!stockProduct || stockQuantity <= 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await API.put(`/farmer/products/${stockProduct.product_id}/stock`, 
        { quantity: stockQuantity },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setProducts(prev => prev.map(p => 
        p.product_id === stockProduct.product_id 
          ? { ...p, quantity: p.quantity + stockQuantity }
          : p
      ));
      
      setShowAddStockModal(false);
      setStockProduct(null);
      setStockQuantity(1);
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('Failed to add stock');
    }
  };

  const updatePrice = async () => {
    if (!priceProduct || !newPrice || newPrice <= 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await API.put(`/farmer/products/${priceProduct.product_id}/price`, 
        { price: parseFloat(newPrice) },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setProducts(prev => prev.map(p => 
        p.product_id === priceProduct.product_id 
          ? { ...p, price: parseFloat(newPrice) }
          : p
      ));
      
      setShowPriceModal(false);
      setPriceProduct(null);
      setNewPrice('');
    } catch (err) {
      console.error('Error updating price:', err);
      alert('Failed to update price');
    }
  };

  const getProductStats = () => {
    const activeProducts = products.filter(p => p.quantity > 0).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    
    return {
      activeProducts,
      outOfStock,
      lowStock,
      totalProducts: products.length
    };
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const isCooperative = user?.role === 'cooperative';
  const dashboardTitle = isCooperative ? 'Cooperative Dashboard' : 'Farmer Dashboard';
  const welcomeText = isCooperative ? 'Welcome to your cooperative' : 'Welcome to your farm';

  const totalEarnings = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const stats = getProductStats();

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'in_stock' && product.quantity > 0) ||
        (filterStatus === 'out_of_stock' && product.quantity === 0) ||
        (filterStatus === 'low_stock' && product.quantity > 0 && product.quantity <= 10);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.product_name.localeCompare(b.product_name);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'stock') return b.quantity - a.quantity;
      if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 text-4xl opacity-20 animate-bounce">grass</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20 animate-bounce delay-100">sun</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce delay-200">leaf</div>
        <div className="absolute bottom-10 right-10 text-4xl opacity-20 animate-bounce delay-300">wind</div>
      </div>

      {/* Enhanced Header */}
      <header className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl animate-pulse">grass</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {dashboardTitle}
                </h1>
              </div>
              
              {/* Enhanced Farmer Session Display - Always show with fallback */}
              <div className="group relative">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-full border border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center group-hover:animate-pulse shadow-md">
                    <span className="text-white text-lg font-bold">
                      {(farmerData?.full_name || user?.full_name || 'Farmer')?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-700">{farmerData?.full_name || user?.full_name || 'Farmer'}</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <span>check-circle</span>
                      {welcomeText}
                    </p>
                  </div>
                  <span className="text-emerald-600 group-hover:rotate-180 transition-transform duration-300">
                    chevron-down
                  </span>
                </div>
                
                {/* Enhanced Hover Tooltip */}
                <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-emerald-200 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 pointer-events-none">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900 mb-1">{farmerData?.full_name || user?.full_name || 'Farmer'}</p>
                    <p className="text-gray-600 mb-2">{farmerData?.email || user?.email || 'farmer@example.com'}</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Session Active</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-100">
                      <p className="text-xs text-gray-500">Member since: {new Date(farmerData?.created_at || user?.created_at || new Date()).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-emerald-600 transition-all duration-300 hover:scale-110"
                >
                  <span className="text-xl">bell</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-100 z-[9999] animate-slide-down overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <span className="mr-2 text-emerald-600">bell</span>
                          {t('notifications')}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                          >
                            {t('markAllAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-emerald-50 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              !notification.read ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                !notification.read ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <span className="text-lg">
                                  {notification.type === 'order' ? 'package' : 
                                   notification.type === 'order_update' ? 'file-text' : 'bell'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                  <span className="mr-1">clock</span>
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <span className="text-3xl mb-2 block">bell</span>
                          <p>{t('noNotifications')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link 
                to="/add-product" 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                grass {t('addProduct')}
              </Link>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="btn-danger flex items-center gap-2 hover-scale"
              >
                <span>{t('logout')}</span>
                <span>log-out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('activeProducts')}</h3>
                <p className="text-xs text-emerald-600 font-semibold">{t('liveListings')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white text-xl">grass</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 relative z-10">
              {stats.activeProducts}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
              <span>trending-up</span>
              <span>{t('growthThisMonth')}</span>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('totalOrders')}</h3>
                <p className="text-xs text-blue-600 font-semibold">{t('customerOrders')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white text-xl">package</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 relative z-10">
              {orders.length}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
              <span>clock</span>
              <span>{t('pendingToday')}</span>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-white to-amber-50 p-6 rounded-2xl shadow-xl border border-amber-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('totalEarnings')}</h3>
                <p className="text-xs text-amber-600 font-semibold">{t('revenue')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white text-xl">dollar-sign</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2 relative z-10">
              ${totalEarnings.toFixed(2)}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
              <span>trending-up</span>
              <span>{t('earningsGrowth')}</span>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('stockAlerts')}</h3>
                <p className="text-xs text-purple-600 font-semibold">{t('lowStockItems')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-white text-xl">alert-triangle</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 relative z-10">
              {stats.lowStock || 0}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 relative z-10">
              <span>refresh-cw</span>
              <span>{t('needsRestocking')}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Recent Orders Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 mb-8 hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">file-text</span> {t('recentOrders')}
            </h2>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">package</span>
                <p className="text-gray-500">{t('noOrdersYet')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('ordersWillAppearHere')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div key={order.order_id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-emerald-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.order_id}</p>
                        <p className="text-sm text-gray-600">
                          {order.buyer_name} - {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {order.items?.length || 0} items - ${parseFloat(order.total_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Products Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 hover:shadow-2xl transition-all duration-300">
          <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">grass</span> {t('yourProducts')}
              </h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder={t('searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{t('allProducts')}</option>
                  <option value="in_stock">{t('inStock')}</option>
                  <option value="low_stock">{t('lowStock')}</option>
                  <option value="out_of_stock">{t('outOfStock')}</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="name">{t('sortByName')}</option>
                  <option value="price">{t('sortByPrice')}</option>
                  <option value="stock">{t('sortByStock')}</option>
                  <option value="date">{t('sortByDate')}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">grass</span>
                <p className="text-gray-500">{t('noProductsFound')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('addFirstProduct')}</p>
                <Link
                  to="/add-product"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {t('addProduct')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.product_id} className="group border border-emerald-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50">
                    {/* Product Image */}
                    <div className="mb-3 relative">
                      {product.image || product.image_url ? (
                        <img
                          src={`http://localhost:5000/${product.image || product.image_url}`}
                          alt={product.product_name || 'Product'}
                          className="w-full h-40 object-cover rounded-lg border border-emerald-200 group-hover:border-emerald-400 transition-all duration-300"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            console.log('Failed image URL:', `http://localhost:5000/${product.image || product.image_url}`);
                            console.log('Product data:', product);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully for:', product.product_name);
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-emerald-200 flex items-center justify-center">
                          <span className="text-4xl text-gray-400">🌾</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">grass</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.quantity === 0 ? 'bg-red-100 text-red-800' :
                          product.quantity <= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {product.quantity === 0 ? t('outOfStock') :
                           product.quantity <= 10 ? t('lowStock') : t('inStock')}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-emerald-600">${product.price}</span>
                      <span className="text-sm text-gray-500">{product.quantity} {t('units')}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setStockProduct(product);
                          setShowAddStockModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Add Stock
                      </button>
                      <button
                        onClick={() => {
                          setPriceProduct(product);
                          setNewPrice(product.price);
                          setShowPriceModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        Update Price
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C2.458 8 6 8 8s6 5.542 6 12 5.542 12 12 5.542 6 12 5.542 6 12z" />
                        </svg>
                        {t('viewDetails')}
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(product.product_id);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Stock Modal */}
      {showAddStockModal && stockProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('addStock')} - {stockProduct.product_name}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('quantityToAdd')}</label>
              <input
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={addStock}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Stock
              </button>
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setStockProduct(null);
                  setStockQuantity(1);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Price Modal */}
      {showPriceModal && priceProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('updatePrice')} - {priceProduct.product_name}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPrice')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={updatePrice}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Update Price
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setPriceProduct(null);
                  setNewPrice('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C2.458 8 6 8 8s6 5.542 6 12 5.542 12 12 5.542 6 12z" />
                </svg>
                {t('productDetails')}
              </h3>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('productImage')}</h4>
                  <div className="aspect-square w-full bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
                    {selectedProduct.image || selectedProduct.image_url ? (
                      <img
                        src={`http://localhost:5000/${selectedProduct.image || selectedProduct.image_url}`}
                        alt={selectedProduct.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl text-gray-400">🌾</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('productName')}</h4>
                    <p className="text-lg text-gray-800 dark:text-gray-200">{selectedProduct.product_name}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('description')}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProduct.description || t('noDescriptionAvailable')}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('price')}</h4>
                    <p className="text-2xl font-bold text-emerald-600">${selectedProduct.price}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('stock')}</h4>
                    <p className="text-lg text-gray-800 dark:text-gray-200">{selectedProduct.quantity} {t('units')}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('status')}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedProduct.quantity === 0 ? 'bg-red-100 text-red-800' :
                      selectedProduct.quantity <= 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedProduct.quantity === 0 ? t('outOfStock') :
                       selectedProduct.quantity <= 10 ? t('lowStock') : t('inStock')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('deleteProduct')}</h3>
            <p className="text-gray-600 mb-6">{t('areYouSureToDeleteThisProduct')}</p>
            <div className="flex space-x-3">
              <button
                onClick={deleteProduct}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('delete')}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
