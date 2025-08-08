/**
 * Theme Provider Mock for Tests
 * Provides theme context for testing components that use theme functionality
 */

import React from 'react';

// Mock theme values
const mockThemeState = {
  theme: 'light',
  isLoading: false,
  isDark: false,
  isLight: true,
  systemTheme: 'light',
  effectiveTheme: 'light'
};

const mockThemeActions = {
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  setSystemTheme: jest.fn(),
  applyTheme: jest.fn(),
  resetTheme: jest.fn()
};

const mockThemeValue = {
  ...mockThemeState,
  ...mockThemeActions
};

/**
 * Test Theme Provider with mock theme context
 * Use this for testing components that use theme functionality
 */
export const TestThemeProvider = ({ 
  children, 
  theme = 'light',
  isLoading = false,
  customValues = {}
}) => {
  const themeValue = {
    ...mockThemeValue,
    theme,
    isLoading,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    effectiveTheme: theme,
    ...customValues
  };

  // Mock the theme context
  const MockThemeContext = React.createContext(themeValue);
  
  return (
    <MockThemeContext.Provider value={themeValue}>
      {children}
    </MockThemeContext.Provider>
  );
};

/**
 * Optimized Theme Provider mock for tests
 * Mirrors the OptimizedThemeProvider structure
 */
export const TestOptimizedThemeProvider = ({ 
  children, 
  theme = 'light',
  isLoading = false 
}) => {
  const themeStateValue = {
    theme,
    isLoading,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    systemTheme: 'light',
    effectiveTheme: theme
  };

  const themeActionsValue = {
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
    setSystemTheme: jest.fn(),
    applyTheme: jest.fn(),
    resetTheme: jest.fn()
  };

  // Mock both contexts for optimized provider
  const MockThemeStateContext = React.createContext(themeStateValue);
  const MockThemeActionsContext = React.createContext(themeActionsValue);
  
  return (
    <MockThemeStateContext.Provider value={themeStateValue}>
      <MockThemeActionsContext.Provider value={themeActionsValue}>
        {children}
      </MockThemeActionsContext.Provider>
    </MockThemeStateContext.Provider>
  );
};

/**
 * Theme Provider with custom theme configuration
 */
export const TestThemeProviderWithConfig = ({ 
  children, 
  config = {} 
}) => {
  const defaultConfig = {
    theme: 'light',
    isLoading: false,
    themes: ['light', 'dark'],
    colors: {
      light: { primary: '#000', background: '#fff' },
      dark: { primary: '#fff', background: '#000' }
    }
  };

  const themeConfig = { ...defaultConfig, ...config };
  
  return (
    <TestThemeProvider customValues={themeConfig}>
      {children}
    </TestThemeProvider>
  );
};

// Export mock theme hooks
export const mockUseTheme = () => mockThemeValue;
export const mockUseThemeState = () => mockThemeState;
export const mockUseThemeActions = () => mockThemeActions;

// Export default provider
export default TestThemeProvider;