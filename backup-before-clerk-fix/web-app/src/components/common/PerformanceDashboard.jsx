/**
 * Performance Monitoring Dashboard
 * Displays real-time performance metrics, memory usage, and optimization insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChartBarIcon, CpuChipIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useMemoryMonitor, getMemoryReport, memoryDevTools } from '@utils/memoryOptimization';
import { useBundleMonitor, bundleDevTools } from '@utils/bundleOptimization';
import { cacheUtils } from '@utils/reportCache';
import { usePerformanceMonitor } from '@utils/performance';
import OptimizedChart from '@components/reports/charts/OptimizedChart';
import LoadingSkeleton from './LoadingSkeleton';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  MEMORY_WARNING: 70, // 70% of heap limit
  MEMORY_CRITICAL: 85, // 85% of heap limit
  RENDER_TIME_WARNING: 16, // 16ms (1 frame at 60fps)
  RENDER_TIME_CRITICAL: 33, // 33ms (2 frames)
  CACHE_HIT_RATE_WARNING: 0.7, // 70%
  BUNDLE_LOAD_TIME_WARNING: 3000, // 3 seconds
};

// Dashboard sections
const DASHBOARD_SECTIONS = {
  OVERVIEW: 'overview',
  MEMORY: 'memory',
  BUNDLES: 'bundles',
  CACHE: 'cache',
  COMPONENTS: 'components',
};

/**
 * Performance Metrics Card
 */
const MetricsCard = ({ title, value, unit, status, icon: Icon, trend, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const getTrendIcon = () => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };
  
  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
        getStatusColor()
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && <span className="text-sm ml-1">{unit}</span>}
          </p>
          {trend !== undefined && (
            <p className="text-xs mt-1">
              {getTrendIcon()} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
    </div>
  );
};

/**
 * Memory Usage Chart
 */
const MemoryChart = ({ data }) => {
  const chartData = {
    labels: data.map((_, index) => `${index + 1}m`),
    datasets: [
      {
        label: 'Memory Usage (MB)',
        data: data.map(d => d.used / 1024 / 1024),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Memory (MB)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  
  return (
    <div className="h-64">
      <OptimizedChart type="line" data={chartData} options={options} />
    </div>
  );
};

/**
 * Bundle Load Times Chart
 */
const BundleChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Load Time (ms)',
        data: data.map(d => d.loadTime),
        backgroundColor: data.map(d => 
          d.loadTime > PERFORMANCE_THRESHOLDS.BUNDLE_LOAD_TIME_WARNING
            ? 'rgba(239, 68, 68, 0.8)'
            : 'rgba(34, 197, 94, 0.8)'
        ),
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        title: {
          display: true,
          text: 'Load Time (ms)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };
  
  return (
    <div className="h-64">
      <OptimizedChart type="bar" data={chartData} options={options} />
    </div>
  );
};

/**
 * Recommendations Panel
 */
const RecommendationsPanel = ({ recommendations }) => {
  if (!recommendations.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎉</div>
        <p>No performance issues detected!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800">{rec.message}</p>
            {rec.action && (
              <button
                onClick={rec.action}
                className="mt-2 text-xs text-yellow-700 hover:text-yellow-900 underline"
              >
                {rec.actionText || 'Fix Now'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Performance Dashboard Component
 */
const PerformanceDashboard = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState(DASHBOARD_SECTIONS.OVERVIEW);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Performance monitoring hooks
  const memoryUsage = useMemoryMonitor(2000);
  const bundleReport = useBundleMonitor();
  const { startRender, endRender } = usePerformanceMonitor('PerformanceDashboard');
  
  // State for metrics
  const [memoryReport, setMemoryReport] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Update metrics
  const updateMetrics = useCallback(() => {
    try {
      // Memory metrics
      const memReport = getMemoryReport();
      setMemoryReport(memReport);
      
      // Cache metrics
      const cacheReport = cacheUtils.getStats();
      setCacheStats(cacheReport);
      
      // Update memory history
      if (memoryUsage) {
        setMemoryHistory(prev => {
          const newHistory = [...prev, memoryUsage].slice(-20); // Keep last 20 points
          return newHistory;
        });
      }
      
      // Generate recommendations
      const recs = generateRecommendations(memReport, cacheReport, bundleReport);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }, [memoryUsage, bundleReport]);
  
  // Generate performance recommendations
  const generateRecommendations = useCallback((memReport, cacheReport, bundleReport) => {
    const recs = [];
    
    // Memory recommendations
    if (memoryUsage && memoryUsage.percentage > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL) {
      recs.push({
        message: 'Critical memory usage detected. Consider component cleanup.',
        action: () => memoryDevTools.forceGC(),
        actionText: 'Force Cleanup',
      });
    }
    
    // Cache recommendations
    if (cacheReport && cacheReport.hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATE_WARNING) {
      recs.push({
        message: 'Low cache hit rate. Review caching strategy.',
        action: () => cacheUtils.clearExpired(),
        actionText: 'Clear Expired Cache',
      });
    }
    
    // Bundle recommendations
    if (bundleReport && bundleReport.metrics.averageLoadTime > PERFORMANCE_THRESHOLDS.BUNDLE_LOAD_TIME_WARNING) {
      recs.push({
        message: 'Slow bundle loading detected. Consider code splitting optimization.',
      });
    }
    
    // Memory leak detection
    if (memoryHistory.length >= 10) {
      const recent = memoryHistory.slice(-5);
      const older = memoryHistory.slice(-10, -5);
      const recentAvg = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.used, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.2) {
        recs.push({
          message: 'Potential memory leak detected. Memory usage trending upward.',
        });
      }
    }
    
    return recs;
  }, [memoryUsage, memoryHistory]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen, updateMetrics]);
  
  // Initial load
  useEffect(() => {
    if (isOpen) {
      startRender();
      updateMetrics();
      return () => endRender();
    }
  }, [isOpen, updateMetrics, startRender, endRender]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Calculate status for metrics
  const getMemoryStatus = () => {
    if (!memoryUsage) return 'unknown';
    if (memoryUsage.percentage > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL) return 'critical';
    if (memoryUsage.percentage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) return 'warning';
    return 'good';
  };
  
  const getCacheStatus = () => {
    if (!cacheStats) return 'unknown';
    if (cacheStats.hitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATE_WARNING) return 'warning';
    return 'good';
  };
  
  const getBundleStatus = () => {
    if (!bundleReport) return 'unknown';
    if (bundleReport.metrics.averageLoadTime > PERFORMANCE_THRESHOLDS.BUNDLE_LOAD_TIME_WARNING) return 'warning';
    return 'good';
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Performance Dashboard</h2>
            <div className={`w-2 h-2 rounded-full ${
              recommendations.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh</span>
            </label>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Close
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            {/* Navigation */}
            <div className="flex border-b">
              {Object.entries(DASHBOARD_SECTIONS).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(value)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeSection === DASHBOARD_SECTIONS.OVERVIEW && (
                <div className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricsCard
                      title="Memory Usage"
                      value={memoryUsage?.percentage || 0}
                      unit="%"
                      status={getMemoryStatus()}
                      icon={CpuChipIcon}
                      onClick={() => setActiveSection(DASHBOARD_SECTIONS.MEMORY)}
                    />
                    
                    <MetricsCard
                      title="Cache Hit Rate"
                      value={(cacheStats?.hitRate || 0) * 100}
                      unit="%"
                      status={getCacheStatus()}
                      icon={ChartBarIcon}
                      onClick={() => setActiveSection(DASHBOARD_SECTIONS.CACHE)}
                    />
                    
                    <MetricsCard
                      title="Avg Bundle Load"
                      value={bundleReport?.metrics.averageLoadTime || 0}
                      unit="ms"
                      status={getBundleStatus()}
                      icon={ClockIcon}
                      onClick={() => setActiveSection(DASHBOARD_SECTIONS.BUNDLES)}
                    />
                    
                    <MetricsCard
                      title="Components"
                      value={memoryReport?.componentInstances ? Object.keys(memoryReport.componentInstances).length : 0}
                      status="good"
                      icon={CpuChipIcon}
                      onClick={() => setActiveSection(DASHBOARD_SECTIONS.COMPONENTS)}
                    />
                  </div>
                  
                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Performance Recommendations</h3>
                    <RecommendationsPanel recommendations={recommendations} />
                  </div>
                </div>
              )}
              
              {activeSection === DASHBOARD_SECTIONS.MEMORY && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Memory Usage</h3>
                  
                  {memoryHistory.length > 0 ? (
                    <MemoryChart data={memoryHistory} />
                  ) : (
                    <LoadingSkeleton type="chart" />
                  )}
                  
                  {memoryReport && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Component Instances</h4>
                        <div className="space-y-2">
                          {Object.entries(memoryReport.componentInstances).map(([name, count]) => (
                            <div key={name} className="flex justify-between text-sm">
                              <span>{name}</span>
                              <span className="font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Memory Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Used Heap</span>
                            <span className="font-mono">
                              {memoryUsage ? (memoryUsage.used / 1024 / 1024).toFixed(1) : 0} MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Heap</span>
                            <span className="font-mono">
                              {memoryUsage ? (memoryUsage.total / 1024 / 1024).toFixed(1) : 0} MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Event Listeners</span>
                            <span className="font-mono">{memoryReport.eventListeners}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeSection === DASHBOARD_SECTIONS.BUNDLES && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Bundle Performance</h3>
                  
                  {bundleReport?.loadedChunks.length > 0 ? (
                    <BundleChart data={bundleReport.loadedChunks} />
                  ) : (
                    <LoadingSkeleton type="chart" />
                  )}
                  
                  {bundleReport && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Bundle Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Chunks</span>
                            <span className="font-mono">{bundleReport.metrics.totalChunks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loaded Chunks</span>
                            <span className="font-mono">{bundleReport.metrics.loadedChunks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed Chunks</span>
                            <span className="font-mono">{bundleReport.metrics.failedChunks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Load Time</span>
                            <span className="font-mono">{bundleReport.metrics.averageLoadTime.toFixed(0)}ms</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Recent Chunks</h4>
                        <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                          {bundleReport.loadedChunks.slice(-10).map((chunk, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="truncate">{chunk.name}</span>
                              <span className="font-mono">{chunk.loadTime}ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeSection === DASHBOARD_SECTIONS.CACHE && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Cache Performance</h3>
                  
                  {cacheStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Cache Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Entries</span>
                            <span className="font-mono">{cacheStats.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hit Rate</span>
                            <span className="font-mono">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Memory Usage</span>
                            <span className="font-mono">{cacheStats.memoryUsage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => cacheUtils.clearExpired()}
                            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Clear Expired
                          </button>
                          <button
                            onClick={() => cacheUtils.clear()}
                            className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Cache Entries</h4>
                        <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                          {cacheUtils.getEntries().slice(0, 10).map((entry, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="truncate">{entry.key}</span>
                              <span className="font-mono">{entry.accessCount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeSection === DASHBOARD_SECTIONS.COMPONENTS && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Component Performance</h3>
                  
                  {memoryReport?.componentInstances && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(memoryReport.componentInstances).map(([name, count]) => (
                        <div key={name} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-sm">{name}</h4>
                          <p className="text-2xl font-bold text-blue-600">{count}</p>
                          <p className="text-xs text-gray-500">instances</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(PerformanceDashboard);