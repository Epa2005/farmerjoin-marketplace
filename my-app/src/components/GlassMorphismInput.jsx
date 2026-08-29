import React from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const GlassMorphismInput = ({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  icon = null,
  showToggle = false,
  showPassword,
  setShowPassword,
  className = ""
}) => {
  const { t } = useNewTranslation();
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={label} className="block text-sm font-medium text-gray-700 mb-2 font-ui">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={label}
          type={type}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent font-ui bg-white/90 text-gray-800 placeholder-gray-500 ${icon ? 'pl-10' : 'pl-4'}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            {showPassword ? t('hide') : t('show')}
          </button>
        )}
      </div>
    </div>
  );
};

export default GlassMorphismInput;
