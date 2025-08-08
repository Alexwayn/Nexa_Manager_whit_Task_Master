import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test to verify the auth context wrapper works
describe('AuthTestProvider Simple Test', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByTestId('test')).toHaveTextContent('Hello World');
  });

  it('should work with Clerk mock', () => {
    // Import the Clerk mock
    const { useAuth, useUser } = require('@clerk/clerk-react');
    
    // Test that the mock functions exist
    expect(typeof useAuth).toBe('function');
    expect(typeof useUser).toBe('function');
    
    // Test that they return mock data
    const authResult = useAuth();
    const userResult = useUser();
    
    expect(authResult).toBeDefined();
    expect(userResult).toBeDefined();
    
    console.log('Auth result:', authResult);
    console.log('User result:', userResult);
  });

  it('should render component with Clerk hooks', () => {
    const TestComponent = () => {
      const { useAuth, useUser } = require('@clerk/clerk-react');
      
      const auth = useAuth();
      const { user } = useUser();
      
      return (
        <div>
          <div data-testid="auth-status">
            Status: {auth?.isSignedIn ? 'Signed In' : 'Signed Out'}
          </div>
          <div data-testid="user-name">
            User: {user?.fullName || 'No User'}
          </div>
          <div data-testid="loading-status">
            Loading: {auth?.isLoaded ? 'Loaded' : 'Loading'}
          </div>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Just check that elements exist
    expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    expect(screen.getByTestId('user-name')).toBeInTheDocument();
    expect(screen.getByTestId('loading-status')).toBeInTheDocument();
    
    // Log the actual content
    console.log('Auth status content:', screen.getByTestId('auth-status').textContent);
    console.log('User name content:', screen.getByTestId('user-name').textContent);
    console.log('Loading status content:', screen.getByTestId('loading-status').textContent);
  });
});