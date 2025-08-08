import React, { useState } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import logger from '../../../utils/Logger';
import errorReportingService from '../../../shared/services/errorReportingService';

/**
 * EmailErrorBoundary - Error boundary component for email operations
 * 
 * Features:
 * - Catches JavaScript errors in email components
 * - Provides fallback UI with retry functionality
 * - Logs errors for debugging
 * - Graceful degradation for email functionality
 * - User feedback collection
 * - Accessibility support
 */
class EmailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
      showFeedback: false,
      feedbackSubmitted: false,
      feedbackError: null
    };
    
    // Use ref to track retry count to avoid state timing issues
    this.retryCountRef = React.createRef();
    this.retryCountRef.current = 0;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    logger.error('EmailErrorBoundary caught an error:', {
      message: error.message,
      stack: error.stack,
      ...errorInfo
    });
    
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo,
      showDetails: this.props.showDetails || false,
      // Use the ref value for retry count
      retryCount: this.retryCountRef.current
    });

    // Report error to error reporting service
    errorReportingService.reportError(error, {
      component: 'EmailErrorBoundary',
      context: 'email-system',
      errorInfo
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

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

  componentDidUpdate(prevProps) {
    // Reset error state if children change (error recovery)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        showFeedback: false,
        feedbackSubmitted: false,
        feedbackError: null
      });
    }
  }

  handleRetry = () => {
    // Increment the ref counter first
    this.retryCountRef.current += 1;
    const newRetryCount = this.retryCountRef.current;
    
    // Log retry attempt
    logger.info('User retried after error in EmailErrorBoundary', {
      retryCount: newRetryCount,
      error: this.state.error?.message
    });

    // Clear the error state to trigger re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount,
      showDetails: false,
      showFeedback: false,
      feedbackSubmitted: false,
      feedbackError: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  toggleFeedback = () => {
    this.setState(prevState => ({
      showFeedback: !prevState.showFeedback,
      feedbackSubmitted: false,
      feedbackError: null
    }));
  };

  handleFeedbackSubmit = async (feedbackData) => {
    try {
      await errorReportingService.reportUserFeedback({
        ...feedbackData,
        error: this.state.error,
        context: 'email-system'
      });
      
      this.setState({
        feedbackSubmitted: true,
        feedbackError: null
      });
    } catch (error) {
      this.setState({
        feedbackError: 'Failed to submit feedback. Please try again.'
      });
    }
  };

  getErrorMessage = () => {
    const { error } = this.state;
    if (!error) return 'An unexpected error occurred';

    // Check error message for specific types
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'Permission denied. Please contact your administrator for access.';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Validation error. Please check your input and try again.';
    }
    
    return 'An unexpected error occurred while processing your request.';
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallback: Fallback, 
        showDetails = false, 
        allowRetry = true,
        maxRetries = 3
      } = this.props;
      
      const hasReachedMaxRetries = this.state.retryCount >= maxRetries;
      
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
            <div role="alert" aria-live="assertive">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Email System Error
              </h2>
              <p className="text-gray-600 mb-6">
                {this.getErrorMessage()}
              </p>
            </div>
            
            <div className="space-y-3">
              {allowRetry && !hasReachedMaxRetries && (
                <button
                  onClick={this.handleRetry}
                  aria-label="Try again to reload the email component"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              )}
              
              {hasReachedMaxRetries && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Maximum retry attempts reached. Please reload the page or contact support.
                  </p>
                </div>
              )}
              
              <button
                onClick={this.toggleFeedback}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Report Issue
              </button>

              {/* Error Details Toggle Button - moved here for correct tab order */}
              {(showDetails || this.state.showDetails) && this.state.error && (
                <button
                  role="button"
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={this.toggleDetails}
                  aria-expanded={this.state.showDetails}
                  aria-controls="error-details"
                >
                  {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Feedback Form */}
            {this.state.showFeedback && (
              <FeedbackForm
                onSubmit={this.handleFeedbackSubmit}
                onClose={this.toggleFeedback}
                submitted={this.state.feedbackSubmitted}
                error={this.state.feedbackError}
              />
            )}

            {/* Error Details */}
            {(showDetails || this.state.showDetails) && this.state.error && this.state.showDetails && (
              <div className="mt-6 text-left">
                <div 
                  id="error-details"
                  className="p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32"
                >
                  <div className="mb-2">
                    <strong>Error Details:</strong>
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * FeedbackForm - Component for collecting user feedback about errors
 */
const FeedbackForm = ({ onSubmit, onClose, submitted, error }) => {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({ description, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 text-sm">
          Thank you for your feedback! We'll look into this issue.
        </p>
        <button
          onClick={onClose}
          className="mt-2 text-green-600 hover:text-green-800 text-sm underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Help us improve</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe what happened
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Your email (optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

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
