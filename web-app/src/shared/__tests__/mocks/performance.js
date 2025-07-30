// Mock performance configuration for tests

// React Query configuration
export const REACT_QUERY_CONFIG = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      suspense: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

// Virtualization settings
export const VIRTUALIZATION_CONFIG = {
  table: {
    itemSize: 60,
    overscan: 5,
    threshold: 100,
  },
  list: {
    itemSize: 80,
    overscan: 3,
    threshold: 50,
  },
};

// Memory optimization settings
export const MEMORY_CONFIG = {
  tracking: {
    enabled: true, // Always enabled in tests
    interval: 30000,
    maxEntries: 1000,
  },
  cleanup: {
    interval: 60000,
    maxAge: 300000,
  },
  thresholds: {
    warning: 50 * 1024 * 1024,
    critical: 100 * 1024 * 1024,
  },
};

// Cache configuration
export const CACHE_CONFIG = {
  reports: {
    ttl: 15 * 60 * 1000,
    maxSize: 50,
    compressionThreshold: 1024,
  },
  images: {
    ttl: 60 * 60 * 1000,
    maxSize: 100,
    compressionThreshold: 10240,
  },
  api: {
    ttl: 5 * 60 * 1000,
    maxSize: 200,
    compressionThreshold: 512,
  },
};

// Bundle optimization settings
export const BUNDLE_CONFIG = {
  chunkSizeWarning: 244 * 1024,
  chunkSizeCritical: 512 * 1024,
  preloadThreshold: 3,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Intersection Observer settings
export const INTERSECTION_CONFIG = {
  rootMargin: '50px',
  threshold: [0, 0.25, 0.5, 0.75, 1],
  trackVisibility: true,
  delay: 100,
};

// Performance monitoring settings
export const MONITORING_CONFIG = {
  enabled: true, // Always enabled in tests
  sampleRate: 0.1,
  metrics: {
    renderTime: true,
    memoryUsage: true,
    bundleSize: true,
    cacheHitRate: true,
  },
  thresholds: {
    renderTime: 16,
    memoryGrowth: 10 * 1024 * 1024,
    cacheHitRate: 0.8,
  },
};

// Image optimization settings
export const IMAGE_CONFIG = {
  lazyLoading: {
    enabled: true,
    rootMargin: '200px',
    threshold: 0.1,
  },
  formats: {
    webp: true,
    avif: false,
    fallback: 'jpg',
  },
  quality: {
    default: 80,
    thumbnail: 60,
    hero: 90,
  },
  sizes: {
    thumbnail: [150, 150],
    small: [300, 200],
    medium: [600, 400],
    large: [1200, 800],
  },
};

// Error boundary settings
export const ERROR_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  fallbackComponent: 'ErrorFallback',
  reportErrors: false, // Disabled in tests
  errorTypes: {
    ChunkLoadError: {
      retry: true,
      message: 'Failed to load application resources. Please refresh the page.',
    },
    NetworkError: {
      retry: true,
      message: 'Network connection issue. Please check your internet connection.',
    },
    RenderError: {
      retry: false,
      message: 'An unexpected error occurred. Please try again.',
    },
  },
};

// Development tools settings
export const DEV_TOOLS_CONFIG = {
  performanceDashboard: {
    enabled: true, // Always enabled in tests
    position: 'bottom-right',
    collapsed: true,
  },
  memoryTracker: {
    enabled: true, // Always enabled in tests
    interval: 5000,
    maxEntries: 100,
  },
  bundleAnalyzer: {
    enabled: true, // Always enabled in tests
    trackChunks: true,
    trackRetries: true,
  },
};

// Export all configurations
export default {
  reactQuery: REACT_QUERY_CONFIG,
  virtualization: VIRTUALIZATION_CONFIG,
  memory: MEMORY_CONFIG,
  cache: CACHE_CONFIG,
  bundle: BUNDLE_CONFIG,
  intersection: INTERSECTION_CONFIG,
  monitoring: MONITORING_CONFIG,
  image: IMAGE_CONFIG,
  error: ERROR_CONFIG,
  devTools: DEV_TOOLS_CONFIG,
};