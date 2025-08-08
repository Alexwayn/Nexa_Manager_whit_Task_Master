import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookmarkIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useEmailSearch } from '../hooks/useEmailSearch';
import { useEmails } from '../hooks/useEmails';
import EmailSearch from './EmailSearch';
import EmailSearchResults from './EmailSearchResults';
import { Button } from '@shared/components';
import { Card } from '@shared/components';
import { Badge } from '@shared/components';

/**
 * Email Search Dashboard Component
 * Main dashboard for comprehensive email search functionality
 */
const EmailSearchDashboard = () => {
  const { t } = useTranslation('email');
  const {
    searchResults,
    totalResults,
    currentPage,
    pageSize,
    isSearching,
    searchError,
    searchHistory,
    savedSearches,
    searchStats,
    handlePageChange,
    clearSearch,
  } = useEmailSearch();

  const {
    selectedEmails,
    handleEmailSelect,
    handleEmailAction,
    bulkEmailAction,
  } = useEmails();

  // Local state
  const [selectedSearchResults, setSelectedSearchResults] = useState([]);
  const [showStats, setShowStats] = useState(false);

  /**
   * Handle search results from EmailSearch component
   */
  const handleSearchResults = (results, total) => {
    // Results are already handled by the useEmailSearch hook
    // This is just for any additional processing if needed
  };

  /**
   * Handle email selection in search results
   */
  const handleSearchEmailSelect = (email, isSelected) => {
    setSelectedSearchResults(prev => {
      if (isSelected) {
        return [...prev, email.id];
      } else {
        return prev.filter(id => id !== email.id);
      }
    });

    // Also update the main email selection if needed
    if (handleEmailSelect) {
      handleEmailSelect(email, isSelected);
    }
  };

  /**
   * Handle bulk actions on selected search results
   */
  const handleBulkAction = async (action) => {
    if (selectedSearchResults.length === 0) return;

    try {
      await bulkEmailAction(selectedSearchResults, action);
      setSelectedSearchResults([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  /**
   * Render search statistics
   */
  const renderSearchStats = () => {
    if (!showStats || !searchStats) return null;

    return (
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('search.statistics')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(false)}
          >
            {t('common.hide')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {searchStats.totalEmails || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.totalEmails')}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {searchStats.readEmails || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.readEmails')}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {searchStats.starredEmails || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.starredEmails')}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {searchStats.withAttachments || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.withAttachments')}
            </div>
          </div>
        </div>

        {/* Top Senders */}
        {searchStats.topSenders && searchStats.topSenders.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('search.topSenders')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchStats.topSenders.slice(0, 10).map((sender, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{sender.name || sender.email}</span>
                  <span className="text-xs">({sender.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date Distribution */}
        {searchStats.dateDistribution && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('search.dateDistribution')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{t('search.today')}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {searchStats.dateDistribution.today || 0}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{t('search.thisWeek')}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {searchStats.dateDistribution.thisWeek || 0}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{t('search.thisMonth')}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {searchStats.dateDistribution.thisMonth || 0}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{t('search.older')}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {searchStats.dateDistribution.older || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  /**
   * Render quick actions
   */
  const renderQuickActions = () => {
    if (selectedSearchResults.length === 0) return null;

    return (
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.selectedEmails', { count: selectedSearchResults.length })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('mark_read')}
            >
              {t('email.markRead')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('mark_unread')}
            >
              {t('email.markUnread')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('star')}
            >
              {t('email.star')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkAction('archive')}
            >
              {t('email.archive')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSearchResults([])}
            >
              {t('common.clearSelection')}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  /**
   * Render sidebar with search history and saved searches
   */
  const renderSidebar = () => {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-6">
        {/* Search History */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
              {t('search.recentSearches')}
            </h3>
          </div>
          
          {searchHistory.length > 0 ? (
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((item, index) => (
                <button
                  key={index}
                  className="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Apply history search logic would go here
                  }}
                >
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.query || t('search.advancedSearch')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('search.noRecentSearches')}
            </p>
          )}
        </div>

        {/* Saved Searches */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <BookmarkIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
              {t('search.savedSearches')}
            </h3>
          </div>
          
          {savedSearches.length > 0 ? (
            <div className="space-y-2">
              {savedSearches.map((search) => (
                <button
                  key={search.id}
                  className="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Apply saved search logic would go here
                  }}
                >
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {search.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {search.query || t('search.advancedSearch')}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('search.noSavedSearches')}
            </p>
          )}
        </div>

        {/* Quick Filters */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
              {t('search.quickFilters')}
            </h3>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                // Apply unread filter
              }}
            >
              <InboxIcon className="w-4 h-4 mr-2" />
              {t('search.unreadEmails')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                // Apply starred filter
              }}
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              {t('search.starredEmails')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                // Apply attachments filter
              }}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              {t('search.withAttachments')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <MagnifyingGlassIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('search.emailSearch')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('search.searchDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={showStats ? "primary" : "ghost"}
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-1"
              >
                <ChartBarIcon className="w-4 h-4" />
                <span>{t('search.statistics')}</span>
              </Button>

              {(searchResults.length > 0 || totalResults > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                >
                  {t('search.clearSearch')}
                </Button>
              )}
            </div>
          </div>

          {/* Search Component */}
          <EmailSearch
            onSearchResults={handleSearchResults}
            placeholder={t('search.searchPlaceholder')}
            className="max-w-4xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Search Statistics */}
          {renderSearchStats()}

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Search Results */}
          <EmailSearchResults
            results={searchResults}
            totalResults={totalResults}
            currentPage={currentPage}
            pageSize={pageSize}
            isLoading={isSearching}
            onPageChange={handlePageChange}
            onEmailSelect={handleSearchEmailSelect}
            onEmailAction={handleEmailAction}
            selectedEmails={selectedSearchResults}
            className="bg-white dark:bg-gray-800 rounded-lg p-6"
          />

          {/* Search Error */}
          {searchError && (
            <Card className="mt-4 p-4 border-red-200 dark:border-red-800">
              <div className="text-red-600 dark:text-red-400">
                <h3 className="font-medium mb-2">{t('search.error')}</h3>
                <p className="text-sm">{searchError}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailSearchDashboard;
