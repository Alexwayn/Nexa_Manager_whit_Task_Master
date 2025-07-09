import {
  useAuth,
  useUser,
  useClerk,
  useOrganization,
  useOrganizationList,
} from '@clerk/clerk-react';

// Type definitions
interface MockEmailAddress {
  id: string;
  emailAddress: string;
  verification: { status: string };
}

interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  imageUrl: string | null;
  emailAddresses: MockEmailAddress[];
  primaryEmailAddress: MockEmailAddress;
  unsafeMetadata?: {
    onboardingComplete?: boolean;
    [key: string]: any;
  };
}

interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  publicMetadata: Record<string, any>;
  privateMetadata: Record<string, any>;
}

interface MockAuth {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: MockUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface MockClerk {
  signOut: () => Promise<void>;
  session: {
    id: string;
    user: MockUser;
  };
}

interface MockOrganizationData {
  organization: MockOrganization | null;
  isLoaded: boolean;
}

interface MockOrganizationList {
  organizationList: MockOrganization[];
  isLoaded: boolean;
  setActive: () => Promise<void>;
}

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const shouldBypassClerk = isDevelopment && isLocalhost;

// Mock data for development mode
const mockUser: MockUser = {
  id: 'dev-user-1',
  firstName: 'Dev',
  lastName: 'User',
  fullName: 'Dev User',
  imageUrl: null,
  emailAddresses: [
    {
      id: 'dev-email-1',
      emailAddress: 'dev@localhost.com',
      verification: { status: 'verified' },
    },
  ],
  primaryEmailAddress: {
    id: 'dev-email-1',
    emailAddress: 'dev@localhost.com',
    verification: { status: 'verified' },
  },
  unsafeMetadata: {
    onboardingComplete: true,
  },
};

const mockOrganization: MockOrganization = {
  id: 'dev-org-1',
  name: 'Development Organization',
  slug: 'dev-org',
  membersCount: 1,
  publicMetadata: {},
  privateMetadata: {},
};

const mockAuth: MockAuth = {
  isSignedIn: true,
  isLoaded: true,
  user: mockUser,
  isAuthenticated: true,
  loading: false,
};

const mockClerk: MockClerk = {
  signOut: async (): Promise<void> => {
    console.log('🚧 Mock signOut called in development mode');
    return Promise.resolve();
  },
  session: {
    id: 'dev-session-1',
    user: mockUser,
  },
};

const mockOrganizationData: MockOrganizationData = {
  organization: mockOrganization,
  isLoaded: true,
};

const mockOrganizationList: MockOrganizationList = {
  organizationList: [mockOrganization],
  isLoaded: true,
  setActive: async (): Promise<void> => {
    console.log('🚧 Mock setActive called in development mode');
    return Promise.resolve();
  },
};

// Custom hooks that handle bypass automatically
export const useAuthBypass = () => {
  if (shouldBypassClerk) {
    console.log('🚧 useAuthBypass: Using mock data in development mode');
    return mockAuth;
  }
  return useAuth();
};

export const useUserBypass = () => {
  if (shouldBypassClerk) {
    console.log('🚧 useUserBypass: Using mock data in development mode');
    return { user: mockUser, isLoaded: true };
  }
  return useUser();
};

export const useClerkBypass = () => {
  if (shouldBypassClerk) {
    console.log('🚧 useClerkBypass: Using mock data in development mode');
    return mockClerk;
  }
  return useClerk();
};

export const useOrganizationBypass = () => {
  if (shouldBypassClerk) {
    console.log('🚧 useOrganizationBypass: Using mock data in development mode');
    return mockOrganizationData;
  }
  return useOrganization();
};

export const useOrganizationListBypass = () => {
  if (shouldBypassClerk) {
    console.log('🚧 useOrganizationListBypass: Using mock data in development mode');
    return mockOrganizationList;
  }
  return useOrganizationList();
};

// Export bypass status for other components
export const isClerkBypassed: boolean = shouldBypassClerk;
