import React from 'react';

const GlassMorphismContainer = ({ children, className = "" }) => {
  return (
    <div className={`bg-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 relative ${className}`}>
      {/* Content - removed overlay that was blocking inputs */}
      {children}
    </div>
  );
};

export default GlassMorphismContainer;
