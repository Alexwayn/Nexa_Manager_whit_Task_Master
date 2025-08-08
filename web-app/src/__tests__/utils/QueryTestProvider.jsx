import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query Test Provider
 * Creates a fresh QueryClient instance for each test to ensure isolation
 */

// Create a test-specific QueryClient with optimized settings for testing
export const createTestQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster execution
        retry: false,
        // Disable cache time to prevent test interference
        cacheTime: 0,
        // Disable stale time for predictable test behavior
        staleTime: 0,
        // Disable background refetching in tests
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        // Disable network mode for offline testing
        networkMode: 'offlineFirst',
        ...options.queries,
      },
      mutations: {
        // Disable retries for mutations in tests
        retry: false,
        // Disable network mode for offline testing
        networkMode: 'offlineFirst',
        ...options.mutations,
      },
    },
    // Disable logger in tests to reduce noise
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
    ...options,
  });
};

/**
 * QueryTestProvider Component
 * Wraps components with a fresh QueryClient for testing
 */
export const QueryTestProvider = ({ 
  children, 
  client = null,
  queryClientOptions = {} 
}) => {
  // Use provided client or create a new one
  const queryClient = client || createTestQueryClient(queryClientOptions);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Hook to get the current QueryClient in tests
 */
export const useTestQueryClient = () => {
  const { useQueryClient } = require('@tanstack/react-query');
  return useQueryClient();
};

/**
 * Utility to wait for queries to settle in tests
 */
export const waitForQueriesToSettle = async (queryClient) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    // Check if any queries are still fetching
    const isFetching = queries.some(query => query.state.isFetching);
    
    if (isFetching) {
      throw new Error('Queries are still fetching');
    }
  }, { timeout: 5000 });
};

/**
 * Utility to clear all queries in a test QueryClient
 */
export const clearAllQueries = (queryClient) => {
  queryClient.clear();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
};

/**
 * Utility to mock query data for testing
 */
export const setQueryData = (queryClient, queryKey, data) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Utility to prefetch query data for testing
 */
export const prefetchQuery = async (queryClient, queryKey, queryFn, options = {}) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

/**
 * Utility to invalidate queries in tests
 */
export const invalidateQueries = async (queryClient, queryKey) => {
  await queryClient.invalidateQueries({ queryKey });
};

/**
 * Utility to get query state for assertions
 */
export const getQueryState = (queryClient, queryKey) => {
  return queryClient.getQueryState(queryKey);
};

/**
 * Utility to get query data for assertions
 */
export const getQueryData = (queryClient, queryKey) => {
  return queryClient.getQueryData(queryKey);
};

/**
 * Mock query function that returns predefined data
 */
export const createMockQueryFn = (data, delay = 0) => {
  return jest.fn().mockImplementation(async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return data;
  });
};

/**
 * Mock mutation function that returns predefined data
 */
export const createMockMutationFn = (data, delay = 0) => {
  return jest.fn().mockImplementation(async (variables) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return { ...data, variables };
  });
};

/**
 * Mock error query function for testing error states
 */
export const createMockErrorQueryFn = (error = new Error('Test error')) => {
  return jest.fn().mockRejectedValue(error);
};

/**
 * Mock error mutation function for testing error states
 */
export const createMockErrorMutationFn = (error = new Error('Test mutation error')) => {
  return jest.fn().mockRejectedValue(error);
};

/**
 * Utility to simulate network delay in tests
 */
export const simulateNetworkDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Utility to create a query client with specific cache data
 */
export const createQueryClientWithData = (initialData = {}) => {
  const queryClient = createTestQueryClient();
  
  Object.entries(initialData).forEach(([queryKey, data]) => {
    queryClient.setQueryData(Array.isArray(queryKey) ? queryKey : [queryKey], data);
  });
  
  return queryClient;
};

/**
 * Test helper to assert query states
 */
export const expectQueryToBeLoading = (queryClient, queryKey) => {
  const state = getQueryState(queryClient, queryKey);
  expect(state?.isLoading).toBe(true);
};

export const expectQueryToBeSuccess = (queryClient, queryKey) => {
  const state = getQueryState(queryClient, queryKey);
  expect(state?.isSuccess).toBe(true);
};

export const expectQueryToBeError = (queryClient, queryKey) => {
  const state = getQueryState(queryClient, queryKey);
  expect(state?.isError).toBe(true);
};

export const expectQueryToHaveData = (queryClient, queryKey, expectedData) => {
  const data = getQueryData(queryClient, queryKey);
  expect(data).toEqual(expectedData);
};

/**
 * Test helper to wait for specific query states
 */
export const waitForQueryToBeLoading = async (queryClient, queryKey) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const state = getQueryState(queryClient, queryKey);
    expect(state?.isLoading).toBe(true);
  });
};

export const waitForQueryToBeSuccess = async (queryClient, queryKey) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const state = getQueryState(queryClient, queryKey);
    expect(state?.isSuccess).toBe(true);
  });
};

export const waitForQueryToBeError = async (queryClient, queryKey) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const state = getQueryState(queryClient, queryKey);
    expect(state?.isError).toBe(true);
  });
};

/**
 * Default export with all utilities
 */
export default {
  QueryTestProvider,
  createTestQueryClient,
  useTestQueryClient,
  waitForQueriesToSettle,
  clearAllQueries,
  setQueryData,
  prefetchQuery,
  invalidateQueries,
  getQueryState,
  getQueryData,
  createMockQueryFn,
  createMockMutationFn,
  createMockErrorQueryFn,
  createMockErrorMutationFn,
  simulateNetworkDelay,
  createQueryClientWithData,
  expectQueryToBeLoading,
  expectQueryToBeSuccess,
  expectQueryToBeError,
  expectQueryToHaveData,
  waitForQueryToBeLoading,
  waitForQueryToBeSuccess,
  waitForQueryToBeError,
};