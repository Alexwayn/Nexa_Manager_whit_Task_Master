/**
 * @jest-environment jsdom
 */

import { EmailProviderService } from '../emailProviderService';
const emailProviderService = new EmailProviderService();
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
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 'provider-123' }],
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
      upsert: jest.fn(() => Promise.resolve({
        data: [{ id: 'provider-123' }],
        error: null,
      })),
    })),
  },
}));

jest.mock('@/utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Mock crypto for OAuth and encryption
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
      decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
    },
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('EmailProviderService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Provider Configuration', () => {
    test('should configure Gmail provider', async () => {
      const gmailConfig = {
        provider: 'gmail',
        clientId: 'gmail-client-id',
        clientSecret: 'gmail-client-secret',
        refreshToken: 'gmail-refresh-token',
        accessToken: 'gmail-access-token',
      };

      const result = await emailProviderService.configureProvider(mockUserId, gmailConfig);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('providerId');
      expect(supabase.from().upsert).toHaveBeenCalled();
    });

    test('should configure Outlook provider', async () => {
      const outlookConfig = {
        provider: 'outlook',
        clientId: 'outlook-client-id',
        clientSecret: 'outlook-client-secret',
        tenantId: 'outlook-tenant-id',
        refreshToken: 'outlook-refresh-token',
      };

      const result = await emailProviderService.configureProvider(mockUserId, outlookConfig);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('provider', 'outlook');
    });

    test('should configure IMAP provider', async () => {
      const imapConfig = {
        provider: 'imap',
        host: 'imap.example.com',
        port: 993,
        secure: true,
        username: 'user@example.com',
        password: 'secure-password',
      };

      const result = await emailProviderService.configureProvider(mockUserId, imapConfig);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('provider', 'imap');
    });

    test('should configure SMTP provider', async () => {
      const smtpConfig = {
        provider: 'smtp',
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'user@example.com',
        password: 'secure-password',
      };

      const result = await emailProviderService.configureProvider(mockUserId, smtpConfig);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('provider', 'smtp');
    });

    test('should validate provider configuration', async () => {
      const invalidConfig = {
        provider: 'gmail',
        // Missing required fields
      };

      const result = await emailProviderService.configureProvider(mockUserId, invalidConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required configuration');
    });

    test('should encrypt sensitive credentials', async () => {
      const config = {
        provider: 'gmail',
        clientId: 'test-id',
        clientSecret: 'test-secret',
        refreshToken: 'test-token',
      };

      await emailProviderService.configureProvider(mockUserId, config);

      expect(crypto.subtle.encrypt).toHaveBeenCalled();
    });
  });

  describe('Provider Management', () => {
    test('should list configured providers', async () => {
      const mockProviders = [
        { id: '1', provider: 'gmail', email: 'user@gmail.com', is_active: true },
        { id: '2', provider: 'outlook', email: 'user@outlook.com', is_active: false },
      ];

      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: mockProviders,
        error: null,
      });

      const result = await emailProviderService.getProviders(mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('provider', 'gmail');
    });

    test('should get specific provider configuration', async () => {
      const mockProvider = {
        id: 'provider-123',
        provider: 'gmail',
        email: 'user@gmail.com',
        configuration: { encrypted: 'data' },
      };

      supabase.from().select().eq().mockResolvedValueOnce({
        data: [mockProvider],
        error: null,
      });

      const result = await emailProviderService.getProvider(mockUserId, 'provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('provider', 'gmail');
    });

    test('should update provider configuration', async () => {
      const updates = {
        email: 'newemail@gmail.com',
        is_active: false,
      };

      const result = await emailProviderService.updateProvider(mockUserId, 'provider-123', updates);

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalled();
    });

    test('should delete provider configuration', async () => {
      const result = await emailProviderService.deleteProvider(mockUserId, 'provider-123');

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should set default provider', async () => {
      const result = await emailProviderService.setDefaultProvider(mockUserId, 'provider-123');

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledTimes(2); // Unset old default, set new default
    });
  });

  describe('OAuth Authentication', () => {
    test('should initiate Gmail OAuth flow', async () => {
      const result = await emailProviderService.initiateOAuth('gmail', {
        clientId: 'gmail-client-id',
        redirectUri: 'http://localhost:3000/callback',
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('authUrl');
      expect(result.data.authUrl).toContain('accounts.google.com');
    });

    test('should initiate Outlook OAuth flow', async () => {
      const result = await emailProviderService.initiateOAuth('outlook', {
        clientId: 'outlook-client-id',
        redirectUri: 'http://localhost:3000/callback',
        scopes: ['https://graph.microsoft.com/mail.read'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('authUrl');
      expect(result.data.authUrl).toContain('login.microsoftonline.com');
    });

    test('should handle OAuth callback', async () => {
      const mockTokenResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await emailProviderService.handleOAuthCallback('gmail', {
        code: 'auth-code',
        state: 'state-token',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3000/callback',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    test('should refresh OAuth tokens', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      });

      const result = await emailProviderService.refreshOAuthToken('gmail', {
        refreshToken: 'refresh-token',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken', 'new-access-token');
    });

    test('should revoke OAuth tokens', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await emailProviderService.revokeOAuthToken('gmail', 'access-token');

      expect(result.success).toBe(true);
    });
  });

  describe('Provider Testing', () => {
    test('should test Gmail connection', async () => {
      const mockUserInfo = {
        email: 'user@gmail.com',
        name: 'Test User',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await emailProviderService.testConnection('gmail', {
        accessToken: 'access-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('email', 'user@gmail.com');
    });

    test('should test Outlook connection', async () => {
      const mockUserInfo = {
        mail: 'user@outlook.com',
        displayName: 'Test User',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await emailProviderService.testConnection('outlook', {
        accessToken: 'access-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('email', 'user@outlook.com');
    });

    test('should test IMAP connection', async () => {
      // Mock IMAP connection test
      const result = await emailProviderService.testConnection('imap', {
        host: 'imap.example.com',
        port: 993,
        secure: true,
        username: 'user@example.com',
        password: 'password',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('connected', true);
    });

    test('should test SMTP connection', async () => {
      // Mock SMTP connection test
      const result = await emailProviderService.testConnection('smtp', {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'user@example.com',
        password: 'password',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('connected', true);
    });

    test('should handle connection failures', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await emailProviderService.testConnection('gmail', {
        accessToken: 'invalid-token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('Provider Capabilities', () => {
    test('should get Gmail capabilities', () => {
      const capabilities = emailProviderService.getProviderCapabilities('gmail');

      expect(capabilities).toHaveProperty('canSend', true);
      expect(capabilities).toHaveProperty('canReceive', true);
      expect(capabilities).toHaveProperty('supportsLabels', true);
      expect(capabilities).toHaveProperty('supportsThreads', true);
    });

    test('should get Outlook capabilities', () => {
      const capabilities = emailProviderService.getProviderCapabilities('outlook');

      expect(capabilities).toHaveProperty('canSend', true);
      expect(capabilities).toHaveProperty('canReceive', true);
      expect(capabilities).toHaveProperty('supportsFolders', true);
      expect(capabilities).toHaveProperty('supportsCategories', true);
    });

    test('should get IMAP capabilities', () => {
      const capabilities = emailProviderService.getProviderCapabilities('imap');

      expect(capabilities).toHaveProperty('canSend', false);
      expect(capabilities).toHaveProperty('canReceive', true);
      expect(capabilities).toHaveProperty('supportsFolders', true);
    });

    test('should get SMTP capabilities', () => {
      const capabilities = emailProviderService.getProviderCapabilities('smtp');

      expect(capabilities).toHaveProperty('canSend', true);
      expect(capabilities).toHaveProperty('canReceive', false);
    });

    test('should check if provider supports feature', () => {
      const supportsLabels = emailProviderService.supportsFeature('gmail', 'labels');
      const supportsThreads = emailProviderService.supportsFeature('imap', 'threads');

      expect(supportsLabels).toBe(true);
      expect(supportsThreads).toBe(false);
    });
  });

  describe('Provider Synchronization', () => {
    test('should sync Gmail emails', async () => {
      const mockEmails = [
        { id: '1', subject: 'Email 1', threadId: 'thread-1' },
        { id: '2', subject: 'Email 2', threadId: 'thread-2' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: mockEmails }),
      });

      const result = await emailProviderService.syncEmails(mockUserId, 'provider-123', {
        provider: 'gmail',
        lastSyncToken: 'sync-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('syncedCount', 2);
    });

    test('should sync Outlook emails', async () => {
      const mockEmails = [
        { id: '1', subject: 'Email 1', conversationId: 'conv-1' },
        { id: '2', subject: 'Email 2', conversationId: 'conv-2' },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ value: mockEmails }),
      });

      const result = await emailProviderService.syncEmails(mockUserId, 'provider-123', {
        provider: 'outlook',
        deltaToken: 'delta-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('syncedCount', 2);
    });

    test('should handle incremental sync', async () => {
      const result = await emailProviderService.syncEmails(mockUserId, 'provider-123', {
        provider: 'gmail',
        incremental: true,
        lastSyncTime: '2024-01-01T00:00:00Z',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('incremental', true);
    });

    test('should handle sync conflicts', async () => {
      const result = await emailProviderService.syncEmails(mockUserId, 'provider-123', {
        provider: 'gmail',
        conflictResolution: 'server-wins',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('conflictsResolved');
    });
  });

  describe('Provider Webhooks', () => {
    test('should register Gmail webhook', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ historyId: '12345' }),
      });

      const result = await emailProviderService.registerWebhook('gmail', {
        topicName: 'projects/test/topics/gmail',
        accessToken: 'access-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('historyId');
    });

    test('should register Outlook webhook', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'subscription-id' }),
      });

      const result = await emailProviderService.registerWebhook('outlook', {
        notificationUrl: 'https://app.example.com/webhooks/outlook',
        accessToken: 'access-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('subscriptionId');
    });

    test('should handle webhook notifications', async () => {
      const notification = {
        provider: 'gmail',
        historyId: '12345',
        emailAddress: 'user@gmail.com',
      };

      const result = await emailProviderService.handleWebhookNotification(notification);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('processed', true);
    });

    test('should unregister webhook', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await emailProviderService.unregisterWebhook('gmail', {
        subscriptionId: 'subscription-id',
        accessToken: 'access-token',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Provider Analytics', () => {
    test('should get provider statistics', async () => {
      const mockStats = {
        totalEmails: 1000,
        syncedToday: 25,
        lastSyncTime: '2024-01-01T10:00:00Z',
        errorCount: 2,
        successRate: 98.5,
      };

      supabase.from().select().eq().mockResolvedValueOnce({
        data: [mockStats],
        error: null,
      });

      const result = await emailProviderService.getProviderStats(mockUserId, 'provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalEmails', 1000);
      expect(result.data).toHaveProperty('successRate', 98.5);
    });

    test('should get sync history', async () => {
      const mockHistory = [
        { id: '1', synced_at: '2024-01-01T10:00:00Z', emails_count: 10, status: 'success' },
        { id: '2', synced_at: '2024-01-01T09:00:00Z', emails_count: 15, status: 'success' },
      ];

      supabase.from().select().eq().order().mockResolvedValueOnce({
        data: mockHistory,
        error: null,
      });

      const result = await emailProviderService.getSyncHistory(mockUserId, 'provider-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('should track provider usage', async () => {
      const usage = {
        operation: 'sync',
        emailCount: 50,
        duration: 5000,
        success: true,
      };

      const result = await emailProviderService.trackProviderUsage(mockUserId, 'provider-123', usage);

      expect(result.success).toBe(true);
      expect(supabase.from().insert).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle OAuth token expiration', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'invalid_token' }),
      });

      const result = await emailProviderService.testConnection('gmail', {
        accessToken: 'expired-token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token expired');
    });

    test('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
      });

      const result = await emailProviderService.syncEmails(mockUserId, 'provider-123', {
        provider: 'gmail',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limited');
      expect(result.retryAfter).toBe(60);
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailProviderService.testConnection('gmail', {
        accessToken: 'access-token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(Logger.error).toHaveBeenCalled();
    });

    test('should handle invalid provider configuration', async () => {
      const result = await emailProviderService.configureProvider(mockUserId, {
        provider: 'invalid-provider',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported provider');
    });
  });

  describe('Security', () => {
    test('should validate OAuth state parameter', async () => {
      const result = await emailProviderService.handleOAuthCallback('gmail', {
        code: 'auth-code',
        state: 'invalid-state',
        expectedState: 'valid-state',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid state parameter');
    });

    test('should encrypt stored credentials', async () => {
      const config = {
        provider: 'imap',
        password: 'sensitive-password',
      };

      await emailProviderService.configureProvider(mockUserId, config);

      expect(crypto.subtle.encrypt).toHaveBeenCalled();
    });

    test('should validate webhook signatures', async () => {
      const notification = {
        provider: 'outlook',
        data: { test: 'data' },
        signature: 'invalid-signature',
      };

      const result = await emailProviderService.handleWebhookNotification(notification);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid webhook signature');
    });

    test('should sanitize provider configurations', async () => {
      const config = {
        provider: 'gmail',
        clientId: '<script>alert("xss")</script>',
      };

      const result = await emailProviderService.configureProvider(mockUserId, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid configuration format');
    });
  });
});
