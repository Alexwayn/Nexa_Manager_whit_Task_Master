import React, { createContext, useContext, useState, useEffect } from 'react';
import { useClerkSupabase, useDemoData } from '@lib/clerkSupabaseIntegration';
import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';
import Logger from '@utils/Logger';

const TestingContext = createContext();

/**
 * Safe Testing Wrapper for Development
 * Provides secure testing capabilities without exposing service role keys
 */
export const SafeTestingWrapper = ({ children }) => {
  const { isSignedIn, user } = useAuth();
  const { initializeIntegration, isReady } = useClerkSupabase();
  const { executeTestQuery, testUserId } = useDemoData();
  const [testingMode, setTestingMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if demo mode is enabled
  useEffect(() => {
    const demoModeEnabled = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
    const isDevEnvironment = import.meta.env.VITE_APP_ENV === 'development';

    setIsDemoMode(demoModeEnabled && isDevEnvironment);
    Logger.info('Demo mode enabled:', demoModeEnabled && isDevEnvironment);
  }, []);

  // Initialize Clerk-Supabase integration when user signs in
  useEffect(() => {
    if (isSignedIn && user && !testingMode) {
      initializeIntegration();
    }
  }, [isSignedIn, user, testingMode, initializeIntegration]);

  const enableTestingMode = () => {
    if (!isDemoMode) {
      alert('Demo mode is not enabled. Check your environment configuration.');
      return;
    }

    setTestingMode(true);
    Logger.info('Testing mode enabled with demo user:', testUserId);
  };

  const disableTestingMode = () => {
    setTestingMode(false);
    Logger.info('Testing mode disabled');
  };

  const executeQuery = async queryFunction => {
    if (testingMode) {
      // Use demo data for testing
      return await executeTestQuery(queryFunction);
    } else if (isSignedIn && isReady) {
      // Use real authenticated user
      return await queryFunction();
    } else {
      throw new Error('Please sign in or enable testing mode to access data');
    }
  };

  const contextValue = {
    testingMode,
    enableTestingMode,
    disableTestingMode,
    executeQuery,
    isDemoMode,
    currentUserId: testingMode ? testUserId : user?.id,
    isAuthenticated: testingMode || (isSignedIn && isReady),
  };

  return (
    <TestingContext.Provider value={contextValue}>
      {isDemoMode && (
        <div className='bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4'>
          <div className='flex items-center'>
            <div className='ml-3'>
              <p className='text-sm'>
                🧪 <strong>Development Mode Attivo</strong> -
                <button
                  onClick={testingMode ? disableTestingMode : enableTestingMode}
                  className='underline hover:text-yellow-800 ml-2'
                >
                  {testingMode ? 'Disabilita Testing' : 'Abilita Testing con Dati Demo'}
                </button>
              </p>
              {testingMode && (
                <p className='text-xs mt-1'>
                  Usando utente demo: {testUserId} (sicuro per testing)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </TestingContext.Provider>
  );
};

// Hook per usare il testing context
export const useSafeTesting = () => {
  const context = useContext(TestingContext);
  if (!context) {
    throw new Error('useSafeTesting must be used within SafeTestingWrapper');
  }
  return context;
};

// HOC per wrappare componenti che necessitano testing
export const withSafeTesting = Component => {
  return function SafeTestingComponent(props) {
    return (
      <SafeTestingWrapper>
        <Component {...props} />
      </SafeTestingWrapper>
    );
  };
};
