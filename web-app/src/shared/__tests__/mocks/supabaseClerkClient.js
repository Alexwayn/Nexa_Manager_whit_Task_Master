// Mock for supabaseClerkClient.js
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    update: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  })),
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
};

export const supabase = mockSupabase;

export const executeWithClerkAuth = jest.fn((callback) => {
  return callback(mockSupabase);
});

export const useSupabaseWithClerk = jest.fn(() => mockSupabase);

export default mockSupabase;