/**
 * Test Utilities for Phase 3.2 Testing Improvements
 * Provides common testing patterns, helpers, and utilities
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  TestRouterProvider, 
  TestMemoryRouterProvider,
  AllProvidersWrapper,
  MinimalProvidersWrapper 
} from '@/shared/__tests__/mocks/providers';

// Enhanced render function with common providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialState = {},
    providers = [],
    withRouter = true,
    withQuery = true,
    routerProps = {},
    queryProps = {},
    ...renderOptions
  } = options;

  // Mock providers wrapper
  const AllTheProviders = ({ children }) => {
    let wrappedChildren = children;
    
    // Apply custom providers in reverse order
    providers.reverse().forEach(Provider => {
      wrappedChildren = <Provider>{wrappedChildren}</Provider>;
    });
    
    // Apply default providers if requested
    if (withRouter && withQuery) {
      wrappedChildren = (
        <AllProvidersWrapper routerProps={routerProps} queryProps={queryProps}>
          {wrappedChildren}
        </AllProvidersWrapper>
      );
    } else if (withRouter) {
      wrappedChildren = (
        <TestRouterProvider {...routerProps}>
          {wrappedChildren}
        </TestRouterProvider>
      );
    }
    
    return wrappedChildren;
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Render with router only
export const renderWithRouter = (ui, options = {}) => {
  const { routerProps = {}, ...renderOptions } = options;
  
  return render(ui, { 
    wrapper: ({ children }) => (
      <TestRouterProvider {...routerProps}>
        {children}
      </TestRouterProvider>
    ), 
    ...renderOptions 
  });
};

// Render with memory router for controlled routing tests
export const renderWithMemoryRouter = (ui, options = {}) => {
  const { 
    initialEntries = ['/'], 
    initialIndex = 0, 
    ...renderOptions 
  } = options;
  
  return render(ui, { 
    wrapper: ({ children }) => (
      <TestMemoryRouterProvider 
        initialEntries={initialEntries}
        initialIndex={initialIndex}
      >
        {children}
      </TestMemoryRouterProvider>
    ), 
    ...renderOptions 
  });
};

// Render with minimal providers (router only)
export const renderWithMinimalProviders = (ui, options = {}) => {
  return render(ui, { 
    wrapper: MinimalProvidersWrapper, 
    ...options 
  });
};

// Async test helpers
export const waitForElement = async (selector, timeout = 5000) => {
  return await waitFor(
    () => {
      const element = screen.getByTestId(selector) || screen.getByRole(selector);
      expect(element).toBeInTheDocument();
      return element;
    },
    { timeout }
  );
};

export const waitForElementToDisappear = async (selector, timeout = 5000) => {
  return await waitFor(
    () => {
      expect(screen.queryByTestId(selector)).not.toBeInTheDocument();
    },
    { timeout }
  );
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockClient = (overrides = {}) => ({
  id: 'test-client-id',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  city: 'Test City',
  country: 'Test Country',
  vat_number: 'IT12345678901',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  number: 'INV-001',
  client_id: 'test-client-id',
  amount: 1000,
  currency: 'EUR',
  status: 'pending',
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Event simulation helpers
export const simulateFileUpload = async (input, file) => {
  const user = userEvent.setup();
  
  await act(async () => {
    await user.upload(input, file);
  });
};

export const simulateFormSubmission = async (form, data = {}) => {
  const user = userEvent.setup();
  
  // Fill form fields
  for (const [field, value] of Object.entries(data)) {
    const input = screen.getByLabelText(new RegExp(field, 'i')) || 
                  screen.getByRole('textbox', { name: new RegExp(field, 'i') });
    
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
  
  // Submit form
  const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
  await user.click(submitButton);
};

// API mock helpers
export const createMockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: { 'content-type': 'application/json' },
  config: {},
});

export const createMockApiError = (message = 'API Error', status = 500) => {
  const error = new Error(message);
  error.response = {
    data: { message },
    status,
    statusText: 'Internal Server Error',
  };
  return error;
};

// Component testing helpers
export const getByTestIdOrRole = (testId, role) => {
  try {
    return screen.getByTestId(testId);
  } catch {
    return screen.getByRole(role);
  }
};

export const queryByTestIdOrRole = (testId, role) => {
  return screen.queryByTestId(testId) || screen.queryByRole(role);
};

// Async operation helpers
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForAsyncOperation = async (operation, timeout = 5000) => {
  return await waitFor(operation, { timeout });
};

// Mock timer helpers
export const advanceTimersByTime = (ms) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

export const runAllTimers = () => {
  act(() => {
    jest.runAllTimers();
  });
};

// Error boundary testing
export const TestErrorBoundary = ({ children, onError = jest.fn() }) => {
  try {
    return children;
  } catch (error) {
    onError(error);
    return <div data-testid="error-boundary">Something went wrong</div>;
  }
};

// Local storage helpers
export const mockLocalStorage = () => {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
};

// Session storage helpers
export const mockSessionStorage = () => mockLocalStorage();

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.IntersectionObserver = mockIntersectionObserver;
  window.IntersectionObserverEntry = jest.fn();
  
  return mockIntersectionObserver;
};

// Resize Observer mock
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  
  window.ResizeObserver = mockResizeObserver;
  
  return mockResizeObserver;
};

// Media query mock
export const mockMatchMedia = (matches = false) => {
  const mockMatchMedia = jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  
  window.matchMedia = mockMatchMedia;
  
  return mockMatchMedia;
};

// Clipboard API mock
export const mockClipboard = () => {
  const mockClipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  };
  
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  });
  
  return mockClipboard;
};

// Geolocation mock
export const mockGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };
  
  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });
  
  return mockGeolocation;
};

// Performance mock
export const mockPerformance = () => {
  const mockPerformance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  };
  
  global.performance = mockPerformance;
  
  return mockPerformance;
};

// Test cleanup helpers
export const cleanupAfterEach = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear timers
  jest.clearAllTimers();
  
  // Clear DOM
  document.body.innerHTML = '';
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset modules
  jest.resetModules();
};

// Custom matchers
export const customMatchers = {
  toBeValidEmail: (received) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass,
    };
  },
  
  toBeValidCurrency: (received) => {
    const currencyRegex = /^\d+(\.\d{2})?$/;
    const pass = currencyRegex.test(received.toString());
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid currency amount`,
      pass,
    };
  },
  
  toBeWithinRange: (received, min, max) => {
    const pass = received >= min && received <= max;
    
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${min}-${max}`,
      pass,
    };
  },
};

// Router testing utilities
export const createMockNavigate = () => jest.fn();

export const createMockLocation = (overrides = {}) => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
  ...overrides
});

export const createMockParams = (params = {}) => params;

export const mockRouterHooks = (options = {}) => {
  const {
    navigate = createMockNavigate(),
    location = createMockLocation(),
    params = createMockParams()
  } = options;

  jest.doMock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => navigate,
    useLocation: () => location,
    useParams: () => params,
  }));

  return { navigate, location, params };
};

// Navigation testing helpers
export const expectNavigation = (mockNavigate, expectedPath, expectedOptions = {}) => {
  expect(mockNavigate).toHaveBeenCalledWith(expectedPath, expectedOptions);
};

export const expectNavigationToPath = (mockNavigate, expectedPath) => {
  expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
};

export const expectNavigationWithReplace = (mockNavigate, expectedPath) => {
  expect(mockNavigate).toHaveBeenCalledWith(expectedPath, { replace: true });
};

// Export all utilities
export default {
  renderWithProviders,
  renderWithRouter,
  renderWithMemoryRouter,
  renderWithMinimalProviders,
  waitForElement,
  waitForElementToDisappear,
  createMockUser,
  createMockClient,
  createMockInvoice,
  simulateFileUpload,
  simulateFormSubmission,
  createMockApiResponse,
  createMockApiError,
  getByTestIdOrRole,
  queryByTestIdOrRole,
  flushPromises,
  waitForAsyncOperation,
  advanceTimersByTime,
  runAllTimers,
  TestErrorBoundary,
  mockLocalStorage,
  mockSessionStorage,
  mockIntersectionObserver,
  mockResizeObserver,
  mockMatchMedia,
  mockClipboard,
  mockGeolocation,
  mockPerformance,
  cleanupAfterEach,
  customMatchers,
  createMockNavigate,
  createMockLocation,
  createMockParams,
  mockRouterHooks,
  expectNavigation,
  expectNavigationToPath,
  expectNavigationWithReplace,
};
