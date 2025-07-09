import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@components/shared/Footer';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import invoiceAnalyticsService from '@lib/invoiceAnalyticsService';
import financialService from '@lib/financialService';
import clientService from '@lib/clientService';
import Logger from '@utils/Logger';
import { getUserIdForUuidTables } from '@utils/userIdConverter';
import ErrorBoundary from '@components/common/ErrorBoundary';
import ReportsDashboard from '@components/reports/ReportsDashboard'; // Import the new component
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
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';

const Analytics = () => {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice-analytics');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Convert Clerk user ID to UUID for database queries
        const dbUserId = getUserIdForUuidTables(user.id);
        Logger.info('Loading analytics for user:', {
          clerkId: user.id,
          dbUserId,
          userEmail: user.primaryEmailAddress?.emailAddress
        });

        // Fetch all required data in parallel
        const [invoiceData, financialData, clientData] = await Promise.all([
          invoiceAnalyticsService.getInvoiceAnalytics(dbUserId),
          financialService.getFinancialOverview('month'),
          clientService.getClients()
        ]);

        // Combine all data
        const combinedData = {
          ...invoiceData,
          financial: financialData,
          clients: clientData
        };

        setAnalytics(combinedData);
        setError(null);
      } catch (err) {
        Logger.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.id]);

  // Calculate derived data from analytics
  const getStatusPercentages = () => {
    if (!analytics?.data?.statusDistribution) {
      return { paid: 0, pending: 0, overdue: 0 };
    }
    
    const { statusDistribution } = analytics.data;
    const total = Object.values(statusDistribution).reduce((sum, status) => sum + status.count, 0);
    
    if (total === 0) return { paid: 0, pending: 0, overdue: 0 };
    
    return {
      paid: Math.round(((statusDistribution.paid?.count || 0) / total) * 100),
      pending: Math.round(((statusDistribution.pending?.count || 0) / total) * 100),
      overdue: Math.round(((statusDistribution.overdue?.count || 0) / total) * 100)
    };
  };

  const getRecentPayments = () => {
    if (!analytics?.data?.invoices) return [];
    
    return analytics.data.invoices
      .filter(invoice => invoice.status === 'paid' && invoice.paid_date)
      .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date))
      .slice(0, 5)
      .map(invoice => ({
        company: invoice.client_name || 'Unknown Client',
        amount: `€${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        date: new Date(invoice.paid_date).toLocaleDateString(),
        status: 'paid'
      }));
  };

  const recentPayments = getRecentPayments();
  const statusPercentages = getStatusPercentages();
  
  // Calculate additional metrics
  const getPaymentMetrics = () => {
    if (!analytics?.data?.performanceMetrics) {
      return { averagePaymentTime: 15, collectionEfficiency: 85 };
    }
    
    return {
      averagePaymentTime: Math.round(analytics.data.performanceMetrics.averagePaymentTime || 15),
      collectionEfficiency: Math.round(analytics.data.performanceMetrics.collectionEfficiency || 85)
    };
  };
  
  const getOutstandingAmount = () => {
    if (!analytics?.data?.revenueAnalytics) {
      return '€100,000';
    }
    
    const outstanding = analytics.data.revenueAnalytics.pendingRevenue + analytics.data.revenueAnalytics.overdueRevenue;
    return `€${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };
  
  const paymentMetrics = getPaymentMetrics();
  const outstandingAmount = getOutstandingAmount();
  
  // Get top clients data
  const getTopClients = () => {
    if (!analytics?.data?.invoices) {
      return [
        { name: 'Acme Corporation', amount: '€24,500', percentage: 85 },
        { name: 'Globex Industries', amount: '€18,750', percentage: 65 },
        { name: 'Soylent Corp', amount: '€15,200', percentage: 52 },
        { name: 'Initech LLC', amount: '€12,800', percentage: 44 },
      ];
    }
    
    // Group invoices by client and calculate totals
    const clientTotals = {};
    analytics.data.invoices.forEach(invoice => {
      const clientName = invoice.client_name || 'Unknown Client';
      const amount = parseFloat(invoice.total_amount || 0);
      
      if (!clientTotals[clientName]) {
        clientTotals[clientName] = 0;
      }
      clientTotals[clientName] += amount;
    });
    
    // Convert to array and sort by amount
    const clientArray = Object.entries(clientTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
    
    // Calculate percentages based on highest amount
    const maxAmount = clientArray[0]?.amount || 1;
    
    return clientArray.map(client => ({
      name: client.name,
      amount: `€${client.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      percentage: Math.round((client.amount / maxAmount) * 100)
    }));
  };
  
  const topClients = getTopClients();
  
  // Calculate financial metrics from real data
  const getFinancialMetrics = () => {
    if (!analytics?.financial) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        cashFlow: { inflow: 0, outflow: 0 },
        financialHealth: 75
      };
    }
    
    const { financial } = analytics;
    const totalRevenue = financial.totalRevenue || 0;
    const totalExpenses = financial.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin),
      cashFlow: {
        inflow: totalRevenue,
        outflow: totalExpenses
      },
      financialHealth: Math.min(100, Math.max(0, 50 + profitMargin))
    };
  };
  
  const getClientMetrics = () => {
    if (!analytics?.clients?.data || !Array.isArray(analytics.clients.data)) {
      return {
        totalClients: 0,
        activeClients: 0,
        newClients: 0,
        clientGrowth: 0
      };
    }
    
    const clients = analytics.clients.data;
    const totalClients = clients.length;
    const activeClients = clients.filter(client => client.status === 'active').length;
    const newClients = clients.filter(client => {
      const createdDate = new Date(client.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    const clientGrowth = totalClients > 0 ? (newClients / totalClients) * 100 : 0;
    
    return {
      totalClients,
      activeClients,
      newClients,
      clientGrowth: Math.round(clientGrowth)
    };
  };
  
  const financialMetrics = getFinancialMetrics();
  const clientMetrics = getClientMetrics();
  
  // Fallback data for demo
  const fallbackPayments = [
    {
      company: 'Acme Corporation',
      amount: '€3,450.00',
      date: 'Today',
      status: 'paid',
    },
    {
      company: 'Globex Industries',
      amount: '€5,780.00',
      date: '2 days ago',
      status: 'paid',
    },
    {
      company: 'Soylent Corp',
      amount: '€2,100.00',
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
          <h3 className='mt-2 text-error font-medium text-gray-900'>{error}</h3>
          <p className='mt-1 text-body text-gray-500'>We'll show demo data while we resolve this issue.</p>
          <div className='mt-4 space-x-2'>
            <button
              onClick={() => {
                setError(null);
                setAnalytics({ data: null }); // This will trigger fallback data
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Show Demo Data
            </button>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Breadcrumb */}
        <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2 text-nav-text'>
              <button 
                onClick={() => navigate('/dashboard')}
                className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors'
              >
                <HomeIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <ChevronRightIcon className='h-4 w-4 text-gray-400' />
              <span className="text-gray-600 font-bold">Analytics</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-white border-b border-gray-200'>
          <div className='px-8 py-6'>
            <div className='flex space-x-6'>
              <button
                onClick={() => setActiveTab('invoice-analytics')}
                className={`pb-2 text-nav-text font-medium ${
                  activeTab === 'invoice-analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoice Analytics
              </button>
              <button
                onClick={() => setActiveTab('advanced-analytics')}
                className={`pb-2 text-nav-text font-medium ${
                  activeTab === 'advanced-analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Advanced Financial Analytics
              </button>
              <button
                onClick={() => setActiveTab('forecasting')}
                className={`pb-2 text-nav-text font-medium ${
                  activeTab === 'forecasting'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Financial Forecasting
              </button>
              <button
                onClick={() => setActiveTab('reports-and-insights')}
                className={`pb-2 text-nav-text font-medium ${
                  activeTab === 'reports-and-insights'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports & Insights
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
                    <h3 className='text-card-title font-semibold text-black'>Invoice Status</h3>
                    <div className='flex items-center text-body text-gray-500'>
                      <span>This Month</span>
                      <ChevronDownIcon className='ml-2 h-4 w-4' />
                    </div>
                  </div>

                  {/* Donut Chart */}
                  <div className='flex items-center justify-center mb-6'>
                    <div className='relative w-48 h-48'>
                      <svg className='w-48 h-48 transform -rotate-90' viewBox='0 0 100 100'>
                        {(() => {
                          const circumference = 2 * Math.PI * 40; // r=40
                          const paidLength = (statusPercentages.paid / 100) * circumference;
                          const pendingLength = (statusPercentages.pending / 100) * circumference;
                          const overdueLength = (statusPercentages.overdue / 100) * circumference;
                          
                          return (
                            <>
                              {/* Paid segment */}
                              <circle
                                cx='50'
                                cy='50'
                                r='40'
                                stroke='#22C55E'
                                strokeWidth='12'
                                fill='transparent'
                                strokeDasharray={`${paidLength} ${circumference - paidLength}`}
                                strokeDashoffset='0'
                              />
                              {/* Pending segment */}
                              <circle
                                cx='50'
                                cy='50'
                                r='40'
                                stroke='#F59E0B'
                                strokeWidth='12'
                                fill='transparent'
                                strokeDasharray={`${pendingLength} ${circumference - pendingLength}`}
                                strokeDashoffset={`-${paidLength}`}
                              />
                              {/* Overdue segment */}
                              <circle
                                cx='50'
                                cy='50'
                                r='40'
                                stroke='#EF4444'
                                strokeWidth='12'
                                fill='transparent'
                                strokeDasharray={`${overdueLength} ${circumference - overdueLength}`}
                                strokeDashoffset={`-${paidLength + pendingLength}`}
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>

                  <div className='flex justify-between text-body text-gray-500 mb-4'>
                    <span>Paid</span>
                    <span>Pending</span>
                    <span>Overdue</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-card-title font-semibold text-green-600'>{statusPercentages.paid}%</span>
                    <span className='text-card-title font-semibold text-yellow-500'>{statusPercentages.pending}%</span>
                    <span className='text-card-title font-semibold text-red-500'>{statusPercentages.overdue}%</span>
                  </div>
                </div>

                {/* Invoice Aging Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Invoice Aging</h3>
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
                    <span className='text-body text-gray-500'>
                      Total Outstanding:{' '}
                      <span className='font-semibold text-gray-900'>{outstandingAmount}</span>
                    </span>
                    <div className='flex items-center text-blue-600 text-body'>
                      <span>View Details</span>
                      <ArrowRightIcon className='ml-1 h-4 w-4' />
                    </div>
                  </div>
                </div>

                {/* Recent Payments Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Recent Payments</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>View All</span>
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
                          <div className='text-body text-gray-500'>{payment.date}</div>
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
                    <h3 className='text-card-title font-semibold text-black'>Payment Velocity</h3>
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
                    <span className='text-body text-gray-500'>Avg Payment Time</span>
                    <div className='flex items-center'>
                      <span className='text-card-title font-semibold text-black mr-2'>{paymentMetrics.averagePaymentTime}</span>
                      <span className='text-body text-gray-500'>days</span>
                      <ArrowTrendingDownIcon className='ml-2 h-4 w-4 text-green-500' />
                    </div>
                  </div>
                </div>

                {/* Top Clients */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Top Clients</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>View All</span>
                  </div>

                  <div className='space-y-4'>
                    {topClients.map((client, index) => (
                      <div key={index} className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                          <span className='text-caption font-medium text-blue-600'>{index + 1}</span>
                        </div>
                        <div className='flex-1'>
                          <div className='font-medium text-black text-body'>{client.name}</div>
                          <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                            <div
                              className='bg-blue-600 h-1.5 rounded-full'
                              style={{ width: `${client.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className='font-semibold text-black text-body'>{client.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Conversion */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Invoice Conversion</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Details</span>
                  </div>

                  {/* Bar Chart */}
                  <div className='h-48 flex items-end justify-center space-x-3 mb-4'>
                    {[85, 92, 78, 88, 95, 82, 90].map((height, index) => (
                      <div key={index} className='flex flex-col items-center'>
                        <div
                          className='w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t'
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className='text-caption text-gray-500 mt-2'>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-card-title font-semibold text-green-600'>142</div>
                      <div className='text-caption text-gray-500'>Sent</div>
                    </div>
                    <div>
                      <div className='text-card-title font-semibold text-yellow-500'>24.8</div>
                      <div className='text-caption text-gray-500'>Viewed</div>
                    </div>
                    <div>
                      <div className='text-card-title font-semibold text-red-500'>18.5</div>
                      <div className='text-caption text-gray-500'>Paid</div>
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
                    <h3 className='text-card-title font-semibold text-black'>Revenue Breakdown</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Details</span>
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
                        <span className='text-body text-gray-600'>Services</span>
                      </div>
                      <span className='text-body font-medium'>€{(financialMetrics.totalRevenue * 0.45).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
                        <span className='text-body text-gray-600'>Products</span>
                      </div>
                      <span className='text-body font-medium'>€{(financialMetrics.totalRevenue * 0.32).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-3 h-3 bg-yellow-500 rounded-full mr-2'></div>
                        <span className='text-body text-gray-600'>Consulting</span>
                      </div>
                      <span className='text-body font-medium'>€{(financialMetrics.totalRevenue * 0.23).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Expenses */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Monthly Expenses</h3>
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
                        <span className='text-caption text-gray-500 mt-2'>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='text-center'>
                    <div className='text-page-title font-bold text-black'>€{(financialMetrics.totalExpenses / 12).toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                    <div className='text-body text-gray-500'>Average Monthly</div>
                  </div>
                </div>

                {/* Cash Flow Analysis */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Cash Flow Analysis</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Report</span>
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
                      <div className='text-card-title font-semibold text-green-600'>+€{financialMetrics.cashFlow.inflow.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                      <div className='text-caption text-gray-500'>Inflow</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-card-title font-semibold text-red-500'>-€{financialMetrics.cashFlow.outflow.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                      <div className='text-caption text-gray-500'>Outflow</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Margin Trends, Financial Health, Expense Breakdown */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Profit Margin Trends */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Profit Margin Trends</h3>
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
                    <div className='text-page-title font-bold text-blue-600'>{Math.abs(financialMetrics.profitMargin)}%</div>
                    <div className='text-body text-gray-500'>Current Margin</div>
                    <div className='flex items-center justify-center mt-2'>
                      {financialMetrics.profitMargin >= 0 ? (
                        <ArrowTrendingUpIcon className='h-4 w-4 text-green-500 mr-1' />
                      ) : (
                        <ArrowTrendingDownIcon className='h-4 w-4 text-red-500 mr-1' />
                      )}
                      <span className={`text-body ${financialMetrics.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {financialMetrics.profitMargin >= 0 ? '+' : ''}{financialMetrics.profitMargin}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Health */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Financial Health</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Details</span>
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
                          strokeDasharray={`${(financialMetrics.financialHealth / 100) * 251} 251`}
                          strokeLinecap='round'
                        />
                      </svg>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <span className='text-page-title font-bold text-blue-600'>{Math.round(financialMetrics.financialHealth)}</span>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-body text-gray-600'>Cash Flow</span>
                      <span className='text-body font-medium text-green-600'>Excellent</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-body text-gray-600'>Debt Ratio</span>
                      <span className='text-body font-medium text-yellow-600'>Good</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-body text-gray-600'>Liquidity</span>
                      <span className='text-body font-medium text-green-600'>Very Good</span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Expense Breakdown</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  <div className='space-y-4'>
                    {[
                      {
                        category: 'Salaries & Benefits',
                        amount: '€12,500',
                        percentage: 68,
                        color: 'bg-blue-500',
                      },
                      {
                        category: 'Operations',
                        amount: '€3,200',
                        percentage: 17,
                        color: 'bg-green-500',
                      },
                      {
                        category: 'Marketing',
                        amount: '€1,800',
                        percentage: 10,
                        color: 'bg-yellow-500',
                      },
                      {
                        category: 'Software & Tools',
                        amount: '€1,000',
                        percentage: 5,
                        color: 'bg-purple-500',
                      },
                    ].map((expense, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-body text-gray-600'>{expense.category}</span>
                          <span className='text-body font-medium'>{expense.amount}</span>
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
                    <h3 className='text-card-title font-semibold text-black'>6-Month Revenue Projection</h3>
                    <div className='flex items-center space-x-2'>
                      <span className='text-body text-gray-500'>Projected</span>
                      <span className='text-body text-gray-500'>Actual</span>
                      <span className='text-body text-gray-500'>Target</span>
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
                      <div className='text-card-title font-bold text-blue-600'>€225,000</div>
                      <div className='text-body text-gray-500'>6-Month Projected</div>
                    </div>
                    <div>
                      <div className='text-card-title font-bold text-green-600'>€238,000</div>
                      <div className='text-body text-gray-500'>Expected</div>
                    </div>
                    <div>
                      <div className='text-card-title font-bold text-yellow-600'>€195,000</div>
                      <div className='text-body text-gray-500'>Conservative</div>
                    </div>
                  </div>
                </div>

                {/* Growth Trend Analysis */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-card-title font-semibold text-black'>Growth Trend Analysis</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>View Report</span>
                  </div>

                  <div className='space-y-6'>
                    <div className='text-center'>
                      <div className='text-page-title font-bold text-green-600 mb-2'>+23.5%</div>
                      <div className='text-body text-gray-500'>Quarterly Growth Rate</div>
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
                          <span className='text-body text-gray-600'>{item.metric}</span>
                          <div className='flex items-center'>
                            <span className={`text-body font-medium ${item.color}`}>
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
                    <h3 className='text-card-title font-semibold text-black'>Quarterly Targets</h3>
                    <ChevronDownIcon className='h-4 w-4 text-gray-400' />
                  </div>

                  <div className='space-y-4'>
                    {[
                      { quarter: 'Q1 2024', target: '€85,000', actual: '€92,500', progress: 109 },
                      { quarter: 'Q2 2024', target: '€95,000', actual: '€88,200', progress: 93 },
                      { quarter: 'Q3 2024', target: '€105,000', actual: '€98,750', progress: 94 },
                      { quarter: 'Q4 2024', target: '€115,000', actual: '-', progress: 0 },
                    ].map((item, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-body font-medium'>{item.quarter}</span>
                          <span className='text-body text-gray-600'>{item.target}</span>
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
                        <div className='flex justify-between text-caption'>
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
                    <h3 className='text-card-title font-semibold text-black'>Budget Planning</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Edit Budget</span>
                  </div>

                  <div className='space-y-4'>
                    <div className='text-center mb-4'>
                      <div className='text-page-title font-bold text-black'>€418,000</div>
                      <div className='text-body text-gray-500'>Annual Budget</div>
                    </div>

                    {[
                      {
                        category: 'Marketing & Sales',
                        allocated: '€45,000',
                        spent: '€38,200',
                        percentage: 85,
                      },
                      {
                        category: 'Operations',
                        allocated: '€125,000',
                        spent: '€98,500',
                        percentage: 79,
                      },
                      {
                        category: 'Research & Development',
                        allocated: '€85,000',
                        spent: '€72,300',
                        percentage: 85,
                      },
                      {
                        category: 'Administration',
                        allocated: '€35,000',
                        spent: '€28,900',
                        percentage: 83,
                      },
                    ].map((item, index) => (
                      <div key={index} className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-body text-gray-600'>{item.category}</span>
                          <span className='text-body font-medium'>{item.allocated}</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-blue-500 h-2 rounded-full'
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className='flex justify-between text-caption text-gray-500'>
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
                    <h3 className='text-card-title font-semibold text-black'>Scenario Modeling</h3>
                    <span className='text-blue-600 text-body cursor-pointer'>Create New</span>
                  </div>

                  <div className='space-y-4'>
                    {[
                      {
                        scenario: 'Best Case',
                        revenue: '€485,000',
                        probability: '25%',
                        color: 'text-green-600',
                      },
                      {
                        scenario: 'Most Likely',
                        revenue: '€425,000',
                        probability: '50%',
                        color: 'text-blue-600',
                      },
                      {
                        scenario: 'Conservative',
                        revenue: '€385,000',
                        probability: '25%',
                        color: 'text-yellow-600',
                      },
                    ].map((scenario, index) => (
                      <div key={index} className='p-4 border border-gray-200 rounded-lg'>
                        <div className='flex justify-between items-center mb-2'>
                          <span className='font-medium text-black'>{scenario.scenario}</span>
                          <span className='text-body text-gray-500'>{scenario.probability}</span>
                        </div>
                        <div className={`text-card-title font-bold ${scenario.color}`}>
                          {scenario.revenue}
                        </div>
                        <div className='text-caption text-gray-500 mt-1'>Annual Revenue Projection</div>
                      </div>
                    ))}
                  </div>

                  <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                    <div className='text-body font-medium text-black mb-2'>Key Assumptions:</div>
                    <ul className='text-caption text-gray-600 space-y-1'>
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

          {/* Reports & Insights Tab */}
          {activeTab === 'reports-and-insights' && (
            <div className='space-y-8'>
              {/* Header Section */}
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-2xl font-bold text-black'>Reports & Insights</h2>
                  <p className='text-body text-gray-600 mt-1'>Comprehensive business analytics and reporting</p>
                </div>
                <div className='flex space-x-3'>
                  <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                    Export Report
                  </button>
                  <button className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'>
                    Schedule Report
                  </button>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-500 uppercase tracking-wide'>Total Revenue</p>
                      <p className='text-2xl font-bold text-black mt-1'>€{financialMetrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className='p-3 bg-green-100 rounded-lg'>
                      <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                      </svg>
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    <span className='text-green-600 text-caption font-medium'>+12.5%</span>
                    <span className='text-gray-500 text-caption ml-2'>vs last month</span>
                  </div>
                </div>

                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-500 uppercase tracking-wide'>Active Clients</p>
                      <p className='text-2xl font-bold text-black mt-1'>{clientMetrics.activeClients}</p>
                    </div>
                    <div className='p-3 bg-blue-100 rounded-lg'>
                      <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                      </svg>
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    <span className='text-green-600 text-caption font-medium'>+{clientMetrics.newClients}</span>
                    <span className='text-gray-500 text-caption ml-2'>new this month</span>
                  </div>
                </div>

                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-500 uppercase tracking-wide'>Profit Margin</p>
                      <p className='text-2xl font-bold text-black mt-1'>{financialMetrics.profitMargin}%</p>
                    </div>
                    <div className='p-3 bg-purple-100 rounded-lg'>
                      <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                      </svg>
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    <span className={`text-caption font-medium ${
                      financialMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {financialMetrics.profitMargin >= 0 ? '+' : ''}{financialMetrics.profitMargin}%
                    </span>
                    <span className='text-gray-500 text-caption ml-2'>vs target</span>
                  </div>
                </div>

                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-500 uppercase tracking-wide'>Financial Health</p>
                      <p className='text-2xl font-bold text-black mt-1'>{financialMetrics.financialHealth}/100</p>
                    </div>
                    <div className='p-3 bg-orange-100 rounded-lg'>
                      <svg className='w-6 h-6 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                      </svg>
                    </div>
                  </div>
                  <div className='flex items-center mt-4'>
                    <span className={`text-caption font-medium ${
                      financialMetrics.financialHealth >= 70 ? 'text-green-600' : 
                      financialMetrics.financialHealth >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {financialMetrics.financialHealth >= 70 ? 'Excellent' : 
                       financialMetrics.financialHealth >= 50 ? 'Good' : 'Needs Attention'}
                    </span>
                    <span className='text-gray-500 text-caption ml-2'>health score</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary Report */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-card-title font-semibold text-black'>Executive Summary</h3>
                  <div className='flex items-center space-x-2'>
                    <span className='text-caption text-gray-500'>Last updated: {new Date().toLocaleDateString()}</span>
                    <button className='p-2 text-gray-400 hover:text-gray-600'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div>
                    <h4 className='text-body font-medium text-black mb-3'>Key Performance Indicators</h4>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>Monthly Recurring Revenue</span>
                        <span className='font-semibold text-black'>€{Math.round(financialMetrics.totalRevenue / 12).toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>Customer Acquisition Cost</span>
                        <span className='font-semibold text-black'>€{Math.round(financialMetrics.totalExpenses / Math.max(clientMetrics.newClients, 1)).toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>Average Revenue Per Client</span>
                        <span className='font-semibold text-black'>€{Math.round(financialMetrics.totalRevenue / Math.max(clientMetrics.totalClients, 1)).toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>Cash Flow Ratio</span>
                        <span className='font-semibold text-black'>{(financialMetrics.cashFlow.inflow / Math.max(financialMetrics.cashFlow.outflow, 1)).toFixed(2)}:1</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='text-body font-medium text-black mb-3'>Business Insights</h4>
                    <div className='space-y-3'>
                      <div className='p-3 border-l-4 border-green-500 bg-green-50'>
                        <p className='text-caption font-medium text-green-800'>Revenue Growth</p>
                        <p className='text-caption text-green-700 mt-1'>Your revenue has increased by 12.5% compared to last month, indicating strong business growth.</p>
                      </div>
                      <div className='p-3 border-l-4 border-blue-500 bg-blue-50'>
                        <p className='text-caption font-medium text-blue-800'>Client Retention</p>
                        <p className='text-caption text-blue-700 mt-1'>You have {clientMetrics.activeClients} active clients with {clientMetrics.newClients} new acquisitions this month.</p>
                      </div>
                      <div className='p-3 border-l-4 border-purple-500 bg-purple-50'>
                        <p className='text-caption font-medium text-purple-800'>Profitability</p>
                        <p className='text-caption text-purple-700 mt-1'>Your profit margin of {financialMetrics.profitMargin}% is {financialMetrics.profitMargin >= 20 ? 'excellent' : financialMetrics.profitMargin >= 10 ? 'good' : 'below industry average'}.</p>
                      </div>
                      <div className='p-3 border-l-4 border-orange-500 bg-orange-50'>
                        <p className='text-caption font-medium text-orange-800'>Financial Health</p>
                        <p className='text-caption text-orange-700 mt-1'>Your financial health score of {financialMetrics.financialHealth}/100 indicates {financialMetrics.financialHealth >= 70 ? 'strong' : financialMetrics.financialHealth >= 50 ? 'moderate' : 'weak'} financial stability.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Report Builder */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-card-title font-semibold text-black'>Custom Report Builder</h3>
                  <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                    Create Report
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>Report Type</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>Financial Summary</option>
                      <option>Client Analysis</option>
                      <option>Revenue Breakdown</option>
                      <option>Performance Metrics</option>
                      <option>Custom Dashboard</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>Date Range</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                      <option>Last 6 months</option>
                      <option>Last year</option>
                      <option>Custom range</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>Export Format</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>PDF Report</option>
                      <option>Excel Spreadsheet</option>
                      <option>CSV Data</option>
                      <option>PowerPoint Presentation</option>
                    </select>
                  </div>
                </div>

                <div className='mt-6'>
                  <label className='block text-body font-medium text-black mb-2'>Include Sections</label>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    {[
                      'Revenue Analysis',
                      'Client Metrics',
                      'Financial Health',
                      'Cash Flow',
                      'Profit Margins',
                      'Growth Trends',
                      'Benchmarks',
                      'Recommendations'
                    ].map((section) => (
                      <label key={section} className='flex items-center space-x-2'>
                        <input type='checkbox' defaultChecked className='rounded border-gray-300 text-blue-600 focus:ring-blue-500' />
                        <span className='text-caption text-gray-700'>{section}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benchmark Comparisons */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                <h3 className='text-card-title font-semibold text-black mb-6'>Industry Benchmarks</h3>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h4 className='text-body font-medium text-black mb-4'>Your Performance vs Industry Average</h4>
                    <div className='space-y-4'>
                      {[
                        { metric: 'Profit Margin', your: financialMetrics.profitMargin, industry: 18, unit: '%' },
                        { metric: 'Client Retention', your: 85, industry: 75, unit: '%' },
                        { metric: 'Revenue Growth', your: 12.5, industry: 8.2, unit: '%' },
                        { metric: 'Financial Health', your: financialMetrics.financialHealth, industry: 65, unit: '/100' }
                      ].map((item, index) => (
                        <div key={index} className='flex items-center justify-between'>
                          <span className='text-body text-gray-700'>{item.metric}</span>
                          <div className='flex items-center space-x-4'>
                            <div className='text-right'>
                              <div className='text-body font-semibold text-black'>{item.your}{item.unit}</div>
                              <div className='text-caption text-gray-500'>You</div>
                            </div>
                            <div className='text-right'>
                              <div className='text-body text-gray-600'>{item.industry}{item.unit}</div>
                              <div className='text-caption text-gray-500'>Industry</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-caption font-medium ${
                              item.your > item.industry ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.your > item.industry ? '+' : ''}{(item.your - item.industry).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className='text-body font-medium text-black mb-4'>Recommendations</h4>
                    <div className='space-y-3'>
                      <div className='p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500'>
                        <p className='text-caption font-medium text-blue-800'>Optimize Cash Flow</p>
                        <p className='text-caption text-blue-700 mt-1'>Consider implementing automated payment reminders to improve cash flow timing.</p>
                      </div>
                      <div className='p-3 bg-green-50 rounded-lg border-l-4 border-green-500'>
                        <p className='text-caption font-medium text-green-800'>Expand Client Base</p>
                        <p className='text-caption text-green-700 mt-1'>Your client retention is above average. Focus on acquiring new clients to scale revenue.</p>
                      </div>
                      <div className='p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500'>
                        <p className='text-caption font-medium text-purple-800'>Cost Management</p>
                        <p className='text-caption text-purple-700 mt-1'>Review operational expenses to improve profit margins further.</p>
                      </div>
                    </div>
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
