// Mock for @tanstack/react-query

const mockQueryClient = {
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  removeQueries: jest.fn(),
  clear: jest.fn(),
  mount: jest.fn(),
  unmount: jest.fn(),
  isFetching: jest.fn(() => 0),
  isMutating: jest.fn(() => 0),
  getDefaultOptions: jest.fn(() => ({})),
  setDefaultOptions: jest.fn(),
  getQueryCache: jest.fn(() => ({ find: jest.fn(), findAll: jest.fn() })),
  getMutationCache: jest.fn(() => ({ find: jest.fn(), findAll: jest.fn() }))
};

// Proper class constructor for QueryClient
class QueryClient {
  constructor(options = {}) {
    this.options = options;
    // Copy all mock methods to this instance
    Object.assign(this, mockQueryClient);
  }
}

const QueryClientProvider = ({ children }) => children;

const useQueryClient = jest.fn(() => mockQueryClient);

// Global state to track mock behavior
let mockQueryState = {
  shouldError: false,
  errorToReturn: null,
  dataToReturn: [],
  isLoading: false
};

const useQuery = jest.fn((options) => {
  // Check if we should simulate an error state
  if (mockQueryState.shouldError) {
    return {
      data: undefined,
      isLoading: false,
      error: mockQueryState.errorToReturn || new Error('Network error'),
      isError: true,
      isSuccess: false,
      status: 'error',
      refetch: jest.fn(() => Promise.reject(mockQueryState.errorToReturn || new Error('Network error')))
    };
  }
  
  // Check if the queryFn is a Jest mock that has been set to reject
  if (options.queryFn && options.queryFn._isMockFunction) {
    // Check the mock's internal state to see if it's been configured to reject
    const mockFn = options.queryFn;
    
    // Look for mockRejectedValue in the mock's configuration
    if (mockFn.mockRejectedValue || 
        (mockFn._mockImplementation && mockFn._mockImplementation.toString().includes('reject'))) {
      
      // Try to get the rejection error
      let rejectionError = new Error('Network error');
      try {
        const result = mockFn();
        if (result && result.catch) {
          result.catch((error) => {
            rejectionError = error;
          });
        }
      } catch (error) {
        rejectionError = error;
      }
      
      return {
        data: undefined,
        isLoading: false,
        error: rejectionError,
        isError: true,
        isSuccess: false,
        status: 'error',
        refetch: jest.fn(() => Promise.reject(rejectionError))
      };
    }
  }
  
  // Return loading state initially, then success
  if (mockQueryState.isLoading) {
    return {
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      status: 'loading',
      refetch: jest.fn()
    };
  }
  
  // Default successful state
  return {
    data: mockQueryState.dataToReturn,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    status: 'success',
    refetch: jest.fn(() => Promise.resolve({ data: mockQueryState.dataToReturn }))
  };
});

// Helper functions to configure mock behavior
useQuery.mockError = (error) => {
  mockQueryState.shouldError = true;
  mockQueryState.errorToReturn = error;
  mockQueryState.isLoading = false;
};

useQuery.mockSuccess = (data = []) => {
  mockQueryState.shouldError = false;
  mockQueryState.dataToReturn = data;
  mockQueryState.isLoading = false;
};

useQuery.mockLoading = () => {
  mockQueryState.isLoading = true;
  mockQueryState.shouldError = false;
};

useQuery.resetMock = () => {
  mockQueryState = {
    shouldError: false,
    errorToReturn: null,
    dataToReturn: [],
    isLoading: false
  };
};

// State management for mutations - each mutation gets its own state
const mutationInstances = new Map();
let mutationIdCounter = 0;
let rerenderCallback = null;

// Function to trigger re-render when state changes
const triggerRerender = () => {
  if (rerenderCallback) {
    rerenderCallback();
  }
};

// Function to set the rerender callback (called by renderHook)
const setRerenderCallback = (callback) => {
  rerenderCallback = callback;
};

// Reset function for tests
const resetMutationState = () => {
  mutationInstances.clear();
  mutationIdCounter = 0;
  rerenderCallback = null;
};

const useMutation = jest.fn((options = {}) => {
  // Create a simple key based on the mutation function name and line number
  const stack = new Error().stack;
  const callerLine = stack.split('\n')[2]; // Get the line where useMutation was called
  const mutationKey = `${options.mutationFn ? options.mutationFn.name : 'anonymous'}_${callerLine}`;
  
  // Check if we already have an instance for this key
  let mutationId;
  let mutationState;
  
  if (mutationInstances.has(mutationKey)) {
    const existing = mutationInstances.get(mutationKey);
    mutationId = existing.id;
    mutationState = existing.state;
    console.log(`[useMutation] Reusing existing instance ${mutationId}`);
  } else {
    // Create new instance
    mutationId = ++mutationIdCounter;
    mutationState = {
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null
    };
    
    mutationInstances.set(mutationKey, { id: mutationId, state: mutationState });
    console.log(`[useMutation] Creating mutation instance ${mutationId}`);
  }
  
  const mutate = jest.fn(async (variables) => {
    console.log(`Mutation ${mutationId}: Starting mutate`);
    // Set pending state immediately
    mutationState.isPending = true;
    mutationState.isError = false;
    mutationState.isSuccess = false;
    mutationState.data = undefined;
    mutationState.error = null;
    console.log(`Mutation ${mutationId}: Set isPending to true`);
    triggerRerender(); // Trigger re-render when state changes
    
    try {
      if (options.mutationFn) {
        const result = await options.mutationFn(variables);
        
        console.log(`Mutation ${mutationId}: Success, setting isPending to false`);
        // Set success state
        mutationState.isPending = false;
        mutationState.isSuccess = true;
        mutationState.data = result;
        triggerRerender(); // Trigger re-render when state changes
        
        if (options.onSuccess) {
          options.onSuccess(result, variables);
        }
        
        return result;
      }
    } catch (error) {
      console.log(`Mutation ${mutationId}: Error, setting isPending to false`);
      // Set error state
      mutationState.isPending = false;
      mutationState.isError = true;
      mutationState.error = error;
      triggerRerender(); // Trigger re-render when state changes
      
      if (options.onError) {
        options.onError(error, variables);
      }
      
      throw error;
    }
  });

  const mutateAsync = jest.fn(async (variables) => {
    return mutate(variables);
  });

  return {
    mutate,
    mutateAsync,
    get isPending() { 
      console.log(`Mutation ${mutationId}: Getting isPending = ${mutationState.isPending}`);
      return mutationState.isPending; 
    },
    get isError() { return mutationState.isError; },
    get isSuccess() { return mutationState.isSuccess; },
    get data() { return mutationState.data; },
    get error() { return mutationState.error; },
    reset: jest.fn(() => {
      mutationState.isPending = false;
      mutationState.isError = false;
      mutationState.isSuccess = false;
      mutationState.data = undefined;
      mutationState.error = null;
    }),
  };
});

const ReactQueryDevtools = () => null;

module.exports = {
  QueryClient,
  QueryClientProvider,
  // Alias to match projects importing QueryProvider instead of QueryClientProvider
  QueryProvider: QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  ReactQueryDevtools,
  resetMutationState,
  setRerenderCallback
};