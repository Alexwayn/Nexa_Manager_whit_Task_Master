/**
 * State Middleware
 * 
 * This module contains middleware for state management including
 * logging, persistence, error handling, and performance monitoring.
 */

/**
 * Logger Middleware
 * 
 * Logs state changes for debugging and monitoring purposes.
 */
export const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  if (import.meta.env.DEV) {
    console.group(`🔄 State Action: ${action.type}`);
    console.log('Previous State:', store.getState?.());
    console.log('Action:', action);
    
    const result = next(action);
    
    console.log('Next State:', store.getState?.());
    console.groupEnd();
    
    return result;
  }
  
  return next(action);
};

/**
 * Persistence Middleware
 * 
 * Handles automatic persistence of specific state slices to localStorage.
 */
export const persistenceMiddleware = (persistConfig: Record<string, string[]>) => 
  (store: any) => (next: any) => (action: any) => {
    const result = next(action);
    
    // Check if this action should trigger persistence
    const actionDomain = action.type.split('/')[0];
    const persistKeys = persistConfig[actionDomain];
    
    if (persistKeys && persistKeys.length > 0) {
      try {
        const state = store.getState?.();
        const persistData = persistKeys.reduce((acc, key) => {
          if (state[key] !== undefined) {
            acc[key] = state[key];
          }
          return acc;
        }, {} as Record<string, any>);
        
        localStorage.setItem(`nexa-state-${actionDomain}`, JSON.stringify(persistData));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    }
    
    return result;
  };

/**
 * Error Handling Middleware
 * 
 * Catches and handles errors in state updates.
 */
export const errorHandlingMiddleware = (store: any) => (next: any) => (action: any) => {
  try {
    return next(action);
  } catch (error) {
    console.error('State update error:', error);
    
    // Dispatch error action
    store.dispatch?.({
      type: 'ERROR/STATE_UPDATE_FAILED',
      payload: {
        originalAction: action,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    });
    
    // Re-throw for debugging in development
    if (import.meta.env.DEV) {
      throw error;
    }
    
    return store.getState?.();
  }
};

/**
 * Performance Monitoring Middleware
 * 
 * Monitors state update performance and logs slow operations.
 */
export const performanceMiddleware = (store: any) => (next: any) => (action: any) => {
  const startTime = performance.now();
  
  const result = next(action);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log slow operations (> 16ms = one frame)
  if (duration > 16) {
    console.warn(`⚠️ Slow state update: ${action.type} took ${duration.toFixed(2)}ms`);
  }
  
  // Track performance metrics in development
  if (import.meta.env.DEV) {
    (window as any).__NEXA_PERFORMANCE_METRICS__ = (window as any).__NEXA_PERFORMANCE_METRICS__ || [];
    (window as any).__NEXA_PERFORMANCE_METRICS__.push({
      action: action.type,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  return result;
};

/**
 * Middleware Configuration
 * 
 * Default middleware configuration for the application.
 */
export const middlewareConfig = {
  development: [
    loggerMiddleware,
    performanceMiddleware,
    errorHandlingMiddleware,
  ],
  production: [
    errorHandlingMiddleware,
  ],
};

/**
 * Create Middleware Stack
 * 
 * Creates the appropriate middleware stack based on environment.
 */
export const createMiddlewareStack = (environment: 'development' | 'production' = 'production') => {
  return middlewareConfig[environment] || middlewareConfig.production;
};

// Export individual middleware for custom configurations
export default {
  logger: loggerMiddleware,
  persistence: persistenceMiddleware,
  errorHandling: errorHandlingMiddleware,
  performance: performanceMiddleware,
};