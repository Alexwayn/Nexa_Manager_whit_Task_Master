import i18n from '../i18n';

/**
 * Translation utilities for enhanced i18n functionality
 */

// Cache for loaded translation namespaces
const loadedNamespaces = new Set();
const loadingPromises = new Map();

/**
 * Dynamically load a translation namespace
 * @param {string} namespace - The namespace to load
 * @param {string} language - The language to load (default: current language)
 * @returns {Promise} Promise that resolves when namespace is loaded
 */
export const loadNamespace = async (namespace, language = null) => {
  const lng = language || i18n.language;
  const key = `${lng}:${namespace}`;

  // Return existing promise if already loading
  if (loadingPromises.has(key)) {
    return loadingPromises.get(key);
  }

  // Return immediately if already loaded
  if (loadedNamespaces.has(key)) {
    return Promise.resolve();
  }

  // Create loading promise
  const loadingPromise = i18n
    .loadNamespaces(namespace)
    .then(() => {
      loadedNamespaces.add(key);
      loadingPromises.delete(key);
    })
    .catch(error => {
      console.error(`Failed to load namespace ${namespace} for language ${lng}:`, String(error?.message || error || 'Unknown error'));
      loadingPromises.delete(key);
      throw error;
    });

  loadingPromises.set(key, loadingPromise);
  return loadingPromise;
};

/**
 * Load multiple namespaces concurrently
 * @param {string[]} namespaces - Array of namespaces to load
 * @param {string} language - The language to load (default: current language)
 * @returns {Promise} Promise that resolves when all namespaces are loaded
 */
export const loadNamespaces = async (namespaces, language = null) => {
  const promises = namespaces.map(ns => loadNamespace(ns, language));
  return Promise.all(promises);
};

/**
 * Check if a namespace is loaded
 * @param {string} namespace - The namespace to check
 * @param {string} language - The language to check (default: current language)
 * @returns {boolean} True if namespace is loaded
 */
export const isNamespaceLoaded = (namespace, language = null) => {
  const lng = language || i18n.language;
  return loadedNamespaces.has(`${lng}:${namespace}`);
};

/**
 * Enhanced translation function with fallbacks and loading states
 * @param {string} key - Translation key
 * @param {object} options - Translation options
 * @returns {string|object} Translated text or loading indicator
 */
export const translateWithFallback = (key, options = {}) => {
  const {
    defaultValue = key,
    fallbackKey = null,
    loadingText = 'Loading...',
    namespace = null,
    ...restOptions
  } = options;

  // Check if namespace is loaded
  if (namespace && !isNamespaceLoaded(namespace)) {
    return loadingText;
  }

  // Try primary translation
  const translation = i18n.t(key, { ...restOptions, defaultValue: null });

  // Return translation if found and not the key itself
  if (translation && translation !== key) {
    return translation;
  }

  // Try fallback key if provided
  if (fallbackKey) {
    const fallbackTranslation = i18n.t(fallbackKey, { ...restOptions, defaultValue: null });
    if (fallbackTranslation && fallbackTranslation !== fallbackKey) {
      return fallbackTranslation;
    }
  }

  // Return default value
  return defaultValue;
};

/**
 * Validate translation coverage for a namespace
 * @param {string} namespace - The namespace to validate
 * @param {string[]} requiredKeys - Array of required translation keys
 * @param {string} language - The language to validate (default: current language)
 * @returns {object} Validation result with missing keys
 */
export const validateTranslations = (namespace, requiredKeys, language = null) => {
  const lng = language || i18n.language;
  const missing = [];
  const found = [];

  requiredKeys.forEach(key => {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    const translation = i18n.t(fullKey, { lng, defaultValue: null });

    if (!translation || translation === fullKey || translation === key) {
      missing.push(key);
    } else {
      found.push(key);
    }
  });

  return {
    namespace,
    language: lng,
    total: requiredKeys.length,
    found: found.length,
    missing: missing.length,
    missingKeys: missing,
    foundKeys: found,
    coverage: ((found.length / requiredKeys.length) * 100).toFixed(2),
  };
};

/**
 * Get available languages from loaded resources
 * @returns {string[]} Array of available language codes
 */
export const getAvailableLanguages = () => {
  return Object.keys(i18n.store.data || {});
};

/**
 * Get missing translations for a language compared to a reference language
 * @param {string} targetLanguage - Language to check for missing translations
 * @param {string} referenceLanguage - Reference language (default: 'en')
 * @returns {object} Object with missing translations by namespace
 */
export const getMissingTranslations = (targetLanguage, referenceLanguage = 'en') => {
  const missing = {};
  const referenceData = i18n.store.data[referenceLanguage] || {};
  const targetData = i18n.store.data[targetLanguage] || {};

  Object.keys(referenceData).forEach(namespace => {
    const refNsData = referenceData[namespace] || {};
    const targetNsData = targetData[namespace] || {};

    missing[namespace] = {};

    const findMissingKeys = (refObj, targetObj, path = '') => {
      Object.keys(refObj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof refObj[key] === 'object' && !Array.isArray(refObj[key])) {
          findMissingKeys(refObj[key], targetObj[key] || {}, currentPath);
        } else if (!(key in targetObj)) {
          missing[namespace][currentPath] = refObj[key];
        }
      });
    };

    findMissingKeys(refNsData, targetNsData);

    // Remove namespace if no missing keys
    if (Object.keys(missing[namespace]).length === 0) {
      delete missing[namespace];
    }
  });

  return missing;
};

/**
 * Preload translations for specific components
 * @param {string[]} componentNames - Array of component names that need translations
 * @returns {Promise} Promise that resolves when all component translations are loaded
 */
export const preloadComponentTranslations = async componentNames => {
  const namespaceMap = {
    // Map component names to their required namespaces
    Dashboard: ['dashboard', 'common', 'navigation'],
    Invoices: ['invoices', 'common', 'forms', 'buttons'],
    Clients: ['clients', 'common', 'forms', 'buttons'],
    Calendar: ['calendar', 'common', 'forms', 'buttons'],
    Reports: ['reports', 'analytics', 'common', 'buttons'],
    Settings: ['settings', 'common', 'forms', 'buttons'],
    Analytics: ['analytics', 'reports', 'common', 'buttons'],
    Documents: ['documents', 'common', 'forms', 'buttons'],
    Email: ['email', 'common', 'forms', 'buttons'],
    Quotes: ['quotes', 'common', 'forms', 'buttons'],
    Inventory: ['inventory', 'common', 'forms', 'buttons'],
    Transactions: ['transactions', 'common', 'forms', 'buttons'],
  };

  const namespacesToLoad = new Set();

  componentNames.forEach(componentName => {
    const namespaces = namespaceMap[componentName] || [componentName.toLowerCase()];
    namespaces.forEach(ns => namespacesToLoad.add(ns));
  });

  return loadNamespaces([...namespacesToLoad]);
};

/**
 * Format translation with rich formatting support
 * @param {string} key - Translation key
 * @param {object} values - Values for interpolation
 * @param {object} options - Additional options
 * @returns {string} Formatted translation
 */
export const formatTranslation = (key, values = {}, options = {}) => {
  const translation = translateWithFallback(key, options);

  if (!values || Object.keys(values).length === 0) {
    return translation;
  }

  // Support for complex formatting
  let formatted = translation;

  Object.keys(values).forEach(placeholder => {
    const value = values[placeholder];
    const regex = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');

    if (typeof value === 'number') {
      // Format numbers based on locale
      const formatted_value = new Intl.NumberFormat(i18n.language).format(value);
      formatted = formatted.replace(regex, formatted_value);
    } else if (value instanceof Date) {
      // Format dates based on locale
      const formatted_value = new Intl.DateTimeFormat(i18n.language).format(value);
      formatted = formatted.replace(regex, formatted_value);
    } else {
      formatted = formatted.replace(regex, String(value));
    }
  });

  return formatted;
};

/**
 * Switch language and preload common namespaces
 * @param {string} language - Language code to switch to
 * @param {string[]} preloadNamespaces - Namespaces to preload (default: common ones)
 * @returns {Promise} Promise that resolves when language is switched and namespaces loaded
 */
export const switchLanguage = async (
  language,
  preloadNamespaces = ['common', 'navigation', 'forms', 'buttons'],
) => {
  try {
    await i18n.changeLanguage(language);
    await loadNamespaces(preloadNamespaces, language);

    // Store language preference
    localStorage.setItem('nexa-language', language);

    return language;
  } catch (error) {
    console.error('Failed to switch language:', error);
    throw error;
  }
};

/**
 * Create a translation hook for React components
 * @param {string} namespace - Default namespace for the hook
 * @returns {object} Translation hook object
 */
export const createTranslationHook = namespace => {
  return {
    t: (key, options = {}) => {
      const fullKey = key.includes(':') ? key : `${namespace}:${key}`;
      return translateWithFallback(fullKey, options);
    },

    isLoaded: () => isNamespaceLoaded(namespace),

    load: () => loadNamespace(namespace),

    format: (key, values, options = {}) => {
      const fullKey = key.includes(':') ? key : `${namespace}:${key}`;
      return formatTranslation(fullKey, values, options);
    },
  };
};

// Default export
export default {
  loadNamespace,
  loadNamespaces,
  isNamespaceLoaded,
  translateWithFallback,
  validateTranslations,
  getAvailableLanguages,
  getMissingTranslations,
  preloadComponentTranslations,
  formatTranslation,
  switchLanguage,
  createTranslationHook,
};
