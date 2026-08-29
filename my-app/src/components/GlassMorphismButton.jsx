import React from 'react';
import { useNewTranslation } from '../hooks/useNewTranslation';

const GlassMorphismButton = ({ 
  children, 
  type = "button", 
  onClick, 
  disabled = false, 
  loading = false,
  loadingText,
  className = "",
  variant = "primary"
}) => {
  const { t } = useNewTranslation();
  const finalLoadingText = loadingText || t('loading');
  const baseClasses = "w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 font-ui backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-teal-600/90 to-emerald-600/90 hover:from-teal-700/90 hover:to-emerald-700/90 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500/50",
    secondary: "bg-gradient-to-r from-orange-600/90 to-red-600/90 hover:from-orange-700/90 hover:to-red-700/90 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500/50",
    success: "bg-gradient-to-r from-green-600/90 to-emerald-600/90 hover:from-green-700/90 hover:to-emerald-700/90 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500/50"
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {finalLoadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default GlassMorphismButton;
