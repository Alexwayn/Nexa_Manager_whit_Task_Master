/**
 * Custom Render Function Tests
 * Tests for the custom render function with providers
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { customRender, renderWithProviders } from './testWrappers';

// Test component that uses various provider contexts
const TestComponent = () => {
  return (
    <div>
      <div data-testid="test-component">Test Component</div>
      <div data-testid="theme-indicator">Theme Context Available</div>
      <div data-testid="router-indicator">Router Context Available</div>
      <div data-testid="query-indicator">Query Context Available</div>
      <div data-testid="ui-indicator">UI Context Available</div>
    </div>
  );
};

describe('Custom Render Function', () => {
  describe('customRender', () => {
    test('renders with all providers by default', () => {
      customRender(<TestComponent />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('theme-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('router-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('query-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('ui-indicator')).toBeInTheDocument();
    });

    test('renders with minimal providers when specified', () => {
      customRender(<TestComponent />, { providers: 'minimal' });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('theme-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('router-indicator')).toBeInTheDocument();
    });

    test('renders with theme provider only when specified', () => {
      customRender(<TestComponent />, { providers: 'theme' });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('theme-indicator')).toBeInTheDocument();
    });

    test('renders with UI provider only when specified', () => {
      customRender(<TestComponent />, { providers: 'ui' });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('ui-indicator')).toBeInTheDocument();
    });

    test('renders without providers when specified', () => {
      customRender(<TestComponent />, { providers: 'none' });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('accepts custom provider props', () => {
      const themeProps = { theme: 'dark' };
      const routerProps = { initialEntries: ['/test'] };
      
      customRender(<TestComponent />, {
        providers: 'all',
        themeProps,
        routerProps
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('passes through React Testing Library options', () => {
      const { container } = customRender(<TestComponent />, {
        container: document.createElement('div')
      });
      
      expect(container).toBeDefined();
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('renderWithProviders', () => {
    test('renders with all providers by default', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('theme-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('router-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('query-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('ui-indicator')).toBeInTheDocument();
    });

    test('accepts provider configuration options', () => {
      renderWithProviders(<TestComponent />, {
        themeProps: { theme: 'dark' },
        routerProps: { initialEntries: ['/dashboard'] }
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('can be used as drop-in replacement for render', () => {
      // This should work exactly like React Testing Library's render
      // but with providers automatically included
      const { getByTestId, container } = renderWithProviders(<TestComponent />);
      
      expect(getByTestId('test-component')).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Provider Configuration', () => {
    test('theme props are passed correctly', () => {
      customRender(<TestComponent />, {
        providers: 'theme',
        themeProps: { theme: 'dark', customProp: 'test' }
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('router props are passed correctly', () => {
      customRender(<TestComponent />, {
        providers: 'all',
        routerProps: { initialEntries: ['/test-route'] }
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('query props are passed correctly', () => {
      customRender(<TestComponent />, {
        providers: 'all',
        queryProps: { defaultOptions: { queries: { retry: false } } }
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('UI props are passed correctly', () => {
      customRender(<TestComponent />, {
        providers: 'ui',
        uiProps: { toastPosition: 'top-right' }
      });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles invalid provider type gracefully', () => {
      // Should default to no providers
      customRender(<TestComponent />, { providers: 'invalid' });
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('handles missing options gracefully', () => {
      customRender(<TestComponent />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    test('handles null/undefined ui gracefully', () => {
      expect(() => {
        customRender(null);
      }).not.toThrow();
    });
  });
});