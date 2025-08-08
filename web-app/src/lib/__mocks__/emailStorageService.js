// Mock for emailStorageService.js
const emailStorageService = {
  // Core email operations
  storeEmail: jest.fn().mockImplementation((userId, emailData) => {
    // Simulate validation
    if (!userId) {
      return Promise.resolve({
        success: false,
        error: 'User ID is required',
      });
    }
    
    if (!emailData || !emailData.subject || !emailData.sender_email || !emailData.recipient_email) {
      return Promise.resolve({
        success: false,
        error: 'Invalid email data: missing required fields',
      });
    }
    
    return Promise.resolve({
      success: true,
      data: { id: 'mock-email-id' },
    });
  }),
  fetchEmails: jest.fn().mockImplementation((userId, options = {}) => {
    // Simulate validation
    if (!userId) {
      return Promise.resolve({
        success: false,
        error: 'User ID is required',
      });
    }
    
    return Promise.resolve({
      success: true,
      data: [],
      pagination: { total: 0, hasMore: false },
    });
  }),
  getEmailById: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'mock-email-id',
      subject: 'Mock Email',
      sender_email: 'test@example.com',
      recipient_email: 'user@example.com',
      html_content: 'Mock email body',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  }),
  updateEmail: jest.fn().mockResolvedValue({ success: true }),
  deleteEmail: jest.fn().mockResolvedValue({ success: true }),
  searchEmails: jest.fn().mockResolvedValue({ success: true, data: [] }),
  
  // Email status operations
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
  markAsUnread: jest.fn().mockResolvedValue({ success: true }),
  starEmail: jest.fn().mockResolvedValue({ success: true }),
  unstarEmail: jest.fn().mockResolvedValue({ success: true }),
  moveToFolder: jest.fn().mockResolvedValue({ success: true }),
  
  // Email deletion operations
  permanentlyDeleteEmail: jest.fn().mockResolvedValue({ success: true }),
  restoreEmail: jest.fn().mockResolvedValue({ success: true }),
  
  // Folder operations
  createFolder: jest.fn().mockResolvedValue({ success: true, data: { id: 'mock-folder-id' } }),
  getFolders: jest.fn().mockResolvedValue({ success: true, data: [] }),
  updateFolder: jest.fn().mockResolvedValue({ success: true }),
  deleteFolder: jest.fn().mockResolvedValue({ success: true }),
  
  // Label operations
  applyLabel: jest.fn().mockResolvedValue({ success: true }),
  removeLabel: jest.fn().mockResolvedValue({ success: true }),
  getEmailLabels: jest.fn().mockResolvedValue({ success: true, data: [] }),
  
  // Batch operations
  batchUpdate: jest.fn().mockResolvedValue({ success: true, data: { updated: 0 } }),
  batchDelete: jest.fn().mockResolvedValue({ success: true, data: { deleted: 0 } }),
  batchMoveToFolder: jest.fn().mockResolvedValue({ success: true, data: { moved: 0 } }),
  
  // Statistics and analytics
  getEmailStats: jest.fn().mockResolvedValue({
    success: true,
    data: { total_emails: 0, unread_emails: 0, starred_emails: 0, deleted_emails: 0 },
  }),
  getFolderStats: jest.fn().mockResolvedValue({
    success: true,
    data: { email_count: 0, unread_count: 0 },
  }),
  
  // Data cleanup
  cleanupDeletedEmails: jest.fn().mockResolvedValue({ success: true }),
  vacuumStorage: jest.fn().mockResolvedValue({ success: true, data: { cleaned: 0 } }),
  
  // Legacy methods for backward compatibility
  initializeTables: jest.fn().mockResolvedValue({ success: true }),
  saveEmail: jest.fn().mockResolvedValue({ success: true, data: { id: 'mock-email-id' } }),
};

export default emailStorageService;
