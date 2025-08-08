// Mock for emailManagementService
console.log('🔧 Loading emailManagementService mock');
const emailManagementService = {
  // Analytics methods - these need to be Jest mock functions that can be configured by tests
  getEmailAnalytics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      totalEmails: 150,
      sentEmails: 120,
      receivedEmails: 30,
      openRate: 0.65,
      clickRate: 0.25,
      bounceRate: 0.05,
      chartData: {
        emailVolume: [10, 15, 12, 18, 20, 25, 22],
        openRates: [0.6, 0.65, 0.7, 0.68, 0.72, 0.75, 0.73]
      }
    }
  }),

  getEmailPerformanceMetrics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      deliveryRate: 0.95,
      openRate: 0.65,
      clickRate: 0.25,
      unsubscribeRate: 0.02
    }
  }),

  getClientCommunicationAnalytics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      totalClients: 50,
      activeClients: 35,
      responseRate: 0.8
    }
  }),

  getEmailActivityMetrics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      dailyActivity: [5, 8, 12, 15, 10, 7, 9],
      peakHours: [9, 14, 16]
    }
  }),

  generateEmailReport: jest.fn().mockResolvedValue({
    success: true,
    data: {
      reportId: 'email_report_123',
      downloadUrl: '/api/reports/email_report_123.pdf',
      format: 'pdf'
    }
  }),

  getRealTimeEmailMetrics: jest.fn().mockResolvedValue({
    success: true,
    data: {
      currentSending: 5,
      queueSize: 12,
      lastUpdate: new Date().toISOString()
    }
  }),

  // Email management methods
  sendEmail: jest.fn().mockResolvedValue({
    success: true,
    data: { messageId: 'msg_123' }
  }),

  getEmails: jest.fn().mockResolvedValue({
    success: true,
    data: []
  }),

  deleteEmail: jest.fn().mockResolvedValue({
    success: true
  }),

  markAsRead: jest.fn().mockResolvedValue({
    success: true
  }),

  markAsUnread: jest.fn().mockResolvedValue({
    success: true
  }),
  
  // Template methods
  getTemplates: jest.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Welcome Email', subject: 'Welcome!', content: 'Welcome to our service' },
      { id: 2, name: 'Newsletter', subject: 'Monthly Update', content: 'Here are the updates' }
    ]
  }),

  saveTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 3, name: 'New Template' }
  }),

  validateTemplate: jest.fn().mockResolvedValue({
    success: true,
    isValid: true
  }),

  renderTemplate: jest.fn().mockResolvedValue({
    success: true,
    data: { html: '<p>Rendered template</p>' }
  }),
};

// Export as both named and default export to handle different import styles
module.exports = emailManagementService;
module.exports.emailManagementService = emailManagementService;
module.exports.default = emailManagementService;