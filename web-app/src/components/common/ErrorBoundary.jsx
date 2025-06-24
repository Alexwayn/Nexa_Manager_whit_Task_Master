import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Logger from '@utils/Logger';
import { withTranslation } from '@components/common/withTranslation';

/**
 * Error fallback component for displaying user-friendly error messages
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Log error to console for development
  if (import.meta.env.DEV) {
    console.error('Error caught by boundary:', error);
  }

  // In production, you'd send this to your error reporting service
  const logError = (error, errorInfo) => {
    if (import.meta.env.PROD) {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, errorInfo);
    }
  };

  const getErrorMessage = (error) => {
    if (error?.message?.includes('ChunkLoadError') || error?.message?.includes('Loading chunk')) {
      return {
        title: 'Update Available',
        message: 'A new version of the app is available. Please refresh the page to get the latest updates.',
        action: 'Refresh Page',
        actionFn: () => window.location.reload()
      };
    }
    
    if (error?.message?.includes('Network Error') || error?.message?.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Try Again',
        actionFn: resetErrorBoundary
      };
    }

    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      action: 'Try Again',
      actionFn: resetErrorBoundary
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {errorInfo.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorInfo.message}
          </p>
          
          {import.meta.env.DEV && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Show error details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto text-red-600 dark:text-red-400">
                {error?.stack || error?.message || 'Unknown error'}
              </pre>
            </details>
          )}
        </div>
        
        <div className="space-y-3">
          <button
            onClick={errorInfo.actionFn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {errorInfo.action}
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Error logging function for production error reporting
 */
const onError = (error, errorInfo) => {
  console.error('Error boundary caught an error:', error, errorInfo);
  
  // In production, send to error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to your error reporting service
    // errorReportingService.captureException(error, {
    //   extra: errorInfo,
    //   tags: {
    //     section: 'error_boundary'
    //   }
    // });
  }
};

/**
 * Enhanced Error Boundary component with better UX and error reporting
 */
const ErrorBoundary = ({ children, fallback: CustomFallback }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={CustomFallback || ErrorFallback}
      onError={onError}
      onReset={() => {
        // Clear any error state if needed
        // For example, reset Redux state, clear localStorage, etc.
        if (import.meta.env.DEV) {
          console.log('Error boundary reset');
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;

/**
 * Higher-order component for wrapping components with error boundaries
 */
export const withErrorBoundary = (Component, customFallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={customFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering error boundary
 */
export const useErrorHandler = () => {
  return React.useCallback((error) => {
    throw error;
  }, []);
};
