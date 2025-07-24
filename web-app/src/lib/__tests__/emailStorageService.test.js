/**
 * @jest-environment jsdom
 */

import emailStorageService from '../emailStorageService';
import { supabase } from '../supabaseClient';
import Logger from '@utils/Logger';

// Mock dependencies
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [],
              error: null,
              count: 0,
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'email-123' },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'email-123', is_read: true },
              error: null,
            })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({
        data: [{ id: 'folder-123' }],
        error: null,
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: null,
      error: null,
    })),
  },
}));

jest.mock('@utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

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
    jest.clearAllMocks();
  });

  describe('Email Storage', () => {
    test('should store email successfully', async () => {
      const result = await emailStorageService.storeEmail(mockUserId, mockEmailData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(supabase.from).toHaveBeenCalledWith('emails');
    });

    test('should handle storage errors gracefully', async () => {
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Storage failed' },
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

      supabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: mockEmails,
        error: null,
        count: 2,
      });

      const result = await emailStorageService.getEmails(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toHaveProperty('total', 2);
    });

    test('should fetch single email by ID', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockEmailData,
        error: null,
      });

      const result = await emailStorageService.getEmailById(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', 'email-123');
    });

    test('should handle email not found', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
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

      supabase.from().select().eq().textSearch.mockResolvedValueOnce({
        data: mockSearchResults,
        error: null,
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

      const result = await emailStorageService.searchEmails(mockUserId, 'test', searchOptions);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('emails');
    });

    test('should handle empty search results', async () => {
      supabase.from().select().eq().textSearch.mockResolvedValueOnce({
        data: [],
        error: null,
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
      expect(supabase.from().update).toHaveBeenCalledWith({ is_read: true });
    });

    test('should mark email as unread', async () => {
      const result = await emailStorageService.markAsUnread(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ is_read: false });
    });

    test('should star email', async () => {
      const result = await emailStorageService.starEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ is_starred: true });
    });

    test('should unstar email', async () => {
      const result = await emailStorageService.unstarEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ is_starred: false });
    });

    test('should move email to folder', async () => {
      const result = await emailStorageService.moveToFolder(mockUserId, 'email-123', 'archive');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ folder_id: 'archive' });
    });
  });

  describe('Email Deletion', () => {
    test('should soft delete email', async () => {
      const result = await emailStorageService.deleteEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ 
        is_deleted: true,
        deleted_at: expect.any(String),
      });
    });

    test('should permanently delete email', async () => {
      const result = await emailStorageService.permanentlyDeleteEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should restore deleted email', async () => {
      const result = await emailStorageService.restoreEmail(mockUserId, 'email-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith({ 
        is_deleted: false,
        deleted_at: null,
      });
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
      expect(supabase.from).toHaveBeenCalledWith('email_folders');
    });

    test('should get user folders', async () => {
      const mockFolders = [
        { id: 'inbox', name: 'Inbox', email_count: 10 },
        { id: 'sent', name: 'Sent', email_count: 5 },
      ];

      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockFolders,
        error: null,
      });

      const result = await emailStorageService.getFolders(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should update folder', async () => {
      const updateData = { name: 'Updated Folder', color: '#00ff00' };

      const result = await emailStorageService.updateFolder(mockUserId, 'folder-123', updateData);

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith(updateData);
    });

    test('should delete folder', async () => {
      const result = await emailStorageService.deleteFolder(mockUserId, 'folder-123');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });
  });

  describe('Label Management', () => {
    test('should apply label to email', async () => {
      const result = await emailStorageService.applyLabel(mockUserId, 'email-123', 'important');

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('email_labels');
    });

    test('should remove label from email', async () => {
      const result = await emailStorageService.removeLabel(mockUserId, 'email-123', 'important');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should get email labels', async () => {
      const mockLabels = [
        { id: '1', name: 'Important', color: '#ff0000' },
        { id: '2', name: 'Work', color: '#0000ff' },
      ];

      supabase.from().select().eq().mockResolvedValueOnce({
        data: mockLabels,
        error: null,
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

      const result = await emailStorageService.batchUpdate(mockUserId, emailIds, updateData);

      expect(result.success).toBe(true);
      expect(result.data.updated).toBe(3);
    });

    test('should perform batch delete', async () => {
      const emailIds = ['email-1', 'email-2', 'email-3'];

      const result = await emailStorageService.batchDelete(mockUserId, emailIds);

      expect(result.success).toBe(true);
      expect(result.data.deleted).toBe(3);
    });

    test('should move multiple emails to folder', async () => {
      const emailIds = ['email-1', 'email-2'];
      const folderId = 'archive';

      const result = await emailStorageService.batchMoveToFolder(mockUserId, emailIds, folderId);

      expect(result.success).toBe(true);
      expect(result.data.moved).toBe(2);
    });
  });

  describe('Statistics and Analytics', () => {
    test('should get email statistics', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: {
          total_emails: 100,
          unread_emails: 25,
          starred_emails: 10,
          deleted_emails: 5,
        },
        error: null,
      });

      const result = await emailStorageService.getEmailStats(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('total_emails', 100);
      expect(result.data).toHaveProperty('unread_emails', 25);
    });

    test('should get folder statistics', async () => {
      const result = await emailStorageService.getFolderStats(mockUserId, 'inbox');

      expect(result.success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('get_folder_stats', {
        user_id: mockUserId,
        folder_id: 'inbox',
      });
    });
  });

  describe('Data Cleanup', () => {
    test('should cleanup old deleted emails', async () => {
      const result = await emailStorageService.cleanupDeletedEmails(mockUserId, 30);

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should vacuum email storage', async () => {
      const result = await emailStorageService.vacuumStorage(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('cleaned');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      supabase.from().select.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await emailStorageService.getEmails(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle invalid user ID', async () => {
      const result = await emailStorageService.getEmails(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    test('should handle malformed email data', async () => {
      const malformedData = {
        subject: null,
        sender_email: 'invalid-email',
      };

      const result = await emailStorageService.storeEmail(mockUserId, malformedData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email data');
    });
  });
});