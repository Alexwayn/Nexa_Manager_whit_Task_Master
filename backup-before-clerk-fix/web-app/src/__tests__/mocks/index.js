// Central mocking infrastructure for external dependencies
// This file provides comprehensive mocks for all external services and libraries

import { jest } from '@jest/globals';

// =============================================================================
// SUPABASE MOCKS
// =============================================================================

// Mock Supabase Client
export const createMockSupabaseClient = (customResponses = {}) => {
  const defaultResponses = {
    select: { data: [], error: null },
    insert: { data: null, error: null },
    update: { data: null, error: null },
    delete: { data: null, error: null },
    upsert: { data: null, error: null },
  };

  const responses = { ...defaultResponses, ...customResponses };

  const mockClient = {
    // Query methods
    from: jest.fn(() => mockClient),
    select: jest.fn(() => Promise.resolve(responses.select)),
    insert: jest.fn(() => Promise.resolve(responses.insert)),
    update: jest.fn(() => Promise.resolve(responses.update)),
    delete: jest.fn(() => Promise.resolve(responses.delete)),
    upsert: jest.fn(() => Promise.resolve(responses.upsert)),

    // Filter methods
    eq: jest.fn(() => mockClient),
    neq: jest.fn(() => mockClient),
    gt: jest.fn(() => mockClient),
    gte: jest.fn(() => mockClient),
    lt: jest.fn(() => mockClient),
    lte: jest.fn(() => mockClient),
    like: jest.fn(() => mockClient),
    ilike: jest.fn(() => mockClient),
    is: jest.fn(() => mockClient),
    in: jest.fn(() => mockClient),
    contains: jest.fn(() => mockClient),
    containedBy: jest.fn(() => mockClient),
    rangeGt: jest.fn(() => mockClient),
    rangeGte: jest.fn(() => mockClient),
    rangeLt: jest.fn(() => mockClient),
    rangeLte: jest.fn(() => mockClient),
    rangeAdjacent: jest.fn(() => mockClient),
    overlaps: jest.fn(() => mockClient),
    textSearch: jest.fn(() => mockClient),
    match: jest.fn(() => mockClient),
    not: jest.fn(() => mockClient),
    or: jest.fn(() => mockClient),
    filter: jest.fn(() => mockClient),

    // Modifier methods
    order: jest.fn(() => mockClient),
    limit: jest.fn(() => mockClient),
    range: jest.fn(() => mockClient),
    abortSignal: jest.fn(() => mockClient),
    single: jest.fn(() => mockClient),
    maybeSingle: jest.fn(() => mockClient),
    csv: jest.fn(() => mockClient),
    geojson: jest.fn(() => mockClient),
    explain: jest.fn(() => mockClient),
    rollback: jest.fn(() => mockClient),
    returns: jest.fn(() => mockClient),

    // RPC methods
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),

    // Auth methods
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      ),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
      updateUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      setSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      refreshSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },

    // Storage methods
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-file.pdf' }, error: null })),
        download: jest.fn(() => Promise.resolve({ data: new Blob(['test']), error: null })),
        remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
        list: jest.fn(() => Promise.resolve({ data: [], error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } })),
        createSignedUrl: jest.fn(() =>
          Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
        ),
        createSignedUrls: jest.fn(() => Promise.resolve({ data: [], error: null })),
        move: jest.fn(() => Promise.resolve({ data: null, error: null })),
        copy: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },

    // Realtime methods
    channel: jest.fn(() => ({
      on: jest.fn(() => mockClient),
      subscribe: jest.fn(() => Promise.resolve('SUBSCRIBED')),
      unsubscribe: jest.fn(() => Promise.resolve('UNSUBSCRIBED')),
      send: jest.fn(() => Promise.resolve('ok')),
    })),
    removeChannel: jest.fn(),
    removeAllChannels: jest.fn(),
    getChannels: jest.fn(() => []),
  };

  return mockClient;
};

// =============================================================================
// LOGGER MOCKS
// =============================================================================

export const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  log: jest.fn(),
});

// =============================================================================
// REACT ROUTER MOCKS
// =============================================================================

export const createMockRouter = (initialLocation = '/') => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: initialLocation,
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useMatch: () => null,
  useMatches: () => [],
  useOutlet: () => null,
  useOutletContext: () => ({}),
  useResolvedPath: to => ({ pathname: to, search: '', hash: '' }),
  useHref: to => to,
  useInRouterContext: () => true,
  useNavigationType: () => 'POP',
});

// =============================================================================
// I18N MOCKS
// =============================================================================

export const createMockI18n = () => ({
  t: jest.fn((key, options) => {
    if (options && typeof options === 'object') {
      let result = key;
      Object.keys(options).forEach(optionKey => {
        result = result.replace(`{{${optionKey}}}`, options[optionKey]);
      });
      return result;
    }
    return key;
  }),
  changeLanguage: jest.fn(() => Promise.resolve()),
  language: 'en',
  languages: ['en', 'it'],
  exists: jest.fn(() => true),
  getFixedT: jest.fn(() => jest.fn(key => key)),
  hasResourceBundle: jest.fn(() => true),
  loadNamespaces: jest.fn(() => Promise.resolve()),
  loadLanguages: jest.fn(() => Promise.resolve()),
  reloadResources: jest.fn(() => Promise.resolve()),
  setDefaultNamespace: jest.fn(),
  dir: jest.fn(() => 'ltr'),
  format: jest.fn((value, format) => value),
  getResource: jest.fn(),
  addResource: jest.fn(),
  addResources: jest.fn(),
  addResourceBundle: jest.fn(),
  hasResourceBundle: jest.fn(() => true),
  getResourceBundle: jest.fn(() => ({})),
  removeResourceBundle: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
});

// =============================================================================
// TOAST NOTIFICATION MOCKS
// =============================================================================

export const createMockToast = () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
});

// =============================================================================
// PDF GENERATION MOCKS
// =============================================================================

export const createMockPDFGenerator = () => ({
  generateQuotePDF: jest.fn(() =>
    Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
  ),
  generateInvoicePDF: jest.fn(() =>
    Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
  ),
  generateReportPDF: jest.fn(() =>
    Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
  ),
});

// =============================================================================
// EMAIL SERVICE MOCKS
// =============================================================================

export const createMockEmailService = () => ({
  sendEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendQuoteEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendInvoiceEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendReminderEmail: jest.fn(() => Promise.resolve({ success: true })),
  validateEmail: jest.fn(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  getEmailTemplate: jest.fn(() => Promise.resolve('<html>Template</html>')),
  replaceTemplateVariables: jest.fn((template, variables) => {
    let result = template;
    Object.keys(variables).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });
    return result;
  }),
});

// =============================================================================
// CHART/ANALYTICS MOCKS
// =============================================================================

export const createMockChartLibrary = () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    resize: jest.fn(),
    render: jest.fn(),
    getElementsAtEventForMode: jest.fn(() => []),
    getElementAtEvent: jest.fn(() => null),
    getDatasetAtEvent: jest.fn(() => []),
  })),
  registerables: [],
  register: jest.fn(),
  unregister: jest.fn(),
});

// =============================================================================
// DATE/TIME MOCKS
// =============================================================================

export const createMockDateLibrary = () => ({
  format: jest.fn((date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Simple YYYY-MM-DD format
  }),
  parse: jest.fn(dateStr => new Date(dateStr)),
  isValid: jest.fn(date => date instanceof Date && !isNaN(date)),
  addDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  subDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }),
  startOfMonth: jest.fn(date => {
    const result = new Date(date);
    result.setDate(1);
    return result;
  }),
  endOfMonth: jest.fn(date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    return result;
  }),
});

// =============================================================================
// VALIDATION MOCKS
// =============================================================================

export const createMockValidationLibrary = () => ({
  string: () => ({
    email: () => ({ isValid: true, error: null }),
    min: () => ({ isValid: true, error: null }),
    max: () => ({ isValid: true, error: null }),
    required: () => ({ isValid: true, error: null }),
  }),
  number: () => ({
    min: () => ({ isValid: true, error: null }),
    max: () => ({ isValid: true, error: null }),
    positive: () => ({ isValid: true, error: null }),
    required: () => ({ isValid: true, error: null }),
  }),
  object: () => ({
    shape: () => ({ isValid: true, error: null }),
  }),
  array: () => ({
    of: () => ({ isValid: true, error: null }),
    min: () => ({ isValid: true, error: null }),
  }),
});

// =============================================================================
// CRYPTO/SECURITY MOCKS
// =============================================================================

export const createMockCrypto = () => ({
  randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
  getRandomValues: jest.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    sign: jest.fn(() => Promise.resolve(new ArrayBuffer(64))),
    verify: jest.fn(() => Promise.resolve(true)),
    generateKey: jest.fn(() => Promise.resolve({})),
    importKey: jest.fn(() => Promise.resolve({})),
    exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
  },
});

// =============================================================================
// PAYMENT PROCESSING MOCKS
// =============================================================================

export const createMockPaymentProcessor = () => ({
  processPayment: jest.fn(() =>
    Promise.resolve({
      success: true,
      transactionId: 'txn_123456789',
      amount: 1000,
      currency: 'EUR',
    }),
  ),
  refundPayment: jest.fn(() =>
    Promise.resolve({
      success: true,
      refundId: 'ref_123456789',
      amount: 1000,
    }),
  ),
  validateCard: jest.fn(() => ({ isValid: true, type: 'visa' })),
  createPaymentIntent: jest.fn(() =>
    Promise.resolve({
      id: 'pi_123456789',
      client_secret: 'pi_123456789_secret_123',
    }),
  ),
});

// =============================================================================
// EXPORT ALL MOCKS
// =============================================================================

export const mockFactories = {
  supabase: createMockSupabaseClient,
  logger: createMockLogger,
  router: createMockRouter,
  i18n: createMockI18n,
  toast: createMockToast,
  pdf: createMockPDFGenerator,
  email: createMockEmailService,
  chart: createMockChartLibrary,
  date: createMockDateLibrary,
  validation: createMockValidationLibrary,
  crypto: createMockCrypto,
  payment: createMockPaymentProcessor,
};

// Global mock setup function
export const setupGlobalMocks = () => {
  // Setup global mocks that should be available in all tests
  global.mockSupabaseClient = createMockSupabaseClient();
  global.mockLogger = createMockLogger();
  global.mockToast = createMockToast();

  // Mock crypto if not available
  if (!global.crypto) {
    global.crypto = createMockCrypto();
  }

  // Mock performance if not available
  if (!global.performance) {
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      },
    };
  }
};

// Cleanup function for tests
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

// Default export
export default {
  ...mockFactories,
  setupGlobalMocks,
  cleanupMocks,
};
