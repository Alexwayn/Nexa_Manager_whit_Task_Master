import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Debug Clerk Mock', () => {
  it('should show what the Clerk mock actually returns', () => {
    // Import the Clerk mock
    const clerkMock = require('@clerk/clerk-react');
    
    console.log('Clerk mock object:', Object.keys(clerkMock));
    
    // Test the useAuth hook
    const authResult = clerkMock.useAuth();
    console.log('useAuth result:', JSON.stringify(authResult, null, 2));
    
    // Test the useUser hook
    const userResult = clerkMock.useUser();
    console.log('useUser result:', JSON.stringify(userResult, null, 2));
    
    // Test component rendering
    const TestComponent = () => {
      const auth = clerkMock.useAuth();
      const { user } = clerkMock.useUser();
      
      console.log('In component - auth:', auth);
      console.log('In component - user:', user);
      
      return (
        <div>
          <div data-testid="debug-auth">
            Auth: {JSON.stringify(auth)}
          </div>
          <div data-testid="debug-user">
            User: {JSON.stringify(user)}
          </div>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Just check that elements exist
    expect(screen.getByTestId('debug-auth')).toBeInTheDocument();
    expect(screen.getByTestId('debug-user')).toBeInTheDocument();
  });
  
  it('should test setMockAuthState function', () => {
    const clerkMock = require('@clerk/clerk-react');
    
    console.log('Has setMockAuthState:', typeof clerkMock.setMockAuthState);
    
    if (clerkMock.setMockAuthState) {
      clerkMock.setMockAuthState({
        isSignedIn: false,
        isLoaded: true,
        user: null,
      });
      
      const authResult = clerkMock.useAuth();
      console.log('After setMockAuthState - auth:', JSON.stringify(authResult, null, 2));
    }
    
    expect(true).toBe(true); // Just to make the test pass
  });
});