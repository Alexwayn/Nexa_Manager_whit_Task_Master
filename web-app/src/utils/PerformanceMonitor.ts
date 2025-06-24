/**
 * Performance Monitoring System
 * Tracks application performance metrics and provides insights
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  rerenderCount: number;
  propsChanged: string[];
  timestamp: number;
}

export interface APICallMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

export interface UserInteractionMetric {
  action: string;
  element: string;
  duration?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: ComponentRenderMetric[] = [];
  private apiMetrics: APICallMetric[] = [];
  private userMetrics: UserInteractionMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  private constructor() {
    this.initializeObservers();
    this.setupPeriodicReporting();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize Web Performance API observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor Core Web Vitals
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: (entry as any).value || entry.duration || 0,
            timestamp: Date.now(),
            tags: { type: 'web-vital' }
          });
        }
      });

      vitalsObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      this.observers.push(vitalsObserver);

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric({
            name: `resource-load-${resource.initiatorType}`,
            value: resource.duration,
            timestamp: Date.now(),
            tags: {
              type: 'resource',
              name: resource.name,
              initiator: resource.initiatorType
            }
          });
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'long-task',
            value: entry.duration,
            timestamp: Date.now(),
            tags: { type: 'performance-issue' }
          });
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  /**
   * Record a general performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Record component render performance
   */
  public recordComponentRender(metric: ComponentRenderMetric): void {
    if (!this.isEnabled) return;

    this.componentMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    if (this.componentMetrics.length > 500) {
      this.componentMetrics.shift();
    }
  }

  /**
   * Record API call performance
   */
  public recordAPICall(metric: APICallMetric): void {
    if (!this.isEnabled) return;

    this.apiMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    if (this.apiMetrics.length > 500) {
      this.apiMetrics.shift();
    }
  }

  /**
   * Record user interaction
   */
  public recordUserInteraction(metric: UserInteractionMetric): void {
    if (!this.isEnabled) return;

    this.userMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });

    if (this.userMetrics.length > 300) {
      this.userMetrics.shift();
    }
  }

  /**
   * Measure function execution time
   */
  public measureFunction<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `function-execution-${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, type: 'function-timing' }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `function-error-${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, type: 'function-error' }
      });
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `async-function-execution-${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, type: 'async-function-timing' }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `async-function-error-${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, type: 'async-function-error' }
      });
      throw error;
    }
  }

  /**
   * Get Core Web Vitals
   */
  public getCoreWebVitals(): Record<string, number> {
    const vitals: Record<string, number> = {};
    
    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.LCP = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // First Input Delay (would need additional setup in real implementation)
    const fidMetrics = this.metrics.filter(m => m.name === 'first-input-delay');
    if (fidMetrics.length > 0) {
      vitals.FID = fidMetrics[fidMetrics.length - 1].value;
    }

    // Cumulative Layout Shift (would need additional setup)
    const clsMetrics = this.metrics.filter(m => m.name === 'cumulative-layout-shift');
    if (clsMetrics.length > 0) {
      vitals.CLS = clsMetrics[clsMetrics.length - 1].value;
    }

    return vitals;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalMetrics: number;
    avgRenderTime: number;
    slowestComponents: ComponentRenderMetric[];
    slowestAPICalls: APICallMetric[];
    coreWebVitals: Record<string, number>;
  } {
    const avgRenderTime = this.componentMetrics.length > 0
      ? this.componentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / this.componentMetrics.length
      : 0;

    const slowestComponents = [...this.componentMetrics]
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 5);

    const slowestAPICalls = [...this.apiMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      totalMetrics: this.metrics.length,
      avgRenderTime,
      slowestComponents,
      slowestAPICalls,
      coreWebVitals: this.getCoreWebVitals()
    };
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): {
    general: PerformanceMetric[];
    components: ComponentRenderMetric[];
    api: APICallMetric[];
    user: UserInteractionMetric[];
  } {
    return {
      general: [...this.metrics],
      components: [...this.componentMetrics],
      api: [...this.apiMetrics],
      user: [...this.userMetrics]
    };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.length = 0;
    this.componentMetrics.length = 0;
    this.apiMetrics.length = 0;
    this.userMetrics.length = 0;
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set up periodic reporting to console (development only)
   */
  private setupPeriodicReporting(): void {
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const summary = this.getPerformanceSummary();
        if (summary.totalMetrics > 0) {
          console.group('🔍 Performance Summary');
          console.log('Total metrics:', summary.totalMetrics);
          console.log('Average render time:', summary.avgRenderTime.toFixed(2), 'ms');
          console.log('Core Web Vitals:', summary.coreWebVitals);
          if (summary.slowestComponents.length > 0) {
            console.log('Slowest components:', summary.slowestComponents);
          }
          if (summary.slowestAPICalls.length > 0) {
            console.log('Slowest API calls:', summary.slowestAPICalls);
          }
          console.groupEnd();
        }
      }, 30000); // Report every 30 seconds
    }
  }

  /**
   * Cleanup observers
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility decorators and HOCs for easy integration
export function measurePerformance(_name: string, _tags?: Record<string, string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        _tags
      );
    };
    
    return descriptor;
  };
}

export function measureAsyncPerformance(_name: string, _tags?: Record<string, string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsyncFunction(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        _tags
      );
    };
    
    return descriptor;
  };
} 