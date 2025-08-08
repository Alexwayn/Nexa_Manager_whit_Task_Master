// Mock for supabaseClerkClient.js
// Create a shared mock response that can be modified by tests
let sharedMockResponse = { data: [{ id: 1, subject: 'Test Email' }], error: null, count: 1 };

// Create a single mock query object that will be reused
const mockQuery = {};

// Add all the Supabase query methods
const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'in', 'order', 'range', 'limit', 'single', 'textSearch', 'or'];

methods.forEach(method => {
  mockQuery[method] = jest.fn(() => mockQuery);
});

// Add helper methods for tests
mockQuery.__setMockResponse = (response) => {
  sharedMockResponse = response;
};

mockQuery.__resetMockResponse = () => {
  sharedMockResponse = { data: [{ id: 1, subject: 'Test Email' }], error: null, count: 1 };
};

// Make the mock query awaitable by adding then method
mockQuery.then = (onFulfilled, onRejected) => {
  return new Promise((resolve, reject) => {
    // Use setTimeout to make it async and read the current sharedMockResponse
    setTimeout(() => {
      if (sharedMockResponse.error) {
        if (onRejected) {
          resolve(onRejected(sharedMockResponse.error));
        } else {
          reject(sharedMockResponse.error);
        }
      } else {
        if (onFulfilled) {
          resolve(onFulfilled(sharedMockResponse));
        } else {
          resolve(sharedMockResponse);
        }
      }
    }, 0);
  });
};

mockQuery.catch = (onRejected) => {
  return mockQuery.then(null, onRejected);
};

mockQuery.finally = (onFinally) => {
  return mockQuery.then(
    (value) => {
      if (onFinally) onFinally();
      return value;
    },
    (reason) => {
      if (onFinally) onFinally();
      throw reason;
    }
  );
};

const mockSupabase = {
  from: jest.fn(() => mockQuery),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      download: jest.fn(() => Promise.resolve({ data: null, error: null })),
      remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
  __resetAllMocks: () => {
    mockSupabase.from.mockClear();
    mockSupabase.rpc.mockClear();
    methods.forEach(method => {
      if (mockQuery[method]) {
        mockQuery[method].mockClear();
      }
    });
    mockQuery.__resetMockResponse();
  },
};

export const supabase = mockSupabase;

export const executeWithClerkAuth = jest.fn((callback) => {
  return callback(mockSupabase);
});

export const useSupabaseWithClerk = jest.fn(() => mockSupabase);

export default mockSupabase;
