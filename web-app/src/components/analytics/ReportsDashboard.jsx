import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  ShareIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const ReportsDashboard = ({ analytics }) => {
  const { t } = useTranslation();
  const [selectedReportType, setSelectedReportType] = useState('financial');
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: 'Monthly Financial Summary',
      type: 'financial',
      frequency: 'monthly',
      nextRun: '2024-02-01',
      recipients: ['admin@company.com', 'finance@company.com'],
      active: true,
    },
    {
      id: 2,
      name: 'Weekly Client Report',
      type: 'client',
      frequency: 'weekly',
      nextRun: '2024-01-29',
      recipients: ['manager@company.com'],
      active: true,
    },
  ]);

  const reportTypes = [
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'Revenue, expenses, profit margins, and financial forecasts',
      icon: ChartBarIcon,
      templates: [
        'Monthly P&L Statement',
        'Cash Flow Analysis',
        'Revenue Breakdown',
        'Expense Analysis',
        'Financial Forecast',
      ],
    },
    {
      id: 'client',
      name: 'Client Reports',
      description: 'Client analytics, satisfaction scores, and relationship metrics',
      icon: DocumentTextIcon,
      templates: [
        'Client Portfolio Overview',
        'Client Satisfaction Report',
        'Client Retention Analysis',
        'New Client Acquisition',
        'Client Revenue Contribution',
      ],
    },
    {
      id: 'operational',
      name: 'Operational Reports',
      description: 'Project performance, team productivity, and operational metrics',
      icon: CogIcon,
      templates: [
        'Project Performance Dashboard',
        'Team Productivity Report',
        'Resource Utilization',
        'Operational Efficiency',
        'KPI Summary',
      ],
    },
    {
      id: 'custom',
      name: 'Custom Reports',
      description: 'Build your own reports with custom metrics and visualizations',
      icon: DocumentArrowDownIcon,
      templates: [
        'Custom Dashboard',
        'Ad-hoc Analysis',
        'Comparative Study',
        'Trend Analysis',
        'Executive Summary',
      ],
    },
  ];

  const exportFormats = [
    { id: 'pdf', name: 'PDF', icon: '📄', description: 'Professional formatted report' },
    { id: 'excel', name: 'Excel', icon: '📊', description: 'Spreadsheet with raw data' },
    { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
    { id: 'powerpoint', name: 'PowerPoint', icon: '📈', description: 'Presentation slides' },
  ];

  const quickStats = useMemo(() => {
    if (!analytics?.data) return {};

    const { revenueAnalytics, clientAnalytics, invoiceAnalytics } = analytics.data;

    return {
      totalRevenue: revenueAnalytics?.totalRevenue || 0,
      totalClients: clientAnalytics?.totalClients || 0,
      pendingInvoices: invoiceAnalytics?.pending || 0,
      completedProjects: 45, // Mock data
      avgProjectValue: revenueAnalytics?.totalRevenue
        ? Math.round(revenueAnalytics.totalRevenue / (clientAnalytics?.totalClients || 1))
        : 0,
      clientSatisfaction: 4.7, // Mock data
    };
  }, [analytics]);

  const handleExport = format => {
    // Mock export functionality
    console.log(`Exporting ${selectedReportType} report as ${format}`);
    // In a real implementation, this would trigger the actual export
  };

  const handleScheduleReport = reportConfig => {
    const newReport = {
      id: Date.now(),
      ...reportConfig,
      active: true,
    };
    setScheduledReports([...scheduledReports, newReport]);
  };

  const toggleScheduledReport = reportId => {
    setScheduledReports(reports =>
      reports.map(report =>
        report.id === reportId ? { ...report, active: !report.active } : report,
      ),
    );
  };

  const renderQuickStats = () => (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6'>
      <div className='bg-blue-50 p-4 rounded-lg'>
        <p className='text-sm text-blue-600 font-medium'>Total Revenue</p>
        <p className='text-2xl font-bold text-blue-900'>
          €{quickStats.totalRevenue?.toLocaleString()}
        </p>
      </div>
      <div className='bg-green-50 p-4 rounded-lg'>
        <p className='text-sm text-green-600 font-medium'>Active Clients</p>
        <p className='text-2xl font-bold text-green-900'>{quickStats.totalClients}</p>
      </div>
      <div className='bg-yellow-50 p-4 rounded-lg'>
        <p className='text-sm text-yellow-600 font-medium'>Pending Invoices</p>
        <p className='text-2xl font-bold text-yellow-900'>{quickStats.pendingInvoices}</p>
      </div>
      <div className='bg-purple-50 p-4 rounded-lg'>
        <p className='text-sm text-purple-600 font-medium'>Completed Projects</p>
        <p className='text-2xl font-bold text-purple-900'>{quickStats.completedProjects}</p>
      </div>
      <div className='bg-indigo-50 p-4 rounded-lg'>
        <p className='text-sm text-indigo-600 font-medium'>Avg Project Value</p>
        <p className='text-2xl font-bold text-indigo-900'>
          €{quickStats.avgProjectValue?.toLocaleString()}
        </p>
      </div>
      <div className='bg-pink-50 p-4 rounded-lg'>
        <p className='text-sm text-pink-600 font-medium'>Client Satisfaction</p>
        <p className='text-2xl font-bold text-pink-900'>{quickStats.clientSatisfaction}/5</p>
      </div>
    </div>
  );

  const renderReportBuilder = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
      <h3 className='text-lg font-semibold text-black mb-4'>Custom Report Builder</h3>

      {/* Report Type Selection */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {reportTypes.map(type => {
          const IconComponent = type.icon;
          return (
            <div
              key={type.id}
              onClick={() => setSelectedReportType(type.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedReportType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <IconComponent className='w-8 h-8 text-blue-600 mb-2' />
              <h4 className='font-medium text-black mb-1'>{type.name}</h4>
              <p className='text-sm text-gray-600'>{type.description}</p>
            </div>
          );
        })}
      </div>

      {/* Report Templates */}
      {selectedReportType && (
        <div className='mb-6'>
          <h4 className='font-medium text-black mb-3'>Available Templates</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {reportTypes
              .find(t => t.id === selectedReportType)
              ?.templates.map(template => (
                <button
                  key={template}
                  className='p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  <p className='font-medium text-black'>{template}</p>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Period Selection */}
      <div className='mb-6'>
        <h4 className='font-medium text-black mb-3'>Report Period</h4>
        <div className='flex flex-wrap gap-2 mb-4'>
          {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map(period => (
            <button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                reportPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {reportPeriod === 'custom' && (
          <div className='flex gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Start Date</label>
              <input
                type='date'
                value={customDateRange.start}
                onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className='border border-gray-300 rounded-lg px-3 py-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>End Date</label>
              <input
                type='date'
                value={customDateRange.end}
                onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className='border border-gray-300 rounded-lg px-3 py-2'
              />
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className='mb-6'>
        <h4 className='font-medium text-black mb-3'>Export Format</h4>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {exportFormats.map(format => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id)}
              className='p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'
            >
              <div className='flex items-center space-x-2 mb-1'>
                <span className='text-lg'>{format.icon}</span>
                <span className='font-medium text-black'>{format.name}</span>
              </div>
              <p className='text-xs text-gray-600'>{format.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report Button */}
      <div className='flex justify-end'>
        <button className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'>
          <DocumentArrowDownIcon className='w-4 h-4' />
          <span>Generate Report</span>
        </button>
      </div>
    </div>
  );

  const renderScheduledReports = () => (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-black'>Scheduled Reports</h3>
        <button className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm'>
          + Schedule New
        </button>
      </div>

      <div className='space-y-4'>
        {scheduledReports.map(report => (
          <div
            key={report.id}
            className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
          >
            <div className='flex-1'>
              <div className='flex items-center space-x-3'>
                <div
                  className={`w-3 h-3 rounded-full ${
                    report.active ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <h4 className='font-medium text-black'>{report.name}</h4>
                <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize'>
                  {report.type}
                </span>
              </div>
              <div className='mt-2 flex items-center space-x-4 text-sm text-gray-600'>
                <div className='flex items-center space-x-1'>
                  <ClockIcon className='w-4 h-4' />
                  <span>Every {report.frequency}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <CalendarIcon className='w-4 h-4' />
                  <span>Next: {report.nextRun}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <ShareIcon className='w-4 h-4' />
                  <span>{report.recipients.length} recipients</span>
                </div>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => toggleScheduledReport(report.id)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  report.active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {report.active ? 'Pause' : 'Resume'}
              </button>
              <button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>
                <CogIcon className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {renderQuickStats()}
      {renderReportBuilder()}
      {renderScheduledReports()}
    </div>
  );
};

export default ReportsDashboard;
