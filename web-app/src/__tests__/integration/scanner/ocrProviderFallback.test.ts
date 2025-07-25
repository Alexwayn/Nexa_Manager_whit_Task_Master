import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';
import { FallbackOCRService } from '@/services/scanner/fallbackOCRService';
import { AIOCRService } from '@/services/scanner/ocrService';
import RateLimitingService from '@/services/scanner/rateLimitingService';
import { OCRProvider, OCRResult, OCROptions, ProviderStatus } from '@/types/scanner';

// Mock dependencies
jest.mock('@/utils/Logger');
jest.mock('@/lib/sentry');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock environment variables
const mockEnv = {
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_QWEN_API_KEY: 'test-qwen-key'
};

// Set environment variables for Jest
Object.assign(process.env, mockEnv);

describe('OCR Provider Fallback Integration Tests', () => {
  let ocrService: AIOCRService;
  let fallbackService: FallbackOCRService;
  let rateLimitingService: RateLimitingService;

  const mockSuccessResult: OCRResult = {
    text: 'Successfully extracted text content',
    confidence: 0.95,
    provider: OCRProvider.OpenAI,
    processingTime: 1500,
    blocks: [
      {
        text: 'Successfully extracted text content',
        bounds: { x: 0, y: 0, width: 200, height: 30 },
        confidence: 0.95
      }
    ]
  };

  const mockFallbackResult: OCRResult = {
    text: '[Manual Input Required]\n\nPlease manually enter the text content from this document.',
    confidence: 0.1,
    provider: OCRProvider.Fallback,
    processingTime: 0,
    error: {
      code: 'MANUAL_INPUT_REQUIRED',
      message: 'All automatic OCR providers failed',
      provider: OCRProvider.Fallback,
      retryable: false
    }
  };

  const createMockBlob = (content: string = 'test image data'): Blob => {
    return new Blob([content], { type: 'image/jpeg' });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Clear localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);

    // Reset singleton instances
    (AIOCRService as any).instance = null;
    (FallbackOCRService as any).instance = null;
    (RateLimitingService as any).instance = null;
    (OCRProviderFactory as any).providers = new Map();
    (OCRProviderFactory as any).initialized = false;

    // Initialize services
    ocrService = new AIOCRService();
    fallbackService = new FallbackOCRService();
    rateLimitingService = RateLimitingService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    rateLimitingService.dispose();
  });

  describe('Provider Availability and Fallback Chain', () => {
    it('should use primary provider when available', async () => {
      // Mock successful primary provider
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockSuccessResult),
        getStatus: jest.fn(() => ({
          available: true,
          quotaRemaining: 1000,
          rateLimited: false
        }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Qwen,
        OCRProvider.Fallback
      ]);

      const imageBlob = createMockBlob();
      const options: OCROptions = { provider: OCRProvider.OpenAI };

      const result = await fallbackService.extractTextWithFallback(imageBlob, options);

      expect(result.provider).toBe(OCRProvider.OpenAI);
      expect(result.text).toBe('Successfully extracted text content');
      expect(mockProvider.extractText).toHaveBeenCalledWith(imageBlob, options);
    });

    it('should fallback to secondary provider when primary fails', async () => {
      const mockOpenAIProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockRejectedValue(new Error('OpenAI API error')),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      const mockQwenProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Qwen,
          text: 'Qwen extracted text'
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 500, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
            return mockOpenAIProvider as any;
          case OCRProvider.Qwen:
            return mockQwenProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Qwen,
        OCRProvider.Fallback
      ]);

      const imageBlob = createMockBlob();
      const fallbackStrategy = {
        providerPriority: [OCRProvider.OpenAI, OCRProvider.Qwen],
        maxRetries: 2
      };

      const result = await fallbackService.extractTextWithFallback(
        imageBlob,
        { provider: OCRProvider.OpenAI },
        fallbackStrategy
      );

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(result.text).toBe('Qwen extracted text');
      expect(mockOpenAIProvider.extractText).toHaveBeenCalled();
      expect(mockQwenProvider.extractText).toHaveBeenCalled();
    });

    it('should use manual fallback when all AI providers fail', async () => {
      const mockFailingProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockRejectedValue(new Error('Provider failed')),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 0, rateLimited: true }))
      };

      const mockFallbackProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockFallbackResult),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: undefined, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
          case OCRProvider.Qwen:
            return mockFailingProvider as any;
          case OCRProvider.Fallback:
            return mockFallbackProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Qwen,
        OCRProvider.Fallback
      ]);

      const imageBlob = createMockBlob();

      const result = await fallbackService.extractTextWithFallback(imageBlob);

      expect(result.provider).toBe(OCRProvider.Fallback);
      expect(result.text).toContain('Manual Input Required');
      expect(result.confidence).toBe(0.1);
      expect(result.error?.code).toBe('MANUAL_INPUT_REQUIRED');
    });

    it('should skip unavailable providers in fallback chain', async () => {
      const mockAvailableProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Qwen
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 500, rateLimited: false }))
      };

      const mockUnavailableProvider = {
        isAvailable: jest.fn(() => false),
        extractText: jest.fn(),
        getStatus: jest.fn(() => ({ available: false, quotaRemaining: 0, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
            return mockUnavailableProvider as any;
          case OCRProvider.Qwen:
            return mockAvailableProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.Qwen // OpenAI not available
      ]);

      const imageBlob = createMockBlob();

      const result = await fallbackService.extractTextWithFallback(imageBlob);

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(mockUnavailableProvider.extractText).not.toHaveBeenCalled();
      expect(mockAvailableProvider.extractText).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should respect rate limits and queue requests', async () => {
      // Mock rate limiting
      let rateLimitCallCount = 0;
      jest.spyOn(rateLimitingService, 'checkRateLimit').mockImplementation(async () => {
        rateLimitCallCount++;
        if (rateLimitCallCount <= 2) {
          return {
            allowed: false,
            tokensRemaining: 0,
            resetTime: Date.now() + 60000,
            retryAfter: 1000,
            quotaRemaining: { daily: 0, monthly: 1000 },
            warningLevel: 'critical'
          };
        }
        return {
          allowed: true,
          tokensRemaining: 10,
          resetTime: Date.now() + 60000,
          quotaRemaining: { daily: 100, monthly: 1000 },
          warningLevel: 'none'
        };
      });

      // Mock successful provider after rate limit reset
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockSuccessResult),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);

      const imageBlob = createMockBlob();

      // Queue request that should initially be rate limited
      const promise = rateLimitingService.queueRequest(
        OCRProvider.OpenAI,
        async () => mockProvider.extractText(imageBlob),
        0,
        5000
      );

      // Advance time to simulate rate limit reset
      jest.advanceTimersByTime(2000);

      const result = await promise;

      expect(result).toEqual(mockSuccessResult);
      expect(rateLimitingService.checkRateLimit).toHaveBeenCalledTimes(3);
    });

    it('should fallback to different provider when primary is rate limited', async () => {
      const mockRateLimitedProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn(),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 0, rateLimited: true }))
      };

      const mockAvailableProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Qwen
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 500, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
            return mockRateLimitedProvider as any;
          case OCRProvider.Qwen:
            return mockAvailableProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.Qwen // Only Qwen available due to rate limiting
      ]);

      const imageBlob = createMockBlob();

      const result = await fallbackService.extractTextWithFallback(imageBlob, {
        provider: OCRProvider.OpenAI
      });

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(mockRateLimitedProvider.extractText).not.toHaveBeenCalled();
      expect(mockAvailableProvider.extractText).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error(`Attempt ${attemptCount} failed`);
          }
          return mockSuccessResult;
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([OCRProvider.OpenAI]);

      const imageBlob = createMockBlob();
      const fallbackStrategy = {
        providerPriority: [OCRProvider.OpenAI],
        maxRetries: 3,
        retryDelay: 100
      };

      const result = await fallbackService.extractTextWithFallback(
        imageBlob,
        { provider: OCRProvider.OpenAI },
        fallbackStrategy
      );

      expect(result).toEqual(mockSuccessResult);
      expect(attemptCount).toBe(3);
      expect(mockProvider.extractText).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors with appropriate fallback', async () => {
      const mockTimeoutProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockImplementation(async () => {
          await new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      const mockBackupProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Qwen
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 500, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
            return mockTimeoutProvider as any;
          case OCRProvider.Qwen:
            return mockBackupProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Qwen
      ]);

      const imageBlob = createMockBlob();

      const result = await fallbackService.extractTextWithFallback(imageBlob, {
        timeout: 50 // Very short timeout
      });

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(mockTimeoutProvider.extractText).toHaveBeenCalled();
      expect(mockBackupProvider.extractText).toHaveBeenCalled();
    });

    it('should handle network connectivity issues', async () => {
      const mockNetworkErrorProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockRejectedValue(new Error('Network error: ECONNREFUSED')),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      const mockLocalProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Fallback,
          text: 'Local processing result'
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: undefined, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
          case OCRProvider.Qwen:
            return mockNetworkErrorProvider as any;
          case OCRProvider.Fallback:
            return mockLocalProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Qwen,
        OCRProvider.Fallback
      ]);

      const imageBlob = createMockBlob();

      const result = await fallbackService.extractTextWithFallback(imageBlob);

      expect(result.provider).toBe(OCRProvider.Fallback);
      expect(result.text).toBe('Local processing result');
    });
  });

  describe('Provider Health Monitoring', () => {
    it('should monitor provider health and adjust fallback strategy', async () => {
      const providerStatuses = new Map<OCRProvider, ProviderStatus>([
        [OCRProvider.OpenAI, { available: true, quotaRemaining: 1000, rateLimited: false }],
        [OCRProvider.Qwen, { available: false, quotaRemaining: 0, rateLimited: true }],
        [OCRProvider.Fallback, { available: true, quotaRemaining: null, rateLimited: false }]
      ]);

      jest.spyOn(OCRProviderFactory, 'getAllProviderStatuses').mockReturnValue(providerStatuses);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Fallback
      ]);

      const healthCheck = await fallbackService.healthCheck();

      expect(healthCheck.healthy).toBe(true);
      expect(healthCheck.availableProviders).toContain(OCRProvider.OpenAI);
      expect(healthCheck.availableProviders).toContain(OCRProvider.Fallback);
      expect(healthCheck.availableProviders).not.toContain(OCRProvider.Qwen);
      expect(healthCheck.issues).toContain('Qwen provider is rate limited or unavailable');
    });

    it('should recommend best available provider', () => {
      const providerStatuses = new Map<OCRProvider, ProviderStatus>([
        [OCRProvider.OpenAI, { available: true, quotaRemaining: 1000, rateLimited: false }],
        [OCRProvider.Qwen, { available: true, quotaRemaining: 50, rateLimited: false }],
        [OCRProvider.Fallback, { available: true, quotaRemaining: undefined, rateLimited: false }]
      ]);

      jest.spyOn(OCRProviderFactory, 'getAllProviderStatuses').mockReturnValue(providerStatuses);

      const recommendedProvider = fallbackService.getRecommendedProvider();

      // Should recommend OpenAI due to higher quota remaining
      expect(recommendedProvider).toBe(OCRProvider.OpenAI);
    });

    it('should detect unhealthy system state', async () => {
      const providerStatuses = new Map<OCRProvider, ProviderStatus>([
        [OCRProvider.OpenAI, { available: false, quotaRemaining: 0, rateLimited: true }],
        [OCRProvider.Qwen, { available: false, quotaRemaining: 0, rateLimited: true }],
        [OCRProvider.Fallback, { available: true, quotaRemaining: undefined, rateLimited: false }]
      ]);

      jest.spyOn(OCRProviderFactory, 'getAllProviderStatuses').mockReturnValue(providerStatuses);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.Fallback
      ]);

      const healthCheck = await fallbackService.healthCheck();

      expect(healthCheck.healthy).toBe(false);
      expect(healthCheck.availableProviders).toEqual([OCRProvider.Fallback]);
      expect(healthCheck.issues).toContain('Only fallback provider available');
      expect(healthCheck.issues).toContain('OpenAI provider is rate limited or unavailable');
      expect(healthCheck.issues).toContain('Qwen provider is rate limited or unavailable');
    });
  });

  describe('Configuration and Customization', () => {
    it('should respect custom fallback strategy', async () => {
      const mockQwenProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue({
          ...mockSuccessResult,
          provider: OCRProvider.Qwen
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 500, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockQwenProvider as any);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([OCRProvider.Qwen]);

      const imageBlob = createMockBlob();
      const customStrategy = {
        providerPriority: [OCRProvider.Qwen], // Skip OpenAI entirely
        maxRetries: 1,
        retryDelay: 500
      };

      const result = await fallbackService.extractTextWithFallback(
        imageBlob,
        { provider: OCRProvider.OpenAI }, // Request OpenAI but strategy overrides
        customStrategy
      );

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(mockQwenProvider.extractText).toHaveBeenCalled();
    });

    it('should handle provider-specific options', async () => {
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockSuccessResult),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);

      const imageBlob = createMockBlob();
      const providerOptions: OCROptions = {
        provider: OCRProvider.OpenAI,
        enhanceImage: true,
        detectTables: true,
        language: 'en'
      };

      await fallbackService.extractTextWithFallback(imageBlob, providerOptions);

      expect(mockProvider.extractText).toHaveBeenCalledWith(imageBlob, providerOptions);
    });
  });

  describe('Integration with Main OCR Service', () => {
    it('should integrate fallback mechanism with main OCR service', async () => {
      // Mock provider factory to simulate real behavior
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockSuccessResult),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'initialize').mockResolvedValue(undefined);
      jest.spyOn(OCRProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([OCRProvider.OpenAI]);

      const imageBlob = createMockBlob();

      const result = await ocrService.extractText(imageBlob);

      expect(result).toEqual(mockSuccessResult);
      expect(OCRProviderFactory.initialize).toHaveBeenCalled();
      expect(mockProvider.extractText).toHaveBeenCalledWith(imageBlob, undefined);
    });

    it('should handle service initialization failures gracefully', async () => {
      jest.spyOn(OCRProviderFactory, 'initialize').mockRejectedValue(
        new Error('Provider initialization failed')
      );

      const imageBlob = createMockBlob();

      await expect(ocrService.extractText(imageBlob))
        .rejects.toThrow('OCR service initialization failed');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests with proper fallback', async () => {
      let requestCount = 0;
      const mockProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockImplementation(async () => {
          requestCount++;
          // Simulate some requests failing
          if (requestCount % 3 === 0) {
            throw new Error('Simulated failure');
          }
          return {
            ...mockSuccessResult,
            text: `Result ${requestCount}`
          };
        }),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: 1000, rateLimited: false }))
      };

      const mockFallbackProvider = {
        isAvailable: jest.fn(() => true),
        extractText: jest.fn().mockResolvedValue(mockFallbackResult),
        getStatus: jest.fn(() => ({ available: true, quotaRemaining: undefined, rateLimited: false }))
      };

      jest.spyOn(OCRProviderFactory, 'getProvider').mockImplementation((provider) => {
        switch (provider) {
          case OCRProvider.OpenAI:
            return mockProvider as any;
          case OCRProvider.Fallback:
            return mockFallbackProvider as any;
          default:
            return null;
        }
      });

      jest.spyOn(OCRProviderFactory, 'getAvailableProviders').mockReturnValue([
        OCRProvider.OpenAI,
        OCRProvider.Fallback
      ]);

      // Create multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) => {
        const imageBlob = createMockBlob(`image ${i}`);
        return fallbackService.extractTextWithFallback(imageBlob);
      });

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      
      // Some should succeed with primary provider, some should fallback
      const successfulResults = results.filter(r => r.provider === OCRProvider.OpenAI);
      const fallbackResults = results.filter(r => r.provider === OCRProvider.Fallback);

      expect(successfulResults.length).toBeGreaterThan(0);
      expect(fallbackResults.length).toBeGreaterThan(0);
      expect(successfulResults.length + fallbackResults.length).toBe(10);
    });
  });
});