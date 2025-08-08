import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  PencilIcon,
  ShareIcon,
  UserIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { documentAccessTrackingService } from '@/services/scanner';
import type { AccessEvent, AccessStatistics, ProcessedDocument } from '@/types/scanner';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentAccessHistoryProps {
  document: ProcessedDocument;
  currentUserId: string;
}

interface FilterOptions {
  action?: string;
  dateRange?: { start: Date; end: Date };
  userEmail?: string;
}

const DocumentAccessHistory: React.FC<DocumentAccessHistoryProps> = ({
  document,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [accessHistory, setAccessHistory] = useState<AccessEvent[]>([]);
  const [statistics, setStatistics] = useState<AccessStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'statistics'>('history');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [document.id, filters]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load access history
      const historyResult = await documentAccessTrackingService.getDocumentAccessHistory(
        document.id,
        currentUserId,
        {
          limit: 100,
          action: filters.action,
          dateRange: filters.dateRange
        }
      );

      if (historyResult.success && historyResult.accessHistory) {
        let filteredHistory = historyResult.accessHistory;
        
        // Apply user email filter
        if (filters.userEmail) {
          filteredHistory = filteredHistory.filter(event => 
            event.userEmail?.toLowerCase().includes(filters.userEmail!.toLowerCase())
          );
        }

        setAccessHistory(filteredHistory);
      } else {
        setError(historyResult.error || t('scanner.sharing.errors.loadAccessHistoryFailure'));
      }

      // Load statistics
      const statsResult = await documentAccessTrackingService.getDocumentAccessStatistics(
        document.id,
        currentUserId,
        filters.dateRange
      );

      if (statsResult.success && statsResult.statistics) {
        setStatistics(statsResult.statistics);
      }

    } catch (error) {
      setError(t('scanner.sharing.errors.loadAccessHistoryFailure'));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view':
        return <EyeIcon className="h-4 w-4" />;
      case 'download':
        return <ArrowDownTrayIcon className="h-4 w-4" />;
      case 'edit':
        return <PencilIcon className="h-4 w-4" />;
      case 'share':
        return <ShareIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'view':
        return t('scanner.accessHistory.actions.view');
      case 'download':
        return t('scanner.accessHistory.actions.download');
      case 'edit':
        return t('scanner.accessHistory.actions.edit');
      case 'share':
        return t('scanner.accessHistory.actions.share');
      case 'revoke_share':
        return t('scanner.accessHistory.actions.revokeShare');
      default:
        return action;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'view':
        return 'text-blue-600 bg-blue-50';
      case 'download':
        return 'text-green-600 bg-green-50';
      case 'edit':
        return 'text-purple-600 bg-purple-50';
      case 'share':
        return 'text-orange-600 bg-orange-50';
      case 'revoke_share':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <ComputerDesktopIcon className="h-4 w-4" />;
    
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    return isMobile 
      ? <DevicePhoneMobileIcon className="h-4 w-4" />
      : <ComputerDesktopIcon className="h-4 w-4" />;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('common.time.justNow');
    if (diffMins < 60) return t('common.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('common.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('common.time.daysAgo', { count: diffDays });
    
    return formatDate(date);
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('scanner.accessHistory.tabs.history')}
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'statistics'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('scanner.accessHistory.tabs.statistics')}
          </button>
        </div>

        {activeTab === 'history' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>{t('common.filters')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && activeTab === 'history' && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scanner.accessHistory.filters.action')}
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">{t('common.all')}</option>
                <option value="view">{getActionLabel('view')}</option>
                <option value="download">{getActionLabel('download')}</option>
                <option value="edit">{getActionLabel('edit')}</option>
                <option value="share">{getActionLabel('share')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scanner.accessHistory.filters.userEmail')}
              </label>
              <input
                type="text"
                value={filters.userEmail || ''}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value || undefined })}
                placeholder={t('scanner.accessHistory.filters.userEmailPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scanner.accessHistory.filters.dateRange')}
              </label>
              <input
                type="date"
                value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : undefined;
                  setFilters({ 
                    ...filters, 
                    dateRange: start ? { 
                      start, 
                      end: filters.dateRange?.end || new Date() 
                    } : undefined 
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'history' ? (
        <div className="space-y-4">
          {accessHistory.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('scanner.accessHistory.noActivity.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('scanner.accessHistory.noActivity.description')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessHistory.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className={`flex-shrink-0 p-2 rounded-full ${getActionColor(event.action)}`}>
                    {getActionIcon(event.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getActionLabel(event.action)}
                        </span>
                        {event.userEmail && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <UserIcon className="h-3 w-3" />
                            <span>{event.userEmail}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {getDeviceIcon(event.userAgent)}
                        <span>{formatRelativeTime(event.timestamp)}</span>
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {formatDate(event.timestamp)}
                    </div>

                    {event.ipAddress && (
                      <div className="mt-1 text-xs text-gray-500">
                        IP: {event.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Statistics tab
        <div className="space-y-6">
          {statistics && (
            <>
              {/* Overview stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {t('scanner.accessHistory.stats.totalAccesses')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.totalViews}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {t('scanner.accessHistory.stats.uniqueUsers')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.uniqueViewers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <EyeIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {t('scanner.accessHistory.stats.views')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.totalViews}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ArrowDownTrayIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        {t('scanner.accessHistory.stats.downloads')}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.totalDownloads}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top accessors */}
              {statistics.topViewers.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t('scanner.accessHistory.stats.topAccessors')}
                  </h3>
                  <div className="space-y-3">
                    {statistics.topViewers.map((accessor, index) => (
                      <div key={accessor.userEmail} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {accessor.userEmail}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('scanner.accessHistory.stats.lastAccess', {
                                date: formatDate(accessor.lastAccess)
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {t('scanner.accessHistory.stats.accessCount', {
                            count: accessor.viewCount
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {statistics.recentActivity.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t('scanner.accessHistory.stats.recentActivity')}
                  </h3>
                  <div className="space-y-3">
                    {statistics.recentActivity.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded ${getActionColor(event.action)}`}>
                            {getActionIcon(event.action)}
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">
                              {event.userEmail || t('common.anonymous')} {getActionLabel(event.action).toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(event.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentAccessHistory;
