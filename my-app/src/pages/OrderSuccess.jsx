import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNewTranslation } from '../hooks/useNewTranslation';

const OrderSuccess = () => {
  const { t } = useNewTranslation();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (location.state?.order) {
      setOrderDetails(location.state.order);
    }
  }, [location.state]);
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

          {/* Farmer Support Summary */}
          {orderDetails && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                🌾 {t('supportingLocalFarmers') || 'Supporting Local Farmers'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${orderDetails.deposit_amount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {t('depositPaid') || 'Deposit Paid'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${orderDetails.remaining_balance?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {t('remainingBalance') || 'Remaining Balance'}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('farmersNotified') || 'The farmers have been notified and will prepare your fresh products.'}
                </p>
              </div>
            </div>
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
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t('continueShopping') || 'Continue Shopping'}
            </Link>
            <Link
              to="/orders"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
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
