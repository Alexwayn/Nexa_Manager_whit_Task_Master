/**
 * @jest-environment jsdom
 */

import emailAttachmentService from '../../features/email/services/emailAttachmentService';
import { supabase } from '../supabaseClient';
import Logger from '@/utils/Logger';

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'attachment-123', filename: 'test.pdf' },
            error: null,
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({
          data: { path: 'attachments/test.pdf' },
          error: null,
        })),
        download: jest.fn(() => Promise.resolve({
          data: new Blob(['test content'], { type: 'application/pdf' }),
          error: null,
        })),
        remove: jest.fn(() => Promise.resolve({
          error: null,
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/test.pdf' },
        })),
      })),
    },
  },
}));

jest.mock('@/utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

describe('EmailAttachmentService', () => {
  const mockUserId = 'user-123';
  const mockEmailId = 'email-456';
  const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Validation', () => {
    test('should validate file types correctly', () => {
      const validFiles = [
        new File([''], 'document.pdf', { type: 'application/pdf' }),
        new File([''], 'image.jpg', { type: 'image/jpeg' }),
        new File([''], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      ];

      const result = emailAttachmentService.validateFiles(validFiles);
      expect(result.validFiles).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid file types', () => {
      const invalidFiles = [
        new File([''], 'script.exe', { type: 'application/x-msdownload' }),
        new File([''], 'virus.bat', { type: 'application/x-bat' }),
      ];

      const result = emailAttachmentService.validateFiles(invalidFiles);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(26 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 26 * 1024 * 1024 });

      const result = emailAttachmentService.validateFiles([largeFile]);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toContain('File "large.pdf" exceeds maximum size limit of 25MB');
    });

    test('should enforce total attachment limit', () => {
      const files = Array.from({ length: 6 }, (_, i) => 
        new File(['test'], `file${i}.pdf`, { type: 'application/pdf' })
      );

      const result = emailAttachmentService.validateFiles(files);
      expect(result.errors).toContain('Maximum 5 attachments allowed per email');
    });
  });

  describe('File Upload', () => {
    test('should upload attachment successfully', async () => {
      const result = await emailAttachmentService.uploadAttachment(mockUserId, mockEmailId, mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('filename', 'test.pdf');
    });

    test('should handle upload errors gracefully', async () => {
      supabase.storage.from().upload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      const result = await emailAttachmentService.uploadAttachment(mockUserId, mockEmailId, mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });
  });

  describe('File Download', () => {
    test('should download attachment successfully', async () => {
      const result = await emailAttachmentService.downloadAttachment('attachment-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });

    test('should handle download errors', async () => {
      supabase.storage.from().download.mockResolvedValueOnce({
        data: null,
        error: { message: 'File not found' },
      });

      const result = await emailAttachmentService.downloadAttachment('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('Attachment Management', () => {
    test('should get email attachments', async () => {
      const mockAttachments = [
        { id: '1', filename: 'doc1.pdf', file_size: 1024 },
        { id: '2', filename: 'doc2.jpg', file_size: 2048 },
      ];

      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockAttachments,
        error: null,
      });

      const result = await emailAttachmentService.getEmailAttachments(mockEmailId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should delete attachment successfully', async () => {
      const result = await emailAttachmentService.deleteAttachment('attachment-123');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(supabase.storage.from().remove).toHaveBeenCalled();
    });

    test('should get attachment URL', async () => {
      const result = await emailAttachmentService.getAttachmentUrl('attachment-123');

      expect(result.success).toBe(true);
      expect(result.data.url).toBe('https://example.com/test.pdf');
    });
  });

  describe('Batch Operations', () => {
    test('should upload multiple attachments', async () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      const result = await emailAttachmentService.uploadMultipleAttachments(mockUserId, mockEmailId, files);

      expect(result.success).toBe(true);
      expect(result.data.uploaded).toHaveLength(2);
      expect(result.data.failed).toHaveLength(0);
    });

    test('should handle partial upload failures', async () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      // Mock first upload success, second failure
      supabase.storage.from().upload
        .mockResolvedValueOnce({
          data: { path: 'attachments/file1.pdf' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Upload failed' },
        });

      const result = await emailAttachmentService.uploadMultipleAttachments(mockUserId, mockEmailId, files);

      expect(result.success).toBe(true);
      expect(result.data.uploaded).toHaveLength(1);
      expect(result.data.failed).toHaveLength(1);
    });

    test('should delete multiple attachments', async () => {
      const attachmentIds = ['att-1', 'att-2', 'att-3'];

      const result = await emailAttachmentService.deleteMultipleAttachments(attachmentIds);

      expect(result.success).toBe(true);
      expect(result.data.deleted).toHaveLength(3);
    });
  });

  describe('File Processing', () => {
    test('should extract file metadata', async () => {
      const result = await emailAttachmentService.extractFileMetadata(mockFile);

      expect(result).toHaveProperty('filename', 'test.pdf');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type', 'application/pdf');
      expect(result).toHaveProperty('lastModified');
    });

    test('should generate file preview for images', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await emailAttachmentService.generatePreview(imageFile);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('previewUrl');
      expect(result.data).toHaveProperty('thumbnailUrl');
    });

    test('should handle unsupported file types for preview', async () => {
      const result = await emailAttachmentService.generatePreview(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Preview not supported');
    });
  });

  describe('Security', () => {
    test('should scan files for malware', async () => {
      const result = await emailAttachmentService.scanFile(mockFile);

      expect(result).toHaveProperty('safe');
      expect(result).toHaveProperty('threats');
    });

    test('should quarantine suspicious files', async () => {
      const suspiciousFile = new File(['malicious content'], 'virus.exe', { type: 'application/x-msdownload' });

      const result = await emailAttachmentService.scanFile(suspiciousFile);

      expect(result.safe).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });
  });

  describe('Storage Management', () => {
    test('should calculate storage usage', async () => {
      const result = await emailAttachmentService.getStorageUsage(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalSize');
      expect(result.data).toHaveProperty('fileCount');
      expect(result.data).toHaveProperty('quota');
    });

    test('should cleanup orphaned attachments', async () => {
      const result = await emailAttachmentService.cleanupOrphanedAttachments(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('deletedCount');
    });
  });
});
