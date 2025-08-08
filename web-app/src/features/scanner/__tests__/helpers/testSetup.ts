/**
 * Common test setup utilities for scanner tests
 */

import { setupMockCanvas, setupMockLocalStorage, createMockEnv } from './mockServices';

export const setupScannerTestEnvironment = () => {
  // Mock environment variables
  jest.mock('@/utils/env', () => ({
    getEnvVar: jest.fn((key, defaultValue) => {
      const mockEnv = {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_APP_ENV: 'test',
        VITE_BASE_URL: 'http://localhost:3000',
        VITE_OPENAI_API_KEY: 'test-openai-key',
        VITE_QWEN_API_KEY: 'test-qwen-key',
        NODE_ENV: 'test'
      };
      return mockEnv[key] || defaultValue;
    }),
    getAllEnvVars: jest.fn(() => ({
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_APP_ENV: 'test',
      VITE_BASE_URL: 'http://localhost:3000',
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      NODE_ENV: 'test'
    })),
    isTestEnvironment: jest.fn(() => true),
    isDevelopment: jest.fn(() => true),
    isProduction: jest.fn(() => false)
  }));
  
  // Setup DOM mocks
  setupMockCanvas();
  setupMockLocalStorage();
  
  // Mock timers (only if not already mocked)
  if (!jest.isMockFunction(setTimeout)) {
    jest.useFakeTimers();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
};

export const cleanupScannerTestEnvironment = () => {
  // Only restore real timers if fake timers are currently active
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export const createMockBlob = (content = 'test image data', type = 'image/jpeg') => {
  return new Blob([content], { type });
};

export const createMockFile = (content = 'test file data', filename = 'test.jpg', type = 'image/jpeg') => {
  const blob = createMockBlob(content, type);
  return new File([blob], filename, { type });
};
