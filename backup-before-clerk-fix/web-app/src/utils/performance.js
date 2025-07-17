/**
 * Performance monitoring utilities for React components
 * Provides tools for measuring render times, memory usage, and optimization insights
 */

// Performance metrics storage
const performanceMetrics = new Map();
const renderTimes = new Map();
const memorySnapshots = [];

/**
 * Performance observer for measuring component render times
 */
class ComponentPerformanceObserver {
  constructor() {
    this.observers = new Map();
    this.isSupported = typeof PerformanceObserver !== 'undefined';
  }

  /**
   * Start measuring a component's performance
   * @param {string} componentName - Name of the component
   * @param {string} operation - Type of operation (render, mount, update)
   */
  startMeasure(componentName, operation = 'render') {
    const markName = `${componentName}-${operation}-start`;
    if (this.isSupported) {
      performance.mark(markName);
    }
    return markName;
  }

  /**
   * End measuring and record the performance
   * @param {string} componentName - Name of the component
   * @param {string} operation - Type of operation
   * @param {string} startMark - Start mark name
   */
  endMeasure(componentName, operation = 'render', startMark) {
    if (!this.isSupported) return;

    const endMarkName = `${componentName}-${operation}-end`;
    const measureName = `${componentName}-${operation}`;
    
    performance.mark(endMarkName);
    performance.measure(measureName, startMark, endMarkName);

    // Get the measurement
    const measures = performance.getEntriesByName(measureName);
    if (measures.length > 0) {
      const duration = measures[measures.length - 1].duration;
      this.recordMetric(componentName, operation, duration);
    }

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);
  }

  /**
   * Record a performance metric
   * @param {string} componentName - Component name
   * @param {string} operation - Operation type
   * @param {number} duration - Duration in milliseconds
   */
  recordMetric(componentName, operation, duration) {
    const key = `${componentName}-${operation}`;
    
    if (!performanceMetrics.has(key)) {
      performanceMetrics.set(key, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0,
        recentTimes: [],
      });
    }

    const metrics = performanceMetrics.get(key);
    metrics.count++;
    metrics.totalTime += duration;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.avgTime = metrics.totalTime / metrics.count;
    
    // Keep only recent 10 measurements
    metrics.recentTimes.push(duration);
    if (metrics.recentTimes.length > 10) {
      metrics.recentTimes.shift();
    }

    // Log slow renders in development
    if (import.meta.env.DEV && duration > 16) {
      console.warn(`🐌 Slow render detected: ${componentName} ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics for a component
   * @param {string} componentName - Component name
   * @param {string} operation - Operation type
   * @returns {Object} Performance metrics
   */
  getMetrics(componentName, operation = 'render') {
    const key = `${componentName}-${operation}`;
    return performanceMetrics.get(key) || null;
  }

  /**
   * Get all performance metrics
   * @returns {Map} All performance metrics
   */
  getAllMetrics() {
    return new Map(performanceMetrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    performanceMetrics.clear();
  }
}

// Global performance observer instance
const performanceObserver = new ComponentPerformanceObserver();

/**
 * React hook for measuring component performance
 * @param {string} componentName - Name of the component
 * @param {Object} options - Configuration options
 * @returns {Object} Performance utilities
 */
export const usePerformanceMonitor = (componentName, options = {}) => {
  const {
    trackRenders = true,
    trackMounts = true,
    trackUpdates = true,
    logSlowRenders = true,
  } = options;

  const startRender = () => {
    if (trackRenders) {
      return performanceObserver.startMeasure(componentName, 'render');
    }
  };

  const endRender = (startMark) => {
    if (trackRenders && startMark) {
      performanceObserver.endMeasure(componentName, 'render', startMark);
    }
  };

  const startMount = () => {
    if (trackMounts) {
      return performanceObserver.startMeasure(componentName, 'mount');
    }
  };

  const endMount = (startMark) => {
    if (trackMounts && startMark) {
      performanceObserver.endMeasure(componentName, 'mount', startMark);
    }
  };

  const startUpdate = () => {
    if (trackUpdates) {
      return performanceObserver.startMeasure(componentName, 'update');
    }
  };

  const endUpdate = (startMark) => {
    if (trackUpdates && startMark) {
      performanceObserver.endMeasure(componentName, 'update', startMark);
    }
  };

  const getMetrics = () => {
    return {
      render: performanceObserver.getMetrics(componentName, 'render'),
      mount: performanceObserver.getMetrics(componentName, 'mount'),
      update: performanceObserver.getMetrics(componentName, 'update'),
    };
  };

  return {
    startRender,
    endRender,
    startMount,
    endMount,
    startUpdate,
    endUpdate,
    getMetrics,
  };
};

/**
 * Memory monitoring utilities
 */
export const memoryMonitor = {
  /**
   * Take a memory snapshot
   * @param {string} label - Label for the snapshot
   */
  snapshot(label = 'unnamed') {
    if (typeof performance.memory !== 'undefined') {
      const snapshot = {
        label,
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
      
      memorySnapshots.push(snapshot);
      
      // Keep only last 50 snapshots
      if (memorySnapshots.length > 50) {
        memorySnapshots.shift();
      }
      
      return snapshot;
    }
    return null;
  },

  /**
   * Get memory usage statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    if (memorySnapshots.length === 0) return null;

    const latest = memorySnapshots[memorySnapshots.length - 1];
    const oldest = memorySnapshots[0];
    
    return {
      current: latest,
      growth: latest.usedJSHeapSize - oldest.usedJSHeapSize,
      snapshots: memorySnapshots.length,
      timeline: memorySnapshots,
    };
  },

  /**
   * Clear memory snapshots
   */
  clear() {
    memorySnapshots.length = 0;
  },

  /**
   * Check if memory usage is high
   * @param {number} threshold - Threshold percentage (0-1)
   * @returns {boolean} Whether memory usage is high
   */
  isMemoryHigh(threshold = 0.8) {
    if (typeof performance.memory === 'undefined') return false;
    
    const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    return usage > threshold;
  },
};

/**
 * Bundle size analyzer utilities
 */
export const bundleAnalyzer = {
  /**
   * Estimate component bundle impact
   * @param {string} componentName - Component name
   * @param {Function} importFn - Dynamic import function
   * @returns {Promise<Object>} Bundle analysis
   */
  async analyzeComponent(componentName, importFn) {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      return {
        componentName,
        loadTime,
        success: true,
        module,
      };
    } catch (error) {
      return {
        componentName,
        loadTime: performance.now() - startTime,
        success: false,
        error,
      };
    }
  },

  /**
   * Track lazy loading performance
   * @param {string} chunkName - Chunk name
   * @param {number} loadTime - Load time in ms
   */
  trackLazyLoad(chunkName, loadTime) {
    if (import.meta.env.DEV) {
      console.log(`📦 Lazy loaded ${chunkName} in ${loadTime.toFixed(2)}ms`);
    }
    
    // Store in performance metrics
    performanceObserver.recordMetric('lazy-load', chunkName, loadTime);
  },
};

/**
 * Performance debugging utilities
 */
export const performanceDebugger = {
  /**
   * Log all performance metrics to console
   */
  logAllMetrics() {
    if (!import.meta.env.DEV) return;
    
    console.group('🔍 Performance Metrics');
    
    const allMetrics = performanceObserver.getAllMetrics();
    allMetrics.forEach((metrics, key) => {
      console.log(`${key}:`, {
        count: metrics.count,
        avg: `${metrics.avgTime.toFixed(2)}ms`,
        min: `${metrics.minTime.toFixed(2)}ms`,
        max: `${metrics.maxTime.toFixed(2)}ms`,
        total: `${metrics.totalTime.toFixed(2)}ms`,
      });
    });
    
    const memoryStats = memoryMonitor.getStats();
    if (memoryStats) {
      console.log('Memory:', {
        current: `${(memoryStats.current.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        growth: `${(memoryStats.growth / 1024 / 1024).toFixed(2)}MB`,
        snapshots: memoryStats.snapshots,
      });
    }
    
    console.groupEnd();
  },

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getReport() {
    const metrics = {};
    const allMetrics = performanceObserver.getAllMetrics();
    
    allMetrics.forEach((data, key) => {
      metrics[key] = {
        count: data.count,
        avgTime: parseFloat(data.avgTime.toFixed(2)),
        minTime: parseFloat(data.minTime.toFixed(2)),
        maxTime: parseFloat(data.maxTime.toFixed(2)),
        totalTime: parseFloat(data.totalTime.toFixed(2)),
      };
    });

    return {
      metrics,
      memory: memoryMonitor.getStats(),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Export performance data as JSON
   * @returns {string} JSON string of performance data
   */
  exportData() {
    return JSON.stringify(this.getReport(), null, 2);
  },
};

// Auto-snapshot memory every 30 seconds in development
if (import.meta.env.DEV && typeof performance.memory !== 'undefined') {
  setInterval(() => {
    memoryMonitor.snapshot('auto');
  }, 30000);
}

// Export the main performance observer
export { performanceObserver };
export default {
  usePerformanceMonitor,
  memoryMonitor,
  bundleAnalyzer,
  performanceDebugger,
  performanceObserver,
};