import { useState, useEffect, useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { 
  loadNamespace, 
  isNamespaceLoaded, 
  translateWithFallback,
  formatTranslation,
  preloadComponentTranslations
} from '../utils/translationUtils';

/**
 * Enhanced useTranslation hook with dynamic loading and fallbacks
 * @param {string|string[]} namespace - Namespace(s) to use for translations
 * @param {object} options - Hook options
 * @returns {object} Translation utilities and state
 */
export const useTranslation = (namespace = 'common', options = {}) => {
  const { 
    lazy = false, // Whether to load namespace lazily
    fallbackNamespace = 'common',
    loadingText = 'Loading...',
    preloadComponents = null // Array of component names to preload
  } = options;
  
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const { t: originalT, i18n, ready } = useI18nTranslation(namespaces);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Check if all namespaces are loaded
  const checkNamespacesLoaded = useCallback(() => {
    return namespaces.every(ns => isNamespaceLoaded(ns));
  }, [namespaces]);

  // Load namespaces
  const loadNamespaces = useCallback(async () => {
    if (checkNamespacesLoaded()) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load primary namespaces
      await Promise.all(namespaces.map(ns => loadNamespace(ns)));
      
      // Preload component translations if specified
      if (preloadComponents && Array.isArray(preloadComponents)) {
        await preloadComponentTranslations(preloadComponents);
      }
      
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to load translation namespaces:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [namespaces, preloadComponents, checkNamespacesLoaded]);

  // Enhanced translation function
  const t = useCallback((key, options = {}) => {
    const { 
      defaultValue = key,
      fallbackKey = null,
      namespace: keyNamespace = null,
      ...restOptions 
    } = options;

    // If not loaded and loading, show loading text
    if (!isLoaded && isLoading) {
      return loadingText;
    }

    // Determine the full key
    let fullKey = key;
    if (keyNamespace) {
      fullKey = `${keyNamespace}:${key}`;
    } else if (!key.includes(':') && namespaces.length > 0) {
      fullKey = `${namespaces[0]}:${key}`;
    }

    // Try translation with fallback
    return translateWithFallback(fullKey, {
      defaultValue,
      fallbackKey: fallbackKey ? `${fallbackNamespace}:${fallbackKey}` : null,
      loadingText,
      namespace: keyNamespace || namespaces[0],
      ...restOptions
    });
  }, [namespaces, fallbackNamespace, isLoaded, isLoading, loadingText]);

  // Format translation with interpolation
  const format = useCallback((key, values = {}, options = {}) => {
    const { namespace: keyNamespace = null, ...restOptions } = options;
    
    let fullKey = key;
    if (keyNamespace) {
      fullKey = `${keyNamespace}:${key}`;
    } else if (!key.includes(':') && namespaces.length > 0) {
      fullKey = `${namespaces[0]}:${key}`;
    }

    return formatTranslation(fullKey, values, restOptions);
  }, [namespaces]);

  // Get translation for specific namespace
  const tn = useCallback((namespace, key, options = {}) => {
    return t(key, { ...options, namespace });
  }, [t]);

  // Check if specific key exists
  const exists = useCallback((key, options = {}) => {
    const { namespace: keyNamespace = null } = options;
    
    let fullKey = key;
    if (keyNamespace) {
      fullKey = `${keyNamespace}:${key}`;
    } else if (!key.includes(':') && namespaces.length > 0) {
      fullKey = `${namespaces[0]}:${key}`;
    }

    const translation = originalT(fullKey, { defaultValue: null });
    return translation !== null && translation !== fullKey && translation !== key;
  }, [originalT, namespaces]);

  // Load additional namespace
  const loadAdditionalNamespace = useCallback(async (additionalNamespace) => {
    try {
      setIsLoading(true);
      await loadNamespace(additionalNamespace);
    } catch (err) {
      console.error(`Failed to load additional namespace ${additionalNamespace}:`, err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load namespaces on mount or when namespaces change
  useEffect(() => {
    if (!lazy) {
      loadNamespaces();
    } else {
      setIsLoaded(checkNamespacesLoaded());
    }
  }, [lazy, loadNamespaces, checkNamespacesLoaded]);

  // Effect to update loaded state when ready changes
  useEffect(() => {
    if (ready) {
      setIsLoaded(checkNamespacesLoaded());
    }
  }, [ready, checkNamespacesLoaded]);

  return {
    // Translation functions
    t,
    format,
    tn, // Translate with specific namespace
    exists,
    
    // Loading functions
    load: loadNamespaces,
    loadNamespace: loadAdditionalNamespace,
    
    // State
    isLoading,
    isLoaded,
    error,
    ready,
    
    // Language utilities
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    
    // Original i18next utilities
    i18n
  };
};

/**
 * Hook for component-specific translations with automatic namespace loading
 * @param {string} componentName - Name of the component
 * @param {object} options - Hook options
 * @returns {object} Translation utilities
 */
export const useComponentTranslation = (componentName, options = {}) => {
  const namespaceMapping = {
    'Dashboard': 'dashboard',
    'Invoices': 'invoices',
    'Clients': 'clients',
    'Calendar': 'calendar',
    'Reports': 'reports',
    'Settings': 'settings',
    'Analytics': 'analytics',
    'Documents': 'documents',
    'Email': 'email',
    'Quotes': 'quotes',
    'Inventory': 'inventory',
    'Transactions': 'transactions'
  };

  const namespace = namespaceMapping[componentName] || componentName.toLowerCase();
  const namespaces = [namespace, 'common', 'buttons', 'forms'];

  return useTranslation(namespaces, {
    preloadComponents: [componentName],
    ...options
  });
};

/**
 * Hook for lazy loading translations only when needed
 * @param {string|string[]} namespace - Namespace(s) to load
 * @param {object} options - Hook options
 * @returns {object} Translation utilities with lazy loading
 */
export const useLazyTranslation = (namespace, options = {}) => {
  return useTranslation(namespace, {
    lazy: true,
    ...options
  });
};

export default useTranslation; 