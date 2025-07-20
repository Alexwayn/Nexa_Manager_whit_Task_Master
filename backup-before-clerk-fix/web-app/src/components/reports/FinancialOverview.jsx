import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@components/shared/StatCard';

const FinancialOverview = ({
  data,
  formatCurrency,
  formatNumber,
  formatPercentage,
  className = '',
}) => {
  const { t } = useTranslation('reports');

  if (!data) return null;

  const netProfit = (data.overview?.income?.total || 0) - (data.overview?.expenses?.total || 0);
  const profitMargin =
    data.overview?.income?.total > 0 ? (netProfit / data.overview.income.total) * 100 : 0;
  const taxDeductibleAmount = data.overview?.expenses?.taxDeductible || 0;
  const estimatedTaxSavings = taxDeductibleAmount * 0.22; // 22% IRPEF

  const metrics = [
    {
      title: t('financials.metrics.totalIncome'),
      value: formatCurrency(data.overview?.income?.total || 0),
      subtitle: t('financials.metrics.transactions', {
        count: formatNumber(data.incomes?.length || 0),
      }),
      icon: ArrowUpIcon,
      color: 'green',
      trend: {
        value: '+12.5%',
        positive: true,
      },
    },
    {
      title: t('financials.metrics.totalExpenses'),
      value: formatCurrency(data.overview?.expenses?.total || 0),
      subtitle: t('financials.metrics.transactions', {
        count: formatNumber(data.expenses?.length || 0),
      }),
      icon: ArrowDownIcon,
      color: 'red',
      trend: {
        value: '+8.3%',
        positive: false,
      },
    },
    {
      title: t('financials.metrics.netProfit'),
      value: formatCurrency(netProfit),
      subtitle: t('financials.metrics.margin', { percentage: formatPercentage(profitMargin) }),
      icon: CurrencyDollarIcon,
      color: netProfit >= 0 ? 'green' : 'red',
      trend: {
        value: netProfit >= 0 ? '+15.2%' : '-5.7%',
        positive: netProfit >= 0,
      },
    },
    {
      title: t('financials.metrics.estimatedTaxSavings'),
      value: formatCurrency(estimatedTaxSavings),
      subtitle: t('financials.metrics.onDeductible', {
        amount: formatCurrency(taxDeductibleAmount),
      }),
      icon: ReceiptPercentIcon,
      color: 'purple',
      trend: {
        value: '+3.1%',
        positive: true,
      },
    },
  ];

  const additionalMetrics = [
    {
      label: t('financials.metrics.avgMonthlyIncome'),
      value: formatCurrency((data.overview?.income?.total || 0) / 3), // Assuming 3 months
    },
    {
      label: t('financials.metrics.avgMonthlyExpenses'),
      value: formatCurrency((data.overview?.expenses?.total || 0) / 3),
    },
    {
      label: t('financials.metrics.totalTransactions'),
      value: formatNumber((data.incomes?.length || 0) + (data.expenses?.length || 0)),
    },
    {
      label: t('financials.metrics.deductibleExpensePercentage'),
      value: formatPercentage(
        data.overview?.expenses?.total > 0
          ? (taxDeductibleAmount / data.overview.expenses.total) * 100
          : 0,
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Financial Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {metrics.map((metric, index) => (
          <StatCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            color={metric.color}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Additional Metrics Summary */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center mb-4'>
          <ChartBarIcon className='h-5 w-5 text-gray-400 mr-2' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
            {t('financials.metrics.additionalMetrics')}
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {additionalMetrics.map((metric, index) => (
            <div key={index} className='text-center'>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-1'>{metric.label}</p>
              <p className='text-xl font-semibold text-gray-900 dark:text-white'>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Health Indicators */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
          {t('financials.health.title')}
        </h3>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {t('financials.health.liquidity')}
            </span>
            <span
              className={`font-medium ${
                netProfit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {t('financials.metrics.profitMargin')}
            </span>
            <span
              className={`font-medium ${
                profitMargin >= 10
                  ? 'text-green-600 dark:text-green-400'
                  : profitMargin >= 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatPercentage(profitMargin)}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {t('financials.health.taxEfficiency')}
            </span>
            <span className='font-medium text-purple-600 dark:text-purple-400'>
              {formatCurrency(estimatedTaxSavings)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;
