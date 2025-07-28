import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock data generators
export const mockData = {
  client: (overrides = {}) => ({
    id: '1',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    country: 'IT',
    vat_number: 'IT12345678901',
    fiscal_code: 'TSTCLN80A01H501Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  quote: (overrides = {}) => ({
    id: '1',
    quote_number: 'Q-2024-001',
    client_id: '1',
    client_name: 'Test Client',
    client_email: 'test@example.com',
    subtotal: 820.0,
    iva_amount: 180.4,
    total_amount: 1000.4,
    issue_date: '2024-01-01',
    expiry_date: '2024-02-01',
    status: 'draft',
    notes: 'Test quote notes',
    items: [
      {
        id: '1',
        description: 'Test Service',
        quantity: 1,
        unit_price: 820.0,
        total: 820.0,
        iva_rate: 22,
      },
    ],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  invoice: (overrides = {}) => ({
    id: '1',
    invoice_number: 'INV-2024-001',
    client_id: '1',
    client_name: 'Test Client',
    client_email: 'test@example.com',
    subtotal: 820.0,
    iva_amount: 180.4,
    total_amount: 1000.4,
    issue_date: '2024-01-01',
    due_date: '2024-01-31',
    status: 'pending',
    payment_terms: 30,
    notes: 'Test invoice notes',
    items: [
      {
        id: '1',
        description: 'Test Service',
        quantity: 1,
        unit_price: 820.0,
        total: 820.0,
        iva_rate: 22,
      },
    ],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  expense: (overrides = {}) => ({
    id: '1',
    description: 'Test Expense',
    amount: 100.0,
    category: 'office_supplies',
    date: '2024-01-01',
    receipt_url: null,
    notes: 'Test expense notes',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  income: (overrides = {}) => ({
    id: '1',
    description: 'Test Income',
    amount: 1000.0,
    category: 'consulting',
    date: '2024-01-01',
    source: 'client_payment',
    notes: 'Test income notes',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  event: (overrides = {}) => ({
    id: '1',
    title: 'Test Event',
    description: 'Test event description',
    start_date: '2024-01-01T10:00:00Z',
    end_date: '2024-01-01T11:00:00Z',
    location: 'Test Location',
    attendees: ['test@example.com'],
    status: 'scheduled',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    company_name: 'Test Company',
    vat_number: 'IT12345678901',
    address: '123 Company St',
    city: 'Test City',
    postal_code: '12345',
    country: 'IT',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
};

// Supabase mock helpers
export const createMockSupabaseResponse = (data, error = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
});

export const createMockSupabaseClient = (responses = {}) => {
  const mockClient = {
    from: jest.fn(() => mockClient),
    select: jest.fn(() => mockClient),
    insert: jest.fn(() => mockClient),
    update: jest.fn(() => mockClient),
    delete: jest.fn(() => mockClient),
    upsert: jest.fn(() => mockClient),
    eq: jest.fn(() => mockClient),
    neq: jest.fn(() => mockClient),
    gt: jest.fn(() => mockClient),
    gte: jest.fn(() => mockClient),
    lt: jest.fn(() => mockClient),
    lte: jest.fn(() => mockClient),
    like: jest.fn(() => mockClient),
    ilike: jest.fn(() => mockClient),
    in: jest.fn(() => mockClient),
    contains: jest.fn(() => mockClient),
    order: jest.fn(() => mockClient),
    range: jest.fn(() => mockClient),
    limit: jest.fn(() => mockClient),
    single: jest.fn(() => mockClient),
    maybeSingle: jest.fn(() => mockClient),
  };

  // Configure responses
  Object.keys(responses).forEach(method => {
    if (mockClient[method]) {
      mockClient[method].mockResolvedValue(responses[method]);
    }
  });

  return mockClient;
};

// Auth mock helpers
export const createMockAuthClient = (user = null, session = null) => ({
  getUser: jest.fn().mockResolvedValue({
    data: { user },
    error: null,
  }),
  getSession: jest.fn().mockResolvedValue({
    data: { session },
    error: null,
  }),
  signInWithPassword: jest.fn().mockResolvedValue({
    data: { user, session },
    error: null,
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user, session },
    error: null,
  }),
  signOut: jest.fn().mockResolvedValue({
    error: null,
  }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  resetPasswordForEmail: jest.fn().mockResolvedValue({
    error: null,
  }),
  updateUser: jest.fn().mockResolvedValue({
    data: { user },
    error: null,
  }),
});

// Storage mock helpers
export const createMockStorageClient = () => ({
  from: jest.fn(() => ({
    upload: jest.fn().mockResolvedValue({
      data: { path: 'test-file.pdf' },
      error: null,
    }),
    download: jest.fn().mockResolvedValue({
      data: new Blob(['test content'], { type: 'application/pdf' }),
      error: null,
    }),
    remove: jest.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    list: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/test-file.pdf' },
    }),
  })),
});

// Performance testing utilities
export const measurePerformance = async (fn, iterations = 100) => {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const sorted = times.sort((a, b) => a - b);

  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    iterations,
  };
};

// Memory usage testing
export const measureMemoryUsage = fn => {
  const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

  const result = fn();

  const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  const memoryDelta = finalMemory - initialMemory;

  return {
    result,
    memoryUsed: memoryDelta,
    initialMemory,
    finalMemory,
  };
};

// Error boundary testing
export class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div data-testid='error-boundary'>
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Form testing utilities
export const fillForm = async (form, data) => {
  const { fireEvent } = await import('@testing-library/react');

  Object.keys(data).forEach(fieldName => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      fireEvent.change(field, { target: { value: data[fieldName] } });
    }
  });
};

export const submitForm = async form => {
  const { fireEvent } = await import('@testing-library/react');
  const submitButton =
    form.querySelector('[type="submit"]') || form.querySelector('button[type="submit"]');

  if (submitButton) {
    fireEvent.click(submitButton);
  } else {
    fireEvent.submit(form);
  }
};

// Async testing utilities
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');

  try {
    await waitForElementToBeRemoved(
      () => screen.queryByTestId('loading') || screen.queryByText(/loading/i),
      { timeout: 5000 },
    );
  } catch (error) {
    // Loading element might not exist, which is fine
  }
};

export const waitForErrorToAppear = async errorMessage => {
  const { waitFor, screen } = await import('@testing-library/react');

  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
};

// Date testing utilities
export const mockDate = dateString => {
  const mockDate = new Date(dateString);
  const originalDate = Date;

  global.Date = jest.fn(() => mockDate);
  global.Date.now = jest.fn(() => mockDate.getTime());
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;

  return () => {
    global.Date = originalDate;
  };
};

// Local storage testing utilities
export const mockLocalStorage = () => {
  const store = {};

  const mockStorage = {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn(index => Object.keys(store)[index] || null),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

// Network testing utilities
export const mockFetch = (responses = {}) => {
  const mockFetch = jest.fn();

  Object.keys(responses).forEach(url => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses[url]),
        text: () => Promise.resolve(JSON.stringify(responses[url])),
      }),
    );
  });

  global.fetch = mockFetch;

  return mockFetch;
};

// File testing utilities
export const createMockFile = (name, content, type = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};

export const createMockFileList = files => {
  const fileList = {
    length: files.length,
    item: index => files[index] || null,
    [Symbol.iterator]: function* () {
      for (let i = 0; i < files.length; i++) {
        yield files[i];
      }
    },
  };

  files.forEach((file, index) => {
    fileList[index] = file;
  });

  return fileList;
};

// Export all utilities
export default {
  renderWithProviders,
  mockData,
  createMockSupabaseResponse,
  createMockSupabaseClient,
  createMockAuthClient,
  createMockStorageClient,
  measurePerformance,
  measureMemoryUsage,
  TestErrorBoundary,
  fillForm,
  submitForm,
  waitForLoadingToFinish,
  waitForErrorToAppear,
  mockDate,
  mockLocalStorage,
  mockFetch,
  createMockFile,
  createMockFileList,
};
