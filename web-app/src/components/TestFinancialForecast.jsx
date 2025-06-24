import React from 'react';
import FinancialForecast from '@components/FinancialForecast';

const TestFinancialForecast = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Financial Forecasting</h1>
          <p className="text-gray-600">
            Test page per verificare il funzionamento del componente FinancialForecast
          </p>
        </div>

        <FinancialForecast />
      </div>
    </div>
  );
};

export default TestFinancialForecast;
