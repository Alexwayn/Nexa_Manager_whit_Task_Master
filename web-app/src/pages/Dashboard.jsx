import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Footer from '@components/shared/Footer';
import EnhancedDashboard from '@components/dashboard/EnhancedDashboard';
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
  Grid,
  BarChart3,
} from 'lucide-react';
import nexaFooterLogo from '@assets/logo_nexa_footer.png';
import nexaLogo from '@assets/logo_nexa.png';

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  
  // State to toggle between enhanced and classic dashboard
  const [useEnhancedDashboard, setUseEnhancedDashboard] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard-mode');
      return saved ? JSON.parse(saved) : true; // Default to enhanced dashboard
    } catch (error) {
      return true;
    }
  });

  const toggleDashboardMode = () => {
    const newMode = !useEnhancedDashboard;
    setUseEnhancedDashboard(newMode);
    localStorage.setItem('dashboard-mode', JSON.stringify(newMode));
  };

  // If enhanced dashboard is enabled, render it directly
  if (useEnhancedDashboard) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Dashboard Mode Toggle */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={toggleDashboardMode}
              className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all text-sm"
              title={t('switchToClassic')}
            >
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-gray-700">Classic View</span>
            </button>
          </div>
          
          <EnhancedDashboard />
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  // Classic Dashboard Implementation (existing code)
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
        {/* Dashboard Mode Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleDashboardMode}
            className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all text-sm"
            title={t('switchToEnhanced')}
          >
            <Grid className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700">Enhanced View</span>
          </button>
        </div>

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
                      <div className='w-3 h-3 bg-green-600 rounded-full'></div>
                      <span className='text-gray-900'>{t('revenueStreams.consulting')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>45%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-orange-600 rounded-full'></div>
                      <span className='text-gray-900'>{t('revenueStreams.products')}</span>
                    </div>
                    <span className='text-gray-900 font-medium'>30%</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-indigo-600 rounded-full'></div>
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

                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-green-600 rounded-full flex items-center justify-center'>
                        <CheckCircle className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>{t('invoiceTracker.paid')}</div>
                        <div className='text-sm text-gray-500'>{t('values.paidAmount')}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-green-600'>
                        {t('values.paidAmount')}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center'>
                        <Clock className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>{t('invoiceTracker.pending')}</div>
                        <div className='text-sm text-gray-500'>{t('invoiceTracker.outstanding')}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {t('values.pendingAmount')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Overview Chart */}
            <div className='bg-white rounded-xl shadow-sm p-6 w-full'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {t('revenueOverview.title')}
                </h3>
                <div className='flex items-center space-x-2'>
                  <button className='px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full'>
                    {t('revenueOverview.monthly')}
                  </button>
                  <button className='px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-full'>
                    {t('revenueOverview.quarterly')}
                  </button>
                  <button className='px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-full'>
                    {t('revenueOverview.yearly')}
                  </button>
                </div>
              </div>

              {/* Chart Area */}
              <div className='relative h-64 mb-4'>
                <svg className='w-full h-full' viewBox='0 0 800 200'>
                  {/* Grid lines */}
                  <defs>
                    <pattern
                      id='grid'
                      width='40'
                      height='40'
                      patternUnits='userSpaceOnUse'
                    >
                      <path
                        d='M 40 0 L 0 0 0 40'
                        fill='none'
                        stroke='#f3f4f6'
                        strokeWidth='1'
                      />
                    </pattern>
                  </defs>
                  <rect width='100%' height='100%' fill='url(#grid)' />

                  {/* Y-axis labels */}
                  <text x='10' y='20' className='text-xs fill-gray-500'>
                    {t('values.chartMax')}
                  </text>
                  <text x='10' y='70' className='text-xs fill-gray-500'>
                    {t('values.chartHigh')}
                  </text>
                  <text x='10' y='120' className='text-xs fill-gray-500'>
                    {t('values.chartMid')}
                  </text>
                  <text x='10' y='190' className='text-xs fill-gray-500'>
                    {t('values.chartMin')}
                  </text>

                  {/* Chart line */}
                  <polyline
                    fill='none'
                    stroke='#3b82f6'
                    strokeWidth='3'
                    points={revenueChartData
                      .map((point, index) => {
                        const x = 80 + (index * 100);
                        const y = 180 - (point.revenue / 30000) * 160;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {/* Data points */}
                  {revenueChartData.map((point, index) => {
                    const x = 80 + (index * 100);
                    const y = 180 - (point.revenue / 30000) * 160;
                    return (
                      <g key={index}>
                        <circle cx={x} cy={y} r='4' fill='#3b82f6' />
                        <text x={x} y='200' className='text-xs fill-gray-600 text-anchor-middle'>
                          {point.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <p className='text-sm text-gray-600'>{t('revenueOverview.trendDescription')}</p>
            </div>

            {/* Bottom Row - Clients, Work, Notifications, Quick Actions, Performance */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 w-full'>
              {/* Recent Clients */}
              <div className='lg:col-span-3 bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('recentClients.title')}
                  </h3>
                  <button
                    onClick={handleViewAllClients}
                    className='text-blue-600 text-sm hover:text-blue-800'
                  >
                    {t('recentClients.viewAll')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {recentClients.map((client, index) => (
                    <div
                      key={client.id}
                      className='flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'
                      onClick={() => handleViewDetails(client.id)}
                    >
                      <div
                        className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {client.initials}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-2'>
                          <h4 className='font-medium text-gray-900 truncate'>{client.name}</h4>
                          <div
                            className={`w-2 h-2 ${getStatusColor(client.status)} rounded-full`}
                          ></div>
                        </div>
                        <p className='text-sm text-gray-500 truncate'>{client.industry}</p>
                        <p className='text-xs text-gray-400'>{client.lastContact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Work */}
              <div className='lg:col-span-2 bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>{t('upcomingWork.title')}</h3>
                  <button
                    onClick={handleViewCalendar}
                    className='text-blue-600 text-sm hover:text-blue-800'
                  >
                    {t('upcomingWork.viewCalendar')}
                  </button>
                </div>

                <div className='space-y-4'>
                  {upcomingWork.map(work => {
                    const IconComponent = work.icon;
                    return (
                      <div key={work.id} className='flex items-start space-x-3'>
                        <div className={`${work.color} p-2 rounded-lg flex-shrink-0`}>
                          <IconComponent className='h-4 w-4 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-medium text-gray-900 text-sm'>{work.title}</h4>
                          <p className='text-xs text-gray-500 truncate'>{work.client}</p>
                          <div className='flex items-center space-x-2 mt-1'>
                            <span className='text-xs text-gray-400'>{work.time}</span>
                            <span className='text-xs text-gray-400'>•</span>
                            <span className='text-xs text-gray-400'>{work.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddNewEvent}
                  className='w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  {t('upcomingWork.addNewEvent')}
                </button>
              </div>

              {/* Recent Notifications */}
              <div className='lg:col-span-3 bg-white rounded-xl shadow-sm p-6 w-full'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    {t('recentNotifications.title')}
                  </h3>
                  <button
                    onClick={handleViewAllNotifications}
                    className='text-blue-600 text-sm hover:text-blue-800'
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
