import emailStorageService from './src/features/email/services/emailStorageService.js';

console.log('Default export:', emailStorageService);
console.log('Type:', typeof emailStorageService);
console.log('Has storeEmail:', typeof emailStorageService?.storeEmail);
console.log('Has getEmails:', typeof emailStorageService?.getEmails);
console.log('Keys:', Object.keys(emailStorageService || {}));