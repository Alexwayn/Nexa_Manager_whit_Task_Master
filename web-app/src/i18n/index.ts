import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translation using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    lng: 'it',
    // Fallback language
    fallbackLng: 'en',

    // Debug mode - disable to reduce console noise
    debug: false, // import.meta.env.MODE === 'development',

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nexa-language',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      // checkAllowlist: true, // Deprecated in newer versions
    },

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
    defaultNS: 'common',

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
    // Set Italian as default if no language is stored
    if (!localStorage.getItem('nexa-language')) {
      localStorage.setItem('nexa-language', 'it');
      i18n.changeLanguage('it');
    }
  })
  .catch(error => {
    console.error('i18next initialization failed:', error);
  });

export default i18n;
