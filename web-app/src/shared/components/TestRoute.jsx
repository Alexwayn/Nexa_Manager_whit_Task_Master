import React from 'react';

/**
 * TestRoute Component
 * 
 * A simple test component for development and debugging purposes.
 */
const TestRoute = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test Route
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Component Status
            </h2>
            <p className="text-blue-700">
              ✅ TestRoute component is working correctly
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Routing Status
            </h2>
            <p className="text-green-700">
              ✅ Route configuration is functioning properly
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              Development Info
            </h2>
            <p className="text-yellow-700">
              This is a test component used for development and debugging purposes.
            </p>
          </div>
          
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">
              Environment Details
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Current URL: {window.location.pathname}</li>
              <li>• Timestamp: {new Date().toISOString()}</li>
              <li>• User Agent: {navigator.userAgent.substring(0, 50)}...</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRoute;
