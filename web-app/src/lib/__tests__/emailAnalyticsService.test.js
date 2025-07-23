import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import emailAnalyticsService from '@lib/emailAnalyticsService';
import emailErrorHandler from '@lib/emailErrorHandler';
import { supabase } from '@lib/supabaseClient';

// Mock dependencies
vi.mock('@lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@lib/emailErrorHandler', () => ({
  default: {
    withErrorHandling: vi.fn((fn, options) => fn()),
  },
}));

vi.mock('@lib/emailTrackingService', () => ({
  default: {
    getRealTimeAnalytics: vi.fn(() => ({
      success: true,
      data: {
        last24Hours: { opens: 10, clicks: 5 },
        recentActivity: [],
      },
    })),
  },
}));

describe('EmailAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    emailAnalyticsService.reportCache.clear();
  });

  describe('getDashboardAnalytics', () => {
    it('should return comprehensive dashboard analytics', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
        includeRealTime: true,
      };

      const result = await emailAnalyticsService.getDashboardAnalytics(userId, options);

      expect(result).toEqual({
        success: true,
        data: {
          overview: expect.any(Object),
          activity: expect.any(Object),
          clients: expect.any(Object),
          performance: expect.any(Object),
          realTime: expect.any(Object),
          generatedAt: expect.any(String),
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const userId = 'test-user-id';
      
      // Mock error in withErrorHandling
      emailErrorHandler.withErrorHandling.mockImplementationOnce((fn, options) => {
        return options.fallbackValue;
      });

      const result = await emailAnalyticsService.getDashboardAnalytics(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load dashboard analytics');
      expect(result.data).toEqual(emailAnalyticsService.getEmptyDashboardData());
    });
  });

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      // Mock supabase responses
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [
                  { id: 1, folder_id: 'inbox', is_read: false, is_starred: true },
                  { id: 2, folder_id: 'sent', is_read: true, is_starred: false },
                  { id: 3, folder_id: 'drafts', is_read: false, is_starred: false },
                ],
                error: null,
              })),
            })),
          })),
        })),
      });

      const result = await emailAnalyticsService.getEmailStats(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalEmails: 3,
        sentEmails: 1,
        receivedEmails: 1,
        draftEmails: 1,
        unreadEmails: 2,
        starredEmails: 1,
        businessEmails: 0,
        invoiceEmails: 0,
        quoteEmails: 0,
        reminderEmails: 0,
        deliveryRate: 98.5,
        openRate: 24.3,
        clickRate: 3.7,
        responseRate: 12.1,
        growthMetrics: expect.any(Object),
      });
    });
  });

  describe('getActivityMetrics', () => {
    it('should return activity metrics', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      const result = await emailAnalyticsService.getActivityMetrics(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        timeline: expect.any(Array),
        hourlyDistribution: expect.any(Array),
        dailyTrends: expect.any(Array),
        typeBreakdown: expect.any(Array),
      });
    });
  });

  describe('getClientCommunicationMetrics', () => {
    it('should return client communication metrics', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
        limit: 10,
      };

      const result = await emailAnalyticsService.getClientCommunicationMetrics(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        topClients: expect.any(Array),
        responseRates: expect.any(Array),
        communicationHistory: expect.any(Array),
        engagement: expect.any(Object),
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      const result = await emailAnalyticsService.getPerformanceMetrics(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        templates: expect.any(Array),
        responseTimes: expect.any(Object),
        delivery: expect.any(Object),
        engagement: expect.any(Object),
      });
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics', async () => {
      const userId = 'test-user-id';

      const result = await emailAnalyticsService.getRealTimeMetrics(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        last24Hours: expect.objectContaining({
          emailsSent: expect.any(Number),
          emailsReceived: expect.any(Number),
          opens: expect.any(Number),
          clicks: expect.any(Number),
        }),
        lastHour: expect.objectContaining({
          activity: expect.any(Array),
        }),
        queue: expect.any(Object),
        liveEvents: expect.any(Array),
      });
    });
  });

  describe('generateEmailReport', () => {
    it('should generate a comprehensive email report', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
        format: 'json',
        includeCharts: true,
        includeDetails: true,
      };

      const result = await emailAnalyticsService.generateEmailReport(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        metadata: expect.objectContaining({
          userId,
          dateFrom: options.dateFrom,
          dateTo: options.dateTo,
          format: 'json',
          includeCharts: true,
          includeDetails: true,
          generatedAt: expect.any(String),
        }),
        summary: expect.any(Object),
        detailed: expect.any(Object),
        clientAnalysis: expect.any(Object),
        performanceAnalysis: expect.any(Object),
      });
    });

    it('should cache reports', async () => {
      const userId = 'test-user-id';
      const options = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
        format: 'json',
      };

      // First call
      const result1 = await emailAnalyticsService.generateEmailReport(userId, options);
      expect(result1.cached).toBeUndefined();

      // Second call should be cached
      const result2 = await emailAnalyticsService.generateEmailReport(userId, options);
      expect(result2.cached).toBe(true);
    });
  });

  describe('getUsageReports', () => {
    it('should return usage reports', async () => {
      const userId = 'test-user-id';
      const options = {
        period: '30d',
        groupBy: 'day',
      };

      const result = await emailAnalyticsService.getUsageReports(userId, options);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        period: expect.objectContaining({
          from: expect.any(String),
          to: expect.any(String),
          days: 30,
        }),
        usage: expect.any(Array),
        storage: expect.any(Object),
        features: expect.any(Object),
      });
    });
  });

  describe('Helper methods', () => {
    describe('calculatePercentageChange', () => {
      it('should calculate percentage change correctly', () => {
        expect(emailAnalyticsService.calculatePercentageChange(120, 100)).toBe('20.0');
        expect(emailAnalyticsService.calculatePercentageChange(80, 100)).toBe('-20.0');
        expect(emailAnalyticsService.calculatePercentageChange(100, 0)).toBe(100);
        expect(emailAnalyticsService.calculatePercentageChange(0, 0)).toBe(0);
      });
    });

    describe('getDefaultDateFrom', () => {
      it('should return date 30 days ago', () => {
        const result = emailAnalyticsService.getDefaultDateFrom();
        const expected = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        expect(new Date(result).getDate()).toBe(expected.getDate());
      });
    });

    describe('getEmptyDashboardData', () => {
      it('should return empty dashboard data structure', () => {
        const result = emailAnalyticsService.getEmptyDashboardData();
        
        expect(result).toEqual({
          overview: { totalEmails: 0, sentEmails: 0, receivedEmails: 0 },
          activity: { timeline: [], hourlyDistribution: [] },
          clients: { topClients: [], responseRates: [] },
          performance: { templates: [], responseTimes: {} },
          realTime: null,
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const userId = 'test-user-id';
      
      // Mock database error
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: null,
                error: new Error('Database connection failed'),
              })),
            })),
          })),
        })),
      });

      emailErrorHandler.withErrorHandling.mockImplementationOnce((fn, options) => {
        try {
          return fn();
        } catch (error) {
          return options.fallbackValue;
        }
      });

      const result = await emailAnalyticsService.getEmailStats(userId);
      
      expect(result.success).toBe(false);
    });
  });
});