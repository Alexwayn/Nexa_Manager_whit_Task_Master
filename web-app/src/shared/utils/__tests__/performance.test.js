import { 
  reactQueryConfig, 
  virtualizationConfig, 
  memoryOptimization,
  performanceConfig
} from '../performance';

describe('Performance Configuration', () => {
  describe('reactQueryConfig', () => {
    test('has correct default cache times', () => {
      expect(reactQueryConfig.defaultOptions.queries.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(reactQueryConfig.defaultOptions.queries.gcTime).toBe(10 * 60 * 1000); // 10 minutes
    });

    test('has retry configuration', () => {
      expect(reactQueryConfig.defaultOptions.queries.retry).toBe(2);
      expect(typeof reactQueryConfig.defaultOptions.queries.retryDelay).toBe('function');
    });

    test('retryDelay increases exponentially', () => {
      const retryDelay = reactQueryConfig.defaultOptions.queries.retryDelay;
      expect(retryDelay(1)).toBe(1000); // First retry: 1 second
      expect(retryDelay(2)).toBe(2000); // Second retry: 2 seconds
      expect(retryDelay(3)).toBe(4000); // Third retry: 4 seconds
    });

    test('has refetch configuration', () => {
      expect(reactQueryConfig.defaultOptions.queries.refetchOnWindowFocus).toBe(false);
      expect(reactQueryConfig.defaultOptions.queries.refetchOnReconnect).toBe(true);
    });

    test('has mutation configuration', () => {
      expect(reactQueryConfig.defaultOptions.mutations.retry).toBe(1);
    });
  });

  describe('virtualizationConfig', () => {
    test('has correct item size settings', () => {
      expect(virtualizationConfig.itemSize).toBe(50);
      expect(virtualizationConfig.overscan).toBe(5);
    });

    test('has threshold configuration', () => {
      expect(virtualizationConfig.threshold).toBe(100);
    });

    test('has window configuration', () => {
      expect(virtualizationConfig.windowSize).toBe(10);
    });

    test('all config values are numbers', () => {
      Object.values(virtualizationConfig).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('memoryOptimization', () => {
    test('has cache limits', () => {
      expect(memoryOptimization.maxCacheSize).toBe(100);
      expect(memoryOptimization.maxCacheAge).toBe(30 * 60 * 1000); // 30 minutes
    });

    test('has cleanup interval', () => {
      expect(memoryOptimization.cleanupInterval).toBe(5 * 60 * 1000); // 5 minutes
    });

    test('has lazy loading configuration', () => {
      expect(memoryOptimization.lazyLoadThreshold).toBe(0.1);
    });

    test('all numeric values are positive', () => {
      expect(memoryOptimization.maxCacheSize).toBeGreaterThan(0);
      expect(memoryOptimization.maxCacheAge).toBeGreaterThan(0);
      expect(memoryOptimization.cleanupInterval).toBeGreaterThan(0);
      expect(memoryOptimization.lazyLoadThreshold).toBeGreaterThan(0);
      expect(memoryOptimization.lazyLoadThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('performanceConfig integration', () => {
    test('combines all configuration objects', () => {
      expect(performanceConfig).toHaveProperty('query');
      expect(performanceConfig).toHaveProperty('virtualization');
      expect(performanceConfig).toHaveProperty('memory');
    });

    test('query config matches reactQueryConfig', () => {
      expect(performanceConfig.query).toEqual(reactQueryConfig);
    });

    test('virtualization config matches virtualizationConfig', () => {
      expect(performanceConfig.virtualization).toEqual(virtualizationConfig);
    });

    test('memory config matches memoryOptimization', () => {
      expect(performanceConfig.memory).toEqual(memoryOptimization);
    });
  });

  describe('configuration validation', () => {
    test('cache times are reasonable', () => {
      const staleTime = reactQueryConfig.defaultOptions.queries.staleTime;
      const gcTime = reactQueryConfig.defaultOptions.queries.gcTime;
      
      expect(staleTime).toBeLessThan(gcTime); // staleTime should be less than gcTime
      expect(staleTime).toBeGreaterThan(0);
      expect(gcTime).toBeGreaterThan(0);
    });

    test('virtualization threshold is reasonable', () => {
      const threshold = virtualizationConfig.threshold;
      const itemSize = virtualizationConfig.itemSize;
      
      expect(threshold).toBeGreaterThan(itemSize); // Threshold should be larger than item size
    });

    test('memory optimization values are within reasonable bounds', () => {
      expect(memoryOptimization.maxCacheSize).toBeLessThan(1000); // Not too large
      expect(memoryOptimization.lazyLoadThreshold).toBeLessThanOrEqual(1); // Valid threshold
      expect(memoryOptimization.cleanupInterval).toBeLessThan(memoryOptimization.maxCacheAge);
    });
  });

  describe('performance instrumentation helpers', () => {
    test('can measure performance timing', () => {
      // Mock performance.now if not available
      if (!global.performance) {
        global.performance = { now: jest.fn(() => Date.now()) };
      }

      const startTime = performance.now();
      expect(typeof startTime).toBe('number');
      expect(startTime).toBeGreaterThan(0);
    });

    test('cache size limits are enforced', () => {
      const maxSize = memoryOptimization.maxCacheSize;
      expect(maxSize).toBeGreaterThan(10); // Should allow reasonable caching
      expect(maxSize).toBeLessThan(1000); // Should not be excessive
    });

    test('lazy loading threshold is valid percentage', () => {
      const threshold = memoryOptimization.lazyLoadThreshold;
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThanOrEqual(1);
    });
  });
});