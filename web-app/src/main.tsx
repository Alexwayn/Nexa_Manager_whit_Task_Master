import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
