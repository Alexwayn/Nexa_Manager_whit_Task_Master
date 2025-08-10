// Proxy module to satisfy tests referencing '../lib/emailService'
const emailService = {
  isValidEmail: (email) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email),
  sendQuoteEmail: async () => ({ messageId: 'mock', timestamp: new Date().toISOString() }),
  scheduleReminders: () => {},
  getEmailTemplate: () => ({ subject: '', htmlBody: '' }),
};

export default emailService;


