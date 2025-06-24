import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

// Translation function
const t = (key, params) => {
  const translations = {
    'theme.light.name': 'Light',
    'theme.dark.name': 'Dark',
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

// Split Context Types for Optimization
// 1. Theme State Context (changes rarely)
const ThemeStateContext = createContext();

// 2. Theme Actions Context (never changes - only functions)
const ThemeActionsContext = createContext();

/**
 * Optimized ThemeProvider Component
 * 
 * Performance Optimizations:
 * 1. Context Splitting: Separates theme state from theme actions
 * 2. Memoized Values: Prevents unnecessary re-renders
 * 3. Callback Memoization: Stable function references
 * 4. Efficient DOM Updates: Batched theme application
 */
export const OptimizedThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Memoized theme application function
  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement;
    
    // Batch DOM updates
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('nexa-theme', newTheme);
  }, []);

  // Initialize theme with optimized logic
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('nexa-theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      const initialTheme = savedTheme || systemTheme;
      
      // Apply theme immediately to prevent flash
      applyTheme(initialTheme);
      setTheme(initialTheme);
      setIsLoading(false);
    };

    initializeTheme();
  }, [applyTheme]);

  // Apply theme changes with optimized updates
  useEffect(() => {
    if (!isLoading) {
      applyTheme(theme);
    }
  }, [theme, isLoading, applyTheme]);

  // Memoized theme action functions
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const setLightTheme = useCallback(() => {
    setTheme('light');
  }, []);

  const setDarkTheme = useCallback(() => {
    setTheme('dark');
  }, []);

  const setAutoTheme = useCallback(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    setTheme(systemTheme);
    localStorage.removeItem('nexa-theme');
  }, []);

  // Listen for system theme changes with optimized handler
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem('nexa-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Memoized theme state value
  const themeStateValue = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isLoading,
  }), [theme, isLoading]);

  // Memoized theme actions value (never changes)
  const themeActionsValue = useMemo(() => ({
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    setTheme,
  }), [toggleTheme, setLightTheme, setDarkTheme, setAutoTheme]);

  return (
    <ThemeStateContext.Provider value={themeStateValue}>
      <ThemeActionsContext.Provider value={themeActionsValue}>
        {children}
      </ThemeActionsContext.Provider>
    </ThemeStateContext.Provider>
  );
};

// Optimized hooks for specific use cases
export const useThemeState = () => {
  const context = useContext(ThemeStateContext);
  if (!context) {
    throw new Error(t('theme.error.mustUseProvider'));
  }
  return context;
};

export const useThemeActions = () => {
  const context = useContext(ThemeActionsContext);
  if (!context) {
    throw new Error(t('theme.error.mustUseProvider'));
  }
  return context;
};

// Combined hook for backward compatibility
export const useOptimizedTheme = () => {
  const themeState = useThemeState();
  const themeActions = useThemeActions();

  return useMemo(() => ({
    ...themeState,
    ...themeActions,
  }), [themeState, themeActions]);
};

// Lightweight hooks for common use cases
export const useIsDarkTheme = () => {
  const { isDark } = useThemeState();
  return isDark;
};

export const useThemeToggle = () => {
  const { toggleTheme } = useThemeActions();
  return toggleTheme;
};

export const useCurrentTheme = () => {
  const { theme } = useThemeState();
  return theme;
};

// Theme utility functions (memoized)
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

export const getThemeColors = (theme) => {
  return themes[theme]?.colors || themes.light.colors;
};

// Performance monitoring wrapper (development only)
export const withThemePerformanceMonitoring = (Component) => {
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  return React.memo((props) => {
    const renderCount = React.useRef(0);
    renderCount.current += 1;
    
    React.useEffect(() => {
      console.log(`🎨 Theme Context Consumer "${Component.name || 'Anonymous'}" rendered ${renderCount.current} times`);
    });

    return <Component {...props} />;
  });
};

export default OptimizedThemeProvider; 