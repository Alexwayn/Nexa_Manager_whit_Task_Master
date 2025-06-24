import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

/**
 * Receipt Upload Service
 * Manages receipt upload, storage, and management for expense tracking
 * Features: file validation, cloud storage, metadata management, and analytics
 */

class ReceiptUploadService {
  constructor() {
    this.bucketName = 'receipts';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  }

  // ==================== FILE VALIDATION ====================

  /**
   * Validates a file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result with errors and file info
   */
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File is too large. Maximum size: ${this.formatFileSize(this.maxFileSize)}`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      errors.push('Unsupported file type. Allowed formats: JPEG, PNG, WebP, PDF');
    }

    // Check file name length
    if (file.name.length > 100) {
      errors.push('File name is too long (maximum 100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        formattedSize: this.formatFileSize(file.size),
      },
    };
  }

  /**
   * Formats file size in human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ==================== FILE UPLOAD ====================

  /**
   * Uploads a receipt to cloud storage
   * @param {File} file - File to upload
   * @param {string} expenseId - Associated expense ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with file details
   */
  async uploadReceipt(file, expenseId, metadata = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Generate unique file name
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${expenseId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `expenses/${expenseId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            originalName: file.name,
            expenseId: expenseId,
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        });

      if (uploadError) {
        Logger.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      // Save metadata to database
      const receiptRecord = {
        expense_id: expenseId,
        file_name: fileName,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl,
        upload_date: new Date().toISOString(),
        metadata: metadata,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('expense_receipts')
        .insert([receiptRecord])
        .select()
        .single();

      if (dbError) {
        // If database insert fails, remove uploaded file
        await this.deleteFile(filePath);
        Logger.error('Database error:', dbError);
        return { success: false, error: dbError.message };
      }

      return {
        success: true,
        data: {
          id: dbData.id,
          fileName: fileName,
          originalName: file.name,
          filePath: filePath,
          publicUrl: urlData.publicUrl,
          fileSize: file.size,
          fileType: file.type,
          uploadDate: dbData.upload_date,
        },
      };
    } catch (error) {
      Logger.error('Error uploading receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Uploads multiple receipts in batch
   * @param {FileList} files - List of files to upload
   * @param {string} expenseId - Associated expense ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Batch upload results
   */
  async uploadMultipleReceipts(files, expenseId, metadata = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadReceipt(file, expenseId, {
        ...metadata,
        batchIndex: i,
        totalFiles: files.length,
      });

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          fileName: file.name,
          error: result.error || result.errors?.join(', '),
        });
      }
    }

    return {
      success: results.length > 0,
      uploadedCount: results.length,
      errorCount: errors.length,
      totalFiles: files.length,
      results,
      errors,
    };
  }

  // ==================== FILE MANAGEMENT ====================

  /**
   * Gets all receipts for an expense
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Object>} List of receipts
   */
  async getReceiptsByExpense(expenseId) {
    try {
      const { data, error } = await supabase
        .from('expense_receipts')
        .select('*')
        .eq('expense_id', expenseId)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      Logger.error('Error fetching receipts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets a specific receipt by ID
   * @param {string} receiptId - Receipt ID
   * @returns {Promise<Object>} Receipt data
   */
  async getReceipt(receiptId) {
    try {
      const { data, error } = await supabase
        .from('expense_receipts')
        .select('*')
        .eq('id', receiptId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      Logger.error('Error fetching receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes a receipt and its associated file
   * @param {string} receiptId - Receipt ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReceipt(receiptId) {
    try {
      // Get receipt data
      const receiptResult = await this.getReceipt(receiptId);
      if (!receiptResult.success) {
        return { success: false, error: 'Receipt not found' };
      }

      const receipt = receiptResult.data;

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([receipt.file_path]);

      if (storageError) {
        Logger.error('Storage deletion error:', storageError);
        // Continue with database deletion anyway
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('expense_receipts')
        .delete()
        .eq('id', receiptId);

      if (dbError) throw dbError;

      return { success: true, message: 'Receipt deleted successfully' };
    } catch (error) {
      Logger.error('Error deleting receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes all receipts for an expense
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReceiptsByExpense(expenseId) {
    try {
      // Get all receipts for the expense
      const receiptsResult = await this.getReceiptsByExpense(expenseId);
      if (!receiptsResult.success) {
        return { success: false, error: 'Error retrieving receipts' };
      }

      const receipts = receiptsResult.data;
      if (receipts.length === 0) {
        return { success: true, message: 'No receipts to delete' };
      }

      // Delete all files from storage
      const filePaths = receipts.map((receipt) => receipt.file_path);
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (storageError) {
        Logger.error('Storage deletion error:', storageError);
        // Continue with database deletion anyway
      }

      // Delete all records from database
      const { error: dbError } = await supabase
        .from('expense_receipts')
        .delete()
        .eq('expense_id', expenseId);

      if (dbError) throw dbError;

      return {
        success: true,
        message: `${receipts.length} receipts deleted successfully`,
      };
    } catch (error) {
      Logger.error('Error deleting receipts by expense:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletes a file from storage (internal utility)
   * @param {string} filePath - File path to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage.from(this.bucketName).remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      Logger.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generates a temporary download URL for a receipt
   * @param {string} filePath - File path
   * @param {number} expiresIn - Validity in seconds (default: 1 hour)
   * @returns {Promise<Object>} Download URL
   */
  async getDownloadUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;

      return { success: true, url: data.signedUrl };
    } catch (error) {
      Logger.error('Error creating download URL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets upload statistics for files
   * @param {string} expenseId - Expense ID (optional)
   * @returns {Promise<Object>} Upload statistics
   */
  async getUploadStats(expenseId = null) {
    try {
      let query = supabase.from('expense_receipts').select('file_size, file_type, upload_date');

      if (expenseId) {
        query = query.eq('expense_id', expenseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalFiles: data.length,
        totalSize: data.reduce((sum, receipt) => sum + receipt.file_size, 0),
        formattedTotalSize: this.formatFileSize(
          data.reduce((sum, receipt) => sum + receipt.file_size, 0),
        ),
        fileTypes: {},
        uploadsByMonth: {},
      };

      // Group by file type
      data.forEach((receipt) => {
        const type = receipt.file_type;
        if (!stats.fileTypes[type]) {
          stats.fileTypes[type] = { count: 0, size: 0 };
        }
        stats.fileTypes[type].count += 1;
        stats.fileTypes[type].size += receipt.file_size;
      });

      // Group by upload month
      data.forEach((receipt) => {
        const month = new Date(receipt.upload_date).toISOString().slice(0, 7);
        if (!stats.uploadsByMonth[month]) {
          stats.uploadsByMonth[month] = 0;
        }
        stats.uploadsByMonth[month] += 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      Logger.error('Error getting upload stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifies if bucket exists and creates necessary policies
   * @returns {Promise<Object>} Setup result
   */
  async setupStorage() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) throw listError;

      const bucketExists = buckets.some((bucket) => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: this.allowedTypes,
          fileSizeLimit: this.maxFileSize,
        });

        if (createError) throw createError;
      }

      return { success: true, message: 'Storage configured successfully' };
    } catch (error) {
      Logger.error('Error setting up storage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compresses an image before upload
   * @param {File} file - Image file to compress
   * @param {number} quality - Compression quality (0-1)
   * @param {number} maxWidth - Maximum width
   * @returns {Promise<File>} Compressed file
   */
  async compressImage(file, quality = 0.8, maxWidth = 1920) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality,
        );
      };

      img.onerror = () => reject(new Error('Error loading image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Gets the appropriate icon type for a file
   * @param {string} fileType - MIME type of the file
   * @returns {string} Icon name
   */
  getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
      return 'photo';
    } else if (fileType === 'application/pdf') {
      return 'document-text';
    } else {
      return 'document';
    }
  }

  /**
   * Checks if a file is an image
   * @param {string} fileType - MIME type of the file
   * @returns {boolean} True if file is an image
   */
  isImage(fileType) {
    return fileType.startsWith('image/');
  }

  /**
   * Checks if a file is a PDF
   * @param {string} fileType - MIME type of the file
   * @returns {boolean} True if file is a PDF
   */
  isPDF(fileType) {
    return fileType === 'application/pdf';
  }
}

// Export singleton instance of the service
const receiptUploadService = new ReceiptUploadService();
export default receiptUploadService;
