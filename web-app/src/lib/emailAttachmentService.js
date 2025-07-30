/**
 * Email Attachment Service
 * Handles file attachments for emails including upload, download, and validation
 */

import { supabase } from './supabaseClient';
import Logger from '@utils/Logger';

class EmailAttachmentService {
  constructor() {
    this.maxFileSize = 25 * 1024 * 1024; // 25MB
    this.maxAttachments = 5;
    this.allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
  }

  /**
   * Validate files before upload
   * @param {File[]} files - Files to validate
   * @returns {Object} Validation result
   */
  validateFiles(files) {
    const validFiles = [];
    const errors = [];

    // Check attachment limit
    if (files.length > this.maxAttachments) {
      errors.push(`Maximum ${this.maxAttachments} attachments allowed per email`);
      return { validFiles: [], errors };
    }

    files.forEach((file) => {
      // Check file type
      if (!this.allowedTypes.includes(file.type)) {
        errors.push(`File type "${file.type}" is not allowed for file "${file.name}"`);
        return;
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        errors.push(`File "${file.name}" exceeds maximum size limit of 25MB`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  }

  /**
   * Upload attachment to storage
   * @param {string} userId - User ID
   * @param {string} emailId - Email ID
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadAttachment(userId, emailId, file) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filePath = `attachments/${userId}/${emailId}/${filename}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('email-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Store attachment metadata in database
      const { data: dbData, error: dbError } = await supabase
        .from('email_attachments')
        .insert({
          email_id: emailId,
          user_id: userId,
          filename: file.name,
          original_filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('email-attachments')
          .remove([uploadData.path]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      return {
        success: true,
        data: dbData,
      };
    } catch (error) {
      Logger.error('Error uploading attachment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Download attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise<Object>} Download result
   */
  async downloadAttachment(attachmentId) {
    try {
      // Get attachment metadata
      const { data: attachment, error: metaError } = await supabase
        .from('email_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (metaError || !attachment) {
        throw new Error('Attachment not found');
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('email-attachments')
        .download(attachment.file_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      return {
        success: true,
        data: fileData,
        metadata: attachment,
      };
    } catch (error) {
      Logger.error('Error downloading attachment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachments for an email
   * @param {string} emailId - Email ID
   * @returns {Promise<Object>} Attachments list
   */
  async getEmailAttachments(emailId) {
    try {
      const { data, error } = await supabase
        .from('email_attachments')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error getting email attachments:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Delete attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAttachment(attachmentId) {
    try {
      // Get attachment metadata first
      const { data: attachment, error: metaError } = await supabase
        .from('email_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (metaError || !attachment) {
        throw new Error('Attachment not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('email-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        Logger.warn('Failed to delete file from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('email_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Error deleting attachment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachment public URL
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise<Object>} URL result
   */
  async getAttachmentUrl(attachmentId) {
    try {
      // Get attachment metadata
      const { data: attachment, error: metaError } = await supabase
        .from('email_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (metaError || !attachment) {
        throw new Error('Attachment not found');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('email-attachments')
        .getPublicUrl(attachment.file_path);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
        },
      };
    } catch (error) {
      Logger.error('Error getting attachment URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload multiple attachments
   * @param {string} userId - User ID
   * @param {string} emailId - Email ID
   * @param {File[]} files - Files to upload
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleAttachments(userId, emailId, files) {
    try {
      // Validate files first
      const validation = this.validateFiles(files);
      if (validation.errors.length > 0) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Upload all valid files
      const uploadPromises = validation.validFiles.map(file =>
        this.uploadAttachment(userId, emailId, file)
      );

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: failed.length === 0,
        data: successful.map(r => r.data),
        errors: failed.map(r => r.error),
        uploaded: successful.length,
        failed: failed.length,
      };
    } catch (error) {
      Logger.error('Error uploading multiple attachments:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const emailAttachmentService = new EmailAttachmentService();
export default emailAttachmentService;