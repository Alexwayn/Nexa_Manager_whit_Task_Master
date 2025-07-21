import emailManagementService from '../emailManagementService';
import emailStorageService from '../emailStorageService';
import emailProviderService from '../emailProviderService';

// Mock the dependencies
jest.mock('../emailStorageService');
jest.mock('../emailProviderService');
jest.mock('../supabaseClient');

describe('EmailManagementService', () => {
  const mockUserId = 'test-user-123';
  const mockEmailId = 'email-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchEmails', () => {
    it('should fetch emails successfully', async () => {
      const mockEmails = [
        {
          id: 'email-1',
          subject: 'Test Email 1',
          sender: { name: 'John Doe', email: 'john@example.com' },
          isRead: false,
        },
        {
          id: 'email-2',
          subject: 'Test Email 2',
          sender: { name: 'Jane Smith', email: 'jane@example.com' },
          isRead: true,
        },
      ];

      emailStorageService.fetchEmails.mockResolvedValue({
        success: true,
        data: mockEmails,
        total: 2,
        hasMore: false,
      });

      const result = await emailManagementService.fetchEmails(mockUserId, {
        folderId: 'inbox',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmails);
      expect(result.total).toBe(2);
      expect(emailStorageService.fetchEmails).toHaveBeenCalledWith(mockUserId, {
        folderId: 'inbox',
        limit: 10,
      });
    });

    it('should handle fetch emails error', async () => {
      emailStorageService.fetchEmails.mockResolvedValue({
        success: false,
        error: 'Database error',
        data: [],
        total: 0,
        hasMore: false,
      });

      const result = await emailManagementService.fetchEmails(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.data).toEqual([]);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      emailProviderService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      emailStorageService.storeEmail.mockResolvedValue({
        success: true,
        data: {
          id: 'stored-email-123',
          messageId: 'msg-123',
          ...emailData,
        },
      });

      const result = await emailManagementService.sendEmail(mockUserId, emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(emailProviderService.sendEmail).toHaveBeenCalledWith(emailData);
      expect(emailStorageService.storeEmail).toHaveBeenCalled();
    });

    it('should validate email data before sending', async () => {
      const invalidEmailData = {
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        // Missing 'to' field
      };

      const result = await emailManagementService.sendEmail(mockUserId, invalidEmailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email data');
      expect(result.details).toContain('Recipient email is required');
      expect(emailProviderService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark email as read successfully', async () => {
      const mockEmail = {
        id: mockEmailId,
        subject: 'Test Email',
        isRead: true,
      };

      emailStorageService.updateEmail.mockResolvedValue({
        success: true,
        data: mockEmail,
      });

      const result = await emailManagementService.markAsRead(mockEmailId, mockUserId, true);

      expect(result.success).toBe(true);
      expect(result.data.isRead).toBe(true);
      expect(emailStorageService.updateEmail).toHaveBeenCalledWith(mockEmailId, mockUserId, {
        isRead: true,
      });
    });
  });

  describe('starEmail', () => {
    it('should star email successfully', async () => {
      const mockEmail = {
        id: mockEmailId,
        subject: 'Test Email',
        isStarred: true,
      };

      emailStorageService.updateEmail.mockResolvedValue({
        success: true,
        data: mockEmail,
      });

      const result = await emailManagementService.starEmail(mockEmailId, mockUserId, true);

      expect(result.success).toBe(true);
      expect(result.data.isStarred).toBe(true);
      expect(emailStorageService.updateEmail).toHaveBeenCalledWith(mockEmailId, mockUserId, {
        isStarred: true,
      });
    });
  });

  describe('searchEmails', () => {
    it('should search emails successfully', async () => {
      const mockSearchResults = [
        {
          id: 'email-1',
          subject: 'Important Meeting',
          sender: { name: 'Boss', email: 'boss@company.com' },
        },
      ];

      emailStorageService.searchEmails.mockResolvedValue({
        success: true,
        data: mockSearchResults,
        total: 1,
        hasMore: false,
      });

      const result = await emailManagementService.searchEmails(mockUserId, 'meeting', {
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResults);
      expect(result.total).toBe(1);
      expect(emailStorageService.searchEmails).toHaveBeenCalledWith(mockUserId, 'meeting', {
        limit: 10,
      });
    });
  });

  describe('createFolder', () => {
    it('should create folder successfully', async () => {
      const folderData = {
        name: 'Important',
        icon: 'star',
        color: '#ff0000',
      };

      const mockFolder = {
        id: 'folder-123',
        ...folderData,
        unreadCount: 0,
        totalCount: 0,
      };

      emailStorageService.createFolder.mockResolvedValue({
        success: true,
        data: mockFolder,
      });

      const result = await emailManagementService.createFolder(mockUserId, folderData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFolder);
      expect(emailStorageService.createFolder).toHaveBeenCalledWith(mockUserId, folderData);
    });
  });

  describe('applyLabel', () => {
    it('should apply label to email successfully', async () => {
      const mockEmail = {
        id: mockEmailId,
        labels: ['work'],
      };

      const mockUpdatedEmail = {
        id: mockEmailId,
        labels: ['work', 'important'],
      };

      emailStorageService.getEmailById.mockResolvedValue({
        success: true,
        data: mockEmail,
      });

      emailStorageService.updateEmail.mockResolvedValue({
        success: true,
        data: mockUpdatedEmail,
      });

      const result = await emailManagementService.applyLabel(mockEmailId, mockUserId, 'important');

      expect(result.success).toBe(true);
      expect(result.data.labels).toContain('important');
      expect(emailStorageService.updateEmail).toHaveBeenCalledWith(mockEmailId, mockUserId, {
        labels: ['work', 'important'],
      });
    });

    it('should not duplicate existing labels', async () => {
      const mockEmail = {
        id: mockEmailId,
        labels: ['work', 'important'],
      };

      emailStorageService.getEmailById.mockResolvedValue({
        success: true,
        data: mockEmail,
      });

      const result = await emailManagementService.applyLabel(mockEmailId, mockUserId, 'important');

      expect(result.success).toBe(true);
      expect(emailStorageService.updateEmail).not.toHaveBeenCalled();
    });
  });

  describe('validateEmailData', () => {
    it('should validate valid email data', () => {
      const validEmailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      const result = emailManagementService.validateEmailData(validEmailData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidEmailData = {
        subject: 'Test Subject',
        // Missing 'to' and content
      };

      const result = emailManagementService.validateEmailData(invalidEmailData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Recipient email is required');
      expect(result.errors).toContain('Email content is required');
    });

    it('should detect invalid email format', () => {
      const invalidEmailData = {
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      const result = emailManagementService.validateEmailData(invalidEmailData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid recipient email format');
    });
  });
});