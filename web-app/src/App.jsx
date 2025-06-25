import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from '@context/OptimizedThemeContext';
import { OrganizationProvider } from '@context/OrganizationContext';
import AppRouter from '@router/AppRouter';
import FloatingMicrophone from '@components/shared/FloatingMicrophone';
import ErrorBoundary from '@components/common/ErrorBoundary';

import './index.css';

// Get the Clerk publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your environment variables.');
}

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
 * Migration to Clerk Authentication:
 * 1. Replaced AuthProvider with ClerkProvider for enterprise-grade auth
 * 2. ClerkProvider handles all authentication state and user management
 * 3. Maintains backward compatibility with existing routing structure
 * 4. Enhanced security with Clerk's built-in protections
 */
function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <OrganizationProvider>
          <ThemeProvider>
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
          </ThemeProvider>
        </OrganizationProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
