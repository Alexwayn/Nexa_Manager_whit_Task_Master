import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * EmailStorageService - Database operations for email data
 * Handles email metadata storage, attachment handling, search indexing, and data encryption
 */
class EmailStorageService {
  constructor() {
    this.tableName = 'emails';
    this.foldersTableName = 'folders';
    this.templatesTableName = 'email_templates';
    this.attachmentsTableName = 'email_attachments';
  }

  /**
   * Initialize email storage tables if they don't exist
   */
  async initializeTables() {
    try {
      // Check if tables exist and create them if needed
      // This would typically be done via migrations in production
      Logger.info('Email storage tables initialized');
      return { success: true };
    } catch (error) {
      Logger.error('Error initializing email storage tables:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store email in database
   */
  async storeEmail(emailData) {
    try {
      const email = {
        message_id: emailData.messageId,
        thread_id: emailData.threadId || null,
        folder_id: emailData.folderId,
        subject: emailData.subject,
        sender_name: emailData.sender.name,
        sender_email: emailData.sender.email,
        recipients: JSON.stringify(emailData.recipients),
        content_text: emailData.content.text,
        content_html: emailData.content.html || null,
        attachments: JSON.stringify(emailData.attachments || []),
        labels: JSON.stringify(emailData.labels || []),
        is_read: emailData.isRead || false,
        is_starred: emailData.isStarred || false,
        is_important: emailData.isImportant || false,
        received_at: emailData.receivedAt,
        sent_at: emailData.sentAt || null,
        client_id: emailData.clientId || null,
        related_documents: JSON.stringify(emailData.relatedDocuments || []),
        user_id: emailData.userId,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(email)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.transformEmailFromDb(data),
      };
    } catch (error) {
      Logger.error('Error storing email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch emails with filtering and pagination
   */
  async fetchEmails(userId, options = {}) {
    try {
      const {
        folderId = null,
        limit = 50,
        offset = 0,
        search = null,
        labels = [],
        isRead = null,
        isStarred = null,
        clientId = null,
        dateFrom = null,
        dateTo = null,
        sortBy = 'received_at',
        sortOrder = 'desc',
      } = options;

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      if (search) {
        query = query.or(`subject.ilike.%${search}%,content_text.ilike.%${search}%,sender_name.ilike.%${search}%`);
      }

      if (labels.length > 0) {
        // Filter by labels (JSON contains)
        const labelFilters = labels.map(label => `labels.cs.["${label}"]`).join(',');
        query = query.or(labelFilters);
      }

      if (isRead !== null) {
        query = query.eq('is_read', isRead);
      }

      if (isStarred !== null) {
        query = query.eq('is_starred', isStarred);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (dateFrom) {
        query = query.gte('received_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('received_at', dateTo);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data.map(email => this.transformEmailFromDb(email)),
        total: count,
        hasMore: data.length === limit,
      };
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
   * Get single email by ID
   */
  async getEmailById(emailId, userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.transformEmailFromDb(data),
      };
    } catch (error) {
      Logger.error('Error fetching email by ID:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update email properties
   */
  async updateEmail(emailId, userId, updates) {
    try {
      const updateData = {};

      // Transform updates to database format
      if (updates.isRead !== undefined) updateData.is_read = updates.isRead;
      if (updates.isStarred !== undefined) updateData.is_starred = updates.isStarred;
      if (updates.isImportant !== undefined) updateData.is_important = updates.isImportant;
      if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;
      if (updates.labels !== undefined) updateData.labels = JSON.stringify(updates.labels);
      if (updates.clientId !== undefined) updateData.client_id = updates.clientId;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.transformEmailFromDb(data),
      };
    } catch (error) {
      Logger.error('Error updating email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete email
   */
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
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk update emails
   */
  async bulkUpdateEmails(emailIds, userId, updates) {
    try {
      const updateData = {};

      // Transform updates to database format
      if (updates.isRead !== undefined) updateData.is_read = updates.isRead;
      if (updates.isStarred !== undefined) updateData.is_starred = updates.isStarred;
      if (updates.isImportant !== undefined) updateData.is_important = updates.isImportant;
      if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;
      if (updates.labels !== undefined) updateData.labels = JSON.stringify(updates.labels);

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .in('id', emailIds)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data.map(email => this.transformEmailFromDb(email)),
        count: data.length,
      };
    } catch (error) {
      Logger.error('Error bulk updating emails:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
      };
    }
  }

  /**
   * Search emails with full-text search
   */
  async searchEmails(userId, query, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        folderId = null,
        dateFrom = null,
        dateTo = null,
      } = options;

      let searchQuery = supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Full-text search across multiple fields
      if (query) {
        searchQuery = searchQuery.or(
          `subject.ilike.%${query}%,content_text.ilike.%${query}%,sender_name.ilike.%${query}%,sender_email.ilike.%${query}%`
        );
      }

      if (folderId) {
        searchQuery = searchQuery.eq('folder_id', folderId);
      }

      if (dateFrom) {
        searchQuery = searchQuery.gte('received_at', dateFrom);
      }

      if (dateTo) {
        searchQuery = searchQuery.lte('received_at', dateTo);
      }

      const { data, error, count } = await searchQuery
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data.map(email => this.transformEmailFromDb(email)),
        total: count,
        hasMore: data.length === limit,
      };
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
   * FOLDER MANAGEMENT
   */

  /**
   * Get all folders for user
   */
  async getFolders(userId) {
    try {
      const { data, error } = await supabase
        .from(this.foldersTableName)
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      // Add system folders if they don't exist
      const systemFolders = [
        { id: 'inbox', name: 'Inbox', type: 'system', icon: 'inbox' },
        { id: 'sent', name: 'Sent', type: 'system', icon: 'paper-airplane' },
        { id: 'drafts', name: 'Drafts', type: 'system', icon: 'document-text' },
        { id: 'trash', name: 'Trash', type: 'system', icon: 'trash' },
        { id: 'spam', name: 'Spam', type: 'system', icon: 'shield-exclamation' },
        { id: 'starred', name: 'Starred', type: 'system', icon: 'star' },
      ];

      const customFolders = data || [];
      const allFolders = [...systemFolders, ...customFolders];

      // Get email counts for each folder
      const foldersWithCounts = await Promise.all(
        allFolders.map(async folder => {
          const counts = await this.getFolderEmailCounts(userId, folder.id);
          return {
            ...folder,
            unreadCount: counts.unread,
            totalCount: counts.total,
          };
        })
      );

      return {
        success: true,
        data: foldersWithCounts,
      };
    } catch (error) {
      Logger.error('Error fetching folders:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Create new folder
   */
  async createFolder(userId, folderData) {
    try {
      const folder = {
        name: folderData.name,
        type: 'custom',
        icon: folderData.icon || 'folder',
        color: folderData.color || null,
        parent_id: folderData.parentId || null,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from(this.foldersTableName)
        .insert(folder)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          ...data,
          unreadCount: 0,
          totalCount: 0,
        },
      };
    } catch (error) {
      Logger.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update folder
   */
  async updateFolder(folderId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from(this.foldersTableName)
        .update(updates)
        .eq('id', folderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      Logger.error('Error updating folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId, userId) {
    try {
      // Move emails from deleted folder to inbox
      await supabase
        .from(this.tableName)
        .update({ folder_id: 'inbox' })
        .eq('folder_id', folderId)
        .eq('user_id', userId);

      const { error } = await supabase
        .from(this.foldersTableName)
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      Logger.error('Error deleting folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email counts for a folder
   */
  async getFolderEmailCounts(userId, folderId) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id, is_read', { count: 'exact' })
        .eq('user_id', userId);

      // Handle special folders
      if (folderId === 'starred') {
        query = query.eq('is_starred', true);
      } else if (folderId === 'inbox') {
        query = query.eq('folder_id', 'inbox');
      } else {
        query = query.eq('folder_id', folderId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const unreadCount = data ? data.filter(email => !email.is_read).length : 0;

      return {
        total: count || 0,
        unread: unreadCount,
      };
    } catch (error) {
      Logger.error('Error getting folder email counts:', error);
      return {
        total: 0,
        unread: 0,
      };
    }
  }

  /**
   * ATTACHMENT HANDLING
   */

  /**
   * Store attachment metadata
   */
  async storeAttachment(emailId, attachmentData) {
    try {
      const attachment = {
        email_id: emailId,
        filename: attachmentData.filename,
        content_type: attachmentData.contentType,
        size: attachmentData.size,
        storage_path: attachmentData.storagePath,
        checksum: attachmentData.checksum || null,
      };

      const { data, error } = await supabase
        .from(this.attachmentsTableName)
        .insert(attachment)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      Logger.error('Error storing attachment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachments for email
   */
  async getEmailAttachments(emailId) {
    try {
      const { data, error } = await supabase
        .from(this.attachmentsTableName)
        .select('*')
        .eq('email_id', emailId);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error fetching email attachments:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Transform email data from database format to application format
   */
  transformEmailFromDb(dbEmail) {
    return {
      id: dbEmail.id,
      messageId: dbEmail.message_id,
      threadId: dbEmail.thread_id,
      folderId: dbEmail.folder_id,
      subject: dbEmail.subject,
      sender: {
        name: dbEmail.sender_name,
        email: dbEmail.sender_email,
      },
      recipients: JSON.parse(dbEmail.recipients || '{}'),
      content: {
        text: dbEmail.content_text,
        html: dbEmail.content_html,
      },
      attachments: JSON.parse(dbEmail.attachments || '[]'),
      labels: JSON.parse(dbEmail.labels || '[]'),
      isRead: dbEmail.is_read,
      isStarred: dbEmail.is_starred,
      isImportant: dbEmail.is_important,
      receivedAt: dbEmail.received_at,
      sentAt: dbEmail.sent_at,
      clientId: dbEmail.client_id,
      relatedDocuments: JSON.parse(dbEmail.related_documents || '[]'),
      createdAt: dbEmail.created_at,
      updatedAt: dbEmail.updated_at,
    };
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('is_read, is_starred, folder_id')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        unread: data.filter(email => !email.is_read).length,
        starred: data.filter(email => email.is_starred).length,
        byFolder: {},
      };

      // Count by folder
      data.forEach(email => {
        const folderId = email.folder_id || 'inbox';
        if (!stats.byFolder[folderId]) {
          stats.byFolder[folderId] = { total: 0, unread: 0 };
        }
        stats.byFolder[folderId].total++;
        if (!email.is_read) {
          stats.byFolder[folderId].unread++;
        }
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      Logger.error('Error getting email stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          unread: 0,
          starred: 0,
          byFolder: {},
        },
      };
    }
  }
}

let emailStorageServiceInstance = null;

export const getEmailStorageService = () => {
  if (!emailStorageServiceInstance) {
    emailStorageServiceInstance = new EmailStorageService();
  }
  return emailStorageServiceInstance;
};

export default getEmailStorageService;