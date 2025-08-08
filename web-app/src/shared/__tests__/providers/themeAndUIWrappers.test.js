/**
 * Theme and UI Context Wrappers Test
 * Verifies that theme and UI context wrappers work correctly in tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TestThemeProvider,
  TestUIProvider,
  TestToastProvider,
  AllProvidersWrapper,
  MinimalProvidersWrapper
} from '../mocks/providers';
import {
  renderWithTheme,
  renderWithUI,
  renderWithThemeAndUI,
  renderWithAllProviders,
  themeTestUtils,
  uiTestUtils
} from '../utils/testWrappers';

// Mock react-hot-toast
jest.mock('react-hot-toast');

// Test component that uses theme context
const ThemeTestComponent = () => {
  return (
    <div data-testid="theme-component">
      <span data-testid="theme-indicator">Theme Component</span>
    </div>
  );
};

// Test component that uses UI context
const UITestComponent = () => {
  return (
    <div data-testid="ui-component">
      <span data-testid="ui-indicator">UI Component</span>
    </div>
  );
};

describe('Theme and UI Context Wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Provider Tests', () => {
    test('TestThemeProvider renders children correctly', () => {
      render(
        <TestThemeProvider>
          <ThemeTestComponent />
        </TestThemeProvider>
      );

      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
      expect(screen.getByTestId('theme-indicator')).toHaveTextContent('Theme Component');
    });

    test('TestThemeProvider accepts theme prop', () => {
      render(
        <TestThemeProvider theme="dark">
          <ThemeTestComponent />
        </TestThemeProvider>
      );

      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });

    test('TestThemeProvider accepts custom values', () => {
      const customValues = { customProp: 'test-value' };
      
      render(
        <TestThemeProvider customValues={customValues}>
          <ThemeTestComponent />
        </TestThemeProvider>
      );

      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });
  });

  describe('UI Provider Tests', () => {
    test('TestUIProvider renders children correctly', () => {
      render(
        <TestUIProvider>
          <UITestComponent />
        </TestUIProvider>
      );

      expect(screen.getByTestId('ui-component')).toBeInTheDocument();
      expect(screen.getByTestId('ui-indicator')).toHaveTextContent('UI Component');
    });

    test('TestToastProvider renders children correctly', () => {
      render(
        <TestToastProvider>
          <UITestComponent />
        </TestToastProvider>
      );

      expect(screen.getByTestId('ui-component')).toBeInTheDocument();
    });
  });

  describe('Combined Provider Tests', () => {
    test('AllProvidersWrapper renders children correctly', () => {
      render(
        <AllProvidersWrapper>
          <ThemeTestComponent />
        </AllProvidersWrapper>
      );

      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });

    test('MinimalProvidersWrapper renders children correctly', () => {
      render(
        <MinimalProvidersWrapper>
          <ThemeTestComponent />
        </MinimalProvidersWrapper>
      );

      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });
  });

  describe('Test Wrapper Utilities', () => {
    test('renderWithTheme works correctly', () => {
      renderWithTheme(<ThemeTestComponent />, { theme: 'dark' });
      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });

    test('renderWithUI works correctly', () => {
      renderWithUI(<UITestComponent />);
      expect(screen.getByTestId('ui-component')).toBeInTheDocument();
    });

    test('renderWithThemeAndUI works correctly', () => {
      renderWithThemeAndUI(<ThemeTestComponent />);
      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });

    test('renderWithAllProviders works correctly', () => {
      renderWithAllProviders(<ThemeTestComponent />);
      expect(screen.getByTestId('theme-component')).toBeInTheDocument();
    });
  });

  describe('Theme Test Utilities', () => {
    test('themeTestUtils.getThemeProps returns correct props', () => {
      const lightProps = themeTestUtils.getThemeProps('light');
      expect(lightProps).toEqual({
        theme: 'light',
        isDark: false,
        isLight: true,
        effectiveTheme: 'light'
      });

      const darkProps = themeTestUtils.getThemeProps('dark');
      expect(darkProps).toEqual({
        theme: 'dark',
        isDark: true,
        isLight: false,
        effectiveTheme: 'dark'
      });
    });
  });

  describe('UI Test Utilities', () => {
    test('uiTestUtils.getMockToast returns mock functions', () => {
      const mockToast = uiTestUtils.getMockToast();
      
      expect(mockToast.success).toBeDefined();
      expect(mockToast.error).toBeDefined();
      expect(mockToast.loading).toBeDefined();
      expect(jest.isMockFunction(mockToast.success)).toBe(true);
    });

    test('uiTestUtils.clearUIMocks clears mock calls', () => {
      const mockToast = uiTestUtils.getMockToast();
      mockToast.success('test');
      
      expect(mockToast.success).toHaveBeenCalledWith('test');
      
      uiTestUtils.clearUIMocks();
      expect(mockToast.success).not.toHaveBeenCalled();
    });
  });

  describe('Mock Integration', () => {
    test('react-hot-toast mock is properly configured', () => {
      const mockToast = require('../mocks/react-hot-toast');
      
      expect(mockToast.default).toBeDefined();
      expect(mockToast.toast).toBeDefined();
      expect(mockToast.Toaster).toBeDefined();
      
      // Test that mock functions exist
      expect(jest.isMockFunction(mockToast.toast.success)).toBe(true);
      expect(jest.isMockFunction(mockToast.toast.error)).toBe(true);
    });
  });
});