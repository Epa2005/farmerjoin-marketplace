import { useState, useEffect, useCallback } from 'react';
import { t as translate, getCurrentLanguage, setLanguage } from '../utils/i18n';

// React hook for translation management
export const useTranslation = () => {
  const [language, setLanguageState] = useState(getCurrentLanguage());
  const [updateKey, setUpdateKey] = useState(0);

  // Force update function
  const forceUpdate = useCallback(() => {
    setUpdateKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Listen for storage events (language changes from other components)
    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        const newLang = e.newValue || 'en';
        setLanguageState(newLang);
        forceUpdate();
      }
    };

    // Also listen for custom events
    const handleLanguageChange = (e) => {
      const newLang = e.detail.lang;
      setLanguageState(newLang);
      forceUpdate();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [forceUpdate]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    setLanguageState(lang);
    forceUpdate();
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }, [forceUpdate]);

  const t = useCallback((key) => {
    return translate(key);
  }, [language, updateKey]); // Add updateKey to dependency

  return {
    t,
    language,
    changeLanguage,
    updateKey // For debugging
  };
};

export default useTranslation;
