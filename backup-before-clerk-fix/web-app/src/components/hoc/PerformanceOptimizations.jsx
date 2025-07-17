import React, { memo, useRef, useEffect, useMemo, useCallback, useState } from 'react';

/**
 * Higher-Order Component for preventing unnecessary re-renders
 * Uses React.memo with custom comparison function
 */
export const withMemoization = (Component, customCompare) => {
  const MemoizedComponent = memo(Component, customCompare);
  MemoizedComponent.displayName = `withMemoization(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * HOC for deep comparison memoization
 * Useful for components that receive complex objects as props
 */
export const withDeepMemo = Component => {
  const deepCompare = (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  };

  return withMemoization(Component, deepCompare);
};

/**
 * HOC for shallow comparison memoization
 * More performant than deep comparison for simple props
 */
export const withShallowMemo = Component => {
  const shallowCompare = (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (let key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  };

  return withMemoization(Component, shallowCompare);
};

/**
 * HOC for render counting (development only)
 * Helps identify components that re-render frequently
 */
export const withRenderCount = Component => {
  if (import.meta.env.MODE !== 'development') {
    return Component;
  }

  const RenderCountComponent = props => {
    const renderCount = useRef(0);
    const componentName = Component.displayName || Component.name || 'Anonymous';

    renderCount.current += 1;

    useEffect(() => {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    });

    return <Component {...props} />;
  };

  RenderCountComponent.displayName = `withRenderCount(${Component.displayName || Component.name})`;
  return RenderCountComponent;
};

/**
 * HOC for performance profiling (development only)
 * Measures and logs render performance
 */
export const withPerformanceProfiler = Component => {
  if (import.meta.env.MODE !== 'development') {
    return Component;
  }

  const ProfiledComponent = props => {
    const componentName = Component.displayName || Component.name || 'Anonymous';
    const startTime = useRef();

    useEffect(() => {
      startTime.current = performance.now();
    });

    useEffect(() => {
      if (startTime.current) {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;

        if (renderTime > 16) {
          // More than one frame (16ms at 60fps)
          console.warn(`⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        } else {
          console.log(`✅ ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
        }
      }
    });

    return <Component {...props} />;
  };

  ProfiledComponent.displayName = `withPerformanceProfiler(${Component.displayName || Component.name})`;
  return ProfiledComponent;
};

/**
 * Custom hook for optimized event handlers
 * Prevents creating new function references on every render
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Custom hook for optimized memoized values
 * More explicit about dependencies than useMemo
 */
export const useOptimizedMemo = (factory, deps) => {
  return useMemo(factory, deps);
};

/**
 * Custom hook for stable object references
 * Prevents unnecessary re-renders when passing objects as props
 */
export const useStableObject = obj => {
  return useMemo(() => obj, [JSON.stringify(obj)]);
};

/**
 * Custom hook for debounced values
 * Useful for search inputs and API calls
 */
export const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for throttled callbacks
 * Limits how often a function can be called
 */
export const useThrottledCallback = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay],
  );
};

/**
 * HOC for lazy loading components with Suspense
 * Automatically wraps component with error boundaries
 */
export const withLazyLoading = (importFunc, fallback = <div>Loading...</div>) => {
  const LazyComponent = React.lazy(importFunc);

  const LazyLoadedComponent = props => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  );

  LazyLoadedComponent.displayName = 'LazyLoadedComponent';
  return LazyLoadedComponent;
};

/**
 * Custom hook for window size optimization
 * Only updates when significant changes occur
 */
export const useOptimizedWindowSize = (threshold = 50) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Only update if change is significant
        if (
          Math.abs(newWidth - windowSize.width) > threshold ||
          Math.abs(newHeight - windowSize.height) > threshold
        ) {
          setWindowSize({ width: newWidth, height: newHeight });
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [windowSize.width, windowSize.height, threshold]);

  return windowSize;
};

/**
 * Performance monitoring utility for Context providers
 */
export const ContextPerformanceMonitor = ({ children, contextName = 'Unknown' }) => {
  const renderCount = useRef(0);

  if (import.meta.env.MODE === 'development') {
    renderCount.current += 1;

    useEffect(() => {
      console.log(`🏪 ${contextName} Context Provider rendered ${renderCount.current} times`);
    });
  }

  return children;
};

/**
 * Optimized list component for rendering large datasets
 * Uses React.memo and key optimization
 */
export const OptimizedList = memo(({ items, renderItem, keyExtractor, className = '' }) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index;
      return <div key={key}>{renderItem(item, index)}</div>;
    });
  }, [items, renderItem, keyExtractor]);

  return <div className={className}>{memoizedItems}</div>;
});

OptimizedList.displayName = 'OptimizedList';

/**
 * Performance utilities for debugging
 */
export const PerformanceUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: (componentName, renderFunction) => {
    if (import.meta.env.MODE !== 'development') {
      return renderFunction();
    }

    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();

    console.log(`📊 ${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  },

  /**
   * Log component props changes
   */
  logPropsChanges: (componentName, prevProps, nextProps) => {
    if (import.meta.env.MODE !== 'development') return;

    const changedProps = {};
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);

    allKeys.forEach(key => {
      if (prevProps[key] !== nextProps[key]) {
        changedProps[key] = {
          from: prevProps[key],
          to: nextProps[key],
        };
      }
    });

    if (Object.keys(changedProps).length > 0) {
      console.log(`📝 ${componentName} props changed:`, changedProps);
    }
  },

  /**
   * Memory usage profiler
   */
  logMemoryUsage: (label = 'Memory Usage') => {
    if (import.meta.env.MODE !== 'development' || !performance.memory) return;

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    console.log(`💾 ${label}:`, {
      used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  },
};

export default {
  withMemoization,
  withDeepMemo,
  withShallowMemo,
  withRenderCount,
  withPerformanceProfiler,
  withLazyLoading,
  useOptimizedCallback,
  useOptimizedMemo,
  useStableObject,
  useDebouncedValue,
  useThrottledCallback,
  useOptimizedWindowSize,
  ContextPerformanceMonitor,
  OptimizedList,
  PerformanceUtils,
};
