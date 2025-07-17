import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Logger from '@utils/Logger';
import { withTranslation } from '@components/common/withTranslation';
import { captureError, addBreadcrumb, Sentry } from '@lib/sentry';

/**
 * Error fallback component for displaying user-friendly error messages
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Log error to console for development
  if (import.meta.env.DEV) {
    const errorMessage = typeof error?.message === 'string' ? error.message : String(error?.message || 'Unknown error');
    const errorStack = typeof error?.stack === 'string' ? error.stack : String(error?.stack || 'No stack trace');
    const errorName = typeof error?.name === 'string' ? error.name : String(error?.name || 'Error');
    
    console.error('Error caught by boundary:', errorMessage);
    console.error('Stack trace:', errorStack);
    console.error('Error name:', errorName);
  }

  const getErrorMessage = error => {
    const safeErrorMessage = typeof error?.message === 'string' ? error.message : String(error?.message || '');
    if (safeErrorMessage.includes('ChunkLoadError') || safeErrorMessage.includes('Loading chunk')) {
      return {
        title: 'Update Available',
        message:
          'A new version of the app is available. Please refresh the page to get the latest updates.',
        action: 'Refresh Page',
        actionFn: () => window.location.reload(),
      };
    }

    if (safeErrorMessage.includes('Network Error') || safeErrorMessage.includes('fetch')) {
      return {
        title: 'Connection Error',
        message:
          'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Try Again',
        actionFn: resetErrorBoundary,
      };
    }

    return {
      title: 'Something went wrong',
      message:
        'An unexpected error occurred. Please try again or contact support if the problem persists.',
      action: 'Try Again',
      actionFn: resetErrorBoundary,
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <ExclamationTriangleIcon className='mx-auto h-12 w-12 text-yellow-400' />
          <h1 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
            {errorInfo.title}
          </h1>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>{errorInfo.message}</p>

          {import.meta.env.DEV && (
            <details className='mt-4 text-left'>
              <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                Show error details (Development)
              </summary>
              <pre className='mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto text-red-600 dark:text-red-400'>
                {(typeof error?.stack === 'string' ? error.stack : String(error?.stack || '')) || 
                 (typeof error?.message === 'string' ? error.message : String(error?.message || '')) || 
                 'Unknown error'}
              </pre>
            </details>
          )}
        </div>

        <div className='space-y-3'>
          <button
            onClick={errorInfo.actionFn}
            className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200'
          >
            <ArrowPathIcon className='w-4 h-4 mr-2' />
            {errorInfo.action}
          </button>

          <button
            onClick={() => (window.location.href = '/dashboard')}
            className='group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200'
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced error logging function with Sentry integration
 */
const onError = (error, errorInfo) => {
  const errorMessage = typeof error?.message === 'string' ? error.message : String(error?.message || 'Unknown error');
  const errorStack = typeof error?.stack === 'string' ? error.stack : String(error?.stack || 'No stack trace');
  const errorName = typeof error?.name === 'string' ? error.name : String(error?.name || 'Error');
  const componentStack = typeof errorInfo?.componentStack === 'string' ? errorInfo.componentStack : String(errorInfo?.componentStack || 'No component stack');
  
  console.error('Error boundary caught an error:', errorMessage);
  console.error('Stack trace:', errorStack);
  console.error('Error name:', errorName);
  console.error('Component stack:', componentStack);

  // Add breadcrumb for error boundary activation
  addBreadcrumb(
    'Error boundary triggered',
    'error',
    {
      errorMessage: errorMessage,
      componentStack: errorInfo?.componentStack?.split('\n')[1] || 'Unknown component',
    },
    'error',
  );

  // Capture error with Sentry including component stack trace
  const eventId = captureError(error, {
    component: 'ErrorBoundary',
    action: 'error_boundary_catch',
    extra: {
      componentStack: errorInfo?.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
    },
  });

  // Log to console for debugging
  Logger.error('Error boundary caught error', 
    `Error: ${String(errorMessage)}`,
    `Stack: ${String(errorStack)}`,
    `Component Stack: ${String(componentStack)}`,
    `Sentry Event ID: ${String(eventId)}`
  );

  // In development, also log component stack for debugging
  if (import.meta.env.DEV && errorInfo?.componentStack) {
    console.group('Component Stack Trace:');
    console.log(errorInfo.componentStack);
    console.groupEnd();
  }
};

/**
 * Enhanced Error Boundary component with Sentry integration
 */
const ErrorBoundary = ({
  children,
  fallback: CustomFallback,
  onError: customOnError,
  component = 'Unknown',
  isolateErrors = false,
}) => {
  const handleError = React.useCallback(
    (error, errorInfo) => {
      // Call our enhanced error handler
      onError(error, errorInfo);

      // Call custom error handler if provided
      if (customOnError) {
        customOnError(error, errorInfo);
      }
    },
    [customOnError],
  );

  const handleReset = React.useCallback(() => {
    // Add breadcrumb for error boundary reset
    addBreadcrumb('Error boundary reset', 'user_action', { component }, 'info');

    // Clear any error state if needed
    if (import.meta.env.DEV) {
      console.log(`Error boundary reset for component: ${component}`);
    }
  }, [component]);

  return (
    <ReactErrorBoundary
      FallbackComponent={CustomFallback || ErrorFallback}
      onError={handleError}
      onReset={handleReset}
      isolateErrorBoundary={isolateErrors}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// Chart-specific error fallback component
export const ChartErrorFallback = ({ error, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mb-2" />
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        Chart Error
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
        {error?.message || 'Failed to render chart'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="w-3 h-3 mr-1" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;

/**
 * Higher-order component for wrapping components with error boundaries
 */
export const withErrorBoundary = (Component, options = {}) => {
  const { customFallback, componentName, isolateErrors = false, captureProps = false } = options;

  const WrappedComponent = props => {
    const displayName = componentName || Component.displayName || Component.name || 'Component';

    // Custom error handler that captures component props if enabled
    const handleError = React.useCallback(
      (error, errorInfo) => {
        const extraContext = {
          component: displayName,
          ...(captureProps && { props: JSON.stringify(props, null, 2) }),
        };

        captureError(error, {
          component: displayName,
          action: 'component_error',
          extra: extraContext,
        });
      },
      [props, displayName, captureProps],
    );

    return (
      <ErrorBoundary
        fallback={customFallback}
        component={displayName}
        onError={handleError}
        isolateErrors={isolateErrors}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering error boundary with Sentry integration
 */
export const useErrorHandler = () => {
  return React.useCallback((error, context = {}) => {
    // Capture with Sentry before throwing
    captureError(error, {
      component: 'useErrorHandler',
      action: 'manual_error_trigger',
      ...context,
    });

    // Add breadcrumb
    const safeErrorMessage = typeof error?.message === 'string' ? error.message : String(error?.message || 'Unknown error');
    addBreadcrumb(
      'Manual error triggered',
      'error',
      { errorMessage: safeErrorMessage, ...context },
      'error',
    );

    // Throw to trigger error boundary
    throw error;
  }, []);
};

/**
 * Sentry-enhanced version of the original ErrorBoundary
 * This creates a Sentry ErrorBoundary with fallback to our custom ErrorBoundary
 */
export const SentryErrorBoundary = ({ children, ...props }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={ErrorFallback}
      beforeCapture={(scope, error, errorInfo) => {
        // Add component context to Sentry scope
        scope.setTag('errorBoundary', 'sentry');
        scope.setContext('errorInfo', {
          componentStack: errorInfo?.componentStack,
          timestamp: new Date().toISOString(),
        });
      }}
      {...props}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
