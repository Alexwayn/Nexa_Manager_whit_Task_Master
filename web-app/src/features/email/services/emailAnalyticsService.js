import { supabase } from '@lib/supabaseClient';
import emailTrackingService from '@features/email/services/emailTrackingService';
import emailErrorHandler from '@features/email/services/emailErrorHandler';
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
        const { dateFrom, dateTo, timeframe = 'daily' } = options;

        let query = supabase
          .from('email_activity_timeline')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (dateFrom && dateTo) {
          query = query
            .gte('created_at', dateFrom)
            .lte('created_at', dateTo);
        }

        const { data: activities, error } = await query;
        
        if (error) throw error;

        // Process timeline data
         const timeline = this.processTimelineData(activities, timeframe);
         
         // Get hourly distribution
         const hourlyDistribution = this.getHourlyDistribution(activities);
         
         // Get daily trends
         const dailyTrends = this.getDailyTrends(activities);
         
         // Get type breakdown
         const typeBreakdown = this.getTypeBreakdown(activities);

        return {
          success: true,
          data: {
            timeline,
            hourlyDistribution,
            dailyTrends,
            typeBreakdown,
            totalActivities: activities.length
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

        let query = supabase
          .from('client_communication_analytics')
          .select('*')
          .eq('user_id', userId)
          .order('total_emails', { ascending: false });

        if (dateFrom && dateTo) {
          query = query
            .gte('last_communication', dateFrom)
            .lte('last_communication', dateTo);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data: clientMetrics, error } = await query;
        
        if (error) throw error;

        // Get top clients by email volume
        const topClients = clientMetrics.map(client => ({
          clientId: client.client_id,
          clientName: client.client_name,
          emailCount: client.total_emails,
          lastContact: client.last_communication,
          responseRate: client.response_rate,
          avgResponseTime: client.avg_response_time_hours
        }));

        // Calculate overall response rates
        const totalEmails = clientMetrics.reduce((sum, c) => sum + c.total_emails, 0);
        const totalResponses = clientMetrics.reduce((sum, c) => sum + (c.total_emails * c.response_rate / 100), 0);
        const overallResponseRate = totalEmails > 0 ? (totalResponses / totalEmails * 100).toFixed(1) : 0;
        
        // Get client communication history
        const communicationHistory = await this.getClientCommunicationHistory(userId, { dateFrom, dateTo });
        
        // Get client engagement metrics
        const engagementMetrics = await this.getClientEngagementMetrics(userId, { dateFrom, dateTo });

        return {
          success: true,
          data: {
            topClients,
            responseRates: {
              overall: overallResponseRate,
              average: clientMetrics.length > 0 ? 
                (clientMetrics.reduce((sum, c) => sum + c.response_rate, 0) / clientMetrics.length).toFixed(1) : 0
            },
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
    try {
      const { dateFrom, dateTo } = options;
      
      let query = supabase
        .from('emails')
        .select('id, is_read, is_starred, is_draft, sent_at, received_at')
        .eq('user_id', userId);

      if (dateFrom && dateTo) {
        query = query
          .gte('received_at', dateFrom)
          .lte('received_at', dateTo);
      }

      const { data: emails, error } = await query;
      
      if (error) throw error;

      const counts = {
        total: emails.length,
        sent: emails.filter(e => e.sent_at).length,
        received: emails.filter(e => e.received_at && !e.sent_at).length,
        drafts: emails.filter(e => e.is_draft).length,
        unread: emails.filter(e => !e.is_read).length,
        starred: emails.filter(e => e.is_starred).length,
      };

      return counts;
    } catch (error) {
      Logger.error('Failed to get email counts:', error);
      return {
        total: 0, sent: 0, received: 0, drafts: 0, unread: 0, starred: 0
      };
    }
  }

  async getActivityCounts(userId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      let query = supabase
        .from('email_activity_timeline')
        .select('activity_type, activity_data')
        .eq('user_id', userId);

      if (dateFrom && dateTo) {
        query = query
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo);
      }

      const { data: activities, error } = await query;
      
      if (error) throw error;

      const counts = {
        total: activities.length,
        invoices: activities.filter(a => 
          a.activity_data?.template_category === 'invoice' || 
          a.activity_data?.document_type === 'invoice'
        ).length,
        quotes: activities.filter(a => 
          a.activity_data?.template_category === 'quote' || 
          a.activity_data?.document_type === 'quote'
        ).length,
        reminders: activities.filter(a => 
          a.activity_data?.template_category === 'reminder'
        ).length,
        general: activities.filter(a => 
          !a.activity_data?.template_category || 
          a.activity_data?.template_category === 'general'
        ).length,
      };

      return counts;
    } catch (error) {
      Logger.error('Failed to get activity counts:', error);
      return {
        total: 0, invoices: 0, quotes: 0, reminders: 0, general: 0
      };
    }
  }

  async getTrackingStats(userId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      let query = supabase
        .from('email_performance_metrics')
        .select('*')
        .eq('user_id', userId);

      if (dateFrom && dateTo) {
        query = query
          .gte('sent_at', dateFrom)
          .lte('sent_at', dateTo);
      }

      const { data: metrics, error } = await query;
      
      if (error) throw error;

      if (metrics.length === 0) {
        return { deliveryRate: 0, openRate: 0, clickRate: 0, responseRate: 0 };
      }

      const totalSent = metrics.length;
      const delivered = metrics.filter(m => m.is_delivered).length;
      const opened = metrics.filter(m => m.is_opened).length;
      const clicked = metrics.filter(m => m.is_clicked).length;
      const replied = metrics.filter(m => m.is_replied).length;

      return {
        deliveryRate: totalSent > 0 ? (delivered / totalSent * 100).toFixed(1) : 0,
        openRate: delivered > 0 ? (opened / delivered * 100).toFixed(1) : 0,
        clickRate: opened > 0 ? (clicked / opened * 100).toFixed(1) : 0,
        responseRate: delivered > 0 ? (replied / delivered * 100).toFixed(1) : 0,
      };
    } catch (error) {
      Logger.error('Failed to get tracking stats:', error);
      return { deliveryRate: 0, openRate: 0, clickRate: 0, responseRate: 0 };
    }
  }

  async calculateGrowthMetrics(userId, options = {}) {
    try {
      const { dateFrom, dateTo } = options;
      
      // Calculate previous period for comparison
      const currentPeriod = new Date(dateTo) - new Date(dateFrom);
      const previousDateTo = new Date(dateFrom);
      const previousDateFrom = new Date(previousDateTo.getTime() - currentPeriod);

      const [currentStats, previousStats] = await Promise.all([
        this.getEmailCounts(userId, { dateFrom, dateTo }),
        this.getEmailCounts(userId, { 
          dateFrom: previousDateFrom.toISOString(), 
          dateTo: previousDateTo.toISOString() 
        })
      ]);

      const [currentTracking, previousTracking] = await Promise.all([
        this.getTrackingStats(userId, { dateFrom, dateTo }),
        this.getTrackingStats(userId, { 
          dateFrom: previousDateFrom.toISOString(), 
          dateTo: previousDateTo.toISOString() 
        })
      ]);

      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
      };

      return {
        emailGrowth: calculateGrowth(currentStats.total, previousStats.total),
        responseGrowth: calculateGrowth(
          parseFloat(currentTracking.responseRate), 
          parseFloat(previousTracking.responseRate)
        ),
        engagementGrowth: calculateGrowth(
          parseFloat(currentTracking.openRate), 
          parseFloat(previousTracking.openRate)
        ),
      };
    } catch (error) {
      Logger.error('Failed to calculate growth metrics:', error);
      return { emailGrowth: 0, responseGrowth: 0, engagementGrowth: 0 };
    }
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

  // Helper methods for performance metrics
   async getTemplatePerformance(userId, options = {}) {
     try {
       const { dateFrom, dateTo } = options;
       
       let query = supabase
         .from('email_performance_metrics')
         .select(`
           template_id,
           template_name,
           is_delivered,
           is_opened,
           is_clicked,
           is_replied,
           sent_at
         `)
         .eq('user_id', userId)
         .not('template_id', 'is', null);

       if (dateFrom && dateTo) {
         query = query
           .gte('sent_at', dateFrom)
           .lte('sent_at', dateTo);
       }

       const { data: metrics, error } = await query;
       
       if (error) throw error;

       // Group by template
       const templateStats = {};
       metrics.forEach(metric => {
         const templateId = metric.template_id;
         if (!templateStats[templateId]) {
           templateStats[templateId] = {
             templateId,
             templateName: metric.template_name,
             totalSent: 0,
             delivered: 0,
             opened: 0,
             clicked: 0,
             replied: 0
           };
         }
         
         const stats = templateStats[templateId];
         stats.totalSent++;
         if (metric.is_delivered) stats.delivered++;
         if (metric.is_opened) stats.opened++;
         if (metric.is_clicked) stats.clicked++;
         if (metric.is_replied) stats.replied++;
       });

       // Calculate rates
       return Object.values(templateStats).map(stats => ({
         ...stats,
         deliveryRate: stats.totalSent > 0 ? (stats.delivered / stats.totalSent * 100).toFixed(1) : 0,
         openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(1) : 0,
         clickRate: stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(1) : 0,
         responseRate: stats.delivered > 0 ? (stats.replied / stats.delivered * 100).toFixed(1) : 0
       })).sort((a, b) => b.totalSent - a.totalSent);
     } catch (error) {
       Logger.error('Failed to get template performance:', error);
       return [];
     }
   }

   async getResponseTimeMetrics(userId, options = {}) {
     try {
       const { dateFrom, dateTo } = options;
       
       let query = supabase
         .from('email_performance_metrics')
         .select('response_time_hours')
         .eq('user_id', userId)
         .not('response_time_hours', 'is', null);

       if (dateFrom && dateTo) {
         query = query
           .gte('sent_at', dateFrom)
           .lte('sent_at', dateTo);
       }

       const { data: metrics, error } = await query;
       
       if (error) throw error;

       if (metrics.length === 0) {
         return { average: 0, median: 0, distribution: [] };
       }

       const responseTimes = metrics.map(m => m.response_time_hours).sort((a, b) => a - b);
       const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
       const median = responseTimes[Math.floor(responseTimes.length / 2)];

       // Create distribution buckets
       const distribution = [
         { range: '0-1h', count: responseTimes.filter(t => t <= 1).length },
         { range: '1-4h', count: responseTimes.filter(t => t > 1 && t <= 4).length },
         { range: '4-24h', count: responseTimes.filter(t => t > 4 && t <= 24).length },
         { range: '1-3d', count: responseTimes.filter(t => t > 24 && t <= 72).length },
         { range: '3d+', count: responseTimes.filter(t => t > 72).length }
       ];

       return {
         average: average.toFixed(1),
         median: median.toFixed(1),
         distribution
       };
     } catch (error) {
       Logger.error('Failed to get response time metrics:', error);
       return { average: 0, median: 0, distribution: [] };
     }
   }

   async getDeliveryMetrics(userId, options = {}) {
     try {
       const { dateFrom, dateTo } = options;
       
       let query = supabase
         .from('email_performance_metrics')
         .select('is_delivered, is_bounced, is_spam')
         .eq('user_id', userId);

       if (dateFrom && dateTo) {
         query = query
           .gte('sent_at', dateFrom)
           .lte('sent_at', dateTo);
       }

       const { data: metrics, error } = await query;
       
       if (error) throw error;

       if (metrics.length === 0) {
         return { rate: 0, bounceRate: 0, spamRate: 0 };
       }

       const total = metrics.length;
       const delivered = metrics.filter(m => m.is_delivered).length;
       const bounced = metrics.filter(m => m.is_bounced).length;
       const spam = metrics.filter(m => m.is_spam).length;

       return {
         rate: (delivered / total * 100).toFixed(1),
         bounceRate: (bounced / total * 100).toFixed(1),
         spamRate: (spam / total * 100).toFixed(1)
       };
     } catch (error) {
       Logger.error('Failed to get delivery metrics:', error);
       return { rate: 0, bounceRate: 0, spamRate: 0 };
     }
   }

   async getEngagementMetrics(userId, options = {}) {
     try {
       const { dateFrom, dateTo } = options;
       
       let query = supabase
         .from('email_performance_metrics')
         .select('is_delivered, is_opened, is_clicked, is_replied')
         .eq('user_id', userId);

       if (dateFrom && dateTo) {
         query = query
           .gte('sent_at', dateFrom)
           .lte('sent_at', dateTo);
       }

       const { data: metrics, error } = await query;
       
       if (error) throw error;

       if (metrics.length === 0) {
         return { openRate: 0, clickRate: 0, replyRate: 0 };
       }

       const delivered = metrics.filter(m => m.is_delivered);
       const opened = metrics.filter(m => m.is_opened);
       const clicked = metrics.filter(m => m.is_clicked);
       const replied = metrics.filter(m => m.is_replied);

       return {
         openRate: delivered.length > 0 ? (opened.length / delivered.length * 100).toFixed(1) : 0,
         clickRate: opened.length > 0 ? (clicked.length / opened.length * 100).toFixed(1) : 0,
         replyRate: delivered.length > 0 ? (replied.length / delivered.length * 100).toFixed(1) : 0
       };
     } catch (error) {
       Logger.error('Failed to get engagement metrics:', error);
       return { openRate: 0, clickRate: 0, replyRate: 0 };
     }
   }

   async getCommunicationHistory(userId, options = {}) {
     try {
       const { dateFrom, dateTo, limit = 50 } = options;
       
       let query = supabase
         .from('email_activity_timeline')
         .select(`
           id,
           activity_type,
           activity_data,
           created_at,
           client_id
         `)
         .eq('user_id', userId)
         .order('created_at', { ascending: false });

       if (dateFrom && dateTo) {
         query = query
           .gte('created_at', dateFrom)
           .lte('created_at', dateTo);
       }

       if (limit) {
         query = query.limit(limit);
       }

       const { data: history, error } = await query;
       
       if (error) throw error;

       return history.map(item => ({
         id: item.id,
         type: item.activity_type,
         clientId: item.client_id,
         clientName: item.activity_data?.client_name || 'Unknown',
         subject: item.activity_data?.subject || '',
         timestamp: item.created_at,
         metadata: item.activity_data
       }));
     } catch (error) {
       Logger.error('Failed to get communication history:', error);
       return [];
     }
   }

   async getClientEngagementMetrics(userId, options = {}) {
     try {
       const { dateFrom, dateTo } = options;
       
       let query = supabase
         .from('client_communication_analytics')
         .select('*')
         .eq('user_id', userId)
         .order('engagement_score', { ascending: false });

       if (dateFrom && dateTo) {
         query = query
           .gte('last_communication', dateFrom)
           .lte('last_communication', dateTo);
       }

       const { data: engagement, error } = await query;
       
       if (error) throw error;

       return engagement.map(client => ({
         clientId: client.client_id,
         clientName: client.client_name,
         engagementScore: client.engagement_score,
         totalEmails: client.total_emails,
         responseRate: client.response_rate,
         avgResponseTime: client.avg_response_time_hours,
         lastCommunication: client.last_communication
       }));
     } catch (error) {
       Logger.error('Failed to get client engagement metrics:', error);
       return [];
     }
   }

  // Helper methods for processing activity data
   processTimelineData(activities, timeframe) {
     const grouped = {};
     activities.forEach(activity => {
       const date = new Date(activity.created_at);
       let key;
       
       if (timeframe === 'hourly') {
         key = date.toISOString().slice(0, 13) + ':00:00.000Z';
       } else {
         key = date.toISOString().slice(0, 10);
       }
       
       if (!grouped[key]) {
         grouped[key] = { date: key, count: 0, activities: [] };
       }
       grouped[key].count++;
       grouped[key].activities.push(activity);
     });
     
     return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
   }

   getHourlyDistribution(activities) {
     const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
     
     activities.forEach(activity => {
       const hour = new Date(activity.created_at).getHours();
       hourCounts[hour].count++;
     });
     
     return hourCounts;
   }

   getDailyTrends(activities) {
     const dailyData = {};
     
     activities.forEach(activity => {
       const date = new Date(activity.created_at).toISOString().slice(0, 10);
       if (!dailyData[date]) {
         dailyData[date] = { date, sent: 0, received: 0, total: 0 };
       }
       
       dailyData[date].total++;
       if (activity.activity_type === 'email_sent') {
         dailyData[date].sent++;
       } else if (activity.activity_type === 'email_received') {
         dailyData[date].received++;
       }
     });
     
     return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
   }

   getTypeBreakdown(activities) {
     const typeBreakdown = {};
     
     activities.forEach(activity => {
       const type = activity.activity_data?.template_category || activity.activity_type || 'general';
       if (!typeBreakdown[type]) {
         typeBreakdown[type] = { type, count: 0, percentage: 0 };
       }
       typeBreakdown[type].count++;
     });
     
     const total = activities.length;
     Object.values(typeBreakdown).forEach(item => {
       item.percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
     });
     
     return Object.values(typeBreakdown).sort((a, b) => b.count - a.count);
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