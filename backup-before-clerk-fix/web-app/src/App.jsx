import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from '@context/OptimizedThemeContext';
import { OrganizationProvider } from '@context/OrganizationContext';
import { QueryProvider } from "./providers/QueryProvider";
import { WebSocketProvider } from './providers/WebSocketProvider';
import AppRouter from '@router/AppRouter';
import FloatingMicrophone from '@components/shared/FloatingMicrophone';
import ErrorBoundary from '@components/common/ErrorBoundary';
// import LanguageForcer from '@components/debug/LanguageForcer'; // Removed debug component

import { initToolbar } from '@stagewise/toolbar';

import './index.css';
import './i18n'; // Import i18n configuration
import i18n from './i18n';

// Debug i18n initialization
console.log('🌐 i18n Debug Info:');
console.log('- Current language:', i18n.language);
console.log('- Resolved language:', i18n.resolvedLanguage);
console.log('- Is initialized:', i18n.isInitialized);
console.log('- Available languages:', i18n.languages);
console.log('- localStorage language:', localStorage.getItem('nexa-language'));

// Get the Clerk publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Stagewise toolbar configuration
const stagewiseConfig = {
  plugins: [],
};

// Initialize stagewise toolbar (framework-agnostic approach)
let stagewiseInitialized = false;
function setupStagewise() {
  // Only initialize once and only in development mode
  if (isDevelopment && !stagewiseInitialized) {
    stagewiseInitialized = true;
    initToolbar(stagewiseConfig);
  }
}

// Debug logging
console.log('🔍 App.jsx Debug Info:');
console.log('- isDevelopment:', isDevelopment);
console.log('- isLocalhost:', isLocalhost);
console.log('- clerkPublishableKey exists:', !!clerkPublishableKey);
console.log('- window.location.hostname:', window.location.hostname);

// For development/localhost, we can bypass Clerk completely
const shouldBypassClerk = isDevelopment && isLocalhost;

console.log('🚧 shouldBypassClerk:', shouldBypassClerk);

// Development mode no longer shows the bypass banner

function App() {
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      setI18nReady(true);
    } else {
      const checkI18nReady = () => {
        if (i18n.isInitialized) {
          setI18nReady(true);
        } else {
          setTimeout(checkI18nReady, 50);
        }
      };
      checkI18nReady();
    }
  }, []);

  console.log('🚧 App rendering with shouldBypassClerk:', shouldBypassClerk);
  console.log('🌐 i18n ready:', i18nReady);

  // Show loading screen while i18n is initializing
  if (!i18nReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          ></div>
          <p
            style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: 0,
            }}
          >
            Caricamento traduzioni...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (shouldBypassClerk) {
    console.log('🚧 DEVELOPMENT MODE: Running without Clerk authentication');
    console.log('⚠️  This is for testing purposes only. Clerk authentication is bypassed.');

    // Initialize stagewise toolbar
    setupStagewise();

    return (
      <ErrorBoundary>
        <QueryProvider>
          <WebSocketProvider enabled={true}>
            <ThemeProvider>
              <OrganizationProvider>
                <Router>
                  <AppRouter />
                  <FloatingMicrophone />

                  <Toaster position='top-right' />
                </Router>
              </OrganizationProvider>
            </ThemeProvider>
          </WebSocketProvider>
        </QueryProvider>
      </ErrorBoundary>
    );
  }

  // Production mode with Clerk
  console.log('🔐 PRODUCTION MODE: Using Clerk authentication');

  if (!clerkPublishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  // Initialize stagewise toolbar for production mode too (it handles dev-only internally)
  setupStagewise();

  return (
    <ErrorBoundary>
      <QueryProvider>
        <WebSocketProvider enabled={true}>
          <ClerkProvider publishableKey={clerkPublishableKey}>
            <ThemeProvider>
              <OrganizationProvider>
                <Router>
                  <AppRouter />
                  <FloatingMicrophone />

                  <Toaster position='top-right' />
                </Router>
              </OrganizationProvider>
            </ThemeProvider>
          </ClerkProvider>
        </WebSocketProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
