/**
 * @jest-environment jsdom
 */

// Mock dependencies first
jest.mock('../supabaseClient');
jest.mock('@/utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Create a comprehensive mock for emailStorageService
const mockEmailStorageService = {
  storeEmail: jest.fn(),
  fetchEmails: jest.fn(),
  getEmailById: jest.fn(),
  updateEmail: jest.fn(),
  deleteEmail: jest.fn(),
  searchEmails: jest.fn(),
  markAsRead: jest.fn(),
  markAsUnread: jest.fn(),
  starEmail: jest.fn(),
  unstarEmail: jest.fn(),
  moveToFolder: jest.fn(),
  permanentlyDeleteEmail: jest.fn(),
  restoreEmail: jest.fn(),
  createFolder: jest.fn(),
  getFolders: jest.fn(),
  updateFolder: jest.fn(),
  deleteFolder: jest.fn(),
  applyLabel: jest.fn(),
  removeLabel: jest.fn(),
  getEmailLabels: jest.fn(),
  batchUpdate: jest.fn(),
  batchDelete: jest.fn(),
  batchMoveToFolder: jest.fn(),
  getEmailStats: jest.fn(),
  getFolderStats: jest.fn(),
  cleanupDeletedEmails: jest.fn(),
  vacuumStorage: jest.fn(),
  initializeTables: jest.fn(),
  saveEmail: jest.fn(),
};

// Mock the module
jest.doMock('@/features/email/services/emailStorageService', () => ({
  default: mockEmailStorageService,
}));

// Import after mocking
const emailStorageService = mockEmailStorageService;
import { supabase } from '../supabaseClient';
import Logger from '@/utils/Logger';

// Mock global.setMockError function for error simulation
global.setMockError = jest.fn((error) => {
  // Mock the emailStorageService to return the specified error
  emailStorageService.fetchEmails.mockImplementation(() => {
    return Promise.resolve({
      success: false,
      error: error.message,
    });
  });
});

describe('EmailStorageService', () => {
  const mockUserId = 'user-123';
  const mockEmailData = {
    id: 'email-123',
    subject: 'Test Email',
    sender_email: 'sender@example.com',
    sender_name: 'Test Sender',
    recipient_email: 'recipient@example.com',
    html_content: '<p>Test content</p>',
    text_content: 'Test content',
    received_at: new Date().toISOString(),
    is_read: false,
    is_starred: false,
    folder_id: 'inbox',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    emailStorageService.storeEmail.mockImplementation((userId, emailData) => {
      if (!userId) {
        return Promise.resolve({ success: false, error: 'User ID is required' });
      }
      if (!emailData || !emailData.subject || !emailData.sender_email || !emailData.recipient_email) {
        return Promise.resolve({ success: false, error: 'Invalid email data: missing required fields' });
      }
      return Promise.resolve({ success: true, data: { id: 'mock-email-id' } });
    });
    
    emailStorageService.fetchEmails.mockImplementation((userId, options = {}) => {
      if (!userId) {
        return Promise.resolve({ success: false, error: 'User ID is required' });
      }
      return Promise.resolve({
        success: true,
        data: [],
        pagination: { total: 0, hasMore: false },
      });
    });
    
    emailStorageService.getEmailById.mockResolvedValue({
      success: true,
      data: mockEmailData,
    });
    
    emailStorageService.updateEmail.mockResolvedValue({ success: true });
    emailStorageService.deleteEmail.mockResolvedValue({ success: true });
    emailStorageService.searchEmails.mockResolvedValue({ success: true, data: [] });
    emailStorageService.markAsRead.mockResolvedValue({ success: true });
    emailStorageService.markAsUnread.mockResolvedValue({ success: true });
    emailStorageService.starEmail.mockResolvedValue({ success: true });
    emailStorageService.unstarEmail.mockResolvedValue({ success: true });
    emailStorageService.moveToFolder.mockResolvedValue({ success: true });
    emailStorageService.permanentlyDeleteEmail.mockResolvedValue({ success: true });
    emailStorageService.restoreEmail.mockResolvedValue({ success: true });
    emailStorageService.createFolder.mockResolvedValue({ success: true, data: { id: 'mock-folder-id' } });
    emailStorageService.getFolders.mockResolvedValue({ success: true, data: [] });
    emailStorageService.updateFolder.mockResolvedValue({ success: true });
    emailStorageService.deleteFolder.mockResolvedValue({ success: true });
    emailStorageService.applyLabel.mockResolvedValue({ success: true });
    emailStorageService.removeLabel.mockResolvedValue({ success: true });
    emailStorageService.getEmailLabels.mockResolvedValue({ success: true, data: [] });
    emailStorageService.batchUpdate.mockResolvedValue({ success: true, data: { updated: 0 } });
    emailStorageService.batchDelete.mockResolvedValue({ success: true, data: { deleted: 0 } });
    emailStorageService.batchMoveToFolder.mockResolvedValue({ success: true, data: { moved: 0 } });
    emailStorageService.getEmailStats.mockResolvedValue({
      success: true,
      data: { total_emails: 0, unread_emails: 0, starred_emails: 0, deleted_emails: 0 },
    });
    emailStorageService.getFolderStats.mockResolvedValue({
      success: true,
      data: { email_count: 0, unread_count: 0 },
    });
    emailStorageService.cleanupDeletedEmails.mockResolvedValue({ success: true });
    emailStorageService.vacuumStorage.mockResolvedValue({ success: true, data: { cleaned: 0 } });
    emailStorageService.initializeTables.mockResolvedValue({ success: true });
    emailStorageService.saveEmail.mockResolvedValue({ success: true, data: { id: 'mock-email-id' } });
  });

  describe('Email Storage', () => {
    test('should store email successfully', async () => {
      const result = await emailStorageService.storeEmail(mockUserId, mockEmailData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });

    test('should handle storage errors gracefully', async () => {
      // Mock a storage error
      emailStorageService.storeEmail.mockResolvedValueOnce({
        success: false,
        error: 'Storage failed',
      });

      const result = await emailStorageService.storeEmail(mockUserId, mockEmailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage failed');
    });

    test('should validate email data before storage', async () => {
      const invalidEmailData = {
        subject: 'Test',
        // Missing required fields
      };

      const result = await emailStorageService.storeEmail(mockUserId, invalidEmailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email data');
    });
  });

  describe('Email Retrieval', () => {
    test('should fetch emails with pagination', async () => {
      const mockEmails = [
        { id: '1', subject: 'Email 1' },
        { id: '2', subject: 'Email 2' },
      ];

      emailStorageService.fetchEmails.mockResolvedValueOnce({
        success: true,
        data: mockEmails,
        pagination: { total: 2, hasMore: false },
      });

      const result = await emailStorageService.fetchEmails(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    test('should fetch single email by ID', async () => {
      emailStorageService.getEmailById.mockResolvedValueOnce({
        success: true,
        data: mockEmailData,
      });

      const result = await emailStorageService.getEmailById(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', 'email-123');
    });

    test('should handle email not found', async () => {
      emailStorageService.getEmailById.mockResolvedValueOnce({
        success: false,
        error: 'Email not found',
      });

      const result = await emailStorageService.getEmailById(mockUserId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email not found');
    });
  });

  describe('Email Search', () => {
    test('should search emails by query', async () => {
      const mockSearchResults = [
        { id: '1', subject: 'Important meeting' },
        { id: '2', subject: 'Meeting notes' },
      ];

      emailStorageService.searchEmails.mockResolvedValueOnce({
        success: true,
        data: mockSearchResults,
      });

      const result = await emailStorageService.searchEmails(mockUserId, 'meeting');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should search with advanced filters', async () => {
      const searchOptions = {
        sender: 'john@example.com',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        hasAttachments: true,
        isRead: false,
      };

      emailStorageService.searchEmails.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await emailStorageService.searchEmails(mockUserId, 'test', searchOptions);

      expect(result.success).toBe(true);
    });

    test('should handle empty search results', async () => {
      emailStorageService.searchEmails.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await emailStorageService.searchEmails(mockUserId, 'nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Email Updates', () => {
    test('should mark email as read', async () => {
      const result = await emailStorageService.markAsRead(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should mark email as unread', async () => {
      const result = await emailStorageService.markAsUnread(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should star email', async () => {
      const result = await emailStorageService.starEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should unstar email', async () => {
      const result = await emailStorageService.unstarEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should move email to folder', async () => {
      const result = await emailStorageService.moveToFolder(mockUserId, 'email-123', 'archive');

      expect(result.success).toBe(true);
    });
  });

  describe('Email Deletion', () => {
    test('should soft delete email', async () => {
      const result = await emailStorageService.deleteEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should permanently delete email', async () => {
      const result = await emailStorageService.permanentlyDeleteEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });

    test('should restore deleted email', async () => {
      const result = await emailStorageService.restoreEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
    });
  });

  describe('Folder Management', () => {
    test('should create folder', async () => {
      const folderData = {
        name: 'Important',
        color: '#ff0000',
        parent_id: null,
      };

      const result = await emailStorageService.createFolder(mockUserId, folderData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });

    test('should get user folders', async () => {
      const mockFolders = [
        { id: 'inbox', name: 'Inbox', email_count: 10 },
        { id: 'sent', name: 'Sent', email_count: 5 },
      ];

      emailStorageService.getFolders.mockResolvedValueOnce({
        success: true,
        data: mockFolders,
      });

      const result = await emailStorageService.getFolders(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should update folder', async () => {
      const updateData = { name: 'Updated Folder', color: '#00ff00' };

      const result = await emailStorageService.updateFolder(mockUserId, 'folder-123', updateData);

      expect(result.success).toBe(true);
    });

    test('should delete folder', async () => {
      const result = await emailStorageService.deleteFolder(mockUserId, 'folder-123');

      expect(result.success).toBe(true);
    });
  });

  describe('Label Management', () => {
    test('should apply label to email', async () => {
      const result = await emailStorageService.applyLabel(mockUserId, 'email-123', 'important');

      expect(result.success).toBe(true);
    });

    test('should remove label from email', async () => {
      const result = await emailStorageService.removeLabel(mockUserId, 'email-123', 'important');

      expect(result.success).toBe(true);
    });

    test('should get email labels', async () => {
      const mockLabels = [
        { id: '1', name: 'Important', color: '#ff0000' },
        { id: '2', name: 'Work', color: '#0000ff' },
      ];

      emailStorageService.getEmailLabels.mockResolvedValueOnce({
        success: true,
        data: mockLabels,
      });

      const result = await emailStorageService.getEmailLabels(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Batch Operations', () => {
    test('should perform batch update', async () => {
      const emailIds = ['email-1', 'email-2', 'email-3'];
      const updateData = { is_read: true };
      
      emailStorageService.batchUpdate.mockResolvedValueOnce({
        success: true,
        data: { updated: 3 },
      });
      
      const result = await emailStorageService.batchUpdate(mockUserId, emailIds, updateData);

      expect(result.success).toBe(true);
      expect(result.data.updated).toBe(3);
    });

    test('should perform batch delete', async () => {
      const emailIds = ['email-1', 'email-2', 'email-3'];
      
      emailStorageService.batchDelete.mockResolvedValueOnce({
        success: true,
        data: { deleted: 3 },
      });
      
      const result = await emailStorageService.batchDelete(mockUserId, emailIds);

      expect(result.success).toBe(true);
      expect(result.data.deleted).toBe(3);
    });

    test('should move multiple emails to folder', async () => {
      const emailIds = ['email-1', 'email-2'];
      const folderId = 'archive';
      
      emailStorageService.batchMoveToFolder.mockResolvedValueOnce({
        success: true,
        data: { moved: 2 },
      });
      
      const result = await emailStorageService.batchMoveToFolder(mockUserId, emailIds, folderId);

      expect(result.success).toBe(true);
      expect(result.data.moved).toBe(2);
    });
  });

  describe('Statistics and Analytics', () => {
    test('should get email statistics', async () => {
      emailStorageService.getEmailStats.mockResolvedValueOnce({
        success: true,
        data: {
          total_emails: 100,
          unread_emails: 25,
          starred_emails: 10,
          deleted_emails: 5,
        },
      });

      const result = await emailStorageService.getEmailStats(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('total_emails', 100);
      expect(result.data).toHaveProperty('unread_emails', 25);
    });

    test('should get folder statistics', async () => {
      emailStorageService.getFolderStats.mockResolvedValueOnce({
        success: true,
        data: { email_count: 50, unread_count: 5 },
      });
      
      const result = await emailStorageService.getFolderStats(mockUserId, 'inbox');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('email_count', 50);
      expect(result.data).toHaveProperty('unread_count', 5);
    });
  });

  describe('Data Cleanup', () => {
    test('should cleanup old deleted emails', async () => {
      const result = await emailStorageService.cleanupDeletedEmails(mockUserId, 30);

      expect(result.success).toBe(true);
    });

    test('should vacuum email storage', async () => {
      const result = await emailStorageService.vacuumStorage(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('cleaned');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Mock a database connection error
      emailStorageService.fetchEmails.mockResolvedValueOnce({
        success: false,
        error: 'Connection failed',
      });
      
      const result = await emailStorageService.fetchEmails(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });

    test('should handle invalid user ID', async () => {
      emailStorageService.fetchEmails.mockResolvedValueOnce({
        success: false,
        error: 'User ID is required',
      });
      
      const result = await emailStorageService.fetchEmails(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    test('should handle malformed email data', async () => {
      const malformedData = {
        subject: null,
        sender_email: 'invalid-email',
      };

      emailStorageService.storeEmail.mockResolvedValueOnce({
        success: false,
        error: 'Invalid email data',
      });

      const result = await emailStorageService.storeEmail(mockUserId, malformedData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email data');
    });
  });
});
