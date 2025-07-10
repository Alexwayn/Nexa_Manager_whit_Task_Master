import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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
import {
  ChevronDownIcon,
  ArrowRightIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  BanknotesIcon,
  HomeIcon,
  ChevronRightIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';

// Lazy load heavy components
const ReportsDashboard = lazy(() => import('@components/analytics/ReportsDashboard'));
const AdvancedVisualizations = lazy(() => import('@components/analytics/AdvancedVisualizations'));
const InteractiveFinancialCharts = lazy(() => import('@components/analytics/InteractiveFinancialCharts'));

// Cache for analytics data
const analyticsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Analytics = () => {
  const { t, i18n } = useTranslation('analytics');



  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice-analytics');
  const [cacheTimestamp, setCacheTimestamp] = useState(null);

  // Memoized cache key generator
  const getCacheKey = useCallback((userId, activeTab) => {
    return `analytics_${userId}_${activeTab}`;
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp) => {
    return timestamp && (Date.now() - timestamp) < CACHE_DURATION;
  }, []);

  // Optimized fetch function with caching
  const fetchAnalytics = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(user.id, activeTab);
    const cachedData = analyticsCache.get(cacheKey);
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cachedData && isCacheValid(cachedData.timestamp)) {
      setAnalytics(cachedData.data);
      setCacheTimestamp(cachedData.timestamp);
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
        userEmail: user.primaryEmailAddress?.emailAddress,
        fromCache: false
      });

      // Try to fetch real data first, then fallback to sample data
      try {
        const invoiceResult = await invoiceAnalyticsService.getInvoiceAnalytics(dbUserId);
        const financialResult = await financialService.getFinancialMetrics(dbUserId);
        const clientResult = await clientService.getClientMetrics(dbUserId);

        if (invoiceResult.success && financialResult.success && clientResult.success) {
          const realData = {
            data: invoiceResult.data,
            financial: financialResult.data,
            clients: clientResult.data
          };
          setAnalytics(realData);
          setLoading(false);
          
          // Cache the real data
          const timestamp = Date.now();
          analyticsCache.set(cacheKey, { data: realData, timestamp });
          setCacheTimestamp(timestamp);
          
          Logger.info('Real analytics data loaded successfully');
          return;
        }
      } catch (realDataError) {
        Logger.warn('Failed to load real data, using sample data:', realDataError);
      }

      // Fallback to comprehensive sample data (following Invoices page pattern)
      const sampleData = {
        data: {
          invoices: [
            { id: 'INV-2024-089', client_name: 'TechCorp Solutions', total_amount: 4500, status: 'paid', created_at: '2024-01-15' },
            { id: 'INV-2024-088', client_name: 'Digital Dynamics', total_amount: 3200, status: 'paid', created_at: '2024-01-14' },
            { id: 'INV-2024-087', client_name: 'Innovation Labs', total_amount: 5800, status: 'paid', created_at: '2024-01-13' },
            { id: 'INV-2024-086', client_name: 'StartupX', total_amount: 2100, status: 'pending', created_at: '2024-01-12' },
            { id: 'INV-2024-085', client_name: 'Enterprise Co', total_amount: 7500, status: 'paid', created_at: '2024-01-11' },
            { id: 'INV-2024-084', client_name: 'TechCorp Solutions', total_amount: 6200, status: 'paid', created_at: '2024-01-10' },
            { id: 'INV-2024-083', client_name: 'Digital Dynamics', total_amount: 4800, status: 'overdue', created_at: '2024-01-09' },
            { id: 'INV-2024-082', client_name: 'Innovation Labs', total_amount: 3900, status: 'paid', created_at: '2024-01-08' },
            { id: 'INV-2024-081', client_name: 'StartupX', total_amount: 2800, status: 'pending', created_at: '2024-01-07' },
            { id: 'INV-2024-080', client_name: 'Enterprise Co', total_amount: 5400, status: 'paid', created_at: '2024-01-06' },
            { id: 'INV-2024-079', client_name: 'TechCorp Solutions', total_amount: 7200, status: 'paid', created_at: '2024-01-05' },
            { id: 'INV-2024-078', client_name: 'Digital Dynamics', total_amount: 3600, status: 'paid', created_at: '2024-01-04' },
            { id: 'INV-2024-077', client_name: 'Innovation Labs', total_amount: 4200, status: 'pending', created_at: '2024-01-03' },
            { id: 'INV-2024-076', client_name: 'StartupX', total_amount: 1900, status: 'paid', created_at: '2024-01-02' },
            { id: 'INV-2024-075', client_name: 'Enterprise Co', total_amount: 6800, status: 'overdue', created_at: '2024-01-01' }
          ],
          totalRevenue: 285750,
          totalInvoices: 142,
          statusBreakdown: {
            paid: 89,
            pending: 28,
            overdue: 15,
            draft: 10
          }
        },
        financial: {
          totalRevenue: 285750,
          totalExpenses: 198250,
          netProfit: 87500,
          profitMargin: 30.6,
          cashFlow: {
            inflow: 285750,
            outflow: 198250,
            net: 87500
          },
          financialHealth: 78
        },
        clients: {
          totalClients: 68,
          activeClients: 52,
          newClients: 8,
          clientGrowth: 13.8
        }
      };
      
      // Set sample data as fallback
      const initialData = sampleData;
      
      setAnalytics(initialData);
      setLoading(false);
      
      // Cache the data
      const timestamp = Date.now();
      analyticsCache.set(cacheKey, { data: initialData, timestamp });
      setCacheTimestamp(timestamp);
      
    } catch (err) {
      Logger.error('Error loading analytics:', String(err?.message || err || 'Unknown error'));
      setError(err.message || 'An unexpected error occurred while loading analytics');
      // Set null like Invoices page does when data loading fails
      setAnalytics(null);
      setLoading(false);
    }
  }, [user?.id, activeTab, getCacheKey, isCacheValid]);

  // Load analytics on component mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate outstanding amount from real data
  const outstandingAmount = useMemo(() => {
    if (!analytics?.data?.invoices || !Array.isArray(analytics.data.invoices)) {
      return 0;
    }
    
    return analytics.data.invoices
      .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
      .reduce((total, invoice) => total + parseFloat(invoice.total_amount || 0), 0);
  }, [analytics?.data?.invoices]);

  // Get top clients from real data
  const getTopClients = () => {
    if (!analytics?.data?.invoices || !Array.isArray(analytics.data.invoices)) {
      return [];
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
    if (!analytics?.financial || analytics.financial === null) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        cashFlow: { inflow: 0, outflow: 0 },
        financialHealth: 75
      };
    }
    
    const financial = analytics.financial;
    const totalRevenue = Number(financial?.totalRevenue || 0);
    const totalExpenses = Number(financial?.totalExpenses || 0);
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
  
  // Comprehensive sample data for demo
  const fallbackPayments = [
    {
      company: 'TechCorp Solutions',
      amount: '€4,500.00',
      date: 'Today',
      status: 'paid',
    },
    {
      company: 'Digital Dynamics',
      amount: '€3,200.00',
      date: '1 day ago',
      status: 'paid',
    },
    {
      company: 'Innovation Labs',
      amount: '€5,800.00',
      date: '2 days ago',
      status: 'paid',
    },
    {
      company: 'Enterprise Co',
      amount: '€7,500.00',
      date: '4 days ago',
      status: 'paid',
    },
    {
      company: 'StartupX',
      amount: '€2,100.00',
      date: '1 week ago',
      status: 'paid',
    },
  ];

  // Refresh analytics function
  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Memoized calculations for performance optimization
  const statusPercentages = useMemo(() => {
    if (!analytics?.data?.statusDistribution) {
      return { paid: 65, pending: 25, overdue: 10 }; // Fallback data
    }
    
    const { statusDistribution } = analytics.data;
    const total = Object.values(statusDistribution).reduce((sum, status) => sum + (status?.count || 0), 0);
    
    if (total === 0) return { paid: 65, pending: 25, overdue: 10 };
    
    const paid = Math.round(((statusDistribution.paid?.count || 0) / total) * 100) || 0;
    const pending = Math.round(((statusDistribution.pending?.count || 0) / total) * 100) || 0;
    const overdue = Math.round(((statusDistribution.overdue?.count || 0) / total) * 100) || 0;
    
    return {
      paid: Number(paid),
      pending: Number(pending),
      overdue: Number(overdue)
    };
  }, [analytics?.data?.statusDistribution]);

  const recentPayments = useMemo(() => {
    if (!analytics?.data?.invoices) return fallbackPayments;
    
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
  }, [analytics?.data?.invoices, fallbackPayments]);
  
  // Memoized additional metrics
  const paymentMetrics = useMemo(() => {
    if (!analytics?.data?.performanceMetrics) {
      return { averagePaymentTime: 12, collectionEfficiency: 92 };
    }
    
    const avgTime = Number(analytics.data.performanceMetrics.averagePaymentTime) || 12;
    const efficiency = Number(analytics.data.performanceMetrics.collectionEfficiency) || 92;
    
    return {
      averagePaymentTime: Math.round(avgTime),
      collectionEfficiency: Math.round(efficiency)
    };
  }, [analytics?.data?.performanceMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchAnalytics(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Breadcrumb */}
        <div className="bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8">
          <div className="flex items-center space-x-2 text-base">
            <HomeIcon className="h-5 w-5 text-blue-600" />
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Dashboard
            </button>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-bold">{t('title')}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-page-title">{t('title')}</h1>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('invoice-analytics')}
                className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                  activeTab === 'invoice-analytics'
                    ? 'text-[#357AF3] border-[#357AF3]'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                {t('tabs.overview.name')}
              </button>
              <button
                onClick={() => setActiveTab('forecasting')}
                className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                  activeTab === 'forecasting'
                    ? 'text-[#357AF3] border-[#357AF3]'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                {t('tabs.forecasting.name')}
              </button>
              <button
                onClick={() => setActiveTab('reports-and-insights')}
                className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                  activeTab === 'reports-and-insights'
                    ? 'text-[#357AF3] border-[#357AF3]'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Reports & Insights
              </button>
              <button
                onClick={() => setActiveTab('interactive-charts')}
                className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                  activeTab === 'interactive-charts'
                    ? 'text-[#357AF3] border-[#357AF3]'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                {t('charts.interactiveAnalytics')}
              </button>
            </div>
          </div>

          <div className="px-8 py-8">

            {/* Tab Content */}
            {activeTab === 'invoice-analytics' && (
              <div className="space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                          <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-card-title text-green-700">{t('kpis.totalRevenue')}</p>
                        <p className="text-kpi-value text-green-900">€{financialMetrics.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-blue-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-card-title text-blue-700">{t('kpis.totalInvoices')}</p>
                        <p className="text-kpi-value text-blue-900">{analytics?.data?.invoices?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-yellow-200 hover:border-yellow-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                          <ClockIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-card-title text-yellow-700">{t('kpis.outstanding')}</p>
                        <p className="text-kpi-value text-yellow-900">€{outstandingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200 hover:border-purple-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <UserGroupIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-card-title text-purple-700">{t('kpis.activeClients')}</p>
                        <p className="text-kpi-value text-purple-900">{clientMetrics.activeClients}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* First Row - Invoice Status, Invoice Aging, Recent Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Invoice Status Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.invoiceStatus.title')}</h3>
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    </div>

                    {/* Donut Chart */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="35"
                            stroke="#10B981"
                            strokeWidth="15"
                            fill="transparent"
                            strokeDasharray={`${statusPercentages.paid * 2.2} 220`}
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="35"
                            stroke="#F59E0B"
                            strokeWidth="15"
                            fill="transparent"
                            strokeDasharray={`${statusPercentages.pending * 2.2} 220`}
                            strokeDashoffset={`-${statusPercentages.paid * 2.2}`}
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="35"
                            stroke="#EF4444"
                            strokeWidth="15"
                            fill="transparent"
                            strokeDasharray={`${statusPercentages.overdue * 2.2} 220`}
                            strokeDashoffset={`-${(statusPercentages.paid + statusPercentages.pending) * 2.2}`}
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-lg font-semibold text-green-500">{statusPercentages.paid}%</span>
                      <span className="text-lg font-semibold text-yellow-500">{statusPercentages.pending}%</span>
                      <span className="text-lg font-semibold text-red-500">{statusPercentages.overdue}%</span>
                    </div>
                  </div>

                  {/* Invoice Aging Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-indigo-200 hover:border-indigo-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.invoiceAging.title')}</h3>
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    </div>

                    <div className="h-64 flex items-end justify-center space-x-4 mb-4">
                      <div className="w-8 bg-blue-600 h-32 rounded-t"></div>
                      <div className="w-8 bg-gray-400 h-24 rounded-t"></div>
                      <div className="w-8 bg-gray-300 h-16 rounded-t"></div>
                      <div className="w-8 bg-gray-300 h-20 rounded-t"></div>
                      <div className="w-8 bg-gray-300 h-12 rounded-t"></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {t('kpis.totalOutstanding')}:{' '}
                        <span className="font-semibold text-gray-900">€{outstandingAmount.toLocaleString()}</span>
                      </span>
                      <div className="flex items-center text-blue-600 text-sm">
                        <span>{t('clientAnalytics.viewDetails')}</span>
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Payments Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-emerald-200 hover:border-emerald-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.recentPayments.title')}</h3>
                      <span className="text-blue-600 text-sm cursor-pointer">{t('clientAnalytics.viewAll')}</span>
                    </div>

                    <div className="space-y-4">
                      {recentPayments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-action-title text-black">{payment.company}</div>
                            <div className="text-subtitle text-gray-500">{payment.date}</div>
                          </div>
                          <div className="text-card-metric text-black">{payment.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Second Row - Payment Velocity, Top Clients, Invoice Conversion */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Payment Velocity */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-cyan-200 hover:border-cyan-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.paymentVelocity.title')}</h3>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Line Chart Placeholder */}
                    <div className="h-48 mb-4">
                      <svg className="w-full h-full" viewBox="0 0 300 150">
                        <polyline
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2"
                          points="20,120 60,80 100,90 140,60 180,70 220,40 260,50"
                        />
                        <circle cx="20" cy="120" r="3" fill="#3B82F6" />
                        <circle cx="60" cy="80" r="3" fill="#3B82F6" />
                        <circle cx="100" cy="90" r="3" fill="#3B82F6" />
                        <circle cx="140" cy="60" r="3" fill="#3B82F6" />
                        <circle cx="180" cy="70" r="3" fill="#3B82F6" />
                        <circle cx="220" cy="40" r="3" fill="#3B82F6" />
                        <circle cx="260" cy="50" r="3" fill="#3B82F6" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t('metrics.avgPaymentTime')}</span>
                      <div className="flex items-center">
                        <span className="text-lg font-semibold text-black mr-2">{paymentMetrics.averagePaymentTime}</span>
                        <span className="text-sm text-gray-500">{t('common.days')}</span>
                        <ArrowTrendingDownIcon className="ml-2 h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Top Clients */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-200 hover:border-orange-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.topClients.title')}</h3>
                      <span className="text-blue-600 text-sm cursor-pointer">{t('clientAnalytics.viewAll')}</span>
                    </div>

                    <div className="space-y-4">
                      {topClients.map((client, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-action-title text-black text-sm">{client.name}</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${client.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-card-metric text-black text-sm">{client.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Conversion */}
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-pink-200 hover:border-pink-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-section-title text-black">{t('charts.invoiceConversion.title')}</h3>
                      <span className="text-blue-600 text-sm cursor-pointer">{t('details')}</span>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-48 flex items-end justify-center space-x-3 mb-4">
                      {[85, 92, 78, 88, 95, 82, 90].map((height, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-500 mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-card-metric text-green-600">142</div>
                        <div className="text-xs text-gray-500">{t('metrics.sent')}</div>
                      </div>
                      <div>
                        <div className="text-card-metric text-yellow-500">24.8</div>
                        <div className="text-xs text-gray-500">{t('metrics.viewed')}</div>
                      </div>
                      <div>
                        <div className="text-card-metric text-red-500">18.5</div>
                        <div className="text-xs text-gray-500">{t('metrics.paid')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

           {/* Financial Forecasting Tab */}
            {activeTab === 'forecasting' && (
              <div className="space-y-8">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">{t('common.loadingForecastingData')}</div>
                  </div>
                ) : (
                  <>
                    {/* 6-Month Revenue Projection, Growth Trend Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 6-Month Revenue Projection */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200 hover:border-purple-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-section-title text-black">{t('forecasting.revenueProjection.title')}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{t('forecasting.projected')}</span>
                            <span className="text-sm text-gray-500">{t('forecasting.actual')}</span>
                            <span className="text-sm text-gray-500">{t('forecasting.target')}</span>
                          </div>
                        </div>

                        {/* Line Chart */}
                        <div className="h-64 mb-4">
                          <svg className="w-full h-full" viewBox="0 0 400 200">
                            {/* Projected Line */}
                            <polyline
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="3"
                              strokeDasharray="5,5"
                              points="50,150 100,130 150,120 200,100 250,90 300,80 350,70"
                            />
                            {/* Actual Line */}
                            <polyline
                              fill="none"
                              stroke="#10B981"
                              strokeWidth="3"
                              points="50,150 100,135 150,125 200,110"
                            />
                            {/* Target Line */}
                            <polyline
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="2"
                              points="50,140 100,120 150,110 200,95 250,85 300,75 350,65"
                            />
                          </svg>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-kpi-value text-blue-600">€225,000</div>
                            <div className="text-sm text-gray-500">{t('forecasting.sixMonthProjected')}</div>
                          </div>
                          <div>
                            <div className="text-kpi-value text-green-600">€238,000</div>
                            <div className="text-sm text-gray-500">{t('forecasting.expected')}</div>
                          </div>
                          <div>
                            <div className="text-kpi-value text-yellow-600">€195,000</div>
                            <div className="text-sm text-gray-500">{t('forecasting.conservative')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Growth Trend Analysis */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-teal-200 hover:border-teal-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-section-title text-black">{t('forecasting.growthTrend.title')}</h3>
                          <span className="text-blue-600 text-sm cursor-pointer">{t('clientAnalytics.viewReport')}</span>
                        </div>

                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-kpi-value text-green-600 mb-2">+23.5%</div>
                            <div className="text-sm text-gray-500">{t('forecasting.quarterlyGrowthRate')}</div>
                          </div>

                          <div className="space-y-4">
                            {[
                              {
                                metric: t('forecasting.revenueGrowth'),
                                value: '+18.2%',
                                trend: 'up',
                                color: 'text-green-600',
                              },
                              {
                                metric: t('forecasting.clientAcquisition'),
                                value: '+12.8%',
                                trend: 'up',
                                color: 'text-green-600',
                              },
                              {
                                metric: t('forecasting.avgInvoiceValue'),
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
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{item.metric}</span>
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${item.color}`}>
                                    {item.value}
                                  </span>
                                  {item.trend === 'up' ? (
                                    <ArrowTrendingUpIcon className="ml-2 h-4 w-4 text-green-500" />
                                  ) : (
                                    <ArrowTrendingDownIcon className="ml-2 h-4 w-4 text-green-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quarterly Targets, Budget Planning, Scenario Modeling */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Quarterly Targets */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-amber-200 hover:border-amber-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-section-title text-black">Quarterly Targets</h3>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                          {[
                            { quarter: 'Q1 2024', target: '€85,000', actual: '€92,500', progress: 109 },
                            { quarter: 'Q2 2024', target: '€95,000', actual: '€88,200', progress: 93 },
                            { quarter: 'Q3 2024', target: '€105,000', actual: '€98,750', progress: 94 },
                            { quarter: 'Q4 2024', target: '€115,000', actual: '-', progress: 0 },
                          ].map((item, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{item.quarter}</span>
                                <span className="text-sm text-gray-600">{item.target}</span>
                              </div>
                              {item.progress > 0 && (
                                <>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        item.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{t('forecasting.actual')}: {item.actual}</span>
                                    <span className={`font-medium ${
                                      item.progress >= 100 ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                      {item.progress}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budget Planning */}
                      <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-rose-200 hover:border-rose-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-section-title text-black">{t('forecasting.budgetPlanning.title')}</h3>
                          <span className="text-blue-600 text-sm cursor-pointer">{t('clientAnalytics.editBudget')}</span>
                        </div>

                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <div className="text-kpi-value text-black">€{financialMetrics.totalRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{t('forecasting.annualBudget')}</div>
                          </div>

                          <div className="space-y-3">
                            {[
                              { category: t('forecasting.revenueTarget'), amount: financialMetrics.totalRevenue * 1.2, color: 'bg-green-500' },
                              { category: t('forecasting.operatingExpenses'), amount: financialMetrics.totalExpenses, color: 'bg-red-500' },
                              { category: t('forecasting.marketingBudget'), amount: financialMetrics.totalRevenue * 0.15, color: 'bg-blue-500' },
                              { category: t('forecasting.emergencyFund'), amount: financialMetrics.totalRevenue * 0.1, color: 'bg-yellow-500' },
                            ].map((item, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                                  <span className="text-sm text-gray-600">{item.category}</span>
                                </div>
                                <span className="text-sm font-medium">€{item.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Scenario Modeling */}
                      <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-violet-200 hover:border-violet-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-section-title text-black">{t('forecasting.scenarioModeling.title')}</h3>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </div>

                        <div className="space-y-4">
                          {[
                            { scenario: t('forecasting.bestCase'), revenue: '€320,000', probability: '25%', color: 'text-green-600' },
                            { scenario: t('forecasting.mostLikely'), revenue: '€280,000', probability: '50%', color: 'text-blue-600' },
                            { scenario: t('forecasting.worstCase'), revenue: '€220,000', probability: '25%', color: 'text-red-600' },
                          ].map((item, index) => (
                            <div key={index} className="p-3 border border-gray-200 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">{item.scenario}</span>
                                <span className={`text-sm font-semibold ${item.color}`}>{item.revenue}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{t('forecasting.probability')}</span>
                                <span className="text-xs font-medium">{item.probability}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Revenue Breakdown, Monthly Expenses, Cash Flow Analysis */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Revenue Breakdown */}
                     <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-lime-200 hover:border-lime-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">{t('forecasting.revenueBreakdown.title')}</h3>
                         <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                       </div>

                       <div className="flex items-center justify-center mb-6">
                         <div className="relative w-32 h-32">
                           <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#3B82F6"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="100 281"
                               strokeDashoffset="0"
                             />
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#10B981"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="80 281"
                               strokeDashoffset="-110"
                             />
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#F59E0B"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="61 300"
                               strokeDashoffset="-190"
                             />
                           </svg>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Services</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalRevenue * 0.45).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Products</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalRevenue * 0.32).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Consulting</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalRevenue * 0.23).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                       </div>
                     </div>

                     {/* Monthly Expenses */}
                     <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-sky-200 hover:border-sky-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">Monthly Expenses</h3>
                         <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                       </div>

                       {/* Bar Chart */}
                       <div className="h-48 flex items-end justify-center space-x-2 mb-4">
                         {[65, 45, 80, 55, 70, 60].map((height, index) => (
                           <div key={index} className="flex flex-col items-center">
                             <div
                               className="w-8 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                               style={{ height: `${height}%` }}
                             ></div>
                             <span className="text-xs text-gray-500 mt-2">
                               {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                             </span>
                           </div>
                         ))}
                       </div>

                       <div className="text-center">
                         <div className="text-kpi-value text-black">€{(financialMetrics.totalExpenses / 12).toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                         <div className="text-sm text-gray-500">Average Monthly</div>
                       </div>
                     </div>

                     {/* Cash Flow Analysis */}
                     <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-emerald-200 hover:border-emerald-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">Cash Flow Analysis</h3>
                         <span className="text-blue-600 text-sm cursor-pointer">Report</span>
                       </div>

                       {/* Area Chart Placeholder */}
                       <div className="h-48 mb-4">
                         <svg className="w-full h-full" viewBox="0 0 300 150">
                           <defs>
                             <linearGradient id="cashFlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                               <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                               <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                             </linearGradient>
                           </defs>
                           <polygon
                             fill="url(#cashFlowGradient)"
                             points="20,120 60,80 100,90 140,60 180,70 220,40 260,50 260,140 20,140"
                           />
                           <polyline
                             fill="none"
                             stroke="#3B82F6"
                             strokeWidth="2"
                             points="20,120 60,80 100,90 140,60 180,70 220,40 260,50"
                           />
                         </svg>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                         <div className="text-center">
                           <div className="text-card-metric text-green-600">+€{financialMetrics.cashFlow.inflow.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                           <div className="text-xs text-gray-500">{t('forecasting.inflow')}</div>
                         </div>
                         <div className="text-center">
                           <div className="text-card-metric text-red-500">-€{financialMetrics.cashFlow.outflow.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                           <div className="text-xs text-gray-500">{t('forecasting.outflow')}</div>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Profit Margin Trends, Financial Health, Expense Breakdown */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Profit Margin Trends */}
                     <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 hover:border-slate-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">{t('forecasting.profitMarginTrends.title')}</h3>
                         <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                       </div>

                       <div className="h-32 flex items-end justify-center space-x-1 mb-4">
                         {[45, 52, 48, 58, 62, 55, 60, 65, 58, 70, 68, 72].map((height, index) => (
                           <div
                             key={index}
                             className="w-4 bg-blue-500 rounded-t"
                             style={{ height: `${height}%` }}
                           ></div>
                         ))}
                       </div>

                       <div className="text-center">
                         <div className="text-kpi-value text-blue-600">{Math.abs(financialMetrics.profitMargin)}%</div>
                         <div className="text-sm text-gray-500">{t('forecasting.currentMargin')}</div>
                         <div className="flex items-center justify-center mt-2">
                           {financialMetrics.profitMargin >= 0 ? (
                             <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                           ) : (
                             <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                           )}
                           <span className={`text-sm ${financialMetrics.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                             {financialMetrics.profitMargin >= 0 ? '+' : ''}{financialMetrics.profitMargin}%
                           </span>
                         </div>
                       </div>
                     </div>

                     {/* Financial Health */}
                     <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">{t('forecasting.financialHealth.title')}</h3>
                         <span className="text-blue-600 text-sm cursor-pointer">{t('details')}</span>
                       </div>

                       {/* Circular Progress */}
                       <div className="flex items-center justify-center mb-6">
                         <div className="relative w-32 h-32">
                           <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                             <circle
                               cx="50"
                               cy="50"
                               r="40"
                               stroke="#E5E7EB"
                               strokeWidth="8"
                               fill="transparent"
                             />
                             <circle
                               cx="50"
                               cy="50"
                               r="40"
                               stroke="#3B82F6"
                               strokeWidth="8"
                               fill="transparent"
                               strokeDasharray={`${(financialMetrics.financialHealth / 100) * 251} 251`}
                               strokeLinecap="round"
                             />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-kpi-value text-blue-600">{Math.round(financialMetrics.financialHealth)}</span>
                           </div>
                         </div>
                       </div>

                       <div className="space-y-3">
                         <div className="flex justify-between">
                           <span className="text-sm text-gray-600">Cash Flow</span>
                           <span className="text-sm font-medium text-green-600">Excellent</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-sm text-gray-600">Debt Ratio</span>
                           <span className="text-sm font-medium text-yellow-600">Good</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-sm text-gray-600">Liquidity</span>
                           <span className="text-sm font-medium text-green-600">Strong</span>
                         </div>
                       </div>
                     </div>

                     {/* Expense Breakdown */}
                     <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-red-200 hover:border-red-300">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-section-title text-black">Expense Breakdown</h3>
                         <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                       </div>

                       <div className="flex items-center justify-center mb-6">
                         <div className="relative w-32 h-32">
                           <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#EF4444"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="90 281"
                               strokeDashoffset="0"
                             />
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#F59E0B"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="70 281"
                               strokeDashoffset="-100"
                             />
                             <circle
                               cx="50"
                               cy="50"
                               r="35"
                               stroke="#8B5CF6"
                               strokeWidth="15"
                               fill="transparent"
                               strokeDasharray="61 300"
                               strokeDashoffset="-170"
                             />
                           </svg>
                         </div>
                       </div>

                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Operations</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalExpenses * 0.4).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Marketing</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalExpenses * 0.35).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                             <span className="text-sm text-gray-600">Admin</span>
                           </div>
                           <span className="text-sm font-medium">€{(financialMetrics.totalExpenses * 0.25).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </div>
           )}

          {activeTab === 'reports-and-insights' && (
            <Suspense fallback={
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
                  <p className='text-gray-600 mt-4'>{t('common.loadingReportsInsights')}</p>
                </div>
              </div>
            }>
            <div className='space-y-8'>
              {/* Header Section */}
              <div className='bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-indigo-200 hover:border-indigo-300'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h2 className='text-page-title text-black'>{t('tabs.reportsInsights.name')}</h2>
                    <p className='text-gray-600 mt-1'>{t('tabs.reportsInsights.description')}</p>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'>
                      <DocumentArrowDownIcon className='w-4 h-4' />
                      <span>{t('clientAnalytics.actions.exportReport')}</span>
                    </button>
                    <button className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2'>
                      <ClockIcon className='w-4 h-4' />
                      <span>{t('clientAnalytics.actions.scheduleReport')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-green-300'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-600'>{t('kpis.totalRevenue')}</p>
                      <p className='text-kpi-value text-black'>€{financialMetrics.totalRevenue.toLocaleString()}</p>
                      <p className='text-caption text-green-600 mt-1'>{t('metrics.monthlyGrowth', { value: '12.5' })}</p>
                    </div>
                    <div className='p-3 bg-green-100 rounded-lg'>
                      <CurrencyEuroIcon className='w-6 h-6 text-green-600' />
                    </div>
                  </div>
                </div>

                <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-blue-300'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-600'>{t('kpis.activeClients')}</p>
                      <p className='text-kpi-value text-black'>{clientMetrics.activeClients}</p>
                      <p className='text-caption text-blue-600 mt-1'>{t('metrics.newClientsThisMonth', { count: clientMetrics.newClients })}</p>
                    </div>
                    <div className='p-3 bg-blue-100 rounded-lg'>
                      <UsersIcon className='w-6 h-6 text-blue-600' />
                    </div>
                  </div>
                </div>

                <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-200 hover:border-purple-300'>
                   <div className='flex items-center justify-between'>
                     <div>
                       <p className='text-caption text-gray-600'>{t('kpis.profitMargin')}</p>
                       <p className='text-kpi-value text-black'>{financialMetrics.profitMargin}%</p>
                       <p className='text-caption text-purple-600 mt-1'>{t('metrics.aboveIndustryAvg')}</p>
                     </div>
                     <div className='p-3 bg-purple-100 rounded-lg'>
                       <ChartBarIcon className='w-6 h-6 text-purple-600' />
                     </div>
                   </div>
                 </div>

                 <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-200 hover:border-orange-300'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-caption text-gray-600'>{t('kpis.financialHealth')}</p>
                      <p className='text-kpi-value text-black'>{financialMetrics.financialHealth.toFixed(2)}/100</p>
                      <p className='text-caption text-orange-600 mt-1'>{t('metrics.strongPosition')}</p>
                    </div>
                    <div className='p-3 bg-orange-100 rounded-lg'>
                      <HeartIcon className='w-6 h-6 text-orange-600' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Report */}
              <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300'>
                <h3 className='text-card-title font-semibold text-black mb-6'>{t('reports.executiveSummary.title')}</h3>
                
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  <div>
                    <h4 className='text-body font-medium text-black mb-4'>{t('reports.kpis.title')}</h4>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>{t('kpis.monthlyRecurringRevenue')}</span>
                        <span className='text-body font-semibold text-black'>€{(financialMetrics.totalRevenue / 12).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>{t('kpis.customerAcquisitionCost')}</span>
                        <span className='text-body font-semibold text-black'>€{(financialMetrics.totalExpenses * 0.3 / clientMetrics.newClients).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>{t('kpis.avgRevenuePerClient')}</span>
                        <span className='text-body font-semibold text-black'>€{(financialMetrics.totalRevenue / clientMetrics.totalClients).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <span className='text-body text-gray-700'>{t('kpis.cashFlowRatio')}</span>
                        <span className='text-body font-semibold text-black'>{(financialMetrics.cashFlow / financialMetrics.totalExpenses).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='text-body font-medium text-black mb-4'>{t('reports.businessInsights.title')}</h4>
                    <div className='space-y-3'>
                      <div className='p-3 border-l-4 border-blue-500 bg-blue-50'>
                        <p className='text-caption font-medium text-blue-800'>{t('insights.clientRetention.title')}</p>
                        <p className='text-caption text-blue-700 mt-1'>{t('insights.clientRetention.description', { activeClients: clientMetrics.activeClients, newClients: clientMetrics.newClients })}</p>
                      </div>
                      <div className='p-3 border-l-4 border-purple-500 bg-purple-50'>
                        <p className='text-caption font-medium text-purple-800'>{t('insights.profitability.title')}</p>
                        <p className='text-caption text-purple-700 mt-1'>Your profit margin of {financialMetrics.profitMargin}% is {(() => {
                          if (financialMetrics.profitMargin >= 20) return 'excellent';
                          if (financialMetrics.profitMargin >= 10) return 'good';
                          return 'below industry average';
                        })()}.</p>
                      </div>
                      <div className='p-3 border-l-4 border-orange-500 bg-orange-50'>
                        <p className='text-caption font-medium text-orange-800'>{t('insights.financialHealth.title')}</p>
                        <p className='text-caption text-orange-700 mt-1'>Your financial health score of {financialMetrics.financialHealth.toFixed(2)}/100 indicates {(() => {
                          if (financialMetrics.financialHealth >= 70) return 'strong';
                          if (financialMetrics.financialHealth >= 50) return 'moderate';
                          return 'weak';
                        })()} financial stability.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Report Builder */}
              <div className='bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-cyan-200 hover:border-cyan-300'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-card-title font-semibold text-black'>{t('reports.customBuilder.title')}</h3>
                  <button className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
{t('common.createReport')}
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>{t('reports.customBuilder.reportType')}</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>{t('reports.types.financialSummary')}</option>
                      <option>{t('reports.types.clientAnalysis')}</option>
                      <option>{t('reports.types.revenueBreakdown')}</option>
                      <option>{t('reports.types.performanceMetrics')}</option>
                      <option>{t('reports.types.customDashboard')}</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>{t('reports.customBuilder.dateRange')}</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>{t('dateRanges.last30Days')}</option>
                      <option>{t('dateRanges.last3Months')}</option>
                      <option>{t('dateRanges.last6Months')}</option>
                      <option>{t('dateRanges.lastYear')}</option>
                      <option>{t('dateRanges.customRange')}</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-body font-medium text-black mb-2'>{t('reports.customBuilder.exportFormat')}</label>
                    <select className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
                      <option>{t('exportFormats.pdfReport')}</option>
                      <option>{t('exportFormats.excelSpreadsheet')}</option>
                      <option>{t('exportFormats.csvData')}</option>
                      <option>{t('exportFormats.powerpointPresentation')}</option>
                    </select>
                  </div>
                </div>

                <div className='mt-6'>
                  <label className='block text-body font-medium text-black mb-2'>{t('reports.customBuilder.includeSections')}</label>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    {[
                      t('reports.sections.revenueAnalysis'),
                      t('reports.sections.clientMetrics'),
                      t('reports.sections.financialHealth'),
                      t('reports.sections.cashFlow'),
                      t('reports.sections.profitMargins'),
                      t('reports.sections.growthTrends'),
                      t('reports.sections.benchmarks'),
                      t('reports.sections.recommendations')
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
                <h3 className='text-card-title font-semibold text-black mb-6'>{t('reports.industryBenchmarks.title')}</h3>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h4 className='text-body font-medium text-black mb-4'>{t('reports.industryBenchmarks.performanceVsIndustry')}</h4>
                    <div className='space-y-4'>
                      {[
                        { metric: t('kpis.profitMargin'), your: financialMetrics.profitMargin, industry: 18, unit: '%' },
                        { metric: t('kpis.clientRetention'), your: 85, industry: 75, unit: '%' },
                        { metric: t('kpis.revenueGrowth'), your: 12.5, industry: 8.2, unit: '%' },
                        { metric: t('kpis.financialHealth'), your: financialMetrics.financialHealth, industry: 65, unit: '/100' }
                      ].map((item, index) => (
                        <div key={index} className='flex items-center justify-between'>
                          <span className='text-body text-gray-700'>{item.metric}</span>
                          <div className='flex items-center space-x-4'>
                            <div className='text-right'>
                              <div className='text-body font-semibold text-black'>{typeof item.your === 'number' ? item.your.toFixed(2) : item.your}{item.unit}</div>
                              <div className='text-caption text-gray-500'>{t('forecasting.scenarioModeling.you')}</div>
                            </div>
                            <div className='text-right'>
                              <div className='text-body text-gray-600'>{item.industry}{item.unit}</div>
                              <div className='text-caption text-gray-500'>{t('forecasting.scenarioModeling.industry')}</div>
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
                    <h4 className='text-body font-medium text-black mb-4'>{t('reports.recommendations.title')}</h4>
                    <div className='space-y-3'>
                      <div className='p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500'>
                        <p className='text-caption font-medium text-blue-800'>{t('recommendations.optimizeCashFlow.title')}</p>
                        <p className='text-caption text-blue-700 mt-1'>{t('recommendations.optimizeCashFlow.description')}</p>
                      </div>
                      <div className='p-3 bg-green-50 rounded-lg border-l-4 border-green-500'>
                        <p className='text-caption font-medium text-green-800'>{t('recommendations.expandClientBase.title')}</p>
                        <p className='text-caption text-green-700 mt-1'>{t('recommendations.expandClientBase.description')}</p>
                      </div>
                      <div className='p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500'>
                        <p className='text-caption font-medium text-purple-800'>{t('recommendations.costManagement.title')}</p>
                        <p className='text-caption text-purple-700 mt-1'>{t('recommendations.costManagement.description')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </Suspense>
            )}

            {/* Interactive Charts Tab */}
            {activeTab === 'interactive-charts' && (
              <Suspense fallback={
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
                    <p className='text-gray-600 mt-4'>{t('common.loadingInteractiveCharts')}</p>
                  </div>
                </div>
              }>
                <div className='space-y-8'>
                  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                    <InteractiveFinancialCharts analytics={analytics} />
                  </div>
                </div>
              </Suspense>
            )}
         </div>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Analytics;