import { useState, useEffect } from 'react';
import { useDynamicTranslation } from '../utils/translateContent';

/**
 * Custom hook for translating database content in React components
 */
export const useDatabaseTranslation = () => {
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
    translateFarmSize,
    translateMembershipLevel,
    translateNotificationType,
    translateReportType,
    translateMessage,
    translateAction,
    translateValidation,
    translateCurrency,
    translateLanguageName,
    formatDate,
    translateProduct,
    translateOrder,
    translateUser,
    translateNotification,
    translateObject
  } = useDynamicTranslation();

  // Hook for translating products array
  const useTranslatedProducts = (products) => {
    const [translatedProducts, setTranslatedProducts] = useState([]);

    useEffect(() => {
      if (products && products.length > 0) {
        const translated = products.map(product => translateProduct(product));
        setTranslatedProducts(translated);
      } else {
        setTranslatedProducts([]);
      }
    }, [products]);

    return translatedProducts;
  };

  // Hook for translating orders array
  const useTranslatedOrders = (orders) => {
    const [translatedOrders, setTranslatedOrders] = useState([]);

    useEffect(() => {
      if (orders && orders.length > 0) {
        const translated = orders.map(order => translateOrder(order));
        setTranslatedOrders(translated);
      } else {
        setTranslatedOrders([]);
      }
    }, [orders]);

    return translatedOrders;
  };

  // Hook for translating users array
  const useTranslatedUsers = (users) => {
    const [translatedUsers, setTranslatedUsers] = useState([]);

    useEffect(() => {
      if (users && users.length > 0) {
        const translated = users.map(user => translateUser(user));
        setTranslatedUsers(translated);
      } else {
        setTranslatedUsers([]);
      }
    }, [users]);

    return translatedUsers;
  };

  // Hook for translating notifications array
  const useTranslatedNotifications = (notifications) => {
    const [translatedNotifications, setTranslatedNotifications] = useState([]);

    useEffect(() => {
      if (notifications && notifications.length > 0) {
        const translated = notifications.map(notification => translateNotification(notification));
        setTranslatedNotifications(translated);
      } else {
        setTranslatedNotifications([]);
      }
    }, [notifications]);

    return translatedNotifications;
  };

  // Hook for translating a single object with custom translation map
  const useTranslatedObject = (object, translationMap) => {
    const [translatedObject, setTranslatedObject] = useState(null);

    useEffect(() => {
      if (object) {
        const translated = translateObject(object, translationMap);
        setTranslatedObject(translated);
      } else {
        setTranslatedObject(null);
      }
    }, [object, translationMap]);

    return translatedObject;
  };

  return {
    // Individual translation functions
    translateCategory,
    translateProductStatus,
    translateOrderStatus,
    translateUserRole,
    translatePaymentMethod,
    translateDeliveryOption,
    translateProvince,
    translateTimeUnit,
    translateQualityGrade,
    translateFarmSize,
    translateMembershipLevel,
    translateNotificationType,
    translateReportType,
    translateMessage,
    translateAction,
    translateValidation,
    translateCurrency,
    translateLanguageName,
    formatDate,
    translateProduct,
    translateOrder,
    translateUser,
    translateNotification,
    translateObject,
    
    // Array translation hooks
    useTranslatedProducts,
    useTranslatedOrders,
    useTranslatedUsers,
    useTranslatedNotifications,
    useTranslatedObject
  };
};
