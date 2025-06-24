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
import EnhancedKPICard from '@components/EnhancedKPICard';

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    const numValue = value || 0;
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  const getMockFinancialData = () => {
    const months = t('charts.months', { returnObjects: true });
    return {
      totalRevenue: 125000,
      totalExpenses: 87500,
      netProfit: 37500,
      profitMargin: 30.0,
      revenueGrowth: 12.5,
      expenseGrowth: 8.3,
      cashFlow: [
        { month: months.jan, income: 18000, expense: 12000, net: 6000 },
        { month: months.feb, income: 22000, expense: 14000, net: 8000 },
        { month: months.mar, income: 25000, expense: 15000, net: 10000 },
        { month: months.apr, income: 20000, expense: 13000, net: 7000 },
        { month: months.may, income: 28000, expense: 16000, net: 12000 },
        { month: months.jun, income: 32000, expense: 17500, net: 14500 },
      ],
      categoryDistribution: [
        { category: t('charts.revenueBreakdown.consulting'), amount: 45000, percentage: 36 },
        { category: t('charts.revenueBreakdown.products'), amount: 35000, percentage: 28 },
        { category: t('charts.revenueBreakdown.services'), amount: 25000, percentage: 20 },
        { category: 'Support', amount: 20000, percentage: 16 },
      ],
      expenseCategories: [
        { category: 'Salaries', amount: 35000, percentage: 40 },
        { category: 'Marketing', amount: 17500, percentage: 20 },
        { category: 'Operations', amount: 15000, percentage: 17 },
        { category: 'Technology', amount: 10000, percentage: 11 },
        { category: 'Other', amount: 10000, percentage: 12 },
      ],
    };
  };

  const financialData = useMemo(() => {
    const mockData = getMockFinancialData();
    return data?.success && data?.data ? { ...mockData, ...data.data } : mockData;
  }, [data, i18n.language, getMockFinancialData]);

  const CashFlowChart = () => {
    const chartData = {
      labels: financialData.cashFlow?.map((item) => item.month),
      datasets: [
        {
          label: t('advanced.income'),
          data: financialData.cashFlow?.map((item) => item.income),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: t('advanced.expenses'),
          data: financialData.cashFlow?.map((item) => item.expense),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: t('advanced.netCashFlow'),
          data: financialData.cashFlow?.map((item) => item.net),
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
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatCurrency(value) } } },
    };
    return <Line data={chartData} options={options} />;
  };

  const CategoryDistributionChart = ({ type = 'income' }) => {
    const categoryData =
      type === 'income' ? financialData.categoryDistribution : financialData.expenseCategories;
    if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ChartPieIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('advanced.noDataAvailable')}
            </h3>
            <p className="text-gray-600">{t('advanced.noDataForDistribution', { type })}</p>
          </div>
        </div>
      );
    }
    const chartData = {
      labels: categoryData.map((cat) => cat.category || t('advanced.unknownCategory')),
      datasets: [
        {
          data: categoryData.map((cat) => cat.amount || 0),
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
          callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` },
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 rounded-lg shadow-inner">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tabs.detailed.name')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('tabs.detailed.description')}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
            >
              <option value="month">{t('advanced.month')}</option>
              <option value="quarter">{t('advanced.quarter')}</option>
              <option value="year">{t('advanced.year')}</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowDownTrayIcon className="w-5 h-5" />
            {t('advanced.exportData')}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {t('advanced.kpiOverview')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {t('advanced.financialCharts')}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
            <CashFlowChart />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
            <CategoryDistributionChart type="income" />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
            <CategoryDistributionChart type="expense" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFinancialAnalytics;
