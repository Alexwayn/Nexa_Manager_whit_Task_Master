/**
 * Mock for @clerk/clerk-react
 * Provides comprehensive mocking for Clerk authentication hooks and components
 */

// Mock user data factory
const createMockUser = (overrides = {}) => ({
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
  ...overrides
});

// Mock organization data factory
const createMockOrganization = (overrides = {}) => ({
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  imageUrl: 'https://example.com/org-logo.jpg',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  publicMetadata: {},
  privateMetadata: {},
  ...overrides
});

// Global mock state that can be modified by tests
let mockAuthState = {
  isSignedIn: true,
  isLoaded: true,
  user: createMockUser(),
  organization: createMockOrganization(),
  organizationList: [createMockOrganization()],
  loading: false,
};

// Utility to update mock state
export const setMockAuthState = (newState) => {
  mockAuthState = { ...mockAuthState, ...newState };
};

// Utility to reset mock state
export const resetMockAuthState = () => {
  mockAuthState = {
    isSignedIn: true,
    isLoaded: true,
    user: createMockUser(),
    organization: createMockOrganization(),
    organizationList: [createMockOrganization()],
    loading: false,
  };
};

// Mock useAuth hook
export const useAuth = jest.fn(() => ({
  isSignedIn: mockAuthState.isSignedIn,
  isLoaded: mockAuthState.isLoaded,
  user: mockAuthState.user,
  signOut: jest.fn(() => Promise.resolve()),
  signIn: jest.fn(() => Promise.resolve()),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  sessionId: 'mock-session-id',
  userId: mockAuthState.user?.id || null,
  orgId: mockAuthState.organization?.id || null,
  orgRole: 'admin',
  orgSlug: mockAuthState.organization?.slug || null,
  has: jest.fn(() => true),
}));

// Mock useUser hook
export const useUser = jest.fn(() => ({
  user: mockAuthState.user,
  isLoaded: mockAuthState.isLoaded,
  isSignedIn: mockAuthState.isSignedIn,
}));

// Mock useOrganization hook
export const useOrganization = jest.fn(() => ({
  organization: mockAuthState.organization,
  isLoaded: mockAuthState.isLoaded,
  membership: {
    id: 'mock-membership-id',
    role: 'admin',
    permissions: ['org:read', 'org:write'],
  },
}));

// Mock useOrganizationList hook
export const useOrganizationList = jest.fn(() => ({
  organizationList: mockAuthState.organizationList,
  isLoaded: mockAuthState.isLoaded,
  setActive: jest.fn(({ organization }) => {
    if (organization) {
      mockAuthState.organization = organization;
    }
    return Promise.resolve();
  }),
  createOrganization: jest.fn(() => Promise.resolve(createMockOrganization())),
}));

// Mock useSession hook
export const useSession = jest.fn(() => ({
  session: mockAuthState.isSignedIn ? {
    id: 'mock-session-id',
    status: 'active',
    lastActiveAt: new Date(),
    expireAt: new Date(Date.now() + 3600000), // 1 hour from now
    user: mockAuthState.user,
  } : null,
  isLoaded: mockAuthState.isLoaded,
}));

// Mock useSessionList hook
export const useSessionList = jest.fn(() => ({
  sessions: mockAuthState.isSignedIn ? [{
    id: 'mock-session-id',
    status: 'active',
    lastActiveAt: new Date(),
    expireAt: new Date(Date.now() + 3600000),
    user: mockAuthState.user,
  }] : [],
  isLoaded: mockAuthState.isLoaded,
  setActive: jest.fn(() => Promise.resolve()),
}));

// Mock useClerk hook
export const useClerk = jest.fn(() => ({
  user: mockAuthState.user,
  session: mockAuthState.isSignedIn ? {
    id: 'mock-session-id',
    status: 'active',
    user: mockAuthState.user,
  } : null,
  organization: mockAuthState.organization,
  client: {
    sessions: [],
    activeSessions: [],
  },
  signOut: jest.fn(() => Promise.resolve()),
  openSignIn: jest.fn(),
  openSignUp: jest.fn(),
  openUserProfile: jest.fn(),
  openOrganizationProfile: jest.fn(),
  redirectToSignIn: jest.fn(),
  redirectToSignUp: jest.fn(),
  redirectToUserProfile: jest.fn(),
  redirectToOrganizationProfile: jest.fn(),
  navigateToUserProfile: jest.fn(),
  navigateToOrganizationProfile: jest.fn(),
  buildSignInUrl: jest.fn(() => '/sign-in'),
  buildSignUpUrl: jest.fn(() => '/sign-up'),
  buildUserProfileUrl: jest.fn(() => '/user-profile'),
  buildOrganizationProfileUrl: jest.fn(() => '/organization-profile'),
}));

// Mock ClerkProvider component
export const ClerkProvider = jest.fn(({ children }) => children);

// Mock SignIn component
export const SignIn = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-sign-in' }, 'Sign In'));

// Mock SignUp component
export const SignUp = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-sign-up' }, 'Sign Up'));

// Mock UserProfile component
export const UserProfile = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-user-profile' }, 'User Profile'));

// Mock OrganizationProfile component
export const OrganizationProfile = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-organization-profile' }, 'Organization Profile'));

// Mock UserButton component
export const UserButton = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-user-button' }, 'User Button'));

// Mock OrganizationSwitcher component
export const OrganizationSwitcher = jest.fn(() => React.createElement('div', { 'data-testid': 'clerk-organization-switcher' }, 'Organization Switcher'));

// Mock SignedIn component
export const SignedIn = jest.fn(({ children }) => mockAuthState.isSignedIn ? children : null);

// Mock SignedOut component
export const SignedOut = jest.fn(({ children }) => !mockAuthState.isSignedIn ? children : null);

// Mock RedirectToSignIn component
export const RedirectToSignIn = jest.fn(() => React.createElement('div', { 'data-testid': 'redirect-to-sign-in' }, 'Redirecting to Sign In'));

// Mock RedirectToSignUp component
export const RedirectToSignUp = jest.fn(() => React.createElement('div', { 'data-testid': 'redirect-to-sign-up' }, 'Redirecting to Sign Up'));

// Mock Protect component
export const Protect = jest.fn(({ children, fallback, condition, role, permission }) => {
  // Simple mock logic - in real tests, you might want more sophisticated permission checking
  if (mockAuthState.isSignedIn) {
    return children;
  }
  return fallback || null;
});

// Mock withClerk HOC
export const withClerk = jest.fn((Component) => {
  const WrappedComponent = (props) => {
    const clerkProps = {
      clerk: useClerk(),
      user: mockAuthState.user,
      session: mockAuthState.isSignedIn ? { id: 'mock-session-id' } : null,
      organization: mockAuthState.organization,
    };
    return React.createElement(Component, { ...props, ...clerkProps });
  };
  WrappedComponent.displayName = `withClerk(${Component.displayName || Component.name})`;
  return WrappedComponent;
});

// Mock withUser HOC
export const withUser = jest.fn((Component) => {
  const WrappedComponent = (props) => {
    const userProps = {
      user: mockAuthState.user,
      isLoaded: mockAuthState.isLoaded,
      isSignedIn: mockAuthState.isSignedIn,
    };
    return React.createElement(Component, { ...props, ...userProps });
  };
  WrappedComponent.displayName = `withUser(${Component.displayName || Component.name})`;
  return WrappedComponent;
});

// Mock withSession HOC
export const withSession = jest.fn((Component) => {
  const WrappedComponent = (props) => {
    const sessionProps = {
      session: mockAuthState.isSignedIn ? { id: 'mock-session-id' } : null,
      isLoaded: mockAuthState.isLoaded,
    };
    return React.createElement(Component, { ...props, ...sessionProps });
  };
  WrappedComponent.displayName = `withSession(${Component.displayName || Component.name})`;
  return WrappedComponent;
});

// Mock isClerkAPIResponseError function
export const isClerkAPIResponseError = jest.fn(() => false);

// Mock ClerkAPIResponseError class
export class ClerkAPIResponseError extends Error {
  constructor(message, { data, status } = {}) {
    super(message);
    this.name = 'ClerkAPIResponseError';
    this.status = status || 400;
    this.data = data || {};
  }
}

// Test utilities
export const clerkTestUtils = {
  setMockAuthState,
  resetMockAuthState,
  createMockUser,
  createMockOrganization,
  
  // Helper to simulate sign in
  simulateSignIn: (user = null) => {
    setMockAuthState({
      isSignedIn: true,
      isLoaded: true,
      user: user || createMockUser(),
    });
  },
  
  // Helper to simulate sign out
  simulateSignOut: () => {
    setMockAuthState({
      isSignedIn: false,
      isLoaded: true,
      user: null,
      organization: null,
    });
  },
  
  // Helper to simulate loading state
  simulateLoading: () => {
    setMockAuthState({
      isLoaded: false,
      loading: true,
    });
  },
  
  // Helper to simulate organization switch
  simulateOrganizationSwitch: (organization = null) => {
    setMockAuthState({
      organization: organization || createMockOrganization(),
    });
  },
};

// Default export
export default {
  useAuth,
  useUser,
  useOrganization,
  useOrganizationList,
  useSession,
  useSessionList,
  useClerk,
  ClerkProvider,
  SignIn,
  SignUp,
  UserProfile,
  OrganizationProfile,
  UserButton,
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  RedirectToSignUp,
  Protect,
  withClerk,
  withUser,
  withSession,
  isClerkAPIResponseError,
  ClerkAPIResponseError,
  clerkTestUtils,
};