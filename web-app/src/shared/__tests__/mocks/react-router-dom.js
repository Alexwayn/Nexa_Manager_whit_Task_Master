/**
 * React Router DOM Mock
 * Comprehensive mock for react-router-dom to support routing in tests
 */

import React from 'react';

// Mock navigation function
const mockNavigate = jest.fn();

// Mock location object
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

// Mock params object
const mockParams = {};

// Mock search params
const mockSearchParams = new URLSearchParams();

// Mock router hooks
export const useNavigate = jest.fn(() => mockNavigate);
export const useLocation = jest.fn(() => mockLocation);
export const useParams = jest.fn(() => mockParams);
export const useSearchParams = jest.fn(() => [mockSearchParams, jest.fn()]);

// Mock router components
export const BrowserRouter = ({ children }) => (
  <div data-testid="browser-router">{children}</div>
);

export const MemoryRouter = ({ children, initialEntries = ['/'], initialIndex = 0 }) => (
  <div data-testid="memory-router" data-initial-entries={JSON.stringify(initialEntries)}>
    {children}
  </div>
);

export const HashRouter = ({ children }) => (
  <div data-testid="hash-router">{children}</div>
);

export const Router = ({ children, location, navigator }) => (
  <div data-testid="router">{children}</div>
);

// Mock route components
export const Routes = ({ children }) => (
  <div data-testid="routes">{children}</div>
);

export const Route = ({ path, element, children, ...props }) => (
  <div data-testid="route" data-path={path} {...props}>
    {element || children}
  </div>
);

// Mock navigation components
export const Link = ({ to, children, className, ...props }) => (
  <a 
    href={to} 
    className={className}
    data-testid="router-link" 
    data-to={to}
    onClick={(e) => {
      e.preventDefault();
      mockNavigate(to);
    }}
    {...props}
  >
    {children}
  </a>
);

export const NavLink = ({ to, children, className, activeClassName, ...props }) => (
  <a 
    href={to} 
    className={`${className} ${activeClassName || ''}`}
    data-testid="router-navlink" 
    data-to={to}
    onClick={(e) => {
      e.preventDefault();
      mockNavigate(to);
    }}
    {...props}
  >
    {children}
  </a>
);

// Mock outlet component
export const Outlet = ({ context }) => (
  <div data-testid="outlet" data-context={JSON.stringify(context)} />
);

// Mock navigate component
export const Navigate = ({ to, replace = false, state }) => {
  React.useEffect(() => {
    mockNavigate(to, { replace, state });
  }, [to, replace, state]);
  
  return null;
};

// Mock utility functions
export const generatePath = (path, params = {}) => {
  let result = path;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
};

export const matchPath = (pattern, pathname) => {
  if (typeof pattern === 'string') {
    return pattern === pathname ? { pathname, params: {} } : null;
  }
  
  const { path, exact = false, sensitive = false } = pattern;
  const regex = new RegExp(
    `^${path.replace(/:\w+/g, '([^/]+)')}${exact ? '$' : ''}`,
    sensitive ? '' : 'i'
  );
  
  const match = pathname.match(regex);
  if (!match) return null;
  
  const paramNames = (path.match(/:\w+/g) || []).map(p => p.slice(1));
  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  
  return { pathname, params };
};

export const resolvePath = (to, fromPathname = '/') => {
  if (to.startsWith('/')) return { pathname: to };
  
  const segments = fromPathname.split('/').filter(Boolean);
  const toSegments = to.split('/').filter(Boolean);
  
  toSegments.forEach(segment => {
    if (segment === '..') {
      segments.pop();
    } else if (segment !== '.') {
      segments.push(segment);
    }
  });
  
  return { pathname: '/' + segments.join('/') };
};

// Mock history utilities
export const createBrowserHistory = () => ({
  length: 1,
  action: 'POP',
  location: mockLocation,
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  listen: jest.fn(() => jest.fn()),
  block: jest.fn(() => jest.fn()),
});

export const createMemoryHistory = (options = {}) => ({
  length: 1,
  action: 'POP',
  location: mockLocation,
  index: 0,
  entries: options.initialEntries || ['/'],
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  listen: jest.fn(() => jest.fn()),
  block: jest.fn(() => jest.fn()),
});

export const createHashHistory = () => ({
  length: 1,
  action: 'POP',
  location: mockLocation,
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  listen: jest.fn(() => jest.fn()),
  block: jest.fn(() => jest.fn()),
});

// Mock router context
export const UNSAFE_LocationContext = React.createContext(mockLocation);
export const UNSAFE_NavigationContext = React.createContext({
  basename: '',
  navigator: createBrowserHistory(),
  static: false,
});
export const UNSAFE_RouteContext = React.createContext({
  outlet: null,
  matches: [],
});

// Utility functions for tests
export const __setMockLocation = (newLocation) => {
  Object.assign(mockLocation, newLocation);
};

export const __setMockParams = (newParams) => {
  Object.assign(mockParams, newParams);
};

export const __getMockNavigate = () => mockNavigate;

export const __resetMocks = () => {
  mockNavigate.mockClear();
  Object.assign(mockLocation, {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default'
  });
  Object.keys(mockParams).forEach(key => delete mockParams[key]);
  // Clear search params safely (URLSearchParams has no clear() in JSDOM)
  Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));
};

// Default export for compatibility
export default {
  BrowserRouter,
  MemoryRouter,
  HashRouter,
  Router,
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  generatePath,
  matchPath,
  resolvePath,
  createBrowserHistory,
  createMemoryHistory,
  createHashHistory,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  __setMockLocation,
  __setMockParams,
  __getMockNavigate,
  __resetMocks,
};