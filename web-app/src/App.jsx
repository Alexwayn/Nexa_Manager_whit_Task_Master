import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from '@context/OptimizedThemeContext';
import { OrganizationProvider } from '@context/OrganizationContext';
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
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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

// Simple wrapper component for development mode
const DevelopmentWrapper = ({ children }) => {
  return (
    <div>
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        padding: '8px 16px',
        margin: '0',
        textAlign: 'center',
        fontSize: '14px',
        color: '#92400e',
        fontWeight: 'bold'
      }}>
        🚧 MODALITÀ SVILUPPO: Autenticazione Clerk bypassata per testing locale
      </div>
      {children}
    </div>
  );
};

function App() {
  console.log('🚧 App rendering with shouldBypassClerk:', shouldBypassClerk);

  if (shouldBypassClerk) {
    console.log('🚧 DEVELOPMENT MODE: Running without Clerk authentication');
    console.log('⚠️  This is for testing purposes only. Clerk authentication is bypassed.');
    
    // Initialize stagewise toolbar
    setupStagewise();
    
    return (
      <ErrorBoundary>
        <DevelopmentWrapper>
          <ThemeProvider>
            <OrganizationProvider>
              <Router>
                <AppRouter />
                <FloatingMicrophone />

                <Toaster position="top-right" />
              </Router>
            </OrganizationProvider>
          </ThemeProvider>
        </DevelopmentWrapper>
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
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ThemeProvider>
          <OrganizationProvider>
            <Router>
              <AppRouter />
              <FloatingMicrophone />

              <Toaster position="top-right" />
            </Router>
          </OrganizationProvider>
        </ThemeProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
