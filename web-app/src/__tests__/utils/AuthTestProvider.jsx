import React from 'react';

/**
 * Authentication Test Provider
 * Provides mock authentication context for testing components that require auth
 */

// Mock user data for testing
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  username: 'testuser',
  imageUrl: 'https://example.com/avatar.jpg',
  emailAddresses: [
    {
      id: 'test-email-id',
      emailAddress: 'test@example.com',
      verification: { status: 'verified' }
    }
  ],
  primaryEmailAddressId: 'test-email-id',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

// Mock organization data for testing
export const createMockOrganization = (overrides = {}) => ({
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  imageUrl: 'https://example.com/org-logo.jpg',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides
});

// Default mock auth state
const defaultAuthState = {
  // Clerk auth state
  isSignedIn: true,
  isLoaded: true,
  user: createMockUser(),
  organization: createMockOrganization(),
  
  // Internal auth state (Supabase-based)
  loading: false,
  authError: null,
  userAvatar: 'https://example.com/avatar.jpg',
  
  // Auth actions
  signOut: jest.fn(() => Promise.resolve()),
  signIn: jest.fn(() => Promise.resolve()),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  logout: jest.fn(() => Promise.resolve()),
  recoverSession: jest.fn(() => Promise.resolve(true)),
  updateUserAvatar: jest.fn(() => Promise.resolve('https://example.com/avatar.jpg')),
  setUser: jest.fn(),
  
  // Organization actions
  setActive: jest.fn(() => Promise.resolve()),
  organizationList: [createMockOrganization()],
};

/**
 * AuthTestProvider Component
 * Wraps components with mock authentication context
 */
export const AuthTestProvider = ({ 
  children, 
  authState = {},
  mockClerk = true,
  mockInternalAuth = true 
}) => {
  const mergedAuthState = { ...defaultAuthState, ...authState };

  // Update the Clerk mock state if Clerk mocking is enabled
  React.useEffect(() => {
    if (mockClerk) {
      // Import the mock utilities and update the mock state
      const clerkMock = require('@clerk/clerk-react');
      if (clerkMock.setMockAuthState) {
        clerkMock.setMockAuthState(mergedAuthState);
      }
    }
  }, [mockClerk, mergedAuthState]);

  // Create mock contexts
  let wrappedChildren = children;

  // Mock internal auth contexts if requested
  if (mockInternalAuth) {
    // Mock the internal AuthContext
    const MockAuthContext = React.createContext(mergedAuthState);
    const MockUserContext = React.createContext({
      user: mergedAuthState.user,
      userAvatar: mergedAuthState.userAvatar
    });
    const MockAuthStateContext = React.createContext({
      loading: mergedAuthState.loading,
      authError: mergedAuthState.authError
    });
    const MockAuthActionsContext = React.createContext({
      setUser: mergedAuthState.setUser,
      logout: mergedAuthState.logout,
      recoverSession: mergedAuthState.recoverSession,
      updateUserAvatar: mergedAuthState.updateUserAvatar
    });

    wrappedChildren = (
      <MockAuthContext.Provider value={mergedAuthState}>
        <MockUserContext.Provider value={{
          user: mergedAuthState.user,
          userAvatar: mergedAuthState.userAvatar
        }}>
          <MockAuthStateContext.Provider value={{
            loading: mergedAuthState.loading,
            authError: mergedAuthState.authError
          }}>
            <MockAuthActionsContext.Provider value={{
              setUser: mergedAuthState.setUser,
              logout: mergedAuthState.logout,
              recoverSession: mergedAuthState.recoverSession,
              updateUserAvatar: mergedAuthState.updateUserAvatar
            }}>
              {wrappedChildren}
            </MockAuthActionsContext.Provider>
          </MockAuthStateContext.Provider>
        </MockUserContext.Provider>
      </MockAuthContext.Provider>
    );
  }

  return wrappedChildren;
};

/**
 * Utility functions for creating different auth states
 */

// Create authenticated user state
export const createAuthenticatedState = (userOverrides = {}, orgOverrides = {}) => ({
  isSignedIn: true,
  isLoaded: true,
  user: createMockUser(userOverrides),
  organization: createMockOrganization(orgOverrides),
  loading: false,
  authError: null,
});

// Create unauthenticated state
export const createUnauthenticatedState = () => ({
  isSignedIn: false,
  isLoaded: true,
  user: null,
  organization: null,
  loading: false,
  authError: null,
});

// Create loading state
export const createLoadingState = () => ({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  organization: null,
  loading: true,
  authError: null,
});

// Create error state
export const createErrorState = (error = new Error('Authentication error')) => ({
  isSignedIn: false,
  isLoaded: true,
  user: null,
  organization: null,
  loading: false,
  authError: error,
});

/**
 * Hook mocks for testing
 */

// Mock useAuth hook
export const createMockUseAuth = (authState = {}) => {
  const mockState = { ...defaultAuthState, ...authState };
  return jest.fn(() => mockState);
};

// Mock useUser hook
export const createMockUseUser = (user = null) => {
  return jest.fn(() => ({
    user: user || createMockUser(),
    isLoaded: true,
    isSignedIn: !!user,
  }));
};

// Mock useOrganization hook
export const createMockUseOrganization = (organization = null) => {
  return jest.fn(() => ({
    organization: organization || createMockOrganization(),
    isLoaded: true,
  }));
};

// Mock useOrganizationList hook
export const createMockUseOrganizationList = (organizations = []) => {
  return jest.fn(() => ({
    organizationList: organizations.length > 0 ? organizations : [createMockOrganization()],
    isLoaded: true,
    setActive: jest.fn(() => Promise.resolve()),
  }));
};

/**
 * Test utilities for auth assertions
 */

// Assert user is authenticated
export const expectUserToBeAuthenticated = (authState) => {
  expect(authState.isSignedIn).toBe(true);
  expect(authState.user).toBeTruthy();
  expect(authState.isLoaded).toBe(true);
};

// Assert user is not authenticated
export const expectUserToBeUnauthenticated = (authState) => {
  expect(authState.isSignedIn).toBe(false);
  expect(authState.user).toBeNull();
  expect(authState.isLoaded).toBe(true);
};

// Assert auth is loading
export const expectAuthToBeLoading = (authState) => {
  expect(authState.loading).toBe(true);
  expect(authState.isLoaded).toBe(false);
};

// Assert auth has error
export const expectAuthToHaveError = (authState, expectedError = null) => {
  expect(authState.authError).toBeTruthy();
  if (expectedError) {
    expect(authState.authError.message).toContain(expectedError);
  }
};

/**
 * Mock data factories
 */

// Create mock user with specific role
export const createMockUserWithRole = (role = 'user') => {
  return createMockUser({
    publicMetadata: { role },
    privateMetadata: { permissions: role === 'admin' ? ['all'] : ['read'] }
  });
};

// Create mock organization with members
export const createMockOrganizationWithMembers = (memberCount = 1) => {
  const members = Array.from({ length: memberCount }, (_, i) => ({
    id: `member-${i}`,
    user: createMockUser({ id: `user-${i}`, email: `user${i}@example.com` }),
    role: i === 0 ? 'admin' : 'member'
  }));

  return createMockOrganization({
    members,
    memberCount
  });
};

/**
 * Default export with all utilities
 */
export default {
  AuthTestProvider,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  createErrorState,
  createMockUseAuth,
  createMockUseUser,
  createMockUseOrganization,
  createMockUseOrganizationList,
  createMockUser,
  createMockOrganization,
  createMockUserWithRole,
  createMockOrganizationWithMembers,
  expectUserToBeAuthenticated,
  expectUserToBeUnauthenticated,
  expectAuthToBeLoading,
  expectAuthToHaveError,
};