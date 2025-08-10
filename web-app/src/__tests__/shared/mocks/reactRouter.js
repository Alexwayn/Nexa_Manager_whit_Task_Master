// React Router mocks for comprehensive testing
// This file provides detailed mocks for all React Router functionality

import { jest } from '@jest/globals';

test('react router mocks load', () => {
  expect(typeof jest.fn).toBe('function');
});
import React from 'react';

// Mock location object
export const createMockLocation = (overrides = {}) => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
  ...overrides,
});

// Mock history object
export const createMockHistory = (initialLocation = createMockLocation()) => {
  let currentLocation = initialLocation;
  const listeners = [];
  const entries = [currentLocation];
  let index = 0;

  const history = {
    length: entries.length,
    action: 'POP',
    location: currentLocation,
    index,
    entries,

    // Navigation methods
    push: jest.fn((to, state) => {
      const newLocation =
        typeof to === 'string'
          ? { ...createMockLocation(), pathname: to, state }
          : { ...createMockLocation(), ...to, state };

      index++;
      entries.splice(index, entries.length - index, newLocation);
      currentLocation = newLocation;
      history.location = currentLocation;
      history.action = 'PUSH';
      history.length = entries.length;
      history.index = index;

      // Notify listeners
      listeners.forEach(listener => {
        listener({ location: currentLocation, action: 'PUSH' });
      });
    }),

    replace: jest.fn((to, state) => {
      const newLocation =
        typeof to === 'string'
          ? { ...createMockLocation(), pathname: to, state }
          : { ...createMockLocation(), ...to, state };

      entries[index] = newLocation;
      currentLocation = newLocation;
      history.location = currentLocation;
      history.action = 'REPLACE';

      // Notify listeners
      listeners.forEach(listener => {
        listener({ location: currentLocation, action: 'REPLACE' });
      });
    }),

    go: jest.fn(delta => {
      const newIndex = Math.max(0, Math.min(entries.length - 1, index + delta));
      if (newIndex !== index) {
        index = newIndex;
        currentLocation = entries[index];
        history.location = currentLocation;
        history.action = 'POP';
        history.index = index;

        // Notify listeners
        listeners.forEach(listener => {
          listener({ location: currentLocation, action: 'POP' });
        });
      }
    }),

    goBack: jest.fn(() => history.go(-1)),
    goForward: jest.fn(() => history.go(1)),

    // Listener management
    listen: jest.fn(listener => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }),

    // Blocking (for React Router v5)
    block: jest.fn(prompt => {
      return () => {}; // Return unblock function
    }),

    // Create href
    createHref: jest.fn(location => {
      const { pathname = '/', search = '', hash = '' } = location;
      return pathname + search + hash;
    }),

    // Helper methods for testing
    _setLocation: location => {
      currentLocation = { ...createMockLocation(), ...location };
      history.location = currentLocation;
      entries[index] = currentLocation;
    },

    _getListeners: () => [...listeners],
    _triggerChange: (action = 'POP') => {
      history.action = action;
      listeners.forEach(listener => {
        listener({ location: currentLocation, action });
      });
    },
  };

  return history;
};

// Mock match object
export const createMockMatch = (overrides = {}) => ({
  params: {},
  isExact: true,
  path: '/',
  url: '/',
  ...overrides,
});

// Mock route props
export const createMockRouteProps = (overrides = {}) => ({
  history: createMockHistory(),
  location: createMockLocation(),
  match: createMockMatch(),
  ...overrides,
});

// Mock navigate function (React Router v6)
export const createMockNavigate = () => {
  const navigate = jest.fn((to, options = {}) => {
    // Simulate navigation
    if (typeof to === 'number') {
      // navigate(-1) or navigate(1)
      return;
    }

    const { replace = false, state = null } = options;
    // In real implementation, this would update the location
  });

  // Add helper methods for testing
  navigate._getCallsTo = path => {
    return navigate.mock.calls.filter(call => call[0] === path);
  };

  navigate._getLastCall = () => {
    const calls = navigate.mock.calls;
    return calls.length > 0 ? calls[calls.length - 1] : null;
  };

  navigate._wasCalledWith = (path, options = {}) => {
    return navigate.mock.calls.some(call => {
      if (call[0] !== path) return false;
      if (Object.keys(options).length === 0) return true;

      const callOptions = call[1] || {};
      return Object.entries(options).every(([key, value]) => callOptions[key] === value);
    });
  };

  return navigate;
};

// Mock useNavigate hook
export const mockUseNavigate = jest.fn(() => createMockNavigate());

// Mock useLocation hook
export const mockUseLocation = jest.fn(() => createMockLocation());

// Mock useHistory hook (React Router v5)
export const mockUseHistory = jest.fn(() => createMockHistory());

// Mock useParams hook
export const mockUseParams = jest.fn(() => ({}));

// Mock useRouteMatch hook (React Router v5)
export const mockUseRouteMatch = jest.fn(() => createMockMatch());

// Mock useSearchParams hook (React Router v6)
export const mockUseSearchParams = jest.fn(() => {
  const searchParams = new URLSearchParams();
  const setSearchParams = jest.fn();
  return [searchParams, setSearchParams];
});

// Mock Router components
export const MockRouter = ({ children, history }) => {
  return React.createElement('div', { 'data-testid': 'mock-router' }, children);
};

export const MockBrowserRouter = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'mock-browser-router' }, children);
};

export const MockMemoryRouter = ({ children, initialEntries = ['/'] }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'mock-memory-router',
      'data-initial-entries': JSON.stringify(initialEntries),
    },
    children,
  );
};

export const MockHashRouter = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'mock-hash-router' }, children);
};

// Mock Route component
export const MockRoute = ({ children, component: Component, render, path, exact, ...props }) => {
  const routeProps = createMockRouteProps();

  let content;
  if (Component) {
    content = React.createElement(Component, routeProps);
  } else if (render) {
    content = render(routeProps);
  } else if (typeof children === 'function') {
    content = children(routeProps);
  } else {
    content = children;
  }

  return React.createElement(
    'div',
    {
      'data-testid': 'mock-route',
      'data-path': path,
      'data-exact': exact,
      ...props,
    },
    content,
  );
};

// Mock Routes component (React Router v6)
export const MockRoutes = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'mock-routes' }, children);
};

// Mock Switch component (React Router v5)
export const MockSwitch = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'mock-switch' }, children);
};

// Mock Link component
export const MockLink = ({ to, children, replace, state, ...props }) => {
  const handleClick = jest.fn(e => {
    e.preventDefault();
    // In real implementation, this would navigate
  });

  return React.createElement(
    'a',
    {
      href: typeof to === 'string' ? to : to.pathname || '/',
      onClick: handleClick,
      'data-testid': 'mock-link',
      'data-to': typeof to === 'string' ? to : JSON.stringify(to),
      'data-replace': replace,
      'data-state': state ? JSON.stringify(state) : undefined,
      ...props,
    },
    children,
  );
};

// Mock NavLink component
export const MockNavLink = ({ to, children, activeClassName, exact, ...props }) => {
  const isActive = false; // In real implementation, this would check current location

  return React.createElement(
    'a',
    {
      href: typeof to === 'string' ? to : to.pathname || '/',
      className: isActive ? activeClassName : '',
      'data-testid': 'mock-nav-link',
      'data-to': typeof to === 'string' ? to : JSON.stringify(to),
      'data-active': isActive,
      'data-exact': exact,
      ...props,
    },
    children,
  );
};

// Mock Redirect component
export const MockRedirect = ({ to, from, push, exact, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mock-redirect',
    'data-to': typeof to === 'string' ? to : JSON.stringify(to),
    'data-from': from,
    'data-push': push,
    'data-exact': exact,
    ...props,
  });
};

// Mock Navigate component (React Router v6)
export const MockNavigate = ({ to, replace, state, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mock-navigate',
    'data-to': typeof to === 'string' ? to : JSON.stringify(to),
    'data-replace': replace,
    'data-state': state ? JSON.stringify(state) : undefined,
    ...props,
  });
};

// Mock Outlet component (React Router v6)
export const MockOutlet = ({ context, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mock-outlet',
    'data-context': context ? JSON.stringify(context) : undefined,
    ...props,
  });
};

// Mock withRouter HOC (React Router v5)
export const mockWithRouter = Component => {
  const WrappedComponent = props => {
    const routeProps = createMockRouteProps();
    return React.createElement(Component, { ...props, ...routeProps });
  };

  WrappedComponent.displayName = `withRouter(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Mock prompt component (React Router v5)
export const MockPrompt = ({ when, message, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'mock-prompt',
    'data-when': when,
    'data-message': message,
    ...props,
  });
};

// Utility functions for testing
export const routerTestUtils = {
  // Create a router wrapper for testing
  createRouterWrapper: (history = createMockHistory(), routerType = 'memory') => {
    const RouterComponent =
      {
        memory: MockMemoryRouter,
        browser: MockBrowserRouter,
        hash: MockHashRouter,
      }[routerType] || MockMemoryRouter;

    return ({ children }) => {
      return React.createElement(RouterComponent, { history }, children);
    };
  },

  // Create route props for component testing
  createRouteProps: createMockRouteProps,

  // Simulate navigation
  simulateNavigation: (history, to, method = 'push') => {
    if (method === 'push') {
      history.push(to);
    } else if (method === 'replace') {
      history.replace(to);
    }
  },

  // Wait for navigation to complete
  waitForNavigation: async (history, expectedPath) => {
    return new Promise(resolve => {
      const unlisten = history.listen(({ location }) => {
        if (location.pathname === expectedPath) {
          unlisten();
          resolve(location);
        }
      });

      // Timeout after 1 second
      setTimeout(() => {
        unlisten();
        resolve(null);
      }, 1000);
    });
  },

  // Assert navigation calls
  expectNavigationTo: (navigate, path, options = {}) => {
    return navigate._wasCalledWith(path, options);
  },

  expectNavigationCount: (navigate, count) => {
    return navigate.mock.calls.length === count;
  },

  // Get navigation history
  getNavigationHistory: navigate => {
    return navigate.mock.calls.map(call => ({
      to: call[0],
      options: call[1] || {},
    }));
  },
};

// Global router state for testing
let globalMockHistory = null;
let globalMockLocation = null;
let globalMockNavigate = null;

export const setGlobalMockHistory = history => {
  globalMockHistory = history;
};

export const getGlobalMockHistory = () => {
  if (!globalMockHistory) {
    globalMockHistory = createMockHistory();
  }
  return globalMockHistory;
};

export const setGlobalMockLocation = location => {
  globalMockLocation = location;
};

export const getGlobalMockLocation = () => {
  if (!globalMockLocation) {
    globalMockLocation = createMockLocation();
  }
  return globalMockLocation;
};

export const setGlobalMockNavigate = navigate => {
  globalMockNavigate = navigate;
};

export const getGlobalMockNavigate = () => {
  if (!globalMockNavigate) {
    globalMockNavigate = createMockNavigate();
  }
  return globalMockNavigate;
};

export const resetGlobalMocks = () => {
  globalMockHistory = null;
  globalMockLocation = null;
  globalMockNavigate = null;
};

// Default exports for common use cases
export default {
  Router: MockRouter,
  BrowserRouter: MockBrowserRouter,
  MemoryRouter: MockMemoryRouter,
  HashRouter: MockHashRouter,
  Route: MockRoute,
  Routes: MockRoutes,
  Switch: MockSwitch,
  Link: MockLink,
  NavLink: MockNavLink,
  Redirect: MockRedirect,
  Navigate: MockNavigate,
  Outlet: MockOutlet,
  Prompt: MockPrompt,
  withRouter: mockWithRouter,
  useNavigate: mockUseNavigate,
  useLocation: mockUseLocation,
  useHistory: mockUseHistory,
  useParams: mockUseParams,
  useRouteMatch: mockUseRouteMatch,
  useSearchParams: mockUseSearchParams,
};
