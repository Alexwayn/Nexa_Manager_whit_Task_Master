import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@context/AuthContext';
import { ThemeProvider } from '@context/ThemeContext';
import AppRouter from '@router/AppRouter';
import FloatingMicrophone from '@components/FloatingMicrophone';
import ErrorBoundary from '@components/common/ErrorBoundary';

import './index.css';

/**
 * Toast Configuration - Centralized toast settings
 */
const toastConfig = {
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerClassName: "",
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
  }
};

/**
 * Main App Component - Provides global context and routing
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
