// Mock for emailCacheService
const emailCacheService = {
  // Cache management
  clear: jest.fn(() => Promise.resolve({ success: true })),
  clearAll: jest.fn(() => Promise.resolve({ success: true })),
  
  // Email caching
  cacheEmail: jest.fn(() => Promise.resolve({ success: true })),
  getCachedEmail: jest.fn(() => Promise.resolve({ success: true, data: null })),
  removeCachedEmail: jest.fn(() => Promise.resolve({ success: true })),
  
  // Bulk operations
  cacheEmails: jest.fn(() => Promise.resolve({ success: true })),
  getCachedEmails: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  
  // Cache statistics
  getCacheStats: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      totalCached: 0,
      cacheSize: 0,
      hitRate: 0
    }
  })),
  
  // Cache optimization
  optimizeCache: jest.fn(() => Promise.resolve({ success: true })),
  
  // Event handlers
  onCacheUpdate: jest.fn(),
  onCacheClear: jest.fn(),
};

export default emailCacheService;