import Logger from '@utils/Logger';

/**
 * EmailCacheService - Manages email content caching for performance optimization
 * 
 * Features:
 * - LRU cache for email content
 * - Lazy loading of email content
 * - Memory management and cleanup
 * - Cache statistics and monitoring
 */
class EmailCacheService {
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 500;
    this.maxMemoryMB = options.maxMemoryMB || 50;
    this.ttl = options.ttl || 30 * 60 * 1000; // 30 minutes
    
    // Cache storage
    this.cache = new Map();
    this.accessTimes = new Map();
    this.loadingPromises = new Map();
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
    };
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get email content from cache or load it
   */
  async getEmailContent(emailId, loader) {
    const cacheKey = `email_${emailId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      
      // Check if not expired
      if (Date.now() - cached.timestamp < this.ttl) {
        this.accessTimes.set(cacheKey, Date.now());
        this.stats.hits++;
        return cached.data;
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
        this.accessTimes.delete(cacheKey);
      }
    }
    
    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }
    
    // Load email content
    this.stats.misses++;
    const loadingPromise = this.loadEmailContent(emailId, loader);
    this.loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      const content = await loadingPromise;
      this.setCache(cacheKey, content);
      return content;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Load email content using the provided loader function
   */
  async loadEmailContent(emailId, loader) {
    try {
      if (typeof loader === 'function') {
        return await loader(emailId);
      } else {
        throw new Error('Loader function is required');
      }
    } catch (error) {
      Logger.error('Error loading email content:', error);
      throw error;
    }
  }

  /**
   * Set content in cache
   */
  setCache(key, data) {
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }
    
    // Check memory usage
    const dataSize = this.estimateSize(data);
    if (this.stats.memoryUsage + dataSize > this.maxMemoryMB * 1024 * 1024) {
      this.evictByMemory();
    }
    
    // Add to cache
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      size: dataSize,
    };
    
    this.cache.set(key, cacheEntry);
    this.accessTimes.set(key, Date.now());
    this.stats.memoryUsage += dataSize;
  }

  /**
   * Evict least recently used items
   */
  evictLRU() {
    if (this.cache.size === 0) return;
    
    // Find least recently used item
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.removeFromCache(oldestKey);
    }
  }

  /**
   * Evict items to free memory
   */
  evictByMemory() {
    const targetMemory = this.maxMemoryMB * 1024 * 1024 * 0.8; // 80% of max
    
    // Sort by access time (oldest first)
    const sortedEntries = Array.from(this.accessTimes.entries())
      .sort((a, b) => a[1] - b[1]);
    
    for (const [key] of sortedEntries) {
      if (this.stats.memoryUsage <= targetMemory) break;
      this.removeFromCache(key);
    }
  }

  /**
   * Remove item from cache
   */
  removeFromCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.stats.memoryUsage -= cached.size;
      this.stats.evictions++;
    }
  }

  /**
   * Estimate data size in bytes
   */
  estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      // Fallback estimation
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.removeFromCache(key));
    
    Logger.debug(`Email cache cleanup: removed ${expiredKeys.length} expired entries`);
  }

  /**
   * Preload email content for visible items
   */
  async preloadEmails(emailIds, loader) {
    const preloadPromises = emailIds.map(async (emailId) => {
      try {
        await this.getEmailContent(emailId, loader);
      } catch (error) {
        Logger.warn(`Failed to preload email ${emailId}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.loadingPromises.clear();
    this.stats.memoryUsage = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsageMB: (this.stats.memoryUsage / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Destroy cache service
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Create singleton instance with lazy initialization
let emailCacheServiceInstance = null;

export const getEmailCacheService = () => {
  if (!emailCacheServiceInstance) {
    emailCacheServiceInstance = new EmailCacheService({
      maxCacheSize: 500,
      maxMemoryMB: 50,
      ttl: 30 * 60 * 1000, // 30 minutes
    });
  }
  return emailCacheServiceInstance;
};

// Export default instance for backward compatibility
export default getEmailCacheService;