import { useEffect, useRef, useCallback } from 'react';
import Logger from '@/utils/Logger';

/**
 * Custom hook for monitoring performance metrics
 * Tracks bundle loading, component render times, and navigation performance
 */
export const usePerformanceMonitor = (componentName = 'Unknown') => {
  const renderStartTime = useRef(Date.now());
  const isFirstRender = useRef(true);
  const performanceData = useRef({
    componentName,
    renderTimes: [],
    mountTime: null,
    updateTimes: [],
  });

  // Track component mount/unmount times
  useEffect(() => {
    const mountTime = Date.now() - renderStartTime.current;
    performanceData.current.mountTime = mountTime;

    if (import.meta.env.MODE === 'development') {
      Logger.info(`🚀 Component mounted: ${componentName} (${mountTime}ms)`);
    }

    return () => {
      if (import.meta.env.MODE === 'development') {
        Logger.info(`🔄 Component unmounted: ${componentName}`);
        // Send performance data to analytics (in production)
        logPerformanceData(performanceData.current);
      }
    };
  }, [componentName]);

  // Track render performance
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      performanceData.current.renderTimes.push(renderTime);
    } else {
      performanceData.current.updateTimes.push(renderTime);
    }

    // Log slow renders in development
    if (import.meta.env.MODE === 'development' && renderTime > 100) {
      Logger.warn(`⚠️ Slow render detected: ${componentName} (${renderTime}ms)`);
    }

    renderStartTime.current = Date.now();
  });

  // Measure specific operations
  const measureOperation = useCallback(
    (operationName, operation) => {
      return new Promise((resolve, reject) => {
        const startTime = performance.now();

        Promise.resolve(operation())
          .then(result => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (import.meta.env.MODE === 'development') {
              Logger.info(
                `⚡ Operation "${operationName}" in ${componentName}: ${duration.toFixed(2)}ms`,
              );
            }

            resolve(result);
          })
          .catch(error => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            Logger.error(
              `❌ Operation "${operationName}" failed in ${componentName} after ${duration.toFixed(2)}ms:`,
              error,
            );
            reject(error);
          });
      });
    },
    [componentName],
  );

  // Get current performance metrics
  const getMetrics = useCallback(() => {
    return {
      ...performanceData.current,
      averageRenderTime:
        performanceData.current.renderTimes.length > 0
          ? performanceData.current.renderTimes.reduce((a, b) => a + b, 0) /
            performanceData.current.renderTimes.length
          : 0,
      averageUpdateTime:
        performanceData.current.updateTimes.length > 0
          ? performanceData.current.updateTimes.reduce((a, b) => a + b, 0) /
            performanceData.current.updateTimes.length
          : 0,
    };
  }, []);

  return {
    measureOperation,
    getMetrics,
  };
};

/**
 * Log performance data to analytics service
 */
const logPerformanceData = data => {
  try {
    // In production, send to analytics service
    if (import.meta.env.MODE === 'production' && window.gtag) {
      window.gtag('event', 'performance_metrics', {
        component_name: data.componentName,
        mount_time: data.mountTime,
        average_render_time:
          data.renderTimes.length > 0
            ? data.renderTimes.reduce((a, b) => a + b, 0) / data.renderTimes.length
            : 0,
        render_count: data.renderTimes.length,
        update_count: data.updateTimes.length,
      });
    }
  } catch (error) {
    Logger.error('Failed to log performance data:', error);
  }
};

/**
 * Monitor Core Web Vitals
 */
export const useCoreWebVitals = () => {
  useEffect(() => {
    if ('web-vital' in window) {
      return; // Already monitoring
    }

    // Mark that we're monitoring
    window['web-vital'] = true;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry;
          Logger.info('📊 Navigation Timing:', {
            dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcp: navEntry.connectEnd - navEntry.connectStart,
            request: navEntry.responseStart - navEntry.requestStart,
            response: navEntry.responseEnd - navEntry.responseStart,
            dom: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            load: navEntry.loadEventEnd - navEntry.loadEventStart,
            total: navEntry.loadEventEnd - navEntry.navigationStart,
          });
        }

        if (entry.entryType === 'paint') {
          Logger.info(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        }

        if (entry.entryType === 'largest-contentful-paint') {
          Logger.info(`🖼️ Largest Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

    return () => {
      observer.disconnect();
      delete window['web-vital'];
    };
  }, []);
};

/**
 * Monitor bundle loading performance
 */
export const useBundlePerformance = () => {
  useEffect(() => {
    const logBundleMetrics = () => {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(
          resource => resource.name.includes('.js') && resource.name.includes('/assets/'),
        );

        const totalJSSize = jsResources.reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);

        const bundleMetrics = {
          totalBundles: jsResources.length,
          totalSize: totalJSSize,
          averageLoadTime:
            jsResources.length > 0
              ? jsResources.reduce((total, resource) => total + resource.duration, 0) /
                jsResources.length
              : 0,
          largestBundle: jsResources.reduce((largest, resource) => {
            return (resource.transferSize || 0) > (largest.transferSize || 0) ? resource : largest;
          }, {}),
        };

        Logger.info('📦 Bundle Performance:', bundleMetrics);

        // Log warning for large bundles
        if (totalJSSize > 1024 * 1024) {
          // 1MB
          Logger.warn(
            `⚠️ Large bundle detected: ${(totalJSSize / 1024 / 1024).toFixed(2)}MB total JS`,
          );
        }
      }
    };

    // Run after page load
    if (document.readyState === 'complete') {
      setTimeout(logBundleMetrics, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(logBundleMetrics, 1000));
    }
  }, []);
};

export default usePerformanceMonitor;
