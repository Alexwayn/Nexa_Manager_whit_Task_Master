import React from 'react';
import ExportButtons from '@components/documents/ExportButtons';

const TestExport = () => {
  // Dati di test per le transazioni
  const testTransactions = [
    {
      date: '2024-01-15',
      type: 'income',
      description: 'Fattura cliente ABC',
      category: 'Servizi',
      amount: 1500.0,
      payment_method: 'Bonifico',
      vendor: '',
      tax_deductible: false,
      reference: 'FT001',
      notes: 'Pagamento fattura servizi consulenza',
    },
    {
      date: '2024-01-12',
      type: 'expense',
      description: 'Acquisto materiale ufficio',
      category: 'Materiali',
      amount: 250.5,
      payment_method: 'Carta di credito',
      vendor: 'Cartoleria XYZ',
      tax_deductible: true,
      reference: 'RIC001',
      notes: 'Acquisto cancelleria e materiali vari',
    },
    {
      date: '2024-01-10',
      type: 'income',
      description: 'Vendita prodotto digitale',
      category: 'Vendite Online',
      amount: 899.99,
      payment_method: 'PayPal',
      vendor: '',
      tax_deductible: false,
      reference: 'ON001',
      notes: 'Vendita corso online',
    },
    {
      date: '2024-01-08',
      type: 'expense',
      description: 'Abbonamento software',
      category: 'Software',
      amount: 49.99,
      payment_method: 'Carta di credito',
      vendor: 'Adobe Inc.',
      tax_deductible: true,
      reference: 'SW001',
      notes: 'Abbonamento mensile Creative Suite',
    },
    {
      date: '2024-01-05',
      type: 'expense',
      description: 'Pranzo con cliente',
      category: 'Rappresentanza',
      amount: 85.0,
      payment_method: 'Contanti',
      vendor: 'Ristorante Il Convivio',
      tax_deductible: true,
      reference: 'REPR001',
      notes: 'Pranzo di lavoro con cliente potenziale',
    },
  ];

  // Dati di test per le categorie
  const testCategories = [
    {
      category: 'Servizi',
      type: 'income',
      amount: 1500.0,
      percentage: 62.5,
      count: 1,
      average: 1500.0,
      tax_deductible_amount: 0,
    },
    {
      category: 'Vendite Online',
      type: 'income',
      amount: 899.99,
      percentage: 37.5,
      count: 1,
      average: 899.99,
      tax_deductible_amount: 0,
    },
    {
      category: 'Materiali',
      type: 'expense',
      amount: 250.5,
      percentage: 65.1,
      count: 1,
      average: 250.5,
      tax_deductible_amount: 250.5,
    },
    {
      category: 'Software',
      type: 'expense',
      amount: 49.99,
      percentage: 13.0,
      count: 1,
      average: 49.99,
      tax_deductible_amount: 49.99,
    },
    {
      category: 'Rappresentanza',
      type: 'expense',
      amount: 85.0,
      percentage: 22.1,
      count: 1,
      average: 85.0,
      tax_deductible_amount: 85.0,
    },
  ];

  // Dati di test per i fornitori
  const testVendors = [
    {
      vendor: 'Cartoleria XYZ',
      total_amount: 250.5,
      transaction_count: 1,
      average_amount: 250.5,
      first_transaction: '2024-01-12',
      last_transaction: '2024-01-12',
    },
    {
      vendor: 'Adobe Inc.',
      total_amount: 49.99,
      transaction_count: 1,
      average_amount: 49.99,
      first_transaction: '2024-01-08',
      last_transaction: '2024-01-08',
    },
    {
      vendor: 'Ristorante Il Convivio',
      total_amount: 85.0,
      transaction_count: 1,
      average_amount: 85.0,
      first_transaction: '2024-01-05',
      last_transaction: '2024-01-05',
    },
  ];

  // Dati di test per il report completo
  const testReportData = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    totalIncome: 2399.99,
    totalExpenses: 385.49,
    netProfit: 2014.5,
    profitMargin: 83.9,
    taxDeductibleAmount: 385.49,
    estimatedTaxSavings: 84.81,
    incomeByCategory: [
      { category: 'Servizi', amount: 1500.0, percentage: 62.5 },
      { category: 'Vendite Online', amount: 899.99, percentage: 37.5 },
    ],
    expensesByCategory: [
      { category: 'Materiali', amount: 250.5, percentage: 65.1, tax_deductible_amount: 250.5 },
      { category: 'Rappresentanza', amount: 85.0, percentage: 22.1, tax_deductible_amount: 85.0 },
      { category: 'Software', amount: 49.99, percentage: 13.0, tax_deductible_amount: 49.99 },
    ],
    topVendors: testVendors,
  };

  const dateRange = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Test Funzionalità di Esportazione
          </h1>
          <p className='text-gray-600'>Testa i pulsanti di esportazione per diversi tipi di dati</p>
        </div>

        {/* Test Cards */}
        <div className='space-y-8'>
          {/* Test Esportazione Transazioni */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Esportazione Transazioni</h2>
                <p className='text-gray-600'>Test esportazione lista transazioni in CSV e PDF</p>
              </div>
              <ExportButtons
                data={testTransactions}
                type='transactions'
                filename='test-transazioni'
                period={dateRange}
                className='flex-shrink-0'
              />
            </div>

            {/* Preview dei dati */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-2'>
                Anteprima dati ({testTransactions.length} transazioni):
              </h3>
              <div className='text-sm text-gray-600 space-y-1'>
                {testTransactions.slice(0, 3).map((t, index) => (
                  <div key={index} className='flex justify-between'>
                    <span>
                      {t.date} - {t.description}
                    </span>
                    <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {t.type === 'income' ? '+' : '-'}€{t.amount}
                    </span>
                  </div>
                ))}
                {testTransactions.length > 3 && (
                  <div className='text-gray-500 italic'>
                    ... e altre {testTransactions.length - 3} transazioni
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Test Esportazione Categorie */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Esportazione Analisi Categorie
                </h2>
                <p className='text-gray-600'>Test esportazione dati categorizzati in CSV</p>
              </div>
              <ExportButtons
                data={testCategories}
                type='categories'
                filename='test-categorie'
                className='flex-shrink-0'
              />
            </div>

            {/* Preview dei dati */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-2'>
                Anteprima dati ({testCategories.length} categorie):
              </h3>
              <div className='text-sm text-gray-600 space-y-1'>
                {testCategories.map((cat, index) => (
                  <div key={index} className='flex justify-between'>
                    <span>
                      {cat.category} ({cat.type})
                    </span>
                    <span>
                      €{cat.amount} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Esportazione Fornitori */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Esportazione Fornitori</h2>
                <p className='text-gray-600'>Test esportazione statistiche fornitori in CSV</p>
              </div>
              <ExportButtons
                data={testVendors}
                type='vendors'
                filename='test-fornitori'
                className='flex-shrink-0'
              />
            </div>

            {/* Preview dei dati */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-2'>
                Anteprima dati ({testVendors.length} fornitori):
              </h3>
              <div className='text-sm text-gray-600 space-y-1'>
                {testVendors.map((vendor, index) => (
                  <div key={index} className='flex justify-between'>
                    <span>{vendor.vendor}</span>
                    <span>
                      €{vendor.total_amount} ({vendor.transaction_count} transazioni)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Esportazione Report Completo */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex justify-between items-center mb-4'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Esportazione Report Completo
                </h2>
                <p className='text-gray-600'>
                  Test esportazione report finanziario completo in PDF
                </p>
              </div>
              <ExportButtons
                data={testReportData}
                type='report'
                filename='test-report-completo'
                period={dateRange}
                showReportOptions={true}
                className='flex-shrink-0'
              />
            </div>

            {/* Preview dei dati */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-2'>Anteprima report finanziario:</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Entrate Totali:</span>
                  <div className='font-semibold text-green-600'>€{testReportData.totalIncome}</div>
                </div>
                <div>
                  <span className='text-gray-600'>Spese Totali:</span>
                  <div className='font-semibold text-red-600'>€{testReportData.totalExpenses}</div>
                </div>
                <div>
                  <span className='text-gray-600'>Profitto Netto:</span>
                  <div className='font-semibold text-blue-600'>€{testReportData.netProfit}</div>
                </div>
                <div>
                  <span className='text-gray-600'>Margine:</span>
                  <div className='font-semibold text-purple-600'>
                    {testReportData.profitMargin}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Istruzioni */}
          <div className='bg-blue-50 border border-blue-200 rounded-xl p-6'>
            <h2 className='text-lg font-semibold text-blue-900 mb-3'>📋 Istruzioni per il Test</h2>
            <div className='text-blue-800 space-y-2 text-sm'>
              <p>
                <strong>1. Test CSV:</strong> Clicca sui pulsanti &quot;CSV&quot; per scaricare i
                file in formato CSV. Verifica che i dati siano formattati correttamente.
              </p>
              <p>
                <strong>2. Test PDF:</strong> Clicca sui pulsanti &quot;PDF&quot; per generare i
                documenti PDF. Controlla il layout e la completezza dei dati.
              </p>
              <p>
                <strong>3. Test Report:</strong> Usa il pulsante &quot;Report&quot; per generare un
                report finanziario completo in PDF con grafici e tabelle.
              </p>
              <p>
                <strong>4. Messaggi di stato:</strong> Osserva i messaggi di successo/errore che
                appaiono dopo ogni esportazione.
              </p>
              <p>
                <strong>5. Gestione errori:</strong> I pulsanti dovrebbero essere disabilitati se
                non ci sono dati da esportare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExport;
