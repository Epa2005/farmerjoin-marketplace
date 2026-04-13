import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from '../hooks/useTranslation';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Helper function to fix image URLs
  const fixImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Replace port 4000 with 5000 for backend API
    return imageUrl.replace(':4000/', ':5000/');
  };

  const applyPromoCode = () => {
    // Simple promo code logic (you can expand this)
    if (promoCode.toLowerCase() === 'fresh10') {
      setDiscount(0.1); // 10% discount
    } else if (promoCode.toLowerCase() === 'organic20') {
      setDiscount(0.2); // 20% discount
    } else {
      setDiscount(0);
    }
  };

  const subtotal = getCartTotal();
  const discountAmount = subtotal * discount;
  const deliveryFee = 5.00;
  const total = subtotal - discountAmount + deliveryFee;

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    if (window.confirm(t('clearCartConfirm'))) {
      clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass p-12 text-center animate-fade-in">
            <div className="mb-8 animate-float">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full shadow-lg">
                <span className="text-6xl">🛒</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('cartEmpty') || 'Your Cart is Empty'}</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('cartEmptyMessage') || 'Looks like you haven\'t added any fresh produce yet. Start shopping to fill your cart!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="btn-primary text-lg px-8 py-3 hover-scale"
              >
                <span className="mr-2">🌾</span>
                {t('browseProducts') || 'Browse Products'}
              </Link>
              <Link
                to="/categories"
                className="btn-outline text-lg px-8 py-3 hover-scale"
              >
                <span className="mr-2">📋</span>
                {t('viewCategories') || 'View Categories'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-emerald-50 to-teal-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="glass p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="text-4xl">Shopping Cart</span>
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-lg font-semibold">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </h1>
              <p className="text-gray-600 text-lg">
                Review your fresh produce before checkout
              </p>
            </div>
            <button
              onClick={handleClearCart}
              className="btn-danger flex items-center gap-2 hover-scale"
            >
              <span>Clear Cart</span>
              <span>trash</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={`${item.id || item.product_id || 'item'}-${index}`} className="card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-6">
                      <div className="flex items-start space-x-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.image ? (
                            <img
                              src={fixImageUrl(item.image)}
                              alt={item.name}
                              className="w-28 h-28 object-cover rounded-2xl shadow-lg border-2 border-gray-100"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="112" height="112"%3E%3Crect width="112" height="112" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="24"%3E%F0%9F%8C%BE%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-28 h-28 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-lg border-2 border-primary-300">
                              <span className="text-4xl">grass</span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow">
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.name}</h3>
                          
                          {/* Farmer Information */}
                          <div className="bg-gradient-to-r from-success-50 to-emerald-50 rounded-2xl px-4 py-3 mb-4 inline-block border border-success-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg">F</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-success-700">
                                  {item.farmerName || t('localFarmer') || 'Local Farmer'}
                                </p>
                                <p className="text-xs text-success-600 flex items-center gap-1">
                                  <span>check-circle</span>
                                  {t('directFromFarm') || 'Direct from Farm'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price and Unit */}
                          <div className="flex items-center space-x-4 mb-4">
                            <p className="text-2xl font-bold text-primary-600">
                              ${parseFloat(item.price || 0).toFixed(2)}
                            </p>
                            <span className="text-gray-500 text-lg">/ {item.unit || 'kg'}</span>
                            <span className="badge badge-info">
                              {item.category || 'Fresh Produce'}
                            </span>
                          </div>

                          {/* Stock Information */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>inventory</span>
                            <span>{item.stock || 'In Stock'}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end space-y-4">
                          <div className="bg-gray-50 rounded-2xl p-1 flex items-center space-x-1 border-2 border-gray-200">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-10 h-10 rounded-xl bg-white hover:bg-red-50 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-gray-300"
                              disabled={item.quantity <= 1}
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <div className="w-16 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-full text-center text-xl font-bold bg-transparent border-none focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-10 h-10 rounded-xl bg-white hover:bg-primary-50 flex items-center justify-center transition-all duration-300 hover:scale-110 border border-gray-300"
                            >
                              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Item Total and Remove */}
                          <div className="text-right space-y-2">
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl px-4 py-2 border border-primary-200">
                              <p className="text-sm text-gray-600 mb-1">Item Total</p>
                              <p className="text-2xl font-bold text-primary-600">
                                ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-1 text-sm"
                            >
                              <span>trash</span>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">receipt</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                  </div>
                  
                  {/* Pricing Breakdown */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <div>
                          <span className="text-gray-600 text-sm">Subtotal</span>
                          <p className="text-xs text-gray-500">{items.reduce((total, item) => total + item.quantity, 0)} items</p>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">${subtotal.toFixed(2)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                          <div>
                            <span className="text-green-600 text-sm font-semibold">Discount ({(discount * 100).toFixed(0)}%)</span>
                            <p className="text-xs text-green-500">Promo: {promoCode}</p>
                          </div>
                          <span className="font-bold text-green-600">-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <div>
                          <span className="text-gray-600 text-sm">Delivery Fee</span>
                          <p className="text-xs text-gray-500">Standard delivery</p>
                        </div>
                        <span className="font-bold text-gray-900">${deliveryFee.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total Amount</span>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-primary-600">${total.toFixed(2)}</span>
                            <p className="text-xs text-gray-500">Including all fees</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 mb-6">
                    <Link
                      to="/checkout"
                      className="btn-primary w-full text-center text-lg py-4 hover-scale flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Checkout</span>
                      <span>arrow-right</span>
                    </Link>
                    <Link
                      to="/products"
                      className="btn-outline w-full text-center text-lg py-4 hover-scale flex items-center justify-center gap-2"
                    >
                      <span>Continue Shopping</span>
                      <span>shopping-bag</span>
                    </Link>
                  </div>

                  {/* Promo Code */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                    <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <span>tag</span>
                      Promo Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code (try: FRESH10)"
                        className="input-field flex-1"
                      />
                      <button 
                        onClick={applyPromoCode}
                        className="btn-secondary hover-scale"
                      >
                        Apply
                      </button>
                    </div>
                    {discount > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-semibold flex items-center gap-1">
                        <span>check-circle</span>
                        Discount applied successfully!
                      </div>
                    )}
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">check-circle</span>
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-500">truck</span>
                      <span>Fast delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-purple-500">shield</span>
                      <span>Money-back guarantee</span>
                    </div>
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

export default Cart;
