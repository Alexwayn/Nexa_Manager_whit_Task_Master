// Script to force Italian language in the browser console
// Run this in the browser console (F12) to switch to Italian

console.log('=== FORCING ITALIAN LANGUAGE ===');

// Set localStorage to Italian
localStorage.setItem('nexa-language', 'it');
localStorage.setItem('i18nextLng', 'it');

console.log('Language set to Italian in localStorage');
console.log('Reloading page to apply changes...');

// Reload the page to apply the language change
window.location.reload();