import { t, getCurrentLanguage } from './i18n';

/**
 * Utility functions for translating dynamic content from database
 */

// Translate product category
export const translateCategory = (categoryKey, language) => {
  const categories = t(`productCategories.${categoryKey}`, language);
  return categories || categoryKey;
};

// Translate product status
export const translateProductStatus = (statusKey, language) => {
  const statuses = t(`productStatus.${statusKey}`, language);
  return statuses || statusKey;
};

// Translate order status
export const translateOrderStatus = (statusKey, language) => {
  const statuses = t(`orderStatus.${statusKey}`, language);
  return statuses || statusKey;
};

// Translate user role
export const translateUserRole = (roleKey, language) => {
  const roles = t(`userRoles.${roleKey}`, language);
  return roles || roleKey;
};

// Translate payment method
export const translatePaymentMethod = (methodKey, language) => {
  const methods = t(`paymentMethods.${methodKey}`, language);
  return methods || methodKey;
};

// Translate delivery option
export const translateDeliveryOption = (optionKey, language) => {
  const options = t(`deliveryOptions.${optionKey}`, language);
  return options || optionKey;
};

// Translate province
export const translateProvince = (provinceKey, language) => {
  const provinces = t(`provinces.${provinceKey}`, language);
  return provinces || provinceKey;
};

// Translate time unit
export const translateTimeUnit = (unitKey, language) => {
  const units = t(`timeUnits.${unitKey}`, language);
  return units || unitKey;
};

// Translate quality grade
export const translateQualityGrade = (gradeKey, language) => {
  const grades = t(`qualityGrades.${gradeKey}`, language);
  return grades || gradeKey;
};

// Translate farm size
export const translateFarmSize = (sizeKey, language) => {
  const sizes = t(`farmSizes.${sizeKey}`, language);
  return sizes || sizeKey;
};

// Translate membership level
export const translateMembershipLevel = (levelKey, language) => {
  const levels = t(`membershipLevels.${levelKey}`, language);
  return levels || levelKey;
};

// Translate notification type
export const translateNotificationType = (typeKey, language) => {
  const types = t(`notificationTypes.${typeKey}`, language);
  return types || typeKey;
};

// Translate report type
export const translateReportType = (typeKey, language) => {
  const types = t(`reportTypes.${typeKey}`, language);
  return types || typeKey;
};

// Translate common message
export const translateMessage = (messageKey, language, params = {}) => {
  let message = t(`commonMessages.${messageKey}`, language);
  
  // Replace parameters in message
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });
  
  return message;
};

// Translate action
export const translateAction = (actionKey, language) => {
  const actions = t(`actions.${actionKey}`, language);
  return actions || actionKey;
};

// Translate validation message
export const translateValidation = (validationKey, language, params = {}) => {
  let message = t(`validation.${validationKey}`, language);
  
  // Replace parameters in message
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });
  
  return message;
};

// Translate currency
export const translateCurrency = (currencyKey, language) => {
  const currencies = t(`currencies.${currencyKey}`, language);
  return currencies || currencyKey;
};

// Translate language name
export const translateLanguageName = (languageKey, language) => {
  const languages = t(`languages.${languageKey}`, language);
  return languages || languageKey;
};

// Format date with localization
export const formatDate = (date, format = 'short', language) => {
  const formats = t(`dateFormats.${format}`, language);
  const formatString = formats || 'MM/DD/YYYY';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US');
    case 'long':
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-US');
    case 'full':
      return dateObj.toLocaleString('en-US');
    case 'relative':
      const now = new Date();
      const diff = now - dateObj;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes} minutes ago`;
      if (hours < 24) return `${hours} hours ago`;
      if (days < 30) return `${days} days ago`;
      return dateObj.toLocaleDateString('en-US');
    default:
      return dateObj.toLocaleDateString('en-US');
  }
};

// Translate product object completely
export const translateProduct = (product, language) => {
  return {
    ...product,
    category_translated: translateCategory(product.category, language),
    status_translated: translateProductStatus(product.status, language),
    quality_grade_translated: translateQualityGrade(product.quality_grade, language),
    time_unit_translated: translateTimeUnit(product.price_per, language),
    created_at_formatted: formatDate(product.created_at, 'short', language),
    updated_at_formatted: formatDate(product.updated_at, 'short', language)
  };
};

// Translate order object completely
export const translateOrder = (order, language) => {
  return {
    ...order,
    status_translated: translateOrderStatus(order.status, language),
    payment_method_translated: translatePaymentMethod(order.payment_method, language),
    delivery_option_translated: translateDeliveryOption(order.delivery_option, language),
    created_at_formatted: formatDate(order.created_at, 'full', language),
    updated_at_formatted: formatDate(order.updated_at, 'full', language)
  };
};

// Translate user object completely
export const translateUser = (user, language) => {
  return {
    ...user,
    role_translated: translateUserRole(user.role, language),
    membership_level_translated: translateMembershipLevel(user.membership_level, language),
    farm_size_translated: translateFarmSize(user.farm_size, language),
    province_translated: translateProvince(user.province, language),
    created_at_formatted: formatDate(user.created_at, 'short', language),
    last_login_formatted: formatDate(user.last_login, 'relative', language)
  };
};

// Translate notification object completely
export const translateNotification = (notification, language) => {
  return {
    ...notification,
    type_translated: translateNotificationType(notification.type, language),
    created_at_formatted: formatDate(notification.created_at, 'relative', language)
  };
};

// Generic translation function for any nested object
export const translateObject = (obj, language, translations = {}) => {
  const translated = { ...obj };
  
  Object.keys(translations).forEach(key => {
    const [category, item] = key.split('.');
    
    if (item) {
      // Handle nested translations like "productStatus.available"
      const translationSet = t(`${category}.${item}`, language);
      translated[`${key}_translated`] = translationSet || obj[key];
    } else {
      // Handle simple translations like "actions"
      const translationSet = t(key, language);
      if (typeof obj[key] === 'string' && translationSet) {
        translated[`${key}_translated`] = translationSet[obj[key]] || obj[key];
      }
    }
  });
  
  return translated;
};

// Helper to use in React components
export const useDynamicTranslation = () => {
  const language = getCurrentLanguage();
  
  return {
    translateCategory: (key) => translateCategory(key, language),
    translateProductStatus: (key) => translateProductStatus(key, language),
    translateOrderStatus: (key) => translateOrderStatus(key, language),
    translateUserRole: (key) => translateUserRole(key, language),
    translatePaymentMethod: (key) => translatePaymentMethod(key, language),
    translateDeliveryOption: (key) => translateDeliveryOption(key, language),
    translateProvince: (key) => translateProvince(key, language),
    translateTimeUnit: (key) => translateTimeUnit(key, language),
    translateQualityGrade: (key) => translateQualityGrade(key, language),
    translateFarmSize: (key) => translateFarmSize(key, language),
    translateMembershipLevel: (key) => translateMembershipLevel(key, language),
    translateNotificationType: (key) => translateNotificationType(key, language),
    translateReportType: (key) => translateReportType(key, language),
    translateMessage: (key, params) => translateMessage(key, language, params),
    translateAction: (key) => translateAction(key, language),
    translateValidation: (key, params) => translateValidation(key, language, params),
    translateCurrency: (key) => translateCurrency(key, language),
    translateLanguageName: (key) => translateLanguageName(key, language),
    formatDate: (date, format) => formatDate(date, format, language),
    translateProduct: (product) => translateProduct(product, language),
    translateOrder: (order) => translateOrder(order, language),
    translateUser: (user) => translateUser(user, language),
    translateNotification: (notification) => translateNotification(notification, language),
    translateObject: (obj, translations) => translateObject(obj, language, translations)
  };
};
