import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyHighContrastMode } from '@/utils/contrastChecker';

// Translation function - to be integrated with i18n system
const t = (key, params) => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations = {
    // Theme Names
    'theme.light.name': 'Light',
    'theme.dark.name': 'Dark',
    'theme.highContrast.name': 'High Contrast',
    'theme.auto.name': 'Auto',

    // Error Messages
    'theme.error.mustUseProvider': 'useTheme must be used within a ThemeProvider',
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach(param => {
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
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colorBlindnessMode, setColorBlindnessMode] = useState(null);
  const [fontSize, setFontSize] = useState('medium');

  // Initialize theme and accessibility settings from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('nexa-theme');
    const savedHighContrast = localStorage.getItem('nexa-high-contrast') === 'true';
    const savedReducedMotion = localStorage.getItem('nexa-reduced-motion') === 'true';
    const savedColorBlindness = localStorage.getItem('nexa-color-blindness-mode');
    const savedFontSize = localStorage.getItem('nexa-font-size') || 'medium';

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const systemHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    setHighContrast(savedHighContrast || systemHighContrast);
    setReducedMotion(savedReducedMotion || systemReducedMotion);
    setColorBlindnessMode(savedColorBlindness);
    setFontSize(savedFontSize);
    setIsLoading(false);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;

    // Apply base theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply high contrast
    if (highContrast) {
      root.classList.add('high-contrast');
      applyHighContrastMode(true);
    } else {
      root.classList.remove('high-contrast');
      applyHighContrastMode(false);
    }

    // Apply reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply color blindness simulation
    if (colorBlindnessMode) {
      root.classList.add(`color-blind-${colorBlindnessMode}`);
    } else {
      // Remove all color blindness classes
      root.classList.remove(
        'color-blind-protanopia',
        'color-blind-deuteranopia',
        'color-blind-tritanopia',
      );
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${fontSize}`);

    // Save to localStorage
    localStorage.setItem('nexa-theme', theme);
    localStorage.setItem('nexa-high-contrast', highContrast.toString());
    localStorage.setItem('nexa-reduced-motion', reducedMotion.toString());
    localStorage.setItem('nexa-font-size', fontSize);
    if (colorBlindnessMode) {
      localStorage.setItem('nexa-color-blindness-mode', colorBlindnessMode);
    } else {
      localStorage.removeItem('nexa-color-blindness-mode');
    }
  }, [theme, isLoading, highContrast, reducedMotion, colorBlindnessMode, fontSize]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
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

  // Accessibility controls
  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  const setColorBlindnessSimulation = mode => {
    setColorBlindnessMode(mode === colorBlindnessMode ? null : mode);
  };

  const changeFontSize = size => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    if (sizes.includes(size)) {
      setFontSize(size);
    }
  };

  const increaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  // Reset all accessibility settings
  const resetAccessibilitySettings = () => {
    setHighContrast(false);
    setReducedMotion(false);
    setColorBlindnessMode(null);
    setFontSize('medium');
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleThemeChange = e => {
      if (!localStorage.getItem('nexa-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    const handleReducedMotionChange = e => {
      if (!localStorage.getItem('nexa-reduced-motion')) {
        setReducedMotion(e.matches);
      }
    };

    const handleHighContrastChange = e => {
      if (!localStorage.getItem('nexa-high-contrast')) {
        setHighContrast(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  const value = {
    // Basic theme
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    isLoading,

    // Accessibility features
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    colorBlindnessMode,
    setColorBlindnessSimulation,
    fontSize,
    changeFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetAccessibilitySettings,

    // Computed accessibility state
    isAccessibilityModeActive:
      highContrast || reducedMotion || colorBlindnessMode || fontSize !== 'medium',
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

// Enhanced theme configurations with accessibility support
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
    accessibility: {
      contrastRatio: 4.5,
      focusColor: '#2563eb',
      errorColor: '#dc2626',
      successColor: '#16a34a',
      warningColor: '#d97706',
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
    accessibility: {
      contrastRatio: 4.5,
      focusColor: '#60a5fa',
      errorColor: '#f87171',
      successColor: '#4ade80',
      warningColor: '#fbbf24',
    },
  },
  highContrast: {
    name: t('theme.highContrast.name'),
    value: 'high-contrast',
    colors: {
      background: 'bg-white',
      surface: 'bg-white',
      text: 'text-black',
      textSecondary: 'text-black',
      border: 'border-black',
      hover: 'hover:bg-gray-100',
    },
    accessibility: {
      contrastRatio: 7.0,
      focusColor: '#000000',
      errorColor: '#cc0000',
      successColor: '#008000',
      warningColor: '#ff8800',
    },
  },
};

// Font size configurations
export const fontSizes = {
  small: {
    name: 'Small',
    scale: 0.875,
    className: 'font-small',
  },
  medium: {
    name: 'Medium',
    scale: 1,
    className: 'font-medium',
  },
  large: {
    name: 'Large',
    scale: 1.125,
    className: 'font-large',
  },
  xlarge: {
    name: 'Extra Large',
    scale: 1.25,
    className: 'font-xlarge',
  },
};

// Color blindness simulation modes
export const colorBlindnessModes = {
  protanopia: {
    name: 'Protanopia (Red-Blind)',
    description: 'Difficulty distinguishing between red and green',
  },
  deuteranopia: {
    name: 'Deuteranopia (Green-Blind)',
    description: 'Difficulty distinguishing between red and green',
  },
  tritanopia: {
    name: 'Tritanopia (Blue-Blind)',
    description: 'Difficulty distinguishing between blue and yellow',
  },
};

// Theme utility functions
export const getThemeColors = (theme, accessibility = {}) => {
  const baseTheme = themes[theme] || themes.light;
  return {
    ...baseTheme.colors,
    ...baseTheme.accessibility,
    ...accessibility,
  };
};

export const getAccessibilityClass = (highContrast, reducedMotion, fontSize) => {
  const classes = [];

  if (highContrast) classes.push('high-contrast');
  if (reducedMotion) classes.push('reduce-motion');
  if (fontSize !== 'medium') classes.push(`font-${fontSize}`);

  return classes.join(' ');
};

export default ThemeContext;
