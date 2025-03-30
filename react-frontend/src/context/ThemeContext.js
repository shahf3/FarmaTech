// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the ThemeContext
export const ThemeContext = createContext();

// ThemeProvider component to provide theme state and toggle function
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage, default to 'light' if not set
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setThemeMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode); // Persist the new mode
      return newMode;
    });
  };

  // Update localStorage whenever themeMode changes
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};