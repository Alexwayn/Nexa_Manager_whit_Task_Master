import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  BarChart3,
  LineChart,
  RefreshCw,
  Settings,
  Download,
  Filter,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { invoiceAnalyticsService } from '../../services/invoiceAnalyticsService';
import { Logger } from '../../utils/logger';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const FinancialForecast = ({ className = '', dateRange }) => {
  const { t } = useTranslation(['analytics', 'common']);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState({
    revenue: {
      historical: [],
      forecast: [],
      confidence: 0,
      trends: {},
    },
    expenses: {
      historical: [],
      forecast: [],
      categories: {},
    },
    cashFlow: {
      historical: [],
      forecast: [],
      projections: {},
    },
    scenarios: {
      optimistic: {},
      realistic: {},
      pessimistic: {},
    },
    kpis: {
      growthRate: 0,
      burnRate: 0,
      runway: 0,
      breakEven: null,
    },
  });

  const [activeTab, setActiveTab] = useState('revenue'); // revenue, expenses, cashflow, scenarios
  const [forecastPeriod, setForecastPeriod] = useState(12); // months
  const [confidenceLevel, setConfidenceLevel] = useState(80); // percentage
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load forecast data
  const loadForecastData = useCallback(async () => {
    if (!isSignedIn || !user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDate =
        dateRange?.start?.toISOString?.()?.split('T')[0] ||
        new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      const endDate =
        dateRange?.end?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0];

      // Get historical analytics data
      const analyticsResult = await invoiceAnalyticsService.getAnalytics(startDate, endDate);

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.error);
      }

      const analytics = analyticsResult.data;

      // Generate forecast data based on historical patterns
      const forecast = generateForecastData(analytics, forecastPeriod, confidenceLevel);

      setForecastData(forecast);
      setLastUpdated(new Date());
    } catch (err) {
      Logger.error('Error loading forecast data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, isSignedIn, user?.id, forecastPeriod, confidenceLevel]);

  useEffect(() => {
    loadForecastData();
  }, [loadForecastData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadForecastData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadForecastData]);

  // Generate forecast data from historical analytics
  const generateForecastData = (analytics, months, confidence) => {
    const now = new Date();
    const monthlyData = generateMonthlyHistoricalData(analytics);

    // Calculate growth trends
    const revenueGrowth = calculateGrowthRate(monthlyData.revenue);
    const expenseGrowth = calculateGrowthRate(monthlyData.expenses);

    // Generate forecasts
    const revenueForecast = generateRevenueForecast(monthlyData.revenue, revenueGrowth, months);
    const expenseForecast = generateExpenseForecast(monthlyData.expenses, expenseGrowth, months);
    const cashFlowForecast = generateCashFlowForecast(revenueForecast, expenseForecast);

    // Generate scenarios
    const scenarios = generateScenarios(revenueForecast, expenseForecast, revenueGrowth);

    // Calculate KPIs
    const kpis = calculateForecastKPIs(revenueForecast, expenseForecast, monthlyData);

    return {
      revenue: {
        historical: monthlyData.revenue,
        forecast: revenueForecast,
        confidence: confidence,
        trends: {
          growthRate: revenueGrowth,
          seasonality: calculateSeasonality(monthlyData.revenue),
          volatility: calculateVolatility(monthlyData.revenue),
        },
      },
      expenses: {
        historical: monthlyData.expenses,
        forecast: expenseForecast,
        categories: analytics.expenseCategories || {},
      },
      cashFlow: {
        historical: monthlyData.cashFlow,
        forecast: cashFlowForecast,
        projections: {
          cumulative: calculateCumulativeCashFlow(cashFlowForecast),
          breakEven: findBreakEvenPoint(cashFlowForecast),
        },
      },
      scenarios,
      kpis,
    };
  };

  // Helper functions for forecast calculations
  const generateMonthlyHistoricalData = analytics => {
    const months = [];
    const revenue = [];
    const expenses = [];
    const cashFlow = [];

    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);

      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

      // Mock historical data based on analytics
      const baseRevenue = (analytics.totalRevenue || 50000) / 12;
      const monthRevenue = baseRevenue * (0.8 + Math.random() * 0.4); // ±20% variation
      const monthExpenses = monthRevenue * (0.6 + Math.random() * 0.2); // 60-80% of revenue

      revenue.push(monthRevenue);
      expenses.push(monthExpenses);
      cashFlow.push(monthRevenue - monthExpenses);
    }

    return { months, revenue, expenses, cashFlow };
  };

  const calculateGrowthRate = data => {
    if (data.length < 2) return 0;

    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

    return older > 0 ? ((recent - older) / older) * 100 : 0;
  };

  const generateRevenueForecast = (historical, growthRate, months) => {
    const forecast = [];
    const lastValue = historical[historical.length - 1] || 0;
    const monthlyGrowth = growthRate / 100 / 12; // Convert annual to monthly

    for (let i = 1; i <= months; i++) {
      const projected = lastValue * Math.pow(1 + monthlyGrowth, i);
      const seasonality = 1 + 0.1 * Math.sin((i * Math.PI) / 6); // Seasonal variation
      forecast.push(projected * seasonality);
    }

    return forecast;
  };

  const generateExpenseForecast = (historical, growthRate, months) => {
    const forecast = [];
    const lastValue = historical[historical.length - 1] || 0;
    const monthlyGrowth = (growthRate * 0.8) / 100 / 12; // Expenses grow slower

    for (let i = 1; i <= months; i++) {
      const projected = lastValue * Math.pow(1 + monthlyGrowth, i);
      forecast.push(projected);
    }

    return forecast;
  };

  const generateCashFlowForecast = (revenue, expenses) => {
    return revenue.map((rev, index) => rev - (expenses[index] || 0));
  };

  const generateScenarios = (revenueForecast, expenseForecast, baseGrowth) => {
    const optimisticRevenue = revenueForecast.map(val => val * 1.2);
    const pessimisticRevenue = revenueForecast.map(val => val * 0.8);

    return {
      optimistic: {
        revenue: optimisticRevenue,
        expenses: expenseForecast,
        cashFlow: generateCashFlowForecast(optimisticRevenue, expenseForecast),
        probability: 25,
      },
      realistic: {
        revenue: revenueForecast,
        expenses: expenseForecast,
        cashFlow: generateCashFlowForecast(revenueForecast, expenseForecast),
        probability: 50,
      },
      pessimistic: {
        revenue: pessimisticRevenue,
        expenses: expenseForecast,
        cashFlow: generateCashFlowForecast(pessimisticRevenue, expenseForecast),
        probability: 25,
      },
    };
  };

  const calculateForecastKPIs = (revenue, expenses, historical) => {
    const avgRevenue = revenue.reduce((a, b) => a + b, 0) / revenue.length;
    const avgExpenses = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const avgCashFlow = avgRevenue - avgExpenses;

    const currentCash = 100000; // Mock current cash position
    const runway = avgCashFlow > 0 ? Infinity : Math.abs(currentCash / avgCashFlow);

    return {
      growthRate: calculateGrowthRate(historical.revenue),
      burnRate: avgExpenses,
      runway: runway === Infinity ? null : runway,
      breakEven: findBreakEvenPoint(generateCashFlowForecast(revenue, expenses)),
    };
  };

  const calculateSeasonality = data => {
    // Simple seasonality calculation
    const quarters = [0, 0, 0, 0];
    data.forEach((value, index) => {
      quarters[index % 4] += value;
    });
    const avg = quarters.reduce((a, b) => a + b, 0) / 4;
    return quarters.map(q => ((q - avg) / avg) * 100);
  };

  const calculateVolatility = data => {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return (Math.sqrt(variance) / mean) * 100;
  };

  const calculateCumulativeCashFlow = cashFlow => {
    let cumulative = 0;
    return cashFlow.map(cf => (cumulative += cf));
  };

  const findBreakEvenPoint = cashFlow => {
    for (let i = 0; i < cashFlow.length; i++) {
      if (cashFlow[i] > 0) return i + 1;
    }
    return null;
  };

  // Utility functions
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = value => {
    return `${value.toFixed(1)}%`;
  };

  // Chart configurations
  const getRevenueChartData = () => {
    const labels = [...Array(12)]
      .map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11 + i);
        return date.toLocaleDateString('en-US', { month: 'short' });
      })
      .concat(
        [...Array(forecastPeriod)].map((_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1 + i);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }),
      );

    return {
      labels,
      datasets: [
        {
          label: t('analytics:forecast.historicalRevenue'),
          data: [...forecastData.revenue.historical, ...Array(forecastPeriod).fill(null)],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: t('analytics:forecast.forecastRevenue'),
          data: [...Array(12).fill(null), ...forecastData.revenue.forecast],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getScenarioChartData = () => {
    const labels = [...Array(forecastPeriod)].map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1 + i);
      return date.toLocaleDateString('en-US', { month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: t('analytics:forecast.optimistic'),
          data: forecastData.scenarios.optimistic.revenue || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
        },
        {
          label: t('analytics:forecast.realistic'),
          data: forecastData.scenarios.realistic.revenue || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
        },
        {
          label: t('analytics:forecast.pessimistic'),
          data: forecastData.scenarios.pessimistic.revenue || [],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: context => {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => formatCurrency(value),
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className='flex items-center space-x-3'>
          <RefreshCw className='w-6 h-6 animate-spin text-blue-500' />
          <span className='text-gray-600 dark:text-gray-400'>
            {t('analytics:forecast.loadingForecast')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${className} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6`}
      >
        <div className='flex items-center space-x-3'>
          <AlertTriangle className='w-6 h-6 text-red-600' />
          <div>
            <h3 className='text-red-800 dark:text-red-400 font-medium'>
              {t('analytics:forecast.errorLoadingForecast')}
            </h3>
            <p className='text-red-600 dark:text-red-300 text-sm mt-1'>{error}</p>
          </div>
        </div>
        <button
          onClick={loadForecastData}
          className='mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
        >
          {t('common:retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Controls */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              {t('analytics:forecast.financialForecast')}
            </h2>
            {lastUpdated && (
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                {t('analytics:common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className='flex items-center space-x-4'>
            {/* Forecast Period Selector */}
            <div className='flex items-center space-x-2'>
              <Calendar className='w-4 h-4 text-gray-500' />
              <select
                value={forecastPeriod}
                onChange={e => setForecastPeriod(Number(e.target.value))}
                className='text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1'
              >
                <option value={6}>6 {t('analytics:forecast.months')}</option>
                <option value={12}>12 {t('analytics:forecast.months')}</option>
                <option value={18}>18 {t('analytics:forecast.months')}</option>
                <option value={24}>24 {t('analytics:forecast.months')}</option>
              </select>
            </div>

            {/* Confidence Level */}
            <div className='flex items-center space-x-2'>
              <Target className='w-4 h-4 text-gray-500' />
              <select
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(Number(e.target.value))}
                className='text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1'
              >
                <option value={70}>70% {t('analytics:forecast.confidence')}</option>
                <option value={80}>80% {t('analytics:forecast.confidence')}</option>
                <option value={90}>90% {t('analytics:forecast.confidence')}</option>
                <option value={95}>95% {t('analytics:forecast.confidence')}</option>
              </select>
            </div>

            {/* Auto-refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={t('analytics:forecast.autoRefresh')}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>

            {/* Manual Refresh */}
            <button
              onClick={loadForecastData}
              disabled={loading}
              className='p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors'
              title={t('analytics:common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex space-x-1 mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
          {[
            { key: 'revenue', label: t('analytics:forecast.revenue'), icon: TrendingUp },
            { key: 'expenses', label: t('analytics:forecast.expenses'), icon: TrendingDown },
            { key: 'cashflow', label: t('analytics:forecast.cashFlow'), icon: DollarSign },
            { key: 'scenarios', label: t('analytics:forecast.scenarios'), icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className='w-4 h-4' />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {t('analytics:forecast.growthRate')}
            </h3>
            <TrendingUp className='w-4 h-4 text-green-500' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {formatPercentage(forecastData.kpis.growthRate)}
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {t('analytics:forecast.burnRate')}
            </h3>
            <TrendingDown className='w-4 h-4 text-red-500' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {formatCurrency(forecastData.kpis.burnRate)}
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {t('analytics:forecast.runway')}
            </h3>
            <Calendar className='w-4 h-4 text-blue-500' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {forecastData.kpis.runway ? `${Math.round(forecastData.kpis.runway)}m` : '∞'}
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              {t('analytics:forecast.confidence')}
            </h3>
            <Target className='w-4 h-4 text-purple-500' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>{confidenceLevel}%</div>
        </div>
      </div>

      {/* Chart Content */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'>
        <div className='h-96'>
          {activeTab === 'revenue' && <Line data={getRevenueChartData()} options={chartOptions} />}

          {activeTab === 'scenarios' && (
            <Line data={getScenarioChartData()} options={chartOptions} />
          )}

          {(activeTab === 'expenses' || activeTab === 'cashflow') && (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <BarChart3 className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 dark:text-gray-400'>
                  {t('analytics:forecast.chartComingSoon')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialForecast;
