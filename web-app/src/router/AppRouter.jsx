import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@components/auth/ProtectedRoute';
import Layout from '@components/dashboard/Layout';
import ErrorBoundary from '@components/common/ErrorBoundary';
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
 * Enhanced RouteGroup component with Suspense support for lazy loading
 */
const RouteGroup = ({ routes, useLayout = false, useProtection = false }) => {
  const renderRoute = route => {
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
  };

  if (useLayout && useProtection) {
    // Protected routes with layout
    return (
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {routes.map(renderRoute)}

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
    );
  }

  // Regular routes without layout (public routes don't need Suspense since they're not lazy)
  if (routes === publicRoutes) {
    return routes.map(route => {
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
  }

  // Test routes and other lazy-loaded routes
  return routes.map(renderRoute);
};

/**
 * Main AppRouter component with performance optimizations
 */
const AppRouter = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes - no authentication required, no lazy loading */}
        <RouteGroup routes={publicRoutes} />

        {/* Test routes - lazy loaded for better performance */}
        <RouteGroup routes={testRoutes} />

        {/* Protected routes with Layout - all lazy loaded */}
        <RouteGroup routes={protectedRoutes} useLayout={true} useProtection={true} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRouter;
