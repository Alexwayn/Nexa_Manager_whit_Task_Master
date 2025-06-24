import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ReportErrorBoundary = ({ error, onRetry, title, className = '' }) => {
  const { t } = useTranslation('reports');

  const errorTitle = title || t('common.error');
  const errorMessage =
    typeof error === 'string' ? error : error?.message || t('common.unexpectedError');

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 ${className}`}
    >
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-red-800 dark:text-red-200">{errorTitle}</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
            >
              {t('common.retry')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportErrorBoundary;
