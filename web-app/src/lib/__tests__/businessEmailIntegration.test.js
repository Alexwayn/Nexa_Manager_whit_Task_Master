/**
 * @jest-environment jsdom
 */

import businessEmailIntegration from '../../features/email/services/businessEmailIntegration';
import { InvoiceService } from '../invoiceService.js';
import { QuoteService } from '../quoteService.js';
import businessEmailLogger from '../../features/email/services/businessEmailLogger';

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              invoice_number: 'INV-001',
              quote_number: 'QUO-001',
              client_id: 'client-1',
              clients: {
                id: 'client-1',
                full_name: 'Test Client',
                email: 'test@example.com',
              },
              total_amount: 1000,
              status: 'draft',
            },
            error: null,
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'new-id' },
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'updated-id' },
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

jest.mock('@/utils/Logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('BusinessEmailIntegration', () => {
  const mockUserId = 'user-123';
  const mockClientId = 'client-456';
  const mockInvoiceId = 'invoice-789';
  const mockQuoteId = 'quote-101';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invoice Email Integration', () => {
    test('should send invoice email successfully', async () => {
      const result = await businessEmailIntegration.sendInvoiceEmail(
        mockUserId,
        mockInvoiceId,
        mockEmail,
        {
          templateId: 'invoice',
          customMessage: 'Test message',
          useNewSystem: true,
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('messageId');
    });

    test('should send payment reminder successfully', async () => {
      const result = await businessEmailIntegration.sendPaymentReminder(
        mockUserId,
        mockInvoiceId,
        'gentle',
        {
          customMessage: 'Payment reminder',
        }
      );

      expect(result).toHaveProperty('success');
    });

    test('should handle invoice email errors gracefully', async () => {
      const result = await businessEmailIntegration.sendInvoiceEmail(
        mockUserId,
        'invalid-invoice-id',
        mockEmail
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('Quote Email Integration', () => {
    test('should send quote email successfully', async () => {
      const result = await businessEmailIntegration.sendQuoteEmail(
        mockUserId,
        mockQuoteId,
        mockEmail,
        {
          templateId: 'quote',
          customMessage: 'Test quote message',
          useNewSystem: true,
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('messageId');
    });

    test('should handle quote email errors gracefully', async () => {
      const result = await businessEmailIntegration.sendQuoteEmail(
        mockUserId,
        'invalid-quote-id',
        mockEmail
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('Client Email History', () => {
    test('should get client email history successfully', async () => {
      const result = await businessEmailIntegration.getClientEmailHistory(
        mockUserId,
        mockClientId,
        {
          limit: 10,
          type: ['invoice_sent', 'quote_sent'],
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should handle client email history errors', async () => {
      const result = await businessEmailIntegration.getClientEmailHistory(
        'invalid-user',
        mockClientId
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('Business Email Analytics', () => {
    test('should get business email analytics successfully', async () => {
      const result = await businessEmailIntegration.getBusinessEmailAnalytics(
        mockUserId,
        {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('analytics');
    });

    test('should get business document email analytics', async () => {
      const result = await businessEmailIntegration.getBusinessDocumentEmailAnalytics(
        mockUserId,
        {
          documentType: 'invoice',
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('analytics');
    });

    test('should get client business email filters', async () => {
      const result = await businessEmailIntegration.getClientBusinessEmailFilters(
        mockUserId,
        mockClientId
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('availableTypes');
      expect(result.data).toHaveProperty('dateRange');
    });
  });

  describe('Email Activity Logging', () => {
    test('should log email activity successfully', async () => {
      const result = await businessEmailIntegration.logEmailActivity(
        mockUserId,
        {
          clientId: mockClientId,
          type: 'invoice_sent',
          status: 'sent',
          recipientEmail: mockEmail,
          subject: 'Test Invoice',
          templateType: 'invoice',
        }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Automated Follow-up Sequences', () => {
    test('should send automated follow-up sequence for invoices', async () => {
      const result = await businessEmailIntegration.sendAutomatedFollowUpSequence(
        mockUserId,
        'invoice',
        mockInvoiceId,
        'standard'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('results');
    });

    test('should send automated follow-up sequence for quotes', async () => {
      const result = await businessEmailIntegration.sendAutomatedFollowUpSequence(
        mockUserId,
        'quote',
        mockQuoteId,
        'gentle'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('results');
    });
  });

  describe('Bulk Email Operations', () => {
    test('should send bulk business emails successfully', async () => {
      const emailData = {
        recipients: [
          { email: 'client1@example.com', clientId: 'client-1', subject: 'Update 1' },
          { email: 'client2@example.com', clientId: 'client-2', subject: 'Update 2' },
        ],
        templateId: 'business_update',
        customMessage: 'Important business update',
        emailType: 'business_notification',
      };

      const result = await businessEmailIntegration.bulkSendBusinessEmails(
        mockUserId,
        emailData,
        { batchSize: 5 }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('summary');
    });
  });

  describe('Helper Methods', () => {
    test('should group emails by type correctly', () => {
      const activity = [
        { type: 'invoice_sent' },
        { type: 'invoice_sent' },
        { type: 'quote_sent' },
        { type: 'reminder_gentle' },
      ];

      const grouped = businessEmailIntegration.groupEmailsByType(activity);

      expect(grouped).toEqual({
        invoice_sent: 2,
        quote_sent: 1,
        reminder_gentle: 1,
      });
    });

    test('should group emails by client correctly', () => {
      const activity = [
        { clients: { full_name: 'Client A' } },
        { clients: { full_name: 'Client A' } },
        { clients: { full_name: 'Client B' } },
        { clients: { company_name: 'Company C' } },
      ];

      const grouped = businessEmailIntegration.groupEmailsByClient(activity);

      expect(grouped).toEqual({
        'Client A': 2,
        'Client B': 1,
        'Company C': 1,
      });
    });

    test('should group emails by month correctly', () => {
      const activity = [
        { sent_at: '2024-01-15T10:00:00Z' },
        { sent_at: '2024-01-20T10:00:00Z' },
        { sent_at: '2024-02-10T10:00:00Z' },
      ];

      const grouped = businessEmailIntegration.groupEmailsByMonth(activity);

      expect(grouped).toEqual({
        '2024-01': 2,
        '2024-02': 1,
      });
    });

    test('should get top performing templates', () => {
      const activity = [
        { template_type: 'invoice', status: 'sent' },
        { template_type: 'invoice', status: 'sent' },
        { template_type: 'invoice', status: 'failed' },
        { template_type: 'quote', status: 'sent' },
        { template_type: 'reminder', status: 'failed' },
      ];

      const topTemplates = businessEmailIntegration.getTopPerformingTemplates(activity, 3);

      expect(topTemplates).toHaveLength(3);
      expect(topTemplates[0]).toHaveProperty('template');
      expect(topTemplates[0]).toHaveProperty('successRate');
      expect(topTemplates[0].template).toBe('quote'); // 100% success rate
    });

    test('should calculate client engagement correctly', () => {
      const activity = [
        {
          client_id: 'client-1',
          type: 'invoice_sent',
          sent_at: new Date().toISOString(),
        },
        {
          client_id: 'client-1',
          type: 'reminder_gentle',
          sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          client_id: 'client-2',
          type: 'quote_sent',
          sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const engagement = businessEmailIntegration.calculateClientEngagement(activity);

      expect(engagement).toHaveLength(2);
      expect(engagement[0]).toHaveProperty('clientId');
      expect(engagement[0]).toHaveProperty('engagementScore');
      expect(engagement[0]).toHaveProperty('totalEmails');
      expect(engagement[0]).toHaveProperty('emailTypeCount');
    });

    test('should calculate engagement score correctly', () => {
      const stats = {
        totalEmails: 5,
        lastEmailDate: new Date(),
        emailTypes: new Set(['invoice_sent', 'reminder_gentle']),
      };

      const score = businessEmailIntegration.calculateEngagementScore(stats);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should create batches correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const batches = businessEmailIntegration.createBatches(items, 3);

      expect(batches).toHaveLength(4);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7, 8, 9]);
      expect(batches[3]).toEqual([10]);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing invoice gracefully', async () => {
      const result = await businessEmailIntegration.sendInvoiceEmail(
        mockUserId,
        'non-existent-invoice',
        mockEmail
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    test('should handle missing quote gracefully', async () => {
      const result = await businessEmailIntegration.sendQuoteEmail(
        mockUserId,
        'non-existent-quote',
        mockEmail
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    test('should handle invalid email addresses', async () => {
      const result = await businessEmailIntegration.sendInvoiceEmail(
        mockUserId,
        mockInvoiceId,
        'invalid-email'
      );

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    test('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFrom = businessEmailIntegration.supabase?.from;
      if (businessEmailIntegration.supabase) {
        businessEmailIntegration.supabase.from = jest.fn(() => {
          throw new Error('Database connection failed');
        });
      }

      const result = await businessEmailIntegration.getBusinessEmailAnalytics(mockUserId);

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');

      // Restore original method
      if (businessEmailIntegration.supabase && originalFrom) {
        businessEmailIntegration.supabase.from = originalFrom;
      }
    });
  });
});
