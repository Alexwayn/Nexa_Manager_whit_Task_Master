import React from 'react';
import AdvancedFinancialAnalytics from '@components/AdvancedFinancialAnalytics';

const TestAnalytics = () => {
  // Dati di test per il componente
  const testData = {
    revenue: [
      { month: 'Gen', amount: 15000 },
      { month: 'Feb', amount: 18000 },
      { month: 'Mar', amount: 22000 },
      { month: 'Apr', amount: 19000 },
      { month: 'Mag', amount: 25000 },
      { month: 'Giu', amount: 28000 },
    ],
    expenses: [
      { category: 'Marketing', amount: 5000 },
      { category: 'Personale', amount: 12000 },
      { category: 'Affitto', amount: 3000 },
      { category: 'Utenze', amount: 1500 },
      { category: 'Materiali', amount: 2500 },
    ],
    profitMargin: [
      { month: 'Gen', profit: 3000 },
      { month: 'Feb', profit: 4500 },
      { month: 'Mar', profit: 6000 },
      { month: 'Apr', profit: 4000 },
      { month: 'Mag', profit: 7500 },
      { month: 'Giu', profit: 8500 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🧪 Test Advanced Financial Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Questa pagina testa il componente AdvancedFinancialAnalytics con dati di esempio
          </p>
        </div>

        {/* Test Status */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Stato del Test
          </h2>
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-green-700 dark:text-green-400">
              <span className="mr-2">✅</span>
              Componente AdvancedFinancialAnalytics importato
            </div>
            <div className="flex items-center text-green-700 dark:text-green-400">
              <span className="mr-2">✅</span>
              Dati di test preparati
            </div>
            <div className="flex items-center text-green-700 dark:text-green-400">
              <span className="mr-2">✅</span>
              Pagina di test renderizzata
            </div>
          </div>
        </div>

        {/* Component Test Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Componente in Test
          </h2>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div data-testid="advanced-financial-analytics-test">
              <AdvancedFinancialAnalytics data={testData} />
            </div>
          </div>
        </div>

        {/* Test Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📈 Dati di Test
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>• Revenue: {testData.revenue.length} mesi di dati</div>
              <div>• Expenses: {testData.expenses.length} categorie</div>
              <div>• Profit Margin: {testData.profitMargin.length} periodi</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🔍 Cosa Verificare
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>• Grafici si renderizzano correttamente</div>
              <div>• Dati vengono visualizzati</div>
              <div>• Responsive design funziona</div>
              <div>• Dark mode è supportato</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => (window.location.href = '/analytics')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Vai alla pagina Analytics
          </button>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏠 Torna al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestAnalytics;
