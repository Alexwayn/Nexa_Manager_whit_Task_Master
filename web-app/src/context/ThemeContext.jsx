import React, { createContext, useContext, useEffect, useState } from 'react';

// Translation function - to be integrated with i18n system
const t = (key, params) => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations = {
    // Theme Names
    'theme.light.name': 'Light',
    'theme.dark.name': 'Dark',

    // Error Messages
    'theme.error.mustUseProvider': 'useTheme must be used within a ThemeProvider',
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }

  return translation;
};

// Create Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('nexa-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    setIsLoading(false);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('nexa-theme', theme);
  }, [theme, isLoading]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Set specific theme
  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  // Auto theme (follows system preference)
  const setAutoTheme = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    setTheme(systemTheme);
    localStorage.removeItem('nexa-theme');
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (!localStorage.getItem('nexa-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(t('theme.error.mustUseProvider'));
  }

  return context;
};

// Theme configurations
export const themes = {
  light: {
    name: t('theme.light.name'),
    value: 'light',
    colors: {
      background: 'bg-white',
      surface: 'bg-gray-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100',
    },
  },
  dark: {
    name: t('theme.dark.name'),
    value: 'dark',
    colors: {
      background: 'bg-gray-900',
      surface: 'bg-gray-800',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      border: 'border-gray-700',
      hover: 'hover:bg-gray-700',
    },
  },
};

// Theme utility functions
export const getThemeColors = (theme) => {
  return themes[theme]?.colors || themes.light.colors;
};

export default ThemeContext;
