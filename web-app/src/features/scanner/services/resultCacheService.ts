// Result caching service for OCR and processing results
import type { OCRResult, ProcessedDocument } from '@/types/scanner';
import Logger from '@/utils/Logger';
import { captureError } from '@/lib/sentry';

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  enablePersistence?: boolean; // Store in localStorage
  compressionEnabled?: boolean; // Compress large entries
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
  averageAccessCount: number;
}

export class ResultCacheService {
  private static instance: ResultCacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  private readonly defaultOptions: Required<CacheOptions> = {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    enablePersistence: true,
    compressionEnabled: true
  };

  private constructor() {
    this.loadFromPersistence();
    this.startCleanupInterval();
  }

  static getInstance(): ResultCacheService {
    if (!ResultCacheService.instance) {
      ResultCacheService.instance = new ResultCacheService();
    }
    return ResultCacheService.instance;
  }

  /**
   * Generate cache key for OCR results
   */
  generateOCRKey(imageBlob: Blob, options?: any): string {
    const imageInfo = `${imageBlob.size}_${imageBlob.type}`;
    const optionsHash = options ? this.hashObject(options) : 'default';
    return `ocr_${imageInfo}_${optionsHash}`;
  }

  /**
   * Generate cache key for processed documents
   */
  generateDocumentKey(documentId: string, version?: string): string {
    return `doc_${documentId}_${version || 'latest'}`;
  }

  /**
   * Generate cache key for image processing results
   */
  generateImageProcessingKey(imageBlob: Blob, operation: string, params?: any): string {
    const imageInfo = `${imageBlob.size}_${imageBlob.type}`;
    const paramsHash = params ? this.hashObject(params) : 'default';
    return `img_${operation}_${imageInfo}_${paramsHash}`;
  }

  /**
   * Store OCR result in cache
   */
  async cacheOCRResult(
    key: string, 
    result: OCRResult, 
    options: Partial<CacheOptions> = {}
  ): Promise<void> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      const serializedData = JSON.stringify(result);
      const size = new Blob([serializedData]).size;

      const entry: CacheEntry<OCRResult> = {
        key,
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + finalOptions.ttl,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      await this.setEntry(key, entry, finalOptions);
      
      Logger.info('OCR result cached', { key, size, provider: result.provider });
    } catch (error) {
      Logger.error('Failed to cache OCR result', error);
      captureError(error instanceof Error ? error : new Error('Cache error'), {
        component: 'ResultCacheService',
        action: 'cacheOCRResult',
        extra: { key }
      });
    }
  }

  /**
   * Retrieve OCR result from cache
   */
  async getCachedOCRResult(key: string): Promise<OCRResult | null> {
    try {
      const entry = await this.getEntry<OCRResult>(key);
      if (entry) {
        Logger.info('OCR result cache hit', { key, provider: entry.data.provider });
        return entry.data;
      } else {
        Logger.debug('OCR result cache miss', { key });
        return null;
      }
    } catch (error) {
      Logger.error('Failed to retrieve cached OCR result', error);
      return null;
    }
  }

  /**
   * Store processed document in cache
   */
  async cacheProcessedDocument(
    key: string, 
    document: ProcessedDocument, 
    options: Partial<CacheOptions> = {}
  ): Promise<void> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      const serializedData = JSON.stringify(document);
      const size = new Blob([serializedData]).size;

      const entry: CacheEntry<ProcessedDocument> = {
        key,
        data: document,
        timestamp: Date.now(),
        expiresAt: Date.now() + finalOptions.ttl,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      await this.setEntry(key, entry, finalOptions);
      
      Logger.info('Processed document cached', { key, size, documentId: document.id });
    } catch (error) {
      Logger.error('Failed to cache processed document', error);
    }
  }

  /**
   * Retrieve processed document from cache
   */
  async getCachedProcessedDocument(key: string): Promise<ProcessedDocument | null> {
    try {
      const entry = await this.getEntry<ProcessedDocument>(key);
      if (entry) {
        Logger.info('Processed document cache hit', { key, documentId: entry.data.id });
        return entry.data;
      } else {
        Logger.debug('Processed document cache miss', { key });
        return null;
      }
    } catch (error) {
      Logger.error('Failed to retrieve cached processed document', error);
      return null;
    }
  }

  /**
   * Cache image processing result
   */
  async cacheImageProcessingResult(
    key: string, 
    result: any, 
    options: Partial<CacheOptions> = {}
  ): Promise<void> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options };
      const serializedData = JSON.stringify(result);
      const size = new Blob([serializedData]).size;

      const entry: CacheEntry<any> = {
        key,
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + finalOptions.ttl,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      await this.setEntry(key, entry, finalOptions);
      
      Logger.info('Image processing result cached', { key, size });
    } catch (error) {
      Logger.error('Failed to cache image processing result', error);
    }
  }

  /**
   * Retrieve image processing result from cache
   */
  async getCachedImageProcessingResult(key: string): Promise<any | null> {
    try {
      const entry = await this.getEntry<any>(key);
      if (entry) {
        Logger.info('Image processing result cache hit', { key });
        return entry.data;
      } else {
        Logger.debug('Image processing result cache miss', { key });
        return null;
      }
    } catch (error) {
      Logger.error('Failed to retrieve cached image processing result', error);
      return null;
    }
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToPersistence();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    this.clearPersistence();
    Logger.info('Cache cleared');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      this.saveToPersistence();
      Logger.info('Expired cache entries cleared', { count: cleared });
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccess = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: entries.length,
      totalSize,
      hitRate: totalAccess > 0 ? this.stats.hits / totalAccess : 0,
      missRate: totalAccess > 0 ? this.stats.misses / totalAccess : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
      averageAccessCount: entries.length > 0 ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length : 0
    };
  }

  /**
   * Get cache entries sorted by access frequency
   */
  getTopEntries(limit: number = 10): Array<{ key: string; accessCount: number; size: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  private async setEntry<T>(
    key: string, 
    entry: CacheEntry<T>, 
    options: Required<CacheOptions>
  ): Promise<void> {
    // Check if we need to make space
    await this.ensureSpace(entry.size, options);
    
    this.cache.set(key, entry);
    
    if (options.enablePersistence) {
      this.saveToPersistence();
    }
  }

  private async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry as CacheEntry<T>;
  }

  private async ensureSpace(newEntrySize: number, options: Required<CacheOptions>): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const currentEntries = this.cache.size;
    
    // Check size limit
    if (currentSize + newEntrySize > options.maxSize) {
      await this.evictBySize(currentSize + newEntrySize - options.maxSize);
    }
    
    // Check entry count limit
    if (currentEntries >= options.maxEntries) {
      await this.evictByCount(currentEntries - options.maxEntries + 1);
    }
  }

  private async evictBySize(bytesToEvict: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Sort by access frequency (ascending) and last accessed (ascending)
        const frequencyDiff = a.accessCount - b.accessCount;
        if (frequencyDiff !== 0) return frequencyDiff;
        return a.lastAccessed - b.lastAccessed;
      });
    
    let evicted = 0;
    for (const [key, entry] of entries) {
      if (evicted >= bytesToEvict) break;
      
      this.cache.delete(key);
      evicted += entry.size;
      this.stats.evictions++;
    }
    
    Logger.info('Cache eviction by size', { bytesToEvict, actualEvicted: evicted });
  }

  private async evictByCount(entriesToEvict: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Sort by access frequency (ascending) and last accessed (ascending)
        const frequencyDiff = a.accessCount - b.accessCount;
        if (frequencyDiff !== 0) return frequencyDiff;
        return a.lastAccessed - b.lastAccessed;
      });
    
    for (let i = 0; i < entriesToEvict && i < entries.length; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.stats.evictions++;
    }
    
    Logger.info('Cache eviction by count', { entriesToEvict });
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private loadFromPersistence(): void {
    if (!this.defaultOptions.enablePersistence) return;
    
    try {
      const cached = localStorage.getItem('scanner_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        for (const [key, entry] of Object.entries(data)) {
          const cacheEntry = entry as CacheEntry<any>;
          // Only load non-expired entries
          if (now <= cacheEntry.expiresAt) {
            this.cache.set(key, cacheEntry);
          }
        }
        
        Logger.info('Cache loaded from persistence', { entries: this.cache.size });
      }
    } catch (error) {
      Logger.warn('Failed to load cache from persistence', error);
      this.clearPersistence();
    }
  }

  private saveToPersistence(): void {
    if (!this.defaultOptions.enablePersistence) return;
    
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem('scanner_cache', JSON.stringify(data));
    } catch (error) {
      Logger.warn('Failed to save cache to persistence', error);
      // If storage is full, clear some space and try again
      this.clearExpired();
      try {
        const data = Object.fromEntries(this.cache.entries());
        localStorage.setItem('scanner_cache', JSON.stringify(data));
      } catch (retryError) {
        Logger.error('Failed to save cache after cleanup', retryError);
      }
    }
  }

  private clearPersistence(): void {
    try {
      localStorage.removeItem('scanner_cache');
    } catch (error) {
      Logger.warn('Failed to clear cache persistence', error);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.clearExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Preload frequently used results
   */
  async preloadFrequentResults(): Promise<void> {
    // This could be enhanced to preload based on user patterns
    Logger.info('Cache preload completed');
  }

  /**
   * Export cache for debugging
   */
  exportCache(): any {
    return {
      entries: Object.fromEntries(this.cache.entries()),
      stats: this.stats,
      cacheStats: this.getStats()
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.saveToPersistence();
    this.cache.clear();
  }
}

export default ResultCacheService;
