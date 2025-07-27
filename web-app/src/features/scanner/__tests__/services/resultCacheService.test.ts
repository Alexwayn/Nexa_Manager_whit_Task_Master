import ResultCacheService from '@scanner/services/resultCacheService';
import { OCRProvider, OCRResult, ProcessedDocument, DocumentStatus, AccessLevel, CacheOptions, CacheStats } from '@/types/scanner';

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

describe('ResultCacheService', () => {
  let service: ResultCacheService;

  const mockOCRResult: OCRResult = {
    text: 'Sample extracted text',
    confidence: 0.95,
    provider: OCRProvider.OpenAI,
    processingTime: 1500,
    blocks: [
      {
        text: 'Sample extracted text',
        bounds: { x: 0, y: 0, width: 100, height: 20 },
        confidence: 0.95
      }
    ]
  };

  const mockProcessedDocument: ProcessedDocument = {
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
    sharingSettings: {
      isShared: false,
      accessLevel: AccessLevel.View,
      sharedWith: []
    },
    accessLog: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset singleton instance
    (ResultCacheService as any).instance = null;
    
    // Clear localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    
    service = ResultCacheService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.dispose();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = ResultCacheService.getInstance();
      const instance2 = ResultCacheService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should load cache from localStorage on initialization', () => {
      const cachedData = {
        'test-key': {
          key: 'test-key',
          data: mockOCRResult,
          timestamp: Date.now(),
          expiresAt: Date.now() + 86400000,
          size: 1000,
          accessCount: 0,
          lastAccessed: Date.now()
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const newService = ResultCacheService.getInstance();
      
      expect(newService.has('test-key')).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(() => {
        ResultCacheService.getInstance();
      }).not.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('scanner_cache');
    });
  });

  describe('key generation', () => {
    it('should generate OCR cache key', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const options = { provider: OCRProvider.OpenAI, enhanceImage: true };

      const key = service.generateOCRKey(blob, options);

      expect(key).toMatch(/^ocr_\d+_image\/jpeg_/);
      expect(key).toContain('_');
    });

    it('should generate document cache key', () => {
      const key = service.generateDocumentKey('doc-123', 'v1.0');

      expect(key).toBe('doc_doc-123_v1.0');
    });

    it('should generate document cache key with default version', () => {
      const key = service.generateDocumentKey('doc-123');

      expect(key).toBe('doc_doc-123_latest');
    });

    it('should generate image processing cache key', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const params = { quality: 0.8, format: 'jpeg' };

      const key = service.generateImageProcessingKey(blob, 'compress', params);

      expect(key).toMatch(/^img_compress_\d+_image\/png_/);
    });

    it('should generate consistent keys for same inputs', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const options = { provider: OCRProvider.OpenAI };

      const key1 = service.generateOCRKey(blob, options);
      const key2 = service.generateOCRKey(blob, options);

      expect(key1).toBe(key2);
    });
  });

  describe('OCR result caching', () => {
    it('should cache OCR result', async () => {
      const key = 'test-ocr-key';

      await service.cacheOCRResult(key, mockOCRResult);

      expect(service.has(key)).toBe(true);
    });

    it('should retrieve cached OCR result', async () => {
      const key = 'test-ocr-key';

      await service.cacheOCRResult(key, mockOCRResult);
      const result = await service.getCachedOCRResult(key);

      expect(result).toEqual(mockOCRResult);
    });

    it('should return null for non-existent OCR result', async () => {
      const result = await service.getCachedOCRResult('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle caching errors gracefully', async () => {
      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Stringify error');
      });

      await expect(
        service.cacheOCRResult('test-key', mockOCRResult)
      ).resolves.not.toThrow();

      JSON.stringify = originalStringify;
    });

    it('should use custom cache options', async () => {
      const key = 'test-ocr-key';
      const options: Partial<CacheOptions> = {
        ttl: 1000, // 1 second
        maxSize: 1024
      };

      await service.cacheOCRResult(key, mockOCRResult, options);

      // Advance time past TTL
      jest.advanceTimersByTime(1500);

      const result = await service.getCachedOCRResult(key);
      expect(result).toBeNull();
    });
  });

  describe('processed document caching', () => {
    it('should cache processed document', async () => {
      const key = 'test-doc-key';

      await service.cacheProcessedDocument(key, mockProcessedDocument);

      expect(service.has(key)).toBe(true);
    });

    it('should retrieve cached processed document', async () => {
      const key = 'test-doc-key';

      await service.cacheProcessedDocument(key, mockProcessedDocument);
      const result = await service.getCachedProcessedDocument(key);

      expect(result).toEqual(mockProcessedDocument);
    });

    it('should return null for non-existent processed document', async () => {
      const result = await service.getCachedProcessedDocument('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('image processing result caching', () => {
    it('should cache image processing result', async () => {
      const key = 'test-img-key';
      const result = { processedImage: 'blob-data', metadata: { size: 1024 } };

      await service.cacheImageProcessingResult(key, result);

      expect(service.has(key)).toBe(true);
    });

    it('should retrieve cached image processing result', async () => {
      const key = 'test-img-key';
      const result = { processedImage: 'blob-data', metadata: { size: 1024 } };

      await service.cacheImageProcessingResult(key, result);
      const cached = await service.getCachedImageProcessingResult(key);

      expect(cached).toEqual(result);
    });
  });

  describe('cache management', () => {
    it('should check if key exists', async () => {
      const key = 'test-key';

      expect(service.has(key)).toBe(false);

      await service.cacheOCRResult(key, mockOCRResult);

      expect(service.has(key)).toBe(true);
    });

    it('should delete cache entry', async () => {
      const key = 'test-key';

      await service.cacheOCRResult(key, mockOCRResult);
      expect(service.has(key)).toBe(true);

      const deleted = service.delete(key);

      expect(deleted).toBe(true);
      expect(service.has(key)).toBe(false);
    });

    it('should clear all cache entries', async () => {
      await service.cacheOCRResult('key1', mockOCRResult);
      await service.cacheOCRResult('key2', mockOCRResult);

      expect(service.has('key1')).toBe(true);
      expect(service.has('key2')).toBe(true);

      service.clear();

      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(false);
    });

    it('should clear expired entries', async () => {
      const shortTTL: Partial<CacheOptions> = { ttl: 1000 }; // 1 second
      const longTTL: Partial<CacheOptions> = { ttl: 10000 }; // 10 seconds

      await service.cacheOCRResult('expired-key', mockOCRResult, shortTTL);
      await service.cacheOCRResult('valid-key', mockOCRResult, longTTL);

      // Advance time past short TTL but not long TTL
      jest.advanceTimersByTime(1500);

      const clearedCount = service.clearExpired();

      expect(clearedCount).toBe(1);
      expect(service.has('expired-key')).toBe(false);
      expect(service.has('valid-key')).toBe(true);
    });

    it('should handle expired entries in has() method', async () => {
      const key = 'test-key';
      const options: Partial<CacheOptions> = { ttl: 1000 };

      await service.cacheOCRResult(key, mockOCRResult, options);
      expect(service.has(key)).toBe(true);

      // Advance time past TTL
      jest.advanceTimersByTime(1500);

      expect(service.has(key)).toBe(false);
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', async () => {
      await service.cacheOCRResult('key1', mockOCRResult);
      await service.cacheOCRResult('key2', mockOCRResult);

      // Access one entry to increase hit count
      await service.getCachedOCRResult('key1');

      const stats: CacheStats = service.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeGreaterThan(0);
      expect(stats.newestEntry).toBeGreaterThan(0);
    });

    it('should provide top entries by access count', async () => {
      await service.cacheOCRResult('key1', mockOCRResult);
      await service.cacheOCRResult('key2', mockOCRResult);

      // Access key1 multiple times
      await service.getCachedOCRResult('key1');
      await service.getCachedOCRResult('key1');
      await service.getCachedOCRResult('key2');

      const topEntries = service.getTopEntries(2);

      expect(topEntries).toHaveLength(2);
      expect(topEntries[0].key).toBe('key1');
      expect(topEntries[0].accessCount).toBe(2);
      expect(topEntries[1].key).toBe('key2');
      expect(topEntries[1].accessCount).toBe(1);
    });

    it('should handle empty cache statistics', () => {
      const stats = service.getStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.missRate).toBe(0);
    });
  });

  describe('cache eviction', () => {
    it('should evict entries when size limit exceeded', async () => {
      const smallSizeOptions: Partial<CacheOptions> = {
        maxSize: 1000, // Very small limit
        maxEntries: 100
      };

      // Create large mock result
      const largeResult = {
        ...mockOCRResult,
        text: 'x'.repeat(2000) // Large text to exceed size limit
      };

      await service.cacheOCRResult('key1', mockOCRResult, smallSizeOptions);
      await service.cacheOCRResult('key2', largeResult, smallSizeOptions);

      // First entry should be evicted due to size limit
      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(true);
    });

    it('should evict entries when entry count limit exceeded', async () => {
      const limitedOptions: Partial<CacheOptions> = {
        maxEntries: 2,
        maxSize: 1000000 // Large size limit
      };

      await service.cacheOCRResult('key1', mockOCRResult, limitedOptions);
      await service.cacheOCRResult('key2', mockOCRResult, limitedOptions);
      await service.cacheOCRResult('key3', mockOCRResult, limitedOptions);

      // Should only have 2 entries
      const stats = service.getStats();
      expect(stats.totalEntries).toBe(2);
    });

    it('should evict least frequently used entries first', async () => {
      const limitedOptions: Partial<CacheOptions> = {
        maxEntries: 2,
        maxSize: 1000000
      };

      await service.cacheOCRResult('key1', mockOCRResult, limitedOptions);
      await service.cacheOCRResult('key2', mockOCRResult, limitedOptions);

      // Access key2 to increase its frequency
      await service.getCachedOCRResult('key2');

      // Add third entry, should evict key1 (less frequently used)
      await service.cacheOCRResult('key3', mockOCRResult, limitedOptions);

      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(true);
      expect(service.has('key3')).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should save cache to localStorage', async () => {
      await service.cacheOCRResult('test-key', mockOCRResult);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scanner_cache',
        expect.any(String)
      );
    });

    it('should handle localStorage save errors', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw error
      await expect(
        service.cacheOCRResult('test-key', mockOCRResult)
      ).resolves.not.toThrow();
    });

    it('should retry save after clearing expired entries', async () => {
      let callCount = 0;
      mockLocalStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Storage full');
        }
        // Second call should succeed
      });

      await service.cacheOCRResult('test-key', mockOCRResult);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should clear persistence on clear()', () => {
      service.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('scanner_cache');
    });
  });

  describe('cleanup and disposal', () => {
    it('should dispose resources properly', () => {
      service.dispose();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'scanner_cache',
        expect.any(String)
      );
    });

    it('should start cleanup interval', () => {
      // Advance time to trigger cleanup interval
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 minutes + buffer

      // Should have called clearExpired internally
      // This is tested indirectly through the timer advancement
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('export functionality', () => {
    it('should export cache for debugging', async () => {
      await service.cacheOCRResult('key1', mockOCRResult);
      await service.getCachedOCRResult('key1'); // Create hit

      const exported = service.exportCache();

      expect(exported).toHaveProperty('entries');
      expect(exported).toHaveProperty('stats');
      expect(exported).toHaveProperty('cacheStats');
      expect(exported.entries).toHaveProperty('key1');
      expect(exported.stats.hits).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle retrieval errors gracefully', async () => {
      // Mock internal cache to throw error
      const originalGet = Map.prototype.get;
      Map.prototype.get = jest.fn().mockImplementation(() => {
        throw new Error('Mock error');
      });

      const result = await service.getCachedOCRResult('test-key');

      expect(result).toBeNull();

      Map.prototype.get = originalGet;
    });

    it('should handle hash generation errors', () => {
      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Stringify error');
      });

      const blob = new Blob(['test'], { type: 'image/jpeg' });
      
      // Should not throw error, should use fallback
      expect(() => {
        service.generateOCRKey(blob, { complex: { nested: 'object' } });
      }).not.toThrow();

      JSON.stringify = originalStringify;
    });
  });

  describe('preload functionality', () => {
    it('should complete preload without errors', async () => {
      await expect(service.preloadFrequentResults()).resolves.not.toThrow();
    });
  });
});