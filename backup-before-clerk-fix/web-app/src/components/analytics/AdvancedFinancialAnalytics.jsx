import React, { useState, useMemo } from 'react';
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
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import EnhancedKPICard from '@components/analytics/EnhancedKPICard';
import InteractiveFinancialCharts from '@components/analytics/InteractiveFinancialCharts';

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

const AdvancedFinancialAnalytics = ({ data }) => {
  const { t, i18n } = useTranslation('analytics');
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = amount => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatPercentage = value => {
    const numValue = value || 0;
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const getEmptyFinancialData = () => {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      revenueGrowth: 0,
      expenseGrowth: 0,
      cashFlow: [],
      categoryDistribution: [],
      expenseCategories: [],
    };
  };

  const financialData = useMemo(() => {
    const emptyData = getEmptyFinancialData();
    return data?.success && data?.data ? data.data : emptyData;
  }, [data]);

  const CashFlowChart = () => {
    const chartData = {
      labels: financialData.cashFlow?.map(item => item.month),
      datasets: [
        {
          label: t('advanced.income'),
          data: financialData.cashFlow?.map(item => item.income),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: t('advanced.expenses'),
          data: financialData.cashFlow?.map(item => item.expense),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: t('advanced.netCashFlow'),
          data: financialData.cashFlow?.map(item => item.net),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: t('advanced.cashFlowTrend') },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: value => formatCurrency(value) } } },
    };
    return <Line data={chartData} options={options} />;
  };

  const CategoryDistributionChart = ({ type = 'income' }) => {
    const categoryData =
      type === 'income' ? financialData.categoryDistribution : financialData.expenseCategories;
    if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
      return (
        <div className='flex items-center justify-center h-full'>
          <div className='text-center'>
            <ChartPieIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {t('advanced.noDataAvailable')}
            </h3>
            <p className='text-gray-600'>{t('advanced.noDataForDistribution', { type })}</p>
          </div>
        </div>
      );
    }
    const chartData = {
      labels: categoryData.map(cat => cat.category || t('advanced.unknownCategory')),
      datasets: [
        {
          data: categoryData.map(cat => cat.amount || 0),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } },
        title: {
          display: true,
          text:
            type === 'income'
              ? t('advanced.incomeDistribution')
              : t('advanced.expenseDistribution'),
        },
        tooltip: {
          callbacks: { label: context => `${context.label}: ${formatCurrency(context.parsed)}` },
        },
      },
    };
    return <Doughnut data={chartData} options={options} />;
  };

  const kpiCards = [
    {
      title: t('advanced.totalRevenue'),
      value: formatCurrency(financialData.totalRevenue),
      icon: BanknotesIcon,
      color: 'green',
      trend: formatPercentage(financialData.revenueGrowth),
      positive: financialData.revenueGrowth > 0,
    },
    {
      title: t('advanced.totalExpenses'),
      value: formatCurrency(financialData.totalExpenses),
      icon: ReceiptRefundIcon,
      color: 'red',
      trend: formatPercentage(financialData.expenseGrowth),
      positive: financialData.expenseGrowth < 0,
    },
    {
      title: t('advanced.netProfit'),
      value: formatCurrency(financialData.netProfit),
      icon: ChartBarIcon,
      color: 'blue',
      trend: formatPercentage(financialData.revenueGrowth - financialData.expenseGrowth),
      positive: financialData.revenueGrowth - financialData.expenseGrowth > 0,
    },
    {
      title: t('advanced.profitMargin'),
      value: `${financialData.profitMargin?.toFixed(1)}%`,
      icon: ArrowTrendingUpIcon,
      color: 'indigo',
      trend: `+1.2%`,
      positive: true,
    },
  ];

  const tabs = [
    {
      id: 'overview',
      name: t('tabs.overview.name'),
      description: t('tabs.overview.description'),
    },
    {
      id: 'interactive',
      name: t('charts.interactiveAnalytics'),
      description: t('charts.interactiveDesc'),
    },
    {
      id: 'detailed',
      name: t('tabs.detailed.name'),
      description: t('tabs.detailed.description'),
    },
  ];

  return (
    <div className='bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 rounded-lg shadow-inner'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {t('tabs.detailed.name')}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>{t('tabs.detailed.description')}</p>
        </div>
        <div className='flex items-center gap-4 mt-4 md:mt-0'>
          <div className='flex items-center gap-2'>
            <CalendarIcon className='w-5 h-5 text-gray-500' />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className='bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2'
            >
              <option value='month'>{t('advanced.month')}</option>
              <option value='quarter'>{t('advanced.quarter')}</option>
              <option value='year'>{t('advanced.year')}</option>
            </select>
          </div>
          <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
            <ArrowDownTrayIcon className='w-5 h-5' />
            {t('advanced.exportData')}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='mb-6'>
        <div className='border-b border-gray-200 dark:border-gray-700'>
          <nav className='-mb-px flex space-x-8'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div>
                  <div className='font-medium'>{tab.name}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className='mb-6'>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-white mb-4'>
            {t('advanced.kpiOverview')}
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {kpiCards.map((kpi, i) => (
              <EnhancedKPICard
                key={i}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                trend={kpi.trend}
                positive={kpi.positive}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'interactive' && (
        <InteractiveFinancialCharts
          data={data}
          period={period}
          onPeriodChange={setPeriod}
          className='mb-6'
        />
      )}

      {activeTab === 'detailed' && (
        <div>
          <h3 className='text-xl font-semibold text-gray-800 dark:text-white mb-4'>
            {t('advanced.financialCharts')}
          </h3>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96'>
              <CashFlowChart />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96'>
              <CategoryDistributionChart type='income' />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96'>
              <CategoryDistributionChart type='expense' />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFinancialAnalytics;
