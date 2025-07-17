import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';

// Translation function - to be integrated with i18n system
const t = (key: string, params?: Record<string, unknown>): string => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations: Record<string, string> = {
    'storage.error.uploadFile': 'Error uploading file to {{bucket}}',
    'storage.error.getPublicUrl': 'Error getting public URL for {{bucket}}/{{path}}',
    'storage.error.getSignedUrl': 'Error getting signed URL for {{bucket}}/{{path}}',
    'storage.error.deleteFile': 'Error deleting file {{bucket}}/{{path}}',
    'storage.error.listFiles': 'Error listing files in {{bucket}}',
    'storage.validation.fileSizeExceeds': 'File size exceeds {{maxSize}}MB limit',
    'storage.validation.fileTypeNotAllowed': 'File type {{fileType}} is not allowed',
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, String(params[param]));
    });
  }

  return translation;
};

// Type definitions for StorageService
interface UploadOptions {
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

interface UploadResult {
  success: boolean;
  data?: unknown;
  path?: string;
  url?: string | null;
  error?: string;
}

interface SignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface ListFilesOptions {
  limit?: number;
  offset?: number;
  sortBy?: {
    column: string;
    order: 'asc' | 'desc';
  };
}

interface ListFilesResult {
  success: boolean;
  files?: unknown[];
  error?: string;
}

interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

type SupportedBucket = 'documents' | 'receipts' | 'avatars';

// Storage service for handling file uploads and downloads
export class StorageService {
  // Upload a file to a specific bucket
  async uploadFile(
    bucket: string,
    file: File,
    path: string | null = null,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    try {
      // Generate a unique filename if path is not provided
      const fileName = path || `${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: options.upsert || false,
        ...options,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        path: fileName,
        url: await this.getPublicUrl(bucket, fileName),
      };
    } catch (error) {
      Logger.error(t('storage.error.uploadFile', { bucket }), error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Get public URL for a file
  async getPublicUrl(bucket: string, path: string): Promise<string | null> {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      Logger.error(t('storage.error.getPublicUrl', { bucket, path }), error);
      return null;
    }
  }

  // Get signed URL for private files
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600,
  ): Promise<SignedUrlResult> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return {
        success: true,
        url: data.signedUrl,
      };
    } catch (error) {
      Logger.error(t('storage.error.getSignedUrl', { bucket, path }), error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Delete a file
  async deleteFile(bucket: string, path: string): Promise<DeleteResult> {
    try {
      const { data, error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      Logger.error(t('storage.error.deleteFile', { bucket, path }), error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // List files in a bucket
  async listFiles(
    bucket: string,
    path: string = '',
    options: ListFilesOptions = {},
  ): Promise<ListFilesResult> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: 'name', order: 'asc' },
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        files: data,
      };
    } catch (error) {
      Logger.error(t('storage.error.listFiles', { bucket }), error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Upload avatar image
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    const fileName = `${userId}/avatar.${file.name.split('.').pop()}`;
    return this.uploadFile('avatars', file, fileName, { upsert: true });
  }

  // Upload document (invoice, quote, etc.)
  async uploadDocument(
    userId: string,
    file: File,
    type: string = 'general',
  ): Promise<UploadResult> {
    const fileName = `${userId}/${type}/${Date.now()}-${file.name}`;
    return this.uploadFile('documents', file, fileName);
  }

  // Upload receipt
  async uploadReceipt(userId: string, file: File): Promise<UploadResult> {
    const fileName = `${userId}/receipts/${Date.now()}-${file.name}`;
    return this.uploadFile('receipts', file, fileName);
  }

  // Validate file type and size
  validateFile(
    file: File,
    allowedTypes: string[] = [],
    maxSize: number = 10485760, // 10MB default
  ): FileValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(
        t('storage.validation.fileSizeExceeds', { maxSize: Math.round(maxSize / 1024 / 1024) }),
      );
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(t('storage.validation.fileTypeNotAllowed', { fileType: file.type }));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get file type restrictions
  getFileTypeRestrictions(bucket: SupportedBucket): string[] {
    const restrictions: Record<SupportedBucket, string[]> = {
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
      receipts: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };

    return restrictions[bucket] || [];
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();

// Helper functions for common operations
export const uploadAvatar = (userId: string, file: File): Promise<UploadResult> =>
  storageService.uploadAvatar(userId, file);

export const uploadDocument = (userId: string, file: File, type?: string): Promise<UploadResult> =>
  storageService.uploadDocument(userId, file, type);

export const uploadReceipt = (userId: string, file: File): Promise<UploadResult> =>
  storageService.uploadReceipt(userId, file);

export const validateFile = (file: File, bucket: SupportedBucket): FileValidationResult => {
  const allowedTypes = storageService.getFileTypeRestrictions(bucket);
  return storageService.validateFile(file, allowedTypes);
};

export default storageService;
