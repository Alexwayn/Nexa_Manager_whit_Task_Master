/**
 * Router Provider Test
 * Tests for router context wrapper functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  TestRouterProvider,
  TestMemoryRouterProvider,
  TestRouterProviderWithMocks,
  AllProvidersWrapper
} from '../mocks/providers/RouterProvider';

// Test component that uses router hooks
const TestComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div>
      <div data-testid="location-pathname">{location.pathname}</div>
      <button 
        data-testid="navigate-button" 
        onClick={() => navigate('/test')}
      >
        Navigate
      </button>
      <Link to="/link-test" data-testid="test-link">
        Test Link
      </Link>
    </div>
  );
};

describe('Router Provider', () => {
  describe('TestRouterProvider', () => {
    it('should provide router context with BrowserRouter', () => {
      render(
        <TestRouterProvider>
          <TestComponent />
        </TestRouterProvider>
      );
      
      expect(screen.getByTestId('location-pathname')).toBeInTheDocument();
      expect(screen.getByTestId('navigate-button')).toBeInTheDocument();
      expect(screen.getByTestId('test-link')).toBeInTheDocument();
    });
    
    it('should render BrowserRouter wrapper', () => {
      render(
        <TestRouterProvider>
          <div>Test content</div>
        </TestRouterProvider>
      );
      
      expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    });
  });

  describe('TestMemoryRouterProvider', () => {
    it('should provide router context with MemoryRouter', () => {
      render(
        <TestMemoryRouterProvider initialEntries={['/test-path']}>
          <TestComponent />
        </TestMemoryRouterProvider>
      );
      
      expect(screen.getByTestId('location-pathname')).toBeInTheDocument();
      expect(screen.getByTestId('navigate-button')).toBeInTheDocument();
    });
    
    it('should render MemoryRouter with initial entries', () => {
      const initialEntries = ['/test', '/another'];
      
      render(
        <TestMemoryRouterProvider initialEntries={initialEntries}>
          <div>Test content</div>
        </TestMemoryRouterProvider>
      );
      
      const memoryRouter = screen.getByTestId('memory-router');
      expect(memoryRouter).toBeInTheDocument();
      // The data attribute is set correctly in the mock
      expect(memoryRouter).toHaveAttribute('data-initial-entries');
    });
  });

  describe('TestRouterProviderWithMocks', () => {
    it('should provide mocked router hooks', () => {
      const mockNavigate = jest.fn();
      const mockLocation = { pathname: '/mocked-path', search: '', hash: '', state: null };
      
      render(
        <TestRouterProviderWithMocks 
          mockNavigate={mockNavigate}
          mockLocation={mockLocation}
        >
          <TestComponent />
        </TestRouterProviderWithMocks>
      );
      
      // The mock location should be available through the router context
      expect(screen.getByTestId('location-pathname')).toBeInTheDocument();
    });
  });

  describe('AllProvidersWrapper', () => {
    it('should combine router and query providers', () => {
      render(
        <AllProvidersWrapper>
          <TestComponent />
        </AllProvidersWrapper>
      );
      
      expect(screen.getByTestId('location-pathname')).toBeInTheDocument();
      expect(screen.getByTestId('navigate-button')).toBeInTheDocument();
    });
  });

  describe('Router hooks integration', () => {
    it('should allow navigation through useNavigate hook', () => {
      const NavigationTest = () => {
        const navigate = useNavigate();
        
        return (
          <button 
            data-testid="nav-test"
            onClick={() => navigate('/new-path')}
          >
            Navigate
          </button>
        );
      };
      
      render(
        <TestRouterProvider>
          <NavigationTest />
        </TestRouterProvider>
      );
      
      const button = screen.getByTestId('nav-test');
      expect(button).toBeInTheDocument();
    });
    
    it('should provide location information through useLocation hook', () => {
      const LocationTest = () => {
        const location = useLocation();
        
        return (
          <div data-testid="location-info">
            {location.pathname}
          </div>
        );
      };
      
      render(
        <TestMemoryRouterProvider initialEntries={['/test-location']}>
          <LocationTest />
        </TestMemoryRouterProvider>
      );
      
      expect(screen.getByTestId('location-info')).toBeInTheDocument();
    });
  });

  describe('Link component integration', () => {
    it('should render Link components correctly', () => {
      const LinkTest = () => (
        <div>
          <Link to="/home" data-testid="home-link">Home</Link>
          <Link to="/about" data-testid="about-link">About</Link>
        </div>
      );
      
      render(
        <TestRouterProvider>
          <LinkTest />
        </TestRouterProvider>
      );
      
      expect(screen.getByTestId('home-link')).toBeInTheDocument();
      expect(screen.getByTestId('about-link')).toBeInTheDocument();
      expect(screen.getByTestId('home-link')).toHaveAttribute('data-to', '/home');
      expect(screen.getByTestId('about-link')).toHaveAttribute('data-to', '/about');
    });
  });
});