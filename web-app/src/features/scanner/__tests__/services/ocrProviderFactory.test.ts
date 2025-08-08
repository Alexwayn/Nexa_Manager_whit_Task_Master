import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';
import { OCRProvider, ProviderStatus } from '@/types/scanner';

// Mock the env utility
jest.mock('@/utils/env', () => ({
  getEnvVar: jest.fn((key, defaultValue = '') => {
    const envVars = {
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      VITE_AZURE_VISION_KEY: 'test-azure-key'
    };
    return envVars[key] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true)
}));

// Mock environment variables
const mockEnv = {
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key',
  VITE_AZURE_VISION_KEY: 'test-azure-key'
};

// Set environment variables for Jest
Object.assign(process.env, mockEnv);

describe('OCRProviderFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset factory state
    (OCRProviderFactory as any).providers = new Map();
    (OCRProviderFactory as any).initialized = false;
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(OCRProviderFactory.initialize()).resolves.not.toThrow();
      expect((OCRProviderFactory as any).initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await OCRProviderFactory.initialize();
      const firstInitialized = (OCRProviderFactory as any).initialized;
      
      await OCRProviderFactory.initialize();
      const secondInitialized = (OCRProviderFactory as any).initialized;
      
      expect(firstInitialized).toBe(true);
      expect(secondInitialized).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return array of available providers', () => {
      const providers = OCRProviderFactory.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should include fallback provider', () => {
      const providers = OCRProviderFactory.getAvailableProviders();
      expect(providers).toContain(OCRProvider.Fallback);
    });
  });

  describe('getProviderStatus', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return status for existing provider', () => {
      const status = OCRProviderFactory.getProviderStatus(OCRProvider.Fallback);
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('rateLimited');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.rateLimited).toBe('boolean');
    });

    it('should return unavailable status for non-existent provider', () => {
      const status = OCRProviderFactory.getProviderStatus('nonexistent' as OCRProvider);
      
      expect(status.available).toBe(false);
      expect(status.rateLimited).toBe(false);
    });
  });

  describe('getAllProviderStatuses', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return map of all provider statuses', () => {
      const statuses = OCRProviderFactory.getAllProviderStatuses();
      
      expect(statuses instanceof Map).toBe(true);
      expect(statuses.size).toBeGreaterThan(0);
    });
  });

  describe('destroy', () => {
    it('should clean up providers', async () => {
      await OCRProviderFactory.initialize();
      await OCRProviderFactory.destroy();
      
      expect((OCRProviderFactory as any).initialized).toBe(false);
      expect((OCRProviderFactory as any).providers.size).toBe(0);
    });
  });
});
