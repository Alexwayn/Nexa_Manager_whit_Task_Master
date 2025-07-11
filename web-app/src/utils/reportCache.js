/**
 * Advanced caching utilities for report data
 * Provides intelligent caching, compression, and cache management
 */

import { compress, decompress } from 'lz-string';

// Cache configuration
const CACHE_CONFIG = {
  // Cache TTL in milliseconds
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  METRICS_TTL: 2 * 60 * 1000, // 2 minutes
  REPORTS_TTL: 10 * 60 * 1000, // 10 minutes
  TEMPLATES_TTL: 30 * 60 * 1000, // 30 minutes
  
  // Cache size limits
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_ENTRIES: 1000,
  
  // Compression settings
  COMPRESS_THRESHOLD: 1024, // Compress data larger than 1KB
  
  // Storage keys
  STORAGE_PREFIX: 'nexa_reports_cache_',
  METADATA_KEY: 'nexa_cache_metadata',
};

// Cache entry structure
class CacheEntry {
  constructor(data, ttl = CACHE_CONFIG.DEFAULT_TTL, options = {}) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.accessCount = 0;
    this.lastAccessed = this.timestamp;
    this.compressed = false;
    this.size = this.calculateSize(data);
    this.tags = options.tags || [];
    this.priority = options.priority || 'normal'; // low, normal, high
    
    // Compress large data
    if (this.size > CACHE_CONFIG.COMPRESS_THRESHOLD) {
      this.compressData();
    }
  }
  
  calculateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }
  
  compressData() {
    try {
      this.data = compress(JSON.stringify(this.data));
      this.compressed = true;
      this.size = this.data.length * 2; // Rough compressed size
    } catch (error) {
      console.warn('Failed to compress cache data:', error);
    }
  }
  
  decompressData() {
    if (this.compressed) {
      try {
        return JSON.parse(decompress(this.data));
      } catch (error) {
        console.error('Failed to decompress cache data:', error);
        return null;
      }
    }
    return this.data;
  }
  
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }
  
  touch() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }
  
  getValue() {
    this.touch();
    return this.decompressData();
  }
}

// Main cache manager
class ReportCacheManager {
  constructor() {
    this.cache = new Map();
    this.metadata = this.loadMetadata();
    this.totalSize = 0;
    
    // Initialize from localStorage
    this.loadFromStorage();
    
    // Setup cleanup interval
    this.setupCleanup();
    
    // Setup storage event listener for cross-tab sync
    this.setupStorageSync();
  }
  
  /**
   * Generate cache key
   */
  generateKey(type, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${type}:${JSON.stringify(sortedParams)}`;
  }
  
  /**
   * Set cache entry
   */
  set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL, options = {}) {
    try {
      const entry = new CacheEntry(data, ttl, options);
      
      // Check cache size limits
      if (this.totalSize + entry.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
        this.evictLRU(entry.size);
      }
      
      // Check entry count limit
      if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
        this.evictLRU();
      }
      
      // Remove existing entry if present
      if (this.cache.has(key)) {
        this.totalSize -= this.cache.get(key).size;
      }
      
      // Add new entry
      this.cache.set(key, entry);
      this.totalSize += entry.size;
      
      // Update metadata
      this.updateMetadata(key, entry);
      
      // Persist to storage for important data
      if (options.persist !== false) {
        this.persistToStorage(key, entry);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set cache entry:', error);
      return false;
    }
  }
  
  /**
   * Get cache entry
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Try loading from storage
      const storedEntry = this.loadFromStorageKey(key);
      if (storedEntry && !storedEntry.isExpired()) {
        this.cache.set(key, storedEntry);
        this.totalSize += storedEntry.size;
        return storedEntry.getValue();
      }
      return null;
    }
    
    if (entry.isExpired()) {
      this.delete(key);
      return null;
    }
    
    return entry.getValue();
  }
  
  /**
   * Check if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    return entry && !entry.isExpired();
  }
  
  /**
   * Delete cache entry
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
      this.removeFromStorage(key);
      this.removeFromMetadata(key);
      return true;
    }
    return false;
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.totalSize = 0;
    this.clearStorage();
    this.metadata = { entries: {}, stats: this.getInitialStats() };
  }
  
  /**
   * Clear cache entries by tag
   */
  clearByTag(tag) {
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }
  
  /**
   * Clear expired entries
   */
  clearExpired() {
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
  
  /**
   * Evict least recently used entries
   */
  evictLRU(targetSize = 0) {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by priority first, then by last accessed time
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.entry.priority] || 2;
        const bPriority = priorityOrder[b.entry.priority] || 2;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Lower priority first
        }
        
        return a.entry.lastAccessed - b.entry.lastAccessed; // Older first
      });
    
    let freedSize = 0;
    const targetFreeSize = targetSize || CACHE_CONFIG.MAX_CACHE_SIZE * 0.2; // Free 20% by default
    
    for (const { key } of entries) {
      if (freedSize >= targetFreeSize) break;
      
      const entry = this.cache.get(key);
      if (entry) {
        freedSize += entry.size;
        this.delete(key);
      }
    }
    
    return freedSize;
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let hitCount = 0;
    let totalAccess = 0;
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      if (entry.accessCount > 0) hitCount++;
      if (entry.isExpired()) expiredCount++;
    }
    
    return {
      size: this.cache.size,
      totalSize: this.totalSize,
      hitRate: totalAccess > 0 ? hitCount / totalAccess : 0,
      expiredCount,
      memoryUsage: (this.totalSize / CACHE_CONFIG.MAX_CACHE_SIZE) * 100,
      ...this.metadata.stats,
    };
  }
  
  /**
   * Get cache entries info
   */
  getEntries() {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      compressed: entry.compressed,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      ttl: entry.ttl,
      isExpired: entry.isExpired(),
      tags: entry.tags,
      priority: entry.priority,
    }));
  }
  
  /**
   * Preload cache with data
   */
  async preload(preloadConfig) {
    const promises = preloadConfig.map(async ({ key, loader, ttl, options }) => {
      try {
        if (!this.has(key)) {
          const data = await loader();
          this.set(key, data, ttl, options);
        }
      } catch (error) {
        console.error(`Failed to preload cache key ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  // Storage management methods
  loadMetadata() {
    try {
      const stored = localStorage.getItem(CACHE_CONFIG.METADATA_KEY);
      return stored ? JSON.parse(stored) : {
        entries: {},
        stats: this.getInitialStats(),
      };
    } catch {
      return {
        entries: {},
        stats: this.getInitialStats(),
      };
    }
  }
  
  getInitialStats() {
    return {
      totalHits: 0,
      totalMisses: 0,
      totalSets: 0,
      totalDeletes: 0,
      lastCleanup: Date.now(),
    };
  }
  
  updateMetadata(key, entry) {
    this.metadata.entries[key] = {
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      size: entry.size,
      tags: entry.tags,
      priority: entry.priority,
    };
    
    this.metadata.stats.totalSets++;
    this.saveMetadata();
  }
  
  removeFromMetadata(key) {
    delete this.metadata.entries[key];
    this.metadata.stats.totalDeletes++;
    this.saveMetadata();
  }
  
  saveMetadata() {
    try {
      localStorage.setItem(CACHE_CONFIG.METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }
  
  persistToStorage(key, entry) {
    try {
      const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
      const serialized = {
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        compressed: entry.compressed,
        tags: entry.tags,
        priority: entry.priority,
      };
      
      localStorage.setItem(storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.warn('Failed to persist cache entry to storage:', error);
    }
  }
  
  loadFromStorageKey(key) {
    try {
      const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        const entry = new CacheEntry(parsed.data, parsed.ttl, {
          tags: parsed.tags,
          priority: parsed.priority,
        });
        
        entry.timestamp = parsed.timestamp;
        entry.compressed = parsed.compressed;
        
        return entry;
      }
    } catch (error) {
      console.warn('Failed to load cache entry from storage:', error);
    }
    
    return null;
  }
  
  loadFromStorage() {
    // Load important cache entries from localStorage
    for (const key in this.metadata.entries) {
      const entry = this.loadFromStorageKey(key);
      if (entry && !entry.isExpired()) {
        this.cache.set(key, entry);
        this.totalSize += entry.size;
      }
    }
  }
  
  removeFromStorage(key) {
    try {
      const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache entry from storage:', error);
    }
  }
  
  clearStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(CACHE_CONFIG.METADATA_KEY);
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
  
  setupCleanup() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      const expiredCount = this.clearExpired();
      
      // If cache is getting full, evict some entries
      if (this.totalSize > CACHE_CONFIG.MAX_CACHE_SIZE * 0.8) {
        this.evictLRU();
      }
      
      this.metadata.stats.lastCleanup = Date.now();
      this.saveMetadata();
      
      if (import.meta.env.DEV && expiredCount > 0) {
        console.log(`🧹 Cache cleanup: removed ${expiredCount} expired entries`);
      }
    }, 5 * 60 * 1000);
  }
  
  setupStorageSync() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === CACHE_CONFIG.METADATA_KEY) {
        // Reload metadata from storage
        this.metadata = this.loadMetadata();
      } else if (e.key?.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        // Handle cache entry changes
        const cacheKey = e.key.replace(CACHE_CONFIG.STORAGE_PREFIX, '');
        
        if (e.newValue === null) {
          // Entry was deleted
          this.cache.delete(cacheKey);
        } else {
          // Entry was updated - reload if we have it
          if (this.cache.has(cacheKey)) {
            const entry = this.loadFromStorageKey(cacheKey);
            if (entry) {
              this.cache.set(cacheKey, entry);
            }
          }
        }
      }
    });
  }
}

// Global cache instance
const reportCache = new ReportCacheManager();

// Export cache utilities
export const cacheUtils = {
  // Report-specific cache methods
  metrics: {
    get: (params) => reportCache.get(reportCache.generateKey('metrics', params)),
    set: (params, data) => reportCache.set(
      reportCache.generateKey('metrics', params),
      data,
      CACHE_CONFIG.METRICS_TTL,
      { tags: ['metrics'], priority: 'high' }
    ),
    clear: () => reportCache.clearByTag('metrics'),
  },
  
  reports: {
    get: (params) => reportCache.get(reportCache.generateKey('reports', params)),
    set: (params, data) => reportCache.set(
      reportCache.generateKey('reports', params),
      data,
      CACHE_CONFIG.REPORTS_TTL,
      { tags: ['reports'], priority: 'normal' }
    ),
    clear: () => reportCache.clearByTag('reports'),
  },
  
  templates: {
    get: (params) => reportCache.get(reportCache.generateKey('templates', params)),
    set: (params, data) => reportCache.set(
      reportCache.generateKey('templates', params),
      data,
      CACHE_CONFIG.TEMPLATES_TTL,
      { tags: ['templates'], priority: 'normal', persist: true }
    ),
    clear: () => reportCache.clearByTag('templates'),
  },
  
  // Generic cache methods
  get: (key) => reportCache.get(key),
  set: (key, data, ttl, options) => reportCache.set(key, data, ttl, options),
  delete: (key) => reportCache.delete(key),
  clear: () => reportCache.clear(),
  has: (key) => reportCache.has(key),
  
  // Cache management
  getStats: () => reportCache.getStats(),
  getEntries: () => reportCache.getEntries(),
  clearExpired: () => reportCache.clearExpired(),
  preload: (config) => reportCache.preload(config),
};

export { reportCache, CACHE_CONFIG };
export default cacheUtils;