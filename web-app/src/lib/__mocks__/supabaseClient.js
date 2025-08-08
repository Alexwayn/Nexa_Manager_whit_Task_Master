// Mock for supabaseClient.js
const createMockQuery = () => {
  let mockResponse = { data: [], error: null, count: 0 };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    then: jest.fn((callback) => callback(mockResponse)),
    catch: jest.fn(),
    finally: jest.fn(),

    // Helper functions to control mock responses
    __setMockResponse: jest.fn((newResponse) => {
      mockResponse = newResponse;
    }),
    __resetMockResponse: jest.fn(() => {
      mockResponse = { data: [], error: null, count: 0 };
    }),
  };

  mockQuery.__resetAllMocks = jest.fn(() => {
    mockQuery.__resetMockResponse();
    const mocksToClear = [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'eq',
      'in',
      'gt',
      'gte',
      'lt',
      'lte',
      'ilike',
      'or',
      'order',
      'range',
      'limit',
      'single',
      'textSearch',
      'then',
      'catch',
      'finally',
      '__setMockResponse',
      '__resetMockResponse',
    ];
    mocksToClear.forEach((mockName) => {
      if (mockQuery[mockName] && jest.isMockFunction(mockQuery[mockName])) {
        mockQuery[mockName].mockClear();
      }
    });
  });

  return mockQuery;
};

const mockSupabase = {
  from: jest.fn(createMockQuery),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    updateUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      download: jest.fn(() => Promise.resolve({ data: null, error: null })),
      remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
  __resetAllMocks: jest.fn(() => {
    mockSupabase.from.mockClear();
    mockSupabase.rpc.mockClear();
    // You might need to add more mock resets here if you use other parts of the supabase client
  }),
};

export const supabase = mockSupabase;
export const supabaseAdmin = mockSupabase;

export const setCurrentUserId = jest.fn();
export const withUserContext = jest.fn((userId, callback) => callback());

export default mockSupabase;