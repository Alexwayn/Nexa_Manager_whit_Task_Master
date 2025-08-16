module.exports = {
  // Test environment configuration
  testEnvironment: 'jsdom',

  // Setup files - order matters!
  setupFiles: ['<rootDir>/src/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Transform configuration
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': '<rootDir>/jest-transformer.cjs',
    '^.+\.css$': 'jest-transform-stub',
    '^.+\.(jpg|jpeg|png|gif|svg)$': 'jest-transform-stub',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows|ws)/)',
  ],
  
  // Minimal module name mapping - only essential path mappings, no mocks
  moduleNameMapper: {
    // Asset mappings
    '^@assets/(.*)\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub',
    '^@assets/(.*)$': '<rootDir>/../assets/$1',

    // CSS modules and styles
    '^.+\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    // Some libraries import their own CSS files directly
    '^react-grid-layout/css/styles\\.css$': 'identity-obj-proxy',
    '^react-resizable/css/styles\\.css$': 'identity-obj-proxy',
    
    // Path mappings - order matters, most specific first
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
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
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
  
  // Enhanced timeout configuration for different test types
  testTimeout: 15000,
  
  // Timeout overrides for specific patterns
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Verbose output for debugging
  verbose: false,
  
  // Error handling
  errorOnDeprecated: true,
};