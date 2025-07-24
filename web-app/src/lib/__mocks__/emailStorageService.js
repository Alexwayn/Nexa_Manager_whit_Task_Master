// Mock for emailStorageService.js
const emailStorageService = {
  initializeTables: jest.fn().mockResolvedValue({ success: true }),
  
  fetchEmails: jest.fn().mockResolvedValue({
    success: true,
    data: [],
    total: 0,
    hasMore: false,
  }),
  
  getEmailById: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'mock-email-id',
      subject: 'Mock Email',
      from: 'test@example.com',
      to: 'user@example.com',
      body: 'Mock email body',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  }),
  
  saveEmail: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'mock-email-id' },
  }),
  
  updateEmail: jest.fn().mockResolvedValue({ success: true }),
  
  deleteEmail: jest.fn().mockResolvedValue({ success: true }),
  
  searchEmails: jest.fn().mockResolvedValue({
    success: true,
    data: [],
    total: 0,
  }),
};

export default emailStorageService;