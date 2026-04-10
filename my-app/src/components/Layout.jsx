import React, { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { useNewTranslation } from '../hooks/useNewTranslation';

const Layout = ({ children }) => {
  const { t } = useNewTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Language Selector - Centered in Navigation */}
      <div className="fixed top-4 left-0 right-0 flex justify-center z-50">
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200 flex items-center space-x-2 hover:shadow-xl transition-all"
          >
            <span className="text-sm font-medium">🌍 {t('language')}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
            </svg>
          </button>
          
          {/* Language Dropdown Menu */}
          {showLanguageMenu && (
            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
              <LanguageSelector isDropdown={true} />
            </div>
          )}
        </div>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  );
};

export default Layout;
