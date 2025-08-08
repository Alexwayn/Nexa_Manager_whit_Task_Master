// Simple test to verify export structure
import emailStorageService from './src/features/email/services/emailStorageService.js';

console.log('emailStorageService:', emailStorageService);
console.log('Type:', typeof emailStorageService);
console.log('Keys:', Object.keys(emailStorageService || {}));
console.log('getEmails type:', typeof emailStorageService?.getEmails);
console.log('storeEmail type:', typeof emailStorageService?.storeEmail);

// Test if methods exist
if (emailStorageService && typeof emailStorageService.getEmails === 'function') {
  console.log('✅ getEmails method exists and is a function');
} else {
  console.log('❌ getEmails method is missing or not a function');
}

if (emailStorageService && typeof emailStorageService.storeEmail === 'function') {
  console.log('✅ storeEmail method exists and is a function');
} else {
  console.log('❌ storeEmail method is missing or not a function');
}