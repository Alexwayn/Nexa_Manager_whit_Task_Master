/**
 * Performance testing configuration for analytics features
 */

export const PERFORMANCE_THRESHOLDS = {
  // Page load times (in milliseconds)
  PAGE_LOAD_TIME: 3000,
  FIRST_CONTENTFUL_PAINT: 1500,
  LARGEST_CONTENTFUL_PAINT: 2500,
  
  // Chart rendering times
  CHART_RENDER_TIME: 1000,
  CHART_UPDATE_TIME: 500,
  
  // Data processing times
  DATA_PROCESSING_TIME: 2000,
  REPORT_GENERATION_TIME: 5000,
  
  // Memory usage (in MB)
  MEMORY_USAGE_LIMIT: 100,
  
  // Bundle sizes (in KB)
  BUNDLE_SIZE_LIMIT: 500,
  CHUNK_SIZE_LIMIT: 250
};

export const PERFORMANCE_SCENARIOS = {
  SMALL_DATASET: {
    records: 100,
    charts: 3,
    timeRange: '7d'
  },
  MEDIUM_DATASET: {
    records: 1000,
    charts: 5,
    timeRange: '30d'
  },
  LARGE_DATASET: {
    records: 10000,
    charts: 10,
    timeRange: '1y'
  }
};

export const STRESS_TEST_CONFIG = {
  CONCURRENT_USERS: 10,
  REQUESTS_PER_SECOND: 50,
  TEST_DURATION: 60000, // 1 minute
  RAMP_UP_TIME: 10000   // 10 seconds
};