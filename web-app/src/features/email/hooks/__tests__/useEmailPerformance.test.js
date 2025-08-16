import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useEmailPerformance from '../useEmailPerformance';

// Mock console methods
global.console.warn = jest.fn();
global.console.log = jest.fn();

// Set up performance mock
let performanceNowSpy;
let currentNow;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEmailPerformance', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
    jest.clearAllMocks();
    // Use globally provided performance mock from setup (globalMocks)
    if (global.performance && jest.isMockFunction(global.performance.now)) {
      currentNow = 1000;
      global.performance.now.mockImplementation(() => currentNow);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hook initialization', () => {
    test('initializes with default values', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current.metrics).toEqual({
        loadTime: 0,
        renderTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
      });
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.startTiming).toBe('function');
      expect(typeof result.current.endTiming).toBe('function');
      expect(typeof result.current.recordCacheHit).toBe('function');
      expect(typeof result.current.recordCacheMiss).toBe('function');
    });

    test('provides performance measurement functions', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current).toHaveProperty('startTiming');
      expect(result.current).toHaveProperty('endTiming');
      expect(result.current).toHaveProperty('recordCacheHit');
      expect(result.current).toHaveProperty('recordCacheMiss');
      expect(result.current).toHaveProperty('getPerformanceReport');
    });
  });

  describe('timing measurement', () => {
    test('measures load time correctly', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Setup sequential timing values: start=1000, end=1500
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // start
      }

      // Start timing
      act(() => {
        result.current.startTiming('load');
      });

      // End timing with later time
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1500; // end
      }
      act(() => {
        result.current.endTiming('load');
      });

      expect(result.current.metrics.loadTime).toBe(500); // 1500 - 1000
    });

    test('measures render time correctly', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // start
      }

      act(() => {
        result.current.startTiming('render');
      });

      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1200; // end
      }
      act(() => {
        result.current.endTiming('render');
      });

      expect(result.current.metrics.renderTime).toBe(200); // 1200 - 1000
    });

    test('handles multiple timing operations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Measure load time
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // load start
      }
      act(() => {
        result.current.startTiming('load');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1300; // load end
      }
      act(() => {
        result.current.endTiming('load');
      });

      // Measure render time
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1400; // render start
      }
      act(() => {
        result.current.startTiming('render');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1600; // render end
      }
      act(() => {
        result.current.endTiming('render');
      });

      expect(result.current.metrics.loadTime).toBe(300);
      expect(result.current.metrics.renderTime).toBe(200);
    });

    test('ignores invalid timing operations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // End timing without starting
      act(() => {
        result.current.endTiming('load');
      });

      expect(result.current.metrics.loadTime).toBe(0);
    });
  });

  describe('cache hit tracking', () => {
    test('calculates cache hit rate correctly', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Record cache hits and misses
      act(() => {
        result.current.recordCacheHit();
        result.current.recordCacheHit();
        result.current.recordCacheHit();
        result.current.recordCacheMiss();
      });

      // Hit rate should be 3/4 = 0.75 = 75%
      expect(result.current.metrics.cacheHitRate).toBe(75);
    });

    test('handles no cache operations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current.metrics.cacheHitRate).toBe(0);
    });

    test('handles only cache hits', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      act(() => {
        result.current.recordCacheHit();
        result.current.recordCacheHit();
      });

      expect(result.current.metrics.cacheHitRate).toBe(100);
    });

    test('handles only cache misses', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      act(() => {
        result.current.recordCacheMiss();
        result.current.recordCacheMiss();
      });

      expect(result.current.metrics.cacheHitRate).toBe(0);
    });
  });

  describe('memory usage tracking', () => {
    test('tracks memory usage when available', () => {
      // Mock memory API
      global.performance.memory = {
        usedJSHeapSize: 1024 * 1024, // 1MB
        totalJSHeapSize: 2048 * 1024, // 2MB
      };

      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current.metrics.memoryUsage).toBeGreaterThan(0);
    });

    test('handles missing memory API gracefully', () => {
      delete global.performance.memory;

      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current.metrics.memoryUsage).toBe(0);
    });
  });

  describe('performance report generation', () => {
    test('generates comprehensive performance report', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Set up some metrics
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // load start
      }
      act(() => {
        result.current.startTiming('load');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1500; // load end
      }
      act(() => {
        result.current.endTiming('load');
        result.current.recordCacheHit();
        result.current.recordCacheMiss();
      });

      const report = result.current.getPerformanceReport();

      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('recommendations');
      expect(report.metrics.loadTime).toBe(500);
      expect(report.metrics.cacheHitRate).toBe(50);
    });

    test('includes performance recommendations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Simulate slow performance (load time >= 2000ms)
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // load start
      }
      act(() => {
        result.current.startTiming('load');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 3000; // load end
      }
      act(() => {
        result.current.endTiming('load');
      });

      const report = result.current.getPerformanceReport();

      expect(report.recommendations).toContain('Consider optimizing email loading');
    });
  });

  describe('loading state management', () => {
    test('manages loading state during operations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.startTiming('load');
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.endTiming('load');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('performance optimization', () => {
    test('provides comprehensive performance optimization recommendations', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // load start
      }
      act(() => {
        result.current.startTiming('load');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 3000; // load end (2s)
      }
      act(() => {
        result.current.endTiming('load');
      });

      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // render start
      }
      act(() => {
        result.current.startTiming('render');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 2000; // render end (1s)
      }
      act(() => {
        result.current.endTiming('render');
      });

      // Simulate poor cache performance
      act(() => {
        result.current.recordCacheMiss();
        result.current.recordCacheMiss();
        result.current.recordCacheMiss();
        result.current.recordCacheHit();
      });

      const report = result.current.getPerformanceReport();

      expect(report.recommendations).toEqual(
        expect.arrayContaining([
          'Consider optimizing email loading',
          'Improve caching strategy',
          'Consider implementing lazy loading'
        ])
      );
    });

    test('suggests lazy loading for large datasets', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Simulate slow render time
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // render start
      }
      act(() => {
        result.current.startTiming('render');
      });
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 2000; // render end (1s)
      }
      act(() => {
        result.current.endTiming('render');
      });

      const report = result.current.getPerformanceReport();

      expect(report.recommendations).toContain('Consider implementing lazy loading');
    });
  });

  describe('edge cases and error handling', () => {
    test('handles performance API unavailability', () => {
      const originalPerformance = global.performance;
      delete global.performance;

      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      expect(() => {
        result.current.startTiming('load');
        result.current.endTiming('load');
      }).not.toThrow();

      global.performance = originalPerformance;
    });

    test('handles negative timing values', () => {
      const { result } = renderHook(() => useEmailPerformance(), { wrapper });

      // Set start time higher than end time to create negative duration
      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 2000; // start higher
      }

      act(() => {
        result.current.startTiming('load');
      });

      if (global.performance && jest.isMockFunction(global.performance.now)) {
        currentNow = 1000; // end lower
      }

      act(() => {
        result.current.endTiming('load');
      });

      // Should handle negative values gracefully
      expect(result.current.metrics.loadTime).toBeGreaterThanOrEqual(0);
    });
  });
});