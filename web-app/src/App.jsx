import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@context/OptimizedAuthContext';
import { ThemeProvider } from '@context/OptimizedThemeContext';
import AppRouter from '@router/AppRouter';
import FloatingMicrophone from '@components/shared/FloatingMicrophone';
import ErrorBoundary from '@components/common/ErrorBoundary';

import './index.css';

/**
 * Toast Configuration - Centralized toast settings
 */
const toastConfig = {
  position: 'top-right',
  reverseOrder: false,
  gutter: 8,
  containerClassName: '',
  containerStyle: {},
  toastOptions: {
    className: '',
    duration: 4000,
    style: {
      background: 'var(--toast-bg)',
      color: 'var(--toast-color)',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    },
    error: {
      duration: 5000,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    },
    loading: {
      duration: Infinity,
    },
  },
};

/**
 * Main App Component - Provides global context and routing
 *
 * Performance Optimizations Applied:
 * 1. Uses OptimizedAuthProvider for context splitting and memoization
 * 2. Uses OptimizedThemeProvider for reduced re-renders
 * 3. Maintains backward compatibility with original API
 * 4. All existing components work without changes
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200'>
              {/* Main Application Router */}
              <AppRouter />

              {/* Global Toast Notifications */}
              <Toaster {...toastConfig} />

              {/* Global Floating Microphone - Available on all pages */}
              <FloatingMicrophone />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
