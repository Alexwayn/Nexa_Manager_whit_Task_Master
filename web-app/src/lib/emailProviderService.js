/**
 * Email Provider Service
 * Handles sending emails through various email providers
 */

import { supabaseClient } from './supabaseClient';
import logger from '@/utils/Logger';

export class EmailProviderService {
  constructor() {
    this.providers = {
      smtp: this.sendViaSMTP.bind(this),
      sendgrid: this.sendViaSendGrid.bind(this),
      mailgun: this.sendViaMailgun.bind(this),
      ses: this.sendViaSES.bind(this)
    };
    
    // Default provider from environment or fallback to SMTP
    this.defaultProvider = process.env.EMAIL_PROVIDER || 'smtp';
  }

  /**
   * Send email using the configured provider
   * @param {Object} emailData - Email data
   * @param {string} provider - Optional provider override
   * @returns {Promise<Object>} Result with message ID
   */
  async sendEmail(emailData, provider = null) {
    try {
      // Validate email data
      const validation = this.validateEmailData(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid email data',
          details: validation.errors
        };
      }

      const selectedProvider = provider || this.defaultProvider;
      const providerFunction = this.providers[selectedProvider];

      if (!providerFunction) {
        return {
          success: false,
          error: `Unsupported email provider: ${selectedProvider}`
        };
      }

      const result = await providerFunction(emailData);
      
      if (result.success) {
        logger.info(`Email sent successfully via ${selectedProvider}`, {
          messageId: result.messageId,
          to: emailData.to,
          subject: emailData.subject
        });
      } else {
        logger.error(`Failed to send email via ${selectedProvider}:`, result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email via SMTP
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result
   */
  async sendViaSMTP(emailData) {
    try {
      // Mock SMTP implementation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider: 'smtp'
        };
      }

      // In a real implementation, you would use nodemailer or similar
      const messageId = `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId,
        provider: 'smtp'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'smtp'
      };
    }
  }

  /**
   * Send email via SendGrid
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result
   */
  async sendViaSendGrid(emailData) {
    try {
      // Mock SendGrid implementation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider: 'sendgrid'
        };
      }

      // In a real implementation, you would use @sendgrid/mail
      const messageId = `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId,
        provider: 'sendgrid'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid'
      };
    }
  }

  /**
   * Send email via Mailgun
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result
   */
  async sendViaMailgun(emailData) {
    try {
      // Mock Mailgun implementation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `mg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider: 'mailgun'
        };
      }

      // In a real implementation, you would use mailgun-js
      const messageId = `mg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId,
        provider: 'mailgun'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'mailgun'
      };
    }
  }

  /**
   * Send email via AWS SES
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result
   */
  async sendViaSES(emailData) {
    try {
      // Mock SES implementation for testing
      if (process.env.NODE_ENV === 'test') {
        return {
          success: true,
          messageId: `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          provider: 'ses'
        };
      }

      // In a real implementation, you would use aws-sdk
      const messageId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId,
        provider: 'ses'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'ses'
      };
    }
  }

  /**
   * Validate email data
   * @param {Object} emailData - Email data to validate
   * @returns {Object} Validation result
   */
  validateEmailData(emailData) {
    const errors = [];

    if (!emailData.to) {
      errors.push('Recipient email is required');
    } else if (!this.isValidEmail(emailData.to)) {
      errors.push('Invalid recipient email format');
    }

    if (!emailData.subject) {
      errors.push('Subject is required');
    }

    if (!emailData.html && !emailData.text) {
      errors.push('Email content (html or text) is required');
    }

    if (emailData.from && !this.isValidEmail(emailData.from)) {
      errors.push('Invalid sender email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get available providers
   * @returns {Array} List of available providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Set default provider
   * @param {string} provider - Provider name
   * @returns {boolean} Success
   */
  setDefaultProvider(provider) {
    if (this.providers[provider]) {
      this.defaultProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * Get current default provider
   * @returns {string} Default provider name
   */
  getDefaultProvider() {
    return this.defaultProvider;
  }
}

const emailProviderService = new EmailProviderService();
export default emailProviderService;
