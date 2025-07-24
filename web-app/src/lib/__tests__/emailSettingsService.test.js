/**
 * @jest-environment jsdom
 */

import emailSettingsService from '../emailSettingsService';
import { supabase } from '../supabaseClient';
import Logger from '@utils/Logger';

// Mock dependencies
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 'settings-123' }],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null,
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({
        data: [{ id: 'settings-123' }],
        error: null,
      })),
    })),
  },
}));

jest.mock('@utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

describe('EmailSettingsService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('General Settings', () => {
    test('should get user email settings', async () => {
      const mockSettings = {
        id: 'settings-123',
        user_id: mockUserId,
        signature: 'Best regards, John Doe',
        auto_reply_enabled: false,
        read_receipts: true,
        threading_enabled: true,
        preview_pane: 'right',
        emails_per_page: 25,
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.getSettings(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('signature', 'Best regards, John Doe');
      expect(result.data).toHaveProperty('emails_per_page', 25);
    });

    test('should return default settings for new user', async () => {
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const result = await emailSettingsService.getSettings(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('signature', '');
      expect(result.data).toHaveProperty('auto_reply_enabled', false);
      expect(result.data).toHaveProperty('threading_enabled', true);
    });

    test('should update email settings', async () => {
      const updates = {
        signature: 'New signature',
        auto_reply_enabled: true,
        read_receipts: false,
        emails_per_page: 50,
      };

      const result = await emailSettingsService.updateSettings(mockUserId, updates);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          ...updates,
        })
      );
    });

    test('should validate settings before update', async () => {
      const invalidSettings = {
        emails_per_page: -5, // Invalid value
        preview_pane: 'invalid_position',
      };

      const result = await emailSettingsService.updateSettings(mockUserId, invalidSettings);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid settings');
    });

    test('should reset settings to defaults', async () => {
      const result = await emailSettingsService.resetToDefaults(mockUserId);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          signature: '',
          auto_reply_enabled: false,
          threading_enabled: true,
        })
      );
    });
  });

  describe('Signature Management', () => {
    test('should update email signature', async () => {
      const signature = 'John Doe\nSenior Developer\ncompany@example.com';

      const result = await emailSettingsService.updateSignature(mockUserId, signature);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          signature,
        })
      );
    });

    test('should validate signature length', async () => {
      const longSignature = 'x'.repeat(2000); // Too long

      const result = await emailSettingsService.updateSignature(mockUserId, longSignature);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Signature too long');
    });

    test('should sanitize HTML in signature', async () => {
      const htmlSignature = '<p>John Doe</p><script>alert("xss")</script>';

      const result = await emailSettingsService.updateSignature(mockUserId, htmlSignature);

      expect(result.success).toBe(true);
      // Should remove script tags but keep safe HTML
      expect(result.data.signature).toContain('<p>John Doe</p>');
      expect(result.data.signature).not.toContain('<script>');
    });

    test('should support signature templates', async () => {
      const template = {
        name: 'Professional',
        content: '{{name}}\n{{title}}\n{{company}}',
        variables: {
          name: 'John Doe',
          title: 'Senior Developer',
          company: 'Tech Corp',
        },
      };

      const result = await emailSettingsService.applySignatureTemplate(mockUserId, template);

      expect(result.success).toBe(true);
      expect(result.data.signature).toContain('John Doe');
      expect(result.data.signature).toContain('Senior Developer');
    });
  });

  describe('Auto-Reply Settings', () => {
    test('should configure auto-reply', async () => {
      const autoReplyConfig = {
        enabled: true,
        subject: 'Out of Office',
        message: 'I am currently out of office and will return on Monday.',
        start_date: '2024-01-01',
        end_date: '2024-01-07',
        send_to_contacts_only: true,
      };

      const result = await emailSettingsService.configureAutoReply(mockUserId, autoReplyConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          auto_reply_enabled: true,
          auto_reply_config: autoReplyConfig,
        })
      );
    });

    test('should disable auto-reply', async () => {
      const result = await emailSettingsService.disableAutoReply(mockUserId);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          auto_reply_enabled: false,
        })
      );
    });

    test('should validate auto-reply dates', async () => {
      const invalidConfig = {
        enabled: true,
        start_date: '2024-01-07',
        end_date: '2024-01-01', // End before start
      };

      const result = await emailSettingsService.configureAutoReply(mockUserId, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date range');
    });

    test('should check if auto-reply is active', async () => {
      const mockSettings = {
        auto_reply_enabled: true,
        auto_reply_config: {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.isAutoReplyActive(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data.active).toBe(true);
    });
  });

  describe('Notification Settings', () => {
    test('should configure email notifications', async () => {
      const notificationConfig = {
        new_email_notifications: true,
        important_email_notifications: true,
        digest_frequency: 'daily',
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        weekend_notifications: false,
      };

      const result = await emailSettingsService.configureNotifications(mockUserId, notificationConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_settings: notificationConfig,
        })
      );
    });

    test('should validate quiet hours', async () => {
      const invalidConfig = {
        quiet_hours_enabled: true,
        quiet_hours_start: '25:00', // Invalid time
        quiet_hours_end: '08:00',
      };

      const result = await emailSettingsService.configureNotifications(mockUserId, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });

    test('should check if notifications are allowed', async () => {
      const mockSettings = {
        notification_settings: {
          new_email_notifications: true,
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      // Mock current time as 10:00 (outside quiet hours)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);

      const result = await emailSettingsService.shouldSendNotification(mockUserId, 'new_email');

      expect(result.success).toBe(true);
      expect(result.data.allowed).toBe(true);
    });
  });

  describe('Display Settings', () => {
    test('should configure display preferences', async () => {
      const displayConfig = {
        theme: 'dark',
        density: 'compact',
        preview_pane: 'bottom',
        show_avatars: true,
        show_snippets: true,
        emails_per_page: 50,
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
      };

      const result = await emailSettingsService.configureDisplay(mockUserId, displayConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          display_settings: displayConfig,
        })
      );
    });

    test('should validate display settings', async () => {
      const invalidConfig = {
        emails_per_page: 1000, // Too many
        theme: 'invalid_theme',
      };

      const result = await emailSettingsService.configureDisplay(mockUserId, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid display settings');
    });

    test('should get theme preference', async () => {
      const mockSettings = {
        display_settings: {
          theme: 'dark',
        },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.getTheme(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data.theme).toBe('dark');
    });
  });

  describe('Security Settings', () => {
    test('should configure security preferences', async () => {
      const securityConfig = {
        block_external_images: true,
        warn_external_links: true,
        require_encryption: false,
        auto_download_attachments: false,
        scan_attachments: true,
        phishing_protection: true,
      };

      const result = await emailSettingsService.configureSecurity(mockUserId, securityConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          security_settings: securityConfig,
        })
      );
    });

    test('should get security settings', async () => {
      const mockSettings = {
        security_settings: {
          block_external_images: true,
          phishing_protection: true,
        },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.getSecuritySettings(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('block_external_images', true);
    });

    test('should check if external images are blocked', async () => {
      const mockSettings = {
        security_settings: {
          block_external_images: true,
        },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.shouldBlockExternalImages(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data.blocked).toBe(true);
    });
  });

  describe('Folder and Label Settings', () => {
    test('should configure folder preferences', async () => {
      const folderConfig = {
        default_folder: 'inbox',
        auto_archive_days: 30,
        show_folder_counts: true,
        collapse_empty_folders: false,
        custom_folder_order: ['inbox', 'sent', 'drafts', 'archive'],
      };

      const result = await emailSettingsService.configureFolders(mockUserId, folderConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          folder_settings: folderConfig,
        })
      );
    });

    test('should configure label preferences', async () => {
      const labelConfig = {
        show_label_colors: true,
        auto_label_rules: [
          {
            condition: 'sender_contains',
            value: '@company.com',
            label: 'work',
          },
        ],
        label_display_mode: 'icons',
      };

      const result = await emailSettingsService.configureLabels(mockUserId, labelConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          label_settings: labelConfig,
        })
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should configure keyboard shortcuts', async () => {
      const shortcutConfig = {
        enabled: true,
        shortcuts: {
          compose: 'c',
          reply: 'r',
          forward: 'f',
          archive: 'e',
          delete: 'd',
          mark_read: 'i',
          star: 's',
        },
      };

      const result = await emailSettingsService.configureShortcuts(mockUserId, shortcutConfig);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          keyboard_shortcuts: shortcutConfig,
        })
      );
    });

    test('should validate shortcut conflicts', async () => {
      const conflictingConfig = {
        shortcuts: {
          compose: 'c',
          reply: 'c', // Conflict with compose
        },
      };

      const result = await emailSettingsService.configureShortcuts(mockUserId, conflictingConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shortcut conflict');
    });

    test('should reset shortcuts to defaults', async () => {
      const result = await emailSettingsService.resetShortcuts(mockUserId);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          keyboard_shortcuts: expect.objectContaining({
            enabled: true,
            shortcuts: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('Import/Export Settings', () => {
    test('should export user settings', async () => {
      const mockSettings = {
        signature: 'Test signature',
        display_settings: { theme: 'dark' },
        notification_settings: { new_email_notifications: true },
      };

      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const result = await emailSettingsService.exportSettings(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('settings');
      expect(result.data).toHaveProperty('exportDate');
      expect(result.data.settings).toHaveProperty('signature', 'Test signature');
    });

    test('should import user settings', async () => {
      const importData = {
        settings: {
          signature: 'Imported signature',
          display_settings: { theme: 'light' },
          notification_settings: { new_email_notifications: false },
        },
        exportDate: '2024-01-01T00:00:00Z',
      };

      const result = await emailSettingsService.importSettings(mockUserId, importData);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: 'Imported signature',
          display_settings: { theme: 'light' },
        })
      );
    });

    test('should validate import data format', async () => {
      const invalidData = {
        invalid: 'format',
      };

      const result = await emailSettingsService.importSettings(mockUserId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid import format');
    });

    test('should merge settings during import', async () => {
      const importData = {
        settings: {
          signature: 'New signature',
          // Missing other settings
        },
      };

      const result = await emailSettingsService.importSettings(mockUserId, importData, {
        merge: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('merged', true);
    });
  });

  describe('Settings Validation', () => {
    test('should validate email settings schema', () => {
      const validSettings = {
        signature: 'Test',
        auto_reply_enabled: false,
        emails_per_page: 25,
      };

      const result = emailSettingsService.validateSettings(validSettings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid settings', () => {
      const invalidSettings = {
        emails_per_page: 'not_a_number',
        preview_pane: 'invalid_position',
      };

      const result = emailSettingsService.validateSettings(invalidSettings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize user input', () => {
      const unsafeInput = {
        signature: '<script>alert("xss")</script>Safe content',
      };

      const sanitized = emailSettingsService.sanitizeSettings(unsafeInput);

      expect(sanitized.signature).not.toContain('<script>');
      expect(sanitized.signature).toContain('Safe content');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors', async () => {
      supabase.from().select.mockRejectedValueOnce(new Error('Database error'));

      const result = await emailSettingsService.getSettings(mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle invalid user ID', async () => {
      const result = await emailSettingsService.getSettings('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid user ID');
    });

    test('should handle settings update conflicts', async () => {
      supabase.from().upsert.mockRejectedValueOnce(new Error('Conflict error'));

      const result = await emailSettingsService.updateSettings(mockUserId, {
        signature: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conflict error');
    });
  });

  describe('Performance', () => {
    test('should cache frequently accessed settings', async () => {
      // First call
      await emailSettingsService.getSettings(mockUserId);
      
      // Second call should use cache
      const result = await emailSettingsService.getSettings(mockUserId);

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
    });

    test('should invalidate cache on settings update', async () => {
      // Get settings (cached)
      await emailSettingsService.getSettings(mockUserId);
      
      // Update settings (should invalidate cache)
      await emailSettingsService.updateSettings(mockUserId, { signature: 'New' });
      
      // Next get should fetch fresh data
      const result = await emailSettingsService.getSettings(mockUserId);

      expect(result.cached).toBe(false);
    });

    test('should batch multiple setting updates', async () => {
      const updates = [
        { signature: 'New signature' },
        { auto_reply_enabled: true },
        { emails_per_page: 50 },
      ];

      const result = await emailSettingsService.batchUpdateSettings(mockUserId, updates);

      expect(result.success).toBe(true);
      expect(supabase.from().upsert).toHaveBeenCalledTimes(1); // Single batch call
    });
  });
});