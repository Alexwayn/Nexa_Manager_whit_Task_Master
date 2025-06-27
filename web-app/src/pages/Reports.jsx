import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../components/shared/Footer';
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
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { t } = useTranslation('reports');
  const [activeTab, setActiveTab] = useState('financial');
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [reportBuilderTab, setReportBuilderTab] = useState('recent');

  // Enhanced metrics data matching Motiff design
  const metrics = {
    financial: {
      totalRevenue: {
        value: '$142,500',
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
        value: '$24,350',
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

  // Recent reports data for the table
  const recentReports = [
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

  // Sample chart data (in a real app, this would come from an API)
  const chartData = {
    revenueVsExpenses: {
      revenue: [45000, 52000, 48000, 61000, 55000, 58000],
      expenses: [32000, 35000, 33000, 42000, 38000, 40000],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    clientAcquisition: {
      newClients: [8, 12, 10, 15, 11, 14],
      churn: [2, 3, 4, 2, 3, 1],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
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

  const handleGenerateReport = (reportId) => {
    console.log(`Generating report: ${reportId}`);
    // TODO: Implement report generation logic
  };

  // Simple chart components (in a real app, you'd use a charting library like Chart.js or Recharts)
  const SimpleBarChart = ({ data, title }) => {
    // Add safety checks for data
    if (!data || !data.revenue || !data.months) {
      return (
        <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
          <div className='h-64 flex items-center justify-center'>
            <div className='text-center'>
              <ChartBarIcon className='h-12 w-12 text-gray-400 mx-auto mb-2' />
              <p className='text-sm text-gray-500'>No data available</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
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
              <span className='text-xs text-gray-600'>{data.months[index]}</span>
            </div>
          ))}
        </div>
        <div className='flex justify-center mt-4 space-x-6'>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-blue-500 rounded'></div>
            <span className='text-sm text-gray-600'>Revenue</span>
          </div>
          {data.expenses && (
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gray-300 rounded'></div>
              <span className='text-sm text-gray-600'>Expenses</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SimplePieChart = ({ title, data }) => (
    <div className='bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
      <div className='flex items-center justify-center h-48'>
        <div className='w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center bg-gray-100'>
          <span className='text-sm text-gray-600'>Chart</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-white'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200'>
        <div className='px-6 py-3'>
          <div className='flex items-center space-x-2 text-sm'>
            <span className='text-blue-600 font-normal'>Reports</span>
            <ChevronRightIcon className='h-3 w-3 text-gray-400' />
            <span className='text-gray-500 font-normal'>Overview</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className='px-6 py-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold text-black'>Reports and Analysis</h1>
          <div className='flex items-center space-x-3'>
            {/* Time Range Selector */}
            <div className='relative'>
              <button className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-normal text-black hover:bg-gray-50'>
                <CalendarIcon className='h-4 w-4 text-gray-500' />
                <span>{timeRange}</span>
                <ChevronDownIcon className='h-4 w-4 text-gray-500' />
              </button>
            </div>

            {/* Export Button */}
            <button className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-normal hover:bg-blue-700'>
              <ArrowDownTrayIcon className='h-4 w-4' />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='border-b border-gray-200 px-6'>
        <div className='flex space-x-10'>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-3 px-4 text-base font-medium border-b-2 ${
              activeTab === 'financial'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`py-3 px-4 text-base font-medium border-b-2 ${
              activeTab === 'client'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Client Reports
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-base font-medium border-b-2 ${
              activeTab === 'custom'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Custom Reports
          </button>
        </div>
      </div>

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
                <h3 className='text-base font-semibold text-gray-900 mb-1'>{report.title}</h3>

                {/* Description */}
                <p className='text-sm text-gray-500 mb-4 leading-5'>{report.description}</p>

                {/* Generate Report Button */}
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  className='flex items-center space-x-1 text-blue-600 text-sm font-normal hover:text-blue-700 transition-colors duration-200'
                >
                  <span>Generate Report</span>
                  <ArrowRightIcon className='h-4 w-4' />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Metrics Dashboard */}
      {metrics[activeTab] && (
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
                      className={`flex items-center space-x-1 text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className='text-2xl font-semibold text-gray-900'>{metric.value}</p>
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
            <SimpleBarChart data={chartData.revenueVsExpenses} title='Revenue vs Expenses' />
            <SimpleBarChart
              data={{
                revenue: chartData.clientAcquisition.newClients,
                expenses: chartData.clientAcquisition.churn,
                months: chartData.clientAcquisition.months,
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
              <h3 className='text-base font-semibold text-gray-900 mb-4'>Report Builder</h3>
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-700 mb-2'>Report Type</label>
                  <select className='w-full p-2 border border-gray-300 rounded-md text-sm'>
                    <option>Financial Overview</option>
                    <option>Client Analysis</option>
                    <option>Performance Metrics</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>Date Range</label>
                  <div className='grid grid-cols-2 gap-2'>
                    <input
                      type='date'
                      className='p-2 border border-gray-300 rounded-md text-sm'
                      placeholder='Start Date'
                    />
                    <input
                      type='date'
                      className='p-2 border border-gray-300 rounded-md text-sm'
                      placeholder='End Date'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>Metrics</label>
                  <div className='space-y-2'>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-sm text-gray-700'>Revenue</span>
                    </label>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-sm text-gray-700'>Expenses</span>
                    </label>
                    <label className='flex items-center space-x-2'>
                      <input type='checkbox' defaultChecked className='rounded text-blue-600' />
                      <span className='text-sm text-gray-700'>Profit Margin</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>Visualization Type</label>
                  <div className='grid grid-cols-3 gap-2'>
                    <button className='p-3 border-2 border-blue-500 bg-blue-50 rounded-md text-center'>
                      <ChartBarIcon className='h-5 w-5 text-blue-600 mx-auto mb-1' />
                      <span className='text-xs text-blue-600'>Bar Chart</span>
                    </button>
                    <button className='p-3 border border-gray-300 rounded-md text-center hover:bg-gray-50'>
                      <PresentationChartLineIcon className='h-5 w-5 text-gray-400 mx-auto mb-1' />
                      <span className='text-xs text-gray-600'>Line Chart</span>
                    </button>
                    <button className='p-3 border border-gray-300 rounded-md text-center hover:bg-gray-50'>
                      <ChartPieIcon className='h-5 w-5 text-gray-400 mx-auto mb-1' />
                      <span className='text-xs text-gray-600'>Pie Chart</span>
                    </button>
                  </div>
                </div>

                <div className='flex space-x-3 pt-4'>
                  <button className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50'>
                    Save Template
                  </button>
                  <button className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700'>
                    Generate Report
                  </button>
                </div>
              </div>
            </div>

            {/* Report Preview */}
            <div className='lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-base font-semibold text-gray-900'>Report Preview</h3>
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
                <h4 className='text-lg font-medium text-gray-900'>Financial Performance</h4>
                <p className='text-sm text-gray-600'>Last 6 months revenue analysis</p>
              </div>

              <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-6'>
                <div className='text-center'>
                  <ChartBarIcon className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500'>Chart will appear here</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='h-32 bg-gray-50 rounded-lg flex items-center justify-center'>
                  <p className='text-sm text-gray-500'>Client Distribution</p>
                </div>
                <div className='h-32 bg-gray-50 rounded-lg flex items-center justify-center'>
                  <p className='text-sm text-gray-500'>Invoice Status</p>
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
              className={`py-3 px-1 text-base font-medium border-b-2 ${
                reportBuilderTab === 'recent'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Recent Reports
            </button>
            <button
              onClick={() => setReportBuilderTab('saved')}
              className={`py-3 px-1 text-base font-medium border-b-2 ${
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
            <div className='grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider'>
              <div className='col-span-4'>Report Name</div>
              <div className='col-span-2'>Date</div>
              <div className='col-span-2'>Type</div>
              <div className='col-span-2'>Status</div>
              <div className='col-span-2 text-right'>Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className='divide-y divide-gray-200'>
            {recentReports.map(report => {
              const IconComponent = report.icon;
              return (
                <div key={report.id} className='px-6 py-4 hover:bg-gray-50'>
                  <div className='grid grid-cols-12 gap-4 items-center'>
                    <div className='col-span-4 flex items-center space-x-3'>
                      <div className='bg-blue-100 rounded-md p-2'>
                        <IconComponent className='h-5 w-5 text-blue-600' />
                      </div>
                      <span className='text-sm font-medium text-gray-900'>{report.name}</span>
                    </div>
                    <div className='col-span-2 text-sm text-gray-600'>{report.date}</div>
                    <div className='col-span-2'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
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
                        <span className='text-sm text-gray-600'>{report.status}</span>
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
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Reports;
