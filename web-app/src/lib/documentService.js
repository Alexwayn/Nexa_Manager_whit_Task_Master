import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { storageService } from '@lib/storageService';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class DocumentService
 * @description Comprehensive service for managing all document types in the system.
 * Supports: invoices, quotes, receipts, reports, contracts, templates.
 */
class DocumentService {
  constructor() {
    this.bucketName = 'documents';
    this.supportedTypes = ['invoice', 'quote', 'receipt', 'report', 'contract', 'template'];
    this.supportedFormats = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'txt'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Creates a new document record in the database.
   * @param {Object} documentData - The data for the new document.
   * @param {string} documentData.name - The name of the document.
   * @param {string} documentData.type - The type of document (e.g., 'invoice', 'quote').
   * @param {string} documentData.createdBy - The ID of the user creating the document.
   * @param {string} [documentData.description] - A description of the document.
   * @param {string} [documentData.filePath] - The storage path of the associated file.
   * @param {string} [documentData.fileName] - The name of the associated file.
   * @param {number} [documentData.fileSize] - The size of the associated file in bytes.
   * @param {string} [documentData.mimeType] - The MIME type of the associated file.
   * @param {string} [documentData.documentNumber] - An official number for the document.
   * @param {string} [documentData.relatedEntityId] - The ID of a related entity (e.g., client, project).
   * @param {string} [documentData.relatedEntityType] - The type of the related entity.
   * @param {Array<string>} [documentData.tags] - A list of tags for categorization.
   * @param {Object} [documentData.metadata] - Any extra metadata.
   * @param {boolean} [documentData.isTemplate=false] - Whether this document is a template.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} The result of the creation operation.
   */
  async createDocument(documentData) {
    try {
      // Validate document data
      const validation = this._validateDocumentData(documentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Prepare document record
      const documentRecord = {
        name: documentData.name,
        type: documentData.type,
        description: documentData.description || null,
        file_path: documentData.filePath || null,
        file_name: documentData.fileName || null,
        file_size: documentData.fileSize || null,
        mime_type: documentData.mimeType || null,
        document_number: documentData.documentNumber || null,
        related_entity_id: documentData.relatedEntityId || null,
        related_entity_type: documentData.relatedEntityType || null,
        tags: documentData.tags || [],
        metadata: documentData.metadata || {},
        version: 1,
        is_template: documentData.isTemplate || false,
        is_active: true,
        created_by: documentData.createdBy,
        updated_by: documentData.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert document record
      const { data, error } = await supabase
        .from('documents')
        .insert([documentRecord])
        .select()
        .single();

      if (error) {
        Logger.error('Error creating document:', error);
        return {
          success: false,
          error: `Failed to create document: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      Logger.error('Error in createDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves a single document by its ID.
   * @param {string} documentId - The unique identifier of the document.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} The document data or an error.
   */
  async getDocument(documentId) {
    try {
      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required',
        };
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('is_active', true)
        .single();

      if (error) {
        Logger.error('Error fetching document:', error);
        return {
          success: false,
          error: `Failed to fetch document: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      Logger.error('Error in getDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves a list of documents with optional filtering and pagination.
   * @param {Object} [filters={}] - An object containing filter criteria.
   * @param {string} [filters.type] - Filter by document type.
   * @param {string} [filters.relatedEntityType] - Filter by the type of related entity.
   * @param {string} [filters.relatedEntityId] - Filter by the ID of the related entity.
   * @param {boolean} [filters.isTemplate] - Filter for templates.
   * @param {Array<string>} [filters.tags] - Filter by tags (must contain all specified tags).
   * @param {string} [filters.dateFrom] - ISO 8601 date string to filter documents created on or after.
   * @param {string} [filters.dateTo] - ISO 8601 date string to filter documents created on or before.
   * @param {string} [filters.search] - A search term to match against name and description.
   * @param {string} [filters.orderBy='created_at'] - The field to order by.
   * @param {string} [filters.orderDirection='desc'] - The direction of the ordering ('asc' or 'desc').
   * @param {number} [filters.limit] - The maximum number of documents to return.
   * @param {number} [filters.offset] - The number of documents to skip.
   * @returns {Promise<{success: boolean, data: Array<Object>, error: string|null}>} A list of documents or an error.
   */
  async getDocuments(filters = {}) {
    try {
      let query = supabase.from('documents').select('*').eq('is_active', true);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.relatedEntityType) {
        query = query.eq('related_entity_type', filters.relatedEntityType);
      }

      if (filters.relatedEntityId) {
        query = query.eq('related_entity_id', filters.relatedEntityId);
      }

      if (filters.isTemplate !== undefined) {
        query = query.eq('is_template', filters.isTemplate);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching documents:', error);
        return {
          success: false,
          error: `Failed to fetch documents: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error in getDocuments:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Updates an existing document record.
   * @param {string} documentId - The ID of the document to update.
   * @param {Object} updateData - An object containing the fields to update.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} The updated document data or an error.
   */
  async updateDocument(documentId, updateData) {
    try {
      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required for update',
        };
      }

      // Prepare update data
      const updatePayload = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Perform update
      const { data, error } = await supabase
        .from('documents')
        .update(updatePayload)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        Logger.error('Error updating document:', error);
        return {
          success: false,
          error: `Failed to update document: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      Logger.error('Error in updateDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Deletes a document record (soft delete).
   * @param {string} documentId - The ID of the document to delete.
   * @returns {Promise<{success: boolean, error: string|null}>} The result of the deletion operation.
   */
  async deleteDocument(documentId) {
    try {
      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required',
        };
      }

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('documents')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        Logger.error('Error deleting document:', error);
        return {
          success: false,
          error: `Failed to delete document: ${error.message}`,
        };
      }

      return {
        success: true,
        data, // Optionally return the 'deleted' record
      };
    } catch (error) {
      Logger.error('Error in deleteDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Uploads a file and creates a corresponding document record.
   * @param {File} file - The file to upload.
   * @param {Object} documentData - The data for the new document.
   * @param {string} documentData.name - The name of the document.
   * @param {string} documentData.type - The type of document (e.g., 'invoice', 'quote').
   * @param {string} [documentData.description] - A description of the document.
   * @param {string} [documentData.filePath] - The storage path of the associated file.
   * @param {string} [documentData.fileName] - The name of the associated file.
   * @param {number} [documentData.fileSize] - The size of the associated file in bytes.
   * @param {string} [documentData.mimeType] - The MIME type of the associated file.
   * @param {string} [documentData.documentNumber] - An official number for the document.
   * @param {string} [documentData.relatedEntityId] - The ID of a related entity (e.g., client, project).
   * @param {string} [documentData.relatedEntityType] - The type of the related entity.
   * @param {Array<string>} [documentData.tags] - A list of tags for categorization.
   * @param {Object} [documentData.metadata] - Any extra metadata.
   * @param {boolean} [documentData.isTemplate=false] - Whether this document is a template.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} The result of the upload operation.
   */
  async uploadDocument(file, documentData) {
    try {
      // Validate file
      const fileValidation = this._validateFile(file);
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error,
        };
      }

      // Generate unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `${documentData.type}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        Logger.error('Error uploading file:', uploadError);
        return {
          success: false,
          error: `Failed to upload file: ${uploadError.message}`,
        };
      }

      // Create document record with file information
      const documentRecord = {
        ...documentData,
        fileName: file.name,
        filePath: uploadData.path,
        fileSize: file.size,
        mimeType: file.type,
      };

      const documentResult = await this.createDocument(documentRecord);
      if (!documentResult.success) {
        // If document creation fails, try to clean up uploaded file
        await this._cleanupFile(uploadData.path);
        return documentResult;
      }

      return {
        success: true,
        data: {
          document: documentResult.data,
          fileUrl: await this.getDocumentUrl(documentResult.data.id),
        },
      };
    } catch (error) {
      Logger.error('Error in uploadDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves the public or signed URL for a document's file.
   * @param {string} documentId - The ID of the document.
   * @returns {Promise<string|null>} The URL of the document file or null on error.
   */
  async getDocumentUrl(documentId) {
    try {
      const documentResult = await this.getDocument(documentId);
      if (!documentResult.success || !documentResult.data.file_path) {
        return null;
      }

      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(documentResult.data.file_path);

      return data.publicUrl;
    } catch (error) {
      Logger.error('Error getting document URL:', error);
      return null;
    }
  }

  /**
   * Downloads the file associated with a document.
   * @param {string} documentId - The ID of the document to download.
   * @returns {Promise<{success: boolean, data: {blob: Blob, fileName: string, mimeType: string}|null, error: string|null}>} The file blob and metadata, or an error.
   */
  async downloadDocument(documentId) {
    try {
      const documentResult = await this.getDocument(documentId);
      if (!documentResult.success || !documentResult.data.file_path) {
        return {
          success: false,
          error: 'Document file not found',
        };
      }

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(documentResult.data.file_path);

      if (error) {
        Logger.error('Error downloading document:', error);
        return {
          success: false,
          error: `Failed to download document: ${error.message}`,
        };
      }

      return {
        success: true,
        data: {
          blob: data,
          fileName: documentResult.data.file_name,
          mimeType: documentResult.data.mime_type,
        },
      };
    } catch (error) {
      Logger.error('Error in downloadDocument:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Searches documents by a term, with optional filters.
   * @param {string} searchTerm - The term to search for.
   * @param {Object} [filters={}] - Additional filter criteria.
   * @returns {Promise<{success: boolean, data: Array<Object>, error: string|null}>} A list of matching documents.
   */
  async searchDocuments(searchTerm, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: searchTerm,
      };

      return await this.getDocuments(searchFilters);
    } catch (error) {
      Logger.error('Error in searchDocuments:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves statistics about the documents.
   * @param {Object} [filters={}] - Filters to apply before calculating statistics.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} An object containing document statistics.
   */
  async getDocumentStatistics(filters = {}) {
    try {
      let query = supabase
        .from('documents')
        .select('type, file_size, created_at')
        .eq('is_active', true);

      // Apply date filters if provided
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        Logger.error('Error fetching document statistics:', error);
        return {
          success: false,
          error: `Failed to fetch statistics: ${error.message}`,
        };
      }

      // Calculate statistics
      const stats = {
        totalDocuments: data.length,
        totalSize: data.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
        byType: {},
        recentDocuments: data.filter((doc) => {
          const docDate = new Date(doc.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return docDate >= weekAgo;
        }).length,
      };

      // Group by type
      data.forEach((doc) => {
        if (!stats.byType[doc.type]) {
          stats.byType[doc.type] = {
            count: 0,
            size: 0,
          };
        }
        stats.byType[doc.type].count++;
        stats.byType[doc.type].size += doc.file_size || 0;
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      Logger.error('Error in getDocumentStatistics:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Creates a new version of a document.
   * @param {string} originalDocumentId - The ID of the document to version.
   * @param {Object} versionData - The data for the new version document.
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} The result of the version creation operation.
   */
  async createDocumentVersion(originalDocumentId, versionData) {
    try {
      const originalResult = await this.getDocument(originalDocumentId);
      if (!originalResult.success) {
        return originalResult;
      }

      const original = originalResult.data;
      const newVersion = original.version + 1;

      // Create new version document
      const versionRecord = {
        ...versionData,
        name: `${original.name} (v${newVersion})`,
        type: original.type,
        related_entity_id: original.related_entity_id,
        related_entity_type: original.related_entity_type,
        version: newVersion,
        parent_document_id: originalDocumentId,
      };

      return await this.createDocument(versionRecord);
    } catch (error) {
      Logger.error('Error in createDocumentVersion:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves all versions of a document.
   * @param {string} documentId - The ID of the document to get versions for.
   * @returns {Promise<{success: boolean, data: Array<Object>, error: string|null}>} A list of document versions.
   */
  async getDocumentVersions(documentId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
        .eq('is_active', true)
        .order('version', { ascending: false });

      if (error) {
        Logger.error('Error fetching document versions:', error);
        return {
          success: false,
          error: `Failed to fetch versions: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      Logger.error('Error in getDocumentVersions:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Validates document data before creation.
   * @private
   * @param {Object} data - The document data to validate.
   * @returns {{isValid: boolean, error: string|null}} Validation result.
   */
  _validateDocumentData(data) {
    if (!data.name || data.name.trim() === '') {
      return { isValid: false, error: 'Document name is required' };
    }

    if (!data.type || !this.supportedTypes.includes(data.type)) {
      return {
        isValid: false,
        error: `Document type must be one of: ${this.supportedTypes.join(', ')}`,
      };
    }

    if (!data.createdBy) {
      return { isValid: false, error: 'Creator ID is required' };
    }

    return { isValid: true };
  }

  /**
   * Validates a file before upload.
   * @private
   * @param {File} file - The file to validate.
   * @returns {{isValid: boolean, error: string|null}} Validation result.
   */
  _validateFile(file) {
    if (!file) {
      return { isValid: false, error: 'File is required' };
    }

    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File format not supported. Allowed formats: ${this.supportedFormats.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Cleans up a file from storage, typically after a failed operation.
   * @private
   * @param {string} filePath - The path of the file to delete.
   */
  async _cleanupFile(filePath) {
    try {
      await supabase.storage.from(this.bucketName).remove([filePath]);
    } catch (error) {
      Logger.error('Error cleaning up file:', error);
    }
  }

  /**
   * Formats a file size in bytes into a human-readable string.
   * @param {number} bytes - The file size in bytes.
   * @returns {string} The formatted file size.
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gets a display-friendly name for a document type.
   * @param {string} type - The document type machine name (e.g., 'invoice').
   * @returns {string} The display name (e.g., 'Invoice').
   */
  getDocumentTypeDisplayName(type) {
    const typeNames = {
      invoice: 'Invoice',
      quote: 'Quote',
      receipt: 'Receipt',
      report: 'Report',
      contract: 'Contract',
      template: 'Template',
    };
    return typeNames[type] || type;
  }
}

// Create and export singleton instance
const documentService = new DocumentService();
export default documentService;
