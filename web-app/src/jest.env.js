// Jest environment setup for tests
// Set environment variables for process.env
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.VITE_APP_ENV = 'test';
process.env.VITE_BASE_URL = 'http://localhost:3000';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';
process.env.VITE_QWEN_API_KEY = 'test-qwen-key';

// Mock import.meta for Jest - this is critical for ES module compatibility
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
    MODE: 'test'
  }
};

// Set up global import.meta mock
if (typeof global !== 'undefined') {
  global.importMeta = mockImportMeta;
  
  // Mock import.meta syntax for ES modules
  Object.defineProperty(global, 'import', {
    value: {
      meta: mockImportMeta
    },
    writable: true,
    configurable: true
  });
}

// Add TextEncoder/TextDecoder polyfills for Node.js
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}