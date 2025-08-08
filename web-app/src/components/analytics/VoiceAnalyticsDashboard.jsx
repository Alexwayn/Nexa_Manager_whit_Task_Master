import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  MicrophoneIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/shared/utils/cn';
import voiceAnalyticsService from '@/services/voiceAnalyticsService';
import VoiceCommandChart from './VoiceCommandChart';
import VoiceFailureChart from './VoiceFailureChart';
import VoiceSessionChart from './VoiceSessionChart';
import VoiceAnalyticsTable from './VoiceAnalyticsTable';

/**
 * Voice Analytics Dashboard Component
 * Displays comprehensive analytics for voice command usage and performance
 */
export default function VoiceAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = voiceAnalyticsService.getAnalyticsForPeriod(selectedPeriod);
      setAnalyticsData(data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format = 'json') => {
    try {
      const exportData = voiceAnalyticsService.exportAnalytics(format);
      if (!exportData) {
        throw new Error('No data to export');
      }

      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      try {
        voiceAnalyticsService.clearAnalytics();
        loadAnalyticsData();
      } catch (err) {
        setError('Failed to clear data');
        console.error('Clear data error:', err);
      }
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const periods = [
    { value: 'day', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'all', label: 'All Time' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'commands', label: 'Commands', icon: MicrophoneIcon },
    { id: 'failures', label: 'Failures', icon: ExclamationTriangleIcon },
    { id: 'sessions', label: 'Sessions', icon: ClockIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadAnalyticsData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const summary = analyticsData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor voice command usage and performance
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExportData('json')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              JSON
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              CSV
            </button>
            <button
              onClick={handleClearData}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MicrophoneIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Commands
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.totalCommands || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recognition Failures
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.totalFailures || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Success Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.successRate || 100}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Session Duration
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatDuration(summary.averageSessionDuration)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Most Used Commands */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Most Used Commands
              </h3>
              {summary.mostUsedCommands && Object.keys(summary.mostUsedCommands).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(summary.mostUsedCommands).map(([command, count]) => (
                    <div key={command} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-mono">{command}</span>
                      <span className="text-sm font-medium text-gray-900">{count} uses</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No command data available</p>
              )}
            </div>

            {/* Common Failures */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Common Failure Types
              </h3>
              {summary.commonFailures && Object.keys(summary.commonFailures).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(summary.commonFailures).map(([failure, count]) => (
                    <div key={failure} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{failure}</span>
                      <span className="text-sm font-medium text-red-600">{count} failures</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No failure data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="space-y-6">
            <VoiceCommandChart data={analyticsData} />
            <VoiceAnalyticsTable 
              data={analyticsData?.commands || []} 
              type="commands"
            />
          </div>
        )}

        {activeTab === 'failures' && (
          <div className="space-y-6">
            <VoiceFailureChart data={analyticsData} />
            <VoiceAnalyticsTable 
              data={analyticsData?.failures || []} 
              type="failures"
            />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <VoiceSessionChart data={analyticsData} />
            <VoiceAnalyticsTable 
              data={analyticsData?.sessions || []} 
              type="sessions"
            />
          </div>
        )}
      </div>
    </div>
  );
}
