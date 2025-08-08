/**
 * ES Module Interop Setup for Jest
 * 
 * This file handles ES module compatibility issues in Jest tests
 * by providing proper interop between ES modules and CommonJS.
 */

// Enable ES module interop globally
global.__esModule = true;

// Handle dynamic imports in test environment
global.importMeta = {
  env: {
    VITE_BASE_URL: 'http://localhost:3000',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    VITE_APP_ENV: 'test',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_QWEN_API_KEY: 'test-qwen-key',
    VITE_WS_URL: 'ws://localhost:8080',
    VITE_CLERK_PUBLISHABLE_KEY: 'test-clerk-key',
    VITE_ENABLE_DEMO_MODE: 'false',
    DEV: false,
    PROD: false,
    MODE: 'test',
    NODE_ENV: 'test'
  },
  url: 'file:///test'
};

// Polyfill for import.meta in CommonJS environment
if (typeof global.import === 'undefined') {
  global.import = {
    meta: global.importMeta
  };
}

// Handle ES module default exports
// const originalRequire = require;
// require = function(id) {
//   const module = originalRequire(id);
  
//   // If module has __esModule flag, handle default export properly
//   if (module && typeof module === 'object' && module.__esModule) {
//     return module;
//   }
  
//   // For modules without __esModule flag, wrap in default export
//   if (module && typeof module === 'object' && !module.default && !module.__esModule) {
//     return {
//       __esModule: true,
//       default: module,
//       ...module
//     };
//   }
  
//   return module;
// };

// Handle dynamic import() calls
global.import = function(specifier) {
  return Promise.resolve(require(specifier));
};

// Mock fetch for ES modules that use it
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    })
  );
}

// Handle URL constructor for ES modules
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = 'http://localhost:3000';
      this.protocol = 'http:';
      this.host = 'localhost:3000';
      this.hostname = 'localhost';
      this.port = '3000';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
    }
    
    toString() {
      return this.href;
    }
  };
}

// Handle URLSearchParams for ES modules
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      if (typeof init === 'string') {
        // Parse query string
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
          }
        });
      }
    }
    
    get(name) {
      return this.params.get(name);
    }
    
    set(name, value) {
      this.params.set(name, value);
    }
    
    has(name) {
      return this.params.has(name);
    }
    
    delete(name) {
      this.params.delete(name);
    }
    
    toString() {
      const pairs = [];
      for (const [key, value] of this.params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return pairs.join('&');
    }
  };
}

// Console log to confirm ES module interop is loaded
console.log('✓ ES Module Interop setup loaded');