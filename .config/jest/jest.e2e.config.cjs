module.exports = {
  // Root directory for Jest
  rootDir: '../../web-app',
  
  // Test environment configuration
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-stub',
    '^.+\\.(jpg|jpeg|png|gif|svg)$': 'jest-transform-stub',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows|ws)/)',
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@tests/(.*)$': '<rootDir>/src/shared/__tests__/$1',
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
    // Mock problematic modules
    '^@/utils/env$': '<rootDir>/src/shared/__tests__/mocks/env.js',
    '^@/utils/Logger$': '<rootDir>/src/shared/__tests__/mocks/logger.js',
  },

  // Test file patterns - specifically for Jest-based e2e tests
  testMatch: [
    '<rootDir>/src/__tests__/e2e/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Files to ignore - exclude Playwright tests and other patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    'reports\\.e2e\\.test\\.js$', // Exclude Playwright tests
    'playwright.*\\.(js|jsx|ts|tsx)$',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/features/**/*.{js,jsx,ts,tsx}',
    'src/shared/**/*.{js,jsx,ts,tsx}',
    'src/pages/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  coverageDirectory: 'coverage/e2e',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
  
  // Timeout configuration - longer for e2e tests
  testTimeout: 30000,
  
  // Global variables
  globals: {
    'import.meta': {
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_APP_ENV: 'test',
        VITE_BASE_URL: 'http://localhost:3000',
        VITE_OPENAI_API_KEY: 'test-openai-key',
        VITE_QWEN_API_KEY: 'test-qwen-key',
      },
    },
  },
  
  // Environment variables for process.env
  setupFiles: ['<rootDir>/src/jest.env.js'],
  
  // Verbose output for debugging
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],
};