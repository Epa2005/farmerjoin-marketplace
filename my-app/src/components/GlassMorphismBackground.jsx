import React from 'react';

const GlassMorphismBackground = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${className}`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-teal-400/30 to-blue-400/30 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full filter blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {children}
    </div>
  );
};

export default GlassMorphismBackground;
