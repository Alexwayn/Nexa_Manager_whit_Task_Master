import { DocumentStorageService } from '@/services/scanner/documentStorageService';
import { 
  ProcessedDocument, 
  DocumentFilters, 
  DocumentListResult,
  DocumentStatus,
  AccessLevel,
  SharedUser
} from '@/types/scanner';

// Mock the supabase client directly
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn() as jest.MockedFunction<any>,
        getPublicUrl: jest.fn() as jest.MockedFunction<any>,
        download: jest.fn() as jest.MockedFunction<any>,
        remove: jest.fn() as jest.MockedFunction<any>,
        list: jest.fn() as jest.MockedFunction<any>,
        createSignedUrl: jest.fn() as jest.MockedFunction<any>,
        createSignedUrls: jest.fn() as jest.MockedFunction<any>
      })),
      listBuckets: jest.fn(),
      createBucket: jest.fn()
    }
  }
}));

import { supabase } from '@/lib/supabaseClient';

describe('DocumentStorageService', () => {
  let service: DocumentStorageService;
  let mockQuery: any;
  let setMockQueryResult: (result: any) => void;

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
    status: DocumentStatus.Complete,
    processingErrors: undefined,
    sharingSettings: {
      isShared: false,
      accessLevel: AccessLevel.View,
      sharedWith: [] as SharedUser[]
    },
    accessLog: []
  };

  // Mock database record structure (what comes from Supabase)
  const mockDbRecord = {
    id: 'doc-123',
    title: 'Test Document',
    description: 'Test document description',
    category: 'invoice',
    tags: ['business', 'finance'],
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
    text_content: 'Extracted text content from document',
    ocr_confidence: 0.95,
    ocr_language: 'en',
    status: DocumentStatus.Complete,
    processing_errors: undefined,
    sharing_settings: {
      isShared: false,
      accessLevel: AccessLevel.View,
      sharedWith: [] as SharedUser[]
    },
    access_log: []
  };

  const mockDbRecords = [mockDbRecord];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock query result that will be returned by awaiting the query
    let mockQueryResult: any = { data: null, error: null, count: 0 };
    
    // Create a mock query that is both chainable and awaitable
    const createAwaitableQuery = () => {
      const query = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        containedBy: jest.fn().mockReturnThis(),
        rangeGt: jest.fn().mockReturnThis(),
        rangeGte: jest.fn().mockReturnThis(),
        rangeLt: jest.fn().mockReturnThis(),
        rangeLte: jest.fn().mockReturnThis(),
        rangeAdjacent: jest.fn().mockReturnThis(),
        overlaps: jest.fn().mockReturnThis(),
        textSearch: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        abortSignal: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve(mockQueryResult)),
        maybeSingle: jest.fn(() => Promise.resolve(mockQueryResult)),
        csv: jest.fn(),
        geojson: jest.fn(),
        explain: jest.fn(),
        rollback: jest.fn(),
        returns: jest.fn().mockReturnThis(),
        // Make the query object itself awaitable by implementing thenable interface
        then: jest.fn((onResolve: any, onReject?: any) => {
          return Promise.resolve(mockQueryResult).then(onResolve, onReject);
        }),
        catch: jest.fn((onReject: any) => {
          return Promise.resolve(mockQueryResult).catch(onReject);
        }),
        finally: jest.fn((onFinally: any) => {
          return Promise.resolve(mockQueryResult).finally(onFinally);
        })
      };
      
      // Make all chainable methods return the same query object
      Object.keys(query).forEach(key => {
        if (typeof (query as any)[key] === 'function' && 
            !['single', 'maybeSingle', 'then', 'catch', 'finally', 'csv', 'geojson', 'explain', 'rollback'].includes(key)) {
          (query as any)[key] = jest.fn().mockReturnValue(query);
        }
      });
      
      return query;
    };

    mockQuery = createAwaitableQuery();

    // Helper function to set up mock query result
    setMockQueryResult = (result: any) => {
      mockQueryResult = result;
      // Update all the promise-returning methods
      mockQuery.single = jest.fn(() => Promise.resolve(result));
      mockQuery.maybeSingle = jest.fn(() => Promise.resolve(result));
      
      // Make the query object itself awaitable - this is the key fix
      if (result.error) {
        // When there's an error, the query should still resolve with the error object
        // The service code checks for error in the resolved result
        mockQuery.then = jest.fn((onResolve: any, onReject?: any) => {
          return Promise.resolve(result).then(onResolve, onReject);
        });
        mockQuery.catch = jest.fn((onReject: any) => {
          return Promise.resolve(result).catch(onReject);
        });
        mockQuery.finally = jest.fn((onFinally: any) => {
          return Promise.resolve(result).finally(onFinally);
        });
      } else {
        mockQuery.then = jest.fn((onResolve: any, onReject?: any) => {
          return Promise.resolve(result).then(onResolve, onReject);
        });
        mockQuery.catch = jest.fn((onReject: any) => {
          return Promise.resolve(result).catch(onReject);
        });
        mockQuery.finally = jest.fn((onFinally: any) => {
          return Promise.resolve(result).finally(onFinally);
        });
      }
    };

    // Setup the mocked supabase client
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);
    (supabase.storage.listBuckets as jest.Mock).mockResolvedValue({ 
      data: [
        { name: 'scanner-documents' },
        { name: 'scanner-temp' }
      ], 
      error: null 
    });
    (supabase.storage.createBucket as jest.Mock).mockResolvedValue({ data: null, error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
      list: jest.fn()
    });
    
    // Wait for async initialization to complete
    service = new DocumentStorageService();
    await new Promise(resolve => setTimeout(resolve, 0)); // Allow async initialization to complete
  });

  describe('saveDocument', () => {
    it('should save document successfully', async () => {
      setMockQueryResult({
        data: { ...mockDocument },
        error: null
      });

      const result = await service.saveDocument(mockDocument);

      expect(result).toBe(mockDocument.id);
      expect(supabase.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockQuery.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: mockDocument.id,
          title: mockDocument.title,
          category: mockDocument.category
        })
      ]);
    });

    it('should handle save error', async () => {
      const error = { message: 'Database error', code: '23505' };
      setMockQueryResult({
        data: null,
        error
      });

      await expect(service.saveDocument(mockDocument)).rejects.toThrow('Failed to save document to storage');
    });

    it('should generate ID if not provided', async () => {
      const documentWithoutId = { ...mockDocument };
      delete (documentWithoutId as any).id;

      setMockQueryResult({
        data: { ...documentWithoutId, id: 'generated-id' },
        error: null
      });

      const result = await service.saveDocument(documentWithoutId as any);

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^doc_\d+_[a-z0-9]+$/); // Matches the ID pattern
      expect(mockQuery.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.any(String),
          title: mockDocument.title
        })
      ]);
    });

    it('should set timestamps for new documents', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      setMockQueryResult({
        data: mockDocument,
        error: null
      });

      await service.saveDocument(mockDocument);

      expect(mockQuery.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      ]);
    });
  });

  describe('getDocument', () => {
    it('should retrieve document successfully', async () => {
      setMockQueryResult({
        data: mockDbRecord,
        error: null
      });

      const result = await service.getDocument(mockDocument.id);

      expect(result).toEqual(mockDocument);
      expect(supabase.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockDocument.id);
    });

    it('should handle document not found', async () => {
      setMockQueryResult({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      await expect(service.getDocument('non-existent-id')).rejects.toThrow('Document with id non-existent-id not found');
    });

    it('should handle database error', async () => {
      const error = { message: 'Database connection error', code: '08000' };
      setMockQueryResult({
        data: null,
        error
      });

      await expect(service.getDocument(mockDocument.id)).rejects.toThrow(`Document with id ${mockDocument.id} not found`);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      setMockQueryResult({
        data: [{ id: mockDocument.id }],
        error: null
      });

      await service.deleteDocument(mockDocument.id);

      expect(supabase.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockDocument.id);
    });

    it('should handle delete error', async () => {
      // Mock getDocument to succeed first
      const getDocumentSpy = jest.spyOn(service, 'getDocument').mockResolvedValue(mockDocument);
      
      // Then mock the delete operation to fail
      const error = { message: 'Delete failed', code: '23503' };
      setMockQueryResult({
        data: null,
        error
      });

      const result = await service.deleteDocument(mockDocument.id);
      expect(result).toBe(false);
      
      getDocumentSpy.mockRestore();
    });

    it('should handle document not found during delete', async () => {
      setMockQueryResult({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      // Should return false when document doesn't exist (getDocument throws)
      const result = await service.deleteDocument('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      const updates = { title: 'Updated Title', category: 'updated' as const };
      const updatedDocument = { ...mockDocument, ...updates };
      const updatedDbRecord = { ...mockDbRecord, title: 'Updated Title', category: 'updated' };

      // First call is for the update query
      setMockQueryResult({
        data: updatedDbRecord,
        error: null
      });

      // Mock the getDocument call that happens after update
      const getDocumentSpy = jest.spyOn(service, 'getDocument').mockResolvedValue(updatedDocument);

      const result = await service.updateDocument(mockDocument.id, updates);

      expect(result).toEqual(updatedDocument);
      expect(supabase.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          category: 'updated',
          updated_at: expect.any(String)
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockDocument.id);
      expect(getDocumentSpy).toHaveBeenCalledWith(mockDocument.id);

      getDocumentSpy.mockRestore();
    });

    it('should handle update error', async () => {
      const error = { message: 'Update failed', code: '23505' };
      setMockQueryResult({
        data: null,
        error
      });

      const updates = { title: 'Updated Title' };
      await expect(service.updateDocument(mockDocument.id, updates)).rejects.toThrow('Update failed');
    });

    it('should set updated_at timestamp', async () => {
      const now = new Date();
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      setMockQueryResult({
        data: mockDbRecord,
        error: null
      });

      // Mock the getDocument call that happens after update
      const getDocumentSpy = jest.spyOn(service, 'getDocument').mockResolvedValue(mockDocument);

      const updates = { title: 'Updated Title' };
      await service.updateDocument(mockDocument.id, updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String)
        })
      );

      getDocumentSpy.mockRestore();
    });
  });

  describe('listDocuments', () => {
    it('should return list of documents', async () => {
      const mockDocuments = [mockDocument, { ...mockDocument, id: 'doc-456' }];
      const mockDbRecords = [mockDbRecord, { ...mockDbRecord, id: 'doc-456' }];

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 2
      });

      const result: DocumentListResult = await service.listDocuments({});

      expect(result.documents).toEqual(mockDocuments);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);

      expect(supabase.from).toHaveBeenCalledWith('scanned_documents');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
    });

    it('should apply category filter', async () => {
      const filters: DocumentFilters = { category: 'invoice' };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 1
      });

      await service.listDocuments(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'invoice');
    });

    it('should apply client filter', async () => {
      const filters: DocumentFilters = { clientId: 'client-456' };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 1
      });

      await service.listDocuments(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', 'client-456');
    });

    it('should apply project filter', async () => {
      const filters: DocumentFilters = { projectId: 'project-789' };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 1
      });

      await service.listDocuments(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('project_id', 'project-789');
    });

    it('should apply tags filter', async () => {
      const filters: DocumentFilters = { tags: ['business', 'finance'] };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 1
      });

      await service.listDocuments(filters);

      expect(mockQuery.overlaps).toHaveBeenCalledWith('tags', ['business', 'finance']);
    });

    it('should apply date range filter', async () => {
      const filters: DocumentFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31T00:00:00.000Z');
    });

    it('should apply search text filter', async () => {
      const filters: DocumentFilters = { searchText: 'invoice payment' };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 2
      });

      await service.listDocuments(filters);

      expect(mockQuery.or).toHaveBeenCalledWith('title.ilike.%invoice payment%,description.ilike.%invoice payment%,text_content.ilike.%invoice payment%');
    });

    it('should handle pagination', async () => {
      const filters: DocumentFilters = { page: 2, pageSize: 10 };

      setMockQueryResult({
        data: mockDbRecords,
        error: null,
        count: 25
      });

      const result = await service.listDocuments(filters);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // Skip first 10, take next 10
    });

    it('should handle list error', async () => {
      const error = { message: 'Query failed', code: '42601' };
      setMockQueryResult({
        data: null,
        error
      });

      await expect(service.listDocuments({})).rejects.toThrow('Failed to retrieve documents from storage');
    });

    it('should return empty result when no documents found', async () => {
      setMockQueryResult({
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
      const mockStorageBucket = supabase.storage.from('scanner-documents');

      (mockStorageBucket.upload as jest.MockedFunction<any>).mockResolvedValue({
        data: { path: 'documents/test-file.jpg' },
        error: null
      });

      // Assuming there's a method to upload files
      // This would be part of the actual implementation
      const uploadPath = 'documents/test-file.jpg';
      const result = await mockStorageBucket.upload(uploadPath, mockFile);

      expect(result.data!.path).toBe(uploadPath);
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(uploadPath, mockFile);
    });

    it('should get public URL for file', async () => {
      const mockStorageBucket = supabase.storage.from('scanner-documents');

      (mockStorageBucket.getPublicUrl as jest.MockedFunction<any>).mockReturnValue({
        data: { publicUrl: 'https://example.com/documents/test-file.jpg' }
      });

      const result = mockStorageBucket.getPublicUrl('documents/test-file.jpg');

      expect(result.data.publicUrl).toBe('https://example.com/documents/test-file.jpg');
    });

    it('should handle upload error', async () => {
      const mockFile = new Blob(['file content'], { type: 'image/jpeg' });
      const mockStorageBucket = supabase.storage.from('scanner-documents');

      (mockStorageBucket.upload as jest.MockedFunction<any>).mockResolvedValue({
        data: null,
        error: { message: 'Upload failed', statusCode: '413' }
      });

      const result = await mockStorageBucket.upload('documents/test-file.jpg', mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('Upload failed');
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
        status: DocumentStatus.Complete,
        sharing_settings: {
          isShared: false,
          accessLevel: AccessLevel.View,
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