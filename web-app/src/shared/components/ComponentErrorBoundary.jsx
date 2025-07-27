import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ErrorBoundary from './ErrorBoundary';

const ComponentErrorBoundary = ({
  children,
  componentName = 'Component',
  className = '',
  showDetails = false,
}) => {
  const { t } = useTranslation('common');

  const fallbackUI = (error, retry) => (
    <div className={`p-4 border border-red-200 bg-red-50 rounded-lg ${className}`}>
      <div className='flex items-start'>
        <div className='flex-shrink-0'>
          <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
        </div>
        <div className='ml-3 flex-1'>
          <h4 className='text-sm font-medium text-red-800'>
            {t('componentErrorBoundary.title', { componentName })}
          </h4>
          <p className='mt-1 text-sm text-red-700'>{t('componentErrorBoundary.message')}</p>
          {showDetails && error && (
            <p className='mt-1 text-xs text-red-600 font-mono'>{error.message}</p>
          )}
          <div className='mt-3'>
            <button
              onClick={retry}
              className='text-sm font-medium text-red-800 hover:text-red-900 underline'
            >
              {t('componentErrorBoundary.retry')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallbackUI}
      title={t('componentErrorBoundary.title', { componentName })}
      message={t('componentErrorBoundary.message')}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ComponentErrorBoundary;
