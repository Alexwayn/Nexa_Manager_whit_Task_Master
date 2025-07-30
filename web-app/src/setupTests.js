// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import 'regenerator-runtime/runtime';
// Mock the configure function if it doesn't exist
import { configure } from '@testing-library/dom';

// Set up environment variables for tests

// Ensure configure exists and is a function
if (typeof configure !== 'function') {
  // Create a mock configure function
  global.configure = () => {};
}

require('@testing-library/jest-dom/extend-expect');

// Environment variables setup - ensure these are set before any imports
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.VITE_APP_ENV = 'test';
process.env.VITE_BASE_URL = 'http://localhost:3000';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.VITE_QWEN_API_KEY = 'test-qwen-key';

// Enhanced import.meta polyfill for Vite compatibility
const mockImportMeta = {
  env: {
    NODE_ENV: 'test',
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    VITE_APP_ENV: 'test',
    VITE_BASE_URL: 'http://localhost:3000',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_QWEN_API_KEY: 'test-qwen-key',
    DEV: false,
    PROD: false,
    MODE: 'test',
    
    // Additional environment variables for comprehensive coverage
    VITE_API_BASE_URL: 'http://localhost:3001',
    VITE_WS_URL: 'ws://localhost:8080',
    VITE_CLERK_PUBLISHABLE_KEY: 'test-clerk-key',
    VITE_EMAIL_PROVIDER: 'sendgrid',
    VITE_SENDGRID_API_KEY: 'test-sendgrid-key',
    VITE_FROM_EMAIL: 'test@example.com',
    VITE_FROM_NAME: 'Test App',
    VITE_AWS_ACCESS_KEY_ID: 'test-aws-access-key',
    VITE_AWS_SECRET_ACCESS_KEY: 'test-aws-secret-key',
    VITE_AWS_REGION: 'us-east-1',
    VITE_MAILGUN_API_KEY: 'test-mailgun-key',
    VITE_MAILGUN_DOMAIN: 'test.mailgun.org',
    VITE_POSTMARK_SERVER_TOKEN: 'test-postmark-token',
    VITE_SMTP_HOST: 'smtp.test.com',
    VITE_SMTP_PORT: '587',
    VITE_SMTP_USER: 'test@example.com',
    VITE_SMTP_PASS: 'test-password',
    VITE_SMTP_SECURE: 'false',
    VITE_IMAP_HOST: 'imap.test.com',
    VITE_GMAIL_CLIENT_ID: 'test-gmail-client-id',
    VITE_GMAIL_CLIENT_SECRET: 'test-gmail-client-secret',
    VITE_OUTLOOK_CLIENT_ID: 'test-outlook-client-id',
    VITE_OUTLOOK_CLIENT_SECRET: 'test-outlook-client-secret',
    VITE_ENCRYPTION_SALT: 'test-salt',
    VITE_ENABLE_DEMO_MODE: 'true'
  },
  url: 'file:///test',
  resolve: (id) => new URL(id, 'file:///test').href
};

// Set up global import.meta mock
global.importMeta = mockImportMeta;

// Mock import.meta syntax for ES modules
Object.defineProperty(global, 'import', {
  value: {
    meta: mockImportMeta
  },
  writable: true,
  configurable: true
});

// Also update process.env for compatibility
Object.assign(process.env, mockImportMeta.env);

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
