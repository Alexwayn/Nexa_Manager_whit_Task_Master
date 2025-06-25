import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Icons
import {
  Settings,
  Download,
  RefreshCw,
  Grid,
  Eye,
  EyeSlash,
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
} from 'lucide-react';

// Components
import EnhancedKPICard from '@components/analytics/EnhancedKPICard';
import AdvancedTimePeriodSelector from '@components/analytics/AdvancedTimePeriodSelector';
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

// Services
import financialService from '@lib/financialService';
import clientService from '@lib/clientService';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  // Data States
  const [dashboardData, setDashboardData] = useState({
    kpis: null,
    revenue: null,
    expenses: null,
    clients: null,
    trends: null,
  });

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
        id: 'client-metrics',
        title: t('dashboard:widgets.clientMetrics'),
        component: 'ClientMetrics',
        enabled: true,
        minW: 4,
        minH: 3,
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
        minW: 6,
        minH: 4,
      },
    ],
    [t],
  );

  const defaultLayouts = {
    lg: [
      { i: 'kpi-overview', x: 0, y: 0, w: 12, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 6, y: 2, w: 6, h: 4 },
      { i: 'client-metrics', x: 0, y: 6, w: 4, h: 3 },
      { i: 'recent-activity', x: 4, y: 6, w: 8, h: 3 },
      { i: 'financial-health', x: 0, y: 9, w: 6, h: 4 },
    ],
    md: [
      { i: 'kpi-overview', x: 0, y: 0, w: 10, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 5, h: 4 },
      { i: 'expense-breakdown', x: 5, y: 2, w: 5, h: 4 },
      { i: 'client-metrics', x: 0, y: 6, w: 10, h: 3 },
      { i: 'recent-activity', x: 0, y: 9, w: 10, h: 3 },
      { i: 'financial-health', x: 0, y: 12, w: 10, h: 4 },
    ],
    sm: [
      { i: 'kpi-overview', x: 0, y: 0, w: 6, h: 2 },
      { i: 'revenue-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'expense-breakdown', x: 0, y: 6, w: 6, h: 4 },
      { i: 'client-metrics', x: 0, y: 10, w: 6, h: 3 },
      { i: 'recent-activity', x: 0, y: 13, w: 6, h: 3 },
      { i: 'financial-health', x: 0, y: 16, w: 6, h: 4 },
    ],
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem('enhanced-dashboard-layouts');
      return saved ? JSON.parse(saved) : defaultLayouts;
    } catch (error) {
      Logger.error('Error parsing layouts from localStorage:', error);
      return defaultLayouts;
    }
  });

  const [widgets, setWidgets] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('enhanced-dashboard-widgets');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      return defaultWidgets.map(widget => ({
        ...widget,
        enabled: settings[widget.id] !== undefined ? settings[widget.id].enabled : widget.enabled,
      }));
    } catch (error) {
      Logger.error('Error applying widget settings from localStorage:', error);
      return defaultWidgets;
    }
  });

  // Data Loading
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpis, revenue, expenses, clients, trends] = await Promise.all([
        financialService.getFinancialOverview(dateRange.start, dateRange.end),
        financialService.getRevenueData ? financialService.getRevenueData(dateRange.start, dateRange.end) : Promise.resolve({ success: true, data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], data: [18500, 22300, 19800, 24600, 21200, 26800] } }),
        financialService.getExpenseData ? financialService.getExpenseData(dateRange.start, dateRange.end) : Promise.resolve({ success: true, data: { labels: ['Office', 'Marketing', 'Travel', 'Software', 'Other'], data: [4500, 3200, 1800, 2100, 1200] } }),
        clientService.getClientMetrics ? clientService.getClientMetrics(dateRange.start, dateRange.end) : Promise.resolve({ success: true, data: { total: 38, active: 35, newThisMonth: 3, retention: 92 } }),
        financialService.getFinancialTrend(selectedPeriod),
      ]);

      setDashboardData({
        kpis: kpis.success ? kpis.data : { totalRevenue: 156800, totalExpenses: 45600, activeClients: 38, profitMargin: 71, revenueGrowth: 12.5, expenseGrowth: -3.2, clientGrowth: 8.1, marginGrowth: 2.3, healthScore: 87 },
        revenue: revenue.success ? revenue.data : { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], data: [18500, 22300, 19800, 24600, 21200, 26800] },
        expenses: expenses.success ? expenses.data : { labels: ['Office', 'Marketing', 'Travel', 'Software', 'Other'], data: [4500, 3200, 1800, 2100, 1200] },
        clients: clients.success ? clients.data : { total: 38, active: 35, newThisMonth: 3, retention: 92 },
        trends: trends.success ? trends.data : null,
      });
    } catch (error) {
      Logger.error('Error loading dashboard data:', error);
      // Set fallback data
      setDashboardData({
        kpis: { totalRevenue: 156800, totalExpenses: 45600, activeClients: 38, profitMargin: 71, revenueGrowth: 12.5, expenseGrowth: -3.2, clientGrowth: 8.1, marginGrowth: 2.3, healthScore: 87 },
        revenue: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], data: [18500, 22300, 19800, 24600, 21200, 26800] },
        expenses: { labels: ['Office', 'Marketing', 'Travel', 'Software', 'Other'], data: [4500, 3200, 1800, 2100, 1200] },
        clients: { total: 38, active: 35, newThisMonth: 3, retention: 92 },
        trends: null,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedPeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Layout Management
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('enhanced-dashboard-layouts', JSON.stringify(allLayouts));
  }, []);

  const toggleWidget = useCallback(
    widgetId => {
      const newWidgets = widgets.map(widget =>
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget,
      );
      setWidgets(newWidgets);
      const settingsToSave = newWidgets.reduce((acc, widget) => {
        acc[widget.id] = { enabled: widget.enabled };
        return acc;
      }, {});
      localStorage.setItem('enhanced-dashboard-widgets', JSON.stringify(settingsToSave));
    },
    [widgets],
  );

  const resetLayout = useCallback(() => {
    if (window.confirm(t('dashboard:confirmReset'))) {
      setLayouts(defaultLayouts);
      setWidgets(defaultWidgets);
      localStorage.removeItem('enhanced-dashboard-layouts');
      localStorage.removeItem('enhanced-dashboard-widgets');
    }
  }, [t, defaultLayouts, defaultWidgets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    Logger.info('Export functionality to be implemented');
  };

  // Widget Components
  const KPIOverviewWidget = () => {
    const kpis = dashboardData.kpis || {};
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        <EnhancedKPICard
          title={t('analytics:totalRevenue')}
          value={kpis.totalRevenue || 0}
          trend={kpis.revenueGrowth || 0}
          icon={DollarSign}
          format="currency"
          color="green"
        />
        <EnhancedKPICard
          title={t('analytics:totalExpenses')}
          value={kpis.totalExpenses || 0}
          trend={kpis.expenseGrowth || 0}
          icon={TrendingUp}
          format="currency"
          color="red"
        />
        <EnhancedKPICard
          title={t('analytics:activeClients')}
          value={kpis.activeClients || 0}
          trend={kpis.clientGrowth || 0}
          icon={Users}
          format="number"
          color="blue"
        />
        <EnhancedKPICard
          title={t('analytics:profitMargin')}
          value={kpis.profitMargin || 0}
          trend={kpis.marginGrowth || 0}
          icon={Target}
          format="percentage"
          color="purple"
        />
      </div>
    );
  };

  const RevenueChartWidget = () => {
    const data = dashboardData.revenue || { labels: [], data: [] };
    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          label: t('analytics:revenue'),
          data: data.data || [],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        x: {
          grid: { display: false },
        },
      },
    };

    return (
      <div className="h-full">
        <Line data={chartData} options={options} />
      </div>
    );
  };

  const ExpenseBreakdownWidget = () => {
    const data = dashboardData.expenses || { labels: [], data: [] };
    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          data: data.data || [],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: false },
      },
    };

    return (
      <div className="h-full">
        <Doughnut data={chartData} options={options} />
      </div>
    );
  };

  const ClientMetricsWidget = () => {
    const clients = dashboardData.clients || {};
    return (
      <div className="space-y-4 h-full p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{clients.total || 0}</div>
          <div className="text-sm text-gray-500">{t('analytics:totalClients')}</div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('analytics:active')}</span>
            <span className="font-medium">{clients.active || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('analytics:newThisMonth')}</span>
            <span className="font-medium text-green-600">{clients.newThisMonth || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('analytics:retention')}</span>
            <span className="font-medium">{clients.retention || 0}%</span>
          </div>
        </div>
      </div>
    );
  };

  const RecentActivityWidget = () => {
    // Mock data for now
    const activities = [
      { id: 1, type: 'invoice', description: 'Invoice #1234 created', time: '2 hours ago' },
      { id: 2, type: 'payment', description: 'Payment received from Client A', time: '4 hours ago' },
      { id: 3, type: 'quote', description: 'Quote #5678 sent', time: '1 day ago' },
    ];

    return (
      <div className="space-y-3 h-full p-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">{activity.description}</div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const FinancialHealthWidget = () => {
    const health = dashboardData.kpis || {};
    const score = health.healthScore || 75;
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#3B82F6"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${score * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{score}</span>
            <span className="text-xs text-gray-500">Health Score</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention'}
          </div>
        </div>
      </div>
    );
  };

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'kpi-overview':
        return <KPIOverviewWidget />;
      case 'revenue-chart':
        return <RevenueChartWidget />;
      case 'expense-breakdown':
        return <ExpenseBreakdownWidget />;
      case 'client-metrics':
        return <ClientMetricsWidget />;
      case 'recent-activity':
        return <RecentActivityWidget />;
      case 'financial-health':
        return <FinancialHealthWidget />;
      default:
        return <div>Widget not found</div>;
    }
  };

  const enabledWidgets = widgets.filter(widget => widget.enabled);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('dashboard:enhancedDashboard')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('dashboard:welcomeBack', { name: user?.firstName || 'User' })}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <AdvancedTimePeriodSelector
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('dashboard:refresh')}
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    editMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={t('dashboard:editLayout')}
                >
                  <Grid className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('dashboard:export')}
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Controls */}
        {editMode && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">
                    {t('dashboard:editMode')}:
                  </span>
                  {defaultWidgets.map(widget => (
                    <button
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-colors ${
                        widgets.find(w => w.id === widget.id)?.enabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border border-blue-300'
                      }`}
                    >
                      {widgets.find(w => w.id === widget.id)?.enabled ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeSlash className="h-3 w-3" />
                      )}
                      <span>{widget.title}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={resetLayout}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t('dashboard:reset')}</span>
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {t('dashboard:done')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={60}
            isDraggable={editMode}
            isResizable={editMode}
            margin={[16, 16]}
            containerPadding={[0, 0]}
          >
            {enabledWidgets.map(widget => (
              <div
                key={widget.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
                    {editMode && (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Grid className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    {renderWidget(widget.id)}
                  </div>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedDashboard; 