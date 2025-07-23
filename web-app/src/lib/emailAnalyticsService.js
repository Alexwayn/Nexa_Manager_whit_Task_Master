import { supabase } from '@lib/supabaseClient';
import emailTrackingService from '@lib/emailTrackingService';
import emailErrorHandler from '@lib/emailErrorHandler';
import Logger from '@utils/Logger';

/**
 * EmailAnalyticsService - Comprehensive email analytics and reporting
 * Provides detailed insights into email performance, client communication, and business metrics
 */
class EmailAnalyticsService {
  constructor() {
    this.reportCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive email analytics dashboard data
   */
  async getDashboardAnalytics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const {
          dateFrom = this.getDefaultDateFrom(),
          dateTo = new Date().toISOString(),
          includeRealTime = true,
        } = options;

        const [
          emailStats,
          activityMetrics,
          clientMetrics,
          performanceMetrics,
          realTimeData,
        ] = await Promise.all([
          this.getEmailStats(userId, { dateFrom, dateTo }),
          this.getActivityMetrics(userId, { dateFrom, dateTo }),
          this.getClientCommunicationMetrics(userId, { dateFrom, dateTo }),
          this.getPerformanceMetrics(userId, { dateFrom, dateTo }),
          includeRealTime ? this.getRealTimeMetrics(userId) : null,
        ]);

        return {
          success: true,
          data: {
            overview: emailStats.data,
            activity: activityMetrics.data,
            clients: clientMetrics.data,
            performance: performanceMetrics.data,
            realTime: realTimeData?.data || null,
            generatedAt: new Date().toISOString(),
          },
        };
      },
      {
        operation: 'get_dashboard_analytics',
        userId,
        fallbackValue: {
          success: false,
          error: 'Failed to load dashboard analytics',
          data: this.getEmptyDashboardData(),
        },
      }
    );
  }

  /**
   * Get email statistics overview
   */
  async getEmailStats(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const { dateFrom, dateTo } = options;

        // Get email counts from different sources
        const [emailCounts, activityCounts, trackingStats] = await Promise.all([
          this.getEmailCounts(userId, { dateFrom, dateTo }),
          this.getActivityCounts(userId, { dateFrom, dateTo }),
          this.getTrackingStats(userId, { dateFrom, dateTo }),
        ]);

        const stats = {
          totalEmails: emailCounts.total || 0,
          sentEmails: emailCounts.sent || 0,
          receivedEmails: emailCounts.received || 0,
          draftEmails: emailCounts.drafts || 0,
          unreadEmails: emailCounts.unread || 0,
          starredEmails: emailCounts.starred || 0,
          
          // Business email activity
          businessEmails: activityCounts.total || 0,
          invoiceEmails: activityCounts.invoices || 0,
          quoteEmails: activityCounts.quotes || 0,
          reminderEmails: activityCounts.reminders || 0,
          
          // Performance metrics
          deliveryRate: trackingStats.deliveryRate || 0,
          openRate: trackingStats.openRate || 0,
          clickRate: trackingStats.clickRate || 0,
          responseRate: trackingStats.responseRate || 0,
          
          // Growth metrics
          growthMetrics: await this.calculateGrowthMetrics(userId, { dateFrom, dateTo }),
        };

        return { success: true, data: stats };
      },
      {
        operation: 'get_email_stats',
        userId,
        fallbackValue: { success: false, error: 'Failed to get email stats' },
      }
    );
  }

  /**
   * Get email activity metrics
   */
  async getActivityMetrics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const { dateFrom, dateTo } = options;

        // Get activity timeline
        const timeline = await this.getActivityTimeline(userId, { dateFrom, dateTo });
        
        // Get hourly distribution
        const hourlyDistribution = await this.getHourlyDistribution(userId, { dateFrom, dateTo });
        
        // Get daily trends
        const dailyTrends = await this.getDailyTrends(userId, { dateFrom, dateTo });
        
        // Get email types breakdown
        const typeBreakdown = await this.getEmailTypeBreakdown(userId, { dateFrom, dateTo });

        return {
          success: true,
          data: {
            timeline: timeline.data,
            hourlyDistribution: hourlyDistribution.data,
            dailyTrends: dailyTrends.data,
            typeBreakdown: typeBreakdown.data,
          },
        };
      },
      {
        operation: 'get_activity_metrics',
        userId,
        fallbackValue: { success: false, error: 'Failed to get activity metrics' },
      }
    );
  }

  /**
   * Get client communication metrics
   */
  async getClientCommunicationMetrics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const { dateFrom, dateTo, limit = 10 } = options;

        // Get top clients by email volume
        const topClients = await this.getTopClientsByEmailVolume(userId, { dateFrom, dateTo, limit });
        
        // Get client response rates
        const clientResponseRates = await this.getClientResponseRates(userId, { dateFrom, dateTo });
        
        // Get client communication history
        const communicationHistory = await this.getClientCommunicationHistory(userId, { dateFrom, dateTo });
        
        // Get client engagement metrics
        const engagementMetrics = await this.getClientEngagementMetrics(userId, { dateFrom, dateTo });

        return {
          success: true,
          data: {
            topClients: topClients.data,
            responseRates: clientResponseRates.data,
            communicationHistory: communicationHistory.data,
            engagement: engagementMetrics.data,
          },
        };
      },
      {
        operation: 'get_client_communication_metrics',
        userId,
        fallbackValue: { success: false, error: 'Failed to get client communication metrics' },
      }
    );
  }

  /**
   * Get email performance metrics
   */
  async getPerformanceMetrics(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const { dateFrom, dateTo } = options;

        // Get template performance
        const templatePerformance = await this.getTemplatePerformance(userId, { dateFrom, dateTo });
        
        // Get response time metrics
        const responseTimeMetrics = await this.getResponseTimeMetrics(userId, { dateFrom, dateTo });
        
        // Get delivery metrics
        const deliveryMetrics = await this.getDeliveryMetrics(userId, { dateFrom, dateTo });
        
        // Get engagement metrics
        const engagementMetrics = await this.getEngagementMetrics(userId, { dateFrom, dateTo });

        return {
          success: true,
          data: {
            templates: templatePerformance.data,
            responseTimes: responseTimeMetrics.data,
            delivery: deliveryMetrics.data,
            engagement: engagementMetrics.data,
          },
        };
      },
      {
        operation: 'get_performance_metrics',
        userId,
        fallbackValue: { success: false, error: 'Failed to get performance metrics' },
      }
    );
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(userId) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        // Get recent activity
        const recentActivity = await this.getRecentActivity(userId, lastHour.toISOString());
        
        // Get live tracking data
        const liveTracking = await emailTrackingService.getRealTimeAnalytics();
        
        // Get current email queue status
        const queueStatus = await this.getEmailQueueStatus(userId);

        return {
          success: true,
          data: {
            last24Hours: {
              emailsSent: recentActivity.sent || 0,
              emailsReceived: recentActivity.received || 0,
              opens: liveTracking.data?.last24Hours?.opens || 0,
              clicks: liveTracking.data?.last24Hours?.clicks || 0,
            },
            lastHour: {
              activity: recentActivity.hourly || [],
            },
            queue: queueStatus.data,
            liveEvents: liveTracking.data?.recentActivity || [],
          },
        };
      },
      {
        operation: 'get_real_time_metrics',
        userId,
        fallbackValue: { success: false, error: 'Failed to get real-time metrics' },
      }
    );
  }

  /**
   * Generate comprehensive email report
   */
  async generateEmailReport(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const {
          dateFrom = this.getDefaultDateFrom(),
          dateTo = new Date().toISOString(),
          format = 'json',
          includeCharts = true,
          includeDetails = true,
        } = options;

        // Check cache first
        const cacheKey = `report_${userId}_${dateFrom}_${dateTo}_${format}`;
        if (this.reportCache.has(cacheKey)) {
          const cached = this.reportCache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.cacheTimeout) {
            return { success: true, data: cached.data, cached: true };
          }
        }

        // Generate comprehensive report
        const [
          dashboardData,
          detailedMetrics,
          clientAnalysis,
          performanceAnalysis,
        ] = await Promise.all([
          this.getDashboardAnalytics(userId, { dateFrom, dateTo, includeRealTime: false }),
          includeDetails ? this.getDetailedMetrics(userId, { dateFrom, dateTo }) : null,
          this.getClientAnalysis(userId, { dateFrom, dateTo }),
          this.getPerformanceAnalysis(userId, { dateFrom, dateTo }),
        ]);

        const report = {
          metadata: {
            userId,
            dateFrom,
            dateTo,
            generatedAt: new Date().toISOString(),
            format,
            includeCharts,
            includeDetails,
          },
          summary: dashboardData.data,
          detailed: detailedMetrics?.data || null,
          clientAnalysis: clientAnalysis.data,
          performanceAnalysis: performanceAnalysis.data,
        };

        // Cache the report
        this.reportCache.set(cacheKey, {
          data: report,
          timestamp: Date.now(),
        });

        // Convert to requested format
        if (format === 'csv') {
          return this.convertReportToCSV(report);
        } else if (format === 'pdf') {
          return this.convertReportToPDF(report);
        }

        return { success: true, data: report };
      },
      {
        operation: 'generate_email_report',
        userId,
        fallbackValue: { success: false, error: 'Failed to generate email report' },
      }
    );
  }

  /**
   * Get email usage reports
   */
  async getUsageReports(userId, options = {}) {
    return await emailErrorHandler.withErrorHandling(
      async () => {
        const { period = '30d', groupBy = 'day' } = options;

        const periodDays = parseInt(period.replace('d', ''));
        const dateFrom = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
        const dateTo = new Date().toISOString();

        // Get usage data grouped by specified period
        const usageData = await this.getUsageData(userId, { dateFrom, dateTo, groupBy });
        
        // Get storage usage
        const storageUsage = await this.getStorageUsage(userId);
        
        // Get feature usage
        const featureUsage = await this.getFeatureUsage(userId, { dateFrom, dateTo });

        return {
          success: true,
          data: {
            period: {
              from: dateFrom,
              to: dateTo,
              days: periodDays,
            },
            usage: usageData.data,
            storage: storageUsage.data,
            features: featureUsage.data,
          },
        };
      },
      {
        operation: 'get_usage_reports',
        userId,
        fallbackValue: { success: false, error: 'Failed to get usage reports' },
      }
    );
  }

  // Helper methods for data retrieval

  async getEmailCounts(userId, options = {}) {
    const { dateFrom, dateTo } = options;

    let query = supabase
      .from('emails')
      .select('id, folder_id, is_read, is_starred, received_at, sent_at')
      .eq('user_id', userId);

    if (dateFrom) query = query.gte('received_at', dateFrom);
    if (dateTo) query = query.lte('received_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    return {
      total: data.length,
      sent: data.filter(e => e.folder_id === 'sent').length,
      received: data.filter(e => e.folder_id === 'inbox').length,
      drafts: data.filter(e => e.folder_id === 'drafts').length,
      unread: data.filter(e => !e.is_read).length,
      starred: data.filter(e => e.is_starred).length,
    };
  }

  async getActivityCounts(userId, options = {}) {
    const { dateFrom, dateTo } = options;

    let query = supabase
      .from('email_activity')
      .select('id, type, invoice_id, quote_id')
      .eq('user_id', userId);

    if (dateFrom) query = query.gte('sent_at', dateFrom);
    if (dateTo) query = query.lte('sent_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    return {
      total: data.length,
      invoices: data.filter(a => a.invoice_id).length,
      quotes: data.filter(a => a.quote_id).length,
      reminders: data.filter(a => a.type.includes('reminder')).length,
    };
  }

  async getTrackingStats(userId, options = {}) {
    // This would integrate with the tracking service
    // For now, return mock data
    return {
      deliveryRate: 98.5,
      openRate: 24.3,
      clickRate: 3.7,
      responseRate: 12.1,
    };
  }

  async calculateGrowthMetrics(userId, options = {}) {
    // Calculate growth compared to previous period
    const { dateFrom, dateTo } = options;
    const periodLength = new Date(dateTo) - new Date(dateFrom);
    const previousDateFrom = new Date(new Date(dateFrom).getTime() - periodLength).toISOString();
    const previousDateTo = dateFrom;

    const [currentCounts, previousCounts] = await Promise.all([
      this.getEmailCounts(userId, { dateFrom, dateTo }),
      this.getEmailCounts(userId, { dateFrom: previousDateFrom, dateTo: previousDateTo }),
    ]);

    return {
      emailGrowth: this.calculatePercentageChange(currentCounts.total, previousCounts.total),
      sentGrowth: this.calculatePercentageChange(currentCounts.sent, previousCounts.sent),
      receivedGrowth: this.calculatePercentageChange(currentCounts.received, previousCounts.received),
    };
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }

  getDefaultDateFrom() {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  getEmptyDashboardData() {
    return {
      overview: { totalEmails: 0, sentEmails: 0, receivedEmails: 0 },
      activity: { timeline: [], hourlyDistribution: [] },
      clients: { topClients: [], responseRates: [] },
      performance: { templates: [], responseTimes: {} },
      realTime: null,
    };
  }

  // Placeholder methods for detailed implementations
  async getActivityTimeline(userId, options) {
    return { success: true, data: [] };
  }

  async getHourlyDistribution(userId, options) {
    return { success: true, data: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })) };
  }

  async getDailyTrends(userId, options) {
    return { success: true, data: [] };
  }

  async getEmailTypeBreakdown(userId, options) {
    return { success: true, data: [] };
  }

  async getTopClientsByEmailVolume(userId, options) {
    return { success: true, data: [] };
  }

  async getClientResponseRates(userId, options) {
    return { success: true, data: [] };
  }

  async getClientCommunicationHistory(userId, options) {
    return { success: true, data: [] };
  }

  async getClientEngagementMetrics(userId, options) {
    return { success: true, data: {} };
  }

  async getTemplatePerformance(userId, options) {
    return { success: true, data: [] };
  }

  async getResponseTimeMetrics(userId, options) {
    return { success: true, data: {} };
  }

  async getDeliveryMetrics(userId, options) {
    return { success: true, data: {} };
  }

  async getEngagementMetrics(userId, options) {
    return { success: true, data: {} };
  }

  async getRecentActivity(userId, dateFrom) {
    return { sent: 0, received: 0, hourly: [] };
  }

  async getEmailQueueStatus(userId) {
    return { success: true, data: { pending: 0, processing: 0, failed: 0 } };
  }

  async getDetailedMetrics(userId, options) {
    return { success: true, data: {} };
  }

  async getClientAnalysis(userId, options) {
    return { success: true, data: {} };
  }

  async getPerformanceAnalysis(userId, options) {
    return { success: true, data: {} };
  }

  async getUsageData(userId, options) {
    return { success: true, data: [] };
  }

  async getStorageUsage(userId) {
    return { success: true, data: { used: 0, total: 0, percentage: 0 } };
  }

  async getFeatureUsage(userId, options) {
    return { success: true, data: {} };
  }

  convertReportToCSV(report) {
    // Implementation for CSV conversion
    return { success: true, data: 'CSV data', format: 'csv' };
  }

  convertReportToPDF(report) {
    // Implementation for PDF conversion
    return { success: true, data: 'PDF data', format: 'pdf' };
  }
}

export default new EmailAnalyticsService();