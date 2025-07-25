module.exports = {
  // Test environment configuration
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/../../web-app/src/setupTests.js'],
  
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
    '^@/(.*)$': '<rootDir>/../../web-app/src/$1',
    '^@components/(.*)$': '<rootDir>/../../web-app/src/components/$1',
    '^@services/(.*)$': '<rootDir>/../../web-app/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/../../web-app/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/../../web-app/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/../../web-app/src/context/$1',
    '^@i18n/(.*)$': '<rootDir>/../../web-app/src/i18n/$1',
    '^@assets/(.*)$': '<rootDir>/../../web-app/src/assets/$1',
    '^@tests/(.*)$': '<rootDir>/../../web-app/src/__tests__/$1',
    '^@lib/(.*)$': '<rootDir>/../../web-app/src/lib/$1',
    '^@types/(.*)$': '<rootDir>/../../web-app/src/types/$1',
    '^@features/(.*)$': '<rootDir>/../../web-app/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/../../web-app/src/shared/$1',
    '^@auth/(.*)$': '<rootDir>/../../web-app/src/features/auth/$1',
    '^@clients/(.*)$': '<rootDir>/../../web-app/src/features/clients/$1',
    '^@financial/(.*)$': '<rootDir>/../../web-app/src/features/financial/$1',
    '^@email/(.*)$': '<rootDir>/../../web-app/src/features/email/$1',
    '^@documents/(.*)$': '<rootDir>/../../web-app/src/features/documents/$1',
    '^@calendar/(.*)$': '<rootDir>/../../web-app/src/features/calendar/$1',
    '^@scanner/(.*)$': '<rootDir>/../../web-app/src/features/scanner/$1',
    '^@dashboard/(.*)$': '<rootDir>/../../web-app/src/features/dashboard/$1',
    '^@analytics/(.*)$': '<rootDir>/../../web-app/src/features/analytics/$1',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/../../web-app/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/../../web-app/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/../../web-app/node_modules/',
    '<rootDir>/../../web-app/dist/',
    '<rootDir>/../../web-app/build/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    '../../web-app/src/**/*.{js,jsx,ts,tsx}',
    '!../../web-app/src/**/*.d.ts',
    '!../../web-app/src/main.jsx',
    '!../../web-app/src/vite-env.d.ts',
    '!../../web-app/src/**/*.stories.{js,jsx,ts,tsx}',
    '!../../web-app/src/**/__tests__/**',
    '!../../web-app/src/**/*.test.{js,jsx,ts,tsx}',
    '!../../web-app/src/**/*.spec.{js,jsx,ts,tsx}',
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
    './../../web-app/src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './../../web-app/src/utils/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  
  // Timeout configuration
  testTimeout: 10000,
  
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
  setupFiles: ['<rootDir>/../../web-app/src/jest.env.js'],
  
  // Verbose output for debugging
  verbose: false,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/../../web-app/node_modules/',
    '<rootDir>/../../web-app/coverage/',
    '<rootDir>/../../web-app/dist/',
  ],
};