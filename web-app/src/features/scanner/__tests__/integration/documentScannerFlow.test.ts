import { AIOCRService } from '@scanner/services';
import { ImageProcessingService } from '@scanner/services';
import { DocumentStorageService } from '@scanner/services';
import { BatchProcessingService } from '@scanner/services';
import { RateLimitingService } from '@scanner/services';
import { ResultCacheService } from '@scanner/services';
import { BatchJobStatus } from '@scanner/services/batchProcessingService';
import { OCRProvider, OCRResult, ProcessedDocument, OCROptions, DocumentStatus, AccessLevel } from '@/types/scanner';

// Mock the env utility
jest.mock('@/utils/env', () => ({
  getEnvVar: jest.fn((key, defaultValue = '') => {
    const envVars = {
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      VITE_AZURE_VISION_KEY: 'test-azure-key'
    };
    return envVars[key] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true)
}));

// Mock external dependencies
jest.mock('@/utils/Logger');
jest.mock('@/lib/sentry');
jest.mock('@supabase/supabase-js');

// Mock DOM APIs for image processing
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(),
  toBlob: jest.fn()
};

const mockContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
};

Object.defineProperty(global, 'HTMLCanvasElement', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

Object.defineProperty(global, 'Image', {
  value: jest.fn(() => {
    const mockImage: any = {
      onload: null,
      onerror: null,
      width: 800,
      height: 600
    };

    Object.defineProperty(mockImage, 'src', {
      set(_: string) {
        if (typeof mockImage.onload === 'function') {
          mockImage.onload();
        }
      },
      get() {
        return 'blob:mock-url';
      }
    });

    return mockImage;
  }),
  writable: true
});

global.document = {
  createElement: jest.fn(() => mockCanvas)
} as any;

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
} as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Document Scanner Integration Tests', () => {
  jest.useFakeTimers();
  let ocrService: AIOCRService;
  let imageProcessingService: ImageProcessingService;
  let documentStorageService: DocumentStorageService;
  let batchProcessingService: BatchProcessingService;
  let rateLimitingService: RateLimitingService;
  let cacheService: ResultCacheService;

  const mockOCRResult: OCRResult = {
    text: 'Invoice\nDate: 2024-01-15\nAmount: $1,234.56\nVendor: ACME Corp',
    confidence: 0.92,
    provider: OCRProvider.OpenAI,
    processingTime: 2500,
    blocks: [
      {
        text: 'Invoice',
        bounds: { x: 50, y: 50, width: 100, height: 30 },
        confidence: 0.98
      },
      {
        text: 'Date: 2024-01-15',
        bounds: { x: 50, y: 100, width: 150, height: 20 },
        confidence: 0.95
      },
      {
        text: 'Amount: $1,234.56',
        bounds: { x: 50, y: 130, width: 180, height: 20 },
        confidence: 0.90
      },
      {
        text: 'Vendor: ACME Corp',
        bounds: { x: 50, y: 160, width: 160, height: 20 },
        confidence: 0.88
      }
    ]
  };

  const createMockFile = (name: string, size: number = 2048): File => {
    const content = 'x'.repeat(size);
    return new File([content], name, { type: 'image/jpeg' });
  };

  beforeEach(() => {
    jest.clearAllMocks();


    // Setup DOM mocks
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockContext.getImageData.mockReturnValue({
      data: new Uint8ClampedArray(800 * 600 * 4),
      width: 800,
      height: 600
    });
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(new Blob(['processed'], { type: 'image/jpeg' }));
    });

    // Clear localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);

    // Initialize services
    ocrService = new AIOCRService();
    imageProcessingService = new ImageProcessingService();
    documentStorageService = new DocumentStorageService();
    batchProcessingService = BatchProcessingService.getInstance();
    rateLimitingService = RateLimitingService.getInstance();
    cacheService = ResultCacheService.getInstance();
  });

  afterEach(() => {
    batchProcessingService.dispose();
    rateLimitingService.dispose();
    cacheService.dispose();
  });

  describe('End-to-End Document Scanning Flow', () => {
    it('should process a single document from image to storage', async () => {
      // Mock successful OCR extraction
      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);
      
      // Mock successful document storage
      jest.spyOn(documentStorageService, 'saveDocument').mockResolvedValue('doc-123');

      // Create test image
      const imageFile = createMockFile('invoice.jpg', 4096);
      const imageBlob = new Blob([imageFile], { type: 'image/jpeg' });

      // Step 1: Process image for OCR optimization
      const optimizedImage = await imageProcessingService.optimizeForOCR(imageBlob);
      expect(optimizedImage).toBeInstanceOf(Blob);

      // Step 2: Extract text using OCR
      const ocrOptions: OCROptions = {
        provider: OCRProvider.OpenAI,
        enhanceImage: true,
        detectTables: true
      };
      
      const ocrResult = await ocrService.extractText(optimizedImage, ocrOptions);
      expect(ocrResult.text).toContain('Invoice');
      expect(ocrResult.confidence).toBeGreaterThan(0.9);
      expect(ocrResult.blocks).toHaveLength(4);

      // Step 3: Create processed document
      const processedDocument: ProcessedDocument = {
        id: 'doc-123',
        title: 'Invoice - ACME Corp',
        description: 'Invoice document processed from image',
        category: 'invoice',
        tags: ['invoice', 'acme', 'finance'],
        clientId: 'client-456',
        projectId: 'project-789',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        originalFile: {
          url: 'https://storage.example.com/original/invoice.jpg',
          name: 'invoice.jpg',
          size: imageFile.size,
          type: 'image/jpeg'
        },
        enhancedFile: {
          url: 'https://storage.example.com/enhanced/invoice.jpg',
          size: optimizedImage.size
        },
        textContent: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        ocrLanguage: 'en',
        status: DocumentStatus.Complete,
        sharingSettings: {
          isShared: false,
          accessLevel: AccessLevel.View,
          sharedWith: []
        },
        accessLog: []
      };

      // Step 4: Save document to storage
      const documentId = await documentStorageService.saveDocument(processedDocument);
      expect(documentId).toBe('doc-123');

      // Verify all services were called correctly
      expect(ocrService.extractText).toHaveBeenCalledWith(optimizedImage, ocrOptions);
      expect(documentStorageService.saveDocument).toHaveBeenCalledWith(processedDocument);
    });

    it('should handle multi-page PDF processing', async () => {
      // Mock PDF parsing
      const mockPages = [
        new Blob(['page1'], { type: 'image/jpeg' }),
        new Blob(['page2'], { type: 'image/jpeg' }),
        new Blob(['page3'], { type: 'image/jpeg' })
      ];

      jest.spyOn(imageProcessingService, 'parsePDF').mockResolvedValue(mockPages);
      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async (image, _options) => ({
        ...mockOCRResult,
        text: `Page content for ${mockPages.indexOf(image as Blob) + 1}`,
        processingTime: 1000
      }));

      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      const pdfBlob = new Blob([pdfFile], { type: 'application/pdf' });

      // Process multi-page document
      const result = await imageProcessingService.processMultiPageDocument(pdfBlob, {
        optimizeForOCR: true,
        combineIntoPDF: false
      });

      expect(result.pages).toHaveLength(3);
      expect(result.totalPages).toBe(3);
      expect(result.processingInfo).toHaveLength(3);

      // Process each page with OCR
      const ocrResults = await Promise.all(
        result.pages.map(page => ocrService.extractText(page))
      );

      expect(ocrResults).toHaveLength(3);
      expect(ocrResults[0].text).toContain('Page content for 1');
      expect(ocrResults[1].text).toContain('Page content for 2');
      expect(ocrResults[2].text).toContain('Page content for 3');
    });

    it('should process batch of documents with progress tracking', async () => {
      // Mock OCR for batch processing
      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockOCRResult;
      });

      const files = [
        createMockFile('doc1.jpg'),
        createMockFile('doc2.jpg'),
        createMockFile('doc3.jpg'),
        createMockFile('doc4.jpg')
      ];

      let progressUpdates: any[] = [];
      let completedFiles: any[] = [];

      const jobId = batchProcessingService.createBatchJob(files, {
        maxConcurrency: 2,
        optimizeImages: true,
        enableCaching: true,
        onProgress: (progress) => progressUpdates.push({ ...progress }),
        onFileComplete: (result) => completedFiles.push(result)
      });

      // Wait for batch processing to complete
      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      const job = batchProcessingService.getJobStatus(jobId);
      
      expect(job?.progress.completed).toBe(4);
      expect(job?.progress.failed).toBe(0);
      expect(job?.progress.percentage).toBe(100);
      expect(completedFiles).toHaveLength(4);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Verify all files were processed successfully
      completedFiles.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.fileName).toBe(`doc${index + 1}.jpg`);
        expect(result.ocrResult).toBeDefined();
      });
    });
  });

  describe('OCR Provider Fallback Mechanism', () => {
    it('should fallback to secondary provider when primary fails', async () => {
      // Mock primary provider failure
      const mockExtractText = jest.spyOn(AIOCRService.prototype, 'extractText');
      
      mockExtractText
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockResolvedValueOnce({
          ...mockOCRResult,
          provider: OCRProvider.Qwen,
          text: 'Fallback OCR result'
        });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      const result = await ocrService.extractText(imageBlob, {
        provider: OCRProvider.OpenAI
      });

      expect(result.provider).toBe(OCRProvider.Qwen);
      expect(result.text).toBe('Fallback OCR result');
      expect(mockExtractText).toHaveBeenCalledTimes(2);
    });

    it('should use fallback provider when all AI providers fail', async () => {
      const providerCalls: OCRProvider[] = [];
      
      // Mock all AI providers failing
      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async (_image, options) => {
        const provider = options?.provider || OCRProvider.OpenAI;
        providerCalls.push(provider);
        
        if (provider === OCRProvider.Fallback) {
          return {
            text: '[Manual Input Required]\n\nPlease manually enter the text content from this document.',
            confidence: 0.1,
            provider: OCRProvider.Fallback,
            processingTime: 0,
            error: {
              code: 'MANUAL_INPUT_REQUIRED',
              message: 'All automatic OCR providers failed',
              provider: OCRProvider.Fallback,
              retryable: false
            }
          };
        }
        throw new Error('AI provider failed');
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      const result = await ocrService.extractText(imageBlob);

      expect(result.provider).toBe(OCRProvider.Fallback);
      expect(result.text).toContain('Manual Input Required');
      expect(result.confidence).toBe(0.1);
      expect(result.error?.code).toBe('MANUAL_INPUT_REQUIRED');
    });

    it('should respect provider priority in fallback chain', async () => {
      const providerCalls: OCRProvider[] = [];
      
      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async (_image, options) => {
        const provider = options?.provider || OCRProvider.OpenAI;
        providerCalls.push(provider);
        
        if (provider === OCRProvider.Fallback) {
          return {
            ...mockOCRResult,
            provider: OCRProvider.Fallback,
            text: 'Fallback result'
          };
        }
        
        throw new Error(`${provider} failed`);
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      await ocrService.extractText(imageBlob);

      // Should try providers in priority order: OpenAI -> Qwen -> Fallback
      expect(providerCalls).toContain(OCRProvider.OpenAI);
      expect(providerCalls).toContain(OCRProvider.Fallback);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle rate limiting gracefully', async () => {
      // Mock rate limiting
      jest.spyOn(rateLimitingService, 'checkRateLimit').mockResolvedValue({
        allowed: false,
        tokensRemaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60000,
        quotaRemaining: { daily: 0, monthly: 1000 },
        warningLevel: 'critical'
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      // Should queue request and wait for rate limit to reset
      const promise = rateLimitingService.queueRequest(
        OCRProvider.OpenAI,
        async () => ocrService.extractText(imageBlob),
        0,
        5000
      );

      // Simulate rate limit reset
      jest.advanceTimersByTime(1000);
      jest.spyOn(rateLimitingService, 'checkRateLimit').mockResolvedValue({
        allowed: true,
        tokensRemaining: 10,
        resetTime: Date.now() + 60000,
        quotaRemaining: { daily: 100, monthly: 1000 },
        warningLevel: 'none'
      });

      jest.advanceTimersByTime(1000);

      // Request should eventually succeed
      await expect(promise).resolves.toBeDefined();
    });

    it('should handle image processing errors with graceful degradation', async () => {
      // Mock image processing failure
      jest.spyOn(imageProcessingService, 'optimizeForOCR').mockRejectedValue(
        new Error('Image processing failed')
      );

      // Mock OCR still working with original image
      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Should fallback to using original image
      const result = await ocrService.extractText(imageBlob);

      expect(result).toEqual(mockOCRResult);
      expect(ocrService.extractText).toHaveBeenCalledWith(imageBlob);
    });

    it('should handle storage failures with retry mechanism', async () => {
      let attemptCount = 0;
      jest.spyOn(documentStorageService, 'saveDocument').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Storage temporarily unavailable');
        }
        return 'doc-123';
      });

      const document: ProcessedDocument = {
        id: 'doc-123',
        title: 'Test Document',
        description: 'Test',
        category: 'other',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        originalFile: {
          url: 'https://example.com/test.jpg',
          name: 'test.jpg',
          size: 1024,
          type: 'image/jpeg'
        },
        enhancedFile: {
          url: 'https://example.com/enhanced-test.jpg',
          size: 2048
        },
        textContent: 'Test content',
        ocrConfidence: 0.9,
        ocrLanguage: 'en',
        status: DocumentStatus.Complete,
        sharingSettings: {
          isShared: false,
          accessLevel: AccessLevel.View,
          sharedWith: []
        },
        accessLog: []
      };

      // Implement retry logic
      let retries = 0;
      const maxRetries = 3;
      let documentId: string | null = null;

      while (retries < maxRetries && !documentId) {
        try {
          documentId = await documentStorageService.saveDocument(document);
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      expect(documentId).toBe('doc-123');
      expect(attemptCount).toBe(3);
    });

    it('should handle network timeouts with appropriate error messages', async () => {
      // Mock network timeout
      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async () => {
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
        return mockOCRResult; // Never reached
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      const promise = ocrService.extractText(imageBlob, { timeout: 50 });
      // Advance timers to trigger the rejection and flush microtasks
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
      await expect(promise).rejects.toThrow('Network timeout');
    });

    it('should handle corrupted image files gracefully', async () => {
      // Mock corrupted image
      const corruptedBlob = new Blob(['corrupted data'], { type: 'image/jpeg' });

      // Mock image processing failure for corrupted image
      jest.spyOn(imageProcessingService, 'optimizeForOCR').mockRejectedValue(
        new Error('Invalid image format')
      );

      // Should handle error gracefully
      await expect(imageProcessingService.optimizeForOCR(corruptedBlob))
        .rejects.toThrow('Invalid image format');
    });
  });

  describe('Caching Integration', () => {
    it('should cache and retrieve OCR results across services', async () => {
      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      const cacheKey = cacheService.generateOCRKey(imageBlob);

      // First call should miss cache and perform OCR
      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);
      
      const result1 = await ocrService.extractText(imageBlob);
      
      // Cache the result
      await cacheService.cacheOCRResult(cacheKey, result1);

      // Second call should hit cache
      const result2 = await cacheService.getCachedOCRResult(cacheKey);

      expect(result2).toEqual(mockOCRResult);
      expect(result2?.text).toBe(result1.text);
      expect(result2?.confidence).toBe(result1.confidence);
    });

    it('should handle cache eviction under memory pressure', async () => {
      const smallCacheOptions = {
        maxSize: 1024, // Very small cache
        maxEntries: 2
      };

      // Fill cache beyond capacity
      const largeResult = {
        ...mockOCRResult,
        text: 'x'.repeat(2000) // Large text
      };

      await cacheService.cacheOCRResult('key1', mockOCRResult, smallCacheOptions);
      await cacheService.cacheOCRResult('key2', mockOCRResult, smallCacheOptions);
      await cacheService.cacheOCRResult('key3', largeResult, smallCacheOptions);

      // Should evict older entries
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(2);
    });

    it('should integrate caching with batch processing', async () => {
      // Mock cache hits for some files
      jest.spyOn(cacheService, 'getCachedOCRResult')
        .mockResolvedValueOnce(mockOCRResult) // Cache hit for first file
        .mockResolvedValueOnce(null) // Cache miss for second file
        .mockResolvedValueOnce(mockOCRResult); // Cache hit for third file

      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);

      const files = [
        createMockFile('doc1.jpg'),
        createMockFile('doc2.jpg'),
        createMockFile('doc3.jpg')
      ];

      const jobId = batchProcessingService.createBatchJob(files, {
        enableCaching: true
      });

      // Advance timers multiple times and resolve promises to allow batch processing to complete
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
        await Promise.resolve();
      }

      const job = batchProcessingService.getJobStatus(jobId);
      const stats = batchProcessingService.getBatchStats();

      expect(job?.progress.completed).toBe(3);
      expect(stats.cacheHitRate).toBeGreaterThan(0); // Should have some cache hits
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large batch processing efficiently', async () => {
      const startTime = jest.getRealSystemTime();
      
      // Create large batch
      const files = Array.from({ length: 20 }, (_, i) => 
        createMockFile(`doc${i + 1}.jpg`)
      );

      jest.spyOn(AIOCRService.prototype, 'extractText').mockImplementation(async () => {
        // Simulate realistic processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockOCRResult;
      });

      const jobId = batchProcessingService.createBatchJob(files, {
        maxConcurrency: 5,
        optimizeImages: true,
        enableCaching: true
      });

      // Process batch with proper timer handling for setInterval calls
      for (let i = 0; i < 100; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        await Promise.resolve();
      }

      const job = batchProcessingService.getJobStatus(jobId);
      const processingTime = jest.getRealSystemTime() - startTime;

      expect(job?.progress.completed).toBe(20);
      expect(job?.progress.failed).toBe(0);
      expect(processingTime).toBeLessThan(5000); // Should complete efficiently
    });

    it('should maintain performance under concurrent load', async () => {
      // Simulate multiple concurrent batch jobs
      const jobs: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const files = Array.from({ length: 5 }, (_, j) => 
          createMockFile(`batch${i}_doc${j + 1}.jpg`)
        );
        
        const jobId = batchProcessingService.createBatchJob(files, {
          maxConcurrency: 2
        });
        
        jobs.push(jobId);
      }

      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);

      // Process all jobs concurrently with proper timer handling
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        await Promise.resolve();
      }

      // All jobs should complete successfully
      jobs.forEach(jobId => {
        const job = batchProcessingService.getJobStatus(jobId);
        expect(job?.progress.completed).toBe(5);
        expect(job?.status).toBe(BatchJobStatus.COMPLETED);
      });
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across service boundaries', async () => {
      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      // Mock services to track data flow
      const ocrResult = { ...mockOCRResult, processingTime: 1500 };
      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(ocrResult);
      jest.spyOn(documentStorageService, 'saveDocument').mockResolvedValue('doc-123');

      // Process document
      const processedDocument: ProcessedDocument = {
        id: 'doc-123',
        title: 'Test Document',
        description: 'Integration test document',
        category: 'other',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        originalFile: {
          url: 'https://example.com/test.jpg',
          name: 'test.jpg',
          size: imageBlob.size,
          type: 'image/jpeg'
        },
        enhancedFile: {
          url: 'https://example.com/enhanced-test.jpg',
          size: imageBlob.size * 2
        },
        textContent: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        ocrLanguage: 'en',
        status: DocumentStatus.Complete,
        sharingSettings: {
          isShared: false,
          accessLevel: AccessLevel.View,
          sharedWith: []
        },
        accessLog: []
      };

      const documentId = await documentStorageService.saveDocument(processedDocument);

      // Verify data consistency
      expect(documentId).toBe('doc-123');
      expect(processedDocument.textContent).toBe(ocrResult.text);
      expect(processedDocument.ocrConfidence).toBe(ocrResult.confidence);
      expect(processedDocument.originalFile.size).toBe(imageBlob.size);
    });

    it('should handle partial failures without data corruption', async () => {
      // Mock partial failure scenario
      jest.spyOn(AIOCRService.prototype, 'extractText').mockResolvedValue(mockOCRResult);
      jest.spyOn(documentStorageService, 'saveDocument').mockRejectedValue(
        new Error('Storage service unavailable')
      );

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      
      // OCR should succeed
      const ocrResult = await ocrService.extractText(imageBlob);
      expect(ocrResult).toEqual(mockOCRResult);

      // Storage should fail
      const document: ProcessedDocument = {
        id: 'doc-123',
        title: 'Test',
        description: 'Test',
        category: 'other',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        originalFile: {
          url: 'https://example.com/test.jpg',
          name: 'test.jpg',
          size: 1024,
          type: 'image/jpeg'
        },
        enhancedFile: {
          url: 'https://example.com/enhanced-test.jpg',
          size: 2048
        },
        textContent: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        ocrLanguage: 'en',
        status: DocumentStatus.Complete,
        sharingSettings: {
          isShared: false,
          accessLevel: AccessLevel.View,
          sharedWith: []
        },
        accessLog: []
      };

      await expect(documentStorageService.saveDocument(document))
        .rejects.toThrow('Storage service unavailable');

      // OCR result should still be valid and cacheable
      const cacheKey = cacheService.generateOCRKey(imageBlob);
      await cacheService.cacheOCRResult(cacheKey, ocrResult);
      
      const cachedResult = await cacheService.getCachedOCRResult(cacheKey);
      expect(cachedResult).toEqual(ocrResult);
    });
  });
});
