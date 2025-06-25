import { supabase } from '@lib/supabaseClient';
import emailTemplateService from '@lib/emailTemplateService';
import emailService from '@lib/emailService';
import Logger from '@utils/Logger';

/**
 * EmailCampaignService - Manages bulk email campaigns with tracking and analytics
 */
class EmailCampaignService {
  constructor() {
    this.baseTrackingUrl = import.meta.env.VITE_BASE_URL || 'https://your-domain.com';
    this.maxBatchSize = 50; // Maximum emails per batch
    this.sendDelay = 1000; // Delay between batches in milliseconds
  }

  /**
   * Create a new email campaign
   */
  async createCampaign(campaignData) {
    try {
      const campaign = {
        name: campaignData.name,
        description: campaignData.description || '',
        template_id: campaignData.templateId,
        subject: campaignData.subject,
        status: 'draft',
        scheduled_at: campaignData.scheduledAt || null,
        recipients: campaignData.recipients || [],
        variables: campaignData.variables || {},
        settings: {
          track_opens: campaignData.trackOpens !== false,
          track_clicks: campaignData.trackClicks !== false,
          batch_size: campaignData.batchSize || this.maxBatchSize,
          send_delay: campaignData.sendDelay || this.sendDelay
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: campaignData.organizationId || 'default'
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Campaign created successfully'
      };
    } catch (error) {
      Logger.error('Error creating email campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all campaigns for an organization
   */
  async getCampaigns(organizationId = 'default', status = null) {
    try {
      let query = supabase
        .from('email_campaigns')
        .select(`
          *,
          email_templates (
            name,
            description
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      Logger.error('Error fetching campaigns:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get campaign details with statistics
   */
  async getCampaignDetails(campaignId) {
    try {
      // Get campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          email_templates (
            name,
            description,
            html_content,
            subject
          )
        `)
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Get campaign statistics
      const stats = await this.getCampaignStats(campaignId);

      return {
        success: true,
        data: {
          ...campaign,
          stats: stats.data
        }
      };
    } catch (error) {
      Logger.error('Error fetching campaign details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Campaign updated successfully'
      };
    } catch (error) {
      Logger.error('Error updating campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId) {
    try {
      // First check if campaign has been sent
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('status')
        .eq('id', campaignId)
        .single();

      if (campaign?.status === 'sent' || campaign?.status === 'sending') {
        return {
          success: false,
          error: 'Cannot delete campaigns that have been sent or are being sent'
        };
      }

      // Delete campaign logs first
      await supabase
        .from('email_campaign_logs')
        .delete()
        .eq('campaign_id', campaignId);

      // Delete campaign
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      return {
        success: true,
        message: 'Campaign deleted successfully'
      };
    } catch (error) {
      Logger.error('Error deleting campaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send campaign immediately or schedule it
   */
  async sendCampaign(campaignId, options = {}) {
    try {
      // Get campaign details
      const campaignResult = await this.getCampaignDetails(campaignId);
      if (!campaignResult.success) {
        return campaignResult;
      }

      const campaign = campaignResult.data;

      // Validate campaign
      const validation = this.validateCampaign(campaign);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Campaign validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Update campaign status
      await this.updateCampaign(campaignId, {
        status: options.scheduled ? 'scheduled' : 'sending',
        sent_at: options.scheduled ? null : new Date().toISOString()
      });

      if (options.scheduled) {
        return {
          success: true,
          message: 'Campaign scheduled successfully'
        };
      }

      // Send immediately
      const sendResult = await this.processCampaignSending(campaign);
      
      // Update final status
      await this.updateCampaign(campaignId, {
        status: sendResult.success ? 'sent' : 'failed',
        completed_at: new Date().toISOString()
      });

      return sendResult;
    } catch (error) {
      Logger.error('Error sending campaign:', error);
      await this.updateCampaign(campaignId, { status: 'failed' });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process campaign sending in batches
   */
  async processCampaignSending(campaign) {
    try {
      const { recipients, settings, template_id, variables } = campaign;
      const batchSize = settings.batch_size || this.maxBatchSize;
      const sendDelay = settings.send_delay || this.sendDelay;

      let totalSent = 0;
      let totalFailed = 0;

      // Get template
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (!template) {
        throw new Error('Template not found');
      }

      // Process recipients in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(recipient => 
          this.sendSingleEmail(campaign, template, recipient, variables)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Count results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        });

        // Delay between batches (except for the last batch)
        if (i + batchSize < recipients.length) {
          await this.delay(sendDelay);
        }
      }

      return {
        success: true,
        data: {
          totalSent,
          totalFailed,
          totalRecipients: recipients.length
        },
        message: `Campaign completed: ${totalSent} sent, ${totalFailed} failed`
      };
    } catch (error) {
      Logger.error('Error processing campaign sending:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send single email within a campaign
   */
  async sendSingleEmail(campaign, template, recipient, globalVariables = {}) {
    try {
      // Merge variables (recipient-specific overrides global)
      const emailVariables = {
        ...globalVariables,
        ...recipient.variables,
        recipient_email: recipient.email,
        recipient_name: recipient.name || recipient.email
      };

      // Add tracking pixels if enabled
      let htmlContent = template.html_content;
      if (campaign.settings.track_opens) {
        const trackingPixel = this.generateTrackingPixel(campaign.id, recipient.email);
        htmlContent = this.addTrackingPixel(htmlContent, trackingPixel);
      }

      if (campaign.settings.track_clicks) {
        htmlContent = this.addClickTracking(htmlContent, campaign.id, recipient.email);
      }

      // Render template with variables
      const rendered = emailTemplateService.renderTemplate({
        subject: campaign.subject || template.subject,
        html_content: htmlContent
      }, emailVariables);

      if (!rendered.success) {
        throw new Error(`Template rendering failed: ${rendered.error}`);
      }

      // Send email
      const emailResult = await emailService.sendEmail({
        to: recipient.email,
        subject: rendered.data.subject,
        html: rendered.data.htmlContent,
        text: rendered.data.textContent,
        campaignId: campaign.id
      });

      // Log the result
      await this.logEmailSend(campaign.id, recipient.email, emailResult.success, {
        messageId: emailResult.messageId,
        error: emailResult.error
      });

      return emailResult;
    } catch (error) {
      Logger.error('Error sending single campaign email:', error);
      await this.logEmailSend(campaign.id, recipient.email, false, {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate tracking pixel URL
   */
  generateTrackingPixel(campaignId, recipientEmail) {
    const trackingData = btoa(JSON.stringify({
      campaignId,
      email: recipientEmail,
      type: 'open',
      timestamp: Date.now()
    }));

    return `${this.baseTrackingUrl}/api/email-tracking/pixel?data=${trackingData}`;
  }

  /**
   * Add tracking pixel to HTML content
   */
  addTrackingPixel(htmlContent, trackingPixelUrl) {
    const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Try to add just before closing body tag
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    }
    
    // Otherwise add at the end
    return htmlContent + trackingPixel;
  }

  /**
   * Add click tracking to links
   */
  addClickTracking(htmlContent, campaignId, recipientEmail) {
    return htmlContent.replace(
      /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
      (match, attributes, originalUrl) => {
        // Skip if already has tracking or is an anchor
        if (originalUrl.startsWith('#') || originalUrl.includes('email-tracking')) {
          return match;
        }

        const trackingData = btoa(JSON.stringify({
          campaignId,
          email: recipientEmail,
          type: 'click',
          originalUrl,
          timestamp: Date.now()
        }));

        const trackingUrl = `${this.baseTrackingUrl}/api/email-tracking/click?data=${trackingData}`;
        
        return `<a ${attributes.replace(/href=["'][^"']+["']/, `href="${trackingUrl}"`)}`;
      }
    );
  }

  /**
   * Log email send result
   */
  async logEmailSend(campaignId, recipientEmail, success, metadata = {}) {
    try {
      await supabase
        .from('email_campaign_logs')
        .insert({
          campaign_id: campaignId,
          recipient_email: recipientEmail,
          status: success ? 'sent' : 'failed',
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      Logger.error('Error logging email send:', error);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId) {
    try {
      // Get send statistics
      const { data: logs, error: logsError } = await supabase
        .from('email_campaign_logs')
        .select('status, created_at')
        .eq('campaign_id', campaignId);

      if (logsError) throw logsError;

      // Get tracking statistics
      const { data: tracking, error: trackingError } = await supabase
        .from('email_tracking_events')
        .select('event_type, created_at')
        .eq('campaign_id', campaignId);

      if (trackingError && trackingError.code !== 'PGRST116') { // Ignore if table doesn't exist
        throw trackingError;
      }

      const stats = {
        total_recipients: logs.length,
        sent: logs.filter(log => log.status === 'sent').length,
        failed: logs.filter(log => log.status === 'failed').length,
        opens: tracking ? tracking.filter(t => t.event_type === 'open').length : 0,
        clicks: tracking ? tracking.filter(t => t.event_type === 'click').length : 0,
        unique_opens: tracking ? new Set(tracking.filter(t => t.event_type === 'open').map(t => t.recipient_email)).size : 0,
        unique_clicks: tracking ? new Set(tracking.filter(t => t.event_type === 'click').map(t => t.recipient_email)).size : 0
      };

      // Calculate rates
      stats.delivery_rate = stats.total_recipients > 0 ? (stats.sent / stats.total_recipients * 100).toFixed(2) : 0;
      stats.open_rate = stats.sent > 0 ? (stats.unique_opens / stats.sent * 100).toFixed(2) : 0;
      stats.click_rate = stats.sent > 0 ? (stats.unique_clicks / stats.sent * 100).toFixed(2) : 0;
      stats.click_through_rate = stats.unique_opens > 0 ? (stats.unique_clicks / stats.unique_opens * 100).toFixed(2) : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      Logger.error('Error getting campaign stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total_recipients: 0,
          sent: 0,
          failed: 0,
          opens: 0,
          clicks: 0,
          unique_opens: 0,
          unique_clicks: 0,
          delivery_rate: 0,
          open_rate: 0,
          click_rate: 0,
          click_through_rate: 0
        }
      };
    }
  }

  /**
   * Validate campaign before sending
   */
  validateCampaign(campaign) {
    const errors = [];

    if (!campaign.name) {
      errors.push('Campaign name is required');
    }

    if (!campaign.subject) {
      errors.push('Email subject is required');
    }

    if (!campaign.recipients || campaign.recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (!campaign.template_id) {
      errors.push('Email template is required');
    }

    // Validate recipients
    if (campaign.recipients) {
      campaign.recipients.forEach((recipient, index) => {
        if (!recipient.email) {
          errors.push(`Recipient ${index + 1} is missing email address`);
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
          errors.push(`Recipient ${index + 1} has invalid email address`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recipients from client database
   */
  async getClientsAsRecipients(filters = {}) {
    try {
      let query = supabase
        .from('clients')
        .select('id, name, email, phone, company')
        .not('email', 'is', null)
        .not('email', 'eq', '');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.company) {
        query = query.ilike('company', `%${filters.company}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;

      const recipients = data.map(client => ({
        email: client.email,
        name: client.name,
        variables: {
          client_name: client.name,
          client_email: client.email,
          client_phone: client.phone || '',
          client_company: client.company || ''
        }
      }));

      return {
        success: true,
        data: recipients
      };
    } catch (error) {
      Logger.error('Error getting clients as recipients:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Import recipients from CSV
   */
  async importRecipientsFromCSV(csvContent) {
    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('name'));

      if (emailIndex === -1) {
        throw new Error('CSV must contain an email column');
      }

      const recipients = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const email = values[emailIndex];
        
        if (!email) continue;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Line ${i + 1}: Invalid email address "${email}"`);
          continue;
        }

        const recipient = {
          email,
          name: nameIndex >= 0 ? values[nameIndex] : email,
          variables: {}
        };

        // Map other columns as variables
        headers.forEach((header, index) => {
          if (index !== emailIndex && index !== nameIndex && values[index]) {
            recipient.variables[header] = values[index];
          }
        });

        recipients.push(recipient);
      }

      return {
        success: true,
        data: recipients,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      Logger.error('Error importing recipients from CSV:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId) {
    return this.updateCampaign(campaignId, { status: 'paused' });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId) {
    return this.updateCampaign(campaignId, { status: 'sending' });
  }

  /**
   * Get campaign logs
   */
  async getCampaignLogs(campaignId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('email_campaign_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      Logger.error('Error getting campaign logs:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default new EmailCampaignService(); 