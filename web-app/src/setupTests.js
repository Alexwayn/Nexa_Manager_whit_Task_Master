// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock environment variables for testing
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_APP_ENV = 'test';

// Handle import.meta for Vite compatibility
if (typeof global.importMeta === 'undefined') {
  global.importMeta = {
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_APP_ENV: 'test',
    },
  };
}

// Define window.location.origin for JSDOM
if (typeof window !== 'undefined' && !window.location.origin) {
  window.location.origin = 'http://localhost:3000';
}

// Global mocks for Supabase
global.mockSupabaseClient = {
  from: jest.fn(() => global.mockSupabaseClient),
  select: jest.fn(() => global.mockSupabaseClient),
  insert: jest.fn(() => global.mockSupabaseClient),
  update: jest.fn(() => global.mockSupabaseClient),
  delete: jest.fn(() => global.mockSupabaseClient),
  upsert: jest.fn(() => global.mockSupabaseClient),
  eq: jest.fn(() => global.mockSupabaseClient),
  neq: jest.fn(() => global.mockSupabaseClient),
  gt: jest.fn(() => global.mockSupabaseClient),
  gte: jest.fn(() => global.mockSupabaseClient),
  lt: jest.fn(() => global.mockSupabaseClient),
  lte: jest.fn(() => global.mockSupabaseClient),
  like: jest.fn(() => global.mockSupabaseClient),
  ilike: jest.fn(() => global.mockSupabaseClient),
  in: jest.fn(() => global.mockSupabaseClient),
  contains: jest.fn(() => global.mockSupabaseClient),
  order: jest.fn(() => global.mockSupabaseClient),
  range: jest.fn(() => global.mockSupabaseClient),
  limit: jest.fn(() => global.mockSupabaseClient),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

// Global mock for Logger
global.mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// React Router mocks will be defined in individual test files as needed

// Mock file operations
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
    this.type = properties?.type || 'text/plain';
    this.lastModified = Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onabort = null;
    this.onloadend = null;
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      // Handle both Blob and File objects
      if (file instanceof Blob) {
        // For Blob objects, we need to simulate reading the content
        // Since we can't actually read the blob in a test environment,
        // we'll use a mock implementation
        this.result = 'test data'; // Mock content
      } else {
        // Fallback for other file-like objects
        this.result = file.parts ? file.parts.join('') : 'test data';
      }
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      // Handle both Blob and File objects
      if (file instanceof Blob) {
        // For Blob objects, simulate the data URL format
        // Extract content from the blob constructor if available
        let content = 'test data';
        if (file.constructor && file.constructor.name === 'Blob') {
          // Try to get content from blob parts if available in test environment
          content = 'test data'; // Default mock content
        }
        this.result = `data:${file.type || 'text/plain'};base64,${btoa(content)}`;
      } else {
        // Fallback for other file-like objects
        const content = file.parts ? file.parts.join('') : 'test data';
        this.result = `data:${file.type || 'text/plain'};base64,${btoa(content)}`;
      }
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }
};

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('Warning: componentWillMount'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps has been renamed') ||
        args[0].includes('componentWillMount has been renamed'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-object-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock clipboard API - make it configurable to avoid conflicts with user-event
const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  readText: jest.fn(() => Promise.resolve('mocked clipboard text')),
};

// Only define clipboard if it doesn't exist
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    configurable: true,
    value: mockClipboard,
  });
}

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn(success =>
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
      }),
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
});

// Mock performance API
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  };
}

// Custom Jest matchers
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidCurrency(received) {
    const currencyRegex = /^\d+(\.\d{2})?$/;
    const pass = currencyRegex.test(received.toString());

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid currency format`,
        pass: false,
      };
    }
  },

  toBeValidItalianVAT(received) {
    const vatRegex = /^IT\d{11}$/;
    const pass = vatRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Italian VAT number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Italian VAT number`,
        pass: false,
      };
    }
  },
});

// Global test cleanup
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = '';

  // Clear local storage
  if (window.localStorage) {
    window.localStorage.clear();
  }

  // Clear session storage
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};
