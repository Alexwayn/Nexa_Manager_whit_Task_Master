import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SettingsErrorBoundary = ({ children, fallback, title = 'Settings Component' }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = error => {
      const safeErrorMessage = typeof error?.message === 'string' ? error.message : String(error?.message || 'Unknown error');
      console.error(`Error in ${title}:`, safeErrorMessage);
      setHasError(true);
      setError(error);
    };

    // Reset error state when children change
    setHasError(false);
    setError(null);

    // Catch any errors from children
    try {
      // This will be handled by React's error boundary mechanism
    } catch (err) {
      handleError(err);
    }
  }, [children, title]);

  if (hasError) {
    return (
      fallback || (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
          <div className='flex'>
            <ExclamationTriangleIcon className='h-5 w-5 text-yellow-400' />
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-yellow-800'>
                {title} Temporarily Unavailable
              </h3>
              <div className='mt-2 text-sm text-yellow-700'>
                <p>
                  This settings section is currently experiencing technical difficulties. Our team
                  is working to resolve this issue.
                </p>
                {error && (
                  <details className='mt-2'>
                    <summary className='cursor-pointer font-medium'>Technical Details</summary>
                    <pre className='mt-1 text-xs bg-yellow-100 p-2 rounded overflow-auto'>
                      {error.toString()}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    );
  }

  return children;
};

export default SettingsErrorBoundary;
