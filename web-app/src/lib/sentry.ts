import * as Sentry from '@sentry/react';

// Environment configuration
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Sentry DSN - In production, this should come from environment variables
// For now, using a placeholder that would be configured in production
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  maxBreadcrumbs: number;
  attachStacktrace: boolean;
}

export const sentryConfig: SentryConfig = {
  dsn: SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (isProduction ? 'production' : 'development'),
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 0.5,
  replaysOnErrorSampleRate: 1.0,
  maxBreadcrumbs: 100,
  attachStacktrace: true,
};

export const initSentry = (): void => {
  // Skip initialization if DSN is not provided
  if (!sentryConfig.dsn) {
    if (isDevelopment) {
      console.warn('Sentry DSN not provided. Error monitoring is disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      // Removed BrowserTracing integration due to compatibility issues
      // This can be added back when the correct version is available
      tracesSampleRate: sentryConfig.tracesSampleRate,
      maxBreadcrumbs: sentryConfig.maxBreadcrumbs,
      attachStacktrace: sentryConfig.attachStacktrace,
      
      // Release information
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Performance monitoring
      beforeSend(event) {
        // Filter out development-only errors
        if (isDevelopment) {
          // Filter out common development warnings
          if (event.message?.includes('ResizeObserver loop')) {
            return null;
          }
          if (event.message?.includes('Non-passive event listener')) {
            return null;
          }
        }
        
        // Remove sensitive data
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/\/users\/\d+/g, '/users/[id]');
          event.request.url = event.request.url.replace(/\/organizations\/\w+/g, '/organizations/[id]');
        }
        
        return event;
      },
      
      // Configure breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs in development
        if (isDevelopment && breadcrumb.category === 'console') {
          return null;
        }
        
        return breadcrumb;
      },
    });

    if (isDevelopment) {
      console.log('Sentry initialized for development');
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// User context management
export const setSentryUser = (user: {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  role?: string;
}): void => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
    organizationId: user.organizationId,
    role: user.role,
  });
};

export const clearSentryUser = (): void => {
  Sentry.setUser(null);
};

// Organization context management
export const setSentryOrganization = (organization: {
  id: string;
  name: string;
  plan?: string;
}): void => {
  Sentry.setTag('organization.id', organization.id);
  Sentry.setTag('organization.name', organization.name);
  Sentry.setTag('organization.plan', organization.plan || 'unknown');
  
  Sentry.setContext('organization', {
    id: organization.id,
    name: organization.name,
    plan: organization.plan,
  });
};

// Error capture with context
export const captureError = (
  error: Error, 
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    organizationId?: string;
    extra?: Record<string, any>;
  }
): string => {
  if (context) {
    Sentry.withScope((scope) => {
      if (context.component) scope.setTag('component', context.component);
      if (context.action) scope.setTag('action', context.action);
      if (context.userId) scope.setTag('userId', context.userId);
      if (context.organizationId) scope.setTag('organizationId', context.organizationId);
      if (context.extra) scope.setContext('extra', context.extra);
      
      scope.setLevel('error');
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
  
  return error.message;
};

// Message capture
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): string => {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext('messageContext', context);
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
  
  return message;
};

// Breadcrumb management
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  data?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
};

// Performance monitoring utilities (simplified without deprecated APIs)
export const sentryPerformance = {
  // Simplified transaction creation
  startTransaction: (name: string, op: string = 'navigation') => {
    // Return a mock transaction for now - can be enhanced when proper APIs are available
    return {
      name,
      op,
      finish: () => {
        // Log completion for debugging
        if (isDevelopment) {
          console.log(`Transaction completed: ${name} (${op})`);
        }
      }
    };
  },
  
  // Simple function timing wrapper
  measureFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: any[]) => {
      const start = globalThis.performance?.now ? globalThis.performance.now() : Date.now();
      try {
        const result = fn(...args);
        
        // Handle promise-based functions
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const end = globalThis.performance?.now ? globalThis.performance.now() : Date.now();
            if (isDevelopment) {
              console.log(`Function ${name} took ${end - start}ms`);
            }
          });
        }
        
        // Handle synchronous functions
        const end = globalThis.performance?.now ? globalThis.performance.now() : Date.now();
        if (isDevelopment) {
          console.log(`Function ${name} took ${end - start}ms`);
        }
        
        return result;
      } catch (error) {
        const end = globalThis.performance?.now ? globalThis.performance.now() : Date.now();
        if (isDevelopment) {
          console.log(`Function ${name} failed after ${end - start}ms`);
        }
        throw error;
      }
    }) as T;
  },
};

// React error boundary integration
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry for direct use
export { Sentry };

export default {
  initSentry,
  setSentryUser,
  clearSentryUser,
  setSentryOrganization,
  captureError,
  captureMessage,
  addBreadcrumb,
  sentryPerformance,
  SentryErrorBoundary,
  Sentry,
}; 