import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
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
import EnhancedKPICard from '@components/analytics/EnhancedKPICard';

// Registra i componenti Chart.js
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

const FinancialForecast = ({ data }) => {
  const { t, i18n } = useTranslation('reports');
  const [config, setConfig] = useState({
    months: 6,
    method: 'linear',
  });
  const [activeTab, setActiveTab] = useState('chart');

  const formatCurrency = amount => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatMonth = monthString => {
    if (typeof monthString === 'string' && monthString.includes('-')) {
      const date = new Date(monthString + '-01');
      return date.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      });
    }
    return monthString;
  };

  // Mock forecast data when real data is not available
  const getMockForecastData = () => {
    const currentDate = new Date();
    const forecast = [];
    let cumulativeProfit = 0;

    for (let i = 1; i <= config.months; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);

      const baseIncome = 28000 + (Math.random() * 8000 - 4000); // 24k-32k range
      const baseExpense = 18000 + (Math.random() * 4000 - 2000); // 16k-20k range
      const netProfit = baseIncome - baseExpense;
      cumulativeProfit += netProfit;

      forecast.push({
        month: futureDate.toISOString().substring(0, 7), // YYYY-MM format
        income: Math.round(baseIncome),
        expense: Math.round(baseExpense),
        netProfit: Math.round(netProfit),
        cumulativeProfit: Math.round(cumulativeProfit),
      });
    }

    return {
      forecast,
      method: config.method,
      confidence: 0.78,
      summary: {
        totalProjectedIncome: forecast.reduce((sum, item) => sum + item.income, 0),
        totalProjectedExpenses: forecast.reduce((sum, item) => sum + item.expense, 0),
        totalProjectedProfit: forecast.reduce((sum, item) => sum + item.netProfit, 0),
        averageMonthlyProfit:
          forecast.reduce((sum, item) => sum + item.netProfit, 0) / forecast.length,
      },
    };
  };

  const forecastData = data?.success && data?.data ? data.data : getMockForecastData();

  // Configurazione del grafico delle previsioni
  const getChartData = () => {
    const labels = forecastData.forecast?.map(f => formatMonth(f.month)) || [];
    return {
      labels,
      datasets: [
        {
          label: t('financialForecast.projectedIncome'),
          data: forecastData.forecast?.map(f => f.income || 0) || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: t('financialForecast.projectedExpenses'),
          data: forecastData.forecast?.map(f => f.expense || 0) || [],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: t('financialForecast.netProfit'),
          data: forecastData.forecast?.map(f => f.netProfit || 0) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Configurazione del grafico cumulativo
  const getCumulativeChartData = () => {
    const labels = forecastData.forecast?.map(f => formatMonth(f.month)) || [];
    return {
      labels,
      datasets: [
        {
          label: t('financialForecast.cumulativeProfit'),
          data: forecastData.forecast?.map(f => f.cumulativeProfit || 0) || [],
          backgroundColor:
            forecastData.forecast?.map(f =>
              (f.cumulativeProfit || 0) >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
            ) || [],
          borderColor:
            forecastData.forecast?.map(f =>
              (f.cumulativeProfit || 0) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            ) || [],
          borderWidth: 2,
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
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  const getConfidenceColor = level => {
    if (level > 0.75) return 'text-green-500';
    if (level > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceText = level => {
    if (level > 0.75) return t('financialForecast.high');
    if (level > 0.5) return t('financialForecast.medium');
    return t('financialForecast.low');
  };

  const kpiData = [
    {
      title: t('financialForecast.totalProjectedIncome'),
      value: formatCurrency(forecastData.summary?.totalProjectedIncome),
      icon: ArrowTrendingUpIcon,
      color: 'green',
    },
    {
      title: t('financialForecast.totalProjectedExpenses'),
      value: formatCurrency(forecastData.summary?.totalProjectedExpenses),
      icon: ArrowTrendingDownIcon,
      color: 'red',
    },
    {
      title: t('financialForecast.totalProjectedProfit'),
      value: formatCurrency(forecastData.summary?.totalProjectedProfit),
      icon: DocumentChartBarIcon,
      color: 'blue',
    },
    {
      title: t('financialForecast.avgMonthlyProfit'),
      value: formatCurrency(forecastData.summary?.averageMonthlyProfit),
      icon: ChartBarIcon,
      color: 'indigo',
    },
  ];

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          {t('financialForecast.title')}
        </h2>
        <div className='flex items-center space-x-2 mt-4 md:mt-0'>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'chart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {t('financialForecast.chart')}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'data'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {t('financialForecast.data')}
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        {kpiData.map((kpi, index) => (
          <EnhancedKPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            tooltipText={`Dettaglio per ${kpi.title}`}
          />
        ))}
      </div>

      <div className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6'>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center'>
          <AdjustmentsHorizontalIcon className='h-6 w-6 mr-2' />
          {t('financialForecast.configuration')}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='forecast-months'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              {t('financialForecast.forecastMonths')}
            </label>
            <select
              id='forecast-months'
              value={config.months}
              onChange={e => setConfig(prev => ({ ...prev, months: parseInt(e.target.value) }))}
              className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
            >
              <option value='3'>{t('financialForecast.months3')}</option>
              <option value='6'>{t('financialForecast.months6')}</option>
              <option value='12'>{t('financialForecast.months12')}</option>
              <option value='24'>{t('financialForecast.months24')}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor='forecast-method'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300'
            >
              {t('financialForecast.method')}
            </label>
            <select
              id='forecast-method'
              value={config.method}
              onChange={e => setConfig(prev => ({ ...prev, method: e.target.value }))}
              className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
            >
              <option value='linear'>{t('financialForecast.linear')}</option>
              <option value='exponential'>{t('financialForecast.exponential')}</option>
              <option value='logarithmic'>{t('financialForecast.logarithmic')}</option>
            </select>
          </div>
        </div>
        <div className='mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400'>
          <InformationCircleIcon className='h-5 w-5 mr-2 text-blue-400' />
          <p>
            {t('financialForecast.confidenceLevel')}:{' '}
            <span className={getConfidenceColor(forecastData.confidence)}>
              {getConfidenceText(forecastData.confidence)} (
              {Math.round(forecastData.confidence * 100)}%)
            </span>
          </p>
        </div>
      </div>

      {activeTab === 'chart' ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2'>
              {t('financialForecast.summary')}
            </h3>
            <div className='h-80'>
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>
          <div className='bg-gray-50 dark:bg-gray-900 p-4 rounded-lg'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2'>
              {t('financialForecast.cumulativeProfit')}
            </h3>
            <div className='h-80'>
              <Bar data={getCumulativeChartData()} options={chartOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  {t('financialForecast.month')}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  {t('financialForecast.income')}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  {t('financialForecast.expenses')}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  {t('financialForecast.netProfit')}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  {t('financialForecast.cumulativeProfit')}
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {forecastData.forecast.map((item, index) => (
                <tr key={index} className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                    {formatMonth(item.month)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-green-500'>
                    {formatCurrency(item.income)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-red-500'>
                    {formatCurrency(item.expense)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.netProfit >= 0 ? 'text-blue-500' : 'text-red-600'}`}
                  >
                    {formatCurrency(item.netProfit)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${item.cumulativeProfit >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-500'}`}
                  >
                    {formatCurrency(item.cumulativeProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancialForecast;
