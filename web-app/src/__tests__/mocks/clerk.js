import React from 'react';

const mockAuth = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_2jA0sS8a0bC1dE2fG3hI4jK5lM6',
  sessionId: 'sess_2jA0sS8a0bC1dE2fG3hI4jK5lM6',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  orgPermissions: [],
  has: () => true,
  signOut: jest.fn(),
  getToken: jest.fn(() => Promise.resolve('mock_token')),
};

const mockUser = {
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'user_2jA0sS8a0bC1dE2fG3hI4jK5lM6',
    username: 'testuser',
    fullName: 'Test User',
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    imageUrl: 'https://example.com/avatar.png',
  },
};

export const useAuth = () => mockAuth;
export const useUser = () => mockUser;

export const ClerkProvider = ({ children }) => {
  return <>{children}</>;
};

export const SignedIn = ({ children }) => <>{children}</>;
export const SignedOut = () => null;