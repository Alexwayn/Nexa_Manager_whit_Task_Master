import React, { Suspense, lazy } from 'react';
import LoadingSkeleton from '@shared/components/feedback/LoadingSkeleton';
import ErrorBoundary from '@shared/components/feedback/ErrorBoundary';
import { bundleAnalyzer } from '@utils/performance';

// Lazy load the main Reports component
const ReportsComponent = lazy(() => {
  const startTime = performance.now();
  
  return import('./Reports.jsx').then(module => {
    const loadTime = performance.now() - startTime;
    bundleAnalyzer.trackLazyLoad('Reports', loadTime);
    return module;
  });
});

// Lazy load heavy sub-components
const ReportScheduler = lazy(() => 
  import('@components/reports/ReportScheduler').then(module => {
    bundleAnalyzer.trackLazyLoad('ReportScheduler', performance.now());
    return module;
  })
);

const ReportHistory = lazy(() => 
  import('@components/reports/ReportHistory').then(module => {
    bundleAnalyzer.trackLazyLoad('ReportHistory', performance.now());
    return module;
  })
);

const CustomReportBuilder = lazy(() => 
  import('@components/reports/CustomReportBuilder').then(module => {
    bundleAnalyzer.trackLazyLoad('CustomReportBuilder', performance.now());
    return module;
  })
);

const ReportPreview = lazy(() => 
  import('@components/reports/ReportPreview').then(module => {
    bundleAnalyzer.trackLazyLoad('ReportPreview', performance.now());
    return module;
  })
);

// Loading fallback component
const ReportsLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-4" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <LoadingSkeleton className="h-12 w-12 rounded-lg mb-4" />
            <LoadingSkeleton className="h-6 w-24 mb-2" />
            <LoadingSkeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton type="chart" className="h-64" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton type="chart" className="h-64" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <LoadingSkeleton className="h-6 w-32 mb-4" />
        <LoadingSkeleton type="table" rows={5} />
      </div>
    </div>
  </div>
);

// Error fallback for reports
const ReportsErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Failed to Load Reports
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {error?.message || 'An unexpected error occurred while loading the reports page.'}
      </p>
      <div className="space-y-3">
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
);

// Main lazy Reports wrapper
const LazyReports = () => {
  return (
    <ErrorBoundary fallback={ReportsErrorFallback}>
      <Suspense fallback={<ReportsLoadingFallback />}>
        <ReportsComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

// Export lazy-loaded sub-components for use in the main Reports component
export const LazyReportScheduler = ({ ...props }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="form" />}>
      <ReportScheduler {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const LazyReportHistory = ({ ...props }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="table" rows={5} />}>
      <ReportHistory {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const LazyCustomReportBuilder = ({ ...props }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="form" />}>
      <CustomReportBuilder {...props} />
    </Suspense>
  </ErrorBoundary>
);

export const LazyReportPreview = ({ ...props }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="report" />}>
      <ReportPreview {...props} />
    </Suspense>
  </ErrorBoundary>
);

// Performance monitoring wrapper
const PerformanceMonitoredReports = () => {
  React.useEffect(() => {
    // Track initial load performance
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      console.log('Reports page load performance:', {
        domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
        loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        totalTime: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
      });
    }
  }, []);

  return <LazyReports />;
};

export default PerformanceMonitoredReports;

// Export individual components for direct use
export {
  ReportsComponent as Reports,
  ReportScheduler,
  ReportHistory,
  CustomReportBuilder,
  ReportPreview,
};