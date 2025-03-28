import React from 'react';
import { useTheme } from './ThemeProvider';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project Management Board
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            data-testid="theme-toggle"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <SunIcon className="h-5 w-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
} 