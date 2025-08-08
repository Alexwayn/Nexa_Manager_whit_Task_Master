import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

/**
 * EmailStorageService - Database operations for email data
 */
class EmailStorageService {
  constructor() {
    this.tableName = 'emails';
    this.foldersTableName = 'email_folders';
  }

  async storeEmail(emailData) {
    try {
      // Validate user ID
      if (!emailData.userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      // Validate email data
      if (!emailData || !emailData.subject || !emailData.sender_email) {
        return {
          success: false,
          error: 'Invalid email data'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.sender_email)) {
        return {
          success: false,
          error: 'Invalid email data'
        };
      }

      const email = {
        message_id: emailData.messageId || `msg-${Date.now()}`,
        subject: emailData.subject,
        sender_email: emailData.sender_email,
        sender_name: emailData.sender_name,
        recipient_email: emailData.recipient_email,
        html_content: emailData.html_content,
        text_content: emailData.text_content,
        user_id: emailData.userId,
        received_at: emailData.receivedAt || new Date().toISOString(),
        is_read: emailData.isRead || false,
        is_starred: emailData.isStarred || false,
        folder_id: emailData.folder_id || 'inbox'
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(email)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error storing email:', error);
      return { success: false, error: error.message };
    }
  }

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

      const { limit = 50, offset = 0, search } = options;

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (search) {
        query = query.textSearch('subject', search);
      }

      query = query
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        hasMore: data?.length === limit
      };
    } catch (error) {
      Logger.error('Error fetching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async getEmailById(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Email not found' };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching email by ID:', error);
      return { success: false, error: error.message };
    }
  }

  async updateEmail(emailId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error updating email:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteEmail(emailId, userId) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting email:', error);
      return { success: false, error: error.message };
    }
  }

  async getFolders(userId) {
    try {
      const { data, error } = await supabase
        .from(this.foldersTableName)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('Error fetching folders:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async createFolder(userId, folderData) {
    try {
      const folder = {
        ...folderData,
        user_id: userId
      };

      const { data, error } = await supabase
        .from(this.foldersTableName)
        .upsert(folder)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error creating folder:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkUpdateEmails(userId, emailIds, updates) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('user_id', userId)
        .in('id', emailIds)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error bulk updating emails:', error);
      return { success: false, error: error.message };
    }
  }

  async permanentlyDeleteEmail(userId, emailId) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error permanently deleting email:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreEmail(userId, emailId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_deleted: false })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error restoring email:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupDeletedEmails(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .lt('deleted_at', cutoffDate.toISOString());

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error cleaning up deleted emails:', error);
      return { success: false, error: error.message };
    }
  }

  async vacuumStorage(userId) {
    try {
      // This would typically call a database function to optimize storage
      const { data, error } = await supabase.rpc('vacuum_user_emails', {
        p_user_id: userId
      });

      if (error) throw error;

      return { success: true, data: { cleaned: true } };
    } catch (error) {
      Logger.error('Error vacuuming storage:', error);
      return { success: false, error: error.message };
    }
  }

  async getFolderStats(userId, folderId) {
    try {
      const { data, error } = await supabase.rpc('get_folder_stats', {
        p_user_id: userId,
        p_folder_id: folderId
      });

      if (error) throw error;

      return {
        success: true,
        data: data || { email_count: 0, unread_count: 0 }
      };
    } catch (error) {
      Logger.error('Error getting folder stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Folder management methods
  async updateFolder(userId, folderId, updateData) {
    try {
      const { data, error } = await supabase
        .from('email_folders')
        .update(updateData)
        .eq('id', folderId)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      Logger.error('Error updating folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFolder(userId, folderId) {
    try {
      const { error } = await supabase
        .from('email_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      Logger.error('Error deleting folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Label management methods
  async applyLabel(userId, emailId, labelId) {
    try {
      const { data, error } = await supabase
        .from('email_labels')
        .insert({
          email_id: emailId,
          label_id: labelId,
          user_id: userId
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      Logger.error('Error applying label:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async removeLabel(userId, emailId, labelId) {
    try {
      const { error } = await supabase
        .from('email_labels')
        .delete()
        .eq('email_id', emailId)
        .eq('label_id', labelId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      Logger.error('Error removing label:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getEmailLabels(userId, emailId) {
    try {
      const { data, error } = await supabase
        .from('email_labels')
        .select('*')
        .eq('email_id', emailId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      Logger.error('Error getting email labels:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Batch operations
  async batchUpdate(userId, emailIds, updateData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .in('id', emailIds)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: {
          updated: data ? data.length : 0
        }
      };
    } catch (error) {
      Logger.error('Error in batch update:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchDelete(userId, emailIds) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', emailIds)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        data: {
          deleted: emailIds.length
        }
      };
    } catch (error) {
      Logger.error('Error in batch delete:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async batchMoveToFolder(userId, emailIds, folderId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ folder_id: folderId })
        .in('id', emailIds)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: {
          moved: data ? data.length : 0
        }
      };
    } catch (error) {
      Logger.error('Error in batch move to folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Statistics and analytics
  async getEmailStats(userId) {
    try {
      const { data, error } = await supabase.rpc('get_email_stats', {
        p_user_id: userId
      });

      if (error) throw error;

      return {
        success: true,
        data: data || {
          total_emails: 0,
          unread_emails: 0,
          starred_emails: 0,
          deleted_emails: 0
        }
      };
    } catch (error) {
      Logger.error('Error getting email stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getEmails(userId, options = {}) {
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
    return this.fetchEmails(userId, options);
  }

  async searchEmails(userId, query, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      let searchQuery = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (query) {
        searchQuery = searchQuery.or(`subject.ilike.%${query}%,sender_email.ilike.%${query}%,text_content.ilike.%${query}%`);
      }

      searchQuery = searchQuery
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await searchQuery;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
        hasMore: data?.length === limit
      };
    } catch (error) {
      Logger.error('Error searching emails:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async markAsRead(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_read: true })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error marking email as read:', error);
      return { success: false, error: error.message };
    }
  }

  async markAsUnread(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_read: false })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error marking email as unread:', error);
      return { success: false, error: error.message };
    }
  }

  async starEmail(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_starred: true })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error starring email:', error);
      return { success: false, error: error.message };
    }
  }

  async unstarEmail(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ is_starred: false })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error unstarring email:', error);
      return { success: false, error: error.message };
    }
  }

  async moveToFolder(emailId, userId, folderId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ folder_id: folderId })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error moving email to folder:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let emailStorageServiceInstance = null;

const getEmailStorageService = () => {
  if (!emailStorageServiceInstance) {
    emailStorageServiceInstance = new EmailStorageService();
  }
  return emailStorageServiceInstance;
};

// Wrapper that matches test expectations
const emailStorageServiceWrapper = {
  async storeEmail(userId, emailData) {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    if (!emailData || !emailData.subject || !emailData.sender_email) {
      return { success: false, error: 'Invalid email data: missing required fields' };
    }
    try {
      const service = getEmailStorageService();
      return await service.storeEmail({ ...emailData, userId });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getEmails(userId, options = {}) {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required',
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      };
    }
    try {
      const service = getEmailStorageService();
      const result = await service.fetchEmails(userId, options);
      return {
        success: result.success,
        data: result.data || [],
        pagination: {
          total: result.total || 0,
          limit: options.limit || 50,
          offset: options.offset || 0,
          hasMore: result.hasMore || false
        },
        error: result.error
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        data: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      };
    }
  },

  async fetchEmails(userId, options = {}) {
    if (!userId) {
      return { 
        success: false, 
        error: 'User ID is required',
        data: [],
        total: 0,
        hasMore: false
      };
    }
    try {
      const service = getEmailStorageService();
      return await service.fetchEmails(userId, options);
    } catch (error) {
      return { success: false, error: error.message, data: [], total: 0, hasMore: false };
    }
  },

  async getEmailById(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.getEmailById(emailId, userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async updateEmail(emailId, userId, updates) {
    try {
      const service = getEmailStorageService();
      return await service.updateEmail(emailId, userId, updates);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async searchEmails(userId, query, options = {}) {
    try {
      const service = getEmailStorageService();
      return await service.searchEmails(userId, query, options);
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  async markAsRead(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.markAsRead(emailId, userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async markAsUnread(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.markAsUnread(emailId, userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async starEmail(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.starEmail(emailId, userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async unstarEmail(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.unstarEmail(emailId, userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async deleteEmail(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.updateEmail(emailId, userId, { 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async moveToFolder(emailId, userId, folderId) {
    try {
      const service = getEmailStorageService();
      return await service.moveToFolder(emailId, userId, folderId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getFolders(userId) {
    try {
      const service = getEmailStorageService();
      return await service.getFolders(userId);
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  async createFolder(userId, folderData) {
    try {
      const service = getEmailStorageService();
      return await service.createFolder(userId, folderData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async bulkUpdateEmails(userId, emailIds, updates) {
    try {
      const service = getEmailStorageService();
      return await service.bulkUpdateEmails(userId, emailIds, updates);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async permanentlyDeleteEmail(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.permanentlyDeleteEmail(userId, emailId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async restoreEmail(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.restoreEmail(userId, emailId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async cleanupDeletedEmails(userId, daysOld = 30) {
    try {
      const service = getEmailStorageService();
      return await service.cleanupDeletedEmails(userId, daysOld);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async vacuumStorage(userId) {
    try {
      const service = getEmailStorageService();
      return await service.vacuumStorage(userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getFolderStats(userId, folderId) {
    try {
      const service = getEmailStorageService();
      return await service.getFolderStats(userId, folderId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Folder management wrapper methods
  async updateFolder(userId, folderId, updateData) {
    try {
      const service = getEmailStorageService();
      return await service.updateFolder(userId, folderId, updateData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async deleteFolder(userId, folderId) {
    try {
      const service = getEmailStorageService();
      return await service.deleteFolder(userId, folderId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Label management wrapper methods
  async applyLabel(userId, emailId, labelId) {
    try {
      const service = getEmailStorageService();
      return await service.applyLabel(userId, emailId, labelId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async removeLabel(userId, emailId, labelId) {
    try {
      const service = getEmailStorageService();
      return await service.removeLabel(userId, emailId, labelId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getEmailLabels(userId, emailId) {
    try {
      const service = getEmailStorageService();
      return await service.getEmailLabels(userId, emailId);
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Batch operations wrapper methods
  async batchUpdate(userId, emailIds, updateData) {
    try {
      const service = getEmailStorageService();
      return await service.batchUpdate(userId, emailIds, updateData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async batchDelete(userId, emailIds) {
    try {
      const service = getEmailStorageService();
      return await service.batchDelete(userId, emailIds);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async batchMoveToFolder(userId, emailIds, folderId) {
    try {
      const service = getEmailStorageService();
      return await service.batchMoveToFolder(userId, emailIds, folderId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Statistics and analytics wrapper methods
  async getEmailStats(userId) {
    try {
      const service = getEmailStorageService();
      return await service.getEmailStats(userId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Named export for backward compatibility
export { getEmailStorageService };

// Default export is the wrapper
export default emailStorageServiceWrapper;
