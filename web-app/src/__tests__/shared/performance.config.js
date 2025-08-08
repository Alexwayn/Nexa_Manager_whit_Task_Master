/**
 * Performance Testing Configuration
 * Defines thresholds and settings for performance tests
 */

export const PERFORMANCE_THRESHOLDS = {
  // Page load times (in milliseconds)
  pageLoad: {
    excellent: 1000,
    good: 2000,
    acceptable: 3000,
    poor: 5000
  },

  // Component render times (in milliseconds)
  componentRender: {
    excellent: 16,   // 60fps
    good: 33,        // 30fps
    acceptable: 50,  // 20fps
    poor: 100
  },

  // API response times (in milliseconds)
  apiResponse: {
    excellent: 200,
    good: 500,
    acceptable: 1000,
    poor: 2000
  },

  // Memory usage (in MB)
  memoryUsage: {
    excellent: 50,
    good: 100,
    acceptable: 200,
    poor: 500
  },

  // Bundle size (in KB)
  bundleSize: {
    excellent: 500,
    good: 1000,
    acceptable: 2000,
    poor: 5000
  },

  // First Contentful Paint (in milliseconds)
  fcp: {
    excellent: 1000,
    good: 2000,
    acceptable: 3000,
    poor: 4000
  },

  // Largest Contentful Paint (in milliseconds)
  lcp: {
    excellent: 2000,
    good: 3000,
    acceptable: 4000,
    poor: 6000
  },

  // Cumulative Layout Shift
  cls: {
    excellent: 0.1,
    good: 0.15,
    acceptable: 0.25,
    poor: 0.5
  },

  // First Input Delay (in milliseconds)
  fid: {
    excellent: 50,
    good: 100,
    acceptable: 200,
    poor: 500
  }
};

export const PERFORMANCE_SCENARIOS = {
  // Different data sizes for testing
  dataSizes: {
    small: {
      reports: 10,
      schedules: 5,
      metrics: 6
    },
    medium: {
      reports: 100,
      schedules: 50,
      metrics: 20
    },
    large: {
      reports: 1000,
      schedules: 500,
      metrics: 100
    },
    xlarge: {
      reports: 10000,
      schedules: 5000,
      metrics: 500
    }
  },

  // Network conditions
  networkConditions: {
    fast3g: {
      downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
      uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
      latency: 150
    },
    slow3g: {
      downloadThroughput: 500 * 1024 / 8,         // 500 Kbps
      uploadThroughput: 500 * 1024 / 8,           // 500 Kbps
      latency: 300
    },
    offline: {
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    }
  },

  // Device types for testing
  devices: {
    desktop: {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    },
    tablet: {
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    mobile: {
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    },
    lowEndMobile: {
      viewport: { width: 320, height: 568 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    }
  }
};

export const PERFORMANCE_METRICS = {
  // Core Web Vitals
  coreWebVitals: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'first-input-delay'
  ],

  // Additional metrics
  additionalMetrics: [
    'time-to-interactive',
    'total-blocking-time',
    'speed-index',
    'dom-content-loaded',
    'load-event-end'
  ],

  // Custom metrics for reports
  customMetrics: [
    'report-generation-time',
    'chart-render-time',
    'data-fetch-time',
    'export-time',
    'filter-response-time'
  ]
};

export const PERFORMANCE_TEST_CONFIG = {
  // Test execution settings
  execution: {
    warmupRuns: 3,
    measurementRuns: 5,
    cooldownTime: 1000, // ms between runs
    timeout: 30000       // ms
  },

  // Monitoring settings
  monitoring: {
    sampleInterval: 100,  // ms
    memoryInterval: 1000, // ms
    cpuInterval: 500      // ms
  },

  // Reporting settings
  reporting: {
    generateCharts: true,
    saveRawData: true,
    compareBaseline: true,
    alertOnRegression: true,
    regressionThreshold: 0.1 // 10% regression threshold
  }
};

export const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'mainthread-work-breakdown',
      'bootup-time',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-text-compression',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'efficient-animated-content',
      'duplicated-javascript'
    ],
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36 lighthouse'
  }
};

export const BUDGET_CONFIG = {
  // Performance budgets
  budgets: [
    {
      resourceType: 'script',
      budget: 400 // KB
    },
    {
      resourceType: 'stylesheet',
      budget: 100 // KB
    },
    {
      resourceType: 'image',
      budget: 500 // KB
    },
    {
      resourceType: 'font',
      budget: 100 // KB
    },
    {
      resourceType: 'total',
      budget: 1000 // KB
    }
  ],

  // Timing budgets
  timingBudgets: [
    {
      metric: 'first-contentful-paint',
      budget: 2000 // ms
    },
    {
      metric: 'largest-contentful-paint',
      budget: 3000 // ms
    },
    {
      metric: 'cumulative-layout-shift',
      budget: 0.1
    },
    {
      metric: 'total-blocking-time',
      budget: 300 // ms
    }
  ]
};

export const STRESS_TEST_CONFIG = {
  // Concurrent users simulation
  concurrentUsers: {
    light: 10,
    medium: 50,
    heavy: 100,
    extreme: 500
  },

  // Data volume tests
  dataVolume: {
    reports: [100, 500, 1000, 5000, 10000],
    schedules: [50, 250, 500, 2500, 5000],
    chartDataPoints: [100, 500, 1000, 5000, 10000]
  },

  // Memory leak detection
  memoryLeak: {
    iterations: 100,
    memoryThreshold: 50, // MB increase
    gcForce: true
  },

  // Long-running tests
  endurance: {
    duration: 30 * 60 * 1000, // 30 minutes
    actionInterval: 5000,      // 5 seconds
    memoryCheckInterval: 60000 // 1 minute
  }
};

export const ACCESSIBILITY_CONFIG = {
  // WCAG compliance levels
  wcagLevel: 'AA',
  
  // Rules to test
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-markup': { enabled: true },
    'alt-text': { enabled: true },
    'form-labels': { enabled: true },
    'heading-structure': { enabled: true }
  },

  // Screen reader simulation
  screenReader: {
    enabled: true,
    announcements: true,
    navigation: true
  },

  // Keyboard navigation
  keyboard: {
    tabOrder: true,
    shortcuts: true,
    focusTraps: true,
    skipLinks: true
  }
};

// Export default configuration
export default {
  thresholds: PERFORMANCE_THRESHOLDS,
  scenarios: PERFORMANCE_SCENARIOS,
  metrics: PERFORMANCE_METRICS,
  testConfig: PERFORMANCE_TEST_CONFIG,
  lighthouse: LIGHTHOUSE_CONFIG,
  budget: BUDGET_CONFIG,
  stress: STRESS_TEST_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG
};
