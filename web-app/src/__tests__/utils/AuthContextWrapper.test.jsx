import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  AuthContextWrapper, 
  AuthenticatedWrapper, 
  UnauthenticatedWrapper, 
  LoadingWrapper,
  createMockUser 
} from './AuthContextWrapper';

// Test component that uses Clerk hooks
const TestAuthComponent = () => {
  const { useAuth, useUser } = require('@clerk/clerk-react');
  
  const auth = useAuth();
  const { user } = useUser();
  
  return (
    <div>
      <div data-testid="auth-status">
        {auth.isSignedIn ? 'Signed In' : 'Signed Out'}
      </div>
      <div data-testid="user-name">
        {user ? user.fullName : 'No User'}
      </div>
      <div data-testid="loading-status">
        {auth.isLoaded ? 'Loaded' : 'Loading'}
      </div>
    </div>
  );
};

describe('AuthContextWrapper', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    const clerkMock = require('@clerk/clerk-react');
    if (clerkMock.resetMockAuthState) {
      clerkMock.resetMockAuthState();
    }
  });

  describe('AuthenticatedWrapper', () => {
    it('should provide authenticated state', () => {
      render(
        <AuthenticatedWrapper>
          <TestAuthComponent />
        </AuthenticatedWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });

    it('should work with custom user', () => {
      const customUser = createMockUser({ fullName: 'Custom User' });
      
      render(
        <AuthenticatedWrapper user={customUser}>
          <TestAuthComponent />
        </AuthenticatedWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Custom User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });
  });

  describe('UnauthenticatedWrapper', () => {
    it('should provide unauthenticated state', () => {
      render(
        <UnauthenticatedWrapper>
          <TestAuthComponent />
        </UnauthenticatedWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });
  });

  describe('LoadingWrapper', () => {
    it('should provide loading state', () => {
      render(
        <LoadingWrapper>
          <TestAuthComponent />
        </LoadingWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
    });
  });

  describe('Custom AuthContextWrapper', () => {
    it('should work with custom configuration', () => {
      const customUser = createMockUser({ fullName: 'Admin User' });
      
      render(
        <AuthContextWrapper
          isSignedIn={true}
          isLoaded={true}
          user={customUser}
          loading={false}
        >
          <TestAuthComponent />
        </AuthContextWrapper>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Admin User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });
  });
});