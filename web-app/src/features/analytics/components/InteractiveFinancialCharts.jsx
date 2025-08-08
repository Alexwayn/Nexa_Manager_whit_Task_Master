import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  TimeScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowsPointingOutIcon,
  FunnelIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import financialService from '../../financial/services/financialService';
import Logger from '@/utils/Logger';



const InteractiveFinancialCharts = ({ data, period = 'month', onPeriodChange, className = '' }) => {
  const { t, i18n } = useTranslation(['analytics', 'dashboard']);

  // States
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState('overview');
  const [chartFilters, setChartFilters] = useState({
    showIncome: true,
    showExpenses: true,
    showNetProfit: true,
    showTrends: true,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [financialData, setFinancialData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
    end: new Date(),
  });

  // Chart types configuration
  const chartTypes = [
    {
      id: 'overview',
      name: t('analytics:charts.overview'),
      icon: ChartBarIcon,
      description: t('analytics:charts.overviewDesc'),
    },
    {
      id: 'trends',
      name: t('analytics:charts.trends'),
      icon: ArrowTrendingUpIcon,
      description: t('analytics:charts.trendsDesc'),
    },
    {
      id: 'comparison',
      name: t('analytics:charts.comparison'),
      icon: Squares2X2Icon,
      description: t('analytics:charts.comparisonDesc'),
    },
    {
      id: 'distribution',
      name: t('analytics:charts.distribution'),
      icon: FunnelIcon,
      description: t('analytics:charts.distributionDesc'),
    },
  ];

  // Utility functions
  const formatCurrency = useCallback(
    amount => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'EUR',
      }).format(amount || 0);
    },
    [i18n.language],
  );

  const formatPercentage = useCallback(value => {
    const numValue = value || 0;
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  }, []);

  // Load financial data
  const loadFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financialService.getFinancialOverview(
        period,
        dateRange.start,
        dateRange.end,
      );

      if (result.success) {
        setFinancialData(result.data);
      } else {
        Logger.error('Failed to load financial data:', result.error);
      }
    } catch (error) {
      Logger.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, dateRange]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Chart data generators
  const generateOverviewChartData = useMemo(() => {
    if (!financialData?.cashFlow) return null;

    const labels = financialData.cashFlow.map(item =>
      new Date(item.date).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
      }),
    );

    const datasets = [];

    if (chartFilters.showIncome) {
      datasets.push({
        label: t('analytics:advanced.income'),
        data: financialData.cashFlow.map(item => item.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    if (chartFilters.showExpenses) {
      datasets.push({
        label: t('analytics:advanced.expenses'),
        data: financialData.cashFlow.map(item => item.expense),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    if (chartFilters.showNetProfit) {
      datasets.push({
        label: t('analytics:advanced.netCashFlow'),
        data: financialData.cashFlow.map(item => item.net),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    return { labels, datasets };
  }, [financialData, chartFilters, i18n.language, t]);

  const generateTrendsChartData = useMemo(() => {
    if (!financialData?.income?.dailyTrend || !financialData?.expenses?.dailyTrend) return null;

    const incomeTrend = financialData.income.dailyTrend;
    const expenseTrend = financialData.expenses.dailyTrend;

    // Calculate moving averages
    const calculateMovingAverage = (data, window = 7) => {
      return data.map((_, index) => {
        const start = Math.max(0, index - window + 1);
        const subset = data.slice(start, index + 1);
        const sum = subset.reduce((acc, val) => acc + val.amount, 0);
        return sum / subset.length;
      });
    };

    const incomeMA = calculateMovingAverage(incomeTrend);
    const expenseMA = calculateMovingAverage(expenseTrend);

    const labels = incomeTrend.map(item =>
      new Date(item.date).toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
      }),
    );

    return {
      labels,
      datasets: [
        {
          label: t('analytics:charts.incomeMovingAvg'),
          data: incomeMA,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
        },
        {
          label: t('analytics:charts.expenseMovingAvg'),
          data: expenseMA,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 0,
        },
        {
          label: t('analytics:advanced.income'),
          data: incomeTrend.map(item => item.amount),
          borderColor: 'rgba(34, 197, 94, 0.5)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 2,
        },
        {
          label: t('analytics:advanced.expenses'),
          data: expenseTrend.map(item => item.amount),
          borderColor: 'rgba(239, 68, 68, 0.5)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.1,
          borderWidth: 1,
          pointRadius: 2,
        },
      ],
    };
  }, [financialData, i18n.language, t]);

  const generateComparisonChartData = useMemo(() => {
    if (!financialData?.income?.byCategory || !financialData?.expenses?.byCategory) return null;

    const incomeCategories = Object.values(financialData.income.byCategory).slice(0, 5);
    const expenseCategories = Object.values(financialData.expenses.byCategory).slice(0, 5);

    const allCategories = [
      ...new Set([
        ...incomeCategories.map(c => c.category),
        ...expenseCategories.map(c => c.category),
      ]),
    ];

    const incomeData = allCategories.map(category => {
      const found = incomeCategories.find(c => c.category === category);
      return found ? found.amount : 0;
    });

    const expenseData = allCategories.map(category => {
      const found = expenseCategories.find(c => c.category === category);
      return found ? found.amount : 0;
    });

    return {
      labels: allCategories,
      datasets: [
        {
          label: t('analytics:advanced.income'),
          data: incomeData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
        {
          label: t('analytics:advanced.expenses'),
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    };
  }, [financialData, t]);

  const generateDistributionChartData = useMemo(() => {
    if (!financialData?.expenses?.byCategory) return null;

    const categories = Object.values(financialData.expenses.byCategory).slice(0, 6);

    return {
      labels: categories.map(cat => cat.category),
      datasets: [
        {
          data: categories.map(cat => cat.amount),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  }, [financialData]);

  // Chart options
  const getChartOptions = useCallback(
    type => {
      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: context => {
                if (type === 'distribution') {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                }
                return `${context.dataset.label}: ${formatCurrency(context.parsed.y || context.parsed)}`;
              },
            },
          },
          zoom:
            type !== 'distribution'
              ? {
                  pan: {
                    enabled: true,
                    mode: 'x',
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: 'x',
                    onZoom: ({ chart }) => {
                      setZoomLevel(chart.getZoomLevel());
                    },
                  },
                }
              : undefined,
        },
      };

      if (type === 'distribution') {
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                generateLabels: chart => {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        strokeStyle: data.datasets[0].borderColor[i],
                        lineWidth: data.datasets[0].borderWidth,
                        hidden: false,
                        index: i,
                      };
                    });
                  }
                  return [];
                },
              },
            },
          },
        };
      }

      if (type === 'comparison') {
        return {
          ...baseOptions,
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value),
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
          },
        };
      }

      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => formatCurrency(value),
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      };
    },
    [formatCurrency],
  );

  // Event handlers
  const handleChartTypeChange = chartType => {
    setSelectedChart(chartType);
  };

  const handleFilterChange = filterKey => {
    setChartFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    // Chart reset zoom will be handled by chart ref
  };

  const handleExportChart = () => {
    // Export functionality
    Logger.info('Exporting chart:', selectedChart);
  };

  // Render chart based on selected type
  const renderChart = () => {
    if (loading) {
      return (
        <div className='flex items-center justify-center h-full'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      );
    }

    switch (selectedChart) {
      case 'overview':
        return generateOverviewChartData ? (
          <Line data={generateOverviewChartData} options={getChartOptions('overview')} />
        ) : null;

      case 'trends':
        return generateTrendsChartData ? (
          <Line data={generateTrendsChartData} options={getChartOptions('trends')} />
        ) : null;

      case 'comparison':
        return generateComparisonChartData ? (
          <Bar data={generateComparisonChartData} options={getChartOptions('comparison')} />
        ) : null;

      case 'distribution':
        return generateDistributionChartData ? (
          <Doughnut
            data={generateDistributionChartData}
            options={getChartOptions('distribution')}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
        <div>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            {t('analytics:charts.interactiveAnalytics')}
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            {t('analytics:charts.interactiveDesc')}
          </p>
        </div>

        <div className='flex items-center gap-2 mt-4 lg:mt-0'>
          {zoomLevel > 1 && (
            <button
              onClick={handleResetZoom}
              className='flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600'
            >
              <MagnifyingGlassIcon className='w-4 h-4' />
              {t('analytics:charts.resetZoom')}
            </button>
          )}

          <button
            onClick={handleExportChart}
            className='flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            <ArrowDownTrayIcon className='w-4 h-4' />
            {t('analytics:advanced.exportData')}
          </button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className='mb-6'>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {chartTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => handleChartTypeChange(type.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedChart === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className='w-5 h-5 mx-auto mb-2' />
                <div className='text-sm font-medium'>{type.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {selectedChart === 'overview' && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
            {t('analytics:charts.filters')}
          </h4>
          <div className='flex flex-wrap gap-3'>
            {Object.entries(chartFilters).map(([key, value]) => (
              <label key={key} className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={value}
                  onChange={() => handleFilterChange(key)}
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  {t(`analytics:charts.${key}`)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className='h-96 lg:h-[500px]'>{renderChart()}</div>

      {/* Chart Info */}
      <div className='mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
        <div className='flex items-start gap-3'>
          <CursorArrowRaysIcon className='w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0' />
          <div>
            <h5 className='font-medium text-gray-900 dark:text-white mb-1'>
              {t('analytics:charts.interactionTips')}
            </h5>
            <ul className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
              <li>• {t('analytics:charts.hoverTooltip')}</li>
              <li>• {t('analytics:charts.scrollZoom')}</li>
              <li>• {t('analytics:charts.dragPan')}</li>
              <li>• {t('analytics:charts.clickLegend')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFinancialCharts;
