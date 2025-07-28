import { supabase } from '@lib/supabaseClient';
import Logger from '@shared/utils/logger';
import emailManagementService from './emailManagementService';
import emailTemplateService from './emailTemplateService';

/**
 * Email Automation Service
 * Handles email scheduling, automation rules, follow-up reminders, and campaign management
 */
class EmailAutomationService {
  constructor() {
    this.isInitialized = false;
    this.automationWorker = null;
    this.schedulerInterval = null;
    
    // Automation rule types
    this.ruleTypes = {
      FILTER: 'filter',
      FORWARD: 'forward',
      LABEL: 'label',
      MOVE: 'move',
      DELETE: 'delete',
      MARK_READ: 'mark_read',
      STAR: 'star',
      AUTO_REPLY: 'auto_reply'
    };

    // Schedule frequencies
    this.frequencies = {
      ONCE: 'once',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly'
    };

    // Campaign statuses
    this.campaignStatuses = {
      DRAFT: 'draft',
      SCHEDULED: 'scheduled',
      RUNNING: 'running',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    };
  }

  /**
   * Initialize the automation service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Start the automation scheduler
      await this.startScheduler();
      
      this.isInitialized = true;
      Logger.info('Email automation service initialized');
    } catch (error) {
      Logger.error('Failed to initialize email automation service:', error);
      throw error;
    }
  }

  /**
   * Start the automation scheduler
   */
  async startScheduler() {
    // Check for scheduled emails every minute
    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledEmails();
        await this.processAutomationRules();
        await this.processCampaigns();
      } catch (error) {
        Logger.error('Error in automation scheduler:', error);
      }
    }, 60000); // 1 minute interval

    Logger.info('Email automation scheduler started');
  }

  /**
   * Stop the automation scheduler
   */
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      Logger.info('Email automation scheduler stopped');
    }
  }

  // ==================== EMAIL SCHEDULING ====================

  /**
   * Schedule an email for delayed sending
   * @param {Object} emailData - Email data
   * @param {Date} scheduledTime - When to send the email
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Scheduled email info
   */
  async scheduleEmail(emailData, scheduledTime, userId) {
    try {
      const scheduledEmail = {
        user_id: userId,
        to: emailData.to,
        cc: emailData.cc || null,
        bcc: emailData.bcc || null,
        subject: emailData.subject,
        body: emailData.body,
        attachments: emailData.attachments || [],
        template_id: emailData.templateId || null,
        template_variables: emailData.templateVariables || {},
        scheduled_for: scheduledTime.toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert(scheduledEmail)
        .select()
        .single();

      if (error) throw error;

      Logger.info(`Email scheduled for ${scheduledTime.toISOString()}:`, data.id);
      return data;
    } catch (error) {
      Logger.error('Error scheduling email:', error);
      throw error;
    }
  }

  /**
   * Process scheduled emails that are due to be sent
   */
  async processScheduledEmails() {
    try {
      const now = new Date().toISOString();

      const { data: scheduledEmails, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now)
        .order('scheduled_for');

      if (error) throw error;

      for (const email of scheduledEmails || []) {
        try {
          await this.sendScheduledEmail(email);
        } catch (error) {
          Logger.error(`Failed to send scheduled email ${email.id}:`, error);
          await this.updateScheduledEmailStatus(email.id, 'failed', error.message);
        }
      }
    } catch (error) {
      Logger.error('Error processing scheduled emails:', error);
    }
  }

  /**
   * Send a scheduled email
   * @param {Object} scheduledEmail - Scheduled email data
   */
  async sendScheduledEmail(scheduledEmail) {
    try {
      // Update status to sending
      await this.updateScheduledEmailStatus(scheduledEmail.id, 'sending');

      let emailBody = scheduledEmail.body;

      // Apply template if specified
      if (scheduledEmail.template_id) {
        const template = await emailTemplateService.getTemplate(scheduledEmail.template_id);
        if (template) {
          emailBody = emailTemplateService.applyTemplate(
            template.content,
            scheduledEmail.template_variables
          );
        }
      }

      // Send the email
      const emailData = {
        to: scheduledEmail.to,
        cc: scheduledEmail.cc,
        bcc: scheduledEmail.bcc,
        subject: scheduledEmail.subject,
        body: emailBody,
        attachments: scheduledEmail.attachments
      };

      const result = await emailManagementService.sendEmail(emailData, scheduledEmail.user_id);

      if (result.success) {
        await this.updateScheduledEmailStatus(scheduledEmail.id, 'sent');
        Logger.info(`Scheduled email ${scheduledEmail.id} sent successfully`);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      Logger.error(`Error sending scheduled email ${scheduledEmail.id}:`, error);
      throw error;
    }
  }

  /**
   * Update scheduled email status
   * @param {string} emailId - Scheduled email ID
   * @param {string} status - New status
   * @param {string} errorMessage - Error message if failed
   */
  async updateScheduledEmailStatus(emailId, status, errorMessage = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('scheduled_emails')
        .update(updateData)
        .eq('id', emailId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error updating scheduled email status:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled email
   * @param {string} emailId - Scheduled email ID
   * @param {string} userId - User ID
   */
  async cancelScheduledEmail(emailId, userId) {
    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) throw error;

      Logger.info(`Scheduled email ${emailId} cancelled`);
      return { success: true };
    } catch (error) {
      Logger.error('Error cancelling scheduled email:', error);
      throw error;
    }
  }

  /**
   * Get scheduled emails for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   */
  async getScheduledEmails(userId, filters = {}) {
    try {
      let query = supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_for', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.from_date) {
        query = query.gte('scheduled_for', filters.from_date);
      }

      if (filters.to_date) {
        query = query.lte('scheduled_for', filters.to_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error getting scheduled emails:', error);
      throw error;
    }
  }

  // ==================== AUTOMATION RULES ====================

  /**
   * Create an automation rule
   * @param {Object} ruleData - Rule configuration
   * @param {string} userId - User ID
   */
  async createAutomationRule(ruleData, userId) {
    try {
      const rule = {
        user_id: userId,
        name: ruleData.name,
        description: ruleData.description || null,
        is_active: ruleData.isActive !== false,
        priority: ruleData.priority || 1,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_automation_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;

      Logger.info(`Automation rule created: ${data.name}`);
      return data;
    } catch (error) {
      Logger.error('Error creating automation rule:', error);
      throw error;
    }
  }

  /**
   * Process automation rules for incoming emails
   */
  async processAutomationRules() {
    try {
      // Get all active automation rules
      const { data: rules, error } = await supabase
        .from('email_automation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;

      // Get recent unprocessed emails (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: emails, error: emailError } = await supabase
        .from('emails')
        .select('*')
        .gte('created_at', fiveMinutesAgo)
        .eq('automation_processed', false);

      if (emailError) throw emailError;

      // Process each email against each rule
      for (const email of emails || []) {
        for (const rule of rules || []) {
          try {
            if (await this.evaluateRuleConditions(email, rule.conditions)) {
              await this.executeRuleActions(email, rule.actions, rule.user_id);
              Logger.info(`Applied rule "${rule.name}" to email ${email.id}`);
            }
          } catch (error) {
            Logger.error(`Error applying rule ${rule.id} to email ${email.id}:`, error);
          }
        }

        // Mark email as processed
        await supabase
          .from('emails')
          .update({ automation_processed: true })
          .eq('id', email.id);
      }
    } catch (error) {
      Logger.error('Error processing automation rules:', error);
    }
  }

  /**
   * Evaluate rule conditions against an email
   * @param {Object} email - Email data
   * @param {Array} conditions - Rule conditions
   */
  async evaluateRuleConditions(email, conditions) {
    try {
      for (const condition of conditions) {
        const { field, operator, value } = condition;
        let emailValue;

        // Get the email field value
        switch (field) {
          case 'from':
            emailValue = email.from_email;
            break;
          case 'to':
            emailValue = email.to_email;
            break;
          case 'subject':
            emailValue = email.subject;
            break;
          case 'body':
            emailValue = email.body;
            break;
          case 'has_attachments':
            emailValue = email.attachments && email.attachments.length > 0;
            break;
          default:
            emailValue = email[field];
        }

        // Evaluate condition
        if (!this.evaluateCondition(emailValue, operator, value)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      Logger.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  /**
   * Evaluate a single condition
   * @param {any} emailValue - Value from email
   * @param {string} operator - Comparison operator
   * @param {any} conditionValue - Expected value
   */
  evaluateCondition(emailValue, operator, conditionValue) {
    switch (operator) {
      case 'equals':
        return emailValue === conditionValue;
      case 'contains':
        return emailValue && emailValue.toLowerCase().includes(conditionValue.toLowerCase());
      case 'starts_with':
        return emailValue && emailValue.toLowerCase().startsWith(conditionValue.toLowerCase());
      case 'ends_with':
        return emailValue && emailValue.toLowerCase().endsWith(conditionValue.toLowerCase());
      case 'not_equals':
        return emailValue !== conditionValue;
      case 'not_contains':
        return !emailValue || !emailValue.toLowerCase().includes(conditionValue.toLowerCase());
      case 'is_empty':
        return !emailValue || emailValue.trim() === '';
      case 'is_not_empty':
        return emailValue && emailValue.trim() !== '';
      default:
        return false;
    }
  }

  /**
   * Execute rule actions on an email
   * @param {Object} email - Email data
   * @param {Array} actions - Rule actions
   * @param {string} userId - User ID
   */
  async executeRuleActions(email, actions, userId) {
    try {
      for (const action of actions) {
        const { type, value } = action;

        switch (type) {
          case this.ruleTypes.LABEL:
            await emailManagementService.addLabel(email.id, value, userId);
            break;
          case this.ruleTypes.MOVE:
            await emailManagementService.moveToFolder(email.id, value, userId);
            break;
          case this.ruleTypes.MARK_READ:
            await emailManagementService.markAsRead(email.id, true, userId);
            break;
          case this.ruleTypes.STAR:
            await emailManagementService.starEmail(email.id, true, userId);
            break;
          case this.ruleTypes.DELETE:
            await emailManagementService.deleteEmail(email.id, userId);
            break;
          case this.ruleTypes.AUTO_REPLY:
            await this.sendAutoReply(email, value, userId);
            break;
          case this.ruleTypes.FORWARD:
            await this.forwardEmail(email, value, userId);
            break;
        }
      }
    } catch (error) {
      Logger.error('Error executing rule actions:', error);
      throw error;
    }
  }

  /**
   * Send auto-reply email
   * @param {Object} originalEmail - Original email
   * @param {Object} replyConfig - Auto-reply configuration
   * @param {string} userId - User ID
   */
  async sendAutoReply(originalEmail, replyConfig, userId) {
    try {
      const replyData = {
        to: originalEmail.from_email,
        subject: `Re: ${originalEmail.subject}`,
        body: replyConfig.message,
        in_reply_to: originalEmail.id
      };

      await emailManagementService.sendEmail(replyData, userId);
      Logger.info(`Auto-reply sent for email ${originalEmail.id}`);
    } catch (error) {
      Logger.error('Error sending auto-reply:', error);
      throw error;
    }
  }

  /**
   * Forward email
   * @param {Object} email - Email to forward
   * @param {Object} forwardConfig - Forward configuration
   * @param {string} userId - User ID
   */
  async forwardEmail(email, forwardConfig, userId) {
    try {
      const forwardData = {
        to: forwardConfig.to,
        subject: `Fwd: ${email.subject}`,
        body: `---------- Forwarded message ----------\nFrom: ${email.from_email}\nTo: ${email.to_email}\nSubject: ${email.subject}\n\n${email.body}`,
        attachments: email.attachments
      };

      await emailManagementService.sendEmail(forwardData, userId);
      Logger.info(`Email ${email.id} forwarded to ${forwardConfig.to}`);
    } catch (error) {
      Logger.error('Error forwarding email:', error);
      throw error;
    }
  }

  /**
   * Get automation rules for a user
   * @param {string} userId - User ID
   */
  async getAutomationRules(userId) {
    try {
      const { data, error } = await supabase
        .from('email_automation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (error) {
      Logger.error('Error getting automation rules:', error);
      throw error;
    }
  }

  /**
   * Update automation rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Rule updates
   * @param {string} userId - User ID
   */
  async updateAutomationRule(ruleId, updates, userId) {
    try {
      const { data, error } = await supabase
        .from('email_automation_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      Logger.error('Error updating automation rule:', error);
      throw error;
    }
  }

  /**
   * Delete automation rule
   * @param {string} ruleId - Rule ID
   * @param {string} userId - User ID
   */
  async deleteAutomationRule(ruleId, userId) {
    try {
      const { error } = await supabase
        .from('email_automation_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', userId);

      if (error) throw error;
      Logger.info(`Automation rule ${ruleId} deleted`);
    } catch (error) {
      Logger.error('Error deleting automation rule:', error);
      throw error;
    }
  }

  // ==================== FOLLOW-UP REMINDERS ====================

  /**
   * Create a follow-up reminder
   * @param {Object} reminderData - Reminder configuration
   * @param {string} userId - User ID
   */
  async createFollowUpReminder(reminderData, userId) {
    try {
      const reminder = {
        user_id: userId,
        email_id: reminderData.emailId,
        title: reminderData.title,
        description: reminderData.description || null,
        reminder_date: reminderData.reminderDate,
        is_completed: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_follow_up_reminders')
        .insert(reminder)
        .select()
        .single();

      if (error) throw error;

      Logger.info(`Follow-up reminder created for email ${reminderData.emailId}`);
      return data;
    } catch (error) {
      Logger.error('Error creating follow-up reminder:', error);
      throw error;
    }
  }

  /**
   * Get follow-up reminders for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   */
  async getFollowUpReminders(userId, filters = {}) {
    try {
      let query = supabase
        .from('email_follow_up_reminders')
        .select(`
          *,
          emails (
            id,
            subject,
            from_email,
            to_email,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('reminder_date');

      if (filters.completed !== undefined) {
        query = query.eq('is_completed', filters.completed);
      }

      if (filters.overdue) {
        query = query.lt('reminder_date', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error getting follow-up reminders:', error);
      throw error;
    }
  }

  /**
   * Mark follow-up reminder as completed
   * @param {string} reminderId - Reminder ID
   * @param {string} userId - User ID
   */
  async completeFollowUpReminder(reminderId, userId) {
    try {
      const { error } = await supabase
        .from('email_follow_up_reminders')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', reminderId)
        .eq('user_id', userId);

      if (error) throw error;

      Logger.info(`Follow-up reminder ${reminderId} marked as completed`);
    } catch (error) {
      Logger.error('Error completing follow-up reminder:', error);
      throw error;
    }
  }

  // ==================== EMAIL CAMPAIGNS ====================

  /**
   * Create an email campaign
   * @param {Object} campaignData - Campaign configuration
   * @param {string} userId - User ID
   */
  async createEmailCampaign(campaignData, userId) {
    try {
      const campaign = {
        user_id: userId,
        name: campaignData.name,
        description: campaignData.description || null,
        template_id: campaignData.templateId,
        recipients: campaignData.recipients,
        subject: campaignData.subject,
        schedule_type: campaignData.scheduleType || this.frequencies.ONCE,
        scheduled_for: campaignData.scheduledFor,
        frequency_config: campaignData.frequencyConfig || null,
        status: this.campaignStatuses.DRAFT,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;

      Logger.info(`Email campaign created: ${data.name}`);
      return data;
    } catch (error) {
      Logger.error('Error creating email campaign:', error);
      throw error;
    }
  }

  /**
   * Process email campaigns
   */
  async processCampaigns() {
    try {
      const now = new Date().toISOString();

      // Get campaigns that are scheduled and due to run
      const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('status', this.campaignStatuses.SCHEDULED)
        .lte('scheduled_for', now);

      if (error) throw error;

      for (const campaign of campaigns || []) {
        try {
          await this.executeCampaign(campaign);
        } catch (error) {
          Logger.error(`Failed to execute campaign ${campaign.id}:`, error);
          await this.updateCampaignStatus(campaign.id, this.campaignStatuses.CANCELLED);
        }
      }
    } catch (error) {
      Logger.error('Error processing campaigns:', error);
    }
  }

  /**
   * Execute an email campaign
   * @param {Object} campaign - Campaign data
   */
  async executeCampaign(campaign) {
    try {
      // Update status to running
      await this.updateCampaignStatus(campaign.id, this.campaignStatuses.RUNNING);

      // Get template if specified
      let emailBody = campaign.body || '';
      if (campaign.template_id) {
        const template = await emailTemplateService.getTemplate(campaign.template_id);
        if (template) {
          emailBody = template.content;
        }
      }

      // Send emails to all recipients
      const results = [];
      for (const recipient of campaign.recipients) {
        try {
          const personalizedBody = emailTemplateService.applyTemplate(emailBody, recipient.variables || {});
          
          const emailData = {
            to: recipient.email,
            subject: campaign.subject,
            body: personalizedBody
          };

          const result = await emailManagementService.sendEmail(emailData, campaign.user_id);
          results.push({
            recipient: recipient.email,
            success: result.success,
            error: result.error
          });

          // Add delay between emails to avoid rate limiting
          await this.delay(1000);
        } catch (error) {
          results.push({
            recipient: recipient.email,
            success: false,
            error: error.message
          });
        }
      }

      // Update campaign with results
      await this.updateCampaignResults(campaign.id, results);

      // Update status to completed
      await this.updateCampaignStatus(campaign.id, this.campaignStatuses.COMPLETED);

      Logger.info(`Campaign ${campaign.id} executed successfully`);
    } catch (error) {
      Logger.error(`Error executing campaign ${campaign.id}:`, error);
      throw error;
    }
  }

  /**
   * Update campaign status
   * @param {string} campaignId - Campaign ID
   * @param {string} status - New status
   */
  async updateCampaignStatus(campaignId, status) {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error updating campaign status:', error);
      throw error;
    }
  }

  /**
   * Update campaign results
   * @param {string} campaignId - Campaign ID
   * @param {Array} results - Execution results
   */
  async updateCampaignResults(campaignId, results) {
    try {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      const { error } = await supabase
        .from('email_campaigns')
        .update({
          emails_sent: successful,
          emails_failed: failed,
          execution_results: results,
          executed_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error updating campaign results:', error);
      throw error;
    }
  }

  /**
   * Get email campaigns for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   */
  async getEmailCampaigns(userId, filters = {}) {
    try {
      let query = supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error getting email campaigns:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Add delay for rate limiting
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get automation statistics
   * @param {string} userId - User ID
   */
  async getAutomationStats(userId) {
    try {
      const [scheduledEmails, rules, reminders, campaigns] = await Promise.all([
        this.getScheduledEmails(userId),
        this.getAutomationRules(userId),
        this.getFollowUpReminders(userId),
        this.getEmailCampaigns(userId)
      ]);

      return {
        scheduled_emails: {
          total: scheduledEmails.length,
          pending: scheduledEmails.filter(e => e.status === 'scheduled').length,
          sent: scheduledEmails.filter(e => e.status === 'sent').length,
          failed: scheduledEmails.filter(e => e.status === 'failed').length
        },
        automation_rules: {
          total: rules.length,
          active: rules.filter(r => r.is_active).length,
          inactive: rules.filter(r => !r.is_active).length
        },
        follow_up_reminders: {
          total: reminders.length,
          pending: reminders.filter(r => !r.is_completed).length,
          completed: reminders.filter(r => r.is_completed).length,
          overdue: reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < new Date()).length
        },
        campaigns: {
          total: campaigns.length,
          draft: campaigns.filter(c => c.status === this.campaignStatuses.DRAFT).length,
          scheduled: campaigns.filter(c => c.status === this.campaignStatuses.SCHEDULED).length,
          running: campaigns.filter(c => c.status === this.campaignStatuses.RUNNING).length,
          completed: campaigns.filter(c => c.status === this.campaignStatuses.COMPLETED).length
        }
      };
    } catch (error) {
      Logger.error('Error getting automation stats:', error);
      throw error;
    }
  }
}

// Create and export singleton instance with lazy initialization
let emailAutomationServiceInstance = null;

export const getEmailAutomationService = () => {
  if (!emailAutomationServiceInstance) {
    emailAutomationServiceInstance = new EmailAutomationService();
  }
  return emailAutomationServiceInstance;
};

// Export default instance for backward compatibility
export default getEmailAutomationService();

// Also export the named instance for backward compatibility
export const emailAutomationService = getEmailAutomationService();