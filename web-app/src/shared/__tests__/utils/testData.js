/**
 * Test Data Factories
 * Provides factory functions for creating test data
 */

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  imageUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock client data
 */
export const createMockClient = (overrides = {}) => ({
  id: 'test-client-id',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  address: '123 Test Street',
  city: 'Test City',
  country: 'Test Country',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock invoice data
 */
export const createMockInvoice = (overrides = {}) => ({
  id: 'test-invoice-id',
  number: 'INV-001',
  clientId: 'test-client-id',
  amount: 1000,
  currency: 'EUR',
  status: 'draft',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: 'item-1',
      description: 'Test Service',
      quantity: 1,
      rate: 1000,
      amount: 1000
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock quote data
 */
export const createMockQuote = (overrides = {}) => ({
  id: 'test-quote-id',
  number: 'QUO-001',
  clientId: 'test-client-id',
  amount: 1500,
  currency: 'EUR',
  status: 'pending',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: 'item-1',
      description: 'Test Service',
      quantity: 1,
      rate: 1500,
      amount: 1500
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock expense data
 */
export const createMockExpense = (overrides = {}) => ({
  id: 'test-expense-id',
  description: 'Test Expense',
  amount: 100,
  currency: 'EUR',
  category: 'office',
  date: new Date().toISOString(),
  receipt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock event data
 */
export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  title: 'Test Event',
  description: 'Test event description',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  location: 'Test Location',
  attendees: [],
  status: 'scheduled',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create mock analytics data
 */
export const createMockAnalytics = (overrides = {}) => ({
  revenue: {
    total: 10000,
    thisMonth: 2500,
    lastMonth: 2000,
    growth: 25
  },
  clients: {
    total: 50,
    active: 45,
    new: 5,
    growth: 11.1
  },
  invoices: {
    total: 100,
    paid: 80,
    pending: 15,
    overdue: 5
  },
  expenses: {
    total: 3000,
    thisMonth: 800,
    lastMonth: 600,
    growth: 33.3
  },
  ...overrides
});

/**
 * Create mock API response
 */
export const createMockApiResponse = (data = {}, overrides = {}) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK',
  ...overrides
});

/**
 * Create mock API error response
 */
export const createMockApiError = (message = 'Test error', overrides = {}) => ({
  data: null,
  error: {
    message,
    code: 'TEST_ERROR',
    details: {}
  },
  status: 400,
  statusText: 'Bad Request',
  ...overrides
});

/**
 * Create mock form data
 */
export const createMockFormData = (fields = {}) => ({
  values: fields,
  errors: {},
  touched: {},
  isValid: true,
  isSubmitting: false,
  isDirty: false
});

/**
 * Create mock pagination data
 */
export const createMockPagination = (overrides = {}) => ({
  page: 1,
  limit: 10,
  total: 100,
  totalPages: 10,
  hasNext: true,
  hasPrev: false,
  ...overrides
});

/**
 * Create mock filter data
 */
export const createMockFilters = (overrides = {}) => ({
  search: '',
  status: 'all',
  dateFrom: null,
  dateTo: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides
});