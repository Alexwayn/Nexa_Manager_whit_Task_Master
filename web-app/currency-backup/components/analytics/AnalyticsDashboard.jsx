import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyEuroIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ScaleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  ViewColumnsIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
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
import financialService from '@lib/financialService';
import AdvancedTimePeriodSelector from '@components/analytics/AdvancedTimePeriodSelector';
import DashboardLayoutManager from '@components/dashboard/DashboardLayoutManager';
import Logger from '@utils/Logger';
import EnhancedKPICard from '@components/analytics/EnhancedKPICard';

// Register Chart.js components
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

const AnalyticsDashboard = () => {
  const { t, ready } = useTranslation('analytics');
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [categoryFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Data states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [setKpiData] = useState(null);
  const [healthData, setHealthData] = useState(null);

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const refreshIntervalRef = useRef(null);

  // Safe translation function that handles loading state and interpolation
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // MOVE FUNCTION DECLARATION BEFORE useEffect THAT USES IT
  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, trends, kpis, health] = await Promise.all([
        financialService.getFinancialOverview(dateRange.start, dateRange.end),
        financialService.getFinancialTrend(selectedPeriod),
        financialService.calculateKPIs({}), // Placeholder
        financialService.getFinancialHealth(),
      ]);

      if (overview.success) setAnalyticsData(overview.data);
      if (trends.success) setTrendData(trends.data);
      if (kpis.success) setKpiData(kpis.data);
      if (health.success) setHealthData(health.data);
    } catch (err) {
      Logger.error('Error loading analytics dashboard data:', err);
      setError(safeT('common.error', {}, 'Error loading data'));
    } finally {
      setLoading(false);
    }
  };

  // NOW useEffect hooks can safely reference loadAnalyticsData
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, dateRange, categoryFilter]);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadAnalyticsData();
      }, 30000);
    } else {
      clearInterval(refreshIntervalRef.current);
    }
    return () => clearInterval(refreshIntervalRef.current);
  }, [autoRefresh]); // Remove loadAnalyticsData from dependency array to avoid infinite loops

  // Show loading state if translations are not ready
  if (!ready) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const getChartOptions = title => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, font: { size: 16 } },
    },
  });

  const renderKPIs = () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {safeT('totalIncome', {}, 'Total Income')}
            </p>
            <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
              {analyticsData?.totalIncome ? `€€${analyticsData.totalIncome.toLocaleString()}` : '€0'}
            </p>
            <div className='flex items-center mt-2'>
              <ArrowTrendingUpIcon className='w-4 h-4 text-green-500 mr-1' />
              <span className='text-sm font-medium text-green-600'>
                {analyticsData?.incomeGrowth || '+0%'}
              </span>
            </div>
          </div>
          <div className='p-3 bg-green-100 dark:bg-green-900/20 rounded-xl'>
            <BanknotesIcon className='w-6 h-6 text-green-600 dark:text-green-400' />
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {safeT('totalExpenses', {}, 'Total Expenses')}
            </p>
            <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
              {analyticsData?.totalExpenses
                ? `€€${analyticsData.totalExpenses.toLocaleString()}`
                : '€0'}
            </p>
            <div className='flex items-center mt-2'>
              <ArrowTrendingDownIcon className='w-4 h-4 text-red-500 mr-1' />
              <span className='text-sm font-medium text-red-600'>
                {analyticsData?.expenseGrowth || '+0%'}
              </span>
            </div>
          </div>
          <div className='p-3 bg-red-100 dark:bg-red-900/20 rounded-xl'>
            <CurrencyEuroIcon className='w-6 h-6 text-red-600 dark:text-red-400' />
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {safeT('netProfit', {}, 'Net Profit')}
            </p>
            <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
              {analyticsData?.netProfit ? `€€${analyticsData.netProfit.toLocaleString()}` : '€0'}
            </p>
            <div className='flex items-center mt-2'>
              <ArrowTrendingUpIcon className='w-4 h-4 text-blue-500 mr-1' />
              <span className='text-sm font-medium text-blue-600'>+12.5%</span>
            </div>
          </div>
          <div className='p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl'>
            <ArrowTrendingUpIcon className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {safeT('profitMargin', {}, 'Profit Margin')}
            </p>
            <p className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
              {analyticsData?.profitMargin ? `${analyticsData.profitMargin}%` : '0%'}
            </p>
            <div className='flex items-center mt-2'>
              <ArrowTrendingUpIcon className='w-4 h-4 text-purple-500 mr-1' />
              <span className='text-sm font-medium text-purple-600'>+2.1%</span>
            </div>
          </div>
          <div className='p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl'>
            <ScaleIcon className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            {safeT('incomeExpensesTrend', {}, 'Income vs Expenses Trend')}
          </h3>
          <div className='flex items-center space-x-2'>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>Income</span>
            </div>
            <div className='flex items-center'>
              <div className='w-3 h-3 bg-red-500 rounded-full mr-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>Expenses</span>
            </div>
          </div>
        </div>
        <div className='h-80'>
          <Line
            data={{
              labels: trendData?.monthlyData.map(d => d.month) || [],
              datasets: [
                {
                  label: safeT('income', {}, 'Income'),
                  data: trendData?.monthlyData.map(d => d.income),
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  fill: true,
                },
                {
                  label: safeT('expenses', {}, 'Expenses'),
                  data: trendData?.monthlyData.map(d => d.expenses),
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false,
                  },
                  border: {
                    display: false,
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                  },
                  border: {
                    display: false,
                  },
                  ticks: {
                    callback: function (value) {
                      return '€' + value.toLocaleString();
                    },
                  },
                },
              },
              elements: {
                line: {
                  tension: 0.4,
                },
                point: {
                  radius: 6,
                  hoverRadius: 8,
                },
              },
            }}
          />
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            {safeT('categoryDistribution', {}, 'Expense Categories')}
          </h3>
          <button className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
            View Details
          </button>
        </div>
        <div className='h-80'>
          <Doughnut
            data={{
              labels: analyticsData?.categoryDistribution.map(d => d.category) || [
                'Office Supplies',
                'Travel',
                'Marketing',
                'Equipment',
                'Other',
              ],
              datasets: [
                {
                  data: analyticsData?.categoryDistribution.map(d => d.amount) || [
                    30, 25, 20, 15, 10,
                  ],
                  backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'],
                  borderWidth: 0,
                  cutout: '70%',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                      size: 12,
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderHealth = () => (
    <div className='bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-8'>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
          {safeT('financialHealth', {}, 'Financial Health Overview')}
        </h3>
        <div className='flex items-center space-x-2'>
          <div className='w-3 h-3 bg-green-500 rounded-full'></div>
          <span className='text-sm text-gray-600 dark:text-gray-400'>Healthy</span>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 text-center'>
          <div className='w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-white font-bold text-lg'>{healthData?.overallScore || 85}</span>
          </div>
          <div className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            Overall Score
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>Excellent performance</div>
        </div>

        <div className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 text-center'>
          <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ShieldCheckIcon className='w-6 h-6 text-white' />
          </div>
          <div className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            {healthData?.liquidity || 'Good'}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            {safeT('liquidity', {}, 'Liquidity Status')}
          </div>
        </div>

        <div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 text-center'>
          <div className='w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ArrowTrendingUpIcon className='w-6 h-6 text-white' />
          </div>
          <div className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            {healthData?.profitability || 'Excellent'}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            {safeT('profitability', {}, 'Profitability')}
          </div>
        </div>

        <div className='bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 text-center'>
          <div className='w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ChartBarIcon className='w-6 h-6 text-white' />
          </div>
          <div className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            {healthData?.growth || 'Stable'}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            {safeT('growth', {}, 'Growth Trend')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
            <div className='mb-6 lg:mb-0'>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                {safeT('analyticsOverview', {}, 'Analytics Dashboard')}
              </h1>
              <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
                {safeT(
                  'trackFinancialPerformance',
                  {},
                  'Monitor your business performance and financial insights',
                )}
              </p>
              <div className='flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400'>
                <ClockIcon className='w-4 h-4 mr-2' />
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <AdvancedTimePeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className='inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {safeT('refresh', {}, 'Refresh')}
              </button>
              <label className='inline-flex items-center'>
                <input
                  type='checkbox'
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                  className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                />
                <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                  {safeT('autoRefresh', {}, 'Auto-refresh')}
                </span>
              </label>
              <button
                onClick={() => setLayoutEditMode(!layoutEditMode)}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-xl shadow-sm transition-colors duration-200 ${
                  layoutEditMode
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Cog6ToothIcon className='h-4 w-4 mr-2' />
                {layoutEditMode
                  ? safeT('exitEdit', {}, 'Exit Edit')
                  : safeT('editLayout', {}, 'Edit Layout')}
              </button>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-xl shadow-sm transition-colors duration-200 ${
                  compareMode
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <EyeIcon className='h-4 w-4 mr-2' />
                {compareMode
                  ? safeT('exitCompare', {}, 'Exit Compare')
                  : safeT('compare', {}, 'Compare')}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-gray-600 dark:text-gray-400'>
              {safeT('common.loading', {}, 'Loading analytics data...')}
            </span>
          </div>
        )}

        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl mb-8'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium'>Error loading analytics data</h3>
                <p className='mt-1 text-sm'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <DashboardLayoutManager
            editMode={layoutEditMode}
            compareMode={compareMode}
            onLayoutChange={newLayout => {
              Logger.info('Layout changed:', newLayout);
            }}
          >
            {renderKPIs()}
            {renderCharts()}
            {renderHealth()}
          </DashboardLayoutManager>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
