// Mock for @features/email module

// Inline the emailManagementService mock to avoid require/export issues
const emailManagementService = {
  // Analytics methods - these need to be Jest mock functions that can be configured by tests
  getEmailAnalytics: jest.fn(),
  getEmailPerformanceMetrics: jest.fn(),
  getClientCommunicationAnalytics: jest.fn(),
  getEmailActivityMetrics: jest.fn(),
  generateEmailReport: jest.fn(),
  getRealTimeEmailMetrics: jest.fn(),

  // Email management methods
  sendEmail: jest.fn(),
  getEmails: jest.fn(),
  deleteEmail: jest.fn(),
  markAsRead: jest.fn(),
  markAsUnread: jest.fn(),
  
  // Template methods
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
  validateTemplate: jest.fn(),
  renderTemplate: jest.fn(),
};

// emailManagementService mock is ready with all required methods

// Export emailManagementService as the default export to match the test's import
module.exports = emailManagementService;

// Also export as named export for compatibility
module.exports.emailManagementService = emailManagementService;