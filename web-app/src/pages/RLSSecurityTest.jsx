import React, { useState, useEffect } from 'react';
import { runRLSSecurityTests } from '@utils/rls-security-tests';
import { useAuth } from '@context/AuthContext';
import Logger from '@utils/Logger';

const RLSSecurityTest = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Override console.log to capture test output
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestResults(null);

    try {
      const results = await runRLSSecurityTests();
      setTestResults(results);
    } catch (error) {
      Logger.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults(null);
  };

  if (!user) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h2 className='text-red-800 font-semibold'>Authentication Required</h2>
          <p className='text-red-700'>You must be logged in to run RLS security tests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>🔒 RLS Security Test Suite</h1>
        <p className='text-gray-600'>
          Comprehensive testing of Row Level Security policies to ensure data isolation and
          security.
        </p>
      </div>

      {/* Test Controls */}
      <div className='bg-white rounded-lg shadow-sm border p-6 mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Test Controls</h2>
            <p className='text-sm text-gray-600'>Current User: {user.email}</p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={clearLogs}
              disabled={isRunning}
              className='px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50'
            >
              Clear Logs
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-6 py-2 rounded-lg font-medium ${
                isRunning
                  ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 inline'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Running Tests...
                </>
              ) : (
                '🚀 Run RLS Security Tests'
              )}
            </button>
          </div>
        </div>

        {/* Test Results Summary */}
        {testResults && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-blue-900'>{testResults.totalTests}</div>
              <div className='text-blue-700'>Total Tests</div>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-green-900'>{testResults.passedTests}</div>
              <div className='text-green-700'>Passed</div>
            </div>
            <div className='bg-red-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-red-900'>{testResults.failedTests}</div>
              <div className='text-red-700'>Failed</div>
            </div>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <div className='text-2xl font-bold text-purple-900'>
                {testResults.successRate.toFixed(1)}%
              </div>
              <div className='text-purple-700'>Success Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* Test Output */}
      <div className='bg-gray-900 rounded-lg p-4 mb-6'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-white font-medium'>Test Output</h3>
          <div className='text-gray-400 text-sm'>{logs.length} lines</div>
        </div>
        <div className='bg-black rounded p-3 min-h-[400px] max-h-[600px] overflow-y-auto'>
          <div className='font-mono text-sm'>
            {logs.length === 0 ? (
              <div className='text-gray-500'>
                Click "Run RLS Security Tests" to start testing...
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.includes('✅')
                      ? 'text-green-400'
                      : log.includes('❌')
                        ? 'text-red-400'
                        : log.includes('⚠️')
                          ? 'text-yellow-400'
                          : log.includes('🧪')
                            ? 'text-blue-400'
                            : log.includes('📊')
                              ? 'text-purple-400'
                              : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security Information */}
      <div className='bg-white rounded-lg shadow-sm border p-6'>
        <h3 className='text-xl font-semibold text-gray-900 mb-4'>🛡️ RLS Security Overview</h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='font-medium text-gray-900 mb-2'>What RLS Tests Cover:</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• Data isolation between users</li>
              <li>• Unauthorized access prevention</li>
              <li>• CRUD operation security</li>
              <li>• Related table JOIN security</li>
              <li>• Real-time subscription filtering</li>
              <li>• Storage bucket access control</li>
            </ul>
          </div>

          <div>
            <h4 className='font-medium text-gray-900 mb-2'>Protected Tables:</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>• clients, invoices, quotes</li>
              <li>• appointments, events</li>
              <li>• expenses, incomes</li>
              <li>• documents, profiles</li>
              <li>• event_invitations, notifications</li>
              <li>• All related child tables</li>
            </ul>
          </div>
        </div>

        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>💡 How RLS Works:</h4>
          <p className='text-sm text-blue-800'>
            Row Level Security (RLS) automatically filters database queries at the PostgreSQL level,
            ensuring users can only access their own data. This eliminates the need for client-side
            user_id filtering and provides defense-in-depth security.
          </p>
        </div>

        <div className='mt-4 p-4 bg-yellow-50 rounded-lg'>
          <h4 className='font-medium text-yellow-900 mb-2'>⚠️ Important Notes:</h4>
          <ul className='text-sm text-yellow-800 space-y-1'>
            <li>• Tests should pass with 100% success rate</li>
            <li>• Any failures indicate potential security vulnerabilities</li>
            <li>• Run tests after any database schema changes</li>
            <li>• Consider running with multiple test users for complete validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RLSSecurityTest;
