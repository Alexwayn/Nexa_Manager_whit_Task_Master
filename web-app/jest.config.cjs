const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/__tests__/utils/',
    '/src/__tests__/mocks/',
    // Ignore helper and mock files colocated under src/__tests__/shared/**
    '/src/__tests__/shared/',
    'e2e',
    '\.config/jest/.*',
    '\.performance\.test\.js$',
    '\.accessibility\.test\.js$'
  ],
  setupFiles: ['dotenv/config', '<rootDir>/src/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel/runtime|axios|react-syntax-highlighter|react-spinners|pretty-bytes|react-hot-toast|react-icons|react-select|react-markdown|remark-gfm|react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|@supabase|isows|ws|websocket)/)',
  ],
  moduleNameMapper: {
    // Testing-library: keep real library. We only tag it as mocked in setup when needed

    // Scanner feature aliases
    '^@scanner/(.*)$': '<rootDir>/src/features/scanner/$1',

    // Provide a stable mock for react-query across tests that don't supply a provider
      '@tanstack/react-query': '<rootDir>/src/shared/__tests__/mocks/tanstack-react-query.cjs',
      // Use our router mock in tests that import it directly
      '^react-router-dom$': '<rootDir>/src/shared/__tests__/mocks/react-router-dom.js',
    // Specific mock must come before generic alias
    '^@financial/services/financialService$': '<rootDir>/src/features/financial/services/__mocks__/financialService.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    // Map voice feature component imports used by tests to the features directory (actual implementation used by tests)
    '^@/features/voice/components/(.*)$': '<rootDir>/src/features/voice/components/$1',
    // Map voice feature providers to actual providers directory
    '^@/features/voice/providers/(.*)$': '<rootDir>/src/providers/$1',
    // Some tests import provider from components path; map it explicitly to real provider file
    '^@/components/voice/VoiceAssistantProvider$': '<rootDir>/src/providers/VoiceAssistantProvider.jsx',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Support common shared alias and util alias
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@financial/(.*)$': '<rootDir>/src/features/financial/$1',
    // Provide explicit mocks for financial services in tests
    '^@financial/services/financialService$': '<rootDir>/src/features/financial/services/__mocks__/financialService.js',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^@test/(.*)$': '<rootDir>/src/__tests__/$1',
    // Map relative UI imports used in some tests to a real file
    '^\.\./\.\./ui/.*$': '<rootDir>/src/components/ui/index.js',
    '^react-markdown$': '<rootDir>/node_modules/react-markdown/react-markdown.js',
    'remark-gfm': '<rootDir>/node_modules/remark-gfm/index.js',
    'react-dnd': '<rootDir>/node_modules/react-dnd/dist/cjs/index.js',
    'dnd-core': '<rootDir>/node_modules/dnd-core/dist/cjs/index.js',
    '@react-dnd/core': '<rootDir>/node_modules/@react-dnd/core/dist/cjs/index.js',
    'react-dnd-html5-backend': '<rootDir>/node_modules/react-dnd-html5-backend/dist/cjs/index.js',
    '^@supabase/supabase-js$': '<rootDir>/../node_modules/@supabase/supabase-js/dist/main/index.js',
    '^@supabase/realtime-js$': '<rootDir>/../node_modules/@supabase/realtime-js/dist/main/index.js',
    '^@supabase/postgrest-js$': '<rootDir>/../node_modules/@supabase/postgrest-js/dist/cjs/index.js',
    '^@supabase/storage-js$': '<rootDir>/../node_modules/@supabase/storage-js/dist/main/index.js',
    '^@supabase/functions-js$': '<rootDir>/../node_modules/@supabase/functions-js/dist/main/index.js',
    '^@supabase/auth-js$': '<rootDir>/../node_modules/@supabase/auth-js/dist/main/index.js',
    '^isows$': '<rootDir>/__mocks__/isows.js',
    '^ws$': '<rootDir>/__mocks__/ws.js',
    '^websocket$': '<rootDir>/__mocks__/websocket.js',
  },
  globalSetup: '<rootDir>/src/__tests__/shared/global-setup.js',
  globalTeardown: '<rootDir>/src/__tests__/shared/global-teardown.js',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.js',
    '!src/services/firebase.js',
    '!src/services/api.js',
    '!src/store/store.js',
    '!src/routes/index.js',
    '!src/utils/testUtils.js',
    '!src/__tests__/**/*',
    '!src/features/auth/routes/index.js',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};