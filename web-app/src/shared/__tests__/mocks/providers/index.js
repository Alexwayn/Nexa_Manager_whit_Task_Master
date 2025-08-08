/**
 * Test Providers Index
 * Centralized exports for all test provider wrappers
 */

// Router providers
export {
  TestRouterProvider,
  TestMemoryRouterProvider,
  TestRouterProviderWithMocks,
  DefaultTestRouterProvider,
  TestRouterWithRoutes,
  default as RouterProvider
} from './RouterProvider';

// Query provider
export { TestQueryProvider } from './QueryProvider';

// Theme providers
export {
  TestThemeProvider,
  TestOptimizedThemeProvider,
  TestThemeProviderWithConfig,
  mockUseTheme,
  mockUseThemeState,
  mockUseThemeActions
} from './ThemeProvider';

// UI providers
export {
  TestUIProvider,
  TestToastProvider,
  TestModalProvider,
  TestNotificationProvider,
  TestCombinedUIProvider,
  mockUseUI,
  mockUseToast,
  mockUseModal
} from './UIProvider';

/**
 * Combined provider wrapper for comprehensive testing
 * Includes all common providers needed for most tests
 */
import React from 'react';
import { TestRouterProvider } from './RouterProvider';
import { TestQueryProvider } from './QueryProvider';
import { TestThemeProvider } from './ThemeProvider';
import { TestCombinedUIProvider } from './UIProvider';

export const AllProvidersWrapper = ({ 
  children,
  routerProps = {},
  queryProps = {},
  themeProps = {},
  uiProps = {}
}) => {
  return (
    <TestQueryProvider {...queryProps}>
      <TestThemeProvider {...themeProps}>
        <TestCombinedUIProvider {...uiProps}>
          <TestRouterProvider {...routerProps}>
            {children}
          </TestRouterProvider>
        </TestCombinedUIProvider>
      </TestThemeProvider>
    </TestQueryProvider>
  );
};

/**
 * Minimal provider wrapper for basic tests
 * Only includes essential providers
 */
export const MinimalProvidersWrapper = ({ children, themeProps = {} }) => {
  return (
    <TestThemeProvider {...themeProps}>
      <TestRouterProvider>
        {children}
      </TestRouterProvider>
    </TestThemeProvider>
  );
};

/**
 * Theme-only wrapper for testing theme-specific functionality
 */
export const ThemeOnlyWrapper = ({ children, ...themeProps }) => {
  return (
    <TestThemeProvider {...themeProps}>
      {children}
    </TestThemeProvider>
  );
};

/**
 * UI-only wrapper for testing UI-specific functionality
 */
export const UIOnlyWrapper = ({ children, ...uiProps }) => {
  return (
    <TestCombinedUIProvider {...uiProps}>
      {children}
    </TestCombinedUIProvider>
  );
};