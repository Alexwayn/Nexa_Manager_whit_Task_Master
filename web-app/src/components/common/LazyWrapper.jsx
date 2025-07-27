import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@shared/components';

const LoadingFallback = ({ message, size = 'medium' }) => {
  const { t } = useTranslation('common');
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClasses = {
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      <p className='mt-2 text-sm text-gray-500'>{message || t('lazyWrapper.loading')}</p>
    </div>
  );
};

const LazyWrapper = ({
  children,
  fallback,
  errorBoundaryProps = {},
  loadingMessage,
  loadingSize = 'medium',
}) => {
  const { t } = useTranslation('common');

  const defaultFallback = (
    <LoadingFallback
      message={loadingMessage || t('lazyWrapper.loadingComponent')}
      size={loadingSize}
    />
  );

  return (
    <ErrorBoundary
      title={t('lazyWrapper.errorTitle')}
      message={t('errorBoundary.message')}
      showReload={true}
      {...errorBoundaryProps}
    >
      <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};

export default LazyWrapper;
