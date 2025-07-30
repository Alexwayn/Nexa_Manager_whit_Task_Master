module.exports = {
  // Root directory for Jest
  rootDir: '../../web-app',
  
  // Test environment configuration
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-stub',
    '^.+\\.(jpg|jpeg|png|gif|svg)$': 'jest-transform-stub',
  },
  
  // Transform ignore patterns - ensure ES modules are transformed
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows|ws|@clerk|@tanstack)/)',
  ],
  
  // Module name mapping
  moduleNameMapper: {
    // CSS imports
    '\\.(css|less|scss|sass)$': 'jest-transform-stub',
    'react-grid-layout/css/styles.css': 'jest-transform-stub',
    'react-resizable/css/styles.css': 'jest-transform-stub',
    '^@shared/utils$': '<rootDir>/src/shared/__tests__/mocks/index.js',
    '^.*\/stores$': '<rootDir>/src/shared/__tests__/mocks/stores.js',
    '^.*\/middleware$': '<rootDir>/src/shared/__tests__/mocks/middleware.js',
    '^.*\/config$': '<rootDir>/src/shared/__tests__/mocks/config.js',
    '^.*\/scanner$': '<rootDir>/src/shared/__tests__/mocks/scanner.js',
    '^.*\/websocket$': '<rootDir>/src/shared/__tests__/mocks/websocket.js',
    '^.*\/performance$': '<rootDir>/src/shared/__tests__/mocks/performance.js',
    '^@assets/(.*)\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub',
    '^@assets/(.*)$': '<rootDir>/../assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react$': '<rootDir>/src/shared/__tests__/mocks/react.cjs',
    '^react/jsx-runtime$': '<rootDir>/src/shared/__tests__/mocks/react-jsx-runtime.cjs',
    '@testing-library/react': '<rootDir>/src/shared/__tests__/mocks/testing-library-react.js',
    '@testing-library/jest-dom': '<rootDir>/src/shared/__tests__/mocks/testing-library-jest-dom.js',
    '@testing-library/jest-dom/extend-expect': '<rootDir>/src/shared/__tests__/mocks/testing-library-jest-dom.js',
    '@tanstack/react-query': '<rootDir>/src/shared/__tests__/mocks/tanstack-react-query.cjs',
    'react-quill': '<rootDir>/src/shared/__tests__/mocks/react-quill.js',
    '^@shared/components$': '<rootDir>/src/shared/__tests__/mocks/shared-components.js',
    '^../../../shared/components$': '<rootDir>/src/shared/__tests__/mocks/shared-components.js',
    '^../../../shared/components/(.*)$': '<rootDir>/src/shared/__tests__/mocks/shared-components.js',
    '^.*\/emailCampaignService$': '<rootDir>/src/shared/__tests__/mocks/emailCampaignService.js',
    '^.*\/emailTemplateService$': '<rootDir>/src/shared/__tests__/mocks/emailTemplateService.js',
    '^.*\/emailQueueService$': '<rootDir>/src/shared/__tests__/mocks/emailQueueService.js',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
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
    '^.*\/errorReportingService$': '<rootDir>/src/shared/__tests__/mocks/errorReportingService.js',
    '^@shared/services$': '<rootDir>/src/shared/__tests__/mocks/shared-services.js',
    '^.*\/shared\/services$': '<rootDir>/src/shared/__tests__/mocks/shared-services.js',
    '^@financial/(.*)$': '<rootDir>/src/shared/__tests__/mocks/financial-services.js',
    '^.*\/financial\/(.*)$': '<rootDir>/src/shared/__tests__/mocks/financial-services.js',
    '^@email/(.*)$': '<rootDir>/src/shared/__tests__/mocks/email-services.js',
    '^.*\/email\/(.*)$': '<rootDir>/src/shared/__tests__/mocks/email-services.js',
    '^@features/email/(.*)$': '<rootDir>/src/shared/__tests__/mocks/email-services.js',
    '^.*\/features\/email\/(.*)$': '<rootDir>/src/shared/__tests__/mocks/email-services.js',
    // Mock problematic modules
    '^@/utils/env$': '<rootDir>/src/shared/__tests__/mocks/env.js',
    '^@/utils/Logger$': '<rootDir>/src/shared/__tests__/mocks/logger.js',
    '^@utils/ErrorMonitor$': '<rootDir>/src/shared/__tests__/mocks/ErrorMonitor.js',
    '^@lib/supabaseClerkClient$': '<rootDir>/src/shared/__tests__/mocks/supabaseClerkClient.js',
    '^.*\\/supabaseClerkClient$': '<rootDir>/src/shared/__tests__/mocks/supabaseClerkClient.js',
    '^@providers/WebSocketProvider$': '<rootDir>/src/shared/__tests__/mocks/WebSocketProvider.js',
    '^@/services/websocketService$': '<rootDir>/src/shared/__tests__/mocks/websocketService.js',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/features/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/shared/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '\\.e2e\\.test\\.(js|jsx|ts|tsx)$',
    '\\.accessibility\\.test\\.(js|jsx|ts|tsx)$',
    '\\.performance\\.test\\.(js|jsx|ts|tsx)$',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // ES Module support
  extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx'],
  
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
    './src/features/*/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/shared/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/shared/utils/': {
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
        VITE_BASE_URL: 'http://localhost:3000',
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_APP_ENV: 'test',
        VITE_OPENAI_API_KEY: 'test-openai-key',
        VITE_QWEN_API_KEY: 'test-qwen-key',
        VITE_WS_URL: 'ws://localhost:8080',
        DEV: false,
        PROD: false,
        MODE: 'test'
      },
      url: 'file:///test'
    }
  },
  
  // Environment variables for process.env
  setupFiles: ['<rootDir>/../.config/jest/jest.setup.js'],
  
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