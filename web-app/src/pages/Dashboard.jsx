import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
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
} from 'lucide-react';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      title: t('notifications.paymentReceived'),
      message: t('recentNotifications.data.paymentReceived'),
      time: t('recentNotifications.data.twoMinutesAgo'),
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      id: 2,
      type: 'meeting',
      title: t('notifications.meetingReminder'),
      message: t('recentNotifications.data.newInvoice'),
      time: t('recentNotifications.data.oneHourAgo'),
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      id: 3,
      type: 'overdue',
      title: t('notifications.invoiceOverdue'),
      message: t('recentNotifications.data.taskCompleted'),
      time: t('recentNotifications.data.threeDaysAgo'),
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ]);

  const [recentClients] = useState([
    {
      id: 1,
      name: t('recentClients.data.acmeCorporation'),
      industry: t('recentClients.data.technology'),
      status: 'active',
      lastInvoice: t('recentClients.data.acmeInvoice'),
      lastContact: t('time.daysAgo', { count: 2 }),
      initials: 'AC',
    },
    {
      id: 2,
      name: t('recentClients.data.globexIndustries'),
      industry: t('recentClients.data.manufacturing'),
      status: 'pending',
      lastInvoice: t('recentClients.data.globexInvoice'),
      lastContact: t('time.daysAgo', { count: 5 }),
      initials: 'GI',
    },
    {
      id: 3,
      name: t('recentClients.data.soylentCorp'),
      industry: t('recentClients.data.foodBeverage'),
      status: 'active',
      lastInvoice: t('recentClients.data.soylentInvoice'),
      lastContact: t('time.today'),
      initials: 'SC',
    },
    {
      id: 4,
      name: t('recentClients.data.initechLLC'),
      industry: t('recentClients.data.software'),
      status: 'overdue',
      lastInvoice: t('recentClients.data.initechInvoice'),
      lastContact: t('time.weekAgo'),
      initials: 'IL',
    },
  ]);

  const [upcomingWork] = useState([
    {
      id: 1,
      title: t('upcomingWork.data.clientMeeting'),
      client: t('upcomingWork.data.acmeCorporationVirtual'),
      time: t('upcomingWork.data.tenAM'),
      duration: t('upcomingWork.data.oneHour'),
      color: 'bg-blue-500',
      icon: Users,
    },
    {
      id: 2,
      title: t('upcomingWork.data.projectPresentation'),
      client: t('upcomingWork.data.globexIndustriesOffice'),
      time: t('upcomingWork.data.twoPM'),
      duration: t('upcomingWork.data.twoHours'),
      color: 'bg-purple-500',
      icon: FileText,
    },
    {
      id: 3,
      title: t('upcomingWork.data.invoiceDue'),
      client: t('upcomingWork.data.soylentCorpNA'),
      time: t('upcomingWork.data.endOfDay'),
      duration: t('upcomingWork.data.allDay'),
      color: 'bg-red-500',
      icon: Receipt,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Generic filter function
  const filterByTerm = (items, fields) => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      fields.some(field => (item[field] || '').toString().toLowerCase().includes(term)),
    );
  };

  // Filters for each category
  const filteredClients = filterByTerm(recentClients, [
    'name',
    'industry',
    'lastInvoice',
    'lastContact',
    'initials',
  ]);
  const filteredWork = filterByTerm(upcomingWork, ['title', 'client', 'time', 'duration']);
  const filteredNotifications = filterByTerm(notifications, ['title', 'message', 'time']);

  // Revenue data for the chart
  const revenueChartData = [
    { month: t('months.jan'), revenue: parseInt(t('values.janRevenue')) },
    { month: t('months.feb'), revenue: parseInt(t('values.febRevenue')) },
    { month: t('months.mar'), revenue: parseInt(t('values.marRevenue')) },
    { month: t('months.apr'), revenue: parseInt(t('values.aprRevenue')) },
    { month: t('months.may'), revenue: parseInt(t('values.mayRevenue')) },
    { month: t('months.jun'), revenue: parseInt(t('values.junRevenue')) },
    { month: t('months.jul'), revenue: parseInt(t('values.julRevenue')) },
  ];

  const businessHealthScore = parseInt(t('values.businessHealthScore'));
  const revenueData = {
    monthly: t('values.monthlyRevenue'),
    growth: t('values.revenueGrowth'),
    lastMonth: t('values.lastMonthRevenue'),
  };

  const clientData = {
    active: t('values.activeClients'),
    growth: t('values.clientGrowth'),
    lastMonth: t('values.lastMonthClients'),
  };

  const upcomingEvents = {
    count: t('values.upcomingEventsCount'),
    period: t('values.upcomingEventsPeriod'),
  };

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

  // Navigation handlers
  const handleViewAllClients = () => navigate('/clients');
  const handleViewAllNotifications = () => navigate('/notifications');
  const handleViewReports = () => navigate('/reports');
  const handleViewSettings = () => navigate('/settings');
  const handleViewDetails = clientId => navigate(`/clients/${clientId}`);
  const handleViewCalendar = () => navigate('/calendar');
  const handleAddNewEvent = () => navigate('/calendar?action=new');
  const handleAddClient = () => navigate('/clients?action=new');
  const handleCreateInvoice = () => navigate('/invoices?action=new');
  const handleTrackExpense = () => navigate('/transactions?action=expense');
  const handleScheduleMeeting = () => navigate('/calendar?action=meeting');

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        {/* Main Content */}
        <div className='flex-1 p-0'>
          <div className='space-y-6 px-2 md:px-4'>
            {/* Breadcrumb */}
            <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-sm'>
                  <span className='text-blue-600 font-medium'>{t('title')}</span>
                  <ChevronDown className='h-4 w-4 text-gray-400 rotate-[-90deg]' />
                  <span className='text-gray-600'>{t('overview')}</span>
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
                      {filteredWork.length > 0 && (
                        <div>
                          <div className='px-3 py-1 font-semibold text-purple-600 border-b border-gray-100'>
                            {t('search.work')}
                          </div>
                          {filteredWork.map(work => (
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
                        filteredWork.length === 0 &&
                        filteredNotifications.length === 0 && (
                          <div className='px-3 py-2 text-gray-400'>{t('search.noResults')}</div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Row - Business Health, Revenue Streams, Invoice Tracker */}
            <div className='grid grid-cols-3 gap-6 w-full'>
              {/* Business Health */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('businessHealth.title')}
                  </h3>
                  <MoreHorizontal className='h-5 w-5 text-gray-400 cursor-pointer' />
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
                      <span className='text-4xl font-bold text-blue-600'>
                        {businessHealthScore}
                      </span>
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
              <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('revenueStreams.title')}
                  </h3>
                  <MoreHorizontal className='h-5 w-5 text-gray-400 cursor-pointer' />
                </div>

                <div className='relative w-full h-64 mb-6 flex items-center justify-center'>
                  {/* Improved pie chart representation */}
                  <div className='relative w-40 h-40'>
                    <div
                      className='absolute inset-0 rounded-full'
                      style={{
                        background: `conic-gradient(#059669 0deg 162deg, #d97706 162deg 270deg, #4f46e5 270deg 360deg)`,
                      }}
                    ></div>
                    <div className='absolute inset-4 bg-white rounded-full flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-xl font-bold text-gray-900'>
                          {t('values.totalRevenue')}
                        </div>
                        <div className='text-xs text-gray-500'>{t('revenueStreams.total')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-emerald-600 rounded'></div>
                      <span className='text-gray-900'>{t('revenueStreams.consulting')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>45%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-amber-600 rounded'></div>
                      <span className='text-gray-900'>{t('revenueStreams.products')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>30%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-indigo-500 rounded'></div>
                      <span className='text-gray-900'>{t('revenueStreams.services')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>25%</span>
                  </div>
                </div>
              </div>

              {/* Invoice Tracker */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('invoiceTracker.title')}
                  </h3>
                  <MoreHorizontal className='h-5 w-5 text-gray-400 cursor-pointer' />
                </div>

                <div className='h-64 mb-4 flex items-end justify-center space-x-4 px-4'>
                  {/* Improved bar chart */}
                  <div className='flex flex-col items-center'>
                    <div className='w-12 h-32 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t hover:from-amber-700 hover:to-amber-500 transition-colors'></div>
                    <span className='text-xs text-gray-500 mt-2'>
                      {t('invoiceTracker.pending')}
                    </span>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='w-12 h-48 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t hover:from-emerald-700 hover:to-emerald-500 transition-colors'></div>
                    <span className='text-xs text-gray-500 mt-2'>{t('invoiceTracker.paid')}</span>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='w-12 h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t hover:from-gray-500 hover:to-gray-400 transition-colors'></div>
                    <span className='text-xs text-gray-500 mt-2'>{t('invoiceTracker.draft')}</span>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='w-12 h-40 bg-gradient-to-t from-red-500 to-red-400 rounded-t hover:from-red-600 hover:to-red-500 transition-colors'></div>
                    <span className='text-xs text-gray-500 mt-2'>
                      {t('invoiceTracker.overdue')}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <div className='text-gray-500 text-sm'>{t('invoiceTracker.outstanding')}</div>
                    <div className='text-xl font-semibold text-amber-600'>
                      {t('values.pendingAmount')}
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-gray-500 text-sm'>{t('invoiceTracker.paid30Days')}</div>
                    <div className='text-xl font-semibold text-green-600'>
                      {t('values.paidAmount')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Overview & Quick Actions Row */}
            <div className='flex gap-6 w-full'>
              {/* Revenue Overview - 80% */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-[80%]'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('revenueOverview.title')}
                  </h3>
                  <div className='flex items-center space-x-5'>
                    <div className='bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium cursor-pointer'>
                      {t('revenueOverview.monthly')}
                    </div>
                    <span className='text-gray-500 cursor-pointer hover:text-gray-700'>
                      {t('revenueOverview.quarterly')}
                    </span>
                    <span className='text-gray-500 cursor-pointer hover:text-gray-700'>
                      {t('revenueOverview.yearly')}
                    </span>
                  </div>
                </div>

                <div className='h-80 mb-4 relative bg-gray-50 rounded-lg'>
                  {/* Grid background */}
                  <div className='absolute inset-0 p-4'>
                    <div className='h-full border-l border-b border-gray-200 relative'>
                      {/* Horizontal grid lines */}
                      <div className='absolute top-0 left-0 right-0 border-t border-gray-200'></div>
                      <div className='absolute top-1/4 left-0 right-0 border-t border-gray-200'></div>
                      <div className='absolute top-1/2 left-0 right-0 border-t border-gray-200'></div>
                      <div className='absolute top-3/4 left-0 right-0 border-t border-gray-200'></div>
                    </div>
                  </div>

                  {/* Chart bars */}
                  <div className='absolute inset-0 flex items-end justify-between px-8 pb-8'>
                    {revenueChartData.map((data, index) => {
                      const height = Math.max((data.revenue / 30000) * 100, 5); // Scale to percentage with minimum height
                      return (
                        <div key={data.month} className='flex flex-col items-center group'>
                          <div
                            className='w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-700 hover:to-blue-500 relative shadow-lg'
                            style={{ height: `${height}%` }}
                          >
                            <div className='absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 z-10'>
                              ${(data.revenue / 1000).toFixed(1)}K
                            </div>
                          </div>
                          <span className='text-xs text-gray-600 mt-3 font-medium'>
                            {data.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Y-axis labels */}
                  <div className='absolute left-2 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-4'>
                    <span className='bg-gray-50 px-1'>{t('values.chartMax')}</span>
                    <span className='bg-gray-50 px-1'>{t('values.chartHigh')}</span>
                    <span className='bg-gray-50 px-1'>{t('values.chartMid')}</span>
                    <span className='bg-gray-50 px-1'>{t('values.chartMin')}</span>
                  </div>
                </div>

                <div className='flex justify-between items-center text-sm text-gray-500'>
                  <span>{t('revenueOverview.trendDescription')}</span>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-blue-500 rounded'></div>
                      <span>{t('revenueOverview.monthlyRevenue')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - 20% */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-[20%]'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>{t('quickActions.title')}</h3>
                  <Zap className='h-5 w-5 text-blue-500' />
                </div>

                <div className='space-y-4'>
                  {/* New Invoice */}
                  <button
                    onClick={handleCreateInvoice}
                    className='w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg p-4 transition-colors group'
                  >
                    <div className='flex flex-col items-center space-y-2'>
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                        <Receipt className='h-4 w-4 text-white' />
                      </div>
                      <span className='text-sm font-medium'>{t('quickActions.newInvoice')}</span>
                    </div>
                  </button>

                  {/* Add Client */}
                  <button
                    onClick={handleAddClient}
                    className='w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg p-4 transition-colors group'
                  >
                    <div className='flex flex-col items-center space-y-2'>
                      <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                        <UserPlus className='h-4 w-4 text-white' />
                      </div>
                      <span className='text-sm font-medium'>{t('quickActions.addClient')}</span>
                    </div>
                  </button>

                  {/* Track Expense */}
                  <button
                    onClick={handleTrackExpense}
                    className='w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg p-4 transition-colors group'
                  >
                    <div className='flex flex-col items-center space-y-2'>
                      <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                        <DollarSign className='h-4 w-4 text-white' />
                      </div>
                      <span className='text-sm font-medium'>{t('quickActions.trackExpense')}</span>
                    </div>
                  </button>

                  {/* Schedule Meeting */}
                  <button
                    onClick={handleScheduleMeeting}
                    className='w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg p-4 transition-colors group'
                  >
                    <div className='flex flex-col items-center space-y-2'>
                      <div className='w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center'>
                        <CalendarIcon className='h-4 w-4 text-white' />
                      </div>
                      <span className='text-sm font-medium'>
                        {t('quickActions.scheduleMeeting')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Row - Recent Clients and Upcoming Work */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Recent Clients */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('recentClients.title')}
                  </h3>
                  <button
                    onClick={handleViewAllClients}
                    className='text-blue-600 hover:text-blue-800 transition-colors'
                  >
                    {t('recentClients.viewAll')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {recentClients.map((client, index) => (
                    <div
                      key={client.id}
                      className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start space-x-3 mb-3'>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(index)}`}
                        >
                          {client.initials}
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-medium text-gray-900'>{client.name}</h4>
                          <p className='text-gray-500 text-sm'>{client.industry}</p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`}
                        ></div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
                        <div>
                          <span className='text-gray-500'>{t('recentClients.lastInvoice')}</span>
                          <div className='font-medium text-gray-900'>{client.lastInvoice}</div>
                        </div>
                        <div>
                          <span className='text-gray-500'>{t('recentClients.lastContact')}</span>
                          <div className='font-medium text-gray-900'>{client.lastContact}</div>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors'>
                            <FileText className='h-4 w-4 text-gray-600' />
                          </button>
                          <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors'>
                            <Calendar className='h-4 w-4 text-gray-600' />
                          </button>
                          <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors'>
                            <Archive className='h-4 w-4 text-gray-600' />
                          </button>
                        </div>
                        <button
                          onClick={() => handleViewDetails(client.id)}
                          className='text-blue-600 hover:text-blue-800 text-sm transition-colors'
                        >
                          {t('recentClients.viewDetails')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Work */}
              <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>{t('upcomingWork.title')}</h3>
                  <button
                    onClick={handleViewCalendar}
                    className='text-blue-600 hover:text-blue-800 transition-colors'
                  >
                    {t('upcomingWork.viewCalendar')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {upcomingWork.map(work => {
                    const IconComponent = work.icon;
                    return (
                      <div
                        key={work.id}
                        className='bg-gray-50 border-l-4 border-blue-500 rounded-r-lg p-4 hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-4'>
                            <div className={`${work.color} p-2 rounded-full`}>
                              <IconComponent className='h-5 w-5 text-white' />
                            </div>
                            <div>
                              <h4 className='font-medium text-gray-900'>{work.title}</h4>
                              <p className='text-gray-500 text-sm'>{work.client}</p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-medium text-gray-900'>{work.time}</div>
                            <div className='text-gray-500 text-sm'>{work.duration}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddNewEvent}
                    className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all'
                  >
                    <Plus className='h-4 w-4' />
                    <span>{t('upcomingWork.addNewEvent')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row - Full Width Sections */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
              {/* Notifications - Expanded */}
              <div className='lg:col-span-5 bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('recentNotifications.title')}
                  </h3>
                  <button
                    onClick={handleViewAllNotifications}
                    className='text-blue-600 hover:text-blue-800 text-sm transition-colors'
                  >
                    {t('recentNotifications.viewAll')}
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {notifications.map(notification => {
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
                            <h4 className='font-medium text-gray-900 truncate'>
                              {notification.title}
                            </h4>
                            <p className='text-gray-500 text-sm line-clamp-2'>
                              {notification.message}
                            </p>
                            <p className='text-gray-400 text-xs mt-2'>{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Stats */}
                <div className='mt-6 pt-6 border-t border-gray-100'>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-2xl font-bold text-blue-600'>
                        {t('values.unreadCount')}
                      </div>
                      <div className='text-sm text-gray-500'>{t('performance.unread')}</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-green-600'>
                        {t('values.thisWeekCount')}
                      </div>
                      <div className='text-sm text-gray-500'>{t('performance.thisWeek')}</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-gray-600'>
                        {t('values.totalCount')}
                      </div>
                      <div className='text-sm text-gray-500'>{t('performance.total')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Expanded */}
              <div className='lg:col-span-4 bg-white rounded-xl shadow-sm p-6 w-full'>
                <h3 className='text-xl font-semibold text-gray-900 mb-6'>
                  {t('quickActionsExpanded.title')}
                </h3>

                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <button
                    onClick={handleAddClient}
                    className='bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105'
                  >
                    <UserPlus className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-sm font-medium'>
                      {t('quickActions.addClient')}
                    </div>
                  </button>

                  <button
                    onClick={handleCreateInvoice}
                    className='bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105'
                  >
                    <Receipt className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-sm font-medium'>
                      {t('quickActions.newInvoice')}
                    </div>
                  </button>

                  <button
                    onClick={handleTrackExpense}
                    className='bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-all transform hover:scale-105'
                  >
                    <DollarSign className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-sm font-medium'>
                      {t('quickActions.trackExpense')}
                    </div>
                  </button>

                  <button
                    onClick={handleScheduleMeeting}
                    className='bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105'
                  >
                    <CalendarIcon className='h-6 w-6 mx-auto mb-2' />
                    <div className='text-center text-sm font-medium'>
                      {t('quickActions.scheduleMeeting')}
                    </div>
                  </button>
                </div>

                {/* Additional Actions */}
                <div className='space-y-2'>
                  <button
                    onClick={handleViewSettings}
                    className='w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3'
                  >
                    <Settings className='h-4 w-4 text-gray-600' />
                    <span className='text-sm text-gray-700'>{t('actions.settings')}</span>
                  </button>
                  <button
                    onClick={handleViewReports}
                    className='w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3'
                  >
                    <TrendingUp className='h-4 w-4 text-gray-600' />
                    <span className='text-sm text-gray-700'>{t('actions.reports')}</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary - Expanded */}
              <div className='lg:col-span-3 bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>{t('performance.title')}</h3>
                  <span className='text-blue-600 text-sm font-medium'>
                    {t('performance.thisMonth')}
                  </span>
                </div>

                <div className='space-y-6'>
                  <div className='border-b border-gray-100 pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-gray-500'>{t('performance.monthlyRevenue')}</span>
                      <span className='text-green-600 font-medium flex items-center'>
                        <ArrowUpRight className='h-4 w-4 mr-1' />
                        {revenueData.growth}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-2xl font-bold text-gray-900'>
                        {revenueData.monthly}
                      </span>
                      <span className='text-gray-500 text-sm'>
                        {t('performance.vs')} {revenueData.lastMonth}
                      </span>
                    </div>
                  </div>

                  <div className='border-b border-gray-100 pb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-gray-500'>{t('performance.activeClients')}</span>
                      <span className='text-green-600 font-medium flex items-center'>
                        <ArrowUpRight className='h-4 w-4 mr-1' />
                        {clientData.growth}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-2xl font-bold text-gray-900'>{clientData.active}</span>
                      <span className='text-gray-500 text-sm'>
                        {t('performance.vs')} {clientData.lastMonth}
                      </span>
                    </div>
                  </div>

                  <div className='border-b border-gray-100 pb-4'>
                    <div className='text-gray-500 mb-2'>{t('performance.upcomingEvents')}</div>
                    <div className='flex items-center justify-between'>
                      <span className='text-2xl font-bold text-gray-900'>
                        {upcomingEvents.count}
                      </span>
                      <span className='text-gray-500 text-sm'>{upcomingEvents.period}</span>
                    </div>
                  </div>

                  <div>
                    <div className='text-gray-500 mb-2'>{t('performance.conversionRate')}</div>
                    <div className='flex items-center justify-between'>
                      <span className='text-2xl font-bold text-gray-900'>68%</span>
                      <span className='text-green-600 text-sm flex items-center'>
                        <ArrowUpRight className='h-3 w-3 mr-1' />
                        +3%
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
