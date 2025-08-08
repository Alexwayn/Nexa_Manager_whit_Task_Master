/**
 * Query Provider Mock for Tests
 * Provides TanStack Query context for testing components that use queries
 */

import React from 'react';

// Mock QueryClient for tests
const createMockQueryClient = () => ({
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn(),
  cancelQueries: jest.fn(),
  removeQueries: jest.fn(),
  clear: jest.fn(),
  getQueryCache: jest.fn(() => ({
    find: jest.fn(),
    findAll: jest.fn(),
    subscribe: jest.fn(),
    clear: jest.fn(),
  })),
  getMutationCache: jest.fn(() => ({
    find: jest.fn(),
    findAll: jest.fn(),
    subscribe: jest.fn(),
    clear: jest.fn(),
  })),
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Test Query Provider with mock QueryClient
 * Use this for testing components that use TanStack Query
 */
export const TestQueryProvider = ({ 
  children, 
  client = createMockQueryClient() 
}) => {
  // Mock QueryClientProvider
  const MockQueryClientProvider = ({ children }) => children;
  
  return (
    <MockQueryClientProvider client={client}>
      {children}
    </MockQueryClientProvider>
  );
};

/**
 * Query Provider with custom client for specific test scenarios
 */
export const TestQueryProviderWithClient = ({ children, client }) => {
  return (
    <TestQueryProvider client={client}>
      {children}
    </TestQueryProvider>
  );
};

/**
 * Default test query client instance
 * Can be imported and used across tests for consistency
 */
export const testQueryClient = createMockQueryClient();

// Export default provider
export default TestQueryProvider;