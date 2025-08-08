import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import { getEnvVar } from '@/utils/env';

/**
 * EmailTrackingService - Handles email tracking, analytics, and pixel generation
 */
class EmailTrackingService {
  constructor() {
    this.baseUrl = getEnvVar('VITE_BASE_URL') || 'https://your-domain.com';
    this.pixelCache = new Map();
    this.eventQueue = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    
    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Track email sent event with enhanced analytics
   */
  async trackEmailSent(emailData) {
    try {
      const trackingEvent = {
        user_id: emailData.userId,
        email_id: emailData.emailId,
        event_type: 'sent',
        event_data: {
          to: emailData.to,
          subject: emailData.subject,
          template_id: emailData.templateId,
          template_name: emailData.templateName,
          client_id: emailData.clientId,
          client_name: emailData.clientName,
          has_attachments: emailData.hasAttachments || false,
          email_size: emailData.emailSize || 0
        },
        timestamp: new Date().toISOString(),
        ip_address: emailData.ipAddress,
        user_agent: emailData.userAgent
      };

      // Add to event queue for batch processing
      this.eventQueue.push(trackingEvent);

      // Create performance metrics record
      await this.createPerformanceMetric(emailData);

      // Update activity timeline
      await this.updateActivityTimeline(emailData.userId, 'email_sent', trackingEvent.event_data);

      // Update client communication analytics
      await this.updateClientCommunicationAnalytics(emailData);

      Logger.info('Email sent event tracked:', { emailId: emailData.emailId });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to track email sent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track email opened event with enhanced data
   */
  async trackEmailOpened(emailId, trackingData = {}) {
    try {
      const trackingEvent = {
        email_id: emailId,
        event_type: 'opened',
        event_data: {
          open_count: trackingData.openCount || 1,
          first_open: trackingData.firstOpen || true,
          location: trackingData.location,
          device_type: trackingData.deviceType,
          email_client: trackingData.emailClient
        },
        timestamp: new Date().toISOString(),
        ip_address: trackingData.ipAddress,
        user_agent: trackingData.userAgent
      };

      this.eventQueue.push(trackingEvent);

      // Update performance metrics
      await this.updatePerformanceMetric(emailId, { 
        is_opened: true, 
        opened_at: new Date(),
        open_count: trackingData.openCount || 1
      });

      Logger.info('Email opened event tracked:', { emailId });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to track email opened:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track email clicked event with link details
   */
  async trackEmailClicked(emailId, clickData = {}) {
    try {
      const trackingEvent = {
        email_id: emailId,
        event_type: 'clicked',
        event_data: {
          link_url: clickData.linkUrl,
          link_text: clickData.linkText,
          click_position: clickData.clickPosition,
          click_count: clickData.clickCount || 1
        },
        timestamp: new Date().toISOString(),
        ip_address: clickData.ipAddress,
        user_agent: clickData.userAgent
      };

      this.eventQueue.push(trackingEvent);

      // Update performance metrics
      await this.updatePerformanceMetric(emailId, { 
        is_clicked: true, 
        clicked_at: new Date(),
        click_count: (clickData.clickCount || 1)
      });

      Logger.info('Email clicked event tracked:', { emailId, linkUrl: clickData.linkUrl });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to track email clicked:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track email replied event with response metrics
   */
  async trackEmailReplied(emailId, replyData = {}) {
    try {
      const trackingEvent = {
        email_id: emailId,
        event_type: 'replied',
        event_data: {
          reply_id: replyData.replyId,
          response_time_hours: replyData.responseTimeHours,
          reply_length: replyData.replyLength,
          sentiment: replyData.sentiment
        },
        timestamp: new Date().toISOString(),
        ip_address: replyData.ipAddress,
        user_agent: replyData.userAgent
      };

      this.eventQueue.push(trackingEvent);

      // Update performance metrics
      await this.updatePerformanceMetric(emailId, { 
        is_replied: true, 
        replied_at: new Date(),
        response_time_hours: replyData.responseTimeHours
      });

      Logger.info('Email replied event tracked:', { emailId });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to track email replied:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create performance metrics record
   */
  async createPerformanceMetric(emailData) {
    try {
      const { error } = await supabase
        .from('email_performance_metrics')
        .insert({
          user_id: emailData.userId,
          email_id: emailData.emailId,
          template_id: emailData.templateId,
          template_name: emailData.templateName,
          client_id: emailData.clientId,
          sent_at: new Date().toISOString(),
          is_delivered: true, // Assume delivered when sent
          delivered_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      Logger.error('Failed to create performance metric:', error);
      throw error;
    }
  }

  /**
   * Update performance metrics
   */
  async updatePerformanceMetric(emailId, updates) {
    try {
      const { error } = await supabase
        .from('email_performance_metrics')
        .update(updates)
        .eq('email_id', emailId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Failed to update performance metric:', error);
      throw error;
    }
  }

  /**
   * Update activity timeline
   */
  async updateActivityTimeline(userId, activityType, activityData) {
    try {
      const { error } = await supabase
        .from('email_activity_timeline')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          client_id: activityData.client_id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      Logger.error('Failed to update activity timeline:', error);
      throw error;
    }
  }

  /**
   * Update client communication analytics
   */
  async updateClientCommunicationAnalytics(emailData) {
    try {
      // Check if record exists for this client
      const { data: existing } = await supabase
        .from('client_communication_analytics')
        .select('*')
        .eq('user_id', emailData.userId)
        .eq('client_id', emailData.clientId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('client_communication_analytics')
          .update({
            total_emails_sent: existing.total_emails_sent + 1,
            last_email_sent: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('client_communication_analytics')
          .insert({
            user_id: emailData.userId,
            client_id: emailData.clientId,
            client_name: emailData.clientName,
            total_emails_sent: 1,
            total_emails_received: 0,
            last_email_sent: new Date().toISOString(),
            engagement_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    } catch (error) {
      Logger.error('Failed to update client communication analytics:', error);
      throw error;
    }
  }

  /**
   * Start batch processing of tracking events
   */
  startBatchProcessing() {
    setInterval(() => {
      this.flushEventQueue();
    }, this.flushInterval);
  }

  /**
   * Flush event queue to database
   */
  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, this.batchSize);
    
    try {
      const { error } = await supabase
        .from('email_tracking_events')
        .insert(eventsToProcess);

      if (error) throw error;

      Logger.info(`Flushed ${eventsToProcess.length} tracking events to database`);
    } catch (error) {
      Logger.error('Failed to flush tracking events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToProcess);
    }
  }

  /**
   * Get tracking statistics for an email
   */
  async getEmailTrackingStats(emailId) {
    try {
      const { data: events, error } = await supabase
        .from('email_tracking_events')
        .select('*')
        .eq('email_id', emailId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const stats = {
        sent: events.some(e => e.event_type === 'sent'),
        opened: events.filter(e => e.event_type === 'opened').length,
        clicked: events.filter(e => e.event_type === 'clicked').length,
        replied: events.some(e => e.event_type === 'replied'),
        bounced: events.some(e => e.event_type === 'bounced'),
        firstOpenedAt: events.find(e => e.event_type === 'opened')?.timestamp,
        lastActivityAt: events[events.length - 1]?.timestamp,
        totalEvents: events.length
      };

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Failed to get email tracking stats:', error);
      return { success: false, error: error.message };
    }
  }
  generateOpenTrackingPixel(campaignId, recipientId, messageId) {
    const trackingData = {
      campaign_id: campaignId,
      recipient_id: recipientId,
      message_id: messageId,
      type: 'open',
      timestamp: Date.now(),
    };

    // Encode tracking data in base64
    const encodedData = btoa(JSON.stringify(trackingData));

    // Generate tracking URL
    const trackingUrl = `${this.baseUrl}/api/track/pixel/${encodedData}.png`;

    // Return invisible 1x1 pixel image
    return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
  }

  /**
   * Wrap links with click tracking
   */
  wrapLinksWithTracking(htmlContent, campaignId, recipientId, messageId) {
    if (!htmlContent) return htmlContent;

    // Regular expression to find all links
    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;

    let linkIndex = 0;
    const wrappedContent = htmlContent.replace(linkRegex, (match, url, linkText) => {
      // Skip if it's already a tracking link
      if (url.includes('/api/track/click/')) {
        return match;
      }

      // Generate tracking URL
      const trackingData = {
        campaign_id: campaignId,
        recipient_id: recipientId,
        message_id: messageId,
        link_index: linkIndex++,
        original_url: url,
        type: 'click',
        timestamp: Date.now(),
      };

      const encodedData = btoa(JSON.stringify(trackingData));
      const trackingUrl = `${this.baseUrl}/api/track/click/${encodedData}`;

      // Replace the original href with tracking URL
      return match.replace(`href="${url}"`, `href="${trackingUrl}"`);
    });

    return wrappedContent;
  }

  /**
   * Add comprehensive tracking to email content
   */
  addTrackingToEmail(emailContent, trackingData) {
    const {
      campaignId,
      recipientId,
      messageId,
      trackOpens = true,
      trackClicks = true,
    } = trackingData;

    let trackedContent = emailContent;

    // Add click tracking
    if (trackClicks) {
      trackedContent = this.wrapLinksWithTracking(
        trackedContent,
        campaignId,
        recipientId,
        messageId,
      );
    }

    // Add open tracking pixel
    if (trackOpens) {
      const pixel = this.generateOpenTrackingPixel(campaignId, recipientId, messageId);

      // Try to insert before closing body tag, otherwise append
      if (trackedContent.includes('</body>')) {
        trackedContent = trackedContent.replace('</body>', `${pixel}</body>`);
      } else {
        trackedContent += pixel;
      }
    }

    return trackedContent;
  }

  /**
   * Record email open event
   */
  async recordOpen(trackingData) {
    try {
      const { campaign_id, recipient_id, message_id } = trackingData;

      // Check if this open has already been recorded (for unique opens)
      const { data: existingOpen } = await supabase
        .from('email_tracking_events')
        .select('id')
        .eq('campaign_id', campaign_id)
        .eq('recipient_id', recipient_id)
        .eq('event_type', 'open')
        .single();

      const eventData = {
        campaign_id,
        recipient_id,
        message_id,
        event_type: 'open',
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ip_address: null, // Would be filled by backend
        is_unique: !existingOpen,
      };

      const { error } = await supabase.from('email_tracking_events').insert([eventData]);

      if (error) throw error;

      // Update campaign statistics
      await this.updateCampaignStats(campaign_id);

      return { success: true };
    } catch (error) {
      Logger.error('Error recording email open:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record email click event
   */
  async recordClick(trackingData) {
    try {
      const { campaign_id, recipient_id, message_id, link_index, original_url } = trackingData;

      const eventData = {
        campaign_id,
        recipient_id,
        message_id,
        event_type: 'click',
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        ip_address: null, // Would be filled by backend
        link_url: original_url,
        link_index,
      };

      const { error } = await supabase.from('email_tracking_events').insert([eventData]);

      if (error) throw error;

      // Update campaign statistics
      await this.updateCampaignStats(campaign_id);

      return { success: true, redirectUrl: original_url };
    } catch (error) {
      Logger.error('Error recording email click:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record email bounce event
   */
  async recordBounce(campaignId, recipientId, messageId, bounceType, reason) {
    try {
      const eventData = {
        campaign_id: campaignId,
        recipient_id: recipientId,
        message_id: messageId,
        event_type: 'bounce',
        timestamp: new Date().toISOString(),
        bounce_type: bounceType, // 'hard' or 'soft'
        bounce_reason: reason,
      };

      const { error } = await supabase.from('email_tracking_events').insert([eventData]);

      if (error) throw error;

      // Update campaign statistics
      await this.updateCampaignStats(campaignId);

      return { success: true };
    } catch (error) {
      Logger.error('Error recording email bounce:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update campaign statistics
   */
  async updateCampaignStats(campaignId) {
    try {
      // Get all events for this campaign
      const { data: events, error } = await supabase
        .from('email_tracking_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      // Calculate statistics
      const stats = this.calculateStats(events);

      // Update campaign with new stats
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({
          stats: stats,
          last_activity: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      return stats;
    } catch (error) {
      Logger.error('Error updating campaign stats:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from events
   */
  calculateStats(events) {
    const stats = {
      total_recipients: 0,
      sent: 0,
      delivered: 0,
      opens: events.filter(e => e.event_type === 'open').length,
      unique_opens: new Set(events.filter(e => e.event_type === 'open').map(e => e.recipient_id))
        .size,
      clicks: events.filter(e => e.event_type === 'click').length,
      unique_clicks: new Set(events.filter(e => e.event_type === 'click').map(e => e.recipient_id))
        .size,
      bounces: events.filter(e => e.event_type === 'bounce').length,
      hard_bounces: events.filter(e => e.event_type === 'bounce' && e.bounce_type === 'hard')
        .length,
      soft_bounces: events.filter(e => e.event_type === 'bounce' && e.bounce_type === 'soft')
        .length,
      unsubscribes: events.filter(e => e.event_type === 'unsubscribe').length,
    };

    // Calculate rates (assuming we have recipient count from campaign)
    if (stats.total_recipients > 0) {
      stats.delivery_rate = (((stats.sent - stats.bounces) / stats.sent) * 100).toFixed(2);
      stats.open_rate = ((stats.unique_opens / stats.delivered) * 100).toFixed(2);
      stats.click_rate = ((stats.unique_clicks / stats.delivered) * 100).toFixed(2);
      stats.click_through_rate = ((stats.unique_clicks / stats.unique_opens) * 100).toFixed(2);
      stats.bounce_rate = ((stats.bounces / stats.sent) * 100).toFixed(2);
      stats.unsubscribe_rate = ((stats.unsubscribes / stats.delivered) * 100).toFixed(2);
    }

    return stats;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    try {
      // Get campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Get tracking events
      const { data: events, error: eventsError } = await supabase
        .from('email_tracking_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('timestamp', { ascending: false });

      if (eventsError) throw eventsError;

      // Calculate detailed analytics
      const analytics = {
        campaign: campaign,
        stats: this.calculateStats(events),
        timeline: this.generateTimeline(events),
        topLinks: this.getTopClickedLinks(events),
        recipientActivity: this.getRecipientActivity(events),
        hourlyActivity: this.getHourlyActivity(events),
        deviceStats: this.getDeviceStats(events),
        geographicData: this.getGeographicData(events),
      };

      return { success: true, data: analytics };
    } catch (error) {
      Logger.error('Error getting campaign analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate activity timeline
   */
  generateTimeline(events) {
    const timeline = {};

    events.forEach(event => {
      const date = new Date(event.timestamp).toDateString();
      if (!timeline[date]) {
        timeline[date] = { opens: 0, clicks: 0, bounces: 0 };
      }

      if (event.event_type === 'open') timeline[date].opens++;
      if (event.event_type === 'click') timeline[date].clicks++;
      if (event.event_type === 'bounce') timeline[date].bounces++;
    });

    return Object.entries(timeline)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get top clicked links
   */
  getTopClickedLinks(events) {
    const linkClicks = {};

    events
      .filter(e => e.event_type === 'click')
      .forEach(event => {
        const url = event.link_url;
        if (url) {
          linkClicks[url] = (linkClicks[url] || 0) + 1;
        }
      });

    return Object.entries(linkClicks)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }

  /**
   * Get recipient activity
   */
  getRecipientActivity(events) {
    const recipients = {};

    events.forEach(event => {
      const recipientId = event.recipient_id;
      if (!recipients[recipientId]) {
        recipients[recipientId] = {
          recipient_id: recipientId,
          opens: 0,
          clicks: 0,
          last_activity: null,
        };
      }

      if (event.event_type === 'open') recipients[recipientId].opens++;
      if (event.event_type === 'click') recipients[recipientId].clicks++;

      if (
        !recipients[recipientId].last_activity ||
        new Date(event.timestamp) > new Date(recipients[recipientId].last_activity)
      ) {
        recipients[recipientId].last_activity = event.timestamp;
      }
    });

    return Object.values(recipients).sort((a, b) => b.opens + b.clicks - (a.opens + a.clicks));
  }

  /**
   * Get hourly activity distribution
   */
  getHourlyActivity(events) {
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      opens: 0,
      clicks: 0,
    }));

    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      if (event.event_type === 'open') hourlyStats[hour].opens++;
      if (event.event_type === 'click') hourlyStats[hour].clicks++;
    });

    return hourlyStats;
  }

  /**
   * Get device/browser statistics
   */
  getDeviceStats(events) {
    const devices = {};

    events.forEach(event => {
      if (event.user_agent) {
        // Simple device detection (in production, use a proper user agent parser)
        let device = 'Unknown';
        if (event.user_agent.includes('Mobile')) device = 'Mobile';
        else if (event.user_agent.includes('Tablet')) device = 'Tablet';
        else device = 'Desktop';

        devices[device] = (devices[device] || 0) + 1;
      }
    });

    return Object.entries(devices).map(([device, count]) => ({ device, count }));
  }

  /**
   * Get geographic data (placeholder - would require IP geolocation)
   */
  getGeographicData(events) {
    // In production, this would use IP geolocation service
    return [
      { country: 'Italy', count: events.length * 0.7 },
      { country: 'Germany', count: events.length * 0.2 },
      { country: 'France', count: events.length * 0.1 },
    ];
  }

  /**
   * Get real-time analytics for dashboard
   */
  async getRealTimeAnalytics() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: recentEvents, error } = await supabase
        .from('email_tracking_events')
        .select('*')
        .gte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const analytics = {
        last24Hours: {
          opens: recentEvents.filter(e => e.event_type === 'open').length,
          clicks: recentEvents.filter(e => e.event_type === 'click').length,
          bounces: recentEvents.filter(e => e.event_type === 'bounce').length,
        },
        recentActivity: recentEvents.slice(0, 20), // Last 20 events
        hourlyTrend: this.getHourlyActivity(recentEvents),
      };

      return { success: true, data: analytics };
    } catch (error) {
      Logger.error('Error getting real-time analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create unsubscribe link
   */
  generateUnsubscribeLink(campaignId, recipientId) {
    const unsubscribeData = {
      campaign_id: campaignId,
      recipient_id: recipientId,
      type: 'unsubscribe',
      timestamp: Date.now(),
    };

    const encodedData = btoa(JSON.stringify(unsubscribeData));
    return `${this.baseUrl}/unsubscribe/${encodedData}`;
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(unsubscribeData) {
    try {
      const { campaign_id, recipient_id } = unsubscribeData;

      // Record unsubscribe event
      const eventData = {
        campaign_id,
        recipient_id,
        event_type: 'unsubscribe',
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase.from('email_tracking_events').insert([eventData]);

      if (error) throw error;

      // Add to unsubscribe list
      const { error: unsubError } = await supabase.from('email_unsubscribes').insert([
        {
          email: recipient_id, // Assuming recipient_id is email
          campaign_id,
          unsubscribed_at: new Date().toISOString(),
        },
      ]);

      if (unsubError && !unsubError.message.includes('duplicate')) {
        throw unsubError;
      }

      return { success: true };
    } catch (error) {
      Logger.error('Error processing unsubscribe:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate comprehensive email report
   */
  async generateEmailReport(campaignId, format = 'json') {
    try {
      const analytics = await this.getCampaignAnalytics(campaignId);

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const report = {
        campaign: analytics.data.campaign,
        summary: analytics.data.stats,
        detailed_analytics: {
          timeline: analytics.data.timeline,
          top_links: analytics.data.topLinks,
          recipient_activity: analytics.data.recipientActivity,
          hourly_distribution: analytics.data.hourlyActivity,
          device_breakdown: analytics.data.deviceStats,
          geographic_data: analytics.data.geographicData,
        },
        generated_at: new Date().toISOString(),
      };

      if (format === 'csv') {
        return this.convertReportToCSV(report);
      }

      return { success: true, data: report };
    } catch (error) {
      Logger.error('Error generating email report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert report to CSV format
   */
  convertReportToCSV(report) {
    // Implementation for CSV conversion
    const csvData = [
      ['Metric', 'Value'],
      ['Campaign Name', report.campaign.name],
      ['Total Recipients', report.summary.total_recipients],
      ['Delivery Rate', report.summary.delivery_rate + '%'],
      ['Open Rate', report.summary.open_rate + '%'],
      ['Click Rate', report.summary.click_rate + '%'],
      ['Bounce Rate', report.summary.bounce_rate + '%'],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return { success: true, data: csvContent, format: 'csv' };
  }
}

let emailTrackingServiceInstance = null;

export const getEmailTrackingService = () => {
  if (!emailTrackingServiceInstance) {
    emailTrackingServiceInstance = new EmailTrackingService();
  }
  return emailTrackingServiceInstance;
};

export default getEmailTrackingService;
