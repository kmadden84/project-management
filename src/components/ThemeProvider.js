import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Try to load from localStorage only if explicitly saved before
    const savedTheme = localStorage.getItem('darkMode');
    
    // Clear any existing classes first
    document.documentElement.classList.remove('light', 'dark');
    
    // Default to light mode, only use saved preference if explicitly saved before
    let selectedTheme;
    if (savedTheme === 'true') {
      selectedTheme = 'dark';
    } else {
      // Default to light mode for new users
      selectedTheme = 'light';
    }
    
    // Apply the theme class immediately
    document.documentElement.classList.add(selectedTheme);
    
    return selectedTheme;
  });

  // Apply theme class whenever theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Method to explicitly save the current theme preference
  const saveThemePreference = () => {
    localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, saveThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 