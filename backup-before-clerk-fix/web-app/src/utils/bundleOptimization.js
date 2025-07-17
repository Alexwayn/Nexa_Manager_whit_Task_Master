/**
 * Bundle optimization utilities
 * Helps with code splitting, lazy loading, and bundle analysis
 */

import React from 'react';

// Bundle analysis configuration
const BUNDLE_CONFIG = {
  // Size thresholds (in bytes)
  CHUNK_SIZE_WARNING: 500 * 1024, // 500KB
  CHUNK_SIZE_CRITICAL: 1024 * 1024, // 1MB
  
  // Loading timeouts
  LAZY_LOAD_TIMEOUT: 10000, // 10 seconds
  CHUNK_LOAD_TIMEOUT: 5000, // 5 seconds
  
  // Performance budgets
  INITIAL_BUNDLE_BUDGET: 200 * 1024, // 200KB
  ROUTE_CHUNK_BUDGET: 300 * 1024, // 300KB
  
  // Cache settings
  PRELOAD_CACHE_SIZE: 5,
  PREFETCH_DELAY: 2000, // 2 seconds
};

// Bundle analyzer class
class BundleAnalyzer {
  constructor() {
    this.loadedChunks = new Map();
    this.loadingChunks = new Map();
    this.failedChunks = new Set();
    this.preloadQueue = new Set();
    this.metrics = {
      totalChunks: 0,
      loadedChunks: 0,
      failedChunks: 0,
      averageLoadTime: 0,
      totalLoadTime: 0,
    };
    
    this.setupChunkLoadTracking();
  }
  
  // Track chunk loading
  trackChunkLoad(chunkName, startTime = Date.now()) {
    this.loadingChunks.set(chunkName, {
      startTime,
      timeout: setTimeout(() => {
        this.handleChunkTimeout(chunkName);
      }, BUNDLE_CONFIG.CHUNK_LOAD_TIMEOUT),
    });
    
    this.metrics.totalChunks++;
  }
  
  // Handle successful chunk load
  handleChunkLoaded(chunkName, size = 0) {
    const loadingInfo = this.loadingChunks.get(chunkName);
    
    if (loadingInfo) {
      const loadTime = Date.now() - loadingInfo.startTime;
      
      // Clear timeout
      clearTimeout(loadingInfo.timeout);
      this.loadingChunks.delete(chunkName);
      
      // Store chunk info
      this.loadedChunks.set(chunkName, {
        loadTime,
        size,
        timestamp: Date.now(),
      });
      
      // Update metrics
      this.metrics.loadedChunks++;
      this.metrics.totalLoadTime += loadTime;
      this.metrics.averageLoadTime = this.metrics.totalLoadTime / this.metrics.loadedChunks;
      
      // Check size warnings
      this.checkChunkSize(chunkName, size);
      
      if (import.meta.env.DEV) {
        console.log(`📦 Chunk loaded: ${chunkName} (${this.formatSize(size)}, ${loadTime}ms)`);
      }
    }
  }
  
  // Handle chunk load failure
  handleChunkFailed(chunkName, error) {
    const loadingInfo = this.loadingChunks.get(chunkName);
    
    if (loadingInfo) {
      clearTimeout(loadingInfo.timeout);
      this.loadingChunks.delete(chunkName);
    }
    
    this.failedChunks.add(chunkName);
    this.metrics.failedChunks++;
    
    console.error(`❌ Chunk failed to load: ${chunkName}`, error);
  }
  
  // Handle chunk load timeout
  handleChunkTimeout(chunkName) {
    this.loadingChunks.delete(chunkName);
    this.handleChunkFailed(chunkName, new Error('Chunk load timeout'));
  }
  
  // Check chunk size and warn if necessary
  checkChunkSize(chunkName, size) {
    if (size > BUNDLE_CONFIG.CHUNK_SIZE_CRITICAL) {
      console.error(
        `🚨 Critical chunk size: ${chunkName} (${this.formatSize(size)}). Consider code splitting.`
      );
    } else if (size > BUNDLE_CONFIG.CHUNK_SIZE_WARNING) {
      console.warn(
        `⚠️ Large chunk size: ${chunkName} (${this.formatSize(size)}). Consider optimization.`
      );
    }
  }
  
  // Format file size
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Setup chunk load tracking
  setupChunkLoadTracking() {
    // Override dynamic import to track chunk loading
    const originalImport = window.__webpack_require__?.e || (() => Promise.resolve());
    
    if (window.__webpack_require__) {
      window.__webpack_require__.e = (chunkId) => {
        this.trackChunkLoad(chunkId);
        
        return originalImport(chunkId)
          .then((result) => {
            this.handleChunkLoaded(chunkId);
            return result;
          })
          .catch((error) => {
            this.handleChunkFailed(chunkId, error);
            throw error;
          });
      };
    }
  }
  
  // Get bundle analysis report
  getReport() {
    const loadedChunksInfo = Array.from(this.loadedChunks.entries()).map(([name, info]) => ({
      name,
      ...info,
      sizeFormatted: this.formatSize(info.size),
    }));
    
    return {
      metrics: this.metrics,
      loadedChunks: loadedChunksInfo,
      failedChunks: Array.from(this.failedChunks),
      currentlyLoading: Array.from(this.loadingChunks.keys()),
      recommendations: this.getRecommendations(),
    };
  }
  
  // Get optimization recommendations
  getRecommendations() {
    const recommendations = [];
    
    // Check failure rate
    const failureRate = this.metrics.failedChunks / this.metrics.totalChunks;
    if (failureRate > 0.1) {
      recommendations.push('High chunk failure rate. Check network conditions and chunk availability.');
    }
    
    // Check average load time
    if (this.metrics.averageLoadTime > 3000) {
      recommendations.push('Slow chunk loading. Consider chunk size optimization or CDN usage.');
    }
    
    // Check large chunks
    const largeChunks = Array.from(this.loadedChunks.entries())
      .filter(([, info]) => info.size > BUNDLE_CONFIG.CHUNK_SIZE_WARNING)
      .length;
    
    if (largeChunks > 0) {
      recommendations.push(`${largeChunks} large chunks detected. Consider further code splitting.`);
    }
    
    return recommendations;
  }
}

// Global bundle analyzer instance
const bundleAnalyzer = new BundleAnalyzer();

// Lazy loading utilities

/**
 * Enhanced lazy loading with error handling and retries
 */
export const createLazyComponent = (importFn, options = {}) => {
  const {
    fallback = null,
    errorFallback = null,
    retries = 3,
    retryDelay = 1000,
    chunkName = 'unknown',
  } = options;
  
  const LazyComponent = React.lazy(() => {
    let retryCount = 0;
    
    const loadWithRetry = async () => {
      try {
        bundleAnalyzer.trackChunkLoad(chunkName);
        const startTime = Date.now();
        
        const module = await importFn();
        
        const loadTime = Date.now() - startTime;
        bundleAnalyzer.handleChunkLoaded(chunkName, 0); // Size unknown in this context
        
        return module;
      } catch (error) {
        if (retryCount < retries) {
          retryCount++;
          console.warn(`🔄 Retrying chunk load: ${chunkName} (attempt ${retryCount}/${retries})`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          return loadWithRetry();
        }
        
        bundleAnalyzer.handleChunkFailed(chunkName, error);
        throw error;
      }
    };
    
    return loadWithRetry();
  });
  
  // Add display name for debugging
  LazyComponent.displayName = `Lazy(${chunkName})`;
  
  return LazyComponent;
};

/**
 * Preload component for better UX
 */
export const preloadComponent = (importFn, chunkName = 'preload') => {
  if (bundleAnalyzer.preloadQueue.has(chunkName)) {
    return; // Already preloading
  }
  
  bundleAnalyzer.preloadQueue.add(chunkName);
  
  setTimeout(() => {
    importFn()
      .then(() => {
        if (import.meta.env.DEV) {
          console.log(`✅ Preloaded: ${chunkName}`);
        }
      })
      .catch((error) => {
        console.warn(`⚠️ Preload failed: ${chunkName}`, error);
      })
      .finally(() => {
        bundleAnalyzer.preloadQueue.delete(chunkName);
      });
  }, BUNDLE_CONFIG.PREFETCH_DELAY);
};

/**
 * Route-based code splitting helper
 */
export const createRouteComponent = (importFn, routeName) => {
  return createLazyComponent(importFn, {
    chunkName: `route-${routeName}`,
    retries: 2,
    retryDelay: 500,
  });
};

/**
 * Feature-based code splitting helper
 */
export const createFeatureComponent = (importFn, featureName) => {
  return createLazyComponent(importFn, {
    chunkName: `feature-${featureName}`,
    retries: 3,
    retryDelay: 1000,
  });
};

// Bundle optimization hooks

/**
 * Hook for monitoring bundle loading
 */
export const useBundleMonitor = () => {
  const [report, setReport] = React.useState(null);
  
  React.useEffect(() => {
    const updateReport = () => {
      setReport(bundleAnalyzer.getReport());
    };
    
    updateReport();
    const interval = setInterval(updateReport, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return report;
};

/**
 * Hook for preloading components based on user interaction
 */
export const usePreloadOnHover = (importFn, chunkName) => {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  
  const handleMouseEnter = React.useCallback(() => {
    if (!isPreloaded) {
      preloadComponent(importFn, chunkName);
      setIsPreloaded(true);
    }
  }, [importFn, chunkName, isPreloaded]);
  
  return { onMouseEnter: handleMouseEnter };
};

/**
 * Hook for intersection-based preloading
 */
export const usePreloadOnVisible = (importFn, chunkName, options = {}) => {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const elementRef = React.useRef(null);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || isPreloaded) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadComponent(importFn, chunkName);
          setIsPreloaded(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [importFn, chunkName, isPreloaded, options]);
  
  return elementRef;
};

// Performance utilities

/**
 * Measure component render time
 */
export const withRenderTimeTracking = (Component, componentName) => {
  const TrackedComponent = React.memo((props) => {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const renderTime = performance.now() - startTime;
        if (import.meta.env.DEV && renderTime > 16) { // > 1 frame at 60fps
          console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
        }
      };
    });
    
    return <Component {...props} />;
  });
  
  TrackedComponent.displayName = `RenderTracked(${componentName})`;
  return TrackedComponent;
};

/**
 * Bundle size estimation
 */
export const estimateBundleSize = async (importFn) => {
  try {
    const startTime = performance.now();
    const module = await importFn();
    const loadTime = performance.now() - startTime;
    
    // Rough estimation based on load time
    // This is not accurate but gives a general idea
    const estimatedSize = loadTime * 100; // Very rough estimate
    
    return {
      loadTime,
      estimatedSize,
      module,
    };
  } catch (error) {
    console.error('Failed to estimate bundle size:', error);
    return null;
  }
};

// Development utilities
export const bundleDevTools = {
  // Get bundle report
  getReport: () => bundleAnalyzer.getReport(),
  
  // Log bundle metrics
  logMetrics: () => {
    const report = bundleAnalyzer.getReport();
    console.log('📊 Bundle Metrics:', report.metrics);
  },
  
  // Log loaded chunks
  logChunks: () => {
    const report = bundleAnalyzer.getReport();
    console.table(report.loadedChunks);
  },
  
  // Simulate chunk load failure (for testing)
  simulateChunkFailure: (chunkName) => {
    bundleAnalyzer.handleChunkFailed(chunkName, new Error('Simulated failure'));
  },
  
  // Clear metrics
  clearMetrics: () => {
    bundleAnalyzer.loadedChunks.clear();
    bundleAnalyzer.failedChunks.clear();
    bundleAnalyzer.metrics = {
      totalChunks: 0,
      loadedChunks: 0,
      failedChunks: 0,
      averageLoadTime: 0,
      totalLoadTime: 0,
    };
  },
};

// Make dev tools available globally in development
if (import.meta.env.DEV) {
  window.bundleDevTools = bundleDevTools;
  window.bundleAnalyzer = bundleAnalyzer;
}

export { bundleAnalyzer, BUNDLE_CONFIG };

export default {
  createLazyComponent,
  preloadComponent,
  createRouteComponent,
  createFeatureComponent,
  useBundleMonitor,
  usePreloadOnHover,
  usePreloadOnVisible,
  withRenderTimeTracking,
  estimateBundleSize,
  bundleDevTools,
};