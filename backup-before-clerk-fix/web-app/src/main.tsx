import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initToolbar } from '@stagewise/toolbar';
import './index.css';
import './styles/forms.css';
import './styles/rtl-support.css';
import './i18n'; // Initialize i18n

// Initialize Sentry as early as possible
import { initSentry } from '@lib/sentry';
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
  if (import.meta.env.MODE === 'development') {
    initToolbar(stagewiseConfig);
  }
}

// Call the setup function when appropriate for your framework
setupStagewise();
