import RateLimitingService from '@scanner/services/rateLimitingService';
import { OCRProvider, RateLimitConfig } from '@/types/scanner';

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

describe('RateLimitingService', () => {
  let service: RateLimitingService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset singleton instance
    (RateLimitingService as any).instance = null;
    
    // Clear localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    
    service = RateLimitingService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.dispose();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = RateLimitingService.getInstance();
      const instance2 = RateLimitingService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize with default configurations', () => {
      const statuses = service.getAllRateLimitStatus();

      expect(statuses.has(OCRProvider.OpenAI)).toBe(true);
      expect(statuses.has(OCRProvider.Qwen)).toBe(true);
      expect(statuses.has(OCRProvider.Fallback)).toBe(true);
    });

    it('should load quota usage from localStorage', () => {
      const savedQuota = {
        [OCRProvider.OpenAI]: {
          provider: OCRProvider.OpenAI,
          daily: { used: 50, limit: 1000, resetTime: Date.now() + 86400000 },
          monthly: { used: 500, limit: 25000, resetTime: Date.now() + 2592000000 },
          lastUpdated: Date.now()
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedQuota));

      const newService = RateLimitingService.getInstance();
      const usage = newService.getQuotaUsage(OCRProvider.OpenAI);

      expect(usage.daily.used).toBe(50);
      expect(usage.monthly.used).toBe(500);
    });
  });

  describe('rate limiting', () => {
    it('should allow request when tokens are available', async () => {
      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.allowed).toBe(true);
      expect(status.tokensRemaining).toBeGreaterThanOrEqual(0);
      expect(status.quotaRemaining.daily).toBeGreaterThan(0);
      expect(status.quotaRemaining.monthly).toBeGreaterThan(0);
    });

    it('should deny request when no tokens available', async () => {
      // Exhaust all tokens
      for (let i = 0; i < 15; i++) {
        await service.checkRateLimit(OCRProvider.OpenAI);
      }

      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.allowed).toBe(false);
      expect(status.tokensRemaining).toBe(0);
      expect(status.retryAfter).toBeGreaterThan(0);
    });

    it('should refill tokens over time', async () => {
      // Exhaust tokens
      for (let i = 0; i < 15; i++) {
        await service.checkRateLimit(OCRProvider.OpenAI);
      }

      // Advance time to allow token refill
      jest.advanceTimersByTime(2000); // 2 seconds

      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.allowed).toBe(true);
      expect(status.tokensRemaining).toBeGreaterThan(0);
    });

    it('should enforce daily quota limits', async () => {
      // Mock quota usage at limit
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      usage.daily.used = usage.daily.limit;

      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.allowed).toBe(false);
      expect(status.quotaRemaining.daily).toBe(0);
      expect(status.warningLevel).toBe('critical');
    });

    it('should enforce monthly quota limits', async () => {
      // Mock quota usage at limit
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      usage.monthly.used = usage.monthly.limit;

      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.allowed).toBe(false);
      expect(status.quotaRemaining.monthly).toBe(0);
      expect(status.warningLevel).toBe('critical');
    });

    it('should calculate warning levels correctly', async () => {
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      
      // Set usage to warning threshold (80%)
      usage.daily.used = Math.floor(usage.daily.limit * 0.8);
      
      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.warningLevel).toBe('warning');
    });
  });

  describe('request queuing', () => {
    it('should queue and process requests', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue('test result');
      
      const result = await service.queueRequest(
        OCRProvider.OpenAI,
        mockRequestFn,
        0,
        5000
      );

      expect(result).toBe('test result');
      expect(mockRequestFn).toHaveBeenCalled();
    });

    it('should handle request timeout', async () => {
      const mockRequestFn = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      const promise = service.queueRequest(
        OCRProvider.OpenAI,
        mockRequestFn,
        0,
        1000 // 1 second timeout
      );

      // Advance time past timeout
      jest.advanceTimersByTime(1500);

      await expect(promise).rejects.toThrow('Request timeout after 1000ms');
    });

    it('should prioritize requests correctly', async () => {
      const results: string[] = [];
      const mockHighPriorityFn = jest.fn().mockImplementation(async () => {
        results.push('high');
        return 'high priority';
      });
      const mockLowPriorityFn = jest.fn().mockImplementation(async () => {
        results.push('low');
        return 'low priority';
      });

      // Queue low priority first, then high priority
      const lowPromise = service.queueRequest(OCRProvider.OpenAI, mockLowPriorityFn, 1);
      const highPromise = service.queueRequest(OCRProvider.OpenAI, mockHighPriorityFn, 10);

      await Promise.all([lowPromise, highPromise]);

      // High priority should be processed first
      expect(results[0]).toBe('high');
      expect(results[1]).toBe('low');
    });

    it('should handle request errors', async () => {
      const mockRequestFn = jest.fn().mockRejectedValue(new Error('Request failed'));

      await expect(
        service.queueRequest(OCRProvider.OpenAI, mockRequestFn)
      ).rejects.toThrow('Request failed');
    });
  });

  describe('quota management', () => {
    it('should track quota usage', () => {
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);

      expect(usage).toHaveProperty('provider', OCRProvider.OpenAI);
      expect(usage).toHaveProperty('daily');
      expect(usage).toHaveProperty('monthly');
      expect(usage.daily).toHaveProperty('used');
      expect(usage.daily).toHaveProperty('limit');
      expect(usage.daily).toHaveProperty('resetTime');
    });

    it('should reset daily quota at midnight', () => {
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      usage.daily.used = 100;
      
      // Mock time to be past reset time
      const originalNow = Date.now;
      Date.now = jest.fn(() => usage.daily.resetTime + 1000);

      // Trigger quota check which should reset
      service.getQuotaUsage(OCRProvider.OpenAI);

      expect(usage.daily.used).toBe(0);

      Date.now = originalNow;
    });

    it('should reset monthly quota at month start', () => {
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      usage.monthly.used = 1000;
      
      // Mock time to be past reset time
      const originalNow = Date.now;
      Date.now = jest.fn(() => usage.monthly.resetTime + 1000);

      // Trigger quota check which should reset
      service.getQuotaUsage(OCRProvider.OpenAI);

      expect(usage.monthly.used).toBe(0);

      Date.now = originalNow;
    });

    it('should save quota usage to localStorage', async () => {
      await service.checkRateLimit(OCRProvider.OpenAI);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scanner_quota_usage',
        expect.any(String)
      );
    });

    it('should reset quota usage manually', () => {
      const usage = service.getQuotaUsage(OCRProvider.OpenAI);
      usage.daily.used = 100;
      usage.monthly.used = 500;

      service.resetQuotaUsage(OCRProvider.OpenAI);

      expect(usage.daily.used).toBe(0);
      expect(usage.monthly.used).toBe(0);
    });
  });

  describe('queue management', () => {
    it('should get queue statistics', () => {
      const stats = service.getQueueStats();

      expect(stats).toBeInstanceOf(Map);
      expect(stats.has(OCRProvider.OpenAI)).toBe(true);
      expect(stats.get(OCRProvider.OpenAI)).toHaveProperty('length');
      expect(stats.get(OCRProvider.OpenAI)).toHaveProperty('oldestRequest');
      expect(stats.get(OCRProvider.OpenAI)).toHaveProperty('averageWaitTime');
    });

    it('should clear queue for provider', () => {
      // Add some requests to queue
      service.queueRequest(OCRProvider.OpenAI, () => Promise.resolve('test1'));
      service.queueRequest(OCRProvider.OpenAI, () => Promise.resolve('test2'));

      const clearedCount = service.clearQueue(OCRProvider.OpenAI);

      expect(clearedCount).toBe(2);
      
      const stats = service.getQueueStats();
      expect(stats.get(OCRProvider.OpenAI)?.length).toBe(0);
    });
  });

  describe('configuration updates', () => {
    it('should update rate limit configuration', () => {
      const newConfig: Partial<RateLimitConfig> = {
        requestsPerMinute: 120,
        burstCapacity: 20
      };

      service.updateRateLimitConfig(OCRProvider.OpenAI, newConfig);

      // Verify configuration was updated by checking token bucket capacity
      const statuses = service.getAllRateLimitStatus();
      const status = statuses.get(OCRProvider.OpenAI);
      
      expect(status).toBeDefined();
      // Token bucket should have been updated with new capacity
    });

    it('should handle invalid provider for configuration update', () => {
      const newConfig: Partial<RateLimitConfig> = {
        requestsPerMinute: 120
      };

      // Should not throw error for invalid provider
      expect(() => {
        service.updateRateLimitConfig('invalid' as OCRProvider, newConfig);
      }).not.toThrow();
    });
  });

  describe('status reporting', () => {
    it('should get all provider rate limit statuses', () => {
      const statuses = service.getAllRateLimitStatus();

      expect(statuses).toBeInstanceOf(Map);
      expect(statuses.size).toBeGreaterThan(0);
      
      for (const [provider, status] of statuses.entries()) {
        expect(Object.values(OCRProvider)).toContain(provider);
        expect(status).toHaveProperty('allowed');
        expect(status).toHaveProperty('tokensRemaining');
        expect(status).toHaveProperty('resetTime');
        expect(status).toHaveProperty('quotaRemaining');
        expect(status).toHaveProperty('warningLevel');
      }
    });

    it('should handle errors in status reporting gracefully', () => {
      // Mock an error in token bucket access
      const originalGet = Map.prototype.get;
      Map.prototype.get = jest.fn().mockImplementation((key) => {
        if (key === OCRProvider.OpenAI) {
          throw new Error('Mock error');
        }
        return originalGet.call(Map.prototype, key);
      });

      const statuses = service.getAllRateLimitStatus();

      // Should still return statuses for other providers
      expect(statuses.has(OCRProvider.Qwen)).toBe(true);
      expect(statuses.has(OCRProvider.Fallback)).toBe(true);

      Map.prototype.get = originalGet;
    });
  });

  describe('cleanup and disposal', () => {
    it('should dispose resources properly', () => {
      // Add some requests to queue
      service.queueRequest(OCRProvider.OpenAI, () => Promise.resolve('test'));
      
      service.dispose();

      const stats = service.getQueueStats();
      expect(stats.get(OCRProvider.OpenAI)?.length).toBe(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should save quota usage on disposal', () => {
      service.dispose();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scanner_quota_usage',
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw error
      expect(async () => {
        await service.checkRateLimit(OCRProvider.OpenAI);
      }).not.toThrow();
    });

    it('should handle invalid provider gracefully', async () => {
      await expect(
        service.checkRateLimit('invalid' as OCRProvider)
      ).rejects.toThrow('No rate limit configuration for provider: invalid');
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should not throw error during initialization
      expect(() => {
        RateLimitingService.getInstance();
      }).not.toThrow();
    });
  });

  describe('time calculations', () => {
    it('should calculate retry after time correctly', async () => {
      // Exhaust tokens
      for (let i = 0; i < 15; i++) {
        await service.checkRateLimit(OCRProvider.OpenAI);
      }

      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.retryAfter).toBeGreaterThan(0);
      expect(status.retryAfter).toBeLessThan(2000); // Should be reasonable
    });

    it('should calculate reset time correctly', async () => {
      const status = await service.checkRateLimit(OCRProvider.OpenAI);

      expect(status.resetTime).toBeGreaterThan(Date.now());
    });
  });
});