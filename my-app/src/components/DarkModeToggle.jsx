import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

const DarkModeToggle = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label="Toggle dark mode"
    >
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <span className="text-yellow-500 text-sm">sun</span>
        <span className="text-gray-400 text-sm">moon</span>
      </div>
      <div
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        <div className={`w-full h-full rounded-full flex items-center justify-center transition-colors duration-300 ${
          isDark ? 'bg-primary-600' : 'bg-yellow-400'
        }`}>
          <span className="text-white text-xs">
            {isDark ? 'moon' : 'sun'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default DarkModeToggle;
