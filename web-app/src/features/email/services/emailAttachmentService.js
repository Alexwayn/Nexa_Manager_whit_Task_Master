import Logger from '@/utils/Logger';

class EmailAttachmentService {
  constructor() {
    // Attachment configuration
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      maxTotalSize: 25 * 1024 * 1024, // 25MB total
      maxFiles: 10,
      allowedTypes: [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
      ],
      bannedExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'],
    };

    this.attachments = new Map(); // Temporary storage for attachments
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    const errors = [];

    // Check file exists
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File too large. Maximum size: ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed: ${file.type}`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (this.config.bannedExtensions.includes(extension.toLowerCase())) {
      errors.push(`File extension not allowed: ${extension}`);
    }

    // Check filename
    if (!this.isValidFilename(file.name)) {
      errors.push('Invalid filename. Use only alphanumeric characters, spaces, dots, and dashes.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files, existingAttachments = []) {
    const errors = [];
    const validFiles = [];

    const totalFiles = files.length + existingAttachments.length;
    if (totalFiles > this.config.maxFiles) {
      errors.push(`Too many files. Maximum: ${this.config.maxFiles}`);
      return { valid: false, errors, validFiles };
    }

    let totalSize = existingAttachments.reduce((sum, att) => sum + att.size, 0);

    for (const file of files) {
      const validation = this.validateFile(file);

      if (validation.valid) {
        totalSize += file.size;

        if (totalSize > this.config.maxTotalSize) {
          errors.push(
            `Total attachment size too large. Maximum: ${this.formatFileSize(this.config.maxTotalSize)}`,
          );
          break;
        }

        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      validFiles,
    };
  }

  /**
   * Upload and process attachment
   */
  async uploadAttachment(file, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Generate unique ID for attachment
      const attachmentId = this.generateAttachmentId();

      // Read file content
      const content = await this.readFileContent(file);

      // Create attachment object
      const attachment = {
        id: attachmentId,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        content: content,
        uploadedAt: new Date().toISOString(),
        checksum: await this.calculateChecksum(content),
        metadata: {
          lastModified: file.lastModified,
          webkitRelativePath: file.webkitRelativePath || '',
          ...options.metadata,
        },
      };

      // Store temporarily (in production, upload to cloud storage)
      this.attachments.set(attachmentId, attachment);

      Logger.info('Attachment uploaded successfully', {
        id: attachmentId,
        name: file.name,
        size: file.size,
      });

      return {
        success: true,
        data: {
          id: attachmentId,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          uploadedAt: attachment.uploadedAt,
        },
      };
    } catch (error) {
      Logger.error('Failed to upload attachment', {
        fileName: file.name,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload multiple attachments
   */
  async uploadAttachments(files, existingAttachments = []) {
    try {
      // Validate all files first
      const validation = this.validateFiles(files, existingAttachments);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join('; '),
        };
      }

      const results = [];
      const errors = [];

      // Upload each valid file
      for (const file of validation.validFiles) {
        const result = await this.uploadAttachment(file);

        if (result.success) {
          results.push(result.data);
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      }

      return {
        success: errors.length === 0,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      Logger.error('Failed to upload attachments', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachment by ID
   */
  getAttachment(attachmentId) {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment) {
      return {
        success: false,
        error: 'Attachment not found',
      };
    }

    return {
      success: true,
      data: attachment,
    };
  }

  /**
   * Delete attachment
   */
  deleteAttachment(attachmentId) {
    try {
      if (!this.attachments.has(attachmentId)) {
        return {
          success: false,
          error: 'Attachment not found',
        };
      }

      this.attachments.delete(attachmentId);

      Logger.info('Attachment deleted', { id: attachmentId });

      return {
        success: true,
        message: 'Attachment deleted successfully',
      };
    } catch (error) {
      Logger.error('Failed to delete attachment', {
        id: attachmentId,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachments for email sending
   */
  prepareAttachmentsForEmail(attachmentIds) {
    try {
      const attachments = [];
      const missing = [];

      for (const id of attachmentIds) {
        const attachment = this.attachments.get(id);
        if (attachment) {
          attachments.push({
            filename: attachment.name,
            content: attachment.content,
            contentType: attachment.type,
            size: attachment.size,
          });
        } else {
          missing.push(id);
        }
      }

      if (missing.length > 0) {
        return {
          success: false,
          error: `Missing attachments: ${missing.join(', ')}`,
        };
      }

      return {
        success: true,
        data: attachments,
      };
    } catch (error) {
      Logger.error('Failed to prepare attachments for email', {
        attachmentIds,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clean up old attachments
   */
  cleanupAttachments(maxAge = 24 * 60 * 60 * 1000) {
    // 24 hours default
    try {
      const now = Date.now();
      const cleaned = [];

      for (const [id, attachment] of this.attachments.entries()) {
        const uploadTime = new Date(attachment.uploadedAt).getTime();
        if (now - uploadTime > maxAge) {
          this.attachments.delete(id);
          cleaned.push(id);
        }
      }

      Logger.info('Cleaned up old attachments', { count: cleaned.length });

      return {
        success: true,
        cleaned: cleaned.length,
      };
    } catch (error) {
      Logger.error('Failed to cleanup attachments', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get attachment statistics
   */
  getAttachmentStats() {
    try {
      const attachments = Array.from(this.attachments.values());

      const stats = {
        totalCount: attachments.length,
        totalSize: attachments.reduce((sum, att) => sum + att.size, 0),
        typeBreakdown: {},
        averageSize: 0,
        oldestUpload: null,
        newestUpload: null,
      };

      if (attachments.length > 0) {
        // Type breakdown
        attachments.forEach(att => {
          const type = att.type || 'unknown';
          stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
        });

        // Average size
        stats.averageSize = stats.totalSize / attachments.length;

        // Date range
        const uploadDates = attachments.map(att => new Date(att.uploadedAt));
        stats.oldestUpload = new Date(Math.min(...uploadDates)).toISOString();
        stats.newestUpload = new Date(Math.max(...uploadDates)).toISOString();
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      Logger.error('Failed to get attachment stats', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Utility methods

  generateAttachmentId() {
    return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        // Convert to base64 for storage
        const base64 = btoa(
          new Uint8Array(reader.result).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            '',
          ),
        );
        resolve(base64);
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async calculateChecksum(content) {
    // Simple checksum for file integrity
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.'));
  }

  isValidFilename(filename) {
    // Allow alphanumeric, spaces, dots, dashes, underscores
    const validPattern = /^[a-zA-Z0-9\s\.\-_()]+$/;
    return validPattern.test(filename) && filename.length <= 255;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get configuration
   */
  getConfig() {
    return {
      ...this.config,
      maxFileSizeFormatted: this.formatFileSize(this.config.maxFileSize),
      maxTotalSizeFormatted: this.formatFileSize(this.config.maxTotalSize),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    Logger.info('Attachment configuration updated', { config: this.config });
  }
}

let emailAttachmentServiceInstance = null;

export const getEmailAttachmentService = () => {
  if (!emailAttachmentServiceInstance) {
    emailAttachmentServiceInstance = new EmailAttachmentService();
  }
  return emailAttachmentServiceInstance;
};

export default getEmailAttachmentService;
