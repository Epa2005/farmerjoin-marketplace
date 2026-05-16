import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      {/* Page Content */}
      {children}
    </div>
  );
};

export default Layout;
