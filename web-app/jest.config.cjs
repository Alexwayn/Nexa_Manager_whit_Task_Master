module.exports = {
  // Test environment configuration
  testEnvironment: 'jsdom',

  // Setup files - order matters!
  setupFiles: ['<rootDir>/src/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Transform configuration
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': '<rootDir>/jest-transformer.js',
    '^.+\.css$': 'jest-transform-css',
    '^.+\.(jpg|jpeg|png|gif|svg)$': 'jest-transform-stub',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows|ws)/)',
  ],
  
  // Module name mapping
  moduleNameMapper: {
    // React mock
    '^react$': '<rootDir>/src/shared/__tests__/mocks/react.js',
    
    // Testing library mock
    '^@testing-library/react$': '<rootDir>/src/shared/__tests__/mocks/testing-library-react.js',
    
    // React Query mock
    '^@tanstack/react-query$': '<rootDir>/src/shared/__tests__/mocks/tanstack-react-query.js',
    
    // Environment utility mock - must be first to override all env imports
    '^@/utils/env$': '<rootDir>/src/__tests__/mocks/env.js',
    '^@utils/env$': '<rootDir>/src/__tests__/mocks/env.js',
    
    // WebSocket service mock to avoid import.meta issues
    '^../services/websocketService$': '<rootDir>/src/__tests__/mocks/websocketService.js',
    '^./services/websocketService$': '<rootDir>/src/__tests__/mocks/websocketService.js',
    '^@/services/websocketService$': '<rootDir>/src/__tests__/mocks/websocketService.js',
    '^@services/websocketService$': '<rootDir>/src/__tests__/mocks/websocketService.js',
    '^.*websocketService$': '<rootDir>/src/__tests__/mocks/websocketService.js',
    
    // Existing service mocks
    '^@shared/utils$': '<rootDir>/src/shared/__tests__/mocks/index.js',
    '^.*\\/stores$': '<rootDir>/src/shared/__tests__/mocks/stores.js',
    '^.*\\/middleware$': '<rootDir>/src/shared/__tests__/mocks/middleware.js',
    '^.*\\/config$': '<rootDir>/src/shared/__tests__/mocks/config.js',
    '^.*\\/scanner$': '<rootDir>/src/shared/__tests__/mocks/scanner.js',
    '^.*\\/websocket$': '<rootDir>/src/shared/__tests__/mocks/websocket.js',
    '^.*\\/performance$': '<rootDir>/src/shared/__tests__/mocks/performance.js',
    '^.*\\/websocketService$': '<rootDir>/src/shared/__tests__/mocks/websocketService.js',
    '^@assets/(.*)\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub',
    '^@assets/(.*)$': '<rootDir>/../assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@tests/(.*)$': '<rootDir>/src/__tests__/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@auth/(.*)$': '<rootDir>/src/features/auth/$1',
    '^@clients/(.*)$': '<rootDir>/src/features/clients/$1',
    '^@financial/(.*)$': '<rootDir>/src/features/financial/$1',
    '^@email/(.*)$': '<rootDir>/src/features/email/$1',
    '^@documents/(.*)$': '<rootDir>/src/features/documents/$1',
    '^@calendar/(.*)$': '<rootDir>/src/features/calendar/$1',
    '^@scanner/(.*)$': '<rootDir>/src/features/scanner/$1',
    '^@dashboard/(.*)$': '<rootDir>/src/features/dashboard/$1',
    '^@analytics/(.*)$': '<rootDir>/src/features/analytics/$1',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Global variables for import.meta compatibility
  globals: {
    'import.meta': {
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
      },
      url: 'file:///test',
      resolve: (id) => new URL(id, 'file:///test').href
    }
  },
  
  // Timeout configuration
  testTimeout: 10000,
  
  // Verbose output for debugging
  verbose: false,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],
};