import React, { useState, useEffect } from 'react';
import { InvoiceService } from '../services/invoiceService';
import { EnhancedKPICard } from '@features/analytics';
import Logger from '@/utils/Logger';

/**
 * PaymentDashboard - Analytics and overview for invoice payments
 *
 * Features:
 * - Payment analytics and metrics
 * - Overdue invoices tracking
 * - Payment trends visualization
 * - Cash flow overview
 * - Quick actions for payment management
 */
const PaymentDashboard = ({ userId, onInvoiceSelect }) => {
  const [analytics, setAnalytics] = useState(null);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  // Load dashboard data
  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId, selectedPeriod, loadDashboardData]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      const [analyticsData, overdueData] = await Promise.all([
        InvoiceService.getInvoiceAnalytics(userId, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        InvoiceService.getOverdueInvoices(userId),
      ]);

      setAnalytics(analyticsData);
      setOverdueInvoices(overdueData);
    } catch (error) {
      Logger.error('Error loading dashboard data:', error);
      setError(error.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getDaysOverdue = dueDate => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = status => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      sent: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = status => {
    const labels = {
      draft: 'Bozza',
      issued: 'Emessa',
      sent: 'Inviata',
      paid: 'Pagata',
      partially_paid: 'Parzialmente Pagata',
      overdue: 'Scaduta',
      cancelled: 'Annullata',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='ml-2 text-gray-600'>Caricamento dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-md p-4'>
        <div className='text-red-800'>{error}</div>
        <button
          onClick={loadDashboardData}
          className='mt-2 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200'
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Period Selector */}
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold text-gray-900'>Dashboard Pagamenti</h2>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-gray-600'>Periodo:</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='7'>Ultimi 7 giorni</option>
            <option value='30'>Ultimi 30 giorni</option>
            <option value='90'>Ultimi 90 giorni</option>
            <option value='365'>Ultimo anno</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards - Enhanced with EnhancedKPICard */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <EnhancedKPICard
          title='Fatture Totali'
          subtitle='Periodo selezionato'
          value={analytics?.totalInvoices || 0}
          icon='📄'
          format='number'
          color='blue'
          trend={analytics?.invoiceTrend}
        />

        <EnhancedKPICard
          title='Importo Totale'
          subtitle='Valore complessivo'
          value={analytics?.totalAmount || 0}
          icon='💰'
          format='currency'
          color='green'
          trend={analytics?.amountTrend}
        />

        <EnhancedKPICard
          title='Incassato'
          subtitle={`${analytics?.paymentRate ? `${analytics.paymentRate.toFixed(1)}%` : '0%'} del totale`}
          value={analytics?.totalPaid || 0}
          icon='✅'
          format='currency'
          color='green'
          trend={analytics?.paidTrend}
        />

        <EnhancedKPICard
          title='In Sospeso'
          subtitle='Da incassare'
          value={(analytics?.totalAmount || 0) - (analytics?.totalPaid || 0)}
          icon='⏳'
          format='currency'
          color='red'
          trend={analytics?.outstandingTrend}
        />
      </div>

      {/* Status Breakdown */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Stato Fatture</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {analytics?.statusBreakdown &&
            Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className='text-center'>
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                >
                  {getStatusLabel(status)}
                </div>
                <div className='mt-2 text-2xl font-semibold text-gray-900'>{count}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <div className='bg-white rounded-lg shadow'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Fatture Scadute ({overdueInvoices.length})
            </h3>
          </div>
          <div className='divide-y divide-gray-200'>
            {overdueInvoices.slice(0, 5).map(invoice => (
              <div
                key={invoice.id}
                className='p-6 hover:bg-gray-50 cursor-pointer'
                onClick={() => onInvoiceSelect?.(invoice)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3'>
                      <div className='font-medium text-gray-900'>{invoice.invoice_number}</div>
                      <div className='text-sm text-gray-600'>{invoice.clients?.name}</div>
                      <div className='bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'>
                        {getDaysOverdue(invoice.due_date)} giorni di ritardo
                      </div>
                    </div>
                    <div className='mt-1 text-sm text-gray-500'>
                      Scadenza: {formatDate(invoice.due_date)}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-semibold text-gray-900'>
                      {formatCurrency(invoice.balance || invoice.total_amount)}
                    </div>
                    <div className='text-sm text-gray-500'>da incassare</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {overdueInvoices.length > 5 && (
            <div className='px-6 py-3 border-t border-gray-200 text-center'>
              <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                Visualizza tutte le fatture scadute ({overdueInvoices.length - 5} altre)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monthly Breakdown */}
      {analytics?.monthlyBreakdown && Object.keys(analytics.monthlyBreakdown).length > 0 && (
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>Andamento Mensile</h3>
          <div className='space-y-3'>
            {Object.entries(analytics.monthlyBreakdown)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, data]) => (
                <div key={month} className='flex items-center justify-between py-2'>
                  <div className='font-medium text-gray-900'>
                    {new Date(month + '-01').toLocaleDateString('it-IT', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </div>
                  <div className='flex items-center gap-6 text-sm'>
                    <div className='text-center'>
                      <div className='text-gray-600'>Fatture</div>
                      <div className='font-semibold'>{data.count}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-gray-600'>Fatturato</div>
                      <div className='font-semibold'>{formatCurrency(data.amount)}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-gray-600'>Incassato</div>
                      <div className='font-semibold text-green-600'>
                        {formatCurrency(data.paid)}
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-gray-600'>%</div>
                      <div className='font-semibold'>
                        {data.amount > 0 ? ((data.paid / data.amount) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Azioni Rapide</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button className='flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg py-3 px-4 hover:bg-blue-100 transition-colors'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
            Nuova Fattura
          </button>

          <button
            onClick={loadDashboardData}
            className='flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg py-3 px-4 hover:bg-green-100 transition-colors'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Aggiorna Dati
          </button>

          <button className='flex items-center justify-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg py-3 px-4 hover:bg-purple-100 transition-colors'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              />
            </svg>
            Report Dettagliato
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
