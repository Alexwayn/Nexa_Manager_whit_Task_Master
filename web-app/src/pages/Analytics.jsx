import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import { useAuth } from '@context/AuthContext';
import invoiceAnalyticsService from '@lib/invoiceAnalyticsService';
import Logger from '@utils/Logger';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  ChevronDownIcon,
  ArrowRightIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';

const Analytics = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice-analytics');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await invoiceAnalyticsService.getInvoiceAnalytics();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        Logger.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [t]);

  const recentPayments = [
    {
      company: 'Acme Corporation',
      amount: '$3,450.00',
      date: 'Today',
      status: 'paid',
    },
    {
      company: 'Globex Industries',
      amount: '$5,780.00',
      date: '2 days ago',
      status: 'paid',
    },
    {
      company: 'Soylent Corp',
      amount: '$2,100.00',
      date: '1 week ago',
      status: 'paid',
    },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 text-red-400'>⚠️</div>
          <h3 className='mt-2 text-sm font-medium text-gray-900'>{error}</h3>
          <p className='mt-1 text-sm text-gray-500'>Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Blue Header */}
        <div className='bg-blue-50 border-b border-gray-200'>
          <div className='px-6 py-3'>
            <h1 className='text-blue-600 text-base font-normal'>Financial Tracking</h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-white border-b border-gray-200'>
          <div className='px-8 py-6'>
            <div className='flex space-x-6'>
              <button
                onClick={() => setActiveTab('invoice-analytics')}
                className={`pb-2 text-base font-medium ${
                  activeTab === 'invoice-analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoice Analytics
              </button>
              <button
                onClick={() => setActiveTab('advanced-analytics')}
                className={`pb-2 text-base font-medium ${
                  activeTab === 'advanced-analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Advanced Financial Analytics
              </button>
              <button
                onClick={() => setActiveTab('forecasting')}
                className={`pb-2 text-base font-medium ${
                  activeTab === 'forecasting'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Financial Forecasting
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='px-8 py-8'>
          {/* Invoice Analytics Tab */}
          {activeTab === 'invoice-analytics' && (
            <div className='space-y-8'>
              {/* Top Row - 3 Main Cards */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Invoice Status Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-lg font-semibold text-black'>Invoice Status</h3>
                    <div className='flex items-center text-sm text-gray-500'>
                      <span>This Month</span>
                      <ChevronDownIcon className='ml-2 h-4 w-4' />
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div className='flex items-center justify-center mb-6'>
                    <div className='relative w-48 h-48'>
                      <svg className='w-48 h-48 transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#22C55E'
                          strokeWidth='12'
                          fill='transparent'
                          strokeDasharray='163 251'
                          strokeDashoffset='0'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#F59E0B'
                          strokeWidth='12'
                          fill='transparent'
                          strokeDasharray='63 351'
                          strokeDashoffset='-163'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#EF4444'
                          strokeWidth='12'
                          fill='transparent'
                          strokeDasharray='25 389'
                          strokeDashoffset='-226'
                        />
                      </svg>
                    </div>
                  </div>

                  <div className='flex justify-between text-sm text-gray-500 mb-4'>
                    <span>Paid</span>
                    <span>Pending</span>
                    <span>Overdue</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-lg font-semibold text-green-600'>65%</span>
                    <span className='text-lg font-semibold text-yellow-500'>25%</span>
                    <span className='text-lg font-semibold text-red-500'>10%</span>
                  </div>
                </div>

                {/* Invoice Aging Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Invoice Aging</h3>
                    <div className='w-4 h-4 border border-gray-300 rounded'></div>
                  </div>

                  <div className='h-64 flex items-end justify-center space-x-4 mb-4'>
                    <div className='w-8 bg-blue-600 h-32 rounded-t'></div>
                    <div className='w-8 bg-gray-400 h-24 rounded-t'></div>
                    <div className='w-8 bg-gray-300 h-16 rounded-t'></div>
                    <div className='w-8 bg-gray-300 h-20 rounded-t'></div>
                    <div className='w-8 bg-gray-300 h-12 rounded-t'></div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-500'>
                      Total Outstanding:{' '}
                      <span className='font-semibold text-gray-900'>$100,000</span>
                    </span>
                    <div className='flex items-center text-blue-600 text-sm'>
                      <span>View Details</span>
                      <ArrowRightIcon className='ml-1 h-4 w-4' />
                    </div>
                  </div>
                </div>

                {/* Recent Payments Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Recent Payments</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>View All</span>
                  </div>

                  <div className='space-y-4'>
                    {recentPayments.map((payment, index) => (
                      <div
                        key={index}
                        className='flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0'
                      >
                        <div className='w-9 h-9 bg-green-100 rounded-full flex items-center justify-center'>
                          <CheckIcon className='w-5 h-5 text-green-600' />
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-black'>{payment.company}</div>
                          <div className='text-sm text-gray-500'>{payment.date}</div>
                        </div>
                        <div className='font-semibold text-black'>{payment.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second Row - Payment Velocity, Top Clients, Invoice Conversion */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Payment Velocity */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Payment Velocity</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  {/* Line Chart Placeholder */}
                  <div className='h-48 mb-4'>
                    <svg className='w-full h-full' viewBox='0 0 300 150'>
                      <polyline
                        fill='none'
                        stroke='#3B82F6'
                        strokeWidth='2'
                        points='20,120 60,80 100,90 140,60 180,70 220,40 260,50'
                      />
                      <circle cx='20' cy='120' r='3' fill='#3B82F6' />
                      <circle cx='60' cy='80' r='3' fill='#3B82F6' />
                      <circle cx='100' cy='90' r='3' fill='#3B82F6' />
                      <circle cx='140' cy='60' r='3' fill='#3B82F6' />
                      <circle cx='180' cy='70' r='3' fill='#3B82F6' />
                      <circle cx='220' cy='40' r='3' fill='#3B82F6' />
                      <circle cx='260' cy='50' r='3' fill='#3B82F6' />
                    </svg>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-500'>Avg Payment Time</span>
                    <div className='flex items-center'>
                      <span className='text-lg font-semibold text-black mr-2'>15</span>
                      <span className='text-sm text-gray-500'>days</span>
                      <ArrowTrendingDownIcon className='ml-2 h-4 w-4 text-green-500' />
                    </div>
                  </div>
                </div>

                {/* Top Clients */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Top Clients</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>View All</span>
                  </div>

                  <div className='space-y-4'>
                    {[
                      { name: 'Acme Corporation', amount: '$24,500', percentage: 85 },
                      { name: 'Globex Industries', amount: '$18,750', percentage: 65 },
                      { name: 'Soylent Corp', amount: '$15,200', percentage: 52 },
                      { name: 'Initech LLC', amount: '$12,800', percentage: 44 },
                    ].map((client, index) => (
                      <div key={index} className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                          <span className='text-xs font-medium text-blue-600'>{index + 1}</span>
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-black text-sm'>{client.name}</div>
                          <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                            <div
                              className='bg-blue-600 h-1.5 rounded-full'
                              style={{ width: `${client.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className='font-semibold text-black text-sm'>{client.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Conversion */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Invoice Conversion</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Details</span>
                  </div>

                  {/* Bar Chart */}
                  <div className='h-48 flex items-end justify-center space-x-3 mb-4'>
                    {[85, 92, 78, 88, 95, 82, 90].map((height, index) => (
                      <div key={index} className='flex flex-col items-center'>
                        <div
                          className='w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t'
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className='text-xs text-gray-500 mt-2'>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-lg font-semibold text-green-600'>142</div>
                      <div className='text-xs text-gray-500'>Sent</div>
                    </div>
                    <div>
                      <div className='text-lg font-semibold text-yellow-500'>24.8</div>
                      <div className='text-xs text-gray-500'>Viewed</div>
                    </div>
                    <div>
                      <div className='text-lg font-semibold text-red-500'>18.5</div>
                      <div className='text-xs text-gray-500'>Paid</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Financial Analytics Tab */}
          {activeTab === 'advanced-analytics' && (
            <div className='space-y-8'>
              {/* Revenue Breakdown, Monthly Expenses, Cash Flow Analysis */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Revenue Breakdown */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Revenue Breakdown</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Details</span>
                  </div>

                  {/* Donut Chart */}
                  <div className='flex items-center justify-center mb-6'>
                    <div className='relative w-40 h-40'>
                      <svg className='w-40 h-40 transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='35'
                          stroke='#3B82F6'
                          strokeWidth='15'
                          fill='transparent'
                          strokeDasharray='110 251'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='35'
                          stroke='#10B981'
                          strokeWidth='15'
                          fill='transparent'
                          strokeDasharray='80 281'
                          strokeDashoffset='-110'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='35'
                          stroke='#F59E0B'
                          strokeWidth='15'
                          fill='transparent'
                          strokeDasharray='61 300'
                          strokeDashoffset='-190'
                        />
                      </svg>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
                        <span className='text-sm text-gray-600'>Services</span>
                      </div>
                      <span className='text-sm font-medium'>$45,000</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
                        <span className='text-sm text-gray-600'>Products</span>
                      </div>
                      <span className='text-sm font-medium'>$32,000</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-3 h-3 bg-yellow-500 rounded-full mr-2'></div>
                        <span className='text-sm text-gray-600'>Consulting</span>
                      </div>
                      <span className='text-sm font-medium'>$23,000</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Expenses */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Monthly Expenses</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  {/* Bar Chart */}
                  <div className='h-48 flex items-end justify-center space-x-2 mb-4'>
                    {[65, 45, 80, 55, 70, 60].map((height, index) => (
                      <div key={index} className='flex flex-col items-center'>
                        <div
                          className='w-8 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t'
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className='text-xs text-gray-500 mt-2'>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='text-center'>
                    <div className='text-2xl font-bold text-black'>$18,500</div>
                    <div className='text-sm text-gray-500'>Average Monthly</div>
                  </div>
                </div>

                {/* Cash Flow Analysis */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Cash Flow Analysis</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Report</span>
                  </div>

                  {/* Area Chart Placeholder */}
                  <div className='h-48 mb-4'>
                    <svg className='w-full h-full' viewBox='0 0 300 150'>
                      <defs>
                        <linearGradient id='cashFlowGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                          <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.3' />
                          <stop offset='100%' stopColor='#3B82F6' stopOpacity='0' />
                        </linearGradient>
                      </defs>
                      <polygon
                        fill='url(#cashFlowGradient)'
                        points='20,120 60,80 100,90 140,60 180,70 220,40 260,50 260,140 20,140'
                      />
                      <polyline
                        fill='none'
                        stroke='#3B82F6'
                        strokeWidth='2'
                        points='20,120 60,80 100,90 140,60 180,70 220,40 260,50'
                      />
                    </svg>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center'>
                      <div className='text-lg font-semibold text-green-600'>+$45,200</div>
                      <div className='text-xs text-gray-500'>Inflow</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-semibold text-red-500'>-$18,500</div>
                      <div className='text-xs text-gray-500'>Outflow</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Margin Trends, Financial Health, Expense Breakdown */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Profit Margin Trends */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Profit Margin Trends</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  <div className='h-32 flex items-end justify-center space-x-1 mb-4'>
                    {[45, 52, 48, 58, 62, 55, 60, 65, 58, 70, 68, 72].map((height, index) => (
                      <div
                        key={index}
                        className='w-4 bg-blue-500 rounded-t'
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>

                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>68%</div>
                    <div className='text-sm text-gray-500'>Current Margin</div>
                    <div className='flex items-center justify-center mt-2'>
                      <ArrowTrendingUpIcon className='h-4 w-4 text-green-500 mr-1' />
                      <span className='text-sm text-green-500'>+5.2%</span>
                    </div>
                  </div>
                </div>

                {/* Financial Health */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Financial Health</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Details</span>
                  </div>

                  {/* Circular Progress */}
                  <div className='flex items-center justify-center mb-6'>
                    <div className='relative w-32 h-32'>
                      <svg className='w-32 h-32 transform -rotate-90' viewBox='0 0 100 100'>
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#E5E7EB'
                          strokeWidth='8'
                          fill='transparent'
                        />
                        <circle
                          cx='50'
                          cy='50'
                          r='40'
                          stroke='#3B82F6'
                          strokeWidth='8'
                          fill='transparent'
                          strokeDasharray='201 251'
                          strokeLinecap='round'
                        />
                      </svg>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-2xl font-bold text-blue-600'>80</span>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Cash Flow</span>
                      <span className='text-sm font-medium text-green-600'>Excellent</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Debt Ratio</span>
                      <span className='text-sm font-medium text-yellow-600'>Good</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm text-gray-600'>Liquidity</span>
                      <span className='text-sm font-medium text-green-600'>Very Good</span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Expense Breakdown</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  <div className='space-y-4'>
                    {[
                      {
                        category: 'Salaries & Benefits',
                        amount: '$12,500',
                        percentage: 68,
                        color: 'bg-blue-500',
                      },
                      {
                        category: 'Operations',
                        amount: '$3,200',
                        percentage: 17,
                        color: 'bg-green-500',
                      },
                      {
                        category: 'Marketing',
                        amount: '$1,800',
                        percentage: 10,
                        color: 'bg-yellow-500',
                      },
                      {
                        category: 'Software & Tools',
                        amount: '$1,000',
                        percentage: 5,
                        color: 'bg-purple-500',
                      },
                    ].map((expense, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-sm text-gray-600'>{expense.category}</span>
                          <span className='text-sm font-medium'>{expense.amount}</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`${expense.color} h-2 rounded-full`}
                            style={{ width: `${expense.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Forecasting Tab */}
          {activeTab === 'forecasting' && (
            <div className='space-y-8'>
              {/* 6-Month Revenue Projection, Growth Trend Analysis */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* 6-Month Revenue Projection */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>6-Month Revenue Projection</h3>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm text-gray-500'>Projected</span>
                      <span className='text-sm text-gray-500'>Actual</span>
                      <span className='text-sm text-gray-500'>Target</span>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className='h-64 mb-4'>
                    <svg className='w-full h-full' viewBox='0 0 400 200'>
                      {/* Projected Line */}
                      <polyline
                        fill='none'
                        stroke='#3B82F6'
                        strokeWidth='3'
                        strokeDasharray='5,5'
                        points='50,150 100,130 150,120 200,100 250,90 300,80 350,70'
                      />
                      {/* Actual Line */}
                      <polyline
                        fill='none'
                        stroke='#10B981'
                        strokeWidth='3'
                        points='50,150 100,135 150,125 200,110'
                      />
                      {/* Target Line */}
                      <polyline
                        fill='none'
                        stroke='#F59E0B'
                        strokeWidth='2'
                        points='50,140 100,120 150,110 200,95 250,85 300,75 350,65'
                      />
                    </svg>
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-xl font-bold text-blue-600'>$225,000</div>
                      <div className='text-sm text-gray-500'>6-Month Projected</div>
                    </div>
                    <div>
                      <div className='text-xl font-bold text-green-600'>$238,000</div>
                      <div className='text-sm text-gray-500'>Expected</div>
                    </div>
                    <div>
                      <div className='text-xl font-bold text-yellow-600'>$195,000</div>
                      <div className='text-sm text-gray-500'>Conservative</div>
                    </div>
                  </div>
                </div>

                {/* Growth Trend Analysis */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Growth Trend Analysis</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>View Report</span>
                  </div>

                  <div className='space-y-6'>
                    <div className='text-center'>
                      <div className='text-3xl font-bold text-green-600 mb-2'>+23.5%</div>
                      <div className='text-sm text-gray-500'>Quarterly Growth Rate</div>
                    </div>

                    <div className='space-y-4'>
                      {[
                        {
                          metric: 'Revenue Growth',
                          value: '+18.2%',
                          trend: 'up',
                          color: 'text-green-600',
                        },
                        {
                          metric: 'Client Acquisition',
                          value: '+12.8%',
                          trend: 'up',
                          color: 'text-green-600',
                        },
                        {
                          metric: 'Average Invoice Value',
                          value: '+8.5%',
                          trend: 'up',
                          color: 'text-green-600',
                        },
                        {
                          metric: 'Payment Velocity',
                          value: '-15.3%',
                          trend: 'down',
                          color: 'text-green-600',
                        },
                      ].map((item, index) => (
                        <div key={index} className='flex items-center justify-between'>
                          <span className='text-sm text-gray-600'>{item.metric}</span>
                          <div className='flex items-center'>
                            <span className={`text-sm font-medium ${item.color}`}>
                              {item.value}
                            </span>
                            {item.trend === 'up' ? (
                              <ArrowTrendingUpIcon className='ml-2 h-4 w-4 text-green-500' />
                            ) : (
                              <ArrowTrendingDownIcon className='ml-2 h-4 w-4 text-green-500' />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quarterly Targets, Budget Planning, Scenario Modeling */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Quarterly Targets */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Quarterly Targets</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  <div className='space-y-4'>
                    {[
                      { quarter: 'Q1 2024', target: '$85,000', actual: '$92,500', progress: 109 },
                      { quarter: 'Q2 2024', target: '$95,000', actual: '$88,200', progress: 93 },
                      { quarter: 'Q3 2024', target: '$105,000', actual: '$98,750', progress: 94 },
                      { quarter: 'Q4 2024', target: '$115,000', actual: '-', progress: 0 },
                    ].map((item, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-sm font-medium'>{item.quarter}</span>
                          <span className='text-sm text-gray-600'>{item.target}</span>
                        </div>
                        {item.progress > 0 && (
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full ${
                                item.progress >= 100 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(item.progress, 100)}%` }}
                            ></div>
                          </div>
                        )}
                        <div className='flex justify-between text-xs'>
                          <span className='text-gray-500'>Actual: {item.actual}</span>
                          {item.progress > 0 && (
                            <span
                              className={
                                item.progress >= 100 ? 'text-green-600' : 'text-yellow-600'
                              }
                            >
                              {item.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Planning */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Budget Planning</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Edit Budget</span>
                  </div>

                  <div className='space-y-4'>
                    <div className='text-center mb-4'>
                      <div className='text-2xl font-bold text-black'>$418,000</div>
                      <div className='text-sm text-gray-500'>Annual Budget</div>
                    </div>

                    {[
                      {
                        category: 'Marketing & Sales',
                        allocated: '$45,000',
                        spent: '$38,200',
                        percentage: 85,
                      },
                      {
                        category: 'Operations',
                        allocated: '$125,000',
                        spent: '$98,500',
                        percentage: 79,
                      },
                      {
                        category: 'Research & Development',
                        allocated: '$85,000',
                        spent: '$72,300',
                        percentage: 85,
                      },
                      {
                        category: 'Administration',
                        allocated: '$35,000',
                        spent: '$28,900',
                        percentage: 83,
                      },
                    ].map((item, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-sm text-gray-600'>{item.category}</span>
                          <span className='text-sm font-medium'>{item.allocated}</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className='flex justify-between text-xs text-gray-500'>
                          <span>Spent: {item.spent}</span>
                          <span>{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario Modeling */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-black'>Scenario Modeling</h3>
                    <span className='text-blue-600 text-sm cursor-pointer'>Create New</span>
                  </div>

                  <div className='space-y-4'>
                    {[
                      {
                        scenario: 'Best Case',
                        revenue: '$485,000',
                        probability: '25%',
                        color: 'text-green-600',
                      },
                      {
                        scenario: 'Most Likely',
                        revenue: '$425,000',
                        probability: '50%',
                        color: 'text-blue-600',
                      },
                      {
                        scenario: 'Conservative',
                        revenue: '$385,000',
                        probability: '25%',
                        color: 'text-yellow-600',
                      },
                    ].map((scenario, index) => (
                      <div key={index} className='p-4 border border-gray-200 rounded-lg'>
                        <div className='flex justify-between items-center mb-2'>
                          <span className='font-medium text-black'>{scenario.scenario}</span>
                          <span className='text-sm text-gray-500'>{scenario.probability}</span>
                        </div>
                        <div className={`text-lg font-bold ${scenario.color}`}>
                          {scenario.revenue}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>Annual Revenue Projection</div>
                      </div>
                    ))}
                  </div>

                  <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                    <div className='text-sm font-medium text-black mb-2'>Key Assumptions:</div>
                    <ul className='text-xs text-gray-600 space-y-1'>
                      <li>• 15% client growth rate</li>
                      <li>• 8% average price increase</li>
                      <li>• 5% market expansion</li>
                      <li>• Stable economic conditions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Analytics;
