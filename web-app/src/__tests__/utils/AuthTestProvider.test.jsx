import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthTestProvider, createAuthenticatedState, createUnauthenticatedState } from './AuthTestProvider';

// Test component that uses auth context
const TestComponent = () => {
  // Import the mocked hooks
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

describe('AuthTestProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default authenticated state', () => {
    it('should provide authenticated user by default', () => {
      render(
        <AuthTestProvider>
          <TestComponent />
        </AuthTestProvider>
      );

      // Debug: log the actual content
      console.log('Auth status:', screen.getByTestId('auth-status').textContent);
      console.log('User name:', screen.getByTestId('user-name').textContent);
      console.log('Loading status:', screen.getByTestId('loading-status').textContent);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });
  });

  describe('Custom auth states', () => {
    it('should handle unauthenticated state', () => {
      const unauthenticatedState = createUnauthenticatedState();
      
      render(
        <AuthTestProvider authState={unauthenticatedState}>
          <TestComponent />
        </AuthTestProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });

    it('should handle custom user data', () => {
      const customState = createAuthenticatedState({
        fullName: 'Custom User',
        email: 'custom@example.com'
      });
      
      render(
        <AuthTestProvider authState={customState}>
          <TestComponent />
        </AuthTestProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Custom User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loaded');
    });

    it('should handle loading state', () => {
      const loadingState = {
        isSignedIn: false,
        isLoaded: false,
        user: null,
        loading: true,
      };
      
      render(
        <AuthTestProvider authState={loadingState}>
          <TestComponent />
        </AuthTestProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Signed Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
    });
  });

  describe('Provider configuration', () => {
    it('should work with Clerk mocking disabled', () => {
      render(
        <AuthTestProvider mockClerk={false}>
          <TestComponent />
        </AuthTestProvider>
      );

      // Component should still render without errors
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });

    it('should work with internal auth mocking disabled', () => {
      render(
        <AuthTestProvider mockInternalAuth={false}>
          <TestComponent />
        </AuthTestProvider>
      );

      // Component should still render without errors
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    });
  });

  describe('Utility functions', () => {
    it('should create authenticated state correctly', () => {
      const state = createAuthenticatedState();
      
      expect(state.isSignedIn).toBe(true);
      expect(state.isLoaded).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user.fullName).toBe('Test User');
    });

    it('should create unauthenticated state correctly', () => {
      const state = createUnauthenticatedState();
      
      expect(state.isSignedIn).toBe(false);
      expect(state.isLoaded).toBe(true);
      expect(state.user).toBeNull();
    });

    it('should allow user overrides', () => {
      const state = createAuthenticatedState({
        fullName: 'Override User',
        email: 'override@example.com'
      });
      
      expect(state.user.fullName).toBe('Override User');
      expect(state.user.email).toBe('override@example.com');
    });
  });
});