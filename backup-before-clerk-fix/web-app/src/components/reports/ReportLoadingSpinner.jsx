import React from 'react';
import { useTranslation } from 'react-i18next';

const ReportLoadingSpinner = ({
  message,
  size = 'h-12 w-12',
  className = '',
  fullHeight = true,
}) => {
  const { t } = useTranslation('reports');

  const containerClasses = fullHeight
    ? 'flex justify-center items-center h-64'
    : 'flex justify-center items-center py-8';

  const loadingMessage = message || t('common.loading');

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`animate-spin rounded-full ${size} border-b-2 border-blue-600`}></div>
      <span className='ml-3 text-gray-600 dark:text-gray-300'>{loadingMessage}</span>
    </div>
  );
};

export default ReportLoadingSpinner;
