import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@components/ProtectedRoute';
import Layout from '@components/Layout';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { 
  publicRoutes, 
  testRoutes, 
  protectedRoutes, 
  defaultRoutes 
} from './routeConfig';

/**
 * RouteGroup component - renders a group of routes with consistent error boundaries
 */
const RouteGroup = ({ routes, useLayout = false, useProtection = false }) => {
  const renderRoute = (route) => {
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
              <defaultRoutes.index />
            </ErrorBoundary>
          } 
        />
        <Route 
          path="*" 
          element={
            <ErrorBoundary>
              <defaultRoutes.fallback />
            </ErrorBoundary>
          } 
        />
      </Route>
    );
  }

  // Regular routes without layout
  return routes.map(renderRoute);
};

/**
 * Main AppRouter component
 */
const AppRouter = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes - no authentication required */}
        <RouteGroup routes={publicRoutes} />
        
        {/* Test routes - for development/debugging */}
        <RouteGroup routes={testRoutes} />
        
        {/* Protected routes with Layout */}
        <RouteGroup 
          routes={protectedRoutes} 
          useLayout={true} 
          useProtection={true} 
        />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRouter; 