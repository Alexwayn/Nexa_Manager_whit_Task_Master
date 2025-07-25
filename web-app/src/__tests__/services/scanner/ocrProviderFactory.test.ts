import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';
import { OCRProvider, ProviderStatus } from '@/types/scanner';

// Mock environment variables
const mockEnv = {
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key',
  VITE_AZURE_VISION_KEY: 'test-azure-key'
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

// Mock provider implementations
const mockOpenAIProvider = {
  isAvailable: jest.fn(() => true),
  extractText: jest.fn(),
  getStatus: jest.fn(() => ({
    available: true,
    quotaRemaining: 1000,
    rateLimited: false
  })),
  initialize: jest.fn(),
  destroy: jest.fn()
};

const mockQwenProvider = {
  isAvailable: jest.fn(() => true),
  extractText: jest.fn(),
  getStatus: jest.fn(() => ({
    available: true,
    quotaRemaining: 500,
    rateLimited: false
  })),
  initialize: jest.fn(),
  destroy: jest.fn()
};

const mockFallbackProvider = {
  isAvailable: jest.fn(() => true),
  extractText: jest.fn(),
  getStatus: jest.fn(() => ({
    available: true,
    quotaRemaining: null,
    rateLimited: false
  })),
  initialize: jest.fn(),
  destroy: jest.fn()
};

// Mock provider classes
jest.mock('@/services/scanner/providers/openaiProvider', () => ({
  OpenAIVisionOCR: jest.fn(() => mockOpenAIProvider)
}));

jest.mock('@/services/scanner/providers/qwenProvider', () => ({
  QwenOCR: jest.fn(() => mockQwenProvider)
}));

jest.mock('@/services/scanner/providers/fallbackProvider', () => ({
  ManualInputProvider: jest.fn(() => mockFallbackProvider)
}));

describe('OCRProviderFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset factory state
    (OCRProviderFactory as any).providers = new Map();
    (OCRProviderFactory as any).initialized = false;
  });

  describe('initialization', () => {
    it('should initialize all available providers', async () => {
      await OCRProviderFactory.initialize();

      expect(mockOpenAIProvider.initialize).toHaveBeenCalled();
      expect(mockQwenProvider.initialize).toHaveBeenCalled();
      expect(mockFallbackProvider.initialize).toHaveBeenCalled();
    });

    it('should handle provider initialization failure', async () => {
      mockOpenAIProvider.initialize.mockRejectedValue(new Error('OpenAI init failed'));

      await OCRProviderFactory.initialize();

      // Should continue with other providers even if one fails
      expect(mockQwenProvider.initialize).toHaveBeenCalled();
      expect(mockFallbackProvider.initialize).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await OCRProviderFactory.initialize();
      await OCRProviderFactory.initialize();

      // Should only initialize once
      expect(mockOpenAIProvider.initialize).toHaveBeenCalledTimes(1);
    });

    it('should skip providers without API keys', async () => {
      // Remove OpenAI key
      delete mockEnv.VITE_OPENAI_API_KEY;

      await OCRProviderFactory.initialize();

      expect(mockOpenAIProvider.initialize).not.toHaveBeenCalled();
      expect(mockQwenProvider.initialize).toHaveBeenCalled();
      expect(mockFallbackProvider.initialize).toHaveBeenCalled();

      // Restore key for other tests
      mockEnv.VITE_OPENAI_API_KEY = 'test-openai-key';
    });
  });

  describe('getProvider', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return OpenAI provider', () => {
      const provider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);

      expect(provider).toBe(mockOpenAIProvider);
    });

    it('should return Qwen provider', () => {
      const provider = OCRProviderFactory.getProvider(OCRProvider.Qwen);

      expect(provider).toBe(mockQwenProvider);
    });

    it('should return fallback provider', () => {
      const provider = OCRProviderFactory.getProvider(OCRProvider.Fallback);

      expect(provider).toBe(mockFallbackProvider);
    });

    it('should return null for unavailable provider', () => {
      const provider = OCRProviderFactory.getProvider('nonexistent' as OCRProvider);

      expect(provider).toBeNull();
    });

    it('should return null for uninitialized factory', () => {
      // Reset initialization
      (OCRProviderFactory as any).initialized = false;

      const provider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);

      expect(provider).toBeNull();
    });
  });

  describe('getAvailableProviders', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return all available providers', () => {
      const providers = OCRProviderFactory.getAvailableProviders();

      expect(providers).toContain(OCRProvider.OpenAI);
      expect(providers).toContain(OCRProvider.Qwen);
      expect(providers).toContain(OCRProvider.Fallback);
    });

    it('should exclude unavailable providers', () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      const providers = OCRProviderFactory.getAvailableProviders();

      expect(providers).not.toContain(OCRProvider.OpenAI);
      expect(providers).toContain(OCRProvider.Qwen);
      expect(providers).toContain(OCRProvider.Fallback);
    });

    it('should return empty array when uninitialized', () => {
      (OCRProviderFactory as any).initialized = false;

      const providers = OCRProviderFactory.getAvailableProviders();

      expect(providers).toEqual([]);
    });
  });

  describe('getProviderStatus', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return provider status', () => {
      const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);

      expect(status).toEqual({
        available: true,
        quotaRemaining: 1000,
        rateLimited: false
      });
      expect(mockOpenAIProvider.getStatus).toHaveBeenCalled();
    });

    it('should return unavailable status for missing provider', () => {
      const status = OCRProviderFactory.getProviderStatus('nonexistent' as OCRProvider);

      expect(status).toEqual({
        available: false,
        quotaRemaining: null,
        rateLimited: false
      });
    });

    it('should handle provider status error', () => {
      mockOpenAIProvider.getStatus.mockImplementation(() => {
        throw new Error('Status check failed');
      });

      const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);

      expect(status).toEqual({
        available: false,
        quotaRemaining: null,
        rateLimited: false,
        lastError: 'Status check failed'
      });
    });
  });

  describe('getAllProviderStatuses', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return status map for all providers', () => {
      const statuses = OCRProviderFactory.getAllProviderStatuses();

      expect(statuses).toBeInstanceOf(Map);
      expect(statuses.size).toBe(3);
      
      expect(statuses.get(OCRProvider.OpenAI)).toEqual({
        available: true,
        quotaRemaining: 1000,
        rateLimited: false
      });
      
      expect(statuses.get(OCRProvider.Qwen)).toEqual({
        available: true,
        quotaRemaining: 500,
        rateLimited: false
      });
      
      expect(statuses.get(OCRProvider.Fallback)).toEqual({
        available: true,
        quotaRemaining: null,
        rateLimited: false
      });
    });

    it('should handle mixed provider statuses', () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);
      mockQwenProvider.getStatus.mockReturnValue({
        available: true,
        quotaRemaining: 0,
        rateLimited: true
      });

      const statuses = OCRProviderFactory.getAllProviderStatuses();

      expect(statuses.get(OCRProvider.OpenAI)?.available).toBe(false);
      expect(statuses.get(OCRProvider.Qwen)?.rateLimited).toBe(true);
      expect(statuses.get(OCRProvider.Fallback)?.available).toBe(true);
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should destroy all providers', async () => {
      await OCRProviderFactory.destroy();

      expect(mockOpenAIProvider.destroy).toHaveBeenCalled();
      expect(mockQwenProvider.destroy).toHaveBeenCalled();
      expect(mockFallbackProvider.destroy).toHaveBeenCalled();
    });

    it('should handle provider destruction errors', async () => {
      mockOpenAIProvider.destroy.mockRejectedValue(new Error('Destroy failed'));

      await expect(OCRProviderFactory.destroy()).resolves.not.toThrow();

      // Should continue with other providers
      expect(mockQwenProvider.destroy).toHaveBeenCalled();
      expect(mockFallbackProvider.destroy).toHaveBeenCalled();
    });

    it('should reset initialization state', async () => {
      await OCRProviderFactory.destroy();

      const providers = OCRProviderFactory.getAvailableProviders();
      expect(providers).toEqual([]);
    });
  });

  describe('provider configuration', () => {
    it('should configure providers based on environment variables', async () => {
      mockEnv.VITE_OPENAI_API_KEY = 'custom-openai-key';
      mockEnv.VITE_QWEN_API_KEY = 'custom-qwen-key';

      await OCRProviderFactory.initialize();

      // Verify providers were created with correct configuration
      expect(mockOpenAIProvider.initialize).toHaveBeenCalled();
      expect(mockQwenProvider.initialize).toHaveBeenCalled();
    });

    it('should handle missing configuration gracefully', async () => {
      delete mockEnv.VITE_OPENAI_API_KEY;
      delete mockEnv.VITE_QWEN_API_KEY;

      await OCRProviderFactory.initialize();

      // Only fallback provider should be available
      const providers = OCRProviderFactory.getAvailableProviders();
      expect(providers).toEqual([OCRProvider.Fallback]);
    });
  });

  describe('provider priority', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should return providers in priority order', () => {
      const providers = OCRProviderFactory.getAvailableProviders();

      // Assuming OpenAI has higher priority than Qwen
      const openAIIndex = providers.indexOf(OCRProvider.OpenAI);
      const qwenIndex = providers.indexOf(OCRProvider.Qwen);
      const fallbackIndex = providers.indexOf(OCRProvider.Fallback);

      expect(openAIIndex).toBeLessThan(qwenIndex);
      expect(qwenIndex).toBeLessThan(fallbackIndex);
    });

    it('should adjust priority based on availability', () => {
      mockOpenAIProvider.isAvailable.mockReturnValue(false);

      const providers = OCRProviderFactory.getAvailableProviders();

      expect(providers[0]).toBe(OCRProvider.Qwen);
      expect(providers).not.toContain(OCRProvider.OpenAI);
    });
  });

  describe('health monitoring', () => {
    beforeEach(async () => {
      await OCRProviderFactory.initialize();
    });

    it('should monitor provider health', () => {
      const healthyStatus: ProviderStatus = {
        available: true,
        quotaRemaining: 1000,
        rateLimited: false
      };

      const unhealthyStatus: ProviderStatus = {
        available: false,
        quotaRemaining: 0,
        rateLimited: true,
        lastError: 'Rate limit exceeded'
      };

      mockOpenAIProvider.getStatus.mockReturnValue(healthyStatus);
      mockQwenProvider.getStatus.mockReturnValue(unhealthyStatus);

      const openAIStatus = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);
      const qwenStatus = OCRProviderFactory.getProviderStatus(OCRProvider.Qwen);

      expect(openAIStatus.available).toBe(true);
      expect(qwenStatus.available).toBe(false);
      expect(qwenStatus.lastError).toBe('Rate limit exceeded');
    });

    it('should track quota usage', () => {
      mockOpenAIProvider.getStatus.mockReturnValue({
        available: true,
        quotaRemaining: 50,
        rateLimited: false
      });

      const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);

      expect(status.quotaRemaining).toBe(50);
    });
  });
});