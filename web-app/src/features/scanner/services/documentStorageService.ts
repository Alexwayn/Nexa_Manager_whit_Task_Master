// Document storage service implementation with Supabase integration
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';
import type { 
  DocumentStorageService as IDocumentStorageService, 
  ProcessedDocument, 
  DocumentFilters, 
  DocumentListResult,
  DocumentStatus 
} from '@/types/scanner';

export class DocumentStorageService implements IDocumentStorageService {
  private readonly BUCKET_NAME = 'scanner-documents';
  private readonly TEMP_BUCKET_NAME = 'scanner-temp';
  private readonly TABLE_NAME = 'scanned_documents';

  constructor() {
    this.initializeBuckets();
  }

  /**
   * Initialize storage buckets if they don't exist
   */
  private async initializeBuckets(): Promise<void> {
    try {
      // Check if buckets exist, create if they don't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketNames = buckets?.map(b => b.name) || [];

      if (!bucketNames.includes(this.BUCKET_NAME)) {
        await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 20971520 // 20MB
        });
      }

      if (!bucketNames.includes(this.TEMP_BUCKET_NAME)) {
        await supabase.storage.createBucket(this.TEMP_BUCKET_NAME, {
          public: false,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 20971520 // 20MB
        });
      }
    } catch (error) {
      Logger.error('Failed to initialize storage buckets:', error);
    }
  }

  async saveDocument(document: ProcessedDocument): Promise<string> {
    try {
      const documentId = document.id || this.generateId();
      const now = new Date().toISOString();

      // Prepare document data for database
      const documentData = {
        id: documentId,
        title: document.title,
        description: document.description || null,
        category: document.category,
        tags: document.tags,
        client_id: document.clientId || null,
        project_id: document.projectId || null,
        created_by: document.createdBy,
        original_file_url: document.originalFile.url,
        original_file_name: document.originalFile.name,
        original_file_size: document.originalFile.size,
        original_file_type: document.originalFile.type,
        enhanced_file_url: document.enhancedFile.url,
        enhanced_file_size: document.enhancedFile.size,
        pdf_file_url: document.pdfFile?.url || null,
        pdf_file_size: document.pdfFile?.size || null,
        text_content: document.textContent,
        ocr_confidence: document.ocrConfidence,
        ocr_language: document.ocrLanguage,
        status: document.status,
        processing_errors: document.processingErrors || null,
        sharing_settings: document.sharingSettings,
        access_log: document.accessLog || [],
        created_at: document.createdAt.toISOString(),
        updated_at: now
      };

      // Insert document into database
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert([documentData])
        .select()
        .single();

      if (error) {
        Logger.error('Failed to save document to database:', error);
        throw new Error(`Failed to save document: ${error.message}`);
      }

      // Log access
      await this.logAccess(documentId, document.createdBy, 'create');

      return documentId;
    } catch (error) {
      Logger.error('Failed to save document:', error);
      throw new Error('Failed to save document to storage');
    }
  }

  async getDocument(id: string): Promise<ProcessedDocument> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        Logger.error('Failed to get document from database:', error);
        throw new Error(`Document with id ${id} not found`);
      }

      if (!data) {
        throw new Error(`Document with id ${id} not found`);
      }

      // Convert database record to ProcessedDocument
      const document: ProcessedDocument = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        clientId: data.client_id,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        originalFile: {
          url: data.original_file_url,
          name: data.original_file_name,
          size: data.original_file_size,
          type: data.original_file_type
        },
        enhancedFile: {
          url: data.enhanced_file_url,
          size: data.enhanced_file_size
        },
        pdfFile: data.pdf_file_url ? {
          url: data.pdf_file_url,
          size: data.pdf_file_size
        } : undefined,
        textContent: data.text_content,
        ocrConfidence: data.ocr_confidence,
        ocrLanguage: data.ocr_language,
        status: data.status as DocumentStatus,
        processingErrors: data.processing_errors,
        sharingSettings: data.sharing_settings,
        accessLog: data.access_log || []
      };

      return document;
    } catch (error) {
      Logger.error('Failed to get document:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      // Get document to retrieve file paths for cleanup
      const document = await this.getDocument(id);

      // Delete files from storage
      await this.deleteDocumentFiles(document);

      // Delete document record from database
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        Logger.error('Failed to delete document from database:', error);
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Failed to delete document:', error);
      return false;
    }
  }

  async updateDocument(id: string, updates: Partial<ProcessedDocument>): Promise<ProcessedDocument> {
    try {
      const now = new Date().toISOString();

      // Prepare update data
      const updateData: any = {
        updated_at: now
      };

      // Map ProcessedDocument fields to database fields
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.clientId !== undefined) updateData.client_id = updates.clientId;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if (updates.textContent !== undefined) updateData.text_content = updates.textContent;
      if (updates.ocrConfidence !== undefined) updateData.ocr_confidence = updates.ocrConfidence;
      if (updates.ocrLanguage !== undefined) updateData.ocr_language = updates.ocrLanguage;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.processingErrors !== undefined) updateData.processing_errors = updates.processingErrors;
      if (updates.sharingSettings !== undefined) updateData.sharing_settings = updates.sharingSettings;
      if (updates.accessLog !== undefined) updateData.access_log = updates.accessLog;

      // Update file URLs if provided
      if (updates.originalFile) {
        updateData.original_file_url = updates.originalFile.url;
        updateData.original_file_name = updates.originalFile.name;
        updateData.original_file_size = updates.originalFile.size;
        updateData.original_file_type = updates.originalFile.type;
      }
      if (updates.enhancedFile) {
        updateData.enhanced_file_url = updates.enhancedFile.url;
        updateData.enhanced_file_size = updates.enhancedFile.size;
      }
      if (updates.pdfFile) {
        updateData.pdf_file_url = updates.pdfFile.url;
        updateData.pdf_file_size = updates.pdfFile.size;
      }

      // Update document in database
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        Logger.error('Failed to update document in database:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Document with id ${id} not found`);
      }

      // Return updated document
      return await this.getDocument(id);
    } catch (error) {
      Logger.error('Failed to update document:', error);
      throw error;
    }
  }

  async listDocuments(filters: DocumentFilters = {}): Promise<DocumentListResult> {
    try {
      let query = supabase.from(this.TABLE_NAME).select('*', { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      if (filters.searchText) {
        const searchTerm = `%${filters.searchText}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},text_content.ilike.${searchTerm}`);
      }

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const startIndex = (page - 1) * pageSize;

      query = query
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        Logger.error('Failed to list documents from database:', error);
        throw new Error(`Failed to retrieve documents: ${error.message}`);
      }

      // Convert database records to ProcessedDocument objects
      const documents: ProcessedDocument[] = (data || []).map(record => ({
        id: record.id,
        title: record.title,
        description: record.description,
        category: record.category,
        tags: record.tags || [],
        clientId: record.client_id,
        projectId: record.project_id,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
        createdBy: record.created_by,
        originalFile: {
          url: record.original_file_url,
          name: record.original_file_name,
          size: record.original_file_size,
          type: record.original_file_type
        },
        enhancedFile: {
          url: record.enhanced_file_url,
          size: record.enhanced_file_size
        },
        pdfFile: record.pdf_file_url ? {
          url: record.pdf_file_url,
          size: record.pdf_file_size
        } : undefined,
        textContent: record.text_content,
        ocrConfidence: record.ocr_confidence,
        ocrLanguage: record.ocr_language,
        status: record.status as DocumentStatus,
        processingErrors: record.processing_errors || undefined,
        sharingSettings: record.sharing_settings,
        accessLog: record.access_log || []
      }));

      return {
        documents,
        totalCount: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      Logger.error('Failed to list documents:', error);
      throw new Error('Failed to retrieve documents from storage');
    }
  }

  /**
   * Store file temporarily during processing
   */
  async storeTemporaryFile(file: Blob, fileName: string, userId: string): Promise<string> {
    try {
      const tempPath = `${userId}/${Date.now()}_${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(this.TEMP_BUCKET_NAME)
        .upload(tempPath, file, {
          cacheControl: '300', // 5 minutes cache
          upsert: false
        });

      if (error) {
        Logger.error('Failed to store temporary file:', error);
        throw new Error(`Failed to store temporary file: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      Logger.error('Failed to store temporary file:', error);
      throw error;
    }
  }

  /**
   * Move file from temporary to permanent storage
   */
  async moveToPermStorage(tempPath: string, permanentPath: string): Promise<string> {
    try {
      // Download from temp storage
      const { data: tempFile, error: downloadError } = await supabase.storage
        .from(this.TEMP_BUCKET_NAME)
        .download(tempPath);

      if (downloadError) {
        Logger.error('Failed to download temporary file:', downloadError);
        throw new Error(`Failed to download temporary file: ${downloadError.message}`);
      }

      // Upload to permanent storage
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(permanentPath, tempFile, {
          cacheControl: '31536000', // 1 year cache
          upsert: false
        });

      if (uploadError) {
        Logger.error('Failed to upload to permanent storage:', uploadError);
        throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`);
      }

      // Clean up temporary file
      await this.cleanupTemporaryFile(tempPath);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      Logger.error('Failed to move file to permanent storage:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTemporaryFile(tempPath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.TEMP_BUCKET_NAME)
        .remove([tempPath]);

      if (error) {
        Logger.error('Failed to cleanup temporary file:', error);
      }
    } catch (error) {
      Logger.error('Failed to cleanup temporary file:', error);
    }
  }

  /**
   * Clean up old temporary files (older than 1 hour)
   */
  async cleanupOldTemporaryFiles(): Promise<void> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.TEMP_BUCKET_NAME)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        Logger.error('Failed to list temporary files:', error);
        return;
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const filesToDelete = files
        ?.filter(file => new Date(file.created_at) < oneHourAgo)
        .map(file => file.name) || [];

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.TEMP_BUCKET_NAME)
          .remove(filesToDelete);

        if (deleteError) {
          Logger.error('Failed to delete old temporary files:', deleteError);
        } else {
          Logger.info(`Cleaned up ${filesToDelete.length} old temporary files`);
        }
      }
    } catch (error) {
      Logger.error('Failed to cleanup old temporary files:', error);
    }
  }

  /**
   * Delete all files associated with a document
   */
  private async deleteDocumentFiles(document: ProcessedDocument): Promise<void> {
    try {
      const filesToDelete: string[] = [];

      // Extract file paths from URLs
      if (document.originalFile.url) {
        const path = this.extractPathFromUrl(document.originalFile.url);
        if (path) filesToDelete.push(path);
      }

      if (document.enhancedFile.url) {
        const path = this.extractPathFromUrl(document.enhancedFile.url);
        if (path) filesToDelete.push(path);
      }

      if (document.pdfFile?.url) {
        const path = this.extractPathFromUrl(document.pdfFile.url);
        if (path) filesToDelete.push(path);
      }

      if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete);

        if (error) {
          Logger.error('Failed to delete document files:', error);
        }
      }
    } catch (error) {
      Logger.error('Failed to delete document files:', error);
    }
  }

  /**
   * Extract file path from Supabase storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      Logger.error('Failed to extract path from URL:', error);
      return null;
    }
  }

  /**
   * Log document access for audit trail
   */
  private async logAccess(documentId: string, userId: string, action: string, ipAddress?: string): Promise<void> {
    try {
      const accessEntry = {
        userId,
        action,
        timestamp: new Date(),
        ipAddress
      };

      // Get current document to append to access log
      const document = await this.getDocument(documentId);
      const updatedAccessLog = [...document.accessLog, accessEntry];

      await this.updateDocument(documentId, {
        accessLog: updatedAccessLog
      });
    } catch (error) {
      Logger.error('Failed to log document access:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(userId?: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    recentDocuments: number;
  }> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('category, status, original_file_size, enhanced_file_size, pdf_file_size, created_at');

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Failed to get document statistics:', error);
        throw new Error(`Failed to get statistics: ${error.message}`);
      }

      const stats = {
        totalDocuments: data?.length || 0,
        totalSize: 0,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        recentDocuments: 0
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      data?.forEach(doc => {
        // Calculate total size
        stats.totalSize += (doc.original_file_size || 0) + (doc.enhanced_file_size || 0) + (doc.pdf_file_size || 0);

        // Count by category
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;

        // Count by status
        stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

        // Count recent documents
        if (new Date(doc.created_at) >= oneWeekAgo) {
          stats.recentDocuments++;
        }
      });

      return stats;
    } catch (error) {
      Logger.error('Failed to get document statistics:', error);
      throw error;
    }
  }

  /**
   * Search documents with full-text search
   */
  async searchDocuments(searchQuery: string, filters: Omit<DocumentFilters, 'searchText'> = {}): Promise<DocumentListResult> {
    return this.listDocuments({
      ...filters,
      searchText: searchQuery
    });
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Helper method for testing
  public async clearAll(): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .neq('id', ''); // Delete all records

      if (error) {
        Logger.error('Failed to clear all documents:', error);
      }
    } catch (error) {
      Logger.error('Failed to clear all documents:', error);
    }
  }
}
