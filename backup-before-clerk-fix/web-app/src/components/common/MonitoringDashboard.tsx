/**
 * Monitoring Dashboard Component
 * Provides real-time monitoring of performance, errors, and accessibility
 */

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor } from '../../utils/PerformanceMonitor';
import { errorMonitor } from '../../utils/ErrorMonitor';
import { accessibilityTester, useAccessibilityTest } from '../../utils/AccessibilityTester';

interface MonitoringDashboardProps {
  className?: string;
  showDetailed?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface SystemMetrics {
  performance: {
    score: number;
    avgRenderTime: number;
    totalMetrics: number;
    coreWebVitals: Record<string, number>;
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
  };
  accessibility: {
    score: number;
    violationCount: number;
    impactSummary: {
      minor: number;
      moderate: number;
      serious: number;
      critical: number;
    };
  };
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = '',
  showDetailed = false,
  autoRefresh = true,
  refreshInterval = 30000,
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { report: a11yReport, runTest: runA11yTest } = useAccessibilityTest();

  const collectMetrics = useCallback(async () => {
    setIsLoading(true);

    try {
      // Collect performance metrics
      const perfSummary = performanceMonitor.getPerformanceSummary();
      const perfScore = Math.max(
        0,
        Math.min(100, 100 - perfSummary.avgRenderTime / 10), // Basic scoring
      );

      // Collect error metrics
      const errorStats = errorMonitor.getErrorStatistics();

      // Collect accessibility metrics (run test if not available)
      let a11yScore = 100;
      let a11yViolations = 0;
      let a11yImpactSummary = { minor: 0, moderate: 0, serious: 0, critical: 0 };

      if (a11yReport) {
        a11yScore = accessibilityTester.calculateAccessibilityScore(a11yReport);
        a11yViolations = a11yReport.summary.violationCount;
        a11yImpactSummary = a11yReport.summary.impactSummary;
      } else {
        // Trigger accessibility test
        runA11yTest();
      }

      const systemMetrics: SystemMetrics = {
        performance: {
          score: Math.round(perfScore),
          avgRenderTime: perfSummary.avgRenderTime,
          totalMetrics: perfSummary.totalMetrics,
          coreWebVitals: perfSummary.coreWebVitals,
        },
        errors: {
          totalErrors: errorStats.totalErrors,
          errorRate: errorStats.errorRate,
          errorsByType: errorStats.errorsByType,
          errorsBySeverity: errorStats.errorsBySeverity,
        },
        accessibility: {
          score: a11yScore,
          violationCount: a11yViolations,
          impactSummary: a11yImpactSummary,
        },
      };

      setMetrics(systemMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [a11yReport, runA11yTest]);

  useEffect(() => {
    collectMetrics();
  }, [collectMetrics]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(collectMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, collectMetrics]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (isLoading && !metrics) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-3 bg-gray-200 rounded'></div>
            <div className='h-3 bg-gray-200 rounded'></div>
            <div className='h-3 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className='text-center text-gray-500'>
          <p>Failed to load monitoring data</p>
          <button
            onClick={collectMetrics}
            className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overallScore = Math.round((metrics.performance.score + metrics.accessibility.score) / 2);

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>System Monitoring</h3>
            {lastUpdated && (
              <p className='text-sm text-gray-500'>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-3'>
            {/* Overall Score */}
            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(overallScore)}`}>
              <span className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={collectMetrics}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50'
              title='Refresh metrics'
            >
              <svg
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
            </button>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-2 text-gray-400 hover:text-gray-600'
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Performance Metrics */}
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
              <h4 className='font-medium text-gray-900'>Performance</h4>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.performance.score)}`}>
              {metrics.performance.score}/100
            </div>
            <div className='space-y-1 text-sm text-gray-600'>
              <p>Avg Render: {metrics.performance.avgRenderTime.toFixed(2)}ms</p>
              <p>Total Metrics: {metrics.performance.totalMetrics}</p>
              {Object.keys(metrics.performance.coreWebVitals).length > 0 && (
                <div className='mt-2'>
                  <p className='font-medium'>Core Web Vitals:</p>
                  {Object.entries(metrics.performance.coreWebVitals).map(([key, value]) => (
                    <p key={key} className='ml-2'>
                      {key}: {value.toFixed(2)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Metrics */}
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-red-500 rounded-full'></div>
              <h4 className='font-medium text-gray-900'>Errors</h4>
            </div>
            <div className='text-2xl font-bold text-gray-900'>{metrics.errors.totalErrors}</div>
            <div className='space-y-1 text-sm text-gray-600'>
              <p>Error Rate: {metrics.errors.errorRate.toFixed(2)}/min</p>
              {Object.keys(metrics.errors.errorsBySeverity).length > 0 && (
                <div className='mt-2'>
                  <p className='font-medium'>By Severity:</p>
                  {Object.entries(metrics.errors.errorsBySeverity).map(([severity, count]) => (
                    <p key={severity} className='ml-2'>
                      {severity}: {count}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accessibility Metrics */}
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
              <h4 className='font-medium text-gray-900'>Accessibility</h4>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.accessibility.score)}`}>
              {metrics.accessibility.score}/100
            </div>
            <div className='space-y-1 text-sm text-gray-600'>
              <p>Violations: {metrics.accessibility.violationCount}</p>
              {Object.keys(metrics.accessibility.impactSummary).length > 0 && (
                <div className='mt-2'>
                  <p className='font-medium'>By Impact:</p>
                  {Object.entries(metrics.accessibility.impactSummary).map(
                    ([impact, count]) =>
                      count > 0 && (
                        <p key={impact} className='ml-2'>
                          {impact}: {count}
                        </p>
                      ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed View */}
        {(isExpanded || showDetailed) && (
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <h4 className='font-medium text-gray-900 mb-4'>Detailed Metrics</h4>

            {/* Performance Details */}
            <div className='mb-6'>
              <h5 className='text-sm font-medium text-gray-700 mb-2'>Performance Breakdown</h5>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <p className='font-medium'>Render Time</p>
                    <p className='text-gray-600'>
                      {metrics.performance.avgRenderTime.toFixed(2)}ms
                    </p>
                  </div>
                  <div>
                    <p className='font-medium'>Total Metrics</p>
                    <p className='text-gray-600'>{metrics.performance.totalMetrics}</p>
                  </div>
                  {Object.entries(metrics.performance.coreWebVitals).map(([key, value]) => (
                    <div key={key}>
                      <p className='font-medium'>{key}</p>
                      <p className='text-gray-600'>{value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Details */}
            {metrics.errors.totalErrors > 0 && (
              <div className='mb-6'>
                <h5 className='text-sm font-medium text-gray-700 mb-2'>Error Breakdown</h5>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='font-medium mb-1'>By Type:</p>
                      {Object.entries(metrics.errors.errorsByType).map(([type, count]) => (
                        <p key={type} className='text-gray-600 ml-2'>
                          {type}: {count}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className='font-medium mb-1'>By Severity:</p>
                      {Object.entries(metrics.errors.errorsBySeverity).map(([severity, count]) => (
                        <p key={severity} className='text-gray-600 ml-2'>
                          {severity}: {count}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h5 className='text-sm font-medium text-gray-700 mb-2'>Quick Actions</h5>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => performanceMonitor.clearMetrics()}
                  className='px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
                >
                  Clear Performance Data
                </button>
                <button
                  onClick={() => errorMonitor.clearErrors()}
                  className='px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200'
                >
                  Clear Error Data
                </button>
                <button
                  onClick={runA11yTest}
                  className='px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200'
                >
                  Run A11y Test
                </button>
                <button
                  onClick={() => {
                    const data = {
                      performance: performanceMonitor.exportMetrics(),
                      errors: errorMonitor.exportErrors(),
                      accessibility: a11yReport,
                    };
                    console.log('Monitoring Data Export:', data);
                  }}
                  className='px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
