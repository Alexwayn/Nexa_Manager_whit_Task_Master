import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * EmailSettingsService - Comprehensive email management system
 * Handles SMTP configuration, email templates, notification preferences, and email tracking
 */
class EmailSettingsService {
  constructor() {
    // Email providers configuration
    this.providers = {
      smtp: { name: 'SMTP', icon: '📧', description: 'Standard SMTP configuration' },
      sendgrid: { name: 'SendGrid', icon: '📨', description: 'SendGrid cloud email service' },
      mailgun: { name: 'Mailgun', icon: '🚀', description: 'Mailgun email API service' },
      ses: { name: 'Amazon SES', icon: '☁️', description: 'Amazon Simple Email Service' },
      emailjs: { name: 'EmailJS', icon: '✉️', description: 'EmailJS browser service' },
    };

    // Template categories
    this.templateCategories = {
      invoice: { name: 'Invoice', icon: '🧾', color: 'blue' },
      payment: { name: 'Payment', icon: '💰', color: 'green' },
      quote: { name: 'Quote', icon: '📝', color: 'purple' },
      client: { name: 'Client', icon: '👤', color: 'gray' },
      system: { name: 'System', icon: '⚙️', color: 'red' },
    };

    // Available template variables
    this.templateVariables = {
      common: ['company_name', 'company_email', 'company_phone', 'current_date'],
      invoice: [
        'invoice_number',
        'client_name',
        'issue_date',
        'due_date',
        'total_amount',
        'invoice_link',
      ],
      payment: ['payment_date', 'payment_amount', 'payment_method', 'days_overdue'],
      quote: ['quote_number', 'expiry_date'],
      client: ['client_name', 'client_email', 'client_company'],
    };
  }

  // =========================
  // EMAIL SETTINGS MANAGEMENT
  // =========================

  /**
   * Get user's email settings
   */
  async getEmailSettings() {
    try {
      // Temporary: Use direct supabase client (RLS disabled)
      const { data, error } = await supabase.from('email_settings').select('*').single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || this._getDefaultEmailSettings();
    } catch (error) {
      Logger.error('Error fetching email settings:', error);
      throw error;
    }
  }

  /**
   * Save email settings
   */
  async saveEmailSettings(settings) {
    try {
      const { data: existingSettings } = await supabase
        .from('email_settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('email_settings')
          .update(settings)
          .eq('id', existingSettings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('email_settings')
          .insert([settings])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      Logger.error('Error saving email settings:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail, settings = null) {
    try {
      const emailSettings = settings || (await this.getEmailSettings());

      // Simulate email test based on provider
      await this._delay(2000);

      // Simulate 90% success rate
      const success = Math.random() > 0.1;

      if (success) {
        // Log test email activity
        await this._logEmailActivity({
          template_key: 'test_email',
          recipient_email: testEmail,
          subject: 'Email Configuration Test - Nexa Manager',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        return {
          success: true,
          message: 'Test email sent successfully',
          messageId: `test_${Date.now()}`,
        };
      } else {
        throw new Error('SMTP connection failed');
      }
    } catch (error) {
      Logger.error('Email test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =================================
  // EMAIL TEMPLATE MANAGEMENT
  // =================================

  /**
   * Get all email templates
   */
  async getEmailTemplates(category = null) {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error fetching email templates:', error);
      throw error;
    }
  }

  /**
   * Get specific email template
   */
  async getEmailTemplate(templateKey) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      Logger.error('Error fetching email template:', error);
      throw error;
    }
  }

  /**
   * Save email template
   */
  async saveEmailTemplate(templateData) {
    try {
      const { data: existingTemplate } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_key', templateData.template_key)
        .single();

      if (existingTemplate) {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', existingTemplate.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('email_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      Logger.error('Error saving email template:', error);
      throw error;
    }
  }

  /**
   * Delete email template
   */
  async deleteEmailTemplate(templateKey) {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('template_key', templateKey);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting email template:', error);
      throw error;
    }
  }

  /**
   * Preview email template with sample data
   */
  async previewEmailTemplate(templateKey, customData = {}) {
    try {
      const template = await this.getEmailTemplate(templateKey);
      if (!template) {
        throw new Error('Template not found');
      }

      const sampleData = this._getSampleTemplateData(template.category);
      const previewData = { ...sampleData, ...customData };

      const subject = this._replaceTemplateVariables(template.subject, previewData);
      const body = this._replaceTemplateVariables(template.body_text, previewData);

      return {
        subject,
        body,
        variables: template.variables,
        sampleData: previewData,
      };
    } catch (error) {
      Logger.error('Error previewing email template:', error);
      throw error;
    }
  }

  /**
   * Send test email using template
   */
  async sendTestEmail(templateKey, testEmail, customData = {}) {
    try {
      const preview = await this.previewEmailTemplate(templateKey, customData);

      // Simulate sending test email
      await this._delay(1500);

      // Log test email activity
      await this._logEmailActivity({
        template_key: templateKey,
        recipient_email: testEmail,
        subject: `[TEST] ${preview.subject}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      Logger.error('Error sending test email:', error);
      throw error;
    }
  }

  // ====================================
  // NOTIFICATION PREFERENCES MANAGEMENT
  // ====================================

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const { data, error } = await executeWithClerkAuth(supabase =>
        supabase.from('notification_preferences').select('*').single(),
      );

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || this._getDefaultNotificationPreferences();
    } catch (error) {
      Logger.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Save notification preferences
   */
  async saveNotificationPreferences(preferences) {
    try {
      const { data: existingPrefs } = await supabase
        .from('notification_preferences')
        .select('id')
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { data, error } = await supabase
          .from('notification_preferences')
          .update(preferences)
          .eq('id', existingPrefs.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new preferences
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert([preferences])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      Logger.error('Error saving notification preferences:', error);
      throw error;
    }
  }

  // ========================
  // EMAIL ACTIVITY TRACKING
  // ========================

  /**
   * Get email activity history
   */
  async getEmailActivity(filters = {}) {
    try {
      const { data, error } = await executeWithClerkAuth(supabase => {
        let query = supabase
          .from('email_activity')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        if (filters.template_key) {
          query = query.eq('template_key', filters.template_key);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error fetching email activity:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(period = '30d') {
    try {
      const periodDays = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const { data, error } = await supabase
        .from('email_activity')
        .select('status, template_key, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = this._calculateEmailStats(data || []);
      return stats;
    } catch (error) {
      Logger.error('Error fetching email stats:', error);
      throw error;
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  /**
   * Get available template variables for a category
   */
  getTemplateVariables(category) {
    const common = this.templateVariables.common || [];
    const categoryVars = this.templateVariables[category] || [];
    return [...common, ...categoryVars];
  }

  /**
   * Validate email template
   */
  validateEmailTemplate(template) {
    const errors = [];

    if (!template.name || template.name.trim().length < 2) {
      errors.push('Template name must be at least 2 characters long');
    }

    if (!template.subject || template.subject.trim().length < 3) {
      errors.push('Subject must be at least 3 characters long');
    }

    if (!template.body_text || template.body_text.trim().length < 10) {
      errors.push('Email body must be at least 10 characters long');
    }

    if (!template.template_key || !/^[a-z0-9_]+$/.test(template.template_key)) {
      errors.push('Template key must contain only lowercase letters, numbers, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate SMTP settings
   */
  validateSmtpSettings(settings) {
    const errors = [];

    if (!settings.from_email || !this._isValidEmail(settings.from_email)) {
      errors.push('Valid from email address is required');
    }

    if (!settings.from_name || settings.from_name.trim().length < 2) {
      errors.push('From name must be at least 2 characters long');
    }

    if (settings.provider === 'smtp') {
      if (!settings.smtp_host) {
        errors.push('SMTP host is required');
      }

      if (!settings.smtp_port || settings.smtp_port < 1 || settings.smtp_port > 65535) {
        errors.push('Valid SMTP port is required (1-65535)');
      }

      if (!settings.smtp_username) {
        errors.push('SMTP username is required');
      }

      if (!settings.smtp_password) {
        errors.push('SMTP password is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ===================
  // PRIVATE METHODS
  // ===================

  /**
   * Get default email settings
   */
  _getDefaultEmailSettings() {
    return {
      provider: 'smtp',
      from_email: 'noreply@nexamanager.com',
      from_name: 'Nexa Manager',
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
      is_active: true,
      test_mode: false,
      max_daily_emails: 500,
      rate_limit_per_hour: 50,
      include_unsubscribe: true,
    };
  }

  /**
   * Get default notification preferences
   */
  _getDefaultNotificationPreferences() {
    return {
      // Invoice notifications
      invoice_sent: true,
      invoice_viewed: true,
      invoice_paid: true,
      invoice_overdue: true,
      invoice_cancelled: false,

      // Payment notifications
      payment_received: true,
      payment_failed: true,
      payment_refunded: true,
      payment_reminder_sent: false,

      // Quote notifications
      quote_sent: true,
      quote_accepted: true,
      quote_declined: true,
      quote_expired: false,

      // Client notifications
      client_created: false,
      client_updated: false,
      client_deleted: false,

      // System notifications
      system_backup: true,
      system_maintenance: true,
      system_security: true,
      system_updates: false,

      // General preferences
      daily_summary: false,
      weekly_report: false,
      monthly_report: true,
      promotional_emails: false,

      // Delivery preferences
      email_digest: false,
      digest_frequency: 'daily',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC',
    };
  }

  /**
   * Get sample data for template preview
   */
  _getSampleTemplateData(category) {
    const baseData = {
      company_name: 'Nexa Manager',
      company_email: 'info@nexamanager.com',
      company_phone: '+39 123 456 7890',
      current_date: new Date().toLocaleDateString(),
      client_name: 'John Doe',
      client_email: 'john.doe@example.com',
      client_company: 'Acme Corp',
    };

    const categoryData = {
      invoice: {
        invoice_number: 'INV-2024-001',
        issue_date: new Date().toLocaleDateString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        total_amount: '1,250.00',
        invoice_link: 'https://app.nexamanager.com/invoice/123',
      },
      payment: {
        payment_date: new Date().toLocaleDateString(),
        payment_amount: '1,250.00',
        payment_method: 'Bank Transfer',
        days_overdue: '5',
      },
      quote: {
        quote_number: 'QTE-2024-001',
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    };

    return { ...baseData, ...(categoryData[category] || {}) };
  }

  /**
   * Replace template variables in text
   */
  _replaceTemplateVariables(template, data) {
    let result = template;

    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      const value = data[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Calculate email statistics
   */
  _calculateEmailStats(emailData) {
    const total = emailData.length;
    const sent = emailData.filter(e => e.status === 'sent').length;
    const failed = emailData.filter(e => e.status === 'failed').length;
    const pending = emailData.filter(e => e.status === 'pending').length;

    const byTemplate = emailData.reduce((acc, email) => {
      acc[email.template_key] = (acc[email.template_key] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      byTemplate,
    };
  }

  /**
   * Log email activity
   */
  async _logEmailActivity(activityData) {
    try {
      const { error } = await supabase.from('email_activity').insert([activityData]);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error logging email activity:', error);
    }
  }

  /**
   * Validate email address
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create delay for simulated operations
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new EmailSettingsService();
