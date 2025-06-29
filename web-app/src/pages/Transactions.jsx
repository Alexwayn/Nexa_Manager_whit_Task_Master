import React, { useState, useEffect } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import Footer from '@components/shared/Footer';
import nexaLogo from '@assets/logo_nexa.png';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  HomeIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
  const { t, ready } = useTranslation('transactions');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');

  // Safe translation function that handles loading state and interpolation
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Mock data matching the Motiff design exactly
  const financialData = {
    totalIncome: 28500,
    totalExpenses: 21200,
    netProfit: 7300,
    incomeProgress: 95,
    expenseProgress: 84,
    savingsRate: 25.6,
  };

  const incomeTransactions = [
    {
      id: 1,
      date: 'Jun 15',
      category: 'Consulting',
      client: 'Acme Corporation',
      amount: 8500,
      status: 'Received',
      categoryColor: 'bg-emerald-600',
    },
    {
      id: 2,
      date: 'Jun 12',
      category: 'Services',
      client: 'Globex Industries',
      amount: 6200,
      status: 'Received',
      categoryColor: 'bg-indigo-600',
    },
    {
      id: 3,
      date: 'Jun 8',
      category: 'Products',
      client: 'Soylent Corp',
      amount: 4800,
      status: 'Received',
      categoryColor: 'bg-amber-600',
    },
    {
      id: 4,
      date: 'Jun 5',
      category: 'Consulting',
      client: 'Initech LLC',
      amount: 5500,
      status: 'Received',
      categoryColor: 'bg-emerald-600',
    },
    {
      id: 5,
      date: 'Jun 1',
      category: 'Services',
      client: 'Umbrella Corp',
      amount: 3500,
      status: 'Received',
      categoryColor: 'bg-indigo-600',
    },
  ];

  const expenseTransactions = [
    {
      id: 1,
      date: 'Jun 14',
      category: 'Office Rent',
      vendor: 'Prestige Properties',
      amount: 4500,
      status: 'Paid',
    },
    {
      id: 2,
      date: 'Jun 10',
      category: 'Utilities',
      vendor: 'City Power & Water',
      amount: 850,
      status: 'Paid',
    },
    {
      id: 3,
      date: 'Jun 7',
      category: 'Software',
      vendor: 'Cloud Services Inc',
      amount: 1200,
      status: 'Paid',
    },
    {
      id: 4,
      date: 'Jun 5',
      category: 'Salaries',
      vendor: 'Team Payroll',
      amount: 12500,
      status: 'Paid',
    },
    {
      id: 5,
      date: 'Jun 2',
      category: 'Marketing',
      vendor: 'Digital Ads Co',
      amount: 2150,
      status: 'Paid',
    },
  ];

  const budgetPerformance = [
    {
      category: 'Consulting',
      actual: 14000,
      budget: 15000,
      status: 'under',
      variance: -1000,
      percentage: 6.7,
      color: 'bg-emerald-600',
    },
    {
      category: 'Products',
      actual: 8500,
      budget: 8000,
      status: 'over',
      variance: 500,
      percentage: 6.3,
      color: 'bg-amber-600',
    },
    {
      category: 'Services',
      actual: 6000,
      budget: 7000,
      status: 'under',
      variance: -1000,
      percentage: 14.3,
      color: 'bg-indigo-600',
    },
  ];

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    setLoading(false);
  }, []);

  // Show loading state if translations are not ready or component is loading
  if (!ready || loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Main Content */}
        <div className='flex flex-col'>
          {/* Breadcrumb */}
          <div className='bg-blue-50 border-b border-gray-200 px-6 py-3 flex items-center gap-2'>
            <HomeIcon className='w-4 h-4 text-gray-400' />
            <span className='text-blue-800'>{safeT('breadcrumb', {}, 'Income & Expenses')}</span>
          </div>

          {/* Page Content */}
          <div className='flex-1 px-6 py-6 space-y-6'>
            {/* Page Header */}
            <div className='flex items-center justify-between'>
              <h1 className='text-2xl font-semibold text-gray-900'>
                {safeT('title', {}, 'Income & Expenses')}
              </h1>
              <div className='flex items-center gap-3'>
                {/* Date Selector */}
                <div className='flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2'>
                  <CalendarIcon className='w-4 h-4 text-gray-600' />
                  <span className='text-gray-700'>{safeT('period.june2023', {}, 'June 2023')}</span>
                  <ChevronDownIcon className='w-4 h-4 text-gray-600' />
                </div>
                {/* Export Button */}
                <button className='bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2'>
                  <DocumentArrowDownIcon className='w-4 h-4' />
                  <span>{safeT('actions.export', {}, 'Export')}</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-3 gap-6'>
              {/* Total Income Card */}
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-blue-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md'>
                      <ArrowUpIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-blue-700 text-sm font-medium'>
                        {safeT('summary.totalIncome', {}, 'Total Income')}
                      </p>
                      <p className='text-3xl font-bold text-blue-900'>
                        ${financialData.totalIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowUpIcon className='w-3 h-3' />
                    7.4%
                  </div>
                </div>
                <div className='w-full bg-blue-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm'
                    style={{ width: `${financialData.incomeProgress}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-xs text-blue-600 font-medium'>
                  <span>{safeT('summary.budget', { amount: '30,000' }, 'Budget: $30,000')}</span>
                  <span>{safeT('summary.ofBudget', { percent: 95 }, '95% of budget')}</span>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-red-200 hover:border-red-300'>
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md'>
                      <ArrowDownIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-red-700 text-sm font-medium'>
                        {safeT('summary.totalExpenses', {}, 'Total Expenses')}
                      </p>
                      <p className='text-3xl font-bold text-red-900'>
                        ${financialData.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowDownIcon className='w-3 h-3' />
                    5.2%
                  </div>
                </div>
                <div className='w-full bg-red-200 rounded-full h-3 mb-2 shadow-inner'>
                  <div
                    className='bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full shadow-sm'
                    style={{ width: `${financialData.expenseProgress}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-xs text-red-600 font-medium'>
                  <span>{safeT('summary.budget', { amount: '25,000' }, 'Budget: $25,000')}</span>
                  <span>{safeT('summary.ofBudget', { percent: 84 }, '84% of budget')}</span>
                </div>
              </div>

              {/* Net Profit Card */}
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md'>
                      <ChartBarIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-green-700 text-sm font-medium'>
                        {safeT('summary.netProfit', {}, 'Net Profit')}
                      </p>
                      <p className='text-3xl font-bold text-green-900'>
                        ${financialData.netProfit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm'>
                    <ArrowUpIcon className='w-3 h-3' />
                    10.6%
                  </div>
                </div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-green-700 text-sm font-medium'>
                    {safeT('summary.savingsRate', {}, 'Savings Rate')}:
                  </span>
                  <span className='font-bold text-green-900'>{financialData.savingsRate}%</span>
                  <div className='flex-1 bg-green-200 rounded-full h-3 shadow-inner'>
                    <div
                      className='bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm'
                      style={{ width: `${financialData.savingsRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className='flex justify-between text-xs text-green-600 font-medium'>
                  <span>{financialData.savingsRate}%</span>
                  <span>{safeT('summary.savingsRate', {}, 'Savings Rate')}</span>
                </div>
              </div>
            </div>

            {/* Charts, Budget Progress and Quick Actions Row */}
            <div className='grid grid-cols-6 gap-6'>
              {/* Income vs Expenses Chart */}
              <div className='col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-800'>Income vs Expenses</h3>
                  <div className='flex items-center gap-2 bg-gray-50 p-1 rounded-lg'>
                    <button className='bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm'>
                      Monthly
                    </button>
                    <button className='text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700 transition-colors'>
                      Quarterly
                    </button>
                    <button className='text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700 transition-colors'>
                      Yearly
                    </button>
                  </div>
                </div>
                <div className='h-64 bg-gradient-to-t from-gray-50 to-white rounded-lg flex items-end justify-center p-6 mb-4 relative overflow-hidden'>
                  {/* Background Grid */}
                  <div className='absolute inset-0 opacity-10'>
                    <div
                      className='h-full w-full'
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    ></div>
                  </div>

                  {/* Chart Bars */}
                  <div className='flex items-end gap-3 relative z-10'>
                    {/* Week 1 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-32 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-24 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 2 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-28 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-20 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 3 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-36 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-16 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                    {/* Week 4 */}
                    <div className='flex items-end gap-1'>
                      <div className='w-6 h-30 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                      <div className='w-6 h-22 bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm shadow-sm hover:shadow-md transition-shadow'></div>
                    </div>
                  </div>

                  {/* Chart Labels */}
                  <div className='absolute bottom-2 left-6 right-6 flex justify-between text-xs text-gray-500'>
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>
                <div className='flex items-center justify-center gap-8 bg-gray-50 rounded-lg p-3'>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded shadow-sm'></div>
                    <span className='text-blue-600 font-medium text-sm'>Income</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-gradient-to-r from-red-500 to-red-400 rounded shadow-sm'></div>
                    <span className='text-red-500 font-medium text-sm'>Expenses</span>
                  </div>
                </div>
              </div>

              {/* Budget Progress */}
              <div className='col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-800'>Budget Progress</h3>
                  <EllipsisHorizontalIcon className='w-4 h-4 text-gray-400' />
                </div>
                <div className='grid grid-cols-2 gap-6 mb-6'>
                  <div className='text-center'>
                    <p className='text-blue-600 text-sm font-medium mb-3'>Income</p>
                    <div className='w-28 h-28 mx-auto mb-3 relative'>
                      {/* Background Circle */}
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#E5E7EB'
                          strokeWidth='6'
                          fill='none'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='url(#blueGradient)'
                          strokeWidth='6'
                          fill='none'
                          strokeDasharray={`${financialData.incomeProgress * 2.51} 251`}
                          strokeLinecap='round'
                          className='drop-shadow-sm'
                        />
                        <defs>
                          <linearGradient id='blueGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                            <stop offset='0%' stopColor='#3B82F6' />
                            <stop offset='100%' stopColor='#1D4ED8' />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage in center */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-lg font-bold text-blue-600'>
                          {financialData.incomeProgress}%
                        </span>
                      </div>
                    </div>
                    <p className='font-bold text-xl text-blue-900'>
                      ${financialData.totalIncome.toLocaleString()}
                    </p>
                    <p className='text-xs text-blue-600 font-medium'>of $30,000</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-red-600 text-sm font-medium mb-3'>Expenses</p>
                    <div className='w-28 h-28 mx-auto mb-3 relative'>
                      {/* Background Circle */}
                      <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#E5E7EB'
                          strokeWidth='6'
                          fill='none'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='url(#redGradient)'
                          strokeWidth='6'
                          fill='none'
                          strokeDasharray={`${financialData.expenseProgress * 2.51} 251`}
                          strokeLinecap='round'
                          className='drop-shadow-sm'
                        />
                        <defs>
                          <linearGradient id='redGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                            <stop offset='0%' stopColor='#EF4444' />
                            <stop offset='100%' stopColor='#DC2626' />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage in center */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-lg font-bold text-red-600'>
                          {financialData.expenseProgress}%
                        </span>
                      </div>
                    </div>
                    <p className='font-bold text-xl text-red-900'>
                      ${financialData.totalExpenses.toLocaleString()}
                    </p>
                    <p className='text-xs text-red-600 font-medium'>of $25,000</p>
                  </div>
                </div>
                <div className='border-t border-gray-100 pt-4 space-y-3 bg-gray-50 rounded-lg p-4'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600 font-medium'>Budget Period:</span>
                    <span className='font-semibold text-gray-800'>June 1 - June 30, 2023</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600 font-medium'>Remaining Days:</span>
                    <span className='font-semibold text-orange-600'>15 days</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className='col-span-2 bg-white rounded-xl shadow-sm p-6'>
                <h3 className='text-lg font-semibold mb-4'>Quick Actions</h3>
                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <button className='bg-blue-600 text-white p-4 rounded-lg flex flex-col items-center gap-2'>
                    <ChartBarIcon className='w-6 h-6' />
                    <span className='text-sm'>Adjust Budget</span>
                  </button>
                  <button className='bg-green-500 text-white p-4 rounded-lg flex flex-col items-center gap-2'>
                    <DocumentTextIcon className='w-6 h-6' />
                    <span className='text-sm'>Financial Report</span>
                  </button>
                  <button className='bg-yellow-500 text-white p-4 rounded-lg flex flex-col items-center gap-2'>
                    <ChartBarIcon className='w-6 h-6' />
                    <span className='text-sm'>Forecast Tool</span>
                  </button>
                  <button className='bg-purple-500 text-white p-4 rounded-lg flex flex-col items-center gap-2'>
                    <CalendarIcon className='w-6 h-6' />
                    <span className='text-sm'>Recurring Items</span>
                  </button>
                </div>

                {/* Upcoming Tasks */}
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='font-medium mb-3'>Upcoming Financial Tasks</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                      <span>Tax payment due in 5 days</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                      <span>Monthly financial review on Jun 30</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                      <span>Budget planning for Q3 starts Jul 15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Tables */}
            <div className='grid grid-cols-2 gap-6'>
              {/* Income Transactions */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>
                    {safeT('income.title', {}, 'Income Transactions')}
                  </h3>
                  <div className='flex items-center gap-2'>
                    <EllipsisHorizontalIcon className='w-4 h-4 text-gray-400' />
                    <button className='bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1'>
                      <PlusIcon className='w-3 h-3' />
                      {safeT('actions.addTransaction', {}, 'Add Transaction')}
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className='grid grid-cols-5 gap-4 bg-gray-50 px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide'>
                  <span>{safeT('table.date', {}, 'Date')}</span>
                  <span>{safeT('table.category', {}, 'Category')}</span>
                  <span>{safeT('table.client', {}, 'Client')}</span>
                  <span className='text-right'>{safeT('table.amount', {}, 'Amount')}</span>
                  <span className='text-center'>{safeT('table.status', {}, 'Status')}</span>
                </div>

                {/* Table Body */}
                <div className='border-t border-gray-200'>
                  {incomeTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='grid grid-cols-5 gap-4 px-3 py-4 border-b border-gray-100 text-sm'
                    >
                      <span className='text-gray-900'>{transaction.date}</span>
                      <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${transaction.categoryColor}`}></div>
                        <span>
                          {safeT(
                            `income.category.${transaction.category.toLowerCase()}`,
                            {},
                            transaction.category,
                          )}
                        </span>
                      </div>
                      <span className='text-gray-900'>{transaction.client}</span>
                      <span className='text-right font-medium'>
                        +${transaction.amount.toLocaleString()}
                      </span>
                      <div className='flex justify-center'>
                        <span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold'>
                          {safeT(
                            `income.status.${transaction.status.toLowerCase()}`,
                            {},
                            transaction.status,
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Transactions */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>
                    {safeT('expenses.title', {}, 'Expense Transactions')}
                  </h3>
                  <div className='flex items-center gap-2'>
                    <EllipsisHorizontalIcon className='w-4 h-4 text-gray-400' />
                    <button className='bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1'>
                      <PlusIcon className='w-3 h-3' />
                      {safeT('actions.addTransaction', {}, 'Add Transaction')}
                    </button>
                  </div>
                </div>

                {/* Table Header */}
                <div className='grid grid-cols-5 gap-4 bg-gray-50 px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide'>
                  <span>{safeT('table.date', {}, 'Date')}</span>
                  <span>{safeT('table.category', {}, 'Category')}</span>
                  <span>{safeT('table.client', {}, 'Client')}</span>
                  <span className='text-right'>{safeT('table.amount', {}, 'Amount')}</span>
                  <span className='text-center'>{safeT('table.status', {}, 'Status')}</span>
                </div>

                {/* Table Body */}
                <div className='border-t border-gray-200'>
                  {expenseTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='grid grid-cols-5 gap-4 px-3 py-4 border-b border-gray-100 text-sm'
                    >
                      <span className='text-gray-900'>{transaction.date}</span>
                      <span>
                        {safeT(
                          `expenses.category.${transaction.category.replace(/ /g, '').toLowerCase()}`,
                          {},
                          transaction.category,
                        )}
                      </span>
                      <span className='text-gray-900'>{transaction.vendor}</span>
                      <span className='text-right font-medium'>
                        -${transaction.amount.toLocaleString()}
                      </span>
                      <div className='flex justify-center'>
                        <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold'>
                          {safeT(
                            `expenses.status.${transaction.status.toLowerCase()}`,
                            {},
                            transaction.status,
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Budget Performance, Cash Flow */}
            <div className='grid grid-cols-2 gap-6'>
              {/* Budget Performance */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>
                    {safeT('budgetPerformance.title', {}, 'Budget Performance')}
                  </h3>
                  <EllipsisHorizontalIcon className='w-4 h-4 text-gray-400' />
                </div>
                <div className='space-y-6'>
                  {budgetPerformance.map((item, index) => (
                    <div key={index} className='space-y-1'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className='font-medium'>
                            {safeT(
                              `income.category.${item.category.toLowerCase()}`,
                              {},
                              item.category,
                            )}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          {item.status === 'under' ? (
                            <ArrowDownIcon className='w-4 h-4 text-green-600' />
                          ) : (
                            <ArrowUpIcon className='w-4 h-4 text-red-600' />
                          )}
                          <span
                            className={item.status === 'under' ? 'text-green-600' : 'text-red-600'}
                          >
                            {item.status === 'under' ? 'Under Budget' : 'Over Budget'}
                          </span>
                        </div>
                      </div>
                      <div className='flex justify-between text-sm text-gray-500'>
                        <span>Actual: ${item.actual.toLocaleString()}</span>
                        <span>Budget: ${item.budget.toLocaleString()}</span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className={`h-2 rounded-full ${item.status === 'under' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min((item.actual / item.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`text-xs ${item.status === 'under' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.status === 'under' ? '-' : '+'}
                          {Math.abs(item.variance).toLocaleString()} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className='w-full border border-gray-300 rounded-md py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50'>
                    <PlusIcon className='w-3 h-3' />
                    Add Budget Category
                  </button>
                </div>
              </div>

              {/* Cash Flow Forecast */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Cash Flow Forecast</h3>
                  <div className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'>
                    Next 90 Days
                  </div>
                </div>
                <div className='h-48 bg-gray-50 rounded-lg flex items-center justify-center mb-4'>
                  <div className='text-center text-gray-500'>
                    <div className='w-full h-40 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg flex items-end p-4'>
                      <div className='w-full h-full bg-gradient-to-t from-blue-600 to-blue-300 rounded opacity-20'></div>
                    </div>
                  </div>
                </div>
                <div className='border-t border-gray-100 pt-4 space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Current Balance:</span>
                    <span className='font-medium'>$32,500</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Projected (Aug 30):</span>
                    <span className='font-medium'>$39,500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  );
}
