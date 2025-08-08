/**
 * Test Wrappers Utilities
 * Provides convenient wrapper functions for testing components with theme and UI contexts
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  AllProvidersWrapper,
  MinimalProvidersWrapper,
  ThemeOnlyWrapper,
  UIOnlyWrapper,
  TestThemeProvider,
  TestUIProvider,
  TestToastProvider
} from '../mocks/providers';

/**
 * Custom render function with providers
 * This is the recommended render function for most tests
 * Automatically wraps components with essential providers
 */
export const customRender = (ui, options = {}) => {
  const {
    // Provider configuration options
    providers = 'all', // 'all', 'minimal', 'theme', 'ui', 'none'
    routerProps = {},
    queryProps = {},
    themeProps = { theme: 'light' },
    uiProps = {},
    
    // React Testing Library options
    ...renderOptions
  } = options;

  // Choose wrapper based on providers option
  let Wrapper;
  
  switch (providers) {
    case 'all':
      Wrapper = ({ children }) => (
        <AllProvidersWrapper
          routerProps={routerProps}
          queryProps={queryProps}
          themeProps={themeProps}
          uiProps={uiProps}
        >
          {children}
        </AllProvidersWrapper>
      );
      break;
      
    case 'minimal':
      Wrapper = ({ children }) => (
        <MinimalProvidersWrapper themeProps={themeProps}>
          {children}
        </MinimalProvidersWrapper>
      );
      break;
      
    case 'theme':
      Wrapper = ({ children }) => (
        <ThemeOnlyWrapper {...themeProps}>
          {children}
        </ThemeOnlyWrapper>
      );
      break;
      
    case 'ui':
      Wrapper = ({ children }) => (
        <UIOnlyWrapper {...uiProps}>
          {children}
        </UIOnlyWrapper>
      );
      break;
      
    case 'none':
    default:
      Wrapper = ({ children }) => children;
      break;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Default render function - uses all providers by default
 * This can be used as a drop-in replacement for RTL's render
 */
export const renderWithProviders = (ui, options = {}) => {
  return customRender(ui, { providers: 'all', ...options });
};

/**
 * Render component with all providers (theme, UI, router, query)
 * Use this for comprehensive integration tests
 */
export const renderWithAllProviders = (component, options = {}) => {
  const {
    routerProps = {},
    queryProps = {},
    themeProps = {},
    uiProps = {},
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <AllProvidersWrapper
      routerProps={routerProps}
      queryProps={queryProps}
      themeProps={themeProps}
      uiProps={uiProps}
    >
      {children}
    </AllProvidersWrapper>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render component with minimal providers (theme + router)
 * Use this for basic component tests
 */
export const renderWithMinimalProviders = (component, options = {}) => {
  const { themeProps = {}, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <MinimalProvidersWrapper themeProps={themeProps}>
      {children}
    </MinimalProvidersWrapper>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render component with theme provider only
 * Use this for testing theme-specific functionality
 */
export const renderWithTheme = (component, options = {}) => {
  const { theme = 'light', ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <ThemeOnlyWrapper theme={theme} {...renderOptions}>
      {children}
    </ThemeOnlyWrapper>
  );

  return render(component, { wrapper: Wrapper });
};

/**
 * Render component with UI providers only
 * Use this for testing UI-specific functionality (toasts, modals, etc.)
 */
export const renderWithUI = (component, options = {}) => {
  const { uiProps = {}, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <UIOnlyWrapper {...uiProps}>
      {children}
    </UIOnlyWrapper>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Render component with theme and UI providers
 * Use this for testing components that use both theme and UI functionality
 */
export const renderWithThemeAndUI = (component, options = {}) => {
  const { 
    theme = 'light', 
    themeProps = {}, 
    uiProps = {}, 
    ...renderOptions 
  } = options;

  const Wrapper = ({ children }) => (
    <TestThemeProvider theme={theme} {...themeProps}>
      <TestUIProvider {...uiProps}>
        <TestToastProvider>
          {children}
        </TestToastProvider>
      </TestUIProvider>
    </TestThemeProvider>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Create a custom wrapper with specific providers
 * Use this for advanced test scenarios with custom provider configurations
 */
export const createCustomWrapper = (providers = []) => {
  return ({ children }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
};

/**
 * Test utilities for theme testing
 */
export const themeTestUtils = {
  /**
   * Test component in both light and dark themes
   */
  testInBothThemes: (component, testFn) => {
    describe('Theme Tests', () => {
      test('renders correctly in light theme', () => {
        const { container } = renderWithTheme(component, { theme: 'light' });
        testFn(container, 'light');
      });

      test('renders correctly in dark theme', () => {
        const { container } = renderWithTheme(component, { theme: 'dark' });
        testFn(container, 'dark');
      });
    });
  },

  /**
   * Get theme-specific test props
   */
  getThemeProps: (theme = 'light') => ({
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    effectiveTheme: theme
  })
};

/**
 * Test utilities for UI testing
 */
export const uiTestUtils = {
  /**
   * Get mock toast functions for assertions
   */
  getMockToast: () => {
    const mockToast = require('../mocks/react-hot-toast');
    return mockToast.toast;
  },

  /**
   * Clear all mock calls for UI functions
   */
  clearUIMocks: () => {
    const mockToast = require('../mocks/react-hot-toast');
    Object.values(mockToast.toast).forEach(fn => {
      if (jest.isMockFunction(fn)) {
        fn.mockClear();
      }
    });
  }
};

// Export all utilities
export default {
  customRender,
  renderWithProviders,
  renderWithAllProviders,
  renderWithMinimalProviders,
  renderWithTheme,
  renderWithUI,
  renderWithThemeAndUI,
  createCustomWrapper,
  themeTestUtils,
  uiTestUtils
};