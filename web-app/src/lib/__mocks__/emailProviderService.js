// Mock for emailProviderService.js
const emailProviderService = {
  sendEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-message-id',
    provider: 'mock',
  }),
  
  getActiveProvider: jest.fn().mockReturnValue('mock'),
  
  validateEmail: jest.fn().mockReturnValue(true),
  
  getProviderStatus: jest.fn().mockResolvedValue({
    status: 'active',
    provider: 'mock',
    capabilities: ['send', 'track'],
  }),
  
  getEmailHistory: jest.fn().mockResolvedValue([]),
  
  getEmailStats: jest.fn().mockResolvedValue({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  }),
};

export default emailProviderService;
