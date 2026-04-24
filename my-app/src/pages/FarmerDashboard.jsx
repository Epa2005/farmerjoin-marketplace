import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useTranslation } from '../hooks/useTranslation';

const FarmerDashboard = () => {
  const { t, language, changeLanguage } = useTranslation();
  const navigate = useNavigate();
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
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showNotificationDetailModal, setShowNotificationDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
      console.log('Orders data:', res.data);
      console.log('Sample order structure:', res.data?.[0]);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(t('confirmDeleteOrder', 'Are you sure you want to delete this order?'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await API.delete(`/farmer/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh orders list
      await fetchOrders(token);

      alert(t('orderDeletedSuccessfully', 'Order deleted successfully'));
    } catch (err) {
      console.error('Failed to delete order:', err);
      if (err.response?.status === 404) {
        alert(t('deleteNotAvailable', 'Delete order functionality is not available. Please contact support.'));
      } else {
        alert(t('failedToDeleteOrder', 'Failed to delete order'));
      }
    }
  };

  const fetchNotifications = async (token) => {
    try {
      const res = await API.get('/farmer/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsData = res.data.notifications || res.data || [];
      console.log('Notifications data:', notificationsData);
      if (notificationsData.length > 0) {
        console.log('Sample notification structure:', notificationsData[0]);
      }
      setNotifications(notificationsData);
      setUnreadCount(notificationsData?.filter(n => !n.read).length || notificationsData.length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const setupWebSocket = (token) => {
    // WebSocket setup for real-time notifications
    try {
      const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      };

      ws.onerror = () => {
        // Silent error - WebSocket not available
      };

      ws.onclose = () => {
        // Silent close
      };

      wsRef.current = ws;
    } catch (error) {
      // Silent failure - continue without WebSocket
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      if (!notificationId) {
        console.warn('Notification ID is undefined, skipping mark as read');
        return;
      }
      await API.put(`/farmer/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId || n.notification_id === notificationId) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        console.warn('Notification ID is undefined, skipping delete');
        return;
      }
      const token = localStorage.getItem('token');
      await API.delete(`/farmer/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId && n.notification_id !== notificationId)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      alert(t('notificationDeleted', 'Notification deleted successfully'));
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert(t('failedToDeleteNotification', 'Failed to delete notification'));
    }
  };

  const handleLogout = () => {
    console.log('Logout button clicked');
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Token and user removed from localStorage');
      navigate('/login');
      console.log('Navigating to login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const viewNotificationDetail = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetailModal(true);
    setShowNotifications(false);
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
      alert(t('failedToDeleteProduct', 'Failed to delete product'));
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
      alert(t('failedToAddStock', 'Failed to add stock'));
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
      alert(t('failedToUpdatePrice', 'Failed to update price'));
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
  const dashboardTitle = isCooperative ? t('cooperativeDashboard', 'Cooperative Dashboard') : t('farmerDashboard', 'Farmer Dashboard');
  const welcomeText = isCooperative ? t('welcomeToCooperative', 'Welcome to your cooperative') : t('welcomeToFarm', 'Welcome to your farm');

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
          <p className="text-gray-600 font-medium">{t('loadingDashboard', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Modern Header */}
      <header className="relative bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{dashboardTitle}</h1>
                  <p className="text-sm text-gray-500">{t('manageFarmBusiness', 'Manage your farm business')}</p>
                </div>
              </div>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg font-bold">
                      {(farmerData?.full_name || user?.full_name || t('farmer', 'Farmer'))?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{farmerData?.full_name || user?.full_name || t('farmer', 'Farmer')}</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                    <p className="text-xs text-gray-500">{welcomeText}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-64 animate-in fade-in slide-in-from-top-2">
                    <div className="text-sm mb-3">
                      <p className="font-semibold text-gray-900 mb-1">{farmerData?.full_name || user?.full_name || t('farmer', 'Farmer')}</p>
                      <p className="text-gray-600 mb-2">{farmerData?.email || user?.email || 'farmer@example.com'}</p>
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>{t('sessionActive', 'Session Active')}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-1">
                      <Link
                        to="/edit-profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('editProfile', 'Edit Profile')}
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('logout', 'Logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="en">🇬🇧 EN</option>
                  <option value="rw">🇷 RW</option>
                  <option value="fr">🇫🇷 FR</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <Link
                to="/add-product"
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('addProduct', 'Add Product')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Notification Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse border-2 border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 bottom-20 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {t('notifications', 'Notifications')}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                    >
                      {t('markAllAsRead', 'Mark all as read')}
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id || notification.notification_id || `notification-${index}`}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
                        !notification.read ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notification.read ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.type === 'order' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          ) : notification.type === 'order_update' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 cursor-pointer" onClick={() => viewNotificationDetail(notification)}>
                          <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title || notification.type || 'New notification'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message || notification.content || `Order from ${notification.buyer_name || 'Buyer'}` || 'No details available'}
                          </p>
                          {notification.product_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              Product: {notification.product_name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {notification.created_at ? new Date(notification.created_at).toLocaleString() : notification.time || new Date().toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          )}
                          {(notification.id || notification.notification_id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id || notification.notification_id);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded transition-colors"
                              title={t('delete', 'Delete')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p>{t('noNotifications', 'No notifications')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('activeProducts', 'Active Products')}</h3>
                <p className="text-xs text-emerald-600 font-semibold">{t('liveListings', 'Live listings')}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.activeProducts}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{t('growthThisMonth', 'Growth this month')}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('totalOrders', 'Total Orders')}</h3>
                <p className="text-xs text-blue-600 font-semibold">{t('customerOrders', 'Customer orders')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{orders.length}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('pendingToday', 'Pending today')}</span>
            </div>
            <button
              onClick={() => setShowOrdersModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {t('viewOrders', 'View Orders')}
            </button>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('totalEarnings', 'Total Earnings')}</h3>
                <p className="text-xs text-amber-600 font-semibold">{t('revenue', 'Revenue')}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0 0a5 5 0 017.54-.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">RWF {Number(totalEarnings).toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{t('earningsGrowth', 'Earnings growth')}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{t('stockAlerts', 'Stock Alerts')}</h3>
                <p className="text-xs text-purple-600 font-semibold">{t('lowStockItems', 'Low stock items')}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.lowStock || 0}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('needsRestocking', 'Needs restocking')}</span>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('yourProducts')}
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
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 mb-2">{t('noProductsFound')}</p>
                <p className="text-sm text-gray-400 mb-4">{t('addFirstProduct')}</p>
                <Link
                  to="/add-product"
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('addProduct')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.product_id} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100">
                      {product.image || product.image_url ? (
                        <img
                          src={`http://localhost:5000/${product.image || product.image_url}`}
                          alt={product.product_name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Stock Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.quantity === 0 ? 'bg-red-500 text-white' :
                          product.quantity <= 10 ? 'bg-yellow-500 text-white' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {product.quantity === 0 ? t('outOfStock') :
                           product.quantity <= 10 ? t('lowStock') : t('inStock')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-emerald-600">RWF {Number(product.price).toLocaleString()}</span>
                        <span className="text-sm text-gray-500">{product.quantity} {t('units', 'units')}</span>
                      </div>
                    
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setStockProduct(product);
                            setShowAddStockModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {t('addStock', 'Add Stock')}
                        </button>
                        <button
                          onClick={() => {
                            setPriceProduct(product);
                            setNewPrice(product.price);
                            setShowPriceModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                        >
                          {t('updatePrice', 'Update Price')}
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('viewDetails')}
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product.product_id);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          {t('delete', 'Delete')}
                        </button>
                      </div>
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
                {t('addStock', 'Add Stock')}
              </button>
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setStockProduct(null);
                  setStockQuantity(1);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {t('cancel', 'Cancel')}
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
                {t('updatePrice', 'Update Price')}
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setPriceProduct(null);
                  setNewPrice('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {t('cancel', 'Cancel')}
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

      {/* Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('yourOrders', 'Your Orders')}</h3>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                {t('close', 'close')}
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">package</span>
                <p className="text-gray-500">{t('noOrdersYet', 'No orders yet')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.order_id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{t('order', 'Order')} #{order.order_id}</p>
                        <p className="text-sm text-gray-600">
                          {t('buyer', 'Buyer')}: {order.buyer_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('phone', 'Phone')}: {order.buyer_phone || order.phone || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('date', 'Date')}: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(order.status, order.status)}
                        </span>
                        <button
                          onClick={() => handleDeleteOrder(order.order_id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          {t('delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-sm text-gray-700">
                        {t('items', 'Items')}: {order.item_count || 0}
                      </p>
                      <p className="text-sm text-gray-700 font-semibold mt-1">
                        {t('totalPrice', 'Total Price')}: {parseFloat(order.order_total || order.total_price || 0).toFixed(2)} RWF
                      </p>
                      {(() => {
                        const totalPrice = parseFloat(order.order_total || order.total_price || 0);
                        const amountPaid = order.amount_paid !== undefined && order.amount_paid !== null
                          ? parseFloat(order.amount_paid)
                          : totalPrice * 0.5; // Default to 50% if not provided
                        const amountRemaining = totalPrice - amountPaid;
                        return (
                          <>
                            <p className="text-sm text-gray-700 mt-1">
                              {t('amountPaid', 'Amount Paid')}: {amountPaid.toFixed(2)} RWF
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {t('amountRemaining', 'Amount Remaining')}: {amountRemaining.toFixed(2)} RWF
                            </p>
                          </>
                        );
                      })()}
                      {order.delivery_address && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t('deliveryAddress', 'Delivery Address')}: {order.delivery_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {showNotificationDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('notificationDetails', 'Notification Details')}</h3>
              <button
                onClick={() => {
                  setShowNotificationDetailModal(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    !selectedNotification.read ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <span className="text-2xl">
                      {selectedNotification.type === 'order' ? 'package' :
                       selectedNotification.type === 'order_update' ? 'file-text' : 'bell'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedNotification.title || t('notification', 'Notification')}</p>
                    <p className="text-sm text-gray-600">
                      {selectedNotification.type || t('general', 'General')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedNotification.message || selectedNotification.description || t('noMessageContent', 'No message content')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>clock</span>
                <span>{selectedNotification.time || selectedNotification.created_at || new Date().toLocaleString()}</span>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    deleteNotification(selectedNotification.id || selectedNotification.notification_id);
                    setShowNotificationDetailModal(false);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {t('delete', 'Delete')}
                </button>
                <button
                  onClick={() => {
                    setShowNotificationDetailModal(false);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
