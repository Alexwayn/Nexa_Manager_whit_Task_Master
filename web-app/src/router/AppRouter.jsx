import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@features/auth';
import { DashboardLayout } from '@features/dashboard';
import { ErrorBoundary } from '@shared/components';
import { publicRoutes, testRoutes, protectedRoutes, defaultRoutes } from './routeConfig';

/**
 * Loading component for lazy-loaded routes
 */
const RouteLoader = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='flex flex-col items-center space-y-4'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      <p className='text-gray-600 dark:text-gray-400 animate-pulse'>Loading...</p>
    </div>
  </div>
);

/**
 * Helper function to render public routes (no lazy loading needed)
 */
const renderPublicRoutes = () => {
  return publicRoutes.map(route => {
    const RouteComponent = route.element;
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <ErrorBoundary>
            <RouteComponent />
          </ErrorBoundary>
        }
      />
    );
  });
};

/**
 * Helper function to render test routes (with lazy loading)
 */
const renderTestRoutes = () => {
  return testRoutes.map(route => {
    const RouteComponent = route.element;
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <RouteComponent />
            </Suspense>
          </ErrorBoundary>
        }
      />
    );
  });
};

/**
 * Helper function to render protected routes with layout (with lazy loading)
 */
const renderProtectedRoutes = () => {
  return protectedRoutes.map(route => {
    const RouteComponent = route.element;
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <RouteComponent />
            </Suspense>
          </ErrorBoundary>
        }
      />
    );
  });
};

/**
 * Main AppRouter component with performance optimizations
 */
const AppRouter = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes - no authentication required, no lazy loading */}
        {renderPublicRoutes()}

        {/* Test routes - lazy loaded for better performance */}
        {renderTestRoutes()}

        {/* Protected routes with Layout - all lazy loaded */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {renderProtectedRoutes()}

          {/* Default routes for protected area */}
          <Route
            index
            element={
              <ErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <defaultRoutes.index />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path='*'
            element={
              <ErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <defaultRoutes.fallback />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRouter;
