// Mock middleware for tests

/**
 * Logger Middleware - Mock version for tests
 */
export const loggerMiddleware = (store) => (next) => (action) => {
  // In tests, just pass through without logging
  return next(action);
};

/**
 * Persistence Middleware - Mock version for tests
 */
export const persistenceMiddleware = (persistConfig) => 
  (store) => (next) => (action) => {
    const result = next(action);
    // Skip persistence in tests
    return result;
  };

/**
 * Error Handling Middleware - Mock version for tests
 */
export const errorHandlingMiddleware = (store) => (next) => (action) => {
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
    
    return store.getState?.();
  }
};

/**
 * Performance Monitoring Middleware - Mock version for tests
 */
export const performanceMiddleware = (store) => (next) => (action) => {
  // In tests, just pass through without performance monitoring
  return next(action);
};

/**
 * Middleware Configuration - Mock version for tests
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
 * Create Middleware Stack - Mock version for tests
 */
export const createMiddlewareStack = (environment = 'production') => {
  return middlewareConfig[environment] || middlewareConfig.production;
};

// Export individual middleware for custom configurations
export default {
  logger: loggerMiddleware,
  persistence: persistenceMiddleware,
  errorHandling: errorHandlingMiddleware,
  performance: performanceMiddleware,
};