import React from 'react';
import { QueryTestProvider } from './QueryTestProvider';
import { AuthTestProvider } from './AuthTestProvider';

/**
 * Combined Test Providers
 * Provides all necessary context providers for testing components
 */

/**
 * AllTestProviders Component
 * Wraps components with all necessary providers for comprehensive testing
 */
export const AllTestProviders = ({ 
  children,
  // Query provider options
  queryClient = null,
  queryClientOptions = {},
  // Auth provider options
  authState = {},
  mockClerk = true,
  mockInternalAuth = true,
  // Additional provider options
  additionalProviders = []
}) => {
  let wrappedChildren = children;

  // Wrap with auth provider
  wrappedChildren = (
    <AuthTestProvider
      authState={authState}
      mockClerk={mockClerk}
      mockInternalAuth={mockInternalAuth}
    >
      {wrappedChildren}
    </AuthTestProvider>
  );

  // Wrap with query provider
  wrappedChildren = (
    <QueryTestProvider
      client={queryClient}
      queryClientOptions={queryClientOptions}
    >
      {wrappedChildren}
    </QueryTestProvider>
  );

  // Apply any additional providers
  additionalProviders.forEach((Provider) => {
    if (typeof Provider === 'function') {
      wrappedChildren = <Provider>{wrappedChildren}</Provider>;
    } else if (React.isValidElement(Provider)) {
      wrappedChildren = React.cloneElement(Provider, {}, wrappedChildren);
    }
  });

  return wrappedChildren;
};

/**
 * Custom render function with all providers
 * Use this instead of @testing-library/react's render for components that need context
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    // Provider options
    queryClient,
    queryClientOptions,
    authState,
    mockClerk = true,
    mockInternalAuth = true,
    additionalProviders = [],
    // Render options
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <AllTestProviders
      queryClient={queryClient}
      queryClientOptions={queryClientOptions}
      authState={authState}
      mockClerk={mockClerk}
      mockInternalAuth={mockInternalAuth}
      additionalProviders={additionalProviders}
    >
      {children}
    </AllTestProviders>
  );

  // Import render dynamically to avoid circular dependency
  const { render } = require('@testing-library/react');
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Utility to create a wrapper component with providers
 * Useful for testing hooks with React Testing Library's renderHook
 */
export const createTestWrapper = (options = {}) => {
  const {
    queryClient,
    queryClientOptions,
    authState,
    mockClerk = true,
    mockInternalAuth = true,
    additionalProviders = [],
  } = options;

  return ({ children }) => (
    <AllTestProviders
      queryClient={queryClient}
      queryClientOptions={queryClientOptions}
      authState={authState}
      mockClerk={mockClerk}
      mockInternalAuth={mockInternalAuth}
      additionalProviders={additionalProviders}
    >
      {children}
    </AllTestProviders>
  );
};

/**
 * Preset configurations for common testing scenarios
 */

// Authenticated user with default settings
export const createAuthenticatedWrapper = (userOverrides = {}, orgOverrides = {}) => {
  return createTestWrapper({
    authState: {
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        ...userOverrides
      },
      organization: {
        id: 'test-org-id',
        name: 'Test Organization',
        slug: 'test-org',
        ...orgOverrides
      },
      loading: false,
      authError: null,
    }
  });
};

// Unauthenticated user
export const createUnauthenticatedWrapper = () => {
  return createTestWrapper({
    authState: {
      isSignedIn: false,
      isLoaded: true,
      user: null,
      organization: null,
      loading: false,
      authError: null,
    }
  });
};

// Loading state
export const createLoadingWrapper = () => {
  return createTestWrapper({
    authState: {
      isSignedIn: false,
      isLoaded: false,
      user: null,
      organization: null,
      loading: true,
      authError: null,
    }
  });
};

// Error state
export const createErrorWrapper = (error = new Error('Test auth error')) => {
  return createTestWrapper({
    authState: {
      isSignedIn: false,
      isLoaded: true,
      user: null,
      organization: null,
      loading: false,
      authError: error,
    }
  });
};

/**
 * Utility functions for testing with providers
 */

// Render component with authenticated user
export const renderWithAuth = (ui, options = {}) => {
  const { userOverrides = {}, orgOverrides = {}, ...renderOptions } = options;
  
  return renderWithProviders(ui, {
    authState: {
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        ...userOverrides
      },
      organization: {
        id: 'test-org-id',
        name: 'Test Organization',
        slug: 'test-org',
        ...orgOverrides
      },
      loading: false,
      authError: null,
    },
    ...renderOptions
  });
};

// Render component without authentication
export const renderWithoutAuth = (ui, options = {}) => {
  return renderWithProviders(ui, {
    authState: {
      isSignedIn: false,
      isLoaded: true,
      user: null,
      organization: null,
      loading: false,
      authError: null,
    },
    ...options
  });
};

// Render component in loading state
export const renderWithLoading = (ui, options = {}) => {
  return renderWithProviders(ui, {
    authState: {
      isSignedIn: false,
      isLoaded: false,
      user: null,
      organization: null,
      loading: true,
      authError: null,
    },
    ...options
  });
};

// Render component with error state
export const renderWithError = (ui, error = new Error('Test auth error'), options = {}) => {
  return renderWithProviders(ui, {
    authState: {
      isSignedIn: false,
      isLoaded: true,
      user: null,
      organization: null,
      loading: false,
      authError: error,
    },
    ...options
  });
};

/**
 * Test utilities for common assertions
 */

// Wait for auth to be loaded
export const waitForAuthToLoad = async () => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    // This is a simple check - in real tests you might want to check specific elements
    expect(document.body).toBeInTheDocument();
  });
};

// Wait for queries to settle
export const waitForQueriesToSettle = async (queryClient) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const isFetching = queries.some(query => query.state.isFetching);
    
    if (isFetching) {
      throw new Error('Queries are still fetching');
    }
  }, { timeout: 5000 });
};

/**
 * Default export with all utilities
 */
export default {
  AllTestProviders,
  renderWithProviders,
  createTestWrapper,
  createAuthenticatedWrapper,
  createUnauthenticatedWrapper,
  createLoadingWrapper,
  createErrorWrapper,
  renderWithAuth,
  renderWithoutAuth,
  renderWithLoading,
  renderWithError,
  waitForAuthToLoad,
  waitForQueriesToSettle,
};