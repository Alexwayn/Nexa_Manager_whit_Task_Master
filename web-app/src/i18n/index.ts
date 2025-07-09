import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// Force Italian language in localStorage before initialization
localStorage.setItem('nexa-language', 'it');

i18n
  // Load translation using http backend
  .use(Backend)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Force Italian language
    lng: 'it',
    // Fallback language
    fallbackLng: 'it', // Changed to 'it' to prevent English fallback

    // Debug mode - disable to reduce console noise
    debug: false,

    // No language detection - force Italian

    // Backend options for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Namespaces
    ns: [
      'common',
      'calendar',
      'navigation',
      'forms',
      'buttons',
      'receipts',
      'inventory',
      'documentation',
      'dashboard',
      'invoices',
      'clients',
      'quotes',
      'reports',
      'settings',
      'analytics',
      'transactions',
      'documents',
      'email',
      'scan',
      'voice',
    ],
    defaultNS: 'inventory',

    // Preload namespaces
    preload: ['it'],

    // Partials to load
    partialBundledLanguages: true,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Return objects option
    returnObjects: true,

    // Resources loading
    load: 'languageOnly', // Remove region code (e.g., 'en-US' becomes 'en')

    // React options
    react: {
      useSuspense: false, // Keep disabled to use manual loading states
    },

    // Wait for initialization
    initImmediate: false,
  })
  .then(() => {
    console.log('i18next initialized successfully');
    // Force Italian as default language
    localStorage.setItem('nexa-language', 'it');

    // Explicitly load Italian inventory namespace
    return i18n.loadNamespaces(['inventory']).then(() => {
      return i18n.changeLanguage('it');
    });
  })
  .then(() => {
    console.log('🇮🇹 Language forced to Italian:', i18n.language);
    console.log('📦 Inventory namespace loaded for Italian');
  })
  .catch(error => {
    console.error('i18next initialization failed:', error);
  });

export default i18n;
