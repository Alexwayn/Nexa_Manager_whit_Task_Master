import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Logger from '@utils/Logger';
import { withTranslation } from '@components/common/withTranslation';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    Logger.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {this.props.title || t('errorBoundary.title')}
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              {this.props.message || t('errorBoundary.message')}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                {t('errorBoundary.retry')}
              </button>

              {this.props.showReload && (
                <button
                  onClick={() => window.location.reload()}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('errorBoundary.reload')}
                </button>
              )}
            </div>

            {/* Show error details in development */}
            {((typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  {t('errorBoundary.details')}
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono text-gray-600 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>{t('errorBoundary.error')}:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>{t('errorBoundary.componentStack')}:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation(ErrorBoundary);
