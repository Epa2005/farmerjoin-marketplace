import React from 'react';
import { useDatabaseTranslation } from '../hooks/useDatabaseTranslation';

/**
 * Component to demonstrate translated database content
 */
const TranslatedContent = ({ data, type }) => {
  const {
    translateCategory,
    translateProductStatus,
    translateOrderStatus,
    translateUserRole,
    translatePaymentMethod,
    translateDeliveryOption,
    translateProvince,
    translateTimeUnit,
    translateQualityGrade,
    formatDate
  } = useDatabaseTranslation();

  const renderTranslatedProduct = (product) => (
    <div key={product.id} className="border p-4 rounded-lg mb-4">
      <h3 className="font-bold text-lg">{product.product_name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <div className="mt-2 space-y-1">
        <p><strong>Category:</strong> {translateCategory(product.category)}</p>
        <p><strong>Status:</strong> {translateProductStatus(product.status)}</p>
        <p><strong>Quality:</strong> {translateQualityGrade(product.quality_grade)}</p>
        <p><strong>Price:</strong> {product.price} {translateTimeUnit(product.price_per)}</p>
        <p><strong>Location:</strong> {translateProvince(product.province)}</p>
        <p><strong>Added:</strong> {formatDate(product.created_at, 'long')}</p>
      </div>
    </div>
  );

  const renderTranslatedOrder = (order) => (
    <div key={order.id} className="border p-4 rounded-lg mb-4">
      <h3 className="font-bold text-lg">Order #{order.order_id}</h3>
      <div className="mt-2 space-y-1">
        <p><strong>Status:</strong> {translateOrderStatus(order.status)}</p>
        <p><strong>Payment:</strong> {translatePaymentMethod(order.payment_method)}</p>
        <p><strong>Delivery:</strong> {translateDeliveryOption(order.delivery_option)}</p>
        <p><strong>Total:</strong> {order.total_amount} RWF</p>
        <p><strong>Ordered:</strong> {formatDate(order.created_at, 'full')}</p>
      </div>
      <div className="mt-3">
        <h4 className="font-semibold">Items:</h4>
        {order.items.map((item, index) => (
          <div key={index} className="ml-4">
            <p>{item.product_name} - {item.quantity} x {item.price} RWF</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTranslatedUser = (user) => (
    <div key={user.id} className="border p-4 rounded-lg mb-4">
      <h3 className="font-bold text-lg">{user.full_name}</h3>
      <div className="mt-2 space-y-1">
        <p><strong>Role:</strong> {translateUserRole(user.role)}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Location:</strong> {translateProvince(user.province)}</p>
        <p><strong>Member Since:</strong> {formatDate(user.created_at, 'short')}</p>
      </div>
    </div>
  );

  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  switch (type) {
    case 'products':
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Translated Products</h2>
          {data.map(renderTranslatedProduct)}
        </div>
      );
    case 'orders':
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Translated Orders</h2>
          {data.map(renderTranslatedOrder)}
        </div>
      );
    case 'users':
      return (
        <div>
          <h2 className="text-xl font-bold mb-4">Translated Users</h2>
          {data.map(renderTranslatedUser)}
        </div>
      );
    default:
      return <p>Unknown data type</p>;
  }
};

export default TranslatedContent;
