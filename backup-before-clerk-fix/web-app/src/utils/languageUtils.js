// Language utility functions

/**
 * Force set language to Italian and reload the page
 */
export const forceItalianLanguage = () => {
  console.log('🔧 Forcing language to Italian...');

  // Clear any existing language settings
  localStorage.removeItem('i18nextLng');
  localStorage.removeItem('nexa-language');

  // Set Italian as the language
  localStorage.setItem('nexa-language', 'it');
  localStorage.setItem('i18nextLng', 'it');

  console.log('✅ Language set to Italian, reloading page...');

  // Force page reload to apply changes
  window.location.reload();
};

/**
 * Check current language settings
 */
export const debugLanguageSettings = () => {
  console.log('🌐 Language Debug:');
  console.log('- localStorage nexa-language:', localStorage.getItem('nexa-language'));
  console.log('- localStorage i18nextLng:', localStorage.getItem('i18nextLng'));
  console.log('- navigator.language:', navigator.language);
  console.log('- navigator.languages:', navigator.languages);
};

/**
 * Reset language settings
 */
export const resetLanguageSettings = () => {
  localStorage.removeItem('i18nextLng');
  localStorage.removeItem('nexa-language');
  console.log('🔄 Language settings reset');
};
