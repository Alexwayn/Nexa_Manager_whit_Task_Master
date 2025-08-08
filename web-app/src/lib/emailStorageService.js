/**
 * Email Storage Service
 * Handles email data persistence and retrieval from the database
 */

import { supabase as supabaseClient } from './supabaseClient';
import logger from '@/utils/Logger';

export class EmailStorageService {
  /**
   * Fetch emails for a user
   * @param {string} userId - User ID
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Result with emails data
   */
  async fetchEmails(userId, options = {}) {
    try {
      // Validate user ID
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
          data: [],
          total: 0,
          hasMore: false
        };
      }

      const {
        folderId = 'inbox',
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc',
        isRead,
        isStarred
      } = options;

      let query = supabaseClient
        .from('emails')
        .select('*')
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (typeof isRead === 'boolean') {
        query = query.eq('is_read', isRead);
      }

      if (typeof isStarred === 'boolean') {
        query = query.eq('is_starred', isStarred);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch emails:', error);
        return {
          success: false,
          error: error.message,
          data: [],
          total: 0,
          hasMore: false
        };
      }

      const hasMore = count > offset + limit;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        hasMore
      };
    } catch (error) {
      logger.error('Error fetching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Store a new email
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data to store
   * @returns {Promise<Object>} Result with stored email data
   */
  async storeEmail(userId, emailData) {
    try {
      // Validate user ID
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // Validate email data
      if (!emailData || !emailData.subject || !emailData.sender_email) {
        return {
          success: false,
          error: 'Invalid email data: missing required fields'
        };
      }

      const emailRecord = {
        user_id: userId,
        message_id: emailData.messageId,
        subject: emailData.subject,
        sender_name: emailData.from?.name || '',
        sender_email: emailData.from?.email || emailData.from,
        recipient_email: emailData.to,
        html_content: emailData.html,
        text_content: emailData.text,
        folder_id: emailData.folderId || 'sent',
        is_read: false,
        is_starred: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('emails')
        .insert([emailRecord])
        .select()
        .single();

      if (error) {
        logger.error('Failed to store email:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error storing email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an email
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Result with updated email data
   */
  async updateEmail(emailId, userId, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('emails')
        .update(updates)
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update email:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error updating email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search emails
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Result with search results
   */
  async searchEmails(userId, query, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const { data, error, count } = await supabaseClient
        .from('emails')
        .select('*')
        .eq('user_id', userId)
        .or(`subject.ilike.%${query}%,text_content.ilike.%${query}%,sender_name.ilike.%${query}%,sender_email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to search emails:', error);
        return {
          success: false,
          error: error.message,
          data: [],
          total: 0,
          hasMore: false
        };
      }

      const hasMore = count > offset + limit;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        hasMore
      };
    } catch (error) {
      logger.error('Error searching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Delete an email
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result of deletion
   */
  async deleteEmail(emailId, userId) {
    try {
      const { error } = await supabaseClient
        .from('emails')
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete email:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      logger.error('Error deleting email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new folder
   * @param {string} userId - User ID
   * @param {Object} folderData - Folder data
   * @returns {Promise<Object>} Result with created folder
   */
  async createFolder(userId, folderData) {
    try {
      const folderRecord = {
        user_id: userId,
        name: folderData.name,
        icon: folderData.icon || 'folder',
        color: folderData.color || '#6B7280',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('email_folders')
        .insert([folderRecord])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create folder:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get folders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with folders
   */
  async getFolders(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('email_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to get folders:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      logger.error('Error getting folders:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

const emailStorageService = new EmailStorageService();
export default emailStorageService;
