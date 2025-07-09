import React, { useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Simple test function to replace the missing testSupabaseConnection
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Connection successful', data };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
};

export default function TestDebug() {
  const { user, loading: authLoading } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState({ testing: false, result: null });
  const [sessionStatus, setSessionStatus] = useState({ testing: false, result: null });
  const [consoleLog, setConsoleLog] = useState([]);

  // Add to console log
  const addLog = (message, type = 'info') => {
    setConsoleLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  // Test Supabase connection
  const handleTestSupabase = async () => {
    setSupabaseStatus({ testing: true, result: null });
    addLog('Testing Supabase connection...', 'info');

    try {
      const result = await testSupabaseConnection();
      setSupabaseStatus({ testing: false, result });

      if (result.success) {
        addLog(`Supabase connection successful: ${result.message}`, 'success');
      } else {
        addLog(`Supabase connection failed: ${result.message}`, 'error');
        if (result.error) {
          addLog(`Error details: ${JSON.stringify(result.error)}`, 'error');
        }
      }
    } catch (error) {
      setSupabaseStatus({ testing: false, result: { success: false, error } });
      addLog(`Exception during Supabase test: ${String(error?.message || error || 'Unknown error')}`, 'error');
    }
  };

  // Test session
  const handleTestSession = async () => {
    setSessionStatus({ testing: true, result: null });
    addLog('Testing current session...', 'info');

    try {
      const { data, error } = await supabase.auth.getSession();

      setSessionStatus({
        testing: false,
        result: { data, error },
      });

      if (error) {
        addLog(`Session error: ${String(error?.message || error || 'Unknown error')}`, 'error');
      } else if (data.session) {
        addLog(`Session found for user: ${data.session.user.email}`, 'success');
        addLog(`User ID: ${data.session.user.id}`, 'info');
        addLog(
          `Session expires: €{new Date(data.session.expires_at * 1000).toLocaleString()}`,
          'info',
        );
      } else {
        addLog('No active session found', 'warn');
      }
    } catch (err) {
      setSessionStatus({ testing: false, result: { error: err } });
      addLog(`Exception checking session: ${String(err?.message || err || 'Unknown error')}`, 'error');
    }
  };

  // Clear session
  const handleClearSession = async () => {
    addLog('Signing out...', 'info');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        addLog(`Sign out error: ${String(error?.message || error || 'Unknown error')}`, 'error');
      } else {
        addLog('Signed out successfully', 'success');
      }
    } catch (err) {
      addLog(`Exception during sign out: ${String(err?.message || err || 'Unknown error')}`, 'error');
    }
  };

  // Clear console
  const handleClearConsole = () => {
    setConsoleLog([]);
  };

  // Check auth state on component mount
  useEffect(() => {
    if (authLoading) {
      addLog('Auth context is loading...', 'info');
    } else if (user) {
      addLog(`User authenticated: ${user.email}`, 'success');
    } else {
      addLog('No authenticated user', 'warn');
    }
  }, [user, authLoading]);

  return (
    <ErrorBoundary>
      <div className='p-6 max-w-4xl mx-auto'>
        <h1 className='text-2xl font-bold text-blue-600 mb-4'>React App Debug Page</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Supabase Test */}
          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-xl font-semibold mb-3'>Supabase Connection</h2>
            <button
              onClick={handleTestSupabase}
              disabled={supabaseStatus.testing}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mr-2 disabled:opacity-50'
            >
              {supabaseStatus.testing ? 'Testing...' : 'Test Connection'}
            </button>

            {supabaseStatus.result && (
              <div
                className={`mt-3 p-3 rounded-md ${supabaseStatus.result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
              >
                <p className='font-semibold'>
                  {supabaseStatus.result.success ? 'Success' : 'Failed'}
                </p>
                <p>{supabaseStatus.result.message}</p>
              </div>
            )}
          </div>

          {/* Session Test */}
          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-xl font-semibold mb-3'>Authentication Status</h2>
            <div className='flex'>
              <button
                onClick={handleTestSession}
                disabled={sessionStatus.testing}
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mr-2 disabled:opacity-50'
              >
                {sessionStatus.testing ? 'Checking...' : 'Check Session'}
              </button>

              <button
                onClick={handleClearSession}
                className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50'
              >
                Sign Out
              </button>
            </div>

            {sessionStatus.result && !sessionStatus.result.error && sessionStatus.result.data && (
              <div className='mt-3 p-3 rounded-md bg-gray-50'>
                <p className='font-semibold'>Session Info:</p>
                <p>
                  {sessionStatus.result.data.session
                    ? `User: ${sessionStatus.result.data.session.user.email}`
                    : 'No active session'}
                </p>
              </div>
            )}

            {sessionStatus.result && sessionStatus.result.error && (
              <div className='mt-3 p-3 rounded-md bg-red-50 text-red-800'>
                <p className='font-semibold'>Error:</p>
                <p>{sessionStatus.result.error.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Console Log */}
        <div className='mt-6 bg-gray-800 text-white p-4 rounded-xl shadow-md'>
          <div className='flex justify-between items-center mb-2'>
            <h2 className='text-xl font-semibold'>Debug Console</h2>
            <button
              onClick={handleClearConsole}
              className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm'
            >
              Clear
            </button>
          </div>

          <div className='h-64 overflow-y-auto bg-gray-900 p-3 rounded-md font-mono text-sm'>
            {consoleLog.length === 0 ? (
              <p className='text-gray-400'>Console is empty. Run a test to see output.</p>
            ) : (
              consoleLog.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    entry.type === 'error'
                      ? 'text-red-400'
                      : entry.type === 'success'
                        ? 'text-green-400'
                        : entry.type === 'warn'
                          ? 'text-yellow-400'
                          : 'text-blue-300'
                  }`}
                >
                  [{entry.timestamp.toLocaleTimeString()}] {entry.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className='mt-6 bg-white p-4 rounded-xl shadow-md'>
          <h2 className='text-xl font-semibold mb-3'>Environment Info</h2>
          <div className='bg-gray-50 p-3 rounded-md'>
            <p>
              <strong>React:</strong> {React.version}
            </p>
            <p>
              <strong>Auth State:</strong>{' '}
              {authLoading ? 'Loading' : user ? 'Authenticated' : 'Not Authenticated'}
            </p>
            <p>
              <strong>Supabase URL:</strong>{' '}
              {supabase.supabaseUrl ? supabase.supabaseUrl : 'Not available'}
            </p>
            <p>
              <strong>Environment:</strong> {import.meta.env.MODE}
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
