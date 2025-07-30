const dotenv = require('dotenv');
const path = require('path');

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

// Mock import.meta globally for Jest
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_APP_ENV: 'test',
        VITE_BASE_URL: 'http://localhost:3000',
        VITE_OPENAI_API_KEY: 'test-openai-key',
        VITE_QWEN_API_KEY: 'test-qwen-key',
        VITE_WS_URL: 'ws://localhost:8080',
        NODE_ENV: 'test',
        MODE: 'test',
        DEV: false,
        PROD: false,
      },
      url: 'file:///test-file.js',
    },
  },
  writable: true,
  configurable: true,
});

// Mock env utilities
jest.mock('@/utils/env', () => ({
  getEnvVar: (key, defaultValue) => {
    const envVars = {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_APP_ENV: 'test',
      VITE_BASE_URL: 'http://localhost:3000',
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      NODE_ENV: 'test',
    };
    return envVars[key] || defaultValue;
  },
  getAllEnvVars: () => ({
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_APP_ENV: 'test',
    VITE_BASE_URL: 'http://localhost:3000',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_QWEN_API_KEY: 'test-qwen-key',
  }),
  isTestEnvironment: () => true,
  isDevelopment: () => true,
  isProduction: () => false,
}));

// Mock Logger
jest.mock('@/utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn(),
  },
}));

// Mock i18next to prevent initialization errors in tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock i18next-http-backend
jest.mock('i18next-http-backend', () => ({
  __esModule: true,
  default: {
    type: 'backend',
    init: () => {},
  },
}));

// Mock i18next-browser-languagedetector
jest.mock('i18next-browser-languagedetector', () => ({
  __esModule: true,
  default: {
    type: 'languageDetector',
    init: () => {},
  },
}));

// Mock i18next core with proper chaining
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    use: () => ({
      use: () => ({
        use: () => ({
          init: () => Promise.resolve(),
        }),
      }),
    }),
    t: (key) => key,
    changeLanguage: () => Promise.resolve(),
    language: 'en',
  },
}));