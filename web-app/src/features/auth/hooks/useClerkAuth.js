import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Custom hook for robust Clerk authentication state management
 * Handles edge cases and provides stable auth state
 */
export function useClerkAuth() {
  const { isSignedIn, isLoaded, ...authProps } = useAuth();
  const [authState, setAuthState] = useState({
    isLoaded: false,
    isSignedIn: false,
    isReady: false,
  });

  useEffect(() => {
    // Update auth state when Clerk state changes
    setAuthState(prev => ({
      ...prev,
      isLoaded: isLoaded || false,
      isSignedIn: isSignedIn || false,
      isReady: isLoaded || false,
    }));
  }, [isLoaded, isSignedIn]);

  // Force ready state after 2 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthState(prev => ({
        ...prev,
        isReady: true,
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return {
    ...authProps,
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    isReady: authState.isReady,
    // Helper methods
    isAuthenticated: authState.isReady && authState.isSignedIn,
    shouldShowAuth: authState.isReady && !authState.isSignedIn,
    shouldShowLoading: !authState.isReady,
  };
}
