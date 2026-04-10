import React from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';
import { useDatabaseTranslation } from '../hooks/useDatabaseTranslation';

/**
 * Component to demonstrate complete translation of all content types
 */
const TranslationDemo = () => {
  const { t } = useNewTranslation();
  const { 
    translateCategory, 
    translateProductStatus, 
    translateOrderStatus, 
    translateUserRole,
    translatePaymentMethod,
    formatDate,
    useTranslatedProducts,
    useTranslatedOrders
  } = useDatabaseTranslation();

  // Sample data that would come from database
  const sampleProducts = [
    {
      product_id: 1,
      product_name: "Fresh Tomatoes",
      category: "vegetables",
      status: "available",
      price: 500,
      quantity: 50,
      quality_grade: "premium",
      created_at: new Date('2024-01-15'),
      full_name: "John Farmer"
    },
    {
      product_id: 2,
      product_name: "Organic Lettuce",
      category: "vegetables",
      status: "limited",
      price: 300,
      quantity: 10,
      quality_grade: "organic",
      created_at: new Date('2024-01-10'),
      full_name: "Mary Farmer"
    }
  ];

  const sampleOrders = [
    {
      order_id: 1001,
      status: "pending",
      total_amount: 5000,
      payment_method: "cod",
      delivery_option: "delivery",
      created_at: new Date('2024-01-20'),
      items: [
        { product_name: "Fresh Tomatoes", quantity: 5, price: 500 }
      ]
    },
    {
      order_id: 1002,
      status: "delivered",
      total_amount: 3000,
      payment_method: "mobile",
      delivery_option: "pickup",
      created_at: new Date('2024-01-18'),
      items: [
        { product_name: "Organic Lettuce", quantity: 3, price: 300 }
      ]
    }
  ];

  const sampleUsers = [
    {
      id: 1,
      full_name: "John Farmer",
      email: "john@farmer.com",
      role: "farmer",
      province: "kigali",
      created_at: new Date('2024-01-01')
    },
    {
      id: 2,
      full_name: "Jane Buyer",
      email: "jane@buyer.com", 
      role: "buyer",
      province: "northern",
      created_at: new Date('2024-01-05')
    }
  ];

  const translatedProducts = useTranslatedProducts(sampleProducts);
  const translatedOrders = useTranslatedOrders(sampleOrders);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {t('translationDemo')} - Complete Content Translation
        </h1>

        {/* Static Content Translation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('staticContentTranslation')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-800">{t('navigation')}</h3>
              <p className="text-blue-600">{t('home')} | {t('products')} | {t('orders')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-semibold text-green-800">{t('actions')}</h3>
              <p className="text-green-600">{t('add')} | {t('edit')} | {t('delete')}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <h3 className="font-semibold text-purple-800">{t('messages')}</h3>
              <p className="text-purple-600">{t('success')} | {t('error')} | {t('loading')}</p>
            </div>
          </div>
        </div>

        {/* Database Content Translation - Products */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('databaseProductTranslation')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {translatedProducts.map((product) => (
              <div key={product.product_id} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg text-gray-800">{product.product_name}</h3>
                <div className="space-y-2 mt-3">
                  <p><strong>{t('category')}:</strong> {product.category_translated}</p>
                  <p><strong>{t('status')}:</strong> {product.status_translated}</p>
                  <p><strong>{t('quality')}:</strong> {product.quality_grade_translated}</p>
                  <p><strong>{t('price')}:</strong> {product.price} RWF</p>
                  <p><strong>{t('quantity')}:</strong> {product.quantity}</p>
                  <p><strong>{t('farmer')}:</strong> {product.full_name}</p>
                  <p><strong>{t('added')}:</strong> {product.created_at_formatted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Content Translation - Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('databaseOrderTranslation')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {translatedOrders.map((order) => (
              <div key={order.order_id} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg text-gray-800">{t('order')} #{order.order_id}</h3>
                <div className="space-y-2 mt-3">
                  <p><strong>{t('status')}:</strong> {order.status_translated}</p>
                  <p><strong>{t('payment')}:</strong> {order.payment_method_translated}</p>
                  <p><strong>{t('delivery')}:</strong> {order.delivery_option_translated}</p>
                  <p><strong>{t('total')}:</strong> {order.total_amount} RWF</p>
                  <p><strong>{t('ordered')}:</strong> {order.created_at_formatted}</p>
                  <div className="mt-3">
                    <strong>{t('items')}:</strong>
                    {order.items.map((item, index) => (
                      <div key={index} className="ml-4 text-sm">
                        {item.product_name} - {item.quantity} x {item.price} RWF
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Content Translation - Users */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('databaseUserTranslation')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg text-gray-800">{user.full_name}</h3>
                <div className="space-y-2 mt-3">
                  <p><strong>{t('email')}:</strong> {user.email}</p>
                  <p><strong>{t('role')}:</strong> {translateUserRole(user.role)}</p>
                  <p><strong>{t('location')}:</strong> {t(`provinces.${user.province}`)}</p>
                  <p><strong>{t('joined')}:</strong> {formatDate(user.created_at, 'long')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Translation Categories Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('translationCategories')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-gray-700">{t('productCategories')}</h4>
              <ul className="text-sm text-gray-600 mt-2">
                <li>• {translateCategory('vegetables')}</li>
                <li>• {translateCategory('fruits')}</li>
                <li>• {translateCategory('grains')}</li>
                <li>• {translateCategory('livestock')}</li>
              </ul>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-gray-700">{t('orderStatuses')}</h4>
              <ul className="text-sm text-gray-600 mt-2">
                <li>• {translateOrderStatus('pending')}</li>
                <li>• {translateOrderStatus('confirmed')}</li>
                <li>• {translateOrderStatus('processing')}</li>
                <li>• {translateOrderStatus('delivered')}</li>
              </ul>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-gray-700">{t('paymentMethods')}</h4>
              <ul className="text-sm text-gray-600 mt-2">
                <li>• {translatePaymentMethod('cod')}</li>
                <li>• {translatePaymentMethod('card')}</li>
                <li>• {translatePaymentMethod('mobile')}</li>
                <li>• {translatePaymentMethod('bank')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 text-center bg-blue-100 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">
            {t('translationComplete')}
          </h3>
          <p className="text-blue-600">
            {t('translationSummary')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranslationDemo;
