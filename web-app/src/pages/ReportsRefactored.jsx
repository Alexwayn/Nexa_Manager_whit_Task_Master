import React, { useState, useEffect } from 'react';
import {
  DocumentChartBarIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';

// Extracted components
import { useAuth, useUser } from '@clerk/clerk-react';

import ReportHeader from '@components/reports/ReportHeader';
import ReportLoadingSpinner from '@components/reports/ReportLoadingSpinner';
import ReportErrorBoundary from '@components/reports/ReportErrorBoundary';
import DateRangeFilter from '@components/reports/DateRangeFilter';
import TabNavigation from '@components/reports/TabNavigation';
import ChartContainer from '@components/reports/charts/ChartContainer';
import LineChart from '@components/reports/charts/LineChart';
import BarChart from '@components/reports/charts/BarChart';
import DoughnutChart from '@components/reports/charts/DoughnutChart';
import FinancialOverview from '@components/reports/FinancialOverview';

// Extracted hooks
import useDateRange from '@hooks/useDateRange';
import useReportData from '@hooks/useReportData';
import useChartData from '@hooks/useChartData';

// Services
import invoiceAnalyticsService from '@/lib/invoiceAnalyticsService';
import reportingService from '@/lib/reportingService';
import incomeService from '@/lib/incomeService';
import expenseService from '@/lib/expenseService';
import financialService from '@/lib/financialService';
import Logger from '@/utils/Logger';

// Chart.js registration (same as original)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ReportsRefactored() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('financials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Use extracted date range hook
  const {
    dateRange,
    updateDateRange,
    setPreset,
    formattedRange,
    isValid: isDateRangeValid,
  } = useDateRange();

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');

    if (
      tabParam &&
      ['financials', 'invoices', 'quotes', 'clients', 'analytics', 'clientsAdvanced'].includes(
        tabParam,
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const handleExportReport = async (reportType, format = 'pdf') => {
    try {
      setLoading(true);
      let result;

      switch (reportType) {
        case 'revenue':
          result = await reportingService.generateRevenueReport(
            dateRange.startDate,
            dateRange.endDate,
            format,
          );
          break;
        case 'client':
          result = await reportingService.generateClientReport(
            dateRange.startDate,
            dateRange.endDate,
            format,
          );
          break;
        case 'tax':
          result = await reportingService.generateTaxReport(
            dateRange.startDate,
            dateRange.endDate,
            format,
          );
          break;
        case 'aging':
          result = await reportingService.generateAgingReport(format);
          break;
        case 'invoice':
          result = await reportingService.generateInvoiceReport(
            dateRange.startDate,
            dateRange.endDate,
            format,
          );
          break;
        default:
          throw new Error(`Report type ${reportType} not supported`);
      }

      if (result.success && result.blob) {
        const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;
        reportingService.downloadFile(result.blob, filename);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      Logger.error('Export error:', err);
      setError(`Errore nell'esportazione: ${String(err?.message || err || 'Unknown error')}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatNumber = number => {
    return new Intl.NumberFormat('it-IT').format(number || 0);
  };

  const formatPercentage = value => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const categories = [
    {
      id: 'income-expenses',
      name: 'Entrate e Spese',
      icon: ReceiptPercentIcon,
      description: 'Visualizza report e grafici sulle entrate e le spese del tuo business',
    },
    {
      id: 'invoices',
      name: 'Fatture',
      icon: CurrencyDollarIcon,
      description: 'Analizza le fatture emesse e i pagamenti ricevuti',
    },
    {
      id: 'quotes',
      name: 'Preventivi',
      icon: DocumentTextIcon,
      description: 'Monitora i preventivi emessi, accettati e rifiutati',
    },
    {
      id: 'clients',
      name: 'Clienti',
      icon: UserGroupIcon,
      description: 'Visualizza statistiche e analisi sui tuoi clienti',
    },
    {
      id: 'analytics',
      name: 'Analisi Avanzate',
      icon: ChartBarIcon,
      description: 'Approfondisci con analisi dettagliate e previsioni',
    },
  ];

  const reportTabs = [
    { id: 'financials', name: 'Entrate e Spese', icon: ReceiptPercentIcon },
    { id: 'invoices', name: 'Fatture', icon: CurrencyDollarIcon },
    { id: 'quotes', name: 'Preventivi', icon: DocumentTextIcon },
    { id: 'clients', name: 'Clienti', icon: UserGroupIcon },
    { id: 'analytics', name: 'Analisi Avanzate', icon: ChartBarIcon },
  ];

  const exportData = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    period: formattedRange,
    activeTab,
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <ReportHeader
          title='Dashboard Report Completo'
          subtitle={`Analisi dettagliata ${formattedRange.display}`}
          dateRange={dateRange}
          exportData={exportData}
          exportType='dashboard'
          showExport={true}
        />

        {/* Date Range Filter */}
        <div className='mt-6'>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={updateDateRange}
            presets={true}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className='mt-6'>
            <ReportErrorBoundary
              error={error}
              onRetry={() => setError(null)}
              title='Errore nei Report'
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className='mt-6'>
          <TabNavigation tabs={reportTabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Report Content */}
        <div className='mt-6 min-h-96'>
          {activeTab === 'financials' && (
            <FinancialsReportRefactored
              dateRange={dateRange}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              formatPercentage={formatPercentage}
            />
          )}
          {activeTab === 'invoices' && (
            <InvoicesReportRefactored
              dateRange={dateRange}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              formatPercentage={formatPercentage}
            />
          )}
          {activeTab === 'quotes' && (
            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                Report Preventivi
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                Sezione in sviluppo - Component refactoring coming soon...
              </p>
            </div>
          )}
          {activeTab === 'clients' && (
            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                Report Clienti
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                Sezione in sviluppo - Component refactoring coming soon...
              </p>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                Analisi Avanzate
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                Sezione in sviluppo - Component refactoring coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Refactored Financial Report Component
function FinancialsReportRefactored({ dateRange, formatCurrency, formatNumber, formatPercentage }) {
  // Use the generic report data hook for financial data
  const { data, loading, error, refetch } = useReportData(async () => {
    const [
      incomeData,
      expenseData,
      financialOverview,
      incomeCategories,
      expenseCategories,
      vendorStats,
      incomeStats,
      expenseStats,
    ] = await Promise.all([
      incomeService.getIncomes({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
      expenseService.getExpenses({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
      financialService.getFinancialOverview(dateRange.startDate, dateRange.endDate),
      incomeService.getIncomeCategories(),
      expenseService.getExpenseCategories(),
      expenseService.getVendorStats(dateRange.startDate, dateRange.endDate),
      incomeService.getIncomeStats(dateRange.startDate, dateRange.endDate),
      expenseService.getExpenseStats(dateRange.startDate, dateRange.endDate),
    ]);

    if (incomeData.success && expenseData.success && financialOverview.success) {
      return {
        success: true,
        data: {
          incomes: incomeData.data,
          expenses: expenseData.data,
          overview: financialOverview.data,
          incomeCategories: incomeCategories.success ? incomeCategories.data : [],
          expenseCategories: expenseCategories.success ? expenseCategories.data : [],
          vendorStats: vendorStats.success ? vendorStats.data : [],
          incomeStats: incomeStats.success ? incomeStats.data : {},
          expenseStats: expenseStats.success ? expenseStats.data : {},
        },
      };
    } else {
      throw new Error('Failed to load financial data');
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Transform data for charts using the chart data hook
  const { chartData: incomeChartData } = useChartData(data?.incomeCategories || [], 'doughnut', {
    formatCurrency,
    labelKey: 'name',
    valueKey: 'total',
    label: 'Entrate per Categoria',
  });

  const { chartData: expenseChartData } = useChartData(data?.expenseCategories || [], 'bar', {
    formatCurrency,
    labelKey: 'name',
    valueKey: 'total',
    label: 'Spese per Categoria',
  });

  if (loading) {
    return <ReportLoadingSpinner message='Caricamento dati finanziari...' />;
  }

  if (error) {
    return (
      <ReportErrorBoundary
        error={error}
        onRetry={refetch}
        title='Errore nel caricamento dei dati finanziari'
      />
    );
  }

  return (
    <div className='space-y-6'>
      {/* Financial Overview with extracted component */}
      <FinancialOverview
        data={data}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatPercentage={formatPercentage}
      />

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <ChartContainer title='Distribuzione Entrate per Categoria' loading={false} error={null}>
          <DoughnutChart data={incomeChartData} formatCurrency={formatCurrency} showLegend={true} />
        </ChartContainer>

        <ChartContainer title='Spese per Categoria' loading={false} error={null}>
          <BarChart
            data={expenseChartData}
            formatCurrency={formatCurrency}
            orientation='vertical'
          />
        </ChartContainer>
      </div>
    </div>
  );
}

// Refactored Invoice Report Component
function InvoicesReportRefactored({ dateRange, formatCurrency, formatNumber, formatPercentage }) {
  const { data, loading, error, refetch } = useReportData(async () => {
    const [revenueResult, performanceResult, agingResult] = await Promise.all([
      invoiceAnalyticsService.getRevenueAnalytics(
        dateRange.startDate,
        dateRange.endDate,
        'monthly',
      ),
      invoiceAnalyticsService.getInvoicePerformance(dateRange.startDate, dateRange.endDate),
      invoiceAnalyticsService.getAgingReport(),
    ]);

    if (revenueResult.success && performanceResult.success && agingResult.success) {
      return {
        success: true,
        data: {
          revenue: revenueResult.data,
          performance: performanceResult.data,
          aging: agingResult.data,
        },
      };
    } else {
      throw new Error('Failed to load invoices data');
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Transform revenue data for line chart
  const revenueData = data?.revenue?.revenueByPeriod || {};
  const periods = Object.keys(revenueData).sort();
  const revenues = periods.map(period => revenueData[period]?.totalRevenue || 0);

  const { chartData: revenueChartData } = useChartData(
    periods.map((period, index) => ({ label: period, value: revenues[index] })),
    'line',
    {
      formatCurrency,
      label: 'Fatturato Mensile (€)',
    },
  );

  if (loading) {
    return <ReportLoadingSpinner message='Caricamento dati fatture...' />;
  }

  if (error) {
    return (
      <ReportErrorBoundary
        error={error}
        onRetry={refetch}
        title='Errore nel caricamento dei dati fatture'
      />
    );
  }

  const statusDistribution = data?.performance?.statusDistribution || {};
  const totalInvoices = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0);
  const paidCount = statusDistribution.paid || 0;
  const sentCount = statusDistribution.sent || 0;
  const overdueCount = statusDistribution.overdue || 0;
  const paidPercentage = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0;

  return (
    <div className='space-y-6'>
      {/* Invoice Status Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800'>
          <h3 className='text-sm font-medium text-blue-800 dark:text-blue-200'>Fatture Emesse</h3>
          <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {formatNumber(totalInvoices)}
          </p>
          <p className='text-xs text-blue-700 dark:text-blue-300'>Nel periodo selezionato</p>
        </div>

        <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800'>
          <h3 className='text-sm font-medium text-green-800 dark:text-green-200'>Fatture Pagate</h3>
          <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {formatNumber(paidCount)}
          </p>
          <p className='text-xs text-green-700 dark:text-green-300'>
            {formatPercentage(paidPercentage)} del totale
          </p>
        </div>

        <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800'>
          <h3 className='text-sm font-medium text-amber-800 dark:text-amber-200'>
            Fatture In Attesa
          </h3>
          <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
            {formatNumber(sentCount)}
          </p>
          <p className='text-xs text-amber-700 dark:text-amber-300'>In attesa di pagamento</p>
        </div>

        <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800'>
          <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>Fatture Scadute</h3>
          <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
            {formatNumber(overdueCount)}
          </p>
          <p className='text-xs text-red-700 dark:text-red-300'>Da recuperare</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <ChartContainer title='Fatturato Mensile' loading={false} error={null}>
        <LineChart data={revenueChartData} formatCurrency={formatCurrency} />
      </ChartContainer>
    </div>
  );
}
