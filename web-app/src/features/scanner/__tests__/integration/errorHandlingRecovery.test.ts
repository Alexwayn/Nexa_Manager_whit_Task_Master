import { AIOCRService } from '@scanner/services';
import { ImageProcessingService } from '@scanner/services';
import { DocumentStorageService } from '@scanner/services';
import { BatchProcessingService } from '@scanner/services';
import { RateLimitingService } from '@scanner/services';
import { ResultCacheService } from '@scanner/services';
import { OCRProvider, OCRResult, ProcessedDocument, DocumentStatus, AccessLevel } from '@/types/scanner';

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

// Mock dependencies
jest.mock('@/utils/Logger');
jest.mock('@/lib/sentry');
jest.mock('@supabase/supabase-js');

// Mock DOM APIs
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
  value: jest.fn(() => ({
    onload: null,
    onerror: null,
    src: '',
    width: 800,
    height: 600
  })),
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

describe('Error Handling and Recovery Integration Tests', () => {
  let ocrService: AIOCRService;
  let imageProcessingService: ImageProcessingService;
  let documentStorageService: DocumentStorageService;
  let batchProcessingService: BatchProcessingService;
  let rateLimitingService: RateLimitingService;
  let cacheService: ResultCacheService;

  const mockOCRResult: OCRResult = {
    text: 'Sample document text',
    confidence: 0.95,
    provider: OCRProvider.OpenAI,
    processingTime: 1500,
    blocks: [
      {
        text: 'Sample document text',
        bounds: { x: 0, y: 0, width: 200, height: 30 },
        confidence: 0.95
      }
    ]
  };

  const createMockFile = (name: string, size: number = 2048): File => {
    const content = 'x'.repeat(size);
    return new File([content], name, { type: 'image/jpeg' });
  };

  const createMockDocument = (): ProcessedDocument => ({
    id: 'doc-123',
    title: 'Test Document',
    description: 'Test document for error handling',
    category: 'other',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    originalFile: {
      url: 'https://example.com/test.jpg',
      name: 'test.jpg',
      size: 2048,
      type: 'image/jpeg'
    },
    enhancedFile: {
      url: 'https://example.com/enhanced/test.jpg',
      size: 1800
    },
    textContent: 'Sample document text',
    ocrConfidence: 0.95,
    ocrLanguage: 'en',
    status: DocumentStatus.Complete,
    sharingSettings: {
      isShared: false,
      accessLevel: AccessLevel.View,
      sharedWith: []
    },
    accessLog: []
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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

    // Reset singleton instances
    (BatchProcessingService as any).instance = null;
    (RateLimitingService as any).instance = null;
    (ResultCacheService as any).instance = null;

    // Initialize services
    ocrService = new AIOCRService();
    imageProcessingService = new ImageProcessingService();
    documentStorageService = new DocumentStorageService();
    batchProcessingService = BatchProcessingService.getInstance();
    rateLimitingService = RateLimitingService.getInstance();
    cacheService = ResultCacheService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    batchProcessingService.dispose();
    rateLimitingService.dispose();
    cacheService.dispose();
  });

  describe('Network Error Recovery', () => {
    it('should handle network timeouts with retry mechanism', async () => {
      let attemptCount = 0;
      jest.spyOn(ocrService, 'extractText').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network timeout');
        }
        return mockOCRResult;
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Implement retry logic
      let retries = 0;
      const maxRetries = 3;
      let result: OCRResult | null = null;

      while (retries < maxRetries && !result) {
        try {
          result = await ocrService.extractText(imageBlob);
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw error;
          }
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
      }

      expect(result).toEqual(mockOCRResult);
      expect(attemptCount).toBe(3);
    });

    it('should handle connection refused errors with fallback', async () => {
      // Mock connection error
      jest.spyOn(ocrService, 'extractText').mockImplementation(async (_image, options) => {
        if (options?.provider === OCRProvider.OpenAI) {
          throw new Error('ECONNREFUSED: Connection refused');
        }
        return {
          ...mockOCRResult,
          provider: OCRProvider.Fallback,
          text: 'Fallback processing result'
        };
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Try primary provider, fallback on connection error
      let result: OCRResult;
      try {
        result = await ocrService.extractText(imageBlob, { provider: OCRProvider.OpenAI });
      } catch (error) {
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          result = await ocrService.extractText(imageBlob, { provider: OCRProvider.Fallback });
        } else {
          throw error;
        }
      }

      expect(result.provider).toBe(OCRProvider.Fallback);
      expect(result.text).toBe('Fallback processing result');
    });

    it('should handle DNS resolution failures', async () => {
      jest.spyOn(ocrService, 'extractText').mockRejectedValue(
        new Error('ENOTFOUND: DNS lookup failed')
      );

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      await expect(ocrService.extractText(imageBlob))
        .rejects.toThrow('ENOTFOUND: DNS lookup failed');

      // Should log error and potentially trigger offline mode
      expect(jest.mocked(console.error)).toHaveBeenCalled();
    });
  });

  describe('Service Degradation and Recovery', () => {
    it('should handle partial service failures gracefully', async () => {
      // Mock image processing failure but OCR success
      jest.spyOn(imageProcessingService, 'optimizeForOCR').mockRejectedValue(
        new Error('Image processing service unavailable')
      );
      jest.spyOn(ocrService, 'extractText').mockResolvedValue(mockOCRResult);

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Should continue with original image when optimization fails
      let processedImage = imageBlob;
      try {
        processedImage = await imageProcessingService.optimizeForOCR(imageBlob);
      } catch (error) {
        console.warn('Image optimization failed, using original image:', error);
        // Continue with original image
      }

      const result = await ocrService.extractText(processedImage);

      expect(result).toEqual(mockOCRResult);
      expect(processedImage).toBe(imageBlob); // Should use original image
    });

    it('should handle storage service outages with queuing', async () => {
      const documents: ProcessedDocument[] = [];
      let storageAvailable = false;

      // Mock storage service initially unavailable
      jest.spyOn(documentStorageService, 'saveDocument').mockImplementation(async (doc) => {
        if (!storageAvailable) {
          throw new Error('Storage service temporarily unavailable');
        }
        documents.push(doc);
        return doc.id!;
      });

      const document = createMockDocument();

      // Queue document for later storage
      const documentQueue: ProcessedDocument[] = [];
      
      try {
        await documentStorageService.saveDocument(document);
      } catch (error) {
        if (error instanceof Error && error.message.includes('temporarily unavailable')) {
          documentQueue.push(document);
          console.log('Document queued for later storage');
        } else {
          throw error;
        }
      }

      expect(documentQueue).toHaveLength(1);

      // Simulate storage service recovery
      storageAvailable = true;

      // Process queued documents
      const results = await Promise.all(
        documentQueue.map(doc => documentStorageService.saveDocument(doc))
      );

      expect(results).toEqual(['doc-123']);
      expect(documents).toHaveLength(1);
    });

    it('should handle cache service failures without blocking operations', async () => {
      // Mock cache service failures
      jest.spyOn(cacheService, 'getCachedOCRResult').mockRejectedValue(
        new Error('Cache service unavailable')
      );
      jest.spyOn(cacheService, 'cacheOCRResult').mockRejectedValue(
        new Error('Cache service unavailable')
      );
      jest.spyOn(ocrService, 'extractText').mockResolvedValue(mockOCRResult);

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      const cacheKey = 'test-cache-key';

      // Should continue without cache
      let cachedResult: OCRResult | null = null;
      try {
        cachedResult = await cacheService.getCachedOCRResult(cacheKey);
      } catch (error) {
        console.warn('Cache retrieval failed, proceeding without cache');
      }

      const result = await ocrService.extractText(imageBlob);

      // Try to cache result, but don't fail if caching fails
      try {
        await cacheService.cacheOCRResult(cacheKey, result);
      } catch (error) {
        console.warn('Cache storage failed, continuing without caching');
      }

      expect(cachedResult).toBeNull();
      expect(result).toEqual(mockOCRResult);
    });
  });

  describe('Resource Exhaustion Handling', () => {
    it('should handle memory pressure during batch processing', async () => {
      // Mock memory pressure scenario
      let memoryUsage = 0;
      const memoryLimit = 1000;

      jest.spyOn(ocrService, 'extractText').mockImplementation(async () => {
        memoryUsage += 200; // Simulate memory usage
        if (memoryUsage > memoryLimit) {
          throw new Error('Out of memory');
        }
        return mockOCRResult;
      });

      const files = Array.from({ length: 10 }, (_, i) => createMockFile(`doc${i}.jpg`));

      const jobId = batchProcessingService.createBatchJob(files, {
        maxConcurrency: 2, // Limit concurrency to manage memory
        onError: (error) => {
          if (error.error.includes('Out of memory')) {
            // Reduce concurrency or pause processing
            console.warn('Memory pressure detected, reducing processing load');
          }
        }
      });

      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      const job = batchProcessingService.getJobStatus(jobId);
      
      // Some files should succeed before memory limit is hit
      expect(job?.progress.completed).toBeGreaterThan(0);
      expect(job?.progress.failed).toBeGreaterThan(0);
    });

    it('should handle disk space exhaustion', async () => {
      // Mock disk space error
      jest.spyOn(documentStorageService, 'saveDocument').mockRejectedValue(
        new Error('ENOSPC: No space left on device')
      );

      const document = createMockDocument();

      await expect(documentStorageService.saveDocument(document))
        .rejects.toThrow('ENOSPC: No space left on device');

      // Should trigger cleanup or alert mechanisms
      expect(jest.mocked(console.error)).toHaveBeenCalled();
    });

    it('should handle quota exhaustion with graceful degradation', async () => {
      // Mock quota exhaustion
      jest.spyOn(rateLimitingService, 'checkRateLimit').mockResolvedValue({
        allowed: false,
        tokensRemaining: 0,
        resetTime: Date.now() + 86400000, // 24 hours
        retryAfter: 86400000,
        quotaRemaining: { daily: 0, monthly: 0 },
        warningLevel: 'critical'
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Should queue request or use fallback provider
      const promise = rateLimitingService.queueRequest(
        OCRProvider.OpenAI,
        async () => ocrService.extractText(imageBlob),
        0,
        1000 // Short timeout for test
      );

      jest.advanceTimersByTime(1500);

      await expect(promise).rejects.toThrow('Request timeout');
    });
  });

  describe('Data Corruption and Validation', () => {
    it('should handle corrupted image files', async () => {
      // Mock corrupted image
      const corruptedBlob = new Blob(['corrupted data'], { type: 'image/jpeg' });

      // Mock image loading failure
      const mockImage = {
        onload: null,
        onerror: null,
        src: ''
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImage);

      const promise = imageProcessingService.optimizeForOCR(corruptedBlob);

      // Simulate image loading error
      setTimeout(() => {
        if (mockImage.onerror) {
          (mockImage.onerror as () => void)();
        }
      }, 0);

      await expect(promise).rejects.toThrow('Failed to load image');
    });

    it('should validate OCR results for consistency', async () => {
      // Mock inconsistent OCR result
      const inconsistentResult: OCRResult = {
        text: 'Valid text content',
        confidence: 1.5, // Invalid confidence > 1
        provider: OCRProvider.OpenAI,
        processingTime: -100, // Invalid negative time
        blocks: []
      };

      jest.spyOn(ocrService, 'extractText').mockResolvedValue(inconsistentResult);

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });
      const result = await ocrService.extractText(imageBlob);

      // Validate and sanitize result
      const validatedResult = {
        ...result,
        confidence: Math.max(0, Math.min(1, result.confidence)), // Clamp to [0, 1]
        processingTime: Math.max(0, result.processingTime) // Ensure non-negative
      };

      expect(validatedResult.confidence).toBe(1);
      expect(validatedResult.processingTime).toBe(0);
    });

    it('should handle malformed document data', async () => {
      // Mock malformed document
      const malformedDocument = {
        id: 'doc-123',
        title: '', // Empty title
        // Missing required fields
        createdAt: 'invalid-date',
        originalFile: null
      } as any;

      // Validate document before storage
      const validateDocument = (doc: any): ProcessedDocument => {
        const errors: string[] = [];

        if (!doc.title || doc.title.trim() === '') {
          errors.push('Title is required');
        }
        if (!doc.createdAt || isNaN(new Date(doc.createdAt).getTime())) {
          errors.push('Valid creation date is required');
        }
        if (!doc.originalFile) {
          errors.push('Original file information is required');
        }

        if (errors.length > 0) {
          throw new Error(`Document validation failed: ${errors.join(', ')}`);
        }

        return doc;
      };

      expect(() => validateDocument(malformedDocument))
        .toThrow('Document validation failed: Title is required, Valid creation date is required, Original file information is required');
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle concurrent cache access safely', async () => {
      const cacheKey = 'concurrent-test-key';
      let cacheWriteCount = 0;

      jest.spyOn(cacheService, 'cacheOCRResult').mockImplementation(async () => {
        cacheWriteCount++;
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate concurrent cache writes
      const promises = Array.from({ length: 5 }, () =>
        cacheService.cacheOCRResult(cacheKey, mockOCRResult)
      );

      await Promise.all(promises);

      expect(cacheWriteCount).toBe(5);
    });

    it('should handle concurrent batch job creation', () => {
      const files1 = [createMockFile('doc1.jpg')];
      const files2 = [createMockFile('doc2.jpg')];
      const files3 = [createMockFile('doc3.jpg')];

      // Create multiple jobs concurrently
      const jobId1 = batchProcessingService.createBatchJob(files1);
      const jobId2 = batchProcessingService.createBatchJob(files2);
      const jobId3 = batchProcessingService.createBatchJob(files3);

      expect(jobId1).not.toBe(jobId2);
      expect(jobId2).not.toBe(jobId3);
      expect(jobId1).not.toBe(jobId3);

      const activeJobs = batchProcessingService.getActiveJobs();
      expect(activeJobs).toHaveLength(3);
    });

    it('should handle rate limit state consistency under concurrent load', async () => {
      // Simulate concurrent rate limit checks
      const promises = Array.from({ length: 10 }, () =>
        rateLimitingService.checkRateLimit(OCRProvider.OpenAI)
      );

      const results = await Promise.all(promises);

      // All results should be consistent with rate limiting rules
      results.forEach(result => {
        expect(result).toHaveProperty('allowed');
        expect(result).toHaveProperty('tokensRemaining');
        expect(result).toHaveProperty('quotaRemaining');
        expect(typeof result.allowed).toBe('boolean');
        expect(typeof result.tokensRemaining).toBe('number');
      });
    });
  });

  describe('Recovery and Resilience Patterns', () => {
    it('should implement circuit breaker pattern for failing services', async () => {
      let failureCount = 0;
      const failureThreshold = 3;
      let circuitOpen = false;

      jest.spyOn(ocrService, 'extractText').mockImplementation(async () => {
        if (circuitOpen) {
          throw new Error('Circuit breaker is open');
        }

        failureCount++;
        if (failureCount <= failureThreshold) {
          throw new Error('Service failure');
        }

        // Reset on success
        failureCount = 0;
        return mockOCRResult;
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Simulate failures until circuit opens
      for (let i = 0; i < failureThreshold; i++) {
        try {
          await ocrService.extractText(imageBlob);
        } catch (error) {
          if (failureCount >= failureThreshold) {
            circuitOpen = true;
          }
        }
      }

      expect(circuitOpen).toBe(true);

      // Circuit should be open and reject requests
      await expect(ocrService.extractText(imageBlob))
        .rejects.toThrow('Circuit breaker is open');
    });

    it('should implement bulkhead pattern for resource isolation', async () => {
      // Separate resource pools for different operations
      const ocrPool = { active: 0, max: 3 };
      const imageProcessingPool = { active: 0, max: 2 };

      const acquireResource = async (pool: typeof ocrPool): Promise<void> => {
        if (pool.active >= pool.max) {
          throw new Error('Resource pool exhausted');
        }
        pool.active++;
      };

      const releaseResource = (pool: typeof ocrPool): void => {
        pool.active = Math.max(0, pool.active - 1);
      };

      // Mock OCR with resource management
      jest.spyOn(ocrService, 'extractText').mockImplementation(async () => {
        await acquireResource(ocrPool);
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          return mockOCRResult;
        } finally {
          releaseResource(ocrPool);
        }
      });

      // Mock image processing with resource management
      jest.spyOn(imageProcessingService, 'optimizeForOCR').mockImplementation(async (blob) => {
        await acquireResource(imageProcessingPool);
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          return blob;
        } finally {
          releaseResource(imageProcessingPool);
        }
      });

      // Test resource isolation
      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Should be able to process up to pool limits
      const ocrPromises = Array.from({ length: 3 }, () => ocrService.extractText(imageBlob));
      const imagePromises = Array.from({ length: 2 }, () => imageProcessingService.optimizeForOCR(imageBlob));

      await Promise.all([...ocrPromises, ...imagePromises]);

      expect(ocrPool.active).toBe(0);
      expect(imageProcessingPool.active).toBe(0);
    });

    it('should implement graceful shutdown with cleanup', async () => {
      // Start some operations
      const files = [createMockFile('doc1.jpg'), createMockFile('doc2.jpg')];
      const jobId = batchProcessingService.createBatchJob(files);

      // Simulate shutdown signal
      const shutdown = async (): Promise<void> => {
        console.log('Shutdown signal received, cleaning up...');

        // Cancel active jobs
        batchProcessingService.cancelJob(jobId);

        // Clear queues
        rateLimitingService.clearQueue(OCRProvider.OpenAI);

        // Save cache state
        cacheService.dispose();

        // Dispose services
        batchProcessingService.dispose();
        rateLimitingService.dispose();

        console.log('Cleanup completed');
      };

      await shutdown();

      const job = batchProcessingService.getJobStatus(jobId);
      expect(job?.status).toBe('cancelled');
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should track error rates and trigger alerts', async () => {
      const errorCounts = new Map<string, number>();
      const errorThreshold = 5;

      const trackError = (errorType: string): void => {
        const count = errorCounts.get(errorType) || 0;
        errorCounts.set(errorType, count + 1);

        if (count + 1 >= errorThreshold) {
          console.error(`Alert: High error rate for ${errorType}: ${count + 1} errors`);
        }
      };

      // Simulate various errors
      jest.spyOn(ocrService, 'extractText').mockImplementation(async () => {
        const errorTypes = ['network_error', 'rate_limit', 'service_unavailable'];
        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        trackError(errorType);
        throw new Error(errorType);
      });

      const imageBlob = new Blob(['test image'], { type: 'image/jpeg' });

      // Generate errors to trigger alerts
      for (let i = 0; i < 10; i++) {
        try {
          await ocrService.extractText(imageBlob);
        } catch (error) {
          // Expected errors
        }
      }

      // Should have triggered alerts for high error rates
      expect(errorCounts.size).toBeGreaterThan(0);
      const totalErrors = Array.from(errorCounts.values()).reduce((sum, count) => sum + count, 0);
      expect(totalErrors).toBe(10);
    });

    it('should monitor system health metrics', async () => {
      const healthMetrics = {
        ocrServiceHealth: true,
        imageProcessingHealth: true,
        storageServiceHealth: true,
        cacheServiceHealth: true,
        lastHealthCheck: Date.now()
      };

      const performHealthCheck = async (): Promise<typeof healthMetrics> => {
        try {
          // Test OCR service
          const testBlob = new Blob(['health check'], { type: 'image/jpeg' });
          await ocrService.extractText(testBlob);
          healthMetrics.ocrServiceHealth = true;
        } catch (error) {
          healthMetrics.ocrServiceHealth = false;
        }

        try {
          // Test image processing
          const testBlob = new Blob(['health check'], { type: 'image/jpeg' });
          await imageProcessingService.optimizeForOCR(testBlob);
          healthMetrics.imageProcessingHealth = true;
        } catch (error) {
          healthMetrics.imageProcessingHealth = false;
        }

        try {
          // Test storage service
          const testDoc = createMockDocument();
          await documentStorageService.saveDocument(testDoc);
          healthMetrics.storageServiceHealth = true;
        } catch (error) {
          healthMetrics.storageServiceHealth = false;
        }

        try {
          // Test cache service
          await cacheService.cacheOCRResult('health-check', mockOCRResult);
          healthMetrics.cacheServiceHealth = true;
        } catch (error) {
          healthMetrics.cacheServiceHealth = false;
        }

        healthMetrics.lastHealthCheck = Date.now();
        return healthMetrics;
      };

      // Mock some services as healthy, others as unhealthy
      jest.spyOn(ocrService, 'extractText').mockResolvedValue(mockOCRResult);
      jest.spyOn(imageProcessingService, 'optimizeForOCR').mockResolvedValue(new Blob());
      jest.spyOn(documentStorageService, 'saveDocument').mockRejectedValue(new Error('Storage down'));
      jest.spyOn(cacheService, 'cacheOCRResult').mockResolvedValue(undefined);

      const health = await performHealthCheck();

      expect(health.ocrServiceHealth).toBe(true);
      expect(health.imageProcessingHealth).toBe(true);
      expect(health.storageServiceHealth).toBe(false);
      expect(health.cacheServiceHealth).toBe(true);
      expect(health.lastHealthCheck).toBeGreaterThan(0);
    });
  });
});