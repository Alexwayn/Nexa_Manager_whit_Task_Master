import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import { useTranslation } from 'react-i18next';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '@styles/dashboard.css';

// Icons
import {
  Settings,
  Download,
  RefreshCw,
  Grid,
  Eye,
  EyeOff,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Wifi,
  WifiOff,
  Clock,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingDown,
} from 'lucide-react';

// Components
import EnhancedKPICard from '@components/analytics/EnhancedKPICard';
import AdvancedTimePeriodSelector from '@components/analytics/AdvancedTimePeriodSelector';
import ClientAnalyticsWidgets from '@components/analytics/ClientAnalyticsWidgets';
import ComparativeAnalytics from '@components/analytics/ComparativeAnalytics';
import ErrorBoundary from '@components/common/ErrorBoundary';

// Charts
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Services and Hooks
import financialService from '@lib/financialService';
import clientService from '@lib/clientService';
import exportService from '@lib/exportService';
import useRealtimeDashboard from '@hooks/useRealtimeDashboard';
import Logger from '@utils/Logger';

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

const ResponsiveGridLayout = WidthProvider(Responsive);

const EnhancedDashboard = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation(['dashboard', 'analytics']);

  // Layout and UI States
  const [editMode, setEditMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonType, setComparisonType] = useState('yoy');
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // Real-time dashboard hook
  const { dashboardData, isConnected, loading, error, forceRefresh, toggleRealtime, lastUpdated } =
    useRealtimeDashboard(dateRange, realtimeEnabled);

  // Fallback data for better UX when no real data exists
  const getFallbackData = useCallback(() => {
    const currentMonth = new Date().toLocaleDateString('it-IT', { month: 'long' });
    const lastMonths = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleDateString('it-IT', { month: 'short' });
    }).reverse();

    return {
      kpis: {
        totalRevenue: 0,
        totalExpenses: 0,
        revenueTrend: 0,
        expensesTrend: 0,
        profitTrend: 0,
        healthScore: 85,
      },
      revenue: {
        labels: lastMonths,
        data: [0, 0, 0, 0, 0, 0],
      },
      expenses: {
        labels: ['Ufficio', 'Marketing', 'Tecnologia', 'Viaggi', 'Formazione'],
        data: [0, 0, 0, 0, 0],
      },
      clients: {
        total: 0,
        active: 0,
        newThisMonth: 0,
        trend: 0,
      },
      trends: {
        revenue: 0,
        expenses: 0,
        profit: 0,
      },
    };
  }, []);

  // Get data with fallback
  const getDisplayData = useCallback(() => {
    const fallback = getFallbackData();
    if (!dashboardData || Object.keys(dashboardData).length === 0) {
      return fallback;
    }

    // Merge real data with fallback for missing fields
    return {
      kpis: { ...fallback.kpis, ...dashboardData.kpis },
      revenue: dashboardData.revenue?.labels?.length > 0 ? dashboardData.revenue : fallback.revenue,
      expenses:
        dashboardData.expenses?.labels?.length > 0 ? dashboardData.expenses : fallback.expenses,
      clients: { ...fallback.clients, ...dashboardData.clients },
      trends: { ...fallback.trends, ...dashboardData.trends },
    };
  }, [dashboardData, getFallbackData]);

  const displayData = getDisplayData();

  // Widget Configuration
  const defaultWidgets = useMemo(
    () => [
      {
        id: 'kpi-overview',
        title: t('dashboard:widgets.kpiOverview'),
        component: 'KPIOverview',
        enabled: true,
        minW: 12,
        minH: 2,
      },
      {
        id: 'revenue-chart',
        title: t('dashboard:widgets.revenueChart'),
        component: 'RevenueChart',
        enabled: true,
        minW: 6,
        minH: 4,
      },
      {
        id: 'expense-breakdown',
        title: t('dashboard:widgets.expenseBreakdown'),
        component: 'ExpenseBreakdown',
        enabled: true,
        minW: 6,
        minH: 4,
      },
      {
        id: 'client-analytics',
        title: t('dashboard:widgets.clientAnalytics'),
        component: 'ClientAnalytics',
        enabled: true,
        minW: 12,
        minH: 6,
      },
      {
        id: 'recent-activity',
        title: t('dashboard:widgets.recentActivity'),
        component: 'RecentActivity',
        enabled: true,
        minW: 8,
        minH: 3,
      },
      {
        id: 'financial-health',
        title: t('dashboard:widgets.financialHealth'),
        component: 'FinancialHealth',
        enabled: true,
        minW: 4,
        minH: 3,
      },
      {
        id: 'comparative-analytics',
        title: t('analytics:charts.comparison'),
        component: 'ComparativeAnalytics',
        enabled: compareMode,
        minW: 12,
        minH: 4,
      },
    ],
    [t, compareMode],
  );

  const defaultLayouts = {
    lg: [
      { i: 'kpi-overview', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 6, y: 2, w: 6, h: 4 },
      { i: 'comparative-analytics', x: 0, y: 6, w: 12, h: 4 },
      { i: 'client-analytics', x: 0, y: 10, w: 12, h: 6 },
      { i: 'recent-activity', x: 0, y: 16, w: 8, h: 3 },
      { i: 'financial-health', x: 8, y: 16, w: 4, h: 3 },
    ],
    md: [
      { i: 'kpi-overview', x: 0, y: 0, w: 10, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 5, h: 4 },
      { i: 'expense-breakdown', x: 5, y: 2, w: 5, h: 4 },
      { i: 'comparative-analytics', x: 0, y: 6, w: 10, h: 4 },
      { i: 'client-analytics', x: 0, y: 10, w: 10, h: 6 },
      { i: 'recent-activity', x: 0, y: 16, w: 10, h: 3 },
      { i: 'financial-health', x: 0, y: 19, w: 10, h: 4 },
    ],
    sm: [
      { i: 'kpi-overview', x: 0, y: 0, w: 6, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 0, y: 6, w: 6, h: 4 },
      { i: 'comparative-analytics', x: 0, y: 10, w: 6, h: 4 },
      { i: 'client-analytics', x: 0, y: 14, w: 6, h: 6 },
      { i: 'recent-activity', x: 0, y: 20, w: 6, h: 3 },
      { i: 'financial-health', x: 0, y: 23, w: 6, h: 4 },
    ],
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem('enhanced-dashboard-layouts');
      return saved ? JSON.parse(saved) : defaultLayouts;
    } catch {
      return defaultLayouts;
    }
  });

  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('enhanced-dashboard-widgets');
      return saved ? JSON.parse(saved) : defaultWidgets;
    } catch {
      return defaultWidgets;
    }
  });

  // Save layout changes
  const handleLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
    localStorage.setItem('enhanced-dashboard-layouts', JSON.stringify(layouts));
  }, []);

  // Save widget configuration
  const handleWidgetToggle = useCallback(
    widgetId => {
      const updatedWidgets = widgets.map(widget =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget,
      );
      setWidgets(updatedWidgets);
      localStorage.setItem('enhanced-dashboard-widgets', JSON.stringify(updatedWidgets));
    },
    [widgets],
  );

  const handleRefresh = async () => {
    await forceRefresh();
  };

  // Loading Component
  const LoadingWidget = ({ title }) => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col items-center justify-center'>
      <Loader2 className='h-8 w-8 animate-spin text-blue-500 mb-3' />
      <p className='text-sm text-gray-500'>
        {t('dashboard:loading')} {title}...
      </p>
    </div>
  );

  // Error Component
  const ErrorWidget = ({ title, error }) => (
    <div className='bg-white rounded-xl shadow-sm border border-red-200 p-6 h-full flex flex-col items-center justify-center'>
      <AlertCircle className='h-8 w-8 text-red-500 mb-3' />
      <p className='text-sm text-gray-700 font-medium mb-1'>{title}</p>
      <p className='text-xs text-red-600 text-center'>{error}</p>
    </div>
  );

  // Empty State Component
  const EmptyStateWidget = ({ title, description, icon: Icon = BarChart3 }) => (
    <div className='bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col items-center justify-center'>
      <div className='bg-gray-100 rounded-full p-3 mb-4'>
        <Icon className='h-8 w-8 text-gray-400' />
      </div>
      <p className='text-sm text-gray-700 font-medium mb-2'>{title}</p>
      <p className='text-xs text-gray-500 text-center'>{description}</p>
      <button
        onClick={handleRefresh}
        className='mt-4 px-4 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
      >
        {t('dashboard:actions.refresh')}
      </button>
    </div>
  );

  // KPI Overview Widget with improved design
  const KPIOverviewWidget = () => {
    const kpiData = displayData.kpis || {};

    const kpis = [
      {
        title: t('dashboard:kpis.totalRevenue'),
        value: kpiData.totalRevenue || 0,
        format: 'currency',
        trend: kpiData.revenueTrend || 0,
        icon: DollarSign,
        color: 'green',
      },
      {
        title: t('dashboard:kpis.totalExpenses'),
        value: kpiData.totalExpenses || 0,
        format: 'currency',
        trend: kpiData.expensesTrend || 0,
        icon: TrendingDown,
        color: 'red',
      },
      {
        title: t('dashboard:kpis.netProfit'),
        value: (kpiData.totalRevenue || 0) - (kpiData.totalExpenses || 0),
        format: 'currency',
        trend: kpiData.profitTrend || 0,
        icon: Target,
        color: 'blue',
      },
      {
        title: t('dashboard:kpis.activeClients'),
        value: displayData.clients?.active || 0,
        format: 'number',
        trend: displayData.clients?.trend || 0,
        icon: Users,
        color: 'purple',
      },
    ];

    if (loading) {
      return <LoadingWidget title={t('dashboard:widgets.kpiOverview')} />;
    }

    return (
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 h-full'>
        {kpis.map((kpi, index) => (
          <EnhancedKPICard
            key={index}
            {...kpi}
            className='transform hover:scale-105 transition-transform duration-200'
          />
        ))}
      </div>
    );
  };

  // Revenue Chart Widget with improved design
  const RevenueChartWidget = () => {
    const revenueData = displayData.revenue || { labels: [], data: [] };

    if (loading) {
      return <LoadingWidget title={t('dashboard:widgets.revenueChart')} />;
    }

    if (error) {
      return <ErrorWidget title={t('dashboard:widgets.revenueChart')} error={error} />;
    }

    const hasData = revenueData.data && revenueData.data.some(value => value > 0);

    if (!hasData) {
      return (
        <EmptyStateWidget
          title={t('dashboard:widgets.revenueChart')}
          description={t('dashboard:emptyStates.noRevenueData')}
          icon={TrendingUp}
        />
      );
    }

    const chartData = {
      labels: revenueData.labels || [],
      datasets: [
        {
          label: t('dashboard:widgets.revenue'),
          data: revenueData.data || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            callback: value => `€€{value.toLocaleString()}`,
            color: 'rgb(107, 114, 128)',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgb(107, 114, 128)',
          },
        },
      },
    };

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {t('dashboard:widgets.revenueChart')}
          </h3>
          <div className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-green-500' />
            <span className='text-sm text-gray-500'>{t('dashboard:period.thisMonth')}</span>
          </div>
        </div>
        <div className='h-full' style={{ height: 'calc(100% - 4rem)' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    );
  };

  // Expense Breakdown Widget with improved design
  const ExpenseBreakdownWidget = () => {
    const expenseData = displayData.expenses || { labels: [], data: [] };

    if (loading) {
      return <LoadingWidget title={t('dashboard:widgets.expenseBreakdown')} />;
    }

    if (error) {
      return <ErrorWidget title={t('dashboard:widgets.expenseBreakdown')} error={error} />;
    }

    const hasData = expenseData.data && expenseData.data.some(value => value > 0);

    if (!hasData) {
      return (
        <EmptyStateWidget
          title={t('dashboard:widgets.expenseBreakdown')}
          description={t('dashboard:emptyStates.noExpenseData')}
          icon={PieChart}
        />
      );
    }

    const chartData = {
      labels: expenseData.labels || [],
      datasets: [
        {
          data: expenseData.data || [],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'],
          borderWidth: 0,
          hoverBorderWidth: 3,
          hoverBorderColor: 'white',
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: €€{context.raw.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {t('dashboard:widgets.expenseBreakdown')}
          </h3>
          <PieChart className='h-5 w-5 text-blue-500' />
        </div>
        <div className='h-full' style={{ height: 'calc(100% - 4rem)' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </div>
    );
  };

  // Recent Activity Widget with improved design
  const RecentActivityWidget = () => {
    const activities = [
      {
        type: 'invoice',
        description: t('dashboard:activity.invoiceCreated'),
        time: '2 ore fa',
        icon: FileText,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        type: 'payment',
        description: t('dashboard:activity.paymentReceived'),
        time: '4 ore fa',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-600',
      },
      {
        type: 'client',
        description: t('dashboard:activity.clientAdded'),
        time: '1 giorno fa',
        icon: Users,
        color: 'bg-purple-100 text-purple-600',
      },
    ];

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {t('dashboard:widgets.recentActivity')}
          </h3>
          <Activity className='h-5 w-5 text-gray-400' />
        </div>
        <div className='space-y-4'>
          {activities.map((activity, index) => (
            <div
              key={index}
              className='flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className={`flex-shrink-0 p-2 rounded-lg ${activity.color}`}>
                <activity.icon className='h-4 w-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm text-gray-900 font-medium'>{activity.description}</p>
                <p className='text-xs text-gray-500'>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Financial Health Widget with improved design
  const FinancialHealthWidget = () => {
    const healthScore = displayData.kpis?.healthScore || 85;

    const getHealthColor = score => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getHealthBgColor = score => {
      if (score >= 80) return 'bg-green-500';
      if (score >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getHealthLabel = score => {
      if (score >= 80) return t('dashboard:health.excellent');
      if (score >= 60) return t('dashboard:health.good');
      return t('dashboard:health.needsAttention');
    };

    return (
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {t('dashboard:widgets.financialHealth')}
          </h3>
          <Target className='h-5 w-5 text-gray-400' />
        </div>
        <div className='text-center'>
          <div className='mb-4'>
            <div className={`text-4xl font-bold ${getHealthColor(healthScore)} mb-2`}>
              {healthScore}%
            </div>
            <div className='text-sm text-gray-600 font-medium'>{getHealthLabel(healthScore)}</div>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${getHealthBgColor(healthScore)}`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
          <div className='text-xs text-gray-500'>{t('dashboard:health.basedOnFinancials')}</div>
        </div>
      </div>
    );
  };

  const renderWidget = widgetId => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !widget.enabled) return null;

    switch (widget.component) {
      case 'KPIOverview':
        return <KPIOverviewWidget />;
      case 'RevenueChart':
        return <RevenueChartWidget />;
      case 'ExpenseBreakdown':
        return <ExpenseBreakdownWidget />;
      case 'ClientAnalytics':
        return (
          <ErrorBoundary>
            <ClientAnalyticsWidgets />
          </ErrorBoundary>
        );
      case 'RecentActivity':
        return <RecentActivityWidget />;
      case 'FinancialHealth':
        return <FinancialHealthWidget />;
      case 'ComparativeAnalytics':
        return (
          <ErrorBoundary>
            <ComparativeAnalytics dateRange={dateRange} comparisonType={comparisonType} />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  const enabledWidgets = widgets.filter(w => w.enabled);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
          <div className='mb-4 lg:mb-0'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>{t('dashboard:title')}</h1>
            <p className='text-gray-600'>
              {t('dashboard:subtitle')} {user?.firstName || 'Utente'}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            {/* Period Selector */}
            <AdvancedTimePeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            {/* Connection Status */}
            <div className='flex items-center space-x-2'>
              {isConnected ? (
                <div className='flex items-center space-x-1 text-green-600'>
                  <Wifi className='h-4 w-4' />
                  <span className='text-xs font-medium'>Live</span>
                </div>
              ) : (
                <div className='flex items-center space-x-1 text-red-600'>
                  <WifiOff className='h-4 w-4' />
                  <span className='text-xs font-medium'>Offline</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='h-4 w-4' />
              )}
              <span className='text-sm font-medium'>
                {loading ? t('dashboard:actions.refreshing') : t('dashboard:actions.refresh')}
              </span>
            </button>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                editMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Grid className='h-4 w-4' />
              <span className='text-sm font-medium'>
                {editMode ? t('dashboard:actions.exitEdit') : t('dashboard:actions.editLayout')}
              </span>
            </button>
          </div>
        </div>

        {lastUpdated && (
          <div className='mt-4 text-xs text-gray-500'>
            {t('dashboard:lastUpdated')}: {new Date(lastUpdated).toLocaleString('it-IT')}
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className='layout'
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        isDraggable={editMode}
        isResizable={editMode}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[16, 16]}
      >
        {enabledWidgets.map(widget => (
          <div key={widget.id} className='widget-container'>
            {renderWidget(widget.id)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Edit Mode Panel */}
      {editMode && (
        <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50'>
          <div className='flex items-center space-x-4'>
            <span className='text-sm font-medium text-gray-700'>
              {t('dashboard:editMode.toggleWidgets')}:
            </span>
            {defaultWidgets.map(widget => (
              <label key={widget.id} className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={widget.enabled}
                  onChange={() => handleWidgetToggle(widget.id)}
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-xs text-gray-600'>{widget.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;
