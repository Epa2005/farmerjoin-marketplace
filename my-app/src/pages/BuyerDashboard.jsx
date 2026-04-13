// src/pages/BuyerDashboard.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";
import { useCart } from "../context/CartContext";

function BuyerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedFarmer, setSelectedFarmer, clearSelectedFarmer } = useCart();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [savedLocation, setSavedLocation] = useState("");
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [quantities, setQuantities] = useState({}); // Track quantities for each product

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearSelectedFarmer(); // Clear any selected farmer from cart context
    navigate("/login");
  };

  // Load user info from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchBuyerData(parsedUser.user_id, token);
    fetchBuyerLocation(token);
  }, []);

  const fetchBuyerData = async (buyerId, token) => {
    try {
      // Fetch buyer stats
      const statsRes = await API.get(`/buyers/${buyerId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(statsRes.data || {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        deliveredOrders: 0
      });

      // Fetch recent orders
      const ordersRes = await API.get("/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orders = ordersRes.data || [];
      setRecentOrders(orders.slice(0, 5)); // Show only last 5 orders
    } catch (err) {
      console.error("Error fetching buyer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerLocation = async (token) => {
    try {
      const res = await API.get("/buyers/location");
      
      if (res.data.location) {
        setSavedLocation(res.data.location);
        setLocation(res.data.location);
      }
    } catch (err) {
      console.error("Error fetching buyer location:", err);
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update buyer location
      await API.put("/buyers/location", { location });
      
      setSavedLocation(location);
      alert("Location updated successfully!");
    } catch (err) {
      console.error("Error updating location:", err);
      alert("Failed to update location");
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t('loadingDashboard') || 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Logout */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="text-4xl">Welcome back</span>
                <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-xl font-semibold">
                  {user?.full_name || 'Buyer'}
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                {t('dashboardSubtitle') || 'Manage your orders and explore fresh produce'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center gap-2 hover-scale"
            >
              <span>Logout</span>
              <span>log-out</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">package</span>
                <span className="badge badge-info">{t('orders')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600 mt-1">{t('totalOrders')}</p>
            </div>
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">dollar-sign</span>
                <span className="badge badge-success">{t('spent')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">${stats.totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">{t('totalSpent')}</p>
            </div>
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-6 text-center">
              <Link 
                to="/cart" 
                className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200 transition-all duration-300 hover:scale-110 shadow-lg"
              >
                shopping-cart
              </Link>
              <div className="text-gray-600 font-medium mt-2">{t('cart')}</div>
            </div>
          </div>
          
          <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">map-pin</span>
                <span className="badge badge-warning">{t('location')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 truncate">
                {savedLocation || 'Not set'}
              </p>
              <p className="text-sm text-gray-600 mt-1">{t('deliveryLocation')}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>clock</span>
                {t('recentOrders')}
              </h2>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.order_id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">Order #{order.order_id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {order.items?.length || 0} items - ${parseFloat(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {t('noRecentOrders') || 'No recent orders'}
                </p>
              )}
            </div>
          </div>

          {/* Location Settings */}
          <div className="card animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>map</span>
                {t('deliveryLocation')}
              </h2>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('yourLocation')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your delivery location"
                    className="input-field w-full"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  {t('updateLocation')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Browse Products Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-md p-6 mt-8 animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Fresh Products Await!</h3>
              <p className="text-primary-100">Browse our collection of fresh produce directly from farmers</p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;
