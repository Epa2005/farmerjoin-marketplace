import React from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const LanguageSelector = ({ isDropdown = false }) => {
  const { changeLanguage, language } = useNewTranslation();

  const containerClass = isDropdown 
    ? "relative"
    : "fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3 border border-gray-200";

  return (
    <div className={containerClass}>
      {isDropdown ? (
        <div className="relative">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
          >
            <option value="en" className="text-gray-900">English</option>
            <option value="fr" className="text-gray-900">Français</option>
            <option value="rw" className="text-gray-900">Kinyarwanda</option>
          </select>
        </div>
      ) : (
        <>
          <span className="text-xs font-medium text-gray-700 text-center mb-2 block">Language / Ururimi / Langue</span>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="en" className="text-gray-900">English</option>
            <option value="fr" className="text-gray-900">Français</option>
            <option value="rw" className="text-gray-900">Kinyarwanda</option>
          </select>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
