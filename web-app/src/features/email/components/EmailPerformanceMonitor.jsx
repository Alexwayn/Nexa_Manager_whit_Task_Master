import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, ServerIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { emailCacheService, emailSyncService } from '@features/email';

/**
 * EmailPerformanceMonitor - Component for monitoring email system performance
 * 
 * Features:
 * - Real-time performance metrics
 * - Cache statistics
 * - Sync status monitoring
 * - Memory usage tracking
 */
const EmailPerformanceMonitor = ({ className = '' }) => {
  const [stats, setStats] = useState({
    cache: {
      hitRate: 0,
      totalItems: 0,
      memoryUsage: 0,
    },
    sync: {
      isOnline: true,
      queueSize: 0,
      lastSyncTime: null,
    },
    performance: {
      avgLoadTime: 0,
      totalRequests: 0,
      errorRate: 0,
    },
  });

  const [isVisible, setIsVisible] = useState(false);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      try {
        const cacheStats = emailCacheService.getStats();
        const syncStats = emailSyncService.getPerformanceStats();
        
        setStats({
          cache: {
            hitRate: parseFloat(cacheStats.hitRate) || 0,
            totalItems: cacheStats.cacheSize || 0,
            memoryUsage: parseFloat(cacheStats.memoryUsageMB) * 1024 * 1024 || 0,
          },
          sync: {
            isOnline: syncStats.isOnline || false,
            queueSize: Object.values(syncStats.queueSizes || {}).reduce((sum, size) => sum + size, 0),
            lastSyncTime: syncStats.lastSyncTime || null,
          },
          performance: {
            avgLoadTime: 0, // Not available in current service
            totalRequests: (cacheStats.hits || 0) + (cacheStats.misses || 0),
            errorRate: 0, // Not available in current service
          },
        });
      } catch (error) {
        console.warn('Error updating performance stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 ${className}`}
        title="Show Performance Monitor"
      >
        <ChartBarIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Email Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {/* Cache Statistics */}
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center mb-2">
            <ServerIcon className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-xs font-medium text-gray-700">Cache Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Hit Rate</span>
              <div className="font-medium">{(stats.cache.hitRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-gray-500">Items</span>
              <div className="font-medium" data-testid="cache-items">{stats.cache.totalItems}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Memory Usage</span>
              <div className="font-medium">{(stats.cache.memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center mb-2">
            <ClockIcon className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-xs font-medium text-gray-700">Sync Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Status</span>
              <div className={`font-medium ${stats.sync.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {stats.sync.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Queue</span>
              <div className="font-medium">{stats.sync.queueSize}</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center mb-2">
            <CpuChipIcon className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-xs font-medium text-gray-700">Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Avg Load</span>
              <div className="font-medium">{stats.performance.avgLoadTime.toFixed(0)}ms</div>
            </div>
            <div>
              <span className="text-gray-500">Requests</span>
              <div className="font-medium" data-testid="performance-requests">{stats.performance.totalRequests}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Error Rate</span>
              <div className="font-medium">{(stats.performance.errorRate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => emailCacheService.clear()}
            className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Clear Cache
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPerformanceMonitor;
