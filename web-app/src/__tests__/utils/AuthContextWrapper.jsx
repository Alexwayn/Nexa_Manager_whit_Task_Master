import React from 'react';

/**
 * Simple Authentication Context Wrapper for Tests
 * Provides a straightforward way to wrap components with authentication context
 */

// Default mock user
const defaultMockUser = {
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
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
};

// Default mock organization
const defaultMockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  imageUrl: 'https://example.com/org-logo.jpg',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  publicMetadata: {},
  privateMetadata: {},
};

/**
 * AuthContextWrapper Component
 * Simple wrapper that sets up authentication mocks before rendering children
 */
export const AuthContextWrapper = ({ 
  children,
  isSignedIn = true,
  isLoaded = true,
  user = defaultMockUser,
  organization = defaultMockOrganization,
  loading = false,
  authError = null,
}) => {
  // Set up the Clerk mock state
  React.useEffect(() => {
    const clerkMock = require('@clerk/clerk-react');
    
    // Update the mock state
    if (clerkMock.setMockAuthState) {
      clerkMock.setMockAuthState({
        isSignedIn,
        isLoaded,
        user,
        organization,
        organizationList: organization ? [organization] : [],
        loading,
        authError,
      });
    }
  }, [isSignedIn, isLoaded, user, organization, loading, authError]);

  return <>{children}</>;
};

/**
 * Preset wrapper configurations
 */

// Authenticated user wrapper
export const AuthenticatedWrapper = ({ children, user = defaultMockUser, organization = defaultMockOrganization }) => (
  <AuthContextWrapper
    isSignedIn={true}
    isLoaded={true}
    user={user}
    organization={organization}
    loading={false}
    authError={null}
  >
    {children}
  </AuthContextWrapper>
);

// Unauthenticated user wrapper
export const UnauthenticatedWrapper = ({ children }) => (
  <AuthContextWrapper
    isSignedIn={false}
    isLoaded={true}
    user={null}
    organization={null}
    loading={false}
    authError={null}
  >
    {children}
  </AuthContextWrapper>
);

// Loading state wrapper
export const LoadingWrapper = ({ children }) => (
  <AuthContextWrapper
    isSignedIn={false}
    isLoaded={false}
    user={null}
    organization={null}
    loading={true}
    authError={null}
  >
    {children}
  </AuthContextWrapper>
);

// Error state wrapper
export const ErrorWrapper = ({ children, error = new Error('Authentication error') }) => (
  <AuthContextWrapper
    isSignedIn={false}
    isLoaded={true}
    user={null}
    organization={null}
    loading={false}
    authError={error}
  >
    {children}
  </AuthContextWrapper>
);

/**
 * Utility functions for creating custom wrappers
 */

// Create wrapper with custom user
export const createUserWrapper = (userOverrides = {}) => {
  const customUser = { ...defaultMockUser, ...userOverrides };
  return ({ children }) => (
    <AuthenticatedWrapper user={customUser}>
      {children}
    </AuthenticatedWrapper>
  );
};

// Create wrapper with custom organization
export const createOrgWrapper = (orgOverrides = {}) => {
  const customOrg = { ...defaultMockOrganization, ...orgOverrides };
  return ({ children }) => (
    <AuthenticatedWrapper organization={customOrg}>
      {children}
    </AuthenticatedWrapper>
  );
};

/**
 * Test utilities
 */

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  ...defaultMockUser,
  ...overrides
});

// Mock organization factory
export const createMockOrganization = (overrides = {}) => ({
  ...defaultMockOrganization,
  ...overrides
});

/**
 * Default export
 */
export default {
  AuthContextWrapper,
  AuthenticatedWrapper,
  UnauthenticatedWrapper,
  LoadingWrapper,
  ErrorWrapper,
  createUserWrapper,
  createOrgWrapper,
  createMockUser,
  createMockOrganization,
};