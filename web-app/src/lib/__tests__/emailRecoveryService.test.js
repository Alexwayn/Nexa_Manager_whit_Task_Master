/**
 * @jest-environment jsdom
 */

import emailRecoveryService from '../emailRecoveryService';
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
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 'backup-123' }],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
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
          data: { path: 'backup/test.json' },
          error: null,
        })),
        download: jest.fn(() => Promise.resolve({
          data: new Blob(['test data']),
          error: null,
        })),
        remove: jest.fn(() => Promise.resolve({
          error: null,
        })),
        list: jest.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
    },
  },
}));

jest.mock('@utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Mock crypto for backup encryption
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: jest.fn(() => Promise.resolve({})),
      encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
      decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
      exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
      importKey: jest.fn(() => Promise.resolve({})),
    },
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('EmailRecoveryService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Backup', () => {
    test('should create full email backup', async () => {
      const mockEmails = [
        { id: '1', subject: 'Test Email 1', content: 'Content 1' },
        { id: '2', subject: 'Test Email 2', content: 'Content 2' },
      ];

      supabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: mockEmails,
        error: null,
        count: 2,
      });

      const result = await emailRecoveryService.createBackup(mockUserId, {
        includeAttachments: true,
        includeDeleted: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('backupId');
      expect(result.data).toHaveProperty('emailCount', 2);
      expect(supabase.storage.from().upload).toHaveBeenCalled();
    });

    test('should create incremental backup', async () => {
      const lastBackupDate = '2024-01-01T00:00:00Z';
      
      const result = await emailRecoveryService.createIncrementalBackup(mockUserId, {
        since: lastBackupDate,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('backupType', 'incremental');
    });

    test('should create selective backup by folder', async () => {
      const folderIds = ['inbox', 'sent', 'important'];
      
      const result = await emailRecoveryService.createSelectiveBackup(mockUserId, {
        folders: folderIds,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('folders');
    });

    test('should create backup with encryption', async () => {
      const result = await emailRecoveryService.createBackup(mockUserId, {
        encrypt: true,
        password: 'secure-password-123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('encrypted', true);
      expect(crypto.subtle.generateKey).toHaveBeenCalled();
    });

    test('should handle backup size limits', async () => {
      const largeEmailData = Array(1000).fill({
        id: 'large-email',
        content: 'x'.repeat(10000), // Large content
      });

      supabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: largeEmailData,
        error: null,
        count: 1000,
      });

      const result = await emailRecoveryService.createBackup(mockUserId, {
        maxSize: 50 * 1024 * 1024, // 50MB limit
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('chunked', true);
    });
  });

  describe('Email Restore', () => {
    test('should restore emails from backup', async () => {
      const mockBackupData = {
        emails: [
          { id: '1', subject: 'Restored Email 1' },
          { id: '2', subject: 'Restored Email 2' },
        ],
        metadata: {
          version: '1.0',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      supabase.storage.from().download.mockResolvedValueOnce({
        data: new Blob([JSON.stringify(mockBackupData)]),
        error: null,
      });

      const result = await emailRecoveryService.restoreFromBackup(mockUserId, 'backup-123', {
        overwriteExisting: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('restoredCount', 2);
      expect(supabase.from().insert).toHaveBeenCalled();
    });

    test('should restore with conflict resolution', async () => {
      const result = await emailRecoveryService.restoreFromBackup(mockUserId, 'backup-123', {
        conflictResolution: 'merge',
        overwriteExisting: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('conflictsResolved');
    });

    test('should restore selective emails', async () => {
      const emailIds = ['email-1', 'email-3', 'email-5'];
      
      const result = await emailRecoveryService.restoreSelectiveEmails(mockUserId, 'backup-123', {
        emailIds,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('selectedCount', 3);
    });

    test('should restore encrypted backup', async () => {
      const result = await emailRecoveryService.restoreFromBackup(mockUserId, 'backup-123', {
        password: 'secure-password-123',
        encrypted: true,
      });

      expect(result.success).toBe(true);
      expect(crypto.subtle.decrypt).toHaveBeenCalled();
    });

    test('should validate backup integrity before restore', async () => {
      const corruptedBackup = {
        emails: [{ id: '1' }], // Missing required fields
        metadata: { version: '0.5' }, // Incompatible version
      };

      supabase.storage.from().download.mockResolvedValueOnce({
        data: new Blob([JSON.stringify(corruptedBackup)]),
        error: null,
      });

      const result = await emailRecoveryService.restoreFromBackup(mockUserId, 'backup-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup validation failed');
    });
  });

  describe('Deleted Email Recovery', () => {
    test('should recover soft-deleted emails', async () => {
      const mockDeletedEmails = [
        { id: '1', subject: 'Deleted Email 1', deleted_at: '2024-01-01T10:00:00Z' },
        { id: '2', subject: 'Deleted Email 2', deleted_at: '2024-01-01T11:00:00Z' },
      ];

      supabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: mockDeletedEmails,
        error: null,
        count: 2,
      });

      const result = await emailRecoveryService.recoverDeletedEmails(mockUserId, {
        timeRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-02T00:00:00Z',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should recover emails by sender', async () => {
      const result = await emailRecoveryService.recoverDeletedEmails(mockUserId, {
        sender: 'important@company.com',
      });

      expect(result.success).toBe(true);
    });

    test('should recover emails by subject pattern', async () => {
      const result = await emailRecoveryService.recoverDeletedEmails(mockUserId, {
        subjectPattern: 'Invoice*',
      });

      expect(result.success).toBe(true);
    });

    test('should permanently delete expired emails', async () => {
      const result = await emailRecoveryService.permanentlyDeleteExpired(mockUserId, {
        retentionDays: 30,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('deletedCount');
    });
  });

  describe('Backup Management', () => {
    test('should list available backups', async () => {
      const mockBackups = [
        { 
          id: 'backup-1', 
          created_at: '2024-01-01T00:00:00Z',
          size: 1024,
          email_count: 100,
        },
        { 
          id: 'backup-2', 
          created_at: '2024-01-02T00:00:00Z',
          size: 2048,
          email_count: 150,
        },
      ];

      supabase.from().select().eq().order().mockResolvedValueOnce({
        data: mockBackups,
        error: null,
      });

      const result = await emailRecoveryService.listBackups(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('email_count', 100);
    });

    test('should get backup details', async () => {
      const mockBackupDetails = {
        id: 'backup-123',
        metadata: {
          version: '1.0',
          email_count: 250,
          folders: ['inbox', 'sent'],
          size: 5120,
          encrypted: true,
        },
      };

      supabase.from().select().eq().mockResolvedValueOnce({
        data: [mockBackupDetails],
        error: null,
      });

      const result = await emailRecoveryService.getBackupDetails('backup-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('metadata');
      expect(result.data.metadata).toHaveProperty('email_count', 250);
    });

    test('should delete old backups', async () => {
      const result = await emailRecoveryService.deleteBackup(mockUserId, 'backup-123');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
      expect(supabase.storage.from().remove).toHaveBeenCalled();
    });

    test('should cleanup expired backups automatically', async () => {
      const result = await emailRecoveryService.cleanupExpiredBackups(mockUserId, {
        retentionDays: 90,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('deletedBackups');
    });
  });

  describe('Data Export', () => {
    test('should export emails to JSON format', async () => {
      const result = await emailRecoveryService.exportEmails(mockUserId, {
        format: 'json',
        includeAttachments: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('format', 'json');
      expect(result.data).toHaveProperty('downloadUrl');
    });

    test('should export emails to CSV format', async () => {
      const result = await emailRecoveryService.exportEmails(mockUserId, {
        format: 'csv',
        fields: ['subject', 'sender', 'date', 'read_status'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('format', 'csv');
    });

    test('should export emails to EML format', async () => {
      const result = await emailRecoveryService.exportEmails(mockUserId, {
        format: 'eml',
        includeHeaders: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('format', 'eml');
    });

    test('should export with date range filter', async () => {
      const result = await emailRecoveryService.exportEmails(mockUserId, {
        format: 'json',
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31',
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data Import', () => {
    test('should import emails from JSON file', async () => {
      const importData = {
        emails: [
          { subject: 'Imported Email 1', content: 'Content 1' },
          { subject: 'Imported Email 2', content: 'Content 2' },
        ],
      };

      const file = new File([JSON.stringify(importData)], 'emails.json', {
        type: 'application/json',
      });

      const result = await emailRecoveryService.importEmails(mockUserId, file, {
        format: 'json',
        duplicateHandling: 'skip',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('importedCount', 2);
    });

    test('should import emails from EML files', async () => {
      const emlContent = `From: sender@example.com
To: recipient@example.com
Subject: Test Email

This is a test email.`;

      const file = new File([emlContent], 'email.eml', {
        type: 'message/rfc822',
      });

      const result = await emailRecoveryService.importEmails(mockUserId, file, {
        format: 'eml',
      });

      expect(result.success).toBe(true);
    });

    test('should validate import data format', async () => {
      const invalidData = { invalid: 'format' };
      
      const file = new File([JSON.stringify(invalidData)], 'invalid.json', {
        type: 'application/json',
      });

      const result = await emailRecoveryService.importEmails(mockUserId, file, {
        format: 'json',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid import format');
    });

    test('should handle duplicate emails during import', async () => {
      const result = await emailRecoveryService.importEmails(mockUserId, new File([''], 'test.json'), {
        duplicateHandling: 'merge',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('duplicatesHandled');
    });
  });

  describe('Recovery Analytics', () => {
    test('should get recovery statistics', async () => {
      const mockStats = {
        totalBackups: 5,
        totalBackupSize: 10240,
        lastBackupDate: '2024-01-01T00:00:00Z',
        recoveredEmailsCount: 25,
        deletedEmailsCount: 10,
      };

      supabase.from().select().eq().mockResolvedValueOnce({
        data: [mockStats],
        error: null,
      });

      const result = await emailRecoveryService.getRecoveryStats(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalBackups', 5);
    });

    test('should get backup health report', async () => {
      const result = await emailRecoveryService.getBackupHealthReport(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('recommendations');
    });

    test('should track recovery operations', async () => {
      const operation = {
        type: 'restore',
        backupId: 'backup-123',
        emailCount: 50,
        success: true,
      };

      const result = await emailRecoveryService.trackRecoveryOperation(mockUserId, operation);

      expect(result.success).toBe(true);
      expect(supabase.from().insert).toHaveBeenCalled();
    });
  });

  describe('Automated Recovery', () => {
    test('should schedule automatic backups', async () => {
      const schedule = {
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        includeAttachments: true,
      };

      const result = await emailRecoveryService.scheduleAutoBackup(mockUserId, schedule);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('scheduleId');
    });

    test('should update backup schedule', async () => {
      const updates = {
        frequency: 'weekly',
        retentionDays: 60,
      };

      const result = await emailRecoveryService.updateBackupSchedule(mockUserId, 'schedule-123', updates);

      expect(result.success).toBe(true);
    });

    test('should disable automatic backups', async () => {
      const result = await emailRecoveryService.disableAutoBackup(mockUserId, 'schedule-123');

      expect(result.success).toBe(true);
    });

    test('should run scheduled backup', async () => {
      const result = await emailRecoveryService.runScheduledBackup('schedule-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('backupId');
    });
  });

  describe('Error Handling', () => {
    test('should handle storage quota exceeded', async () => {
      supabase.storage.from().upload.mockRejectedValueOnce(new Error('Storage quota exceeded'));

      const result = await emailRecoveryService.createBackup(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage quota exceeded');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle corrupted backup files', async () => {
      supabase.storage.from().download.mockResolvedValueOnce({
        data: new Blob(['corrupted data']),
        error: null,
      });

      const result = await emailRecoveryService.restoreFromBackup(mockUserId, 'backup-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid backup format');
    });

    test('should handle network failures during backup', async () => {
      supabase.from().select.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailRecoveryService.createBackup(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should handle encryption key errors', async () => {
      crypto.subtle.generateKey.mockRejectedValueOnce(new Error('Key generation failed'));

      const result = await emailRecoveryService.createBackup(mockUserId, {
        encrypt: true,
        password: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Encryption failed');
    });
  });

  describe('Performance', () => {
    test('should handle large backup operations efficiently', async () => {
      const largeDataset = Array(10000).fill({
        id: 'email',
        content: 'content',
      });

      supabase.from().select().eq().order().range.mockResolvedValueOnce({
        data: largeDataset,
        error: null,
        count: 10000,
      });

      const result = await emailRecoveryService.createBackup(mockUserId, {
        batchSize: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('batches');
    });

    test('should compress backup data', async () => {
      const result = await emailRecoveryService.createBackup(mockUserId, {
        compress: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('compressed', true);
    });

    test('should resume interrupted operations', async () => {
      const result = await emailRecoveryService.resumeBackup(mockUserId, 'backup-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('resumed', true);
    });
  });
});