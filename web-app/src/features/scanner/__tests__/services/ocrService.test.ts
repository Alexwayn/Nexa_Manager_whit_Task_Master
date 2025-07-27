import { AIOCRService } from '@scanner/services/ocrService';
import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';
import { FallbackOCRService } from '@scanner/services/fallbackOCRService';
import RateLimitingService from '@scanner/services/rateLimitingService';
import ResultCacheService from '@scanner/services/resultCacheService';
import { OCRProvider, OCRResult, OCROptions, ProviderStatus } from '@/types/scanner';

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

// Mock dependencies
jest.mock('@scanner/services/ocrProviderFactory');
jest.mock('@scanner/services/fallbackOCRService');
jest.mock('@scanner/services/rateLimitingService');
jest.mock('@scanner/services/resultCacheService');
jest.mock('@/utils/Logger');

const mockOCRProviderFactory = OCRProviderFactory as jest.Mocked<typeof OCRProviderFactory>;
const mockFallbackOCRService = FallbackOCRService as any;
const mockRateLimitingService = RateLimitingService as any;
const mockResultCacheService = ResultCacheService as any;

describe('AIOCRService', () => {
  let service: AIOCRService;
  let mockBlob: Blob;
  let mockRateLimitingInstance: jest.Mocked<RateLimitingService>;
  let mockCacheInstance: jest.Mocked<ResultCacheService>;
  let mockFallbackInstance: jest.Mocked<FallbackOCRService>;

  const mockOCRResult: OCRResult = {
    text: 'Extracted text content',
    confidence: 0.95,
    provider: OCRProvider.OpenAI,
    processingTime: 1500,
    blocks: [
      {
        text: 'Extracted text content',
        bounds: { x: 0, y: 0, width: 100, height: 20 },
        confidence: 0.95
      }
    ]
  };

  const mockProviderStatus: ProviderStatus = {
    available: true,
    quotaRemaining: 1000,
    rateLimited: false
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock instances
    mockRateLimitingInstance = {
      queueRequest: jest.fn(),
      getInstance: jest.fn()
    } as any;

    mockCacheInstance = {
      generateOCRKey: jest.fn(),
      getCachedOCRResult: jest.fn(),
      cacheOCRResult: jest.fn(),
      getInstance: jest.fn()
    } as any;

    mockFallbackInstance = {
      extractTextWithFallback: jest.fn(),
      healthCheck: jest.fn(),
      getRecommendedProvider: jest.fn()
    } as any;

    // Setup static method mocks
    (mockRateLimitingService.getInstance as jest.Mock).mockReturnValue(mockRateLimitingInstance);
    (mockResultCacheService.getInstance as jest.Mock).mockReturnValue(mockCacheInstance);
    mockFallbackOCRService.mockImplementation(() => mockFallbackInstance);

    // Setup OCRProviderFactory mocks
    mockOCRProviderFactory.initialize.mockResolvedValue(undefined);
    mockOCRProviderFactory.getAvailableProviders.mockReturnValue([
      OCRProvider.OpenAI,
      OCRProvider.Qwen,
      OCRProvider.Fallback
    ]);
    mockOCRProviderFactory.getProviderStatus.mockReturnValue(mockProviderStatus);
    mockOCRProviderFactory.getAllProviderStatuses.mockReturnValue(
      new Map([
        [OCRProvider.OpenAI, mockProviderStatus],
        [OCRProvider.Qwen, mockProviderStatus],
        [OCRProvider.Fallback, mockProviderStatus]
      ])
    );

    mockBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    service = new AIOCRService();
  });

  describe('initialization', () => {
    it('should initialize OCR provider factory', async () => {
      await service.extractText(mockBlob);

      expect(mockOCRProviderFactory.initialize).toHaveBeenCalled();
    });

    it('should set preferred provider to first available if current is unavailable', async () => {
      mockOCRProviderFactory.getAvailableProviders.mockReturnValue([OCRProvider.Qwen]);

      const newService = new AIOCRService();
      await newService.extractText(mockBlob);

      // Should use Qwen since it's the only available provider
      expect(mockRateLimitingInstance.queueRequest).toHaveBeenCalledWith(
        OCRProvider.Qwen,
        expect.any(Function),
        0,
        30000
      );
    });

    it('should handle initialization failure', async () => {
      mockOCRProviderFactory.initialize.mockRejectedValue(new Error('Init failed'));

      await expect(service.extractText(mockBlob)).rejects.toThrow('OCR service initialization failed');
    });
  });

  describe('extractText', () => {
    beforeEach(() => {
      mockCacheInstance.generateOCRKey.mockReturnValue('cache-key-123');
      mockCacheInstance.getCachedOCRResult.mockResolvedValue(null);
      mockRateLimitingInstance.queueRequest.mockImplementation(async (provider, fn) => {
        return await fn();
      });
      mockFallbackInstance.extractTextWithFallback.mockResolvedValue(mockOCRResult);
    });

    it('should return cached result if available', async () => {
      mockCacheInstance.getCachedOCRResult.mockResolvedValue(mockOCRResult);

      const result = await service.extractText(mockBlob);

      expect(result).toEqual(mockOCRResult);
      expect(mockFallbackInstance.extractTextWithFallback).not.toHaveBeenCalled();
    });

    it('should extract text using fallback service', async () => {
      const result = await service.extractText(mockBlob);

      expect(mockFallbackInstance.extractTextWithFallback).toHaveBeenCalledWith(
        mockBlob,
        undefined,
        expect.objectContaining({
          providerPriority: expect.arrayContaining([OCRProvider.OpenAI])
        })
      );
      expect(result).toEqual(mockOCRResult);
    });

    it('should cache the extraction result', async () => {
      await service.extractText(mockBlob);

      expect(mockCacheInstance.cacheOCRResult).toHaveBeenCalledWith(
        'cache-key-123',
        mockOCRResult
      );
    });

    it('should use specified provider from options', async () => {
      const options: OCROptions = {
        provider: OCRProvider.Qwen,
        timeout: 20000
      };

      await service.extractText(mockBlob, options);

      expect(mockRateLimitingInstance.queueRequest).toHaveBeenCalledWith(
        OCRProvider.Qwen,
        expect.any(Function),
        0,
        20000
      );
    });

    it('should handle rate limiting failure', async () => {
      mockRateLimitingInstance.queueRequest.mockRejectedValue(new Error('Rate limited'));

      const result = await service.extractText(mockBlob);

      expect(result.text).toContain('OCR Extraction Failed');
      expect(result.confidence).toBe(0.1);
      expect(result.error?.code).toBe('RATE_LIMITED_FAILURE');
      expect(result.error?.retryable).toBe(true);
    });

    it('should handle fallback service failure with basic extraction', async () => {
      mockFallbackInstance.extractTextWithFallback.mockRejectedValue(new Error('Fallback failed'));
      
      // Mock provider for basic extraction
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn(() => Promise.resolve(mockOCRResult))
      };
      mockOCRProviderFactory.getProvider.mockReturnValue(mockProvider as any);

      const result = await service.extractText(mockBlob);

      expect(result).toEqual(mockOCRResult);
    });

    it('should return fallback result when all providers fail', async () => {
      mockFallbackInstance.extractTextWithFallback.mockRejectedValue(new Error('All failed'));
      mockOCRProviderFactory.getProvider.mockReturnValue(null);

      const result = await service.extractText(mockBlob);

      expect(result.text).toContain('All automatic text extraction methods have failed');
      expect(result.confidence).toBe(0.1);
      expect(result.provider).toBe(OCRProvider.Fallback);
      expect(result.error?.code).toBe('ALL_PROVIDERS_FAILED');
    });

    it('should pass custom options to fallback service', async () => {
      const options: OCROptions = {
        provider: OCRProvider.OpenAI,
        enhanceImage: true,
        detectTables: true,
        language: 'en',
        maxRetries: 5
      };

      await service.extractText(mockBlob, options);

      expect(mockFallbackInstance.extractTextWithFallback).toHaveBeenCalledWith(
        mockBlob,
        options,
        expect.objectContaining({
          maxRetries: 5
        })
      );
    });
  });

  describe('provider management', () => {
    it('should get available providers', () => {
      const providers = service.getAvailableProviders();

      expect(providers).toEqual([
        OCRProvider.OpenAI,
        OCRProvider.Qwen,
        OCRProvider.Fallback
      ]);
      expect(mockOCRProviderFactory.getAvailableProviders).toHaveBeenCalled();
    });

    it('should set preferred provider if available', () => {
      service.setPreferredProvider(OCRProvider.Qwen);

      // Should not throw error since Qwen is available
      expect(() => service.setPreferredProvider(OCRProvider.Qwen)).not.toThrow();
    });

    it('should throw error when setting unavailable provider', () => {
      mockOCRProviderFactory.getAvailableProviders.mockReturnValue([OCRProvider.OpenAI]);

      expect(() => service.setPreferredProvider(OCRProvider.Qwen))
        .toThrow('Provider qwen is not available');
    });

    it('should get provider status', () => {
      const status = service.getProviderStatus(OCRProvider.OpenAI);

      expect(status).toEqual(mockProviderStatus);
      expect(mockOCRProviderFactory.getProviderStatus).toHaveBeenCalledWith(OCRProvider.OpenAI);
    });

    it('should get all provider statuses', () => {
      const statuses = service.getAllProviderStatuses();

      expect(statuses).toBeInstanceOf(Map);
      expect(statuses.size).toBe(3);
      expect(mockOCRProviderFactory.getAllProviderStatuses).toHaveBeenCalled();
    });
  });

  describe('health check', () => {
    it('should perform health check', async () => {
      const healthResult = {
        healthy: true,
        availableProviders: [OCRProvider.OpenAI, OCRProvider.Qwen],
        issues: []
      };

      mockFallbackInstance.healthCheck.mockResolvedValue(healthResult);

      const result = await service.healthCheck();

      expect(result).toEqual(healthResult);
      expect(mockFallbackInstance.healthCheck).toHaveBeenCalled();
    });

    it('should get recommended provider', () => {
      mockFallbackInstance.getRecommendedProvider.mockReturnValue(OCRProvider.OpenAI);

      const provider = service.getRecommendedProvider();

      expect(provider).toBe(OCRProvider.OpenAI);
      expect(mockFallbackInstance.getRecommendedProvider).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should destroy service and cleanup resources', async () => {
      await service.destroy();

      expect(mockOCRProviderFactory.destroy).toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle provider timeout', async () => {
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn(() => new Promise(resolve => {
          // Never resolve to simulate timeout
        }))
      };

      mockOCRProviderFactory.getProvider.mockReturnValue(mockProvider as any);
      mockFallbackInstance.extractTextWithFallback.mockRejectedValue(new Error('Fallback failed'));

      const options: OCROptions = { timeout: 100 }; // Very short timeout
      const result = await service.extractText(mockBlob, options);

      expect(result.error?.code).toBe('ALL_PROVIDERS_FAILED');
    });

    it('should handle provider not found', async () => {
      mockOCRProviderFactory.getProvider.mockReturnValue(null);
      mockFallbackInstance.extractTextWithFallback.mockRejectedValue(new Error('Provider not found'));

      const result = await service.extractText(mockBlob);

      expect(result.error?.code).toBe('ALL_PROVIDERS_FAILED');
    });

    it('should handle provider unavailable', async () => {
      const mockProvider = {
        isAvailable: jest.fn(() => false),
        extractText: jest.fn()
      };

      mockOCRProviderFactory.getProvider.mockReturnValue(mockProvider as any);
      mockFallbackInstance.extractTextWithFallback.mockRejectedValue(new Error('Provider unavailable'));

      const result = await service.extractText(mockBlob);

      expect(result.error?.code).toBe('ALL_PROVIDERS_FAILED');
    });
  });

  describe('caching behavior', () => {
    it('should generate cache key with image and options', async () => {
      const options: OCROptions = {
        provider: OCRProvider.OpenAI,
        enhanceImage: true
      };

      await service.extractText(mockBlob, options);

      expect(mockCacheInstance.generateOCRKey).toHaveBeenCalledWith(mockBlob, options);
    });

    it('should skip caching on cache service failure', async () => {
      mockCacheInstance.cacheOCRResult.mockRejectedValue(new Error('Cache failed'));

      const result = await service.extractText(mockBlob);

      // Should still return result even if caching fails
      expect(result).toEqual(mockOCRResult);
    });
  });

  describe('rate limiting integration', () => {
    it('should queue request with correct parameters', async () => {
      const options: OCROptions = {
        provider: OCRProvider.Qwen,
        timeout: 25000
      };

      await service.extractText(mockBlob, options);

      expect(mockRateLimitingInstance.queueRequest).toHaveBeenCalledWith(
        OCRProvider.Qwen,
        expect.any(Function),
        0, // default priority
        25000
      );
    });

    it('should use default priority and timeout when not specified', async () => {
      await service.extractText(mockBlob);

      expect(mockRateLimitingInstance.queueRequest).toHaveBeenCalledWith(
        OCRProvider.OpenAI, // default preferred provider
        expect.any(Function),
        0, // default priority
        30000 // default timeout
      );
    });

    it('should use custom priority when specified in options', async () => {
      const options: OCROptions = {
        provider: OCRProvider.Qwen,
        timeout: 25000,
        priority: 5
      };

      await service.extractText(mockBlob, options);

      expect(mockRateLimitingInstance.queueRequest).toHaveBeenCalledWith(
        OCRProvider.Qwen,
        expect.any(Function),
        5, // custom priority
        25000
      );
    });
  });
});