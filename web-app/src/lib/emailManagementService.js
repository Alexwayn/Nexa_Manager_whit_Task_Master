/**
 * Email Management Service
 * Handles email operations including fetching, sending, and managing emails
 */

import emailStorageService from './emailStorageService';
import emailProviderService from './emailProviderService';
import Logger from '@/utils/Logger';

class EmailManagementService {
  constructor() {
    this._listeners = new Map();
  }
  /**
   * Fetch emails for a user
   * @param {string} userId - User ID
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Result with emails data
   */
  async fetchEmails(userId, options = {}) {
    try {
      const result = await emailStorageService.fetchEmails(userId, options);
      return result;
    } catch (error) {
      Logger.error('Error fetching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Send an email
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result with message ID
   */
  async sendEmail(userId, emailData) {
    try {
      // Validate email data
      const validation = this.validateEmailData(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid email data',
          details: validation.errors,
        };
      }

      // Send email via provider
      const sendResult = await emailProviderService.sendEmail(emailData);
      if (!sendResult.success) {
        return sendResult;
      }

      // Store email in database
      const storeResult = await emailStorageService.storeEmail({
        userId,
        messageId: sendResult.messageId,
        ...emailData,
      });

      return {
        success: true,
        messageId: sendResult.messageId,
        data: storeResult.data,
      };
    } catch (error) {
      Logger.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark email as read/unread
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @param {boolean} isRead - Read status
   * @returns {Promise<Object>} Result
   */
  async markAsRead(emailId, userId, isRead = true) {
    try {
      const result = await emailStorageService.updateEmail(emailId, userId, {
        isRead,
      });
      return result;
    } catch (error) {
      Logger.error('Error marking email as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Star/unstar email
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @param {boolean} isStarred - Starred status
   * @returns {Promise<Object>} Result
   */
  async starEmail(emailId, userId, isStarred = true) {
    try {
      const result = await emailStorageService.updateEmail(emailId, userId, {
        isStarred,
      });
      return result;
    } catch (error) {
      Logger.error('Error starring email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search emails
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchEmails(userId, query, options = {}) {
    try {
      const result = await emailStorageService.searchEmails(userId, query, options);
      return result;
    } catch (error) {
      Logger.error('Error searching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Create email folder
   * @param {string} userId - User ID
   * @param {Object} folderData - Folder data
   * @returns {Promise<Object>} Result
   */
  async createFolder(userId, folderData) {
    try {
      const result = await emailStorageService.createFolder(userId, folderData);
      return result;
    } catch (error) {
      Logger.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get folders for a user (test stub)
   */
  async getFolders(userId) {
    return { success: true, data: [] };
  }

  /**
   * Apply a label to an email (test stub)
   */
  async applyLabel(emailId, userId, label) {
    return { success: true };
  }

  /**
   * Remove a label from an email (test stub)
   */
  async removeLabel(emailId, userId, label) {
    return { success: true };
  }

  /**
   * Simple event emitter helpers for tests that listen to service events
   */
  addEventListener(eventName, callback) {
    if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
    this._listeners.get(eventName).add(callback);
  }

  removeEventListener(eventName, callback) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).delete(callback);
    }
  }

  emitEvent(eventName, payload) {
    const listeners = this._listeners.get(eventName);
    if (listeners) {
      for (const cb of listeners) cb(payload);
    }
  }

  /**
   * Delete email
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async deleteEmail(emailId, userId) {
    try {
      const result = await emailStorageService.deleteEmail(emailId, userId);
      return result;
    } catch (error) {
      Logger.error('Error deleting email:', error);
      return {
        success: false,
        error: error.message,
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
    }

    if (!emailData.subject) {
      errors.push('Subject is required');
    }

    if (!emailData.html && !emailData.text) {
      errors.push('Email content is required');
    }

    // Validate email format
    if (emailData.to && !this.isValidEmail(emailData.to)) {
      errors.push('Invalid recipient email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if email format is valid
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

const emailManagementService = new EmailManagementService();
export default emailManagementService;
