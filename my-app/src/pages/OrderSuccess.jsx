import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const OrderSuccess = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (location.state?.order) {
      setOrderDetails(location.state.order);
      if (location.state.order.items) {
        setOrderItems(location.state.order.items);
      }
    }
  }, [location.state]);

  // Collect unique farmers from order items
  const uniqueFarmers = [];
  const seenFarmerIds = new Set();
  orderItems.forEach(item => {
    if (item.farmer_id && !seenFarmerIds.has(item.farmer_id)) {
      seenFarmerIds.add(item.farmer_id);
      uniqueFarmers.push({
        id: item.farmer_id,
        name: item.farmer_name,
        email: item.farmer_email,
        phone: item.farmer_phone
      });
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('orderPlacedSuccessfully') || 'Order Placed Successfully!'}</h1>
          <p className="text-gray-600 mb-8">
            {t('thankYouOrderConfirmation') || "Thank you for your order. We'll send you a confirmation email shortly with your order details."}
          </p>

          {orderDetails && (
            <>
              {/* Order ID */}
              {orderDetails.order_id && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg inline-block">
                  <p className="text-sm text-gray-500">{t('orderId') || 'Order ID'}</p>
                  <p className="text-lg font-bold text-gray-800">#{orderDetails.order_id}</p>
                </div>
              )}

              {/* Amount Due on Delivery */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                  🌾 {t('supportingLocalFarmers') || 'Supporting Local Farmers'}
                </h2>
                <div className="text-center mb-4">
                  <div className="text-sm text-green-700 dark:text-green-300 mb-1">
                    {t('totalDueOnDelivery') || 'Total Due on Delivery'}
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    RWF {(orderDetails.total_amount || orderDetails.calculated_total || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-2">
                    {t('cashOnDelivery') || 'Cash on Delivery'}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t('farmersNotified') || 'The farmers have been notified and will prepare your fresh products.'}
                  </p>
                </div>
              </div>

              {/* Farmer Contact Information */}
              {uniqueFarmers.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {t('farmerContactInfo') || 'Farmer Contact Information'}
                  </h2>
                  <div className="space-y-4">
                    {uniqueFarmers.map((farmer) => (
                      <div key={farmer.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{farmer.name || t('localFarmer', 'Local Farmer')}</p>
                          {farmer.email && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {farmer.email}
                            </p>
                          )}
                          {farmer.phone && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {farmer.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('orderSummary') || 'Order Summary'}</h2>
                  <div className="divide-y divide-gray-100">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-3">
                        <div>
                          <p className="font-medium text-gray-800">{item.product_name || `Product #${item.product_id}`}</p>
                          <p className="text-sm text-gray-500">{t('quantity') || 'Qty'}: {item.quantity} x RWF {parseFloat(item.price || 0).toFixed(0)}</p>
                          {item.farmer_name && (
                            <p className="text-xs text-emerald-600">{t('soldBy') || 'Sold by'}: {item.farmer_name}</p>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800">RWF {(item.total || item.price * item.quantity || 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('whatHappensNext') || 'What happens next?'}</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <h3 className="font-medium text-gray-800">{t('orderConfirmation') || 'Order Confirmation'}</h3>
                  <p className="text-sm text-gray-600">{t('receiveEmailTracking') || "You'll receive an email with your order details and tracking information."}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <h3 className="font-medium text-gray-800">{t('orderProcessing') || 'Order Processing'}</h3>
                  <p className="text-sm text-gray-600">{t('farmersPrepareDelivery') || "Farmers will prepare your fresh products for delivery."}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <h3 className="font-medium text-gray-800">{t('delivery') || 'Delivery'}</h3>
                  <p className="text-sm text-gray-600">{t('orderDeliveredDays') || "Your order will be delivered to your specified address within 2-3 business days."}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md"
            >
              {t('continueShopping') || 'Continue Shopping'}
            </Link>
            <Link
              to="/orders"
              className="border border-gray-300 hover:border-emerald-400 text-gray-700 hover:text-emerald-600 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t('viewMyOrders') || 'View My Orders'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;