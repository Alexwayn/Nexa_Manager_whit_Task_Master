import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Footer from '@components/shared/Footer';

import {
  Search,
  Bell,
  ChevronDown,
  MoreHorizontal,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Archive,
  Settings,
  UserPlus,
  Receipt,
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  User,
  BarChart3,
  Eye,
  Download,
  RefreshCw,
  PieChart,
} from 'lucide-react';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';

// Import hooks
import { useRealtimeDashboard } from '@hooks/useRealtimeDashboard';
import useDateRange from '@hooks/useDateRange';

// Import services
import clientService from '@lib/clientService';
import { supabase } from '@lib/supabaseClient';

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  // Date range for data filtering
  const { dateRange } = useDateRange();

  // Trasforma dateRange per essere compatibile con useRealtimeDashboard
  const realtimeDateRange = useMemo(
    () => ({
      start: dateRange.startDate,
      end: dateRange.endDate,
    }),
    [dateRange.startDate, dateRange.endDate],
  );

  const {
    dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useRealtimeDashboard(realtimeDateRange, true);

  // ALL HOOKS AND STATES MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [notifications, setNotifications] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [upcomingWork, setUpcomingWork] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // Add period state

  // Dropdown states for card menus
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        activeDropdown &&
        dropdownRefs.current[activeDropdown] &&
        !dropdownRefs.current[activeDropdown].contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = dropdownId => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  // Handle period change
  const handlePeriodChange = period => {
    setSelectedPeriod(period);
    // Here you can add logic to refresh data based on the selected period
    console.log('Period changed to:', period);
  };

  // Dropdown menu component
  const CardDropdownMenu = ({ dropdownId, options }) => (
    <div className='relative' ref={el => (dropdownRefs.current[dropdownId] = el)}>
      <button
        onClick={() => toggleDropdown(dropdownId)}
        className='h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors'
        aria-label='Card options'
      >
        <MoreHorizontal className='h-5 w-5' />
      </button>

      {activeDropdown === dropdownId && (
        <div className='absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10'>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.action();
                setActiveDropdown(null);
              }}
              className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2'
            >
              {option.icon && <option.icon className='h-4 w-4' />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Load real data from database
  useEffect(() => {
    const loadRealData = async () => {
      if (!isSignedIn || !user) return;

      try {
        // Load recent clients (limit to 4 most recent)
        const clientsResult = await clientService.getClients({
          limit: 4,
          sortBy: 'created_at',
          ascending: false,
        });

        if (clientsResult.data && clientsResult.data.length > 0) {
          const formattedClients = clientsResult.data.map(client => ({
            id: client.id,
            name: client.full_name || client.name || 'Cliente',
            industry: client.notes || 'Non specificato',
            status: 'active', // Default status since we don't have this field
            lastInvoice: 'Nessuna fattura',
            lastContact: new Date(client.created_at).toLocaleDateString('it-IT'),
            initials: (client.full_name || client.name || 'C').substring(0, 2).toUpperCase(),
          }));
          setRecentClients(formattedClients);
        }

        // Load upcoming events from database (if events table exists)
        // For now, we'll leave this empty since we need to check if events table has data
        setUpcomingWork([]);

        // Load recent notifications (for now, we'll leave this empty)
        setNotifications([]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadRealData();
  }, [isSignedIn, user]);

  // Generic filter function
  const filterByTerm = (items, fields) => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      fields.some(field => (item[field] || '').toString().toLowerCase().includes(term)),
    );
  };

  // Filters for each category
  const filteredClients = filterByTerm(recentClients, ['name', 'industry', 'lastInvoice']);

  const filteredNotifications = filterByTerm(notifications, ['title', 'message']);

  const filteredUpcomingWork = filterByTerm(upcomingWork, ['title', 'client']);

  // Navigation handlers
  const handleViewAllClients = () => navigate('/clients');
  const handleViewAllNotifications = () => navigate('/notifications');
  const handleViewReports = () => navigate('/reports');
  const handleViewSettings = () => navigate('/settings');

  const handleViewCalendar = () => navigate('/calendar');
  const handleAddNewEvent = () => navigate('/calendar?action=new');
  const handleAddClient = () => navigate('/clients?action=new');
  const handleCreateInvoice = () => navigate('/invoices?action=new');
  const handleTrackExpense = () => navigate('/transactions?action=expense');
  const handleScheduleMeeting = () => navigate('/calendar?action=meeting');
  const handleGoToDashboard = () => navigate('/dashboard');

  // Dropdown menu options for each card
  const businessHealthOptions = [
    {
      label: t('dropdownOptions.viewDetails'),
      icon: Eye,
      action: () => navigate('/analytics'),
    },
    {
      label: t('dropdownOptions.exportReport'),
      icon: Download,
      action: () => console.log('Export business health report'),
    },
    {
      label: t('dropdownOptions.refreshData'),
      icon: RefreshCw,
      action: () => window.location.reload(),
    },
  ];

  const revenueStreamOptions = [
    {
      label: t('dropdownOptions.viewAnalytics'),
      icon: BarChart3,
      action: () => navigate('/analytics'),
    },
    {
      label: t('dropdownOptions.revenueSettings'),
      icon: Settings,
      action: () => navigate('/settings'),
    },
    {
      label: t('dropdownOptions.exportData'),
      icon: Download,
      action: () => console.log('Export revenue data'),
    },
  ];

  const invoiceTrackerOptions = [
    {
      label: t('dropdownOptions.viewAllInvoices'),
      icon: FileText,
      action: () => navigate('/invoices'),
    },
    {
      label: t('dropdownOptions.createInvoice'),
      icon: Plus,
      action: () => navigate('/invoices?action=new'),
    },
    {
      label: t('dropdownOptions.invoiceSettings'),
      icon: Settings,
      action: () => navigate('/settings'),
    },
  ];

  // Get real data for Classic View
  const getRealDataForClassicView = () => {
    // DEBUG: Vediamo cosa contiene dashboardData
    console.log('🔍 DEBUG Classic View - dashboardData:', dashboardData);
    console.log('🔍 DEBUG Classic View - dashboardLoading:', dashboardLoading);

    if (dashboardLoading || !dashboardData) {
      console.log('⚠️ Classic View: Usando dati di fallback');
      return {
        businessHealthScore: 0, // Changed from 75 to 0
        revenueData: {
          monthly: '€0,00',
          growth: '+0%',
          lastMonth: '€0,00',
        },
        clientData: {
          active: '0',
          growth: '+0%',
          lastMonth: '0',
        },
        upcomingEvents: {
          count: '0',
          period: 'questa settimana', // Removed translation reference
        },
      };
    }

    // Extract real data from dashboard - STRUTTURA CORRETTA
    const kpis = dashboardData.kpis || {};
    const clients = dashboardData.clients || {};
    const trends = dashboardData.trends || {};

    console.log('💰 Classic View - kpis data:', kpis);
    console.log('👥 Classic View - clients data:', clients);
    console.log('📈 Classic View - trends data:', trends);

    // Calculate revenue data - USA STRUTTURA CORRETTA
    const currentRevenue = kpis.totalRevenue || 0;
    const currentExpenses = kpis.totalExpenses || 0;
    const revenueGrowth = trends.revenue ? `+${trends.revenue}%` : '+0%';

    // Calculate client data - USA STRUTTURA CORRETTA
    const activeClientsCount = clients.active || 0;
    const totalClientsCount = clients.total || 0;
    const clientGrowth = trends.clients ? `+${trends.clients}%` : '+0%'; // Use real data instead of hardcoded

    // Business health score based on real data
    const businessHealthScore = Math.min(
      100,
      Math.max(
        0,
        (currentRevenue > 0 ? 30 : 0) +
          (activeClientsCount > 0 ? 25 : 0) +
          (revenueGrowth.includes('+') ? 25 : 0) +
          (clientGrowth.includes('+') ? 20 : 0),
      ),
    );

    const result = {
      businessHealthScore,
      revenueData: {
        monthly: `€${currentRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
        growth: revenueGrowth,
        lastMonth: `€${(currentRevenue - currentExpenses).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      },
      clientData: {
        active: activeClientsCount.toString(),
        growth: clientGrowth,
        lastMonth: totalClientsCount.toString(),
      },
      upcomingEvents: {
        count: (dashboardData.calendar?.upcomingEvents || 0).toString(),
        period: t('values.upcomingEventsPeriod'),
      },
    };

    console.log('✅ Classic View - Final result:', result);
    return result;
  };

  const realData = getRealDataForClassicView();
  const { businessHealthScore, revenueData, clientData, upcomingEvents } = realData;

  // Helper function to get status color
  const getStatusColor = status => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Helper function to get avatar background color
  const getAvatarColor = index => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'];
    return colors[index % colors.length];
  };

  const handleViewDetails = clientId => navigate(`/clients/${clientId}`);

  // Classic Dashboard Implementation

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Loading State */}
        {dashboardLoading && (
          <div className='fixed top-20 right-4 z-40 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-sm'>
            <div className='flex items-center space-x-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span className='text-sm'>Caricamento dati...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className='flex-1 p-0'>
          {/* Breadcrumb */}
          <nav className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2 text-base'>
                <HomeIcon className='h-5 w-5 text-blue-600' />
                <button className='text-blue-600 hover:text-blue-700 font-medium transition-colors'>
                  Dashboard
                </button>
                <ChevronRightIcon className='h-5 w-5 text-gray-400' />
                <span className='text-gray-600 font-bold'>{t('overview')}</span>
              </div>
              {/* Search Bar */}
              <div className='flex items-center bg-white rounded px-2 h-10 w-100 py-0 relative'>
                <Search className='h-2 w-2 text-gray-400 mr-1' />
                <input
                  type='text'
                  placeholder={t('search.placeholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='flex-1 h-5 text-gray-700 bg-transparent border-none focus:border-none focus:ring-0 focus:outline-none text-xs leading-tight font-light placeholder:text-xs placeholder:font-light'
                  style={{ textIndent: '6px' }}
                />
                {/* Search results dropdown */}
                {searchTerm.trim() && (
                  <div className='absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded shadow-lg z-50 max-h-64 overflow-y-auto text-xs'>
                    {filteredClients.length > 0 && (
                      <div>
                        <div className='px-3 py-1 font-semibold text-blue-600 border-b border-gray-100'>
                          {t('search.clients')}
                        </div>
                        {filteredClients.map(client => (
                          <div
                            key={'client-' + client.id}
                            className='px-3 py-2 hover:bg-blue-50 cursor-pointer'
                          >
                            <span className='font-medium'>{client.name}</span>{' '}
                            <span className='text-gray-400'>({client.industry})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredUpcomingWork.length > 0 && (
                      <div>
                        <div className='px-3 py-1 font-semibold text-purple-600 border-b border-gray-100'>
                          {t('search.work')}
                        </div>
                        {filteredUpcomingWork.map(work => (
                          <div
                            key={'work-' + work.id}
                            className='px-3 py-2 hover:bg-purple-50 cursor-pointer'
                          >
                            <span className='font-medium'>{work.title}</span>{' '}
                            <span className='text-gray-400'>{work.client}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredNotifications.length > 0 && (
                      <div>
                        <div className='px-3 py-1 font-semibold text-green-600 border-b border-gray-100'>
                          {t('search.notifications')}
                        </div>
                        {filteredNotifications.map(n => (
                          <div
                            key={'notif-' + n.id}
                            className='px-3 py-2 hover:bg-green-50 cursor-pointer'
                          >
                            <span className='font-medium'>{n.title}</span>{' '}
                            <span className='text-gray-400'>{n.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredClients.length === 0 &&
                      filteredUpcomingWork.length === 0 &&
                      filteredNotifications.length === 0 && (
                        <div className='px-3 py-2 text-gray-400'>{t('search.noResults')}</div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className='space-y-6 px-4 md:px-8 py-6'>
            {/* Dashboard Title */}
            <div className='mb-8'>
              <h1 className='text-page-title text-gray-900'>{t('title')}</h1>
              <p className='text-subtitle text-gray-600 mt-2'>{t('subtitle')}</p>
            </div>

            {/* Top Row - Business Health, Revenue Streams, Invoice Tracker, Quick Actions */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full'>
              {/* Business Health */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('businessHealth.title')}</h3>
                  <CardDropdownMenu
                    dropdownId='businessHealthOptions'
                    options={businessHealthOptions}
                  />
                </div>

                <div className='flex flex-col items-center mb-8'>
                  <div className='relative w-48 h-48 mb-6'>
                    <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                      <circle cx='50' cy='50' r='40' stroke='#E5E7EB' strokeWidth='8' fill='none' />
                      <circle
                        cx='50'
                        cy='50'
                        r='40'
                        stroke='#1E40AF'
                        strokeWidth='8'
                        fill='none'
                        strokeDasharray={`${businessHealthScore * 2.51} 251`}
                        strokeLinecap='round'
                        className='transition-all duration-1000 ease-out'
                      />
                    </svg>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-card-metric text-blue-600'>{businessHealthScore}</span>
                      <span className='text-gray-500 text-sm'>{t('businessHealth.outOf100')}</span>
                    </div>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      <span className='text-gray-900'>{t('businessHealth.cashFlow')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>
                      {t('businessHealth.excellent')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                      <span className='text-gray-900'>{t('businessHealth.clientRetention')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>{t('businessHealth.good')}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                      <span className='text-gray-900'>{t('businessHealth.growthRate')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>
                      {t('businessHealth.veryGood')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Streams */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('revenueStreams.title')}</h3>
                  <CardDropdownMenu
                    dropdownId='revenueStreamOptions'
                    options={revenueStreamOptions}
                  />
                </div>

                {dashboardData?.revenueStreams ? (
                  <>
                    <div className='relative w-full h-64 mb-6 flex items-center justify-center'>
                      {/* Dynamic pie chart representation */}
                      <div className='relative w-40 h-40'>
                        <div
                          className='absolute inset-0 rounded-full'
                          style={{
                            background: dashboardData.revenueStreams.chartGradient || '#E5E7EB',
                          }}
                        ></div>
                        <div className='absolute inset-4 bg-white rounded-full flex items-center justify-center'>
                          <div className='text-center'>
                            <div className='text-xl font-bold text-gray-900'>
                              €{dashboardData.revenueStreams.total?.toLocaleString() || '0'}
                            </div>
                            <div className='text-xs text-gray-500'>{t('revenueStreams.total')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      {dashboardData.revenueStreams.categories?.map((category, index) => (
                        <div key={index} className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <div
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className='text-gray-900'>{category.name}</span>
                          </div>
                          <span className='text-gray-900 font-bold'>{category.percentage}%</span>
                        </div>
                      )) || (
                        <div className='text-center text-gray-500 text-sm py-4'>
                          {t('revenueStreams.noCategories')}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='flex items-center justify-center h-64 bg-gray-50 rounded-lg'>
                    <div className='text-center'>
                      <PieChart className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <p className='text-gray-500 text-sm'>{t('revenueStreams.noDataAvailable')}</p>
                      <p className='text-gray-400 text-xs mt-1'>
                        {t('revenueStreams.connectDataSource')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Tracker */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('invoiceTracker.title')}</h3>
                  <CardDropdownMenu
                    dropdownId='invoiceTrackerOptions'
                    options={invoiceTrackerOptions}
                  />
                </div>

                {/* Progress Bar for Paid vs Outstanding */}
                <div className='mb-6'>
                  {dashboardData?.invoiceData ? (
                    <>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-subtitle text-gray-600'>
                          {t('invoiceTracker.paid')}
                        </span>
                        <span className='text-subtitle text-gray-600'>
                          {t('invoiceTracker.outstanding')}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-4 mb-2'>
                        <div
                          className='bg-green-600 h-4 rounded-full'
                          style={{
                            width: `${dashboardData.invoiceData.paidPercentage || 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='text-right'>
                          <div className='text-card-metric text-green-600'>
                            €{dashboardData.invoiceData.totalPaid?.toLocaleString() || '0'}
                          </div>
                          <div className='text-metric-small text-gray-500'>
                            {t('invoiceTracker.totalPaid')}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-card-metric text-orange-600'>
                            €{dashboardData.invoiceData.totalOutstanding?.toLocaleString() || '0'}
                          </div>
                          <div className='text-metric-small text-gray-500'>
                            {t('invoiceTracker.totalOutstanding')}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className='flex items-center justify-center h-32 bg-gray-50 rounded-lg'>
                      <div className='text-center'>
                        <FileText className='h-8 w-8 text-gray-300 mx-auto mb-2' />
                        <p className='text-subtitle text-gray-500'>
                          {t('invoiceTracker.noDataAvailable')}
                        </p>
                        <p className='text-metric-small text-gray-400 mt-1'>
                          {t('invoiceTracker.connectDataSource')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h3 className='text-section-title text-gray-900 mb-6'>{t('quickActions.title')}</h3>

                <div className='grid grid-cols-2 gap-3'>
                  <button
                    onClick={handleAddClient}
                    className='bg-blue-500 text-white p-4 rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105 flex flex-col items-center justify-center aspect-square'
                  >
                    <UserPlus className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-button-text font-medium'>
                      {t('quickActions.addClient')}
                    </div>
                  </button>

                  <button
                    onClick={handleCreateInvoice}
                    className='bg-green-500 text-white p-4 rounded-xl hover:bg-green-600 transition-all transform hover:scale-105 flex flex-col items-center justify-center aspect-square'
                  >
                    <Receipt className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-button-text font-medium'>
                      {t('quickActions.newInvoice')}
                    </div>
                  </button>

                  <button
                    onClick={handleTrackExpense}
                    className='bg-yellow-500 text-white p-4 rounded-xl hover:bg-yellow-600 transition-all transform hover:scale-105 flex flex-col items-center justify-center aspect-square'
                  >
                    <DollarSign className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-button-text font-medium'>
                      {t('quickActions.trackExpense')}
                    </div>
                  </button>

                  <button
                    onClick={handleScheduleMeeting}
                    className='bg-purple-500 text-white p-4 rounded-xl hover:bg-purple-600 transition-all transform hover:scale-105 flex flex-col items-center justify-center aspect-square'
                  >
                    <CalendarIcon className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-button-text font-medium'>
                      {t('quickActions.scheduleMeeting')}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Revenue Overview Chart */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-section-title text-gray-900'>{t('revenueOverview.title')}</h3>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => handlePeriodChange('monthly')}
                    className={`px-3 py-1 text-nav-text rounded-full transition-colors ${
                      selectedPeriod === 'monthly'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t('revenueOverview.monthly')}
                  </button>
                  <button
                    onClick={() => handlePeriodChange('quarterly')}
                    className={`px-3 py-1 text-nav-text rounded-full transition-colors ${
                      selectedPeriod === 'quarterly'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t('revenueOverview.quarterly')}
                  </button>
                  <button
                    onClick={() => handlePeriodChange('yearly')}
                    className={`px-3 py-1 text-nav-text rounded-full transition-colors ${
                      selectedPeriod === 'yearly'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t('revenueOverview.yearly')}
                  </button>
                </div>
              </div>

              {/* Chart Area - Dynamic Area Chart */}
              <div className='relative h-80 mb-4'>
                {dashboardData?.revenueChart?.length > 0 ? (
                  <svg className='w-full h-full' viewBox='0 0 800 300' preserveAspectRatio='none'>
                    <defs>
                      <linearGradient id='revenueGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                        <stop offset='0%' stopColor='#3B82F6' stopOpacity='0.3' />
                        <stop offset='100%' stopColor='#3B82F6' stopOpacity='0.1' />
                      </linearGradient>
                      <linearGradient id='transactionGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
                        <stop offset='0%' stopColor='#10B981' stopOpacity='0.2' />
                        <stop offset='100%' stopColor='#10B981' stopOpacity='0.05' />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <line
                        key={i}
                        x1='50'
                        y1={60 * i + 20}
                        x2='750'
                        y2={60 * i + 20}
                        stroke='#E5E7EB'
                        strokeWidth='1'
                      />
                    ))}

                    {/* Chart will be populated with real data when available */}
                    <text x='400' y='150' fill='#6B7280' fontSize='14' textAnchor='middle'>
                      {t('revenueOverview.noDataAvailable')}
                    </text>
                  </svg>
                ) : (
                  <div className='flex items-center justify-center h-full bg-gray-50 rounded-lg'>
                    <div className='text-center'>
                      <BarChart3 className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <p className='text-subtitle text-gray-500'>
                        {t('revenueOverview.noDataMessage')}
                      </p>
                      <p className='text-metric-small text-gray-400 mt-1'>
                        {t('revenueOverview.connectDataSource')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Chart Legend */}
                <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-6'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                    <span className='text-subtitle text-gray-600'>
                      {t('revenueOverview.revenue')}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='text-subtitle text-gray-600'>
                      {t('revenueOverview.transactions')}
                    </span>
                  </div>
                </div>
              </div>

              <p className='text-subtitle text-gray-600'>{t('revenueOverview.trendDescription')}</p>
            </div>

            {/* Bottom Section - 2x2 Grid Layout */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full'>
              {/* Recent Clients */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('recentClients.title')}</h3>
                  <button
                    onClick={handleViewAllClients}
                    className='text-blue-600 text-nav-text hover:text-blue-800'
                  >
                    {t('recentClients.viewAll')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {recentClients.length > 0 ? (
                    recentClients.map((client, index) => (
                      <div
                        key={client.id}
                        className='flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'
                        onClick={() => handleViewDetails(client.id)}
                      >
                        <div
                          className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-medium text-nav-text`}
                        >
                          {client.initials}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2'>
                            <h4 className='text-card-title text-gray-900 truncate'>
                              {client.name}
                            </h4>
                            <div
                              className={`w-2 h-2 ${getStatusColor(client.status)} rounded-full`}
                            ></div>
                          </div>
                          <p className='text-subtitle text-gray-500 truncate'>{client.industry}</p>
                          <p className='text-metric-small text-gray-400'>{client.lastContact}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-8'>
                      <Users className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <p className='text-subtitle text-gray-500'>Nessun cliente recente</p>
                      <button
                        onClick={handleAddClient}
                        className='mt-2 text-blue-600 text-nav-text hover:text-blue-800'
                      >
                        Aggiungi il primo cliente
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Work */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('upcomingWork.title')}</h3>
                  <button
                    onClick={handleViewCalendar}
                    className='text-blue-600 text-nav-text hover:text-blue-800'
                  >
                    {t('upcomingWork.viewCalendar')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {upcomingWork.length > 0 ? (
                    upcomingWork.map(work => {
                      const IconComponent = work.icon;
                      return (
                        <div key={work.id} className='flex items-start space-x-3'>
                          <div className={`${work.color} p-2 rounded-lg flex-shrink-0`}>
                            <IconComponent className='h-4 w-4 text-white' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h4 className='text-card-title text-gray-900'>{work.title}</h4>
                            <p className='text-metric-small text-gray-500 truncate'>
                              {work.client}
                            </p>
                            <div className='flex items-center space-x-2 mt-1'>
                              <span className='text-metric-small text-gray-400'>{work.time}</span>
                              <span className='text-metric-small text-gray-400'>•</span>
                              <span className='text-metric-small text-gray-400'>
                                {work.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center py-8'>
                      <Calendar className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <p className='text-subtitle text-gray-500'>Nessun evento in programma</p>
                      <button
                        onClick={handleAddNewEvent}
                        className='mt-2 text-blue-600 text-nav-text hover:text-blue-800'
                      >
                        Programma il primo evento
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddNewEvent}
                  className='w-full mt-4 py-2 border border-gray-300 rounded-lg text-button-text text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  {t('upcomingWork.addNewEvent')}
                </button>
              </div>
            </div>

            {/* Bottom Row - Notifications and Performance */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full'>
              {/* Recent Notifications */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>
                    {t('recentNotifications.title')}
                  </h3>
                  <button
                    onClick={handleViewAllNotifications}
                    className='text-blue-600 text-nav-text hover:text-blue-800'
                  >
                    {t('recentNotifications.viewAll')}
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {notifications.length > 0 ? (
                    notifications.map(notification => {
                      const IconComponent = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className='bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer'
                        >
                          <div className='flex items-start space-x-3'>
                            <div className={`${notification.color} p-2 rounded-full flex-shrink-0`}>
                              <IconComponent className='h-4 w-4 text-white' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='text-card-title text-gray-900 truncate'>
                                {notification.title}
                              </h4>
                              <p className='text-subtitle text-gray-500 line-clamp-2'>
                                {notification.message}
                              </p>
                              <p className='text-metric-small text-gray-400 mt-2'>
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center py-8 col-span-full'>
                      <Bell className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <p className='text-subtitle text-gray-500'>Nessuna notifica recente</p>
                      <p className='text-metric-small text-gray-400 mt-1'>
                        Le notifiche appariranno qui quando avrai attività
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className='mt-6 pt-6 border-t border-gray-100'>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-card-metric text-blue-600'>0</div>
                      <div className='text-metric-small text-gray-500'>
                        {t('performance.unread')}
                      </div>
                    </div>
                    <div>
                      <div className='text-card-metric text-green-600'>0</div>
                      <div className='text-metric-small text-gray-500'>
                        {t('performance.thisWeek')}
                      </div>
                    </div>
                    <div>
                      <div className='text-card-metric text-gray-600'>{notifications.length}</div>
                      <div className='text-metric-small text-gray-500'>
                        {t('performance.total')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance - KPI Summary */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-section-title text-gray-900'>{t('performance.title')}</h3>
                  <span className='text-blue-600 text-nav-text font-medium'>
                    {t('performance.thisMonth')}
                  </span>
                </div>

                <div className='space-y-6'>
                  <div className='border-b border-gray-100 pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-subtitle text-gray-500'>
                        {t('performance.monthlyRevenue')}
                      </span>
                      <span className='text-green-600 text-nav-text font-medium flex items-center'>
                        <ArrowUpRight className='h-4 w-4 mr-1' />
                        {revenueData.growth}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-card-metric text-gray-900'>{revenueData.monthly}</span>
                      <span className='text-metric-small text-gray-500'>
                        {t('performance.vs')} {revenueData.lastMonth}
                      </span>
                    </div>
                  </div>

                  <div className='border-b border-gray-100 pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-subtitle text-gray-500'>
                        {t('performance.activeClients')}
                      </span>
                      <span className='text-green-600 text-nav-text font-medium flex items-center'>
                        <ArrowUpRight className='h-4 w-4 mr-1' />
                        {clientData.growth}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-card-metric text-gray-900'>{clientData.active}</span>
                      <span className='text-metric-small text-gray-500'>
                        {t('performance.vs')} {clientData.lastMonth}
                      </span>
                    </div>
                  </div>

                  <div className='border-b border-gray-100 pb-4'>
                    <div className='text-subtitle text-gray-500 mb-2'>
                      {t('performance.upcomingEvents')}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-card-metric text-gray-900'>{upcomingEvents.count}</span>
                      <span className='text-metric-small text-gray-500'>
                        {upcomingEvents.period}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className='text-subtitle text-gray-500 mb-2'>
                      {t('performance.conversionRate')}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-card-metric text-gray-900'>0%</span>
                      <span className='text-metric-small text-gray-600 flex items-center'>
                        <ArrowUpRight className='h-3 w-3 mr-1' />
                        +0%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
