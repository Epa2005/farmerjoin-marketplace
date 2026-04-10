import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useNewTranslation } from '../hooks/useNewTranslation';

const Checkout = () => {
  const { items, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useNewTranslation();
  
  // Helper function to fix image URLs
  const fixImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Replace port 4000 with 5000 for backend API
    return imageUrl.replace(':4000/', ':5000/');
  };
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'cod'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;
  const requiredDeposit = total * 0.5; // 50% deposit
  const remainingBalance = total * 0.5; // Remaining 50%

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Quick token refresh by re-logging in
  const refreshToken = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.email) {
      return null;
    }
    
    try {
      // This assumes you have a login endpoint that can refresh tokens
      const response = await axios.post('http://localhost:5000/auth/login', {
        email: user.email,
        // Note: You would need the password here, which we don't have
        // So this is just for demonstration
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data.token;
      }
    } catch (error) {
      console.log('Token refresh failed:', error);
    }
    
    return null;
  };

  // Quick token validation and refresh helper
  const validateAndRefreshToken = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
      alert('Please login first to place an order.');
      navigate('/login');
      return false;
    }
    
    // Check token format
    if (token.split('.').length !== 3) {
      alert('Invalid authentication token. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return false;
    }
    
    // Check if expired
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp < Date.now() / 1000) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return false;
      }
    } catch (e) {
      alert('Invalid session. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return false;
    }
    
    return true;
  };

  // Test backend connectivity without auth
  const testBackendConnection = async () => {
    console.log('=== TESTING BACKEND CONNECTION ===');
    
    const token = localStorage.getItem('token');
    
    try {
      // Test 1: Public test endpoint
      const response = await axios.get('http://localhost:5000/test-connection', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      console.log('✅ Backend test response:', response.data);
      alert('Backend connection successful! Check console for details.');
    } catch (error) {
      console.log('❌ Backend test failed:', error.message);
      alert('Backend connection failed: ' + error.message);
    }
  };

  // Test authentication before checkout
  const testAuthentication = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    console.log('=== AUTHENTICATION TEST ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token format:', token?.split('.').length === 3 ? 'Valid JWT' : 'Invalid format');
    console.log('User exists:', !!user);
    console.log('User role:', user?.role);
    console.log('User ID:', user?.user_id);
    
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        console.log('Token expires:', new Date(decoded.exp * 1000));
        console.log('Token expired:', decoded.exp < Date.now() / 1000);
      } catch (e) {
        console.log('Cannot decode token:', e.message);
      }
    }
    
    // Test API call
    try {
      const testResponse = await API.get('/auth/test');
      console.log('API test successful:', testResponse.status);
    } catch (e) {
      console.log('API test failed:', e.response?.status, e.response?.data);
    }
    console.log('=== END AUTH TEST ===');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simple validation
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        alert('Please login first to place an order.');
        navigate('/login');
        return;
      }

      if (user.role !== 'buyer') {
        alert('Only buyers can place orders.');
        return;
      }

      // Prepare order data
      console.log('=== DEBUGGING CART ITEMS ===');
      console.log('Items in cart:', items);
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
        console.log('Available fields:', Object.keys(item));
      });
      console.log('=== END DEBUGGING ===');
      
      const orderData = {
        cart_items: items.map(item =>({
          product_id: parseInt(item.id || item.product_id),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        })),
        delivery_address: `${formData.address}, ${formData.city}, ${formData.state}${formData.zipCode ? ' ' + formData.zipCode : ''}`,
        payment_method: formData.paymentMethod,
        deposit_amount: parseFloat(requiredDeposit),
        total_amount: parseFloat(total)
      };

      console.log('=== SIMPLE CHECKOUT ATTEMPT ===');
      console.log('Order data:', orderData);
      console.log('Token:', token.substring(0, 50) + '...');
      console.log('User:', user);

      // SIMPLE DIRECT APPROACH - Use API instance with token interceptor
      console.log('Using API instance with token interceptor...');
      const response = await API.post('/buyer/checkout', orderData);

      console.log('Checkout successful:', response.data);

      if (response.data.success) {
        clearCart();
        navigate('/order-success', { 
          state: { 
            order: response.data.order,
            depositPaid: requiredDeposit,
            remainingBalance
          } 
        });
      } else {
        alert(response.data.message || 'Order failed');
      }
    } catch (error) {
      console.error('=== CHECKOUT ERROR ===');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
      // If it's still 401, the issue is with backend authentication
      if (error.response?.status === 401) {
        alert('Authentication error. This might be a backend issue. Please try:\n1. Login again\n2. Contact support if the issue persists\n\nError: ' + (error.response?.data?.message || 'Unauthorized'));
        
        // Optional: Clear and redirect
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // navigate('/login');
      } else {
        alert(error.response?.data?.message || 'Checkout failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('noItemsInCart') || 'No items in cart'}</h2>
            <Link
              to="/products"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t('browseProducts') || 'Browse Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('checkout') || 'Checkout'}</h1>
          <p className="text-gray-600 mt-2">{t('completeOrderDetails') || 'Complete your order details'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('contactInformation') || 'Contact Information'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('deliveryAddress') || 'Delivery Address'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('streetAddress') || 'Street Address'}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('city') || 'City'}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('state') || 'State'}
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('zipCode') || 'ZIP Code (Optional)'}
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('paymentMethod') || 'Payment Method'}</h2>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <label className="ml-2">{t('cashOnDelivery') || 'Cash on Delivery'}</label>
                      <p className="text-sm text-gray-600">{t('payWhenReceiveOrder') || 'Pay when you receive your order'}</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_money"
                      checked={formData.paymentMethod === 'mobile_money'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <label className="ml-2">📱 {t('mobileMoney') || 'Mobile Money'}</label>
                      <p className="text-sm text-gray-600">{t('payViaMobile') || 'Pay via mobile money transfer (M-Pesa, Airtel Money, etc.)'}</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <label className="ml-2">{t('creditDebitCard') || 'Credit/Debit Card'}</label>
                      <p className="text-sm text-gray-600">{t('secureOnlinePayment') || 'Secure online payment'}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Debug Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={testAuthentication}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  🐛 Debug Auth
                </button>
                <button
                  type="button"
                  onClick={testBackendConnection}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  🔌 Test Backend
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isProcessing ? t('processing') || 'Processing...' : `${t('placeOrder') || 'Place Order'} - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('orderSummary') || 'Order Summary'}</h2>
              
              {/* Farmers Being Supported */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3">
                  🌾 {t('supportingTheseFarmers') || 'Supporting These Farmers'}
                </h3>
                <div className="space-y-2">
                  {Array.from(new Set(items.map(item => item.farmerName || t('localFarmer')))).map((farmerName, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {farmerName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-green-700 dark:text-green-300">{farmerName}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                  {t('supportingLocalFarmersNote') || 'Your purchase directly supports local farmers and their families.'}
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img
                          src={fixImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3E🌾%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          👨‍🌾 {item.farmerName || t('localFarmer')}
                        </span>
                        <span className="text-xs text-gray-600">Qty: {item.quantity} × ${parseFloat(item.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>{t('subtotal') || 'Subtotal'}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('deliveryFee') || 'Delivery Fee'}</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                
                {/* Payment Breakdown */}
                <div className="border-t pt-2 mt-2">
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <div className="text-sm text-blue-800 font-medium mb-2">
                      💰 {t('paymentBreakdown') || 'Payment Breakdown'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{t('depositRequired') || 'Deposit Required (50%)'}:</span>
                        <span className="font-semibold text-blue-600">${requiredDeposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('remainingBalance') || 'Remaining Balance'}:</span>
                        <span className="text-gray-600">${remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold text-gray-800">
                    <span>{t('totalAmount') || 'Total Amount'}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {t('depositNote') || 'Note: 50% deposit required to confirm order'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
