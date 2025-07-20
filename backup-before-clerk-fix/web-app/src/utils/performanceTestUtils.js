import React from 'react';
import Logger from '@utils/Logger';

// Performance testing and validation utilities
// Use these functions to verify that performance optimizations are working correctly

// Environment helpers for performance testing
export const isDevelopment = () => import.meta.env.MODE === 'development';

export const isProduction = () => import.meta.env.MODE === 'production';

export const isTest = () => import.meta.env.MODE === 'test';

/**
 * Simulate component error for testing error boundaries
 * @param {string} componentName - Name of the component to simulate error in
 * @param {string} errorMessage - Custom error message
 */
export const simulateComponentError = (
  componentName = 'TestComponent',
  errorMessage = 'Simulated error for testing',
) => {
  if (isDevelopment()) {
    console.warn(`🔥 Simulating error in ${componentName}: ${errorMessage}`);
    throw new Error(`[${componentName}] ${errorMessage}`);
  }
};

/**
 * Test error boundary by creating a component that throws an error
 * @param {Object} props - Component props
 */
export const ErrorTestComponent = ({
  shouldError = true,
  componentName = 'ErrorTestComponent',
}) => {
  if (shouldError) {
    simulateComponentError(
      componentName,
      'This is a test error to verify error boundary functionality',
    );
  }
  return <div>Error test component - no error thrown</div>;
};

/**
 * Performance measurement utility for components
 * @param {string} componentName - Name of the component being measured
 */
export const createPerformanceMeasure = componentName => {
  const startTime = performance.now();

  return {
    measureRender: () => {
      if (isDevelopment()) {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        Logger.info(`⚡ ${componentName} render time: ${renderTime.toFixed(2)}ms`);

        if (renderTime > 16) {
          console.warn(
            `⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render (>16ms threshold)`,
          );
        }

        return renderTime;
      }
      return 0;
    },
  };
};

/**
 * Component render counter for detecting unnecessary re-renders
 * @param {string} componentName - Name of the component
 */
export const useRenderCounter = componentName => {
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    if (isDevelopment()) {
      renderCount.current += 1;
      Logger.info(`🔄 ${componentName} rendered ${renderCount.current} times`);

      if (renderCount.current > 10) {
        console.warn(
          `⚠️ ${componentName} has rendered ${renderCount.current} times - check for unnecessary re-renders`,
        );
      }
    }
  });

  return isDevelopment() ? renderCount.current : 0;
};

/**
 * Memory usage tracker
 * @param {string} label - Label for the measurement
 */
export const trackMemoryUsage = (label = 'Memory Check') => {
  if (isDevelopment() && performance.memory) {
    const memory = performance.memory;
    Logger.info(`📊 ${label}:`, {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
    });
  }
};

/**
 * Lazy loading test component
 * @param {Object} props - Component props
 */
export const LazyTestComponent = React.lazy(() => {
  // Simulate loading time
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <div className='p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
            ✅ Lazy component loaded successfully!
            <p className='text-sm mt-2'>
              This component was loaded asynchronously to test code splitting.
            </p>
          </div>
        ),
      });
    }, 1000); // 1 second delay to simulate network loading
  });
});

/**
 * Performance optimization validation checklist
 */
export const validatePerformanceOptimizations = () => {
  if (isDevelopment()) {
    Logger.info('🚀 Performance Optimization Validation');

    // Check for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      Logger.warn('✅ React DevTools detected - use Profiler tab to measure performance');
    } else {
      console.warn('⚠️ React DevTools not detected - install for better performance debugging');
    }

    // Check for lazy loading support
    if (typeof React.lazy === 'function') {
      Logger.warn('✅ React.lazy supported - code splitting available');
    } else {
      console.warn('⚠️ React.lazy not supported - upgrade React version');
    }

    // Check for Suspense support
    if (typeof React.Suspense === 'function') {
      Logger.warn('✅ React.Suspense supported - lazy loading with fallbacks available');
    } else {
      console.warn('⚠️ React.Suspense not supported - upgrade React version');
    }

    // Memory tracking
    trackMemoryUsage('Initial Memory State');

    Logger.info('Performance validation completed');
  }
};

/**
 * Error boundary test utilities
 */
export const errorBoundaryTests = {
  // Test async errors
  testAsyncError: () => {
    setTimeout(() => {
      simulateComponentError('AsyncTest', 'Async error for boundary testing');
    }, 1000);
  },

  // Test network errors
  testNetworkError: () => {
    return fetch('/non-existent-endpoint').catch(error => {
      simulateComponentError('NetworkTest', `Network error: ${error.message}`);
    });
  },

  // Test parsing errors
  testParsingError: () => {
    try {
      JSON.parse('invalid json');
    } catch (error) {
      simulateComponentError('ParsingTest', `JSON parsing error: ${error.message}`);
    }
  },
};

/**
 * Performance monitoring setup for production
 */
export const setupProductionMonitoring = () => {
  if (isProduction()) {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn('Long task detected:', entry);
            // Here you could send to analytics service
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory leaks
    setInterval(() => {
      if (performance.memory && performance.memory.usedJSHeapSize > 100 * 1024 * 1024) {
        // 100MB
        console.warn('High memory usage detected:', performance.memory);
        // Here you could send to analytics service
      }
    }, 30000); // Check every 30 seconds
  }
};

// Export all utilities
export default {
  simulateComponentError,
  ErrorTestComponent,
  createPerformanceMeasure,
  useRenderCounter,
  trackMemoryUsage,
  LazyTestComponent,
  validatePerformanceOptimizations,
  errorBoundaryTests,
  setupProductionMonitoring,
};
