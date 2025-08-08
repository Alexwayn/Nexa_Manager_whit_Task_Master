/**
 * Test Data Factories
 * Provides factory functions to create consistent test data for various entities
 */

import { faker } from '@faker-js/faker';

// Set a consistent seed for reproducible tests
faker.seed(12345);

/**
 * Base factory function that merges default data with overrides
 */
const createFactory = (defaultData, overrides = {}) => {
  return { ...defaultData, ...overrides };
};

/**
 * Generate a consistent UUID for tests
 */
const generateTestId = (prefix = '') => {
  return prefix ? `${prefix}_${faker.string.uuid()}` : faker.string.uuid();
};

/**
 * Generate consistent timestamps
 */
const generateTimestamp = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// =============================================================================
// USER AND AUTH FACTORIES
// =============================================================================

/**
 * Create a mock user profile
 */
export const createMockUser = (overrides = {}) => {
  return createFactory({
    id: generateTestId('user'),
    email: faker.internet.email(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    avatar_url: faker.image.avatar(),
    role: 'user',
    is_active: true,
    last_login: generateTimestamp(1),
    created_at: generateTimestamp(30),
    updated_at: generateTimestamp(1),
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        desktop: false,
      },
      dashboard: {
        layout: 'default',
        widgets: ['revenue', 'clients', 'invoices'],
      },
    },
  }, overrides);
};

/**
 * Create a mock organization
 */
export const createMockOrganization = (overrides = {}) => {
  return createFactory({
    id: generateTestId('org'),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    created_at: generateTimestamp(60),
    updated_at: generateTimestamp(1),
  }, overrides);
};

/**
 * Create authenticated state for auth context
 */
export const createAuthenticatedState = (userOverrides = {}) => {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: createMockUser(userOverrides),
    organization: createMockOrganization(),
  };
};

/**
 * Create unauthenticated state for auth context
 */
export const createUnauthenticatedState = () => {
  return {
    isLoaded: true,
    isSignedIn: false,
    user: null,
    organization: null,
  };
};

/**
 * Create loading state for auth context
 */
export const createLoadingState = () => {
  return {
    isLoaded: false,
    isSignedIn: false,
    user: null,
    organization: null,
  };
};

// =============================================================================
// CLIENT FACTORIES
// =============================================================================

/**
 * Create a mock client
 */
export const createMockClient = (overrides = {}) => {
  return createFactory({
    id: generateTestId('client'),
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    company: faker.company.name(),
    tax_id: faker.string.alphanumeric(10),
    status: 'active',
    notes: faker.lorem.paragraph(),
    tags: [faker.word.noun(), faker.word.noun()],
    created_at: generateTimestamp(30),
    updated_at: generateTimestamp(1),
  }, overrides);
};

/**
 * Create multiple mock clients
 */
export const createMockClients = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockClient({ ...overrides, name: `${faker.company.name()} ${index + 1}` })
  );
};

// =============================================================================
// INVOICE FACTORIES
// =============================================================================

/**
 * Create a mock invoice item
 */
export const createMockInvoiceItem = (overrides = {}) => {
  const quantity = faker.number.int({ min: 1, max: 10 });
  const unit_price = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
  
  return createFactory({
    id: generateTestId('item'),
    description: faker.commerce.productDescription(),
    quantity,
    unit_price,
    total: quantity * unit_price,
  }, overrides);
};

/**
 * Create a mock invoice
 */
export const createMockInvoice = (overrides = {}) => {
  const items = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
    createMockInvoiceItem()
  );
  const amount = items.reduce((sum, item) => sum + item.total, 0);
  const tax_amount = amount * 0.21; // 21% tax
  const total_amount = amount + tax_amount;

  return createFactory({
    id: generateTestId('invoice'),
    invoice_number: `INV-${faker.string.numeric(6)}`,
    client_id: generateTestId('client'),
    amount,
    tax_amount,
    total_amount,
    currency: 'EUR',
    status: 'sent',
    due_date: generateTimestamp(-30), // 30 days from now
    issued_date: generateTimestamp(0),
    paid_date: null,
    items,
    notes: faker.lorem.sentence(),
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(1),
  }, overrides);
};

/**
 * Create multiple mock invoices
 */
export const createMockInvoices = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockInvoice({ 
      ...overrides, 
      invoice_number: `INV-${String(index + 1).padStart(6, '0')}` 
    })
  );
};

// =============================================================================
// PAYMENT FACTORIES
// =============================================================================

/**
 * Create a mock payment
 */
export const createMockPayment = (overrides = {}) => {
  return createFactory({
    id: generateTestId('payment'),
    invoice_id: generateTestId('invoice'),
    amount: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
    currency: 'EUR',
    method: faker.helpers.arrayElement(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal']),
    status: 'completed',
    transaction_id: faker.string.alphanumeric(20),
    processed_at: generateTimestamp(1),
    notes: faker.lorem.sentence(),
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// =============================================================================
// PRODUCT FACTORIES
// =============================================================================

/**
 * Create a mock product
 */
export const createMockProduct = (overrides = {}) => {
  return createFactory({
    id: generateTestId('product'),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    currency: 'EUR',
    category: faker.commerce.department(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    is_active: true,
    tax_rate: 0.21,
    created_at: generateTimestamp(30),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// =============================================================================
// DOCUMENT FACTORIES
// =============================================================================

/**
 * Create a mock document
 */
export const createMockDocument = (overrides = {}) => {
  return createFactory({
    id: generateTestId('doc'),
    name: faker.system.fileName(),
    file_path: `/documents/${faker.string.uuid()}.pdf`,
    file_size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
    mime_type: 'application/pdf',
    client_id: generateTestId('client'),
    invoice_id: generateTestId('invoice'),
    category: faker.helpers.arrayElement(['invoice', 'receipt', 'contract', 'other']),
    tags: [faker.word.noun(), faker.word.noun()],
    is_public: false,
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// =============================================================================
// CALENDAR EVENT FACTORIES
// =============================================================================

/**
 * Create a mock calendar event
 */
export const createMockCalendarEvent = (overrides = {}) => {
  const start_time = faker.date.future();
  const end_time = new Date(start_time.getTime() + (60 * 60 * 1000)); // 1 hour later

  return createFactory({
    id: generateTestId('event'),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    start_time: start_time.toISOString(),
    end_time: end_time.toISOString(),
    all_day: false,
    location: faker.location.streetAddress(),
    client_id: generateTestId('client'),
    attendees: [faker.internet.email(), faker.internet.email()],
    status: 'scheduled',
    reminder_minutes: 15,
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// =============================================================================
// EMAIL FACTORIES
// =============================================================================

/**
 * Create a mock email address
 */
export const createMockEmailAddress = (overrides = {}) => {
  return createFactory({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }, overrides);
};

/**
 * Create mock email recipients
 */
export const createMockEmailRecipients = (overrides = {}) => {
  return createFactory({
    to: [createMockEmailAddress()],
    cc: [],
    bcc: [],
  }, overrides);
};

/**
 * Create a mock email attachment
 */
export const createMockEmailAttachment = (overrides = {}) => {
  return createFactory({
    id: generateTestId('attachment'),
    filename: faker.system.fileName(),
    content_type: faker.helpers.arrayElement(['application/pdf', 'image/jpeg', 'text/plain']),
    size_bytes: faker.number.int({ min: 1024, max: 5242880 }), // 1KB to 5MB
    file_path: `/attachments/${faker.string.uuid()}`,
    is_inline: false,
    content_id: null,
    created_at: generateTimestamp(1),
  }, overrides);
};

/**
 * Create a mock email
 */
export const createMockEmail = (overrides = {}) => {
  return createFactory({
    id: generateTestId('email'),
    message_id: `<${faker.string.uuid()}@example.com>`,
    thread_id: generateTestId('thread'),
    folder_id: generateTestId('folder'),
    account_id: generateTestId('account'),
    user_id: generateTestId('user'),
    subject: faker.lorem.sentence(),
    sender_name: faker.person.fullName(),
    sender_email: faker.internet.email(),
    recipients: createMockEmailRecipients(),
    content_text: faker.lorem.paragraphs(3),
    content_html: `<p>${faker.lorem.paragraphs(3, '</p><p>')}</p>`,
    attachments: [],
    labels: [faker.word.noun()],
    is_read: false,
    is_starred: false,
    is_important: false,
    is_draft: false,
    received_at: generateTimestamp(1),
    sent_at: null,
    client_id: null,
    related_documents: [],
    created_at: generateTimestamp(1),
    updated_at: generateTimestamp(1),
  }, overrides);
};

/**
 * Create a mock email template
 */
export const createMockEmailTemplate = (overrides = {}) => {
  return createFactory({
    id: generateTestId('template'),
    name: faker.lorem.words(2),
    category: faker.helpers.arrayElement(['invoice', 'quote', 'reminder', 'welcome']),
    subject: faker.lorem.sentence(),
    content_text: faker.lorem.paragraphs(2),
    content_html: `<p>${faker.lorem.paragraphs(2, '</p><p>')}</p>`,
    variables: [
      {
        name: 'customerName',
        label: 'Customer Name',
        type: 'text',
        default_value: '',
        required: true,
        description: 'The name of the customer',
      },
      {
        name: 'amount',
        label: 'Amount',
        type: 'number',
        default_value: '0',
        required: false,
        description: 'The invoice amount',
      },
    ],
    is_system: false,
    user_id: generateTestId('user'),
    created_at: generateTimestamp(30),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// =============================================================================
// SCANNER FACTORIES
// =============================================================================

/**
 * Create a mock processed document for scanner
 */
export const createMockProcessedDocument = (overrides = {}) => {
  return createFactory({
    id: generateTestId('processed_doc'),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['invoice', 'receipt', 'contract', 'other']),
    tags: [faker.word.noun(), faker.word.noun()],
    clientId: generateTestId('client'),
    projectId: generateTestId('project'),
    createdAt: new Date(generateTimestamp(7)),
    updatedAt: new Date(generateTimestamp(1)),
    createdBy: generateTestId('user'),
    originalFile: {
      url: `https://example.com/files/${faker.string.uuid()}.jpg`,
      name: faker.system.fileName(),
      size: faker.number.int({ min: 1024, max: 10485760 }),
      type: 'image/jpeg',
    },
    enhancedFile: {
      url: `https://example.com/enhanced/${faker.string.uuid()}.jpg`,
      size: faker.number.int({ min: 1024, max: 10485760 }),
    },
    pdfFile: {
      url: `https://example.com/pdf/${faker.string.uuid()}.pdf`,
      size: faker.number.int({ min: 1024, max: 10485760 }),
    },
    textContent: faker.lorem.paragraphs(5),
    ocrConfidence: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 }),
    ocrLanguage: 'en',
    status: 'complete',
    processingErrors: [],
    sharingSettings: {
      isShared: false,
      accessLevel: 'view',
      sharedWith: [],
      publicLink: null,
      expiresAt: null,
    },
    accessLog: [],
  }, overrides);
};

/**
 * Create a mock OCR result
 */
export const createMockOCRResult = (overrides = {}) => {
  return createFactory({
    id: generateTestId('ocr'), // Add this line
    text: faker.lorem.paragraphs(3),
    lines: Array.from({ length: 10 }, () => faker.lorem.sentence()),
    confidence: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 }),
    provider: 'openai',
    processingTime: faker.number.int({ min: 1000, max: 10000 }),
    blocks: [
      {
        text: faker.lorem.sentence(),
        bounds: {
          x: faker.number.int({ min: 0, max: 100 }),
          y: faker.number.int({ min: 0, max: 100 }),
          width: faker.number.int({ min: 50, max: 200 }),
          height: faker.number.int({ min: 20, max: 50 }),
        },
        confidence: faker.number.float({ min: 0.8, max: 1.0, fractionDigits: 2 }),
      },
    ],
    tables: [],
    rawResponse: {},
    error: null,
  }, overrides);
};

// =============================================================================
// ANALYTICS FACTORIES
// =============================================================================

/**
 * Create mock analytics metrics
 */
export const createMockAnalyticsMetrics = (overrides = {}) => {
  return createFactory({
    revenue: {
      total: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 }),
      monthly: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }),
      growth: faker.number.float({ min: -20, max: 50, fractionDigits: 1 }),
    },
    clients: {
      total: faker.number.int({ min: 10, max: 500 }),
      active: faker.number.int({ min: 5, max: 400 }),
      new: faker.number.int({ min: 0, max: 50 }),
    },
    invoices: {
      total: faker.number.int({ min: 50, max: 1000 }),
      paid: faker.number.int({ min: 30, max: 800 }),
      pending: faker.number.int({ min: 5, max: 100 }),
      overdue: faker.number.int({ min: 0, max: 50 }),
    },
    payments: {
      total: faker.number.float({ min: 5000, max: 80000, fractionDigits: 2 }),
      thisMonth: faker.number.float({ min: 500, max: 8000, fractionDigits: 2 }),
      avgProcessingTime: faker.number.int({ min: 1, max: 7 }), // days
    },
  }, overrides);
};

/**
 * Create mock trend data points
 */
export const createMockTrendData = (count = 12, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - 1 - index));
    
    return createFactory({
      date: date.toISOString().split('T')[0],
      value: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }),
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }, overrides);
  });
};

// =============================================================================
// API RESPONSE FACTORIES
// =============================================================================

/**
 * Create a mock API success response
 */
export const createMockApiResponse = (data = null, overrides = {}) => {
  return createFactory({
    data,
    success: true,
    message: 'Operation completed successfully',
    meta: {
      total: Array.isArray(data) ? data.length : 1,
      page: 1,
      limit: 10,
      hasMore: false,
    },
  }, overrides);
};

/**
 * Create a mock API error response
 */
export const createMockApiError = (overrides = {}) => {
  return createFactory({
    error: 'ValidationError',
    message: 'The request data is invalid',
    statusCode: 400,
    details: {
      field: 'email',
      code: 'INVALID_FORMAT',
    },
  }, overrides);
};

/**
 * Create a mock paginated response
 */
export const createMockPaginatedResponse = (data = [], overrides = {}) => {
  const totalPages = Math.ceil(data.length / 10);
  
  return createFactory({
    data,
    pagination: {
      page: 1,
      limit: 10,
      total: data.length,
      totalPages,
      hasNext: totalPages > 1,
      hasPrev: false,
    },
  }, overrides);
};

// =============================================================================
// FORM STATE FACTORIES
// =============================================================================

/**
 * Create a mock form state
 */
export const createMockFormState = (data = {}, overrides = {}) => {
  return createFactory({
    data,
    errors: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  }, overrides);
};

/**
 * Create a mock form state with errors
 */
export const createMockFormStateWithErrors = (data = {}, errors = {}, overrides = {}) => {
  return createFactory({
    data,
    errors,
    isSubmitting: false,
    isValid: false,
    isDirty: true,
  }, overrides);
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create multiple instances of any factory
 */
export const createMultiple = (factory, count = 5, overrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    factory({ ...overrides, id: generateTestId(`item_${index}`) })
  );
};

/**
 * Create a factory with relationships
 */
export const createWithRelations = (mainFactory, relations = {}) => {
  const main = mainFactory();
  
  Object.keys(relations).forEach(key => {
    if (typeof relations[key] === 'function') {
      main[key] = relations[key]();
    } else {
      main[key] = relations[key];
    }
  });
  
  return main;
};

/**
 * Reset faker seed for consistent test data
 */
export const resetTestDataSeed = (seed = 12345) => {
  faker.seed(seed);
};

// =============================================================================
// ADDITIONAL UTILITY FACTORIES
// =============================================================================

/**
 * Create a mock error object
 */
export const createMockError = (overrides = {}) => {
  return createFactory({
    name: 'Error',
    message: faker.lorem.sentence(),
    stack: faker.lorem.lines(5),
    code: faker.string.alphanumeric(8).toUpperCase(),
    statusCode: faker.helpers.arrayElement([400, 401, 403, 404, 500, 502, 503]),
    timestamp: generateTimestamp(0),
  }, overrides);
};

/**
 * Create a mock validation error
 */
export const createMockValidationError = (field = 'email', overrides = {}) => {
  return createFactory({
    name: 'ValidationError',
    message: `Invalid ${field}`,
    field,
    code: 'VALIDATION_FAILED',
    statusCode: 400,
    details: {
      field,
      value: faker.lorem.word(),
      constraint: 'format',
    },
  }, overrides);
};

/**
 * Create a mock network error
 */
export const createMockNetworkError = (overrides = {}) => {
  return createFactory({
    name: 'NetworkError',
    message: 'Network request failed',
    code: 'NETWORK_ERROR',
    statusCode: 0,
    isNetworkError: true,
    timeout: false,
  }, overrides);
};

/**
 * Create a mock loading state
 */
export const createMockLoadingState = (overrides = {}) => {
  return createFactory({
    isLoading: true,
    isError: false,
    isSuccess: false,
    data: null,
    error: null,
    progress: faker.number.int({ min: 0, max: 100 }),
  }, overrides);
};

/**
 * Create a mock success state
 */
export const createMockSuccessState = (data = null, overrides = {}) => {
  return createFactory({
    isLoading: false,
    isError: false,
    isSuccess: true,
    data,
    error: null,
    progress: 100,
  }, overrides);
};

/**
 * Create a mock error state
 */
export const createMockErrorState = (error = null, overrides = {}) => {
  return createFactory({
    isLoading: false,
    isError: true,
    isSuccess: false,
    data: null,
    error: error || createMockError(),
    progress: 0,
  }, overrides);
};

/**
 * Create a mock file upload progress
 */
export const createMockUploadProgress = (overrides = {}) => {
  return createFactory({
    loaded: faker.number.int({ min: 0, max: 1000000 }),
    total: faker.number.int({ min: 1000000, max: 10000000 }),
    progress: faker.number.int({ min: 0, max: 100 }),
    speed: faker.number.int({ min: 1000, max: 1000000 }), // bytes per second
    timeRemaining: faker.number.int({ min: 1, max: 300 }), // seconds
  }, overrides);
};

/**
 * Create a mock notification
 */
export const createMockNotification = (overrides = {}) => {
  return createFactory({
    id: generateTestId('notification'),
    type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    duration: faker.number.int({ min: 3000, max: 10000 }),
    persistent: false,
    actions: [],
    timestamp: generateTimestamp(0),
    read: false,
  }, overrides);
};

/**
 * Create a mock breadcrumb item
 */
export const createMockBreadcrumb = (overrides = {}) => {
  return createFactory({
    label: faker.lorem.words(2),
    href: `/${faker.lorem.slug()}`,
    isActive: false,
    icon: faker.helpers.arrayElement(['home', 'folder', 'file', 'user']),
  }, overrides);
};

/**
 * Create a mock breadcrumb trail
 */
export const createMockBreadcrumbs = (count = 3, overrides = {}) => {
  const breadcrumbs = Array.from({ length: count }, (_, index) => 
    createMockBreadcrumb({ 
      ...overrides,
      isActive: index === count - 1 // Last item is active
    })
  );
  
  // First item is usually home
  if (breadcrumbs.length > 0) {
    breadcrumbs[0] = { ...breadcrumbs[0], label: 'Home', href: '/', icon: 'home' };
  }
  
  return breadcrumbs;
};

/**
 * Create a mock table column definition
 */
export const createMockTableColumn = (overrides = {}) => {
  return createFactory({
    key: faker.lorem.word(),
    label: faker.lorem.words(2),
    sortable: faker.datatype.boolean(),
    filterable: faker.datatype.boolean(),
    width: faker.helpers.arrayElement(['auto', '100px', '200px', '25%', '1fr']),
    align: faker.helpers.arrayElement(['left', 'center', 'right']),
    type: faker.helpers.arrayElement(['text', 'number', 'date', 'boolean', 'action']),
  }, overrides);
};

/**
 * Create mock table data
 */
export const createMockTableData = (columns = [], rowCount = 10, overrides = {}) => {
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const row = { id: generateTestId(`row_${index}`) };
    
    columns.forEach(column => {
      switch (column.type) {
        case 'number':
          row[column.key] = faker.number.int({ min: 1, max: 1000 });
          break;
        case 'date':
          row[column.key] = generateTimestamp(faker.number.int({ min: 0, max: 365 }));
          break;
        case 'boolean':
          row[column.key] = faker.datatype.boolean();
          break;
        default:
          row[column.key] = faker.lorem.words(faker.number.int({ min: 1, max: 3 }));
      }
    });
    
    return { ...row, ...overrides };
  });
  
  return rows;
};

// Export utility functions
export { generateTestId, generateTimestamp };

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // User and Auth
  createMockUser,
  createMockOrganization,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  
  // Business Entities
  createMockClient,
  createMockClients,
  createMockInvoice,
  createMockInvoices,
  createMockInvoiceItem,
  createMockPayment,
  createMockProduct,
  createMockDocument,
  createMockCalendarEvent,
  
  // Email
  createMockEmail,
  createMockEmailAddress,
  createMockEmailRecipients,
  createMockEmailAttachment,
  createMockEmailTemplate,
  
  // Scanner
  createMockProcessedDocument,
  createMockOCRResult,
  
  // Analytics
  createMockAnalyticsMetrics,
  createMockTrendData,
  
  // API
  createMockApiResponse,
  createMockApiError,
  createMockPaginatedResponse,
  
  // Forms
  createMockFormState,
  createMockFormStateWithErrors,
  
  // Error States
  createMockError,
  createMockValidationError,
  createMockNetworkError,
  createMockLoadingState,
  createMockSuccessState,
  createMockErrorState,
  
  // UI Components
  createMockUploadProgress,
  createMockNotification,
  createMockBreadcrumb,
  createMockBreadcrumbs,
  createMockTableColumn,
  createMockTableData,
  
  // Utilities
  createMultiple,
  createWithRelations,
  resetTestDataSeed,
  generateTestId,
  generateTimestamp,
};