// Mock for email services
const mockEmailService = {
  sendEmail: jest.fn(() => Promise.resolve({ success: true })),
  getEmails: jest.fn(() => Promise.resolve([])),
  deleteEmail: jest.fn(() => Promise.resolve()),
  markAsRead: jest.fn(() => Promise.resolve()),
  markAsUnread: jest.fn(() => Promise.resolve()),
  createDraft: jest.fn(() => Promise.resolve({})),
  saveDraft: jest.fn(() => Promise.resolve()),
  getDrafts: jest.fn(() => Promise.resolve([]))
};

export const getEmailService = jest.fn(() => mockEmailService);
export const emailService = mockEmailService;

// Mock for emailStorageService that matches the expected interface
export const emailStorageService = {
  storeEmail: jest.fn((userId, emailData) => {
    if (!userId) {
      return Promise.resolve({ 
        success: false, 
        error: 'User ID is required' 
      });
    }
    if (!emailData || !emailData.subject || !emailData.sender_email) {
      return Promise.resolve({ 
        success: false, 
        error: 'Invalid email data: missing required fields' 
      });
    }
    return Promise.resolve({ 
      success: true, 
      data: { id: 1, ...emailData, userId } 
    });
  }),
  
  getEmails: jest.fn((userId, options = {}) => {
    if (!userId) {
      return Promise.resolve({ 
        success: false, 
        error: 'User ID is required',
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      });
    }
    return Promise.resolve({
      success: true,
      data: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    });
  }),
  
  getEmailById: jest.fn((userId, emailId) => {
    return Promise.resolve({ 
      success: true, 
      data: { id: emailId, userId } 
    });
  }),
  
  searchEmails: jest.fn((userId, query, options = {}) => {
    return Promise.resolve({
      success: true,
      data: []
    });
  }),
  
  markAsRead: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  markAsUnread: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  starEmail: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  unstarEmail: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  deleteEmail: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  getFolders: jest.fn((userId) => {
    return Promise.resolve({ 
      success: true, 
      data: [] 
    });
  }),
  
  moveToFolder: jest.fn((userId, emailId, folderId) => {
    return Promise.resolve({ success: true });
  }),
  
  updateEmail: jest.fn((userId, emailId, updates) => {
    return Promise.resolve({ success: true });
  }),
  
  bulkUpdateEmails: jest.fn((userId, emailIds, updates) => {
    return Promise.resolve({ success: true });
  }),
  
  permanentlyDeleteEmail: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  restoreEmail: jest.fn((userId, emailId) => {
    return Promise.resolve({ success: true });
  }),
  
  getFolderStats: jest.fn((userId) => {
    return Promise.resolve({ 
      success: true, 
      data: {} 
    });
  }),
  
  cleanupDeletedEmails: jest.fn((userId, daysOld) => {
    return Promise.resolve({ success: true });
  }),
  
  vacuumStorage: jest.fn((userId) => {
    return Promise.resolve({ 
      success: true, 
      data: { cleaned: true } 
    });
  })
};

export const useEmailComposer = jest.fn(() => ({
  isComposing: false,
  startComposing: jest.fn(),
  stopComposing: jest.fn(),
  sendEmail: jest.fn(),
  saveDraft: jest.fn(),
  attachFile: jest.fn(),
  removeAttachment: jest.fn(),
  attachments: []
}));

export const useEmailManager = jest.fn(() => ({
  emails: [],
  loading: false,
  error: null,
  refresh: jest.fn(),
  deleteEmail: jest.fn(),
  markAsRead: jest.fn()
}));

export default getEmailService;
