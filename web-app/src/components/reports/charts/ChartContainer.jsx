import React from 'react';
import ReportLoadingSpinner from '@components/reports/ReportLoadingSpinner';
import ReportErrorBoundary from '@components/reports/ReportErrorBoundary';

const ChartContainer = ({
  title,
  children,
  loading = false,
  error = null,
  onRetry = null,
  className = '',
  height = 'h-64',
  showTitle = true,
  titleClassName = '',
}) => {
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      >
        {showTitle && title && (
          <h3
            className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${titleClassName}`}
          >
            {title}
          </h3>
        )}
        <div className={height}>
          <ReportLoadingSpinner message="Caricamento grafico..." fullHeight={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      >
        {showTitle && title && (
          <h3
            className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${titleClassName}`}
          >
            {title}
          </h3>
        )}
        <div className={height}>
          <ReportErrorBoundary
            error={error}
            onRetry={onRetry}
            title="Errore nel caricamento del grafico"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      {showTitle && title && (
        <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${titleClassName}`}>
          {title}
        </h3>
      )}
      <div className={height}>
        {children || (
          <div
            className={`${height} bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center`}
          >
            <span className="text-gray-500 dark:text-gray-400">Nessun dato disponibile</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
