import React, { useState } from 'react';

const FloatingActionButton = ({ 
  icon, 
  onClick, 
  label, 
  position = 'bottom-right',
  color = 'primary',
  size = 'large'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-8 right-8',
    'bottom-left': 'fixed bottom-8 left-8',
    'top-right': 'fixed top-8 right-8',
    'top-left': 'fixed top-8 left-8'
  };

  const colorClasses = {
    'primary': 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white',
    'secondary': 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white',
    'success': 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white',
    'error': 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
  };

  const sizeClasses = {
    'small': 'w-12 h-12',
    'medium': 'w-14 h-14',
    'large': 'w-16 h-16'
  };

  return (
    <div className={`${positionClasses[position]} z-50`}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          rounded-full shadow-2xl transform transition-all duration-300 
          hover:scale-110 hover:rotate-12 focus:outline-none focus:ring-4 
          focus:ring-white/30 flex items-center justify-center
          ${isHovered ? 'animate-pulse' : ''}
        `}
        aria-label={label}
      >
        <span className="text-2xl">{icon}</span>
        
        {/* Tooltip */}
        {isHovered && label && (
          <div className="absolute bottom-full mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
            {label}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
