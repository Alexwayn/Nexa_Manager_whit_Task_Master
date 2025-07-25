// Scanner-specific error boundary with recovery strategies
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  CameraIcon,
  DocumentArrowUpIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { captureError, addBreadcrumb } from '@/lib/sentry';
import Logger from '@/utils/Logger';

interface ScannerErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentStack?: string;
}

/**
 * Scanner-specific error fallback component with contextual recovery options
 */
const ScannerErrorFallback: React.FC<ScannerErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const getErrorInfo = (error: Error) => {
    const message = error.message || 'Unknown error';
    
    // Camera-related errors
    if (message.includes('camera') || message.includes('getUserMedia') || message.includes('NotAllowedError')) {
      return {
        title: 'Camera Access Error',
        message: 'Unable to access your camera. Please check permissions and try again.',
        icon: CameraIcon,
        suggestions: [
          'Check that camera permissions are enabled for this site',
          'Ensure no other applications are using the camera',
          'Try refreshing the page and allowing camera access',
          'Use the file upload option instead'
        ],
        actions: [
          { label: 'Try Camera Again', action: resetErrorBoundary, primary: true },
          { label: 'Switch to Upload', action: () => window.location.hash = '#upload', primary: false }
        ]
      };
    }

    // File upload errors
    if (message.includes('file') || message.includes('upload') || message.includes('size')) {
      return {
        title: 'File Upload Error',
        message: 'There was a problem with the file you selected.',
        icon: DocumentArrowUpIcon,
        suggestions: [
          'Ensure the file is a supported format (JPG, PNG, PDF)',
          'Check that the file size is under 10MB',
          'Try selecting a different file',
          'Ensure you have a stable internet connection'
        ],
        actions: [
          { label: 'Try Again', action: resetErrorBoundary, primary: true },
          { label: 'Select Different File', action: () => resetErrorBoundary(), primary: false }
        ]
      };
    }

    // OCR/Processing errors
    if (message.includes('OCR') || message.includes('processing') || message.includes('extract')) {
      return {
        title: 'Text Extraction Error',
        message: 'Failed to extract text from the document.',
        icon: ExclamationTriangleIcon,
        suggestions: [
          'Ensure the document image is clear and well-lit',
          'Try taking a new photo with better lighting',
          'Check your internet connection',
          'The document may contain unsupported text or formatting'
        ],
        actions: [
          { label: 'Retry Processing', action: resetErrorBoundary, primary: true },
          { label: 'Take New Photo', action: () => resetErrorBoundary(), primary: false }
        ]
      };
    }

    // Network/API errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the processing service.',
        icon: WifiIcon,
        suggestions: [
          'Check your internet connection',
          'The service may be temporarily unavailable',
          'Try again in a few moments',
          'Contact support if the problem persists'
        ],
        actions: [
          { label: 'Retry Connection', action: resetErrorBoundary, primary: true },
          { label: 'Check Connection', action: () => window.open('https://www.google.com', '_blank'), primary: false }
        ]
      };
    }

    // Generic error
    return {
      title: 'Scanner Error',
      message: 'An unexpected error occurred while scanning.',
      icon: ExclamationTriangleIcon,
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Contact support if the problem continues'
      ],
      actions: [
        { label: 'Try Again', action: resetErrorBoundary, primary: true },
        { label: 'Go to Dashboard', action: () => window.location.href = '/dashboard', primary: false }
      ]
    };
  };

  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="max-w-md w-full text-center p-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <IconComponent className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {errorInfo.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {errorInfo.message}
        </p>

        {/* Suggestions */}
        <div className="text-left mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Try these solutions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {errorInfo.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`w-full flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                action.primary
                  ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {action.primary && <ArrowPathIcon className="w-4 h-4 mr-2" />}
              {action.label}
            </button>
          ))}
        </div>

        {/* Development error details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Show error details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto text-red-600 max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Enhanced error logging for scanner errors
 */
const onScannerError = (error: Error, errorInfo: { componentStack: string }) => {
  const errorMessage = error.message || 'Unknown scanner error';
  const componentStack = errorInfo.componentStack || 'No component stack';
  
  console.error('Scanner error boundary caught an error:', errorMessage);
  console.error('Component stack:', componentStack);

  // Add breadcrumb for scanner error
  addBreadcrumb(
    'Scanner error boundary triggered',
    'error',
    {
      errorMessage,
      component: 'Scanner',
      componentStack: componentStack.split('\n')[1] || 'Unknown component',
    },
    'error',
  );

  // Capture error with Sentry
  const eventId = captureError(error, {
    component: 'ScannerErrorBoundary',
    action: 'scanner_error_boundary_catch',
    extra: {
      componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
  });

  // Log to application logger
  Logger.error('Scanner error boundary caught error', 
    `Error: ${errorMessage}`,
    `Stack: ${error.stack || 'No stack trace'}`,
    `Component Stack: ${componentStack}`,
    `Sentry Event ID: ${eventId}`
  );
};

/**
 * Scanner Error Boundary component
 */
export const ScannerErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<ScannerErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({
  children,
  fallback: CustomFallback,
  onError: customOnError,
}) => {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Call our enhanced error handler
      onScannerError(error, errorInfo);

      // Call custom error handler if provided
      if (customOnError) {
        customOnError(error, errorInfo);
      }
    },
    [customOnError],
  );

  const handleReset = React.useCallback(() => {
    // Add breadcrumb for error boundary reset
    addBreadcrumb('Scanner error boundary reset', 'user_action', { component: 'Scanner' }, 'info');

    // Clear any scanner-specific error state if needed
    if (process.env.NODE_ENV === 'development') {
      console.log('Scanner error boundary reset');
    }
  }, []);

  return (
    <ReactErrorBoundary
      FallbackComponent={CustomFallback || ScannerErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Higher-order component for wrapping scanner components with error boundaries
 */
export const withScannerErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    customFallback?: React.ComponentType<ScannerErrorFallbackProps>;
  } = {}
) => {
  const { componentName, customFallback } = options;

  const WrappedComponent: React.FC<P> = (props) => {
    const displayName = componentName || Component.displayName || Component.name || 'ScannerComponent';

    const handleError = React.useCallback(
      (error: Error, errorInfo: React.ErrorInfo) => {
        captureError(error, {
          component: displayName,
          action: 'scanner_component_error',
          extra: {
            scannerComponent: true,
            componentStack: errorInfo.componentStack,
          },
        });
      },
      [displayName],
    );

    return (
      <ScannerErrorBoundary
        fallback={customFallback}
        onError={handleError}
      >
        <Component {...props} />
      </ScannerErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withScannerErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering scanner error boundary with context
 */
export const useScannerErrorHandler = () => {
  return React.useCallback((error: Error, context: Record<string, any> = {}) => {
    // Capture with Sentry before throwing
    captureError(error, {
      component: 'useScannerErrorHandler',
      action: 'manual_scanner_error_trigger',
      ...context,
    });

    // Add breadcrumb
    addBreadcrumb(
      'Manual scanner error triggered',
      'error',
      { errorMessage: error.message, ...context },
      'error',
    );

    // Throw to trigger error boundary
    throw error;
  }, []);
};

export default ScannerErrorBoundary;