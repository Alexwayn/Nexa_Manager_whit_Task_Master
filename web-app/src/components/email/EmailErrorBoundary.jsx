import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * EmailErrorBoundary - Error boundary component for email operations
 * 
 * Features:
 * - Catches JavaScript errors in email components
 * - Provides fallback UI with retry functionality
 * - Logs errors for debugging
 * - Graceful degradation for email functionality
 */
class EmailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Email Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service if available
    if (window.analytics && typeof window.analytics.track === 'function') {
      window.analytics.track('Email Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            retry={this.handleRetry}
            reload={this.handleReload}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email System Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong with the email system. This might be a temporary issue.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {showDetails && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {this.state.retryCount > 0 && (
              <p className="mt-4 text-xs text-gray-500">
                Retry attempts: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * EmailErrorFallback - Functional component for custom error fallbacks
 */
export const EmailErrorFallback = ({ error, retry, reload }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
    <div className="flex items-start">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Email Operation Failed
        </h3>
        <p className="text-sm text-red-700 mt-1">
          {error?.message || 'An unexpected error occurred while processing emails.'}
        </p>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={retry}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
          >
            Retry
          </button>
          <button
            onClick={reload}
            className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * withEmailErrorBoundary - HOC to wrap components with error boundary
 */
export const withEmailErrorBoundary = (Component, options = {}) => {
  return function WrappedComponent(props) {
    return (
      <EmailErrorBoundary {...options}>
        <Component {...props} />
      </EmailErrorBoundary>
    );
  };
};

export default EmailErrorBoundary;