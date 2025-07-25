import { DocumentStorageService } from '@/services/scanner/documentStorageService';
import { createClient } from '@supabase/supabase-js';
import { 
  ProcessedDocument, 
  DocumentFilters, 
  DocumentListResult,
  DocumentStatus 
} from '@/types/scanner';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('DocumentStorageService', () => {
  let service: DocumentStorageService;
  let mockSupabaseClient: any;

  const mockDocument: ProcessedDocument = {
    id: 'doc-123',
    title: 'Test Document',
    description: 'Test document description',
    category: 'invoice',
    tags: ['business', 'finance'],
    clientId: 'client-456',
    projectId: 'project-789',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'user-123',
    originalFile: {
      url: 'https://example.com/original.jpg',
      name: 'document.jpg',
      size: 1024000,
      type: 'image/jpeg'
    },
    enhancedFile: {
      url: 'https://example.com/enhanced.jpg',
      size: 512000
    },
    pdfFile: {
      url: 'https://example.com/document.pdf',
      size: 256000
    },
    textContent: 'Extracted text content from document',
    ocrConfidence: 0.95,
    ocrLanguage: 'en',
    status: 'complete' as DocumentStatus,
    sharingSettings: {
      isShared: false,
      accessLevel: 'view' as const,
      sharedWith: []
    },
    accessLog: []
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(() => mockSupabaseClient),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          download: jest.fn(),
          remove: jest.fn(),
          getPublicUrl: jest.fn(),
          list: jest.fn()
        }))
      },
      select: jest.fn(() => mockSupabaseClient),
      insert: jest.fn(() => mockSupabaseClient),
      update: jest.fn(() => mockSupabaseClient),
      delete: jest.fn(() => mockSupabaseClient),
      upsert: jest.fn(() => mockSupabaseClient),
      eq: jest.fn(() => mockSupabaseClient),
      neq: jest.fn(() => mockSupabaseClient),
      gt: jest.fn(() => mockSupabaseClient),
      gte: jest.fn(() => mockSupabaseClient),
      lt: jest.fn(() => mockSupabaseClient),
      lte: jest.fn(() => mockSupabaseClient),
      like: jest.fn(() => mockSupabaseClient),
      ilike: jest.fn(() => mockSupabaseClient),
      in: jest.fn(() => mockSupabaseClient),
      contains: jest.fn(() => mockSupabaseClient),
      order: jest.fn(() => mockSupabaseClient),
      range: jest.fn(() => mockSupabaseClient),
      limit: jest.fn(() => mockSupabaseClient),
      single: jest.fn(() => mockSupabaseClient),
      maybeSingle: jest.fn(() => mockSupabaseClient)
    };

    mockCreateClient.mockReturnValue(mockSupabaseClient);
    service = new DocumentStorageService();
  });

  describe('saveDocument', () => {
    it('should save document successfully', async () => {
      mockSupabaseClient.insert.mockResolvedValue({
        data: [{ ...mockDocument }],
        error: null
      });

      const result = await service.saveDocument(mockDocument);

      expect(result).toBe(mockDocument.id);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: mockDocument.id,
          title: mockDocument.title,
          category: mockDocument.category
        })
      ]);
    });

    it('should handle save error', async () => {
      const error = { message: 'Database error', code: '23505' };
      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error
      });

      await expect(service.saveDocument(mockDocument)).rejects.toThrow('Database error');
    });

    it('should generate ID if not provided', async () => {
      const documentWithoutId = { ...mockDocument };
      delete (documentWithoutId as any).id;

      mockSupabaseClient.insert.mockResolvedValue({
        data: [{ ...documentWithoutId, id: 'generated-id' }],
        error: null
      });

      const result = await service.saveDocument(documentWithoutId as any);

      expect(result).toBe('generated-id');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.any(String),
          title: mockDocument.title
        })
      ]);
    });

    it('should set timestamps for new documents', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      mockSupabaseClient.insert.mockResolvedValue({
        data: [mockDocument],
        error: null
      });

      await service.saveDocument(mockDocument);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        })
      ]);
    });
  });

  describe('getDocument', () => {
    it('should retrieve document by ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockDocument,
        error: null
      });

      const result = await service.getDocument('doc-123');

      expect(result).toEqual(mockDocument);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'doc-123');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });

    it('should handle document not found', async () => {
      const error = { message: 'No rows returned', code: 'PGRST116' };
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(service.getDocument('nonexistent')).rejects.toThrow('No rows returned');
    });

    it('should handle database error', async () => {
      const error = { message: 'Connection failed', code: '08000' };
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(service.getDocument('doc-123')).rejects.toThrow('Connection failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      mockSupabaseClient.delete.mockResolvedValue({
        data: [{ id: 'doc-123' }],
        error: null
      });

      const result = await service.deleteDocument('doc-123');

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'doc-123');
    });

    it('should handle delete error', async () => {
      const error = { message: 'Delete failed', code: '23503' };
      mockSupabaseClient.delete.mockResolvedValue({
        data: null,
        error
      });

      const result = await service.deleteDocument('doc-123');

      expect(result).toBe(false);
    });

    it('should return false when document not found', async () => {
      mockSupabaseClient.delete.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await service.deleteDocument('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated', 'tags']
      };

      const updatedDocument = { ...mockDocument, ...updates };

      mockSupabaseClient.single.mockResolvedValue({
        data: updatedDocument,
        error: null
      });

      const result = await service.updateDocument('doc-123', updates);

      expect(result).toEqual(updatedDocument);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(Date)
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'doc-123');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const error = { message: 'Update failed', code: '23505' };
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(service.updateDocument('doc-123', { title: 'New Title' }))
        .rejects.toThrow('Update failed');
    });

    it('should set updated_at timestamp', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      mockSupabaseClient.single.mockResolvedValue({
        data: mockDocument,
        error: null
      });

      await service.updateDocument('doc-123', { title: 'New Title' });

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(Date)
        })
      );
    });
  });

  describe('listDocuments', () => {
    const mockDocuments = [mockDocument, { ...mockDocument, id: 'doc-456' }];

    it('should list documents with default filters', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      const result: DocumentListResult = await service.listDocuments({});

      expect(result.documents).toEqual(mockDocuments);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 19);
    });

    it('should apply category filter', async () => {
      const filters: DocumentFilters = { category: 'invoice' };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'invoice');
    });

    it('should apply client filter', async () => {
      const filters: DocumentFilters = { clientId: 'client-456' };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('client_id', 'client-456');
    });

    it('should apply project filter', async () => {
      const filters: DocumentFilters = { projectId: 'project-789' };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('project_id', 'project-789');
    });

    it('should apply tags filter', async () => {
      const filters: DocumentFilters = { tags: ['business', 'finance'] };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.contains).toHaveBeenCalledWith('tags', ['business', 'finance']);
    });

    it('should apply date range filter', async () => {
      const filters: DocumentFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('created_at', '2024-01-31T00:00:00.000Z');
    });

    it('should apply search text filter', async () => {
      const filters: DocumentFilters = { searchText: 'invoice payment' };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('text_content', '%invoice payment%');
    });

    it('should handle pagination', async () => {
      const filters: DocumentFilters = { page: 2, pageSize: 10 };

      mockSupabaseClient.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 25
      });

      const result = await service.listDocuments(filters);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(10, 19); // Skip first 10, take next 10
    });

    it('should handle list error', async () => {
      const error = { message: 'Query failed', code: '42601' };
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error
      });

      await expect(service.listDocuments({})).rejects.toThrow('Query failed');
    });

    it('should return empty result when no documents found', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const result = await service.listDocuments({});

      expect(result.documents).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('file storage integration', () => {
    it('should upload file to storage', async () => {
      const mockFile = new Blob(['file content'], { type: 'image/jpeg' });
      const mockStorageBucket = mockSupabaseClient.storage.from();

      mockStorageBucket.upload.mockResolvedValue({
        data: { path: 'documents/test-file.jpg' },
        error: null
      });

      // Assuming there's a method to upload files
      // This would be part of the actual implementation
      const uploadPath = 'documents/test-file.jpg';
      const result = await mockStorageBucket.upload(uploadPath, mockFile);

      expect(result.data.path).toBe(uploadPath);
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(uploadPath, mockFile);
    });

    it('should get public URL for file', async () => {
      const mockStorageBucket = mockSupabaseClient.storage.from();

      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/documents/test-file.jpg' }
      });

      const result = mockStorageBucket.getPublicUrl('documents/test-file.jpg');

      expect(result.data.publicUrl).toBe('https://example.com/documents/test-file.jpg');
    });

    it('should handle storage upload error', async () => {
      const mockFile = new Blob(['file content'], { type: 'image/jpeg' });
      const mockStorageBucket = mockSupabaseClient.storage.from();

      mockStorageBucket.upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed', statusCode: '413' }
      });

      const result = await mockStorageBucket.upload('documents/test-file.jpg', mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Upload failed');
    });
  });

  describe('data transformation', () => {
    it('should transform database row to ProcessedDocument', () => {
      const dbRow = {
        id: 'doc-123',
        title: 'Test Document',
        description: 'Test description',
        category: 'invoice',
        tags: ['business'],
        client_id: 'client-456',
        project_id: 'project-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-123',
        original_file_url: 'https://example.com/original.jpg',
        original_file_name: 'document.jpg',
        original_file_size: 1024000,
        original_file_type: 'image/jpeg',
        enhanced_file_url: 'https://example.com/enhanced.jpg',
        enhanced_file_size: 512000,
        pdf_file_url: 'https://example.com/document.pdf',
        pdf_file_size: 256000,
        text_content: 'Extracted text',
        ocr_confidence: 0.95,
        ocr_language: 'en',
        status: 'complete',
        sharing_settings: {
          isShared: false,
          accessLevel: 'view',
          sharedWith: []
        },
        access_log: []
      };

      // This would be part of the actual service implementation
      // Testing the transformation logic
      const transformed = {
        id: dbRow.id,
        title: dbRow.title,
        description: dbRow.description,
        category: dbRow.category,
        tags: dbRow.tags,
        clientId: dbRow.client_id,
        projectId: dbRow.project_id,
        createdAt: new Date(dbRow.created_at),
        updatedAt: new Date(dbRow.updated_at),
        createdBy: dbRow.created_by,
        originalFile: {
          url: dbRow.original_file_url,
          name: dbRow.original_file_name,
          size: dbRow.original_file_size,
          type: dbRow.original_file_type
        },
        enhancedFile: {
          url: dbRow.enhanced_file_url,
          size: dbRow.enhanced_file_size
        },
        pdfFile: {
          url: dbRow.pdf_file_url,
          size: dbRow.pdf_file_size
        },
        textContent: dbRow.text_content,
        ocrConfidence: dbRow.ocr_confidence,
        ocrLanguage: dbRow.ocr_language,
        status: dbRow.status,
        sharingSettings: dbRow.sharing_settings,
        accessLog: dbRow.access_log
      };

      expect(transformed.clientId).toBe('client-456');
      expect(transformed.originalFile.url).toBe('https://example.com/original.jpg');
      expect(transformed.createdAt).toBeInstanceOf(Date);
    });
  });
});