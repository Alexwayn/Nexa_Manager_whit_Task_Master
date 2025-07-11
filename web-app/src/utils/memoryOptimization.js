/**
 * Memory optimization utilities for React components
 * Helps prevent memory leaks and optimize memory usage
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';

// Memory monitoring configuration
const MEMORY_CONFIG = {
  // Warning thresholds
  HEAP_WARNING_THRESHOLD: 100 * 1024 * 1024, // 100MB
  HEAP_CRITICAL_THRESHOLD: 200 * 1024 * 1024, // 200MB
  
  // Monitoring intervals
  MONITOR_INTERVAL: 30000, // 30 seconds
  GC_SUGGESTION_INTERVAL: 60000, // 1 minute
  
  // Component limits
  MAX_COMPONENT_INSTANCES: 50,
  MAX_EVENT_LISTENERS: 100,
};

// Global memory tracker
class MemoryTracker {
  constructor() {
    this.componentInstances = new Map();
    this.eventListeners = new Set();
    this.memorySnapshots = [];
    this.isMonitoring = false;
    
    this.startMonitoring();
  }
  
  // Track component instance
  trackComponent(componentName, instanceId) {
    if (!this.componentInstances.has(componentName)) {
      this.componentInstances.set(componentName, new Set());
    }
    
    this.componentInstances.get(componentName).add(instanceId);
    
    // Warn if too many instances
    const instanceCount = this.componentInstances.get(componentName).size;
    if (instanceCount > MEMORY_CONFIG.MAX_COMPONENT_INSTANCES) {
      console.warn(
        `⚠️ Memory Warning: ${componentName} has ${instanceCount} instances. Consider component cleanup.`
      );
    }
  }
  
  // Untrack component instance
  untrackComponent(componentName, instanceId) {
    const instances = this.componentInstances.get(componentName);
    if (instances) {
      instances.delete(instanceId);
      if (instances.size === 0) {
        this.componentInstances.delete(componentName);
      }
    }
  }
  
  // Track event listener
  trackEventListener(element, event, handler, options = {}) {
    const listenerId = `${element.constructor.name}_${event}_${Date.now()}`;
    
    this.eventListeners.add({
      id: listenerId,
      element,
      event,
      handler,
      options,
      timestamp: Date.now(),
    });
    
    // Warn if too many listeners
    if (this.eventListeners.size > MEMORY_CONFIG.MAX_EVENT_LISTENERS) {
      console.warn(
        `⚠️ Memory Warning: ${this.eventListeners.size} event listeners registered. Check for cleanup.`
      );
    }
    
    return listenerId;
  }
  
  // Untrack event listener
  untrackEventListener(listenerId) {
    this.eventListeners = new Set(
      Array.from(this.eventListeners).filter(listener => listener.id !== listenerId)
    );
  }
  
  // Get memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
      };
    }
    
    return null;
  }
  
  // Take memory snapshot
  takeSnapshot() {
    const usage = this.getMemoryUsage();
    if (usage) {
      const snapshot = {
        timestamp: Date.now(),
        ...usage,
        componentCount: this.componentInstances.size,
        listenerCount: this.eventListeners.size,
      };
      
      this.memorySnapshots.push(snapshot);
      
      // Keep only last 100 snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }
      
      return snapshot;
    }
    
    return null;
  }
  
  // Start memory monitoring
  startMonitoring() {
    if (this.isMonitoring || !performance.memory) return;
    
    this.isMonitoring = true;
    
    this.monitorInterval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      
      if (snapshot) {
        // Check for memory warnings
        if (snapshot.used > MEMORY_CONFIG.HEAP_CRITICAL_THRESHOLD) {
          console.error(
            `🚨 Critical Memory Usage: ${(snapshot.used / 1024 / 1024).toFixed(2)}MB used`
          );
          this.suggestGarbageCollection();
        } else if (snapshot.used > MEMORY_CONFIG.HEAP_WARNING_THRESHOLD) {
          console.warn(
            `⚠️ High Memory Usage: ${(snapshot.used / 1024 / 1024).toFixed(2)}MB used`
          );
        }
      }
    }, MEMORY_CONFIG.MONITOR_INTERVAL);
  }
  
  // Stop memory monitoring
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.isMonitoring = false;
    }
  }
  
  // Suggest garbage collection
  suggestGarbageCollection() {
    if (window.gc && typeof window.gc === 'function') {
      console.log('🗑️ Triggering garbage collection...');
      window.gc();
    } else {
      console.log('💡 Consider triggering garbage collection manually');
    }
  }
  
  // Get memory report
  getReport() {
    const usage = this.getMemoryUsage();
    const componentStats = {};
    
    for (const [name, instances] of this.componentInstances.entries()) {
      componentStats[name] = instances.size;
    }
    
    return {
      memoryUsage: usage,
      componentInstances: componentStats,
      eventListeners: this.eventListeners.size,
      snapshots: this.memorySnapshots.slice(-10), // Last 10 snapshots
      recommendations: this.getRecommendations(),
    };
  }
  
  // Get optimization recommendations
  getRecommendations() {
    const recommendations = [];
    const usage = this.getMemoryUsage();
    
    if (usage) {
      if (usage.percentage > 80) {
        recommendations.push('Memory usage is high. Consider component cleanup.');
      }
      
      if (this.componentInstances.size > 20) {
        recommendations.push('Many component types active. Review component lifecycle.');
      }
      
      if (this.eventListeners.size > 50) {
        recommendations.push('Many event listeners active. Ensure proper cleanup.');
      }
    }
    
    // Check for memory leaks in snapshots
    if (this.memorySnapshots.length >= 5) {
      const recent = this.memorySnapshots.slice(-5);
      const trend = recent[recent.length - 1].used - recent[0].used;
      
      if (trend > 10 * 1024 * 1024) { // 10MB increase
        recommendations.push('Memory usage trending upward. Check for memory leaks.');
      }
    }
    
    return recommendations;
  }
}

// Global memory tracker instance
const memoryTracker = new MemoryTracker();

// React hooks for memory optimization

/**
 * Hook to track component memory usage
 */
export const useMemoryTracker = (componentName) => {
  const instanceId = useRef(`${componentName}_${Date.now()}_${Math.random()}`);
  
  useEffect(() => {
    memoryTracker.trackComponent(componentName, instanceId.current);
    
    return () => {
      memoryTracker.untrackComponent(componentName, instanceId.current);
    };
  }, [componentName]);
  
  return instanceId.current;
};

/**
 * Hook for optimized event listeners with automatic cleanup
 */
export const useOptimizedEventListener = (element, event, handler, options = {}) => {
  const listenerIdRef = useRef(null);
  const handlerRef = useRef(handler);
  
  // Update handler ref
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const targetElement = element?.current || element;
    if (!targetElement) return;
    
    // Wrapped handler for tracking
    const wrappedHandler = (...args) => {
      handlerRef.current(...args);
    };
    
    // Add event listener
    targetElement.addEventListener(event, wrappedHandler, options);
    
    // Track listener
    listenerIdRef.current = memoryTracker.trackEventListener(
      targetElement,
      event,
      wrappedHandler,
      options
    );
    
    return () => {
      targetElement.removeEventListener(event, wrappedHandler, options);
      if (listenerIdRef.current) {
        memoryTracker.untrackEventListener(listenerIdRef.current);
      }
    };
  }, [element, event, options]);
};

/**
 * Hook for memory-optimized memoization
 */
export const useMemoryOptimizedMemo = (factory, deps, maxSize = 10) => {
  const cacheRef = useRef(new Map());
  
  return useMemo(() => {
    const key = JSON.stringify(deps);
    
    // Check cache
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }
    
    // Compute new value
    const value = factory();
    
    // Add to cache
    cacheRef.current.set(key, value);
    
    // Limit cache size
    if (cacheRef.current.size > maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    return value;
  }, deps);
};

/**
 * Hook for memory-optimized callbacks
 */
export const useMemoryOptimizedCallback = (callback, deps, debounceMs = 0) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, debounceMs);
    } else {
      callback(...args);
    }
  }, deps);
};

/**
 * Hook for component cleanup
 */
export const useComponentCleanup = (cleanupFn) => {
  const cleanupRef = useRef(cleanupFn);
  
  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);
  
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};

/**
 * Hook for memory usage monitoring
 */
export const useMemoryMonitor = (interval = 5000) => {
  const [memoryUsage, setMemoryUsage] = useState(null);
  
  useEffect(() => {
    const updateMemoryUsage = () => {
      const usage = memoryTracker.getMemoryUsage();
      setMemoryUsage(usage);
    };
    
    updateMemoryUsage();
    const intervalId = setInterval(updateMemoryUsage, interval);
    
    return () => clearInterval(intervalId);
  }, [interval]);
  
  return memoryUsage;
};

// Utility functions

/**
 * Create a memory-optimized component wrapper
 */
export const withMemoryOptimization = (Component, componentName) => {
  const MemoryOptimizedComponent = React.memo((props) => {
    useMemoryTracker(componentName || Component.displayName || Component.name);
    return <Component {...props} />;
  });
  
  MemoryOptimizedComponent.displayName = `MemoryOptimized(${componentName || Component.displayName || Component.name})`;
  
  return MemoryOptimizedComponent;
};

/**
 * Cleanup function for manual memory management
 */
export const cleanupMemory = () => {
  // Clear any global caches
  if (window.reportCache) {
    window.reportCache.clearExpired();
  }
  
  // Suggest garbage collection
  memoryTracker.suggestGarbageCollection();
  
  console.log('🧹 Memory cleanup completed');
};

/**
 * Get memory optimization report
 */
export const getMemoryReport = () => {
  return memoryTracker.getReport();
};

/**
 * Memory optimization utilities for development
 */
export const memoryDevTools = {
  // Log memory usage
  logMemoryUsage: () => {
    const usage = memoryTracker.getMemoryUsage();
    if (usage) {
      console.log('📊 Memory Usage:', {
        used: `${(usage.used / 1024 / 1024).toFixed(2)}MB`,
        total: `${(usage.total / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${usage.percentage.toFixed(2)}%`,
      });
    }
  },
  
  // Log component instances
  logComponentInstances: () => {
    console.log('🧩 Component Instances:', Object.fromEntries(memoryTracker.componentInstances));
  },
  
  // Log event listeners
  logEventListeners: () => {
    console.log('👂 Event Listeners:', memoryTracker.eventListeners.size);
  },
  
  // Force garbage collection (if available)
  forceGC: () => {
    memoryTracker.suggestGarbageCollection();
  },
  
  // Get full report
  getReport: () => {
    return memoryTracker.getReport();
  },
};

// Export memory tracker for advanced usage
export { memoryTracker, MEMORY_CONFIG };

// Make memory dev tools available globally in development
if (import.meta.env.DEV) {
  window.memoryDevTools = memoryDevTools;
  window.memoryTracker = memoryTracker;
}

export default {
  useMemoryTracker,
  useOptimizedEventListener,
  useMemoryOptimizedMemo,
  useMemoryOptimizedCallback,
  useComponentCleanup,
  useMemoryMonitor,
  withMemoryOptimization,
  cleanupMemory,
  getMemoryReport,
  memoryDevTools,
};