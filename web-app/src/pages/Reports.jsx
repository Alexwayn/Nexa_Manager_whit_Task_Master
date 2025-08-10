import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@shared/components/Footer';
import ReportScheduler from '../components/reports/ReportScheduler';
import ReportHistory from '../components/reports/ReportHistory';
import CustomReportBuilder from '../components/reports/CustomReportBuilder';
import ReportPreview from '../components/reports/ReportPreview';
import AdvancedFilters from '../components/reports/AdvancedFilters';
import ReportTemplates from '../components/reports/ReportTemplates';
import { VirtualizedReportTable, OptimizedChart } from '../components/reports';
import { useReportRealTime } from '../hooks/useWebSocket';
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  EyeIcon,
  TrashIcon,
  ShareIcon,
  ChevronRightIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  CreditCardIcon,
  UsersIcon,
  UserPlusIcon,
  HeartIcon,
  Squares2X2Icon,
  XMarkIcon,
  ArchiveBoxIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  useReportMetrics,
  useReportHistory,
  useReportTemplates,
  useScheduledReports,
  useGenerateReport,
  useScheduleReport,
  usePrefetchReports,
  useReportCache,
} from '../features/financial/hooks/useReportsQuery';
import { usePerformanceMonitor } from '@utils/performance';
import Logger from '@/utils/Logger';
import reportingService from '@shared/services/reportingService';

// Define data structures using JSDoc comments
/**
 * @typedef {Object} Metric
 * @property {string} value
 * @property {string} change
 * @property {'up'|'down'} trend
 * @property {React.ComponentType} icon
 * @property {string} bgColor
 * @property {string} iconColor
 */

/**
 * @typedef {Object} Report
 * @property {number|string} id
 * @property {string} name
 * @property {string} date
 * @property {string} type
 * @property {string} status
 * @property {React.ComponentType} icon
 * @property {string} [title]
 * @property {string} [description]
 */

/**
 * @typedef {Object} ChartData
 * @property {number[]} revenue
 * @property {number[]} expenses
 * @property {string[]} months
 */

/**
 * @typedef {Object} ClientAcquisitionData
 * @property {number[]} newClients
 * @property {number[]} churn
 * @property {string[]} months
 */

/**
 * @typedef {Object} SafeChartData
 * @property {ChartData} revenueVsExpenses
 * @property {ClientAcquisitionData} clientAcquisition
 */

/**
 * @typedef {Object} ReportCard
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {React.ComponentType} icon
 * @property {string} iconBg
 * @property {string} iconColor
 */

/**
 * @typedef {Object} DashboardFilters
 * @property {string} dateRange
 * @property {string} category
 * @property {string} department
 */

/**
 * @typedef {Object} DateRange
 * @property {string} startDate
 * @property {string} endDate
 */

const Reports = () => {
  const { t } = useTranslation('reports');
  const navigate = useNavigate();

  // Performance monitoring
  const { startRender, endRender } = usePerformanceMonitor('Reports');

  // Track render performance
  useEffect(() => {
    const renderStart = startRender();
    return () => {
      endRender(renderStart);
    };
  }, [startRender, endRender]);

  const [activeTab, setActiveTab] = useState('financial');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [reportBuilderTab, setReportBuilderTab] = useState('recent');
  const [selectedFormats, setSelectedFormats] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [showAdvancedPreview, setShowAdvancedPreview] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState({
    dateRange: 'last30days',
    category: 'all',
    department: 'all',
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Phase 3 state variables
  const [mainView, setMainView] = useState('dashboard'); // 'dashboard', 'scheduler', 'history', 'builder'
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  // React Query hooks
  const {
    data: hookMetrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useReportMetrics({ timeRange: dashboardFilters.dateRange });

  const {
    data: hookRecentReports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useReportHistory({ limit: 10 });

  const { data: templates, isLoading: templatesLoading } = useReportTemplates();
  const { data: scheduledReports, isLoading: scheduledLoading } = useScheduledReports();

  const generateReportMutation = useGenerateReport();
  const scheduleReportMutation = useScheduleReport();

  usePrefetchReports();

  const { invalidateReports, clearCache } = useReportCache();
  
  // Real-time updates
  const { data: realTimeData, isConnected } = useReportRealTime({
    enabled: realTimeEnabled,
    reportTypes: [activeTab],
  });

  const loading = metricsLoading || reportsLoading;
  const error = metricsError || reportsError;
  const generating = generateReportMutation.isPending;

  const iconMap = {
    CurrencyEuroIcon,
    ArrowTrendingUpIcon,
    ChartBarIcon,
    CreditCardIcon,
    UsersIcon,
    UserPlusIcon,
    HeartIcon,
    DocumentTextIcon,
    DocumentChartBarIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    Squares2X2Icon,
  };

  const metrics = hookMetrics || {
    financial: {
      totalRevenue: {
        value: '€142,500',
        change: '+12%',
        trend: 'up',
        icon: CurrencyDollarIcon,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
      totalInvoices: {
        value: '248',
        change: '+8%',
        trend: 'up',
        icon: DocumentTextIcon,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      activeClients: {
        value: '38',
        change: '+5%',
        trend: 'up',
        icon: UserGroupIcon,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
      },
      outstanding: {
        value: '€24,350',
        change: '-3%',
        trend: 'down',
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
      },
    },
    client: {
      totalClients: {
        value: '247',
        change: '+8.2%',
        trend: 'up',
        icon: UserGroupIcon,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
      activeClients: {
        value: '189',
        change: '+5.1%',
        trend: 'up',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
      },
      newClients: {
        value: '23',
        change: '+15.0%',
        trend: 'up',
        icon: ArrowTrendingUpIcon,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      retentionRate: {
        value: '94.2%',
        change: '+1.8%',
        trend: 'up',
        icon: ChartBarIcon,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
      },
    },
    custom: {
      totalReports: {
        value: '28',
        change: '+25%',
        trend: 'up',
        icon: DocumentChartBarIcon,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
      scheduledReports: {
        value: '12',
        change: '+15%',
        trend: 'up',
        icon: ClockIcon,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
      },
      dataExports: {
        value: '45',
        change: '+8%',
        trend: 'up',
        icon: ArrowDownTrayIcon,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      customDashboards: {
        value: '6',
        change: '+20%',
        trend: 'up',
        icon: Cog6ToothIcon,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
      },
    },
  };

  const formattedRecentReports = (hookRecentReports || []).map((report) => ({
    ...report,
    icon: iconMap[report.icon] || DocumentTextIcon,
  }));

  const recentReports = formattedRecentReports.length > 0 ? formattedRecentReports : [
    {
      id: 1,
      name: t('sampleReports.monthlyRevenueSummary'),
      date: 'Jun 15, 2024',
      type: t('reportTypes.financial'),
      status: t('status.generated'),
      icon: DocumentChartBarIcon,
    },
    {
      id: 2,
      name: t('sampleReports.clientAcquisitionReport'),
      date: 'Jun 12, 2024',
      type: t('reportTypes.client'),
      status: t('status.generated'),
      icon: UserGroupIcon,
    },
    {
      id: 3,
      name: t('sampleReports.outstandingInvoices'),
      date: 'Jun 10, 2024',
      type: t('reportTypes.financial'),
      status: t('status.generated'),
      icon: DocumentTextIcon,
    },
    {
      id: 4,
      name: t('sampleReports.quarterlyPerformance'),
      date: 'Jun 5, 2024',
      type: t('reportTypes.performance'),
      status: t('status.generated'),
      icon: ChartBarIcon,
    },
  ];

  const safeChartData = {
    revenueVsExpenses: {
      revenue: [],
      expenses: [],
      months: [],
    },
    clientAcquisition: {
      newClients: [],
      churn: [],
      months: [],
    },
  };

  const reportCards = {
    financial: [
      {
        id: 'financial-summary',
        title: t('cards.financial.financialSummary.title'),
        description: t('cards.financial.financialSummary.description'),
        icon: ChartBarIcon,
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200 hover:border-blue-300',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'revenue-analysis',
        title: t('cards.financial.revenueAnalysis.title'),
        description: t('cards.financial.revenueAnalysis.description'),
        icon: ArrowTrendingUpIcon,
        gradient: 'from-green-50 to-green-100',
        border: 'border-green-200 hover:border-green-300',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 'expense-breakdown',
        title: t('cards.financial.expenseBreakdown.title'),
        description: t('cards.financial.expenseBreakdown.description'),
        icon: CreditCardIcon,
        gradient: 'from-red-50 to-red-100',
        border: 'border-red-200 hover:border-red-300',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
      },
      {
        id: 'profit-loss',
        title: t('cards.financial.profitLoss.title'),
        description: t('cards.financial.profitLoss.description'),
        icon: DocumentTextIcon,
        gradient: 'from-purple-50 to-purple-100',
        border: 'border-purple-200 hover:border-purple-300',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    ],
    client: [
      {
        id: 'client-performance',
        title: t('cards.client.clientPerformance.title'),
        description: t('cards.client.clientPerformance.description'),
        icon: UserGroupIcon,
        gradient: 'from-emerald-50 to-emerald-100',
        border: 'border-emerald-200 hover:border-emerald-300',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'client-acquisition',
        title: t('cards.client.clientAcquisition.title'),
        description: t('cards.client.clientAcquisition.description'),
        icon: UserPlusIcon,
        gradient: 'from-cyan-50 to-cyan-100',
        border: 'border-cyan-200 hover:border-cyan-300',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 'client-retention',
        title: t('cards.client.clientRetention.title'),
        description: t('cards.client.clientRetention.description'),
        icon: HeartIcon,
        gradient: 'from-pink-50 to-pink-100',
        border: 'border-pink-200 hover:border-pink-300',
        iconBg: 'bg-pink-100',
        iconColor: 'text-pink-600',
      },
      {
        id: 'top-clients-revenue',
        title: t('cards.client.topClientsRevenue.title'),
        description: t('cards.client.topClientsRevenue.description'),
        icon: CurrencyEuroIcon,
        gradient: 'from-yellow-50 to-yellow-100',
        border: 'border-yellow-200 hover:border-yellow-300',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
    ],
    custom: [
      {
        id: 'custom-dashboard',
        title: t('cards.custom.customDashboard.title'),
        description: t('cards.custom.customDashboard.description'),
        icon: Cog6ToothIcon,
        gradient: 'from-indigo-50 to-indigo-100',
        border: 'border-indigo-200 hover:border-indigo-300',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'report-templates',
        title: t('cards.custom.reportTemplates.title'),
        description: t('cards.custom.reportTemplates.description'),
        icon: DocumentChartBarIcon,
        gradient: 'from-slate-50 to-slate-100',
        border: 'border-slate-200 hover:border-slate-300',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
      {
        id: 'scheduled-reports',
        title: t('cards.custom.scheduledReports.title'),
        description: t('cards.custom.scheduledReports.description'),
        icon: ClockIcon,
        gradient: 'from-orange-50 to-orange-100',
        border: 'border-orange-200 hover:border-orange-300',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
      {
        id: 'data-export',
        title: t('cards.custom.dataExport.title'),
        description: t('cards.custom.dataExport.description'),
        icon: ArrowDownTrayIcon,
        gradient: 'from-teal-50 to-teal-100',
        border: 'border-teal-200 hover:border-teal-300',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
      },
    ],
  };

  const handleGenerateReport = async (reportId, format = 'pdf') => {
    try {
      Logger.info('Generating report:', { reportId, format });

      const result = await generateReportMutation.mutateAsync({
        reportId,
        format,
        dateRange,
        filters: dashboardFilters,
      });

      if (result && result.success) {
        Logger.info('Report generated successfully:', result);

        if (result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (result.blob) {
          const url = window.URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else if (result.data) {
          let content, mimeType, extension;

          switch (format) {
            case 'csv':
              content = result.data;
              mimeType = 'text/csv';
              extension = 'csv';
              break;
            case 'json':
              content = JSON.stringify(result.data, null, 2);
              mimeType = 'application/json';
              extension = 'json';
              break;
            default:
              content = result.data;
              mimeType = 'application/octet-stream';
              extension = format;
          }

          const blob = new Blob([content], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }

        Logger.info(`Report ${reportId} generated successfully in ${format} format`);
      } else {
        throw new Error(result?.error || 'Failed to generate report');
      }
    } catch (err) {
      Logger.error('Error generating report:', err);
      console.error(`Failed to generate report ${reportId}:`, err.message);
    }
  };

  const handleAdvancedPreview = (report) => {
    const enhancedReport = {
      ...report,
      dateRange,
      metrics: [
        { label: t('reportContent.metrics.totalRevenue'), value: 125000, type: 'currency', change: 12.5 },
        { label: t('reportContent.metrics.totalExpenses'), value: 85000, type: 'currency', change: -5.2 },
        { label: t('reportContent.metrics.netProfit'), value: 40000, type: 'currency', change: 18.7 },
        { label: t('reportContent.metrics.profitMargin'), value: 32, type: 'percentage', change: 3.2 },
      ],
      charts: [
        { title: t('reportContent.charts.revenueVsExpenses'), type: 'bar', component: null },
        { title: t('reportContent.charts.monthlyTrends'), type: 'line', component: null },
      ],
      tables: [
        {
          title: t('reportContent.tables.revenueBreakdown'),
          headers: [
            t('reportContent.tables.headers.category'), 
            t('reportContent.tables.headers.amount'), 
            t('reportContent.tables.headers.percentage')
          ],
          rows: [
            [t('reportContent.tables.categories.productSales'), 75000, '60%'],
            [t('reportContent.tables.categories.serviceRevenue'), 35000, '28%'],
            [t('reportContent.tables.categories.otherIncome'), 15000, '12%'],
          ],
        },
      ],
      summary: t('reportContent.sampleSummary'),
      confidential: true,
    };

    setPreviewReport(enhancedReport);
    setShowAdvancedPreview(true);
  };

  const handleAdvancedExport = async (report, format) => {
    try {
      Logger.info('Exporting report with advanced options:', { reportId: report.id, format });

      const result = await generateReportMutation.mutateAsync({
        reportId: report.id,
        format,
        dateRange,
        includeCharts: true,
        includeMetrics: true,
        includeSummary: true,
        template: 'professional',
      });

      if (result && result.success) {
        if (result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `${report.title || report.name}-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        Logger.info('Report exported successfully');
      } else {
        throw new Error(result?.error || 'Failed to export report');
      }
    } catch (err) {
      Logger.error('Error exporting report:', err);
      alert(`Failed to export report: ${err.message}`);
    }
  };

  const handleQuickReportFromDashboard = (reportType, filters = {}) => {
    const quickReport = {
      id: `quick-${Date.now()}`,
      name: `Quick ${reportType} Report`,
      description: 'Generated from dashboard with current filters',
      type: reportType,
      date: new Date().toISOString().split('T')[0],
      status: 'New',
      icon: DocumentTextIcon,
      ...filters,
    };
    handleAdvancedPreview(quickReport);
  };

  const applyDashboardFilters = useCallback((filters) => {
    setDashboardFilters(filters);
    const now = new Date();
    let startDate;

    switch (filters.dateRange) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
  }, []);

  const SimpleBarChart = ({ data, title }) => {
    if (!data || !data.revenue || data.revenue.length === 0) {
      return (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-card-title font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-body text-gray-500">{t('charts.noDataAvailable')}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-card-title font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.revenue.map((revenue, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 flex-1">
              <div className="w-full relative h-48">
                <div
                  className="absolute bottom-0 w-full bg-blue-500 rounded-t"
                  style={{ height: `${(revenue / Math.max(...data.revenue)) * 100}%` }}
                ></div>
                {data.expenses && (
                  <div
                    className="absolute bottom-0 w-full bg-gray-300 rounded-t opacity-70"
                    style={{
                      height: `${(data.expenses[index] / Math.max(...data.revenue)) * 100}%`,
                    }}
                  ></div>
                )}
              </div>
              <span className="text-caption text-gray-600">{data.months[index]}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-body text-gray-600">{t('charts.revenue')}</span>
          </div>
          {data.expenses && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-body text-gray-600">{t('charts.expenses')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SimplePieChart = ({ title, data }) => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-card-title font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center h-48">
        <div className="w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center bg-gray-100">
          <span className="text-body text-gray-600">{t('charts.chart')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-2 text-nav-text">
          <HomeIcon className="h-5 w-5 text-blue-600" />
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {t('breadcrumb.dashboard')}
          </button>
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600 font-bold">{t('breadcrumb.reports')}</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title font-semibold text-black">{t('title')}</h1>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-body font-normal text-black hover:bg-gray-50">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>{timeRange}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-body font-normal text-black hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-500" />
              <span>{t('buttons.advancedFilters')}</span>
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-body font-normal text-black hover:bg-gray-50"
            >
              <BookmarkIcon className="h-4 w-4 text-gray-500" />
              <span>{t('buttons.templates')}</span>
            </button>
            <button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-body font-normal transition-colors ${
                realTimeEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'border border-gray-300 bg-white text-black hover:bg-gray-50'
              }`}
            >
              <BoltIcon className={`h-4 w-4 ${realTimeEnabled ? 'text-white' : 'text-gray-500'}`} />
              <span>{t('buttons.realTime')} {isConnected ? '🟢' : '🔴'}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-body font-normal hover:bg-blue-700">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{t('buttons.export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setMainView('dashboard')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'dashboard'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <HomeIcon className="h-4 w-4" />
            <span>{t('navigation.dashboard')}</span>
          </button>
          <button
            onClick={() => setMainView('scheduler')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'scheduler'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            <span>{t('navigation.scheduleReports')}</span>
          </button>
          <button
            onClick={() => setMainView('history')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'history'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            <span>{t('navigation.reportHistory')}</span>
          </button>
          <button
            onClick={() => setMainView('builder')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'builder'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>{t('navigation.customBuilder')}</span>
          </button>
        </div>
      </div>

      {/* Dashboard Sub-Navigation */}
      {mainView === 'dashboard' && (
        <div className="border-b border-gray-100 px-6 bg-gray-50 py-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('financial')}
              className={`py-3 px-4 text-sm font-medium border-b-2 rounded-md transition-all duration-200 ${
                activeTab === 'financial'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('tabs.financialReports')}
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`py-3 px-4 text-sm font-medium border-b-2 rounded-md transition-all duration-200 ${
                activeTab === 'client'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('tabs.clientReports')}
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-3 px-4 text-sm font-medium border-b-2 rounded-md transition-all duration-200 ${
                activeTab === 'custom'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('tabs.customReports')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {mainView === 'dashboard' && (
        <>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportCards[activeTab]?.map((report) => {
                const IconComponent = report.icon;
                return (
                  <div
                    key={report.id}
                    className={`bg-gradient-to-br ${report.gradient} border ${report.border} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200`}
                  >
                    <div className="mb-3">
                      <div
                        className={`${report.iconBg} rounded-lg p-2.5 w-10 h-10 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer`}
                      >
                        <IconComponent className={`h-5 w-5 ${report.iconColor}`} />
                      </div>
                    </div>
                    <h3 className="text-card-title font-semibold text-gray-900 mb-1">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-5">{report.description}</p>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">{t('format')}</label>
                      <select
                        value={selectedFormats[report.id] || 'pdf'}
                        onChange={(e) =>
                          setSelectedFormats((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pdf">{t('formatOptions.pdf')}</option>
                        <option value="csv">{t('formatOptions.csv')}</option>
                        <option value="excel">{t('formatOptions.excel')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAdvancedPreview(report)}
                          className="flex items-center justify-center space-x-1 py-2 px-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <EyeIcon className="h-3 w-3" />
                          <span>{t('buttons.preview')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setScheduleReport(report);
                            setShowScheduleModal(true);
                          }}
                          className="flex items-center justify-center space-x-1 py-2 px-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <CalendarIcon className="h-3 w-3" />
                          <span>{t('buttons.schedule')}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleGenerateReport(report.id, selectedFormats[report.id] || 'pdf')}
                        disabled={generating}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                          generating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{t('buttons.generating')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t('buttons.generateNow')}</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-12 px-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('loading')}</span>
        </div>
      )}

      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('error.title')}</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  {t('error.tryAgain')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Dashboard */}
      {!loading && !error && metrics[activeTab] && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(metrics[activeTab]).map(([key, metric]) => {
              const IconComponent = metric.icon;
              return (
                <div key={key} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.bgColor} rounded-lg p-2 w-9 h-9 flex items-center justify-center`}>
                      <IconComponent className={`h-5 w-5 ${metric.iconColor}`} />
                    </div>
                    <div
                      className={`flex items-center space-x-1 text-body ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-body text-gray-600 mb-1">
                      {t(`metrics.${key}`) || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </p>
                    <p className="text-page-title font-semibold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Reports Table */}
      {mainView === 'dashboard' && (
        <div className="px-6 py-6">
          <VirtualizedReportTable
            data={recentReports}
            columns={[
              {
                key: 'name',
                label: t('table.reportName'),
                width: 300,
                render: (value, row) => {
                  const IconComponent = row.icon || DocumentTextIcon;
                  return (
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-md p-2">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-body font-medium text-gray-900">{value}</span>
                    </div>
                  );
                }
              },
              { key: 'date', label: t('table.date'), width: 120, sortable: true },
              {
                key: 'type',
                label: t('table.type'),
                width: 120,
                render: (value) => (
                  <span
                    className={`inline-flex px-2 py-1 text-caption font-medium rounded-full ${
                      value === t('reportTypes.financial')
                        ? 'bg-blue-100 text-blue-800'
                        : value === t('reportTypes.client')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {value}
                  </span>
                ),
              },
              {
                key: 'status',
                label: t('table.status'),
                width: 120,
                render: (value) => (
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-body text-gray-600">{value}</span>
                  </div>
                ),
              },
              {
                key: 'actions',
                label: t('table.actions'),
                width: 120,
                render: (_, row) => (
                  <div className="flex justify-end space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            height={400}
            emptyMessage={t('table.noReports')}
            emptyDescription={t('table.noReportsDescription')}
            searchable
            exportable
          />
        </div>
      )}

      {/* Modals and Phase 3 Components */}
      {showScheduleModal && scheduleReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('schedule.modalTitle')}: {scheduleReport.title || scheduleReport.name}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const config = {
                    reportType: scheduleReport.id,
                    format: formData.get('format'),
                    frequency: formData.get('frequency'),
                    email: formData.get('email'),
                  };
                  try {
                    await reportingService.scheduleReport(config);
                    setShowScheduleModal(false);
                    Logger.info('Report scheduled successfully');
                  } catch (error) {
                    Logger.error('Error scheduling report:', error);
                  }
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('schedule.format')}</label>
                    <select
                      name="format"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pdf">{t('formatOptions.pdf')}</option>
                      <option value="csv">{t('formatOptions.csv')}</option>
                      <option value="excel">{t('formatOptions.excel')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('schedule.frequency')}</label>
                    <select
                      name="frequency"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">{t('schedule.frequencies.daily')}</option>
                      <option value="weekly">{t('schedule.frequencies.weekly')}</option>
                      <option value="monthly">{t('schedule.frequencies.monthly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('schedule.emailAddress')}</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={t('schedule.emailPlaceholder')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {t('buttons.scheduleReport')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mainView === 'scheduler' && (
        <div className="px-6 py-6">
          <ReportScheduler />
        </div>
      )}

      {mainView === 'history' && (
        <div className="px-6 py-6">
          <ReportHistory />
        </div>
      )}

      {mainView === 'builder' && (
        <div className="px-6 py-6">
          <CustomReportBuilder />
        </div>
      )}

      {showAdvancedPreview && previewReport && (
        <ReportPreview
          report={previewReport}
          onClose={() => {
            setShowAdvancedPreview(false);
            setPreviewReport(null);
          }}
          onEdit={(report) => {
            setShowAdvancedPreview(false);
            setShowCustomBuilder(true);
            setMainView('builder');
          }}
          onExport={(report, format) => handleAdvancedExport(report, format)}
        />
      )}

      {showAdvancedFilters && (
        <AdvancedFilters
          filters={dashboardFilters}
          onApply={(filters) => {
            applyDashboardFilters(filters);
            setShowAdvancedFilters(false);
          }}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}

      {showTemplates && (
        <ReportTemplates
          onSelectTemplate={(template) => {
            handleGenerateReport(template.id, 'pdf');
            setShowTemplates(false);
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default Reports;
