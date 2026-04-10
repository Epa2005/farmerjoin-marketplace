import React, { useState } from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const LanguageSelector = ({ isDropdown = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useNewTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const containerClass = isDropdown 
    ? "relative"
    : "fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3 border border-gray-200";

  return (
    <div className={containerClass}>
      {isDropdown ? (
        <div className="relative">
          {/* Single dropdown button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 text-white hover:bg-primary-700 px-3 py-2 rounded-md font-medium transition-colors"
          >
            <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
            <span className="hidden sm:inline text-sm">{currentLanguage?.name}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                    language === lang.code ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Close dropdown when clicking outside */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            ></div>
          )}
        </div>
      ) : (
        <>
          <span className="text-xs font-medium text-gray-700 text-center mb-2 block">Language / Ururimi / Langue</span>
          <div className="space-y-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all transform hover:scale-105 hover:bg-gray-100 ${
                  language === lang.code
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                title={lang.name}
              >
                <span className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
