// Error handler - must be imported first
import '@utils/error-handler';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initToolbar } from '@stagewise/toolbar';
import { getMode } from '@/utils/env';
import './index.css';
// Form and RTL styles are now imported globally through shared styles
import './i18n'; // Initialize i18n

// Initialize Sentry as early as possible
import { initSentry } from '@/lib/sentry';
initSentry();

// Font loading optimization
import { initFontLoading } from '@utils/fontLoader';
initFontLoading();

import App from '@/App.jsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Render the main app
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize Stagewise toolbar (framework-agnostic approach)
const stagewiseConfig = {
  plugins: [],
};

function setupStagewise() {
  // Only initialize once and only in development mode
  if (getMode() === 'development') {
    initToolbar(stagewiseConfig);
  }
}

// Call the setup function when appropriate for your framework
setupStagewise();
