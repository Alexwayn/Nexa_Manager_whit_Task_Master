/**
 * Router Context Wrapper for Tests
 * Provides React Router context for testing components that use routing
 */

import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

/**
 * Router Provider for tests with BrowserRouter
 * Use this for most component tests that need router context
 */
export const TestRouterProvider = ({ children, initialEntries = ['/'] }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

/**
 * Memory Router Provider for tests with controlled routing
 * Use this for tests that need specific route states or navigation testing
 */
export const TestMemoryRouterProvider = ({ 
  children, 
  initialEntries = ['/'], 
  initialIndex = 0 
}) => {
  return (
    <MemoryRouter 
      initialEntries={initialEntries} 
      initialIndex={initialIndex}
    >
      {children}
    </MemoryRouter>
  );
};

/**
 * Router Provider with mock navigation hooks
 * Use this for tests that need to mock navigation behavior
 */
export const TestRouterProviderWithMocks = ({ 
  children, 
  mockNavigate = jest.fn(),
  mockLocation = { pathname: '/', search: '', hash: '', state: null },
  mockParams = {}
}) => {
  // Mock the router hooks before rendering
  const mockUseNavigate = () => mockNavigate;
  const mockUseLocation = () => mockLocation;
  const mockUseParams = () => mockParams;
  
  // Apply mocks
  jest.doMock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: mockUseNavigate,
    useLocation: mockUseLocation,
    useParams: mockUseParams,
  }));

  return (
    <MemoryRouter initialEntries={[mockLocation.pathname]}>
      {children}
    </MemoryRouter>
  );
};

/**
 * Default router provider for general testing
 * Combines BrowserRouter with common test setup
 */
export const DefaultTestRouterProvider = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

/**
 * Router provider with route configuration for integration tests
 * Use this for testing complete routing scenarios
 */
export const TestRouterWithRoutes = ({ 
  children, 
  routes = [], 
  initialEntries = ['/'] 
}) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
};

// Export default provider
export default TestRouterProvider;

// Re-export combined wrapper for tests expecting it from this module
export { AllProvidersWrapper } from './index';