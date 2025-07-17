/**
 * Translation Audit Utilities
 * Comprehensive tools for analyzing translation coverage, quality, and completeness
 */

import i18n from '../i18n';
import { getAvailableLanguages } from './translationUtils';

/**
 * Audit all translations for completeness and quality
 * @param {string} baseLanguage - Reference language for comparison (default: 'en')
 * @returns {object} Comprehensive audit report
 */
export const auditTranslations = async (baseLanguage = 'en') => {
  const languages = getAvailableLanguages();
  const namespaces = Object.keys(i18n.store.data[baseLanguage] || {});

  const audit = {
    summary: {
      totalLanguages: languages.length,
      totalNamespaces: namespaces.length,
      baseLanguage,
      auditDate: new Date().toISOString(),
      overallCoverage: 0,
    },
    languages: {},
    namespaces: {},
    issues: [],
    recommendations: [],
  };

  // Audit each language
  for (const language of languages) {
    if (language === baseLanguage) continue;

    audit.languages[language] = await auditLanguage(language, baseLanguage);
  }

  // Audit each namespace
  for (const namespace of namespaces) {
    audit.namespaces[namespace] = await auditNamespace(namespace, baseLanguage);
  }

  // Calculate overall coverage
  const totalKeys = getTotalKeyCount(baseLanguage);
  const totalTranslatedKeys = languages
    .filter(lang => lang !== baseLanguage)
    .reduce((sum, lang) => {
      return (
        sum +
        Object.values(audit.languages[lang]?.namespaces || {}).reduce(
          (nsSum, ns) => nsSum + ns.translatedKeys,
          0,
        )
      );
    }, 0);

  audit.summary.overallCoverage =
    totalKeys > 0
      ? ((totalTranslatedKeys / (totalKeys * (languages.length - 1))) * 100).toFixed(2)
      : 100;

  // Generate issues and recommendations
  audit.issues = findTranslationIssues(audit);
  audit.recommendations = generateRecommendations(audit);

  return audit;
};

/**
 * Audit a specific language against the base language
 * @param {string} language - Target language to audit
 * @param {string} baseLanguage - Reference language
 * @returns {object} Language audit report
 */
export const auditLanguage = async (language, baseLanguage = 'en') => {
  const baseData = i18n.store.data[baseLanguage] || {};
  const targetData = i18n.store.data[language] || {};

  const languageAudit = {
    language,
    namespaces: {},
    summary: {
      totalNamespaces: 0,
      translatedNamespaces: 0,
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: 0,
      emptyTranslations: 0,
      coverage: 0,
    },
    missingNamespaces: [],
    qualityIssues: [],
  };

  for (const namespace of Object.keys(baseData)) {
    const nsAudit = auditNamespaceForLanguage(namespace, language, baseLanguage);
    languageAudit.namespaces[namespace] = nsAudit;

    // Update summary
    languageAudit.summary.totalNamespaces++;
    if (nsAudit.coverage > 0) languageAudit.summary.translatedNamespaces++;
    languageAudit.summary.totalKeys += nsAudit.totalKeys;
    languageAudit.summary.translatedKeys += nsAudit.translatedKeys;
    languageAudit.summary.missingKeys += nsAudit.missingKeys;
    languageAudit.summary.emptyTranslations += nsAudit.emptyTranslations;

    // Track missing namespaces
    if (!targetData[namespace]) {
      languageAudit.missingNamespaces.push(namespace);
    }

    // Add quality issues
    languageAudit.qualityIssues.push(...nsAudit.qualityIssues);
  }

  // Calculate overall coverage
  languageAudit.summary.coverage =
    languageAudit.summary.totalKeys > 0
      ? ((languageAudit.summary.translatedKeys / languageAudit.summary.totalKeys) * 100).toFixed(2)
      : 100;

  return languageAudit;
};

/**
 * Audit a specific namespace across all languages
 * @param {string} namespace - Namespace to audit
 * @param {string} baseLanguage - Reference language
 * @returns {object} Namespace audit report
 */
export const auditNamespace = async (namespace, baseLanguage = 'en') => {
  const languages = getAvailableLanguages().filter(lang => lang !== baseLanguage);
  const baseKeys = getNamespaceKeys(namespace, baseLanguage);

  const namespaceAudit = {
    namespace,
    totalKeys: baseKeys.length,
    languages: {},
    summary: {
      averageCoverage: 0,
      fullyTranslatedLanguages: 0,
      partiallyTranslatedLanguages: 0,
      missingLanguages: 0,
    },
    commonMissingKeys: [],
    keyUsageStats: {},
  };

  // Audit each language for this namespace
  for (const language of languages) {
    const langAudit = auditNamespaceForLanguage(namespace, language, baseLanguage);
    namespaceAudit.languages[language] = langAudit;

    // Update summary
    if (langAudit.coverage === 100) {
      namespaceAudit.summary.fullyTranslatedLanguages++;
    } else if (langAudit.coverage > 0) {
      namespaceAudit.summary.partiallyTranslatedLanguages++;
    } else {
      namespaceAudit.summary.missingLanguages++;
    }
  }

  // Calculate average coverage
  const coverageSum = Object.values(namespaceAudit.languages).reduce(
    (sum, lang) => sum + parseFloat(lang.coverage),
    0,
  );
  namespaceAudit.summary.averageCoverage =
    languages.length > 0 ? (coverageSum / languages.length).toFixed(2) : 0;

  // Find commonly missing keys
  namespaceAudit.commonMissingKeys = findCommonMissingKeys(namespace, languages, baseLanguage);

  // Generate key usage statistics
  namespaceAudit.keyUsageStats = generateKeyUsageStats(namespace, baseLanguage);

  return namespaceAudit;
};

/**
 * Audit a specific namespace for a specific language
 * @param {string} namespace - Namespace to audit
 * @param {string} language - Target language
 * @param {string} baseLanguage - Reference language
 * @returns {object} Namespace-language audit
 */
export const auditNamespaceForLanguage = (namespace, language, baseLanguage = 'en') => {
  const baseKeys = getNamespaceKeys(namespace, baseLanguage);
  const targetKeys = getNamespaceKeys(namespace, language);
  const targetData = i18n.store.data[language]?.[namespace] || {};

  const missingKeys = baseKeys.filter(key => !targetKeys.includes(key));
  const emptyTranslations = targetKeys.filter(
    key => !targetData[key] || targetData[key].trim() === '',
  );

  const qualityIssues = [];

  // Check for quality issues
  targetKeys.forEach(key => {
    const value = targetData[key];
    if (typeof value === 'string') {
      // Check for untranslated text (still in base language)
      if (language !== baseLanguage && detectUntranslatedText(value, baseLanguage)) {
        qualityIssues.push({
          type: 'untranslated',
          key,
          value,
          message: 'Text appears to be in base language',
        });
      }

      // Check for interpolation mismatches
      const baseValue = i18n.store.data[baseLanguage]?.[namespace]?.[key];
      if (baseValue && hasInterpolationMismatch(value, baseValue)) {
        qualityIssues.push({
          type: 'interpolation_mismatch',
          key,
          value,
          baseValue,
          message: "Interpolation variables don't match base language",
        });
      }

      // Check for suspiciously short translations
      if (baseValue && value.length < baseValue.length * 0.3) {
        qualityIssues.push({
          type: 'suspiciously_short',
          key,
          value,
          baseValue,
          message: 'Translation appears significantly shorter than original',
        });
      }
    }
  });

  return {
    namespace,
    language,
    totalKeys: baseKeys.length,
    translatedKeys: targetKeys.length - emptyTranslations.length,
    missingKeys: missingKeys.length,
    emptyTranslations: emptyTranslations.length,
    coverage:
      baseKeys.length > 0
        ? (((targetKeys.length - emptyTranslations.length) / baseKeys.length) * 100).toFixed(2)
        : 100,
    missingKeysList: missingKeys,
    emptyTranslationsList: emptyTranslations,
    qualityIssues,
  };
};

/**
 * Generate translation validation report
 * @param {string} namespace - Namespace to validate
 * @param {string} language - Language to validate
 * @returns {object} Validation report
 */
export const validateTranslationQuality = (namespace, language) => {
  const data = i18n.store.data[language]?.[namespace] || {};
  const baseData = i18n.store.data.en?.[namespace] || {};

  const report = {
    namespace,
    language,
    totalKeys: Object.keys(data).length,
    validKeys: 0,
    issues: [],
  };

  Object.entries(data).forEach(([key, value]) => {
    const baseValue = baseData[key];
    let isValid = true;

    // Check if translation exists and is not empty
    if (!value || value.trim() === '') {
      report.issues.push({
        key,
        type: 'empty',
        severity: 'high',
        message: 'Translation is empty or missing',
      });
      isValid = false;
    }

    // Check for interpolation consistency
    if (baseValue && hasInterpolationMismatch(value, baseValue)) {
      report.issues.push({
        key,
        type: 'interpolation',
        severity: 'medium',
        message: "Interpolation variables don't match base language",
        expected: extractInterpolationVariables(baseValue),
        actual: extractInterpolationVariables(value),
      });
      isValid = false;
    }

    // Check for HTML tag consistency
    if (baseValue && hasHtmlMismatch(value, baseValue)) {
      report.issues.push({
        key,
        type: 'html_tags',
        severity: 'medium',
        message: "HTML tags don't match base language",
      });
      isValid = false;
    }

    if (isValid) {
      report.validKeys++;
    }
  });

  report.qualityScore =
    report.totalKeys > 0 ? ((report.validKeys / report.totalKeys) * 100).toFixed(2) : 100;

  return report;
};

/**
 * Get all keys for a namespace in a specific language
 * @param {string} namespace - Namespace name
 * @param {string} language - Language code
 * @returns {string[]} Array of keys
 */
const getNamespaceKeys = (namespace, language) => {
  const data = i18n.store.data[language]?.[namespace];
  if (!data) return [];

  const extractKeys = (obj, prefix = '') => {
    let keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  };

  return extractKeys(data);
};

/**
 * Get total key count for base language
 * @param {string} baseLanguage - Base language code
 * @returns {number} Total number of keys
 */
const getTotalKeyCount = baseLanguage => {
  const data = i18n.store.data[baseLanguage] || {};
  return Object.keys(data).reduce((total, namespace) => {
    return total + getNamespaceKeys(namespace, baseLanguage).length;
  }, 0);
};

/**
 * Find keys that are missing across multiple languages
 * @param {string} namespace - Namespace to check
 * @param {string[]} languages - Languages to check
 * @param {string} baseLanguage - Base language
 * @returns {string[]} Common missing keys
 */
const findCommonMissingKeys = (namespace, languages, baseLanguage) => {
  const baseKeys = getNamespaceKeys(namespace, baseLanguage);
  const missingCounts = {};

  languages.forEach(language => {
    const targetKeys = getNamespaceKeys(namespace, language);
    const missing = baseKeys.filter(key => !targetKeys.includes(key));
    missing.forEach(key => {
      missingCounts[key] = (missingCounts[key] || 0) + 1;
    });
  });

  // Return keys missing in more than 50% of languages
  const threshold = Math.ceil(languages.length * 0.5);
  return Object.entries(missingCounts)
    .filter(([key, count]) => count >= threshold)
    .map(([key]) => key);
};

/**
 * Generate usage statistics for keys in a namespace
 * @param {string} namespace - Namespace to analyze
 * @param {string} baseLanguage - Base language
 * @returns {object} Usage statistics
 */
const generateKeyUsageStats = (namespace, baseLanguage) => {
  const keys = getNamespaceKeys(namespace, baseLanguage);
  const data = i18n.store.data[baseLanguage]?.[namespace] || {};

  const stats = {
    totalKeys: keys.length,
    categories: {},
    complexity: {
      simple: 0, // No interpolation, no HTML
      interpolated: 0, // Has interpolation variables
      html: 0, // Contains HTML tags
      complex: 0, // Both interpolation and HTML
    },
  };

  keys.forEach(key => {
    const value = getNestedValue(data, key);
    if (typeof value === 'string') {
      const hasInterpolation = /\{\{.*?\}\}/.test(value);
      const hasHtml = /<[^>]*>/.test(value);

      if (hasInterpolation && hasHtml) {
        stats.complexity.complex++;
      } else if (hasInterpolation) {
        stats.complexity.interpolated++;
      } else if (hasHtml) {
        stats.complexity.html++;
      } else {
        stats.complexity.simple++;
      }

      // Categorize by key prefix
      const category = key.split('.')[0];
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Find translation issues across the audit
 * @param {object} audit - Complete audit report
 * @returns {array} Array of issues
 */
const findTranslationIssues = audit => {
  const issues = [];

  // Critical issues
  Object.entries(audit.languages).forEach(([language, langAudit]) => {
    if (parseFloat(langAudit.summary.coverage) < 50) {
      issues.push({
        type: 'critical',
        category: 'coverage',
        language,
        message: `${language} has very low translation coverage (${langAudit.summary.coverage}%)`,
        priority: 'high',
      });
    }

    if (langAudit.missingNamespaces.length > 0) {
      issues.push({
        type: 'critical',
        category: 'missing_namespaces',
        language,
        message: `${language} is missing ${langAudit.missingNamespaces.length} namespaces`,
        details: langAudit.missingNamespaces,
        priority: 'high',
      });
    }
  });

  // Quality issues
  Object.values(audit.languages).forEach(langAudit => {
    if (langAudit.qualityIssues.length > 0) {
      issues.push({
        type: 'quality',
        category: 'translation_quality',
        language: langAudit.language,
        message: `${langAudit.language} has ${langAudit.qualityIssues.length} quality issues`,
        details: langAudit.qualityIssues,
        priority: 'medium',
      });
    }
  });

  return issues;
};

/**
 * Generate recommendations based on audit results
 * @param {object} audit - Complete audit report
 * @returns {array} Array of recommendations
 */
const generateRecommendations = audit => {
  const recommendations = [];

  // Coverage recommendations
  if (parseFloat(audit.summary.overallCoverage) < 80) {
    recommendations.push({
      type: 'coverage',
      priority: 'high',
      title: 'Improve overall translation coverage',
      description: `Overall coverage is ${audit.summary.overallCoverage}%. Target should be above 90%.`,
      actions: [
        'Focus on languages with lowest coverage',
        'Prioritize most commonly used namespaces',
        'Set up translation workflow for missing keys',
      ],
    });
  }

  // Language-specific recommendations
  Object.entries(audit.languages).forEach(([language, langAudit]) => {
    if (parseFloat(langAudit.summary.coverage) < 70) {
      recommendations.push({
        type: 'language',
        priority: 'medium',
        title: `Improve ${language} translations`,
        description: `${language} coverage is ${langAudit.summary.coverage}%`,
        actions: [
          `Translate ${langAudit.summary.missingKeys} missing keys`,
          `Complete ${langAudit.missingNamespaces.length} missing namespaces`,
          'Review and fix quality issues',
        ],
      });
    }
  });

  // Namespace recommendations
  Object.entries(audit.namespaces).forEach(([namespace, nsAudit]) => {
    if (parseFloat(nsAudit.summary.averageCoverage) < 70) {
      recommendations.push({
        type: 'namespace',
        priority: 'medium',
        title: `Focus on ${namespace} namespace`,
        description: `${namespace} has low average coverage (${nsAudit.summary.averageCoverage}%)`,
        actions: [
          'Prioritize commonly missing keys',
          'Review key usage and importance',
          'Consider namespace restructuring',
        ],
      });
    }
  });

  return recommendations;
};

// Helper functions
const detectUntranslatedText = (text, baseLanguage) => {
  // Simple heuristic - could be enhanced with actual language detection
  if (baseLanguage === 'en') {
    return /^[a-zA-Z\s\.,!?'"()-]+$/.test(text) && text.split(' ').length > 1;
  }
  return false;
};

const hasInterpolationMismatch = (target, base) => {
  const targetVars = extractInterpolationVariables(target);
  const baseVars = extractInterpolationVariables(base);
  return JSON.stringify(targetVars.sort()) !== JSON.stringify(baseVars.sort());
};

const extractInterpolationVariables = text => {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(match => match.slice(2, -2).trim());
};

const hasHtmlMismatch = (target, base) => {
  const targetTags = extractHtmlTags(target);
  const baseTags = extractHtmlTags(base);
  return JSON.stringify(targetTags.sort()) !== JSON.stringify(baseTags.sort());
};

const extractHtmlTags = text => {
  const matches = text.match(/<[^>]+>/g) || [];
  return matches.map(tag => tag.toLowerCase());
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export default {
  auditTranslations,
  auditLanguage,
  auditNamespace,
  validateTranslationQuality,
  auditNamespaceForLanguage,
};
