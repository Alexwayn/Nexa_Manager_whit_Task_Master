import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import ReportScheduler from '../components/reports/ReportScheduler';
import ReportHistory from '../components/reports/ReportHistory';
import CustomReportBuilder from '../components/reports/CustomReportBuilder';
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
} from '@heroicons/react/24/outline';
import { useReports } from '@hooks/useReports';
import Logger from '@utils/Logger';

const Reports = () => {
  const { t } = useTranslation('reports');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('financial');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [reportBuilderTab, setReportBuilderTab] = useState('recent');
  const [selectedFormats, setSelectedFormats] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Phase 3 state variables
  const [showScheduler, setShowScheduler] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [mainView, setMainView] = useState('dashboard'); // 'dashboard', 'scheduler', 'history', 'builder'
  
  // Use the reports hook for real data
  const {
    metrics: hookMetrics,
    recentReports: hookRecentReports,
    chartData: hookChartData,
    loading,
    error,
    generating,
    generateReport,
    refreshMetrics
  } = useReports();

  // Icon mapping for metrics (since we store icon names as strings)
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
    Squares2X2Icon
  };

  // Enhanced metrics data matching Motiff design - use hook data if available
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

  // Format recent reports with proper icons
  const formattedRecentReports = (hookRecentReports || []).map(report => ({
    ...report,
    icon: iconMap[report.icon] || DocumentTextIcon
  }));

  // Fallback recent reports data for the table
  const recentReports = formattedRecentReports.length > 0 ? formattedRecentReports : [
    {
      id: 1,
      name: 'Monthly Revenue Summary',
      date: 'Jun 15, 2024',
      type: 'Financial',
      status: 'Generated',
      icon: DocumentChartBarIcon,
    },
    {
      id: 2,
      name: 'Client Acquisition Report',
      date: 'Jun 12, 2024',
      type: 'Client',
      status: 'Generated',
      icon: UserGroupIcon,
    },
    {
      id: 3,
      name: 'Outstanding Invoices',
      date: 'Jun 10, 2024',
      type: 'Financial',
      status: 'Generated',
      icon: DocumentTextIcon,
    },
    {
      id: 4,
      name: 'Quarterly Performance',
      date: 'Jun 5, 2024',
      type: 'Performance',
      status: 'Generated',
      icon: ChartBarIcon,
    },
  ];

  // Use chart data from hook or provide empty fallback
  const safeChartData = hookChartData || {
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
        title: 'Financial Summary',
        description: 'Revenue, expenses, and profit overview',
        icon: ChartBarIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'client-activity',
        title: 'Client Activity',
        description: 'Client engagement and retention metrics',
        icon: UserGroupIcon,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 'invoice-status',
        title: 'Invoice Status',
        description: 'Outstanding, paid, and overdue invoices',
        icon: DocumentTextIcon,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      {
        id: 'revenue-analysis',
        title: 'Revenue Analysis',
        description: 'Detailed revenue streams and trends',
        icon: PresentationChartLineIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    ],
    client: [
      {
        id: 'client-performance',
        title: 'Client Performance',
        description: 'Top performing clients and revenue contribution',
        icon: UserGroupIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'client-retention',
        title: 'Client Retention',
        description: 'Client retention rates and churn analysis',
        icon: CheckCircleIcon,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 'client-satisfaction',
        title: 'Client Satisfaction',
        description: 'Feedback scores and satisfaction metrics',
        icon: EyeIcon,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      {
        id: 'client-growth',
        title: 'Client Growth',
        description: 'New client acquisition and growth trends',
        icon: ArrowTrendingUpIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    ],
    custom: [
      {
        id: 'custom-dashboard',
        title: 'Custom Dashboard',
        description: 'Build your own custom reports and metrics',
        icon: Cog6ToothIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 'data-export',
        title: 'Data Export',
        description: 'Export data in various formats for analysis',
        icon: ArrowDownTrayIcon,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 'scheduled-reports',
        title: 'Scheduled Reports',
        description: 'Automated report generation and delivery',
        icon: ClockIcon,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      {
        id: 'advanced-analytics',
        title: 'Advanced Analytics',
        description: 'Deep dive analytics with custom filters',
        icon: PresentationChartLineIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    ],
  };

  const handleGenerateReport = async (reportId, format = 'pdf') => {
    try {
      Logger.info('Generating report:', { reportId, format });
      
      // Show generation progress
      const result = await generateReport(reportId, { 
        format,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      
      if (result && result.success) {
        Logger.info('Report generated successfully:', result);
        
        // Handle different result types
        if (result.downloadUrl) {
          // Direct download URL
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (result.blob) {
          // Blob data for download
          const url = window.URL.createObjectURL(result.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else if (result.data) {
          // Raw data - convert to downloadable format
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
        
        // Refresh metrics to show updated recent reports
        await refreshMetrics();
        
        // Show success notification (you can replace with toast notification)
        console.log(`Report ${reportId} generated successfully in ${format} format`);
        
      } else {
        throw new Error(result?.error || 'Failed to generate report');
      }
    } catch (err) {
      Logger.error('Error generating report:', err);
      // Show error notification (you can replace with toast notification)
      console.error(`Failed to generate report ${reportId}:`, err.message);
      alert(`Failed to generate report: ${err.message}`);
    }
  };

  // Simple chart components (in a real app, you'd use a charting library like Chart.js or Recharts)
  const SimpleBarChart = ({ data, title }) => {
    // Add safety checks for data
    if (!data || !data.revenue || !data.months) {
      return (
        <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
          <h3 className='text-card-title font-semibold text-gray-900 mb-4'>{title}</h3>
          <div className='h-64 flex items-center justify-center'>
            <div className='text-center'>
              <ChartBarIcon className='h-12 w-12 text-gray-400 mx-auto mb-2' />
              <p className='text-body text-gray-500'>No data available</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
        <h3 className='text-card-title font-semibold text-gray-900 mb-4'>{title}</h3>
        <div className='h-64 flex items-end justify-between space-x-2'>
          {data.revenue.map((value, index) => (
            <div key={index} className='flex flex-col items-center space-y-2 flex-1'>
              <div className='w-full relative h-48'>
                <div
                  className='absolute bottom-0 w-full bg-blue-500 rounded-t'
                  style={{ height: `${(value / Math.max(...data.revenue)) * 100}%` }}
                ></div>
                {data.expenses && data.expenses[index] && (
                  <div
                    className='absolute bottom-0 w-full bg-gray-300 rounded-t opacity-70'
                    style={{
                      height: `${(data.expenses[index] / Math.max(...data.revenue)) * 100}%`,
                    }}
                  ></div>
                )}
              </div>
              <span className='text-caption text-gray-600'>{data.months[index]}</span>
            </div>
          ))}
        </div>
        <div className='flex justify-center mt-4 space-x-6'>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-blue-500 rounded'></div>
            <span className='text-body text-gray-600'>Revenue</span>
          </div>
          {data.expenses && (
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gray-300 rounded'></div>
              <span className='text-body text-gray-600'>Expenses</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SimplePieChart = ({ title, data }) => (
    <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
      <h3 className='text-card-title font-semibold text-gray-900 mb-4'>{title}</h3>
      <div className='flex items-center justify-center h-48'>
        <div className='w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center bg-gray-100'>
          <span className='text-body text-gray-600'>Chart</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-white'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200 px-6 py-3'>
        <div className='flex items-center space-x-2 text-nav-text'>
          <HomeIcon className='h-5 w-5 text-blue-600' />
          <button
            onClick={() => navigate('/dashboard')}
            className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            Dashboard
          </button>
          <ChevronRightIcon className='h-5 w-5 text-gray-400' />
          <span className='text-gray-600 font-bold'>Reports</span>
        </div>
      </div>

      {/* Header */}
      <div className='px-6 py-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-page-title font-semibold text-black'>Reports and Analysis</h1>
          <div className='flex items-center space-x-3'>
            {/* Time Range Selector */}
            <div className='relative'>
              <button className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-body font-normal text-black hover:bg-gray-50'>
                <CalendarIcon className='h-4 w-4 text-gray-500' />
                <span>{timeRange}</span>
                <ChevronDownIcon className='h-4 w-4 text-gray-500' />
              </button>
            </div>

            {/* Export Button */}
            <button className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-body font-normal hover:bg-blue-700'>
              <ArrowDownTrayIcon className='h-4 w-4' />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className='border-b border-gray-200 px-6'>
        <div className='flex space-x-8'>
          <button
            onClick={() => setMainView('dashboard')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'dashboard'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <HomeIcon className='h-4 w-4' />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setMainView('scheduler')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'scheduler'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <ClockIcon className='h-4 w-4' />
            <span>Schedule Reports</span>
          </button>
          <button
            onClick={() => setMainView('history')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'history'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <ArchiveBoxIcon className='h-4 w-4' />
            <span>Report History</span>
          </button>
          <button
            onClick={() => setMainView('builder')}
            className={`py-3 px-4 text-nav-text font-medium border-b-2 flex items-center space-x-2 ${
              mainView === 'builder'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Cog6ToothIcon className='h-4 w-4' />
            <span>Custom Builder</span>
          </button>
        </div>
      </div>

      {/* Dashboard Sub-Navigation */}
      {mainView === 'dashboard' && (
        <div className='border-b border-gray-100 px-6 bg-gray-50'>
          <div className='flex space-x-6'>
            <button
              onClick={() => setActiveTab('financial')}
              className={`py-2 px-3 text-sm font-medium border-b-2 ${
                activeTab === 'financial'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Financial Reports
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`py-2 px-3 text-sm font-medium border-b-2 ${
                activeTab === 'client'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Client Reports
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-3 text-sm font-medium border-b-2 ${
                activeTab === 'custom'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Custom Reports
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {mainView === 'dashboard' && (
        <>
          {/* Report Cards Grid */}
          <div className='px-6 py-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {reportCards[activeTab]?.map(report => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200'
              >
                {/* Icon */}
                <div className='mb-3'>
                  <div
                    className={`${report.iconBg} rounded-lg p-2.5 w-10 h-10 flex items-center justify-center`}
                  >
                    <IconComponent className={`h-5 w-5 ${report.iconColor}`} />
                  </div>
                </div>

                {/* Title */}
                <h3 className='text-card-title font-semibold text-gray-900 mb-1'>{report.title}</h3>

                {/* Description */}
                <p className='text-body text-gray-500 mb-4 leading-5'>{report.description}</p>

                {/* Format Selection */}
                <div className='mb-3'>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Format</label>
                  <select
                    value={selectedFormats[report.id] || 'pdf'}
                    onChange={(e) => setSelectedFormats(prev => ({ ...prev, [report.id]: e.target.value }))}
                    className='w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='pdf'>PDF</option>
                    <option value='csv'>CSV</option>
                    <option value='excel'>Excel</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className='space-y-2'>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => {
                        setPreviewReport(report);
                        setShowPreview(true);
                      }}
                      className='flex items-center justify-center space-x-1 py-2 px-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                    >
                      <EyeIcon className='h-3 w-3' />
                      <span>Preview</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setScheduleReport(report);
                        setShowScheduleModal(true);
                      }}
                      className='flex items-center justify-center space-x-1 py-2 px-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                    >
                      <CalendarIcon className='h-3 w-3' />
                      <span>Schedule</span>
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
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Now</span>
                        <ArrowRightIcon className='h-4 w-4' />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center py-12 px-6'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading reports data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='px-6 py-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>Error loading reports data</h3>
                <p className='mt-1 text-sm text-red-700'>{error}</p>
                <button
                  onClick={refreshMetrics}
                  className='mt-2 text-sm text-red-600 hover:text-red-500 underline'
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Metrics Dashboard */}
      {!loading && !error && metrics[activeTab] && (
        <div className='px-6 py-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {Object.entries(metrics[activeTab]).map(([key, metric]) => {
              const IconComponent = metric.icon;
              return (
                <div key={key} className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
                  <div className='flex items-center justify-between mb-4'>
                    <div
                      className={`${metric.bgColor} rounded-lg p-2 w-9 h-9 flex items-center justify-center`}
                    >
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
                    <p className='text-body text-gray-600 mb-1'>
                      {key.replace(/([A-Z])/g, ' €1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className='text-page-title font-semibold text-gray-900'>{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts and Analytics Section */}
      {activeTab === 'financial' && (
        <div className='px-6 py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <SimpleBarChart data={safeChartData.revenueVsExpenses} title='Revenue vs Expenses' />
            <SimpleBarChart
              data={{
                revenue: safeChartData.clientAcquisition.newClients,
                expenses: safeChartData.clientAcquisition.churn,
                months: safeChartData.clientAcquisition.months,
              }}
              title='Client Acquisition vs Churn'
            />
            <SimplePieChart title='Revenue Sources' data={{}} />
            <SimplePieChart title='Expense Categories' data={{}} />
          </div>
        </div>
      )}

      {/* Custom Report Builder */}
      {activeTab === 'custom' && (
        <div className='px-6 py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Report Builder */}
            <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
              <h3 className='text-card-title font-semibold text-gray-900 mb-4'>Report Builder</h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-body text-gray-700 mb-2'>Report Type</label>
                  <select className='w-full p-2 border border-gray-300 rounded-md text-body'>
                    <option>Financial Overview</option>
                    <option>Client Analysis</option>
                    <option>Performance Metrics</option>
                  </select>
                </div>

                <div>
                  <label className='block text-body text-gray-700 mb-2'>Date Range</label>
                  <div className='grid grid-cols-2 gap-2'>
                    <input
                      type='date'
                      className='p-2 border border-gray-300 rounded-md text-body'
                      placeholder='Start Date'
                    />
                    <input
                      type='date'
                      className='p-2 border border-gray-300 rounded-md text-body'
                      placeholder='End Date'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-body text-gray-700 mb-2'>Metrics</label>
                  <div className='space-y-2'>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-body text-gray-700'>Revenue</span>
                    </label>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-body text-gray-700'>Expenses</span>
                    </label>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-body text-gray-700'>Profit Margin</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className='block text-body text-gray-700 mb-2'>Visualization Type</label>
                  <div className='grid grid-cols-3 gap-2'>
                    <button className='p-3 border-2 border-blue-500 bg-blue-50 rounded-md text-center'>
                      <ChartBarIcon className='h-5 w-5 text-blue-600 mx-auto mb-1' />
                      <span className='text-caption text-blue-600'>Bar Chart</span>
                    </button>
                    <button className='p-3 border border-gray-300 rounded-md text-center hover:bg-gray-50'>
                      <PresentationChartLineIcon className='h-5 w-5 text-gray-400 mx-auto mb-1' />
                      <span className='text-caption text-gray-600'>Line Chart</span>
                    </button>
                    <button className='p-3 border border-gray-300 rounded-md text-center hover:bg-gray-50'>
                      <ChartPieIcon className='h-5 w-5 text-gray-400 mx-auto mb-1' />
                      <span className='text-caption text-gray-600'>Pie Chart</span>
                    </button>
                  </div>
                </div>

                <div className='flex space-x-3 pt-4'>
                  <button className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-body hover:bg-gray-50'>
                    Save Template
                  </button>
                  <button className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-body hover:bg-blue-700'>
                    Generate Report
                  </button>
                </div>
              </div>
            </div>

            {/* Report Preview */}
            <div className='lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-card-title font-semibold text-gray-900'>Report Preview</h3>
                <div className='flex space-x-2'>
                  <button className='p-2 text-gray-400 hover:text-gray-600'>
                    <EyeIcon className='h-5 w-5' />
                  </button>
                  <button className='p-2 text-gray-400 hover:text-gray-600'>
                    <ArrowDownTrayIcon className='h-5 w-5' />
                  </button>
                  <button className='p-2 text-gray-400 hover:text-gray-600'>
                    <ShareIcon className='h-5 w-5' />
                  </button>
                </div>
              </div>

              <div className='border-b border-gray-200 pb-4 mb-4'>
                <h4 className='text-card-title font-medium text-gray-900'>Financial Performance</h4>
                <p className='text-body text-gray-600'>Last 6 months revenue analysis</p>
              </div>

              <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-6'>
                <div className='text-center'>
                  <ChartBarIcon className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-body text-gray-500'>Chart will appear here</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='h-32 bg-gray-50 rounded-lg flex items-center justify-center'>
                  <p className='text-body text-gray-500'>Client Distribution</p>
                </div>
                <div className='h-32 bg-gray-50 rounded-lg flex items-center justify-center'>
                  <p className='text-body text-gray-500'>Invoice Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports Section */}
      <div className='px-6 py-6'>
        <div className='border-b border-gray-200 mb-6'>
          <div className='flex space-x-8'>
            <button
              onClick={() => setReportBuilderTab('recent')}
              className={`py-3 px-1 text-nav-text font-medium border-b-2 ${
                reportBuilderTab === 'recent'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Recent Reports
            </button>
            <button
              onClick={() => setReportBuilderTab('saved')}
              className={`py-3 px-1 text-nav-text font-medium border-b-2 ${
                reportBuilderTab === 'saved'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Saved Reports
            </button>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm'>
          {/* Table Header */}
          <div className='bg-gray-50 px-6 py-3'>
            <div className='grid grid-cols-12 gap-4 text-table-header text-gray-500 uppercase tracking-wider'>
              <div className='col-span-4'>Report Name</div>
              <div className='col-span-2'>Date</div>
              <div className='col-span-2'>Type</div>
              <div className='col-span-2'>Status</div>
              <div className='col-span-2 text-right'>Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className='divide-y divide-gray-200'>
            {recentReports.length > 0 ? (
              recentReports.map(report => {
                const IconComponent = report.icon;
                return (
                  <div key={report.id} className='px-6 py-4 hover:bg-gray-50'>
                    <div className='grid grid-cols-12 gap-4 items-center'>
                      <div className='col-span-4 flex items-center space-x-3'>
                        <div className='bg-blue-100 rounded-md p-2'>
                          <IconComponent className='h-5 w-5 text-blue-600' />
                        </div>
                        <span className='text-body font-medium text-gray-900'>{report.name}</span>
                      </div>
                      <div className='col-span-2 text-body text-gray-600'>{report.date}</div>
                      <div className='col-span-2'>
                        <span
                          className={`inline-flex px-2 py-1 text-caption font-medium rounded-full ${
                            report.type === 'Financial'
                              ? 'bg-blue-100 text-blue-800'
                              : report.type === 'Client'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {report.type}
                        </span>
                      </div>
                      <div className='col-span-2'>
                        <div className='flex items-center space-x-1'>
                          <CheckCircleIcon className='h-4 w-4 text-green-500' />
                          <span className='text-body text-gray-600'>{report.status}</span>
                        </div>
                      </div>
                      <div className='col-span-2 flex justify-end space-x-2'>
                        <button className='p-1 text-gray-400 hover:text-gray-600'>
                          <EyeIcon className='h-4 w-4' />
                        </button>
                        <button className='p-1 text-gray-400 hover:text-gray-600'>
                          <ArrowDownTrayIcon className='h-4 w-4' />
                        </button>
                        <button className='p-1 text-gray-400 hover:text-red-600'>
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='px-6 py-8 text-center'>
                <DocumentChartBarIcon className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>No reports yet</h3>
                <p className='mt-1 text-sm text-gray-500'>Get started by generating your first report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Report Preview Modal */}
      {showPreview && previewReport && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden'>
            <div className='flex items-center justify-between p-6 border-b'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Preview: {previewReport.title}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>
            
            <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
              {/* Date Range Selection */}
              <div className='mb-6'>
                <h4 className='text-sm font-medium text-gray-700 mb-3'>Report Configuration</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>Start Date</label>
                    <input
                      type='date'
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className='w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-medium text-gray-600 mb-1'>End Date</label>
                    <input
                      type='date'
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className='w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className='bg-gray-50 rounded-lg p-4 mb-6'>
                <h5 className='text-sm font-medium text-gray-700 mb-2'>Report Preview</h5>
                <div className='text-sm text-gray-600 space-y-2'>
                  <p><strong>Report Type:</strong> {previewReport.title}</p>
                  <p><strong>Description:</strong> {previewReport.description}</p>
                  <p><strong>Date Range:</strong> {dateRange.startDate} to {dateRange.endDate}</p>
                  <p><strong>Format:</strong> {selectedFormats[previewReport.id] || 'PDF'}</p>
                  <p><strong>Estimated Size:</strong> ~2-5 MB</p>
                  <p><strong>Generation Time:</strong> ~30-60 seconds</p>
                </div>
              </div>

              {/* Sample Data Preview */}
              <div className='bg-white border rounded-lg p-4'>
                <h5 className='text-sm font-medium text-gray-700 mb-3'>Sample Data</h5>
                <div className='text-xs text-gray-500 space-y-1'>
                  <div className='grid grid-cols-3 gap-4 py-2 border-b font-medium'>
                    <span>Metric</span>
                    <span>Current Period</span>
                    <span>Previous Period</span>
                  </div>
                  <div className='grid grid-cols-3 gap-4 py-1'>
                    <span>Total Revenue</span>
                    <span>$45,230</span>
                    <span>$38,920</span>
                  </div>
                  <div className='grid grid-cols-3 gap-4 py-1'>
                    <span>Total Expenses</span>
                    <span>$23,150</span>
                    <span>$21,480</span>
                  </div>
                  <div className='grid grid-cols-3 gap-4 py-1'>
                    <span>Net Profit</span>
                    <span>$22,080</span>
                    <span>$17,440</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className='flex items-center justify-end space-x-3 p-6 border-t bg-gray-50'>
              <button
                onClick={() => setShowPreview(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleGenerateReport(previewReport.id, selectedFormats[previewReport.id] || 'pdf');
                }}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700'
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
       )}

       {/* Schedule Report Modal */}
       {showScheduleModal && scheduleReport && (
         <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
           <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
             <div className='flex items-center justify-between p-6 border-b'>
               <h3 className='text-lg font-semibold text-gray-900'>
                 Schedule: {scheduleReport.title}
               </h3>
               <button
                 onClick={() => setShowScheduleModal(false)}
                 className='text-gray-400 hover:text-gray-600'
               >
                 <XMarkIcon className='h-6 w-6' />
               </button>
             </div>
             
             <div className='p-6'>
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 const config = {
                   reportType: scheduleReport.id,
                   format: formData.get('format'),
                   frequency: formData.get('frequency'),
                   email: formData.get('email')
                 };
                 
                 try {
                   await reportingService.scheduleReport(config);
                   setShowScheduleModal(false);
                   console.log('Report scheduled successfully');
                 } catch (error) {
                   console.error('Error scheduling report:', error);
                 }
               }}>
                 <div className='space-y-4'>
                   <div>
                     <label className='block text-sm font-medium text-gray-700 mb-1'>Format</label>
                     <select
                       name='format'
                       required
                       className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                     >
                       <option value='pdf'>PDF</option>
                       <option value='csv'>CSV</option>
                       <option value='excel'>Excel</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className='block text-sm font-medium text-gray-700 mb-1'>Frequency</label>
                     <select
                       name='frequency'
                       required
                       className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                     >
                       <option value='daily'>Daily</option>
                       <option value='weekly'>Weekly</option>
                       <option value='monthly'>Monthly</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className='block text-sm font-medium text-gray-700 mb-1'>Email Address</label>
                     <input
                       type='email'
                       name='email'
                       required
                       placeholder='admin@company.com'
                       className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                     />
                   </div>
                   
                   <div className='bg-blue-50 rounded-lg p-3'>
                     <p className='text-sm text-blue-700'>
                       <strong>Note:</strong> Scheduled reports will be automatically generated and sent to the specified email address.
                     </p>
                   </div>
                 </div>
                 
                 <div className='flex items-center justify-end space-x-3 mt-6'>
                   <button
                     type='button'
                     onClick={() => setShowScheduleModal(false)}
                     className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                   >
                     Cancel
                   </button>
                   <button
                     type='submit'
                     className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700'
                   >
                     Schedule Report
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

      {/* Phase 3 Components */}
      {mainView === 'scheduler' && (
        <div className='px-6 py-6'>
          <ReportScheduler />
        </div>
      )}

      {mainView === 'history' && (
        <div className='px-6 py-6'>
          <ReportHistory />
        </div>
      )}

      {mainView === 'builder' && (
        <div className='px-6 py-6'>
          <CustomReportBuilder />
        </div>
      )}

       {/* Footer */}
       <Footer />
    </div>
  );
};

export default Reports;
