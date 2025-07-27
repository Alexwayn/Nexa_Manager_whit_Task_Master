import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ClockIcon,
  BookmarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  PaperClipIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useEmailSearch } from '../hooks/useEmailSearch';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components';
import { Select } from '../../../shared/components';
import { Checkbox } from '../../../shared/components';
import { Badge } from '../../../shared/components';

/**
 * Comprehensive Email Search Component
 * Provides advanced search functionality with filters, suggestions, and saved searches
 */
const EmailSearch = ({ 
  onSearchResults, 
  className = '',
  placeholder = 'Search emails...',
  showAdvancedByDefault = false 
}) => {
  const { t } = useTranslation('email');
  const {
    searchQuery,
    searchFilters,
    searchResults,
    isSearching,
    searchError,
    totalResults,
    showAdvancedSearch,
    searchSuggestions,
    showSuggestions,
    searchHistory,
    savedSearches,
    handleSearchQueryChange,
    handleFilterChange,
    clearSearch,
    applySuggestion,
    applyHistorySearch,
    saveCurrentSearch,
    applySavedSearch,
    deleteSavedSearch,
    toggleAdvancedSearch,
    setShowSuggestions,
  } = useEmailSearch();

  // Local state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  // Refs
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Initialize advanced search state
  useEffect(() => {
    if (showAdvancedByDefault && !showAdvancedSearch) {
      toggleAdvancedSearch();
    }
  }, [showAdvancedByDefault, showAdvancedSearch, toggleAdvancedSearch]);

  // Pass search results to parent
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(searchResults, totalResults);
    }
  }, [searchResults, totalResults, onSearchResults]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowHistoryDropdown(false);
        setShowSavedDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  /**
   * Handle save search
   */
  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      saveCurrentSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  /**
   * Render search suggestions
   */
  const renderSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
        {searchSuggestions.map((suggestion, index) => (
          <button
            key={index}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => applySuggestion(suggestion)}
          >
            {suggestion.type === 'sender' && <UserIcon className="w-4 h-4 text-gray-400" />}
            {suggestion.type === 'subject' && <DocumentTextIcon className="w-4 h-4 text-gray-400" />}
            {suggestion.type === 'label' && (
              <TagIcon 
                className="w-4 h-4" 
                style={{ color: suggestion.color || '#6B7280' }} 
              />
            )}
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {suggestion.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render search history dropdown
   */
  const renderHistoryDropdown = () => {
    if (!showHistoryDropdown || searchHistory.length === 0) return null;

    return (
      <div className="absolute top-full right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 w-80 max-h-64 overflow-y-auto">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('search.recentSearches')}
          </h3>
        </div>
        {searchHistory.map((item, index) => (
          <button
            key={index}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => {
              applyHistorySearch(item);
              setShowHistoryDropdown(false);
            }}
          >
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {item.query || t('search.advancedSearch')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(item.timestamp).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render saved searches dropdown
   */
  const renderSavedDropdown = () => {
    if (!showSavedDropdown || savedSearches.length === 0) return null;

    return (
      <div className="absolute top-full right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 w-80 max-h-64 overflow-y-auto">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('search.savedSearches')}
          </h3>
        </div>
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
          >
            <button
              className="flex-1 text-left"
              onClick={() => {
                applySavedSearch(search);
                setShowSavedDropdown(false);
              }}
            >
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {search.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {search.query || t('search.advancedSearch')}
              </div>
            </button>
            <button
              className="ml-2 p-1 text-gray-400 hover:text-red-500"
              onClick={() => deleteSavedSearch(search.id)}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render active filters
   */
  const renderActiveFilters = () => {
    const activeFilters = [];

    if (searchFilters.sender) {
      activeFilters.push({
        key: 'sender',
        label: `From: ${searchFilters.sender}`,
        onRemove: () => handleFilterChange({ sender: undefined }),
      });
    }

    if (searchFilters.subject) {
      activeFilters.push({
        key: 'subject',
        label: `Subject: ${searchFilters.subject}`,
        onRemove: () => handleFilterChange({ subject: undefined }),
      });
    }

    if (searchFilters.has_attachments) {
      activeFilters.push({
        key: 'attachments',
        label: 'Has attachments',
        onRemove: () => handleFilterChange({ has_attachments: undefined }),
      });
    }

    if (searchFilters.is_starred) {
      activeFilters.push({
        key: 'starred',
        label: 'Starred',
        onRemove: () => handleFilterChange({ is_starred: undefined }),
      });
    }

    if (searchFilters.is_read === false) {
      activeFilters.push({
        key: 'unread',
        label: 'Unread',
        onRemove: () => handleFilterChange({ is_read: undefined }),
      });
    }

    if (searchFilters.labels && searchFilters.labels.length > 0) {
      searchFilters.labels.forEach((label, index) => {
        activeFilters.push({
          key: `label-${index}`,
          label: `Label: ${label}`,
          onRemove: () => {
            const newLabels = searchFilters.labels.filter((_, i) => i !== index);
            handleFilterChange({ labels: newLabels.length > 0 ? newLabels : undefined });
          },
        });
      });
    }

    if (searchFilters.date_from || searchFilters.date_to) {
      const dateLabel = searchFilters.date_from && searchFilters.date_to
        ? `${new Date(searchFilters.date_from).toLocaleDateString()} - ${new Date(searchFilters.date_to).toLocaleDateString()}`
        : searchFilters.date_from
        ? `From: ${new Date(searchFilters.date_from).toLocaleDateString()}`
        : `To: ${new Date(searchFilters.date_to).toLocaleDateString()}`;

      activeFilters.push({
        key: 'date',
        label: dateLabel,
        onRemove: () => handleFilterChange({ date_from: undefined, date_to: undefined }),
      });
    }

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {activeFilters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="flex items-center space-x-1"
          >
            <span className="text-xs">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="ml-1 hover:text-red-500"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  /**
   * Render advanced search form
   */
  const renderAdvancedSearch = () => {
    if (!showAdvancedSearch) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.sender')}
            </label>
            <Input
              type="text"
              placeholder="sender@example.com"
              value={searchFilters.sender || ''}
              onChange={(e) => handleFilterChange({ sender: e.target.value || undefined })}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.subject')}
            </label>
            <Input
              type="text"
              placeholder="Subject contains..."
              value={searchFilters.subject || ''}
              onChange={(e) => handleFilterChange({ subject: e.target.value || undefined })}
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.dateFrom')}
            </label>
            <Input
              type="date"
              value={searchFilters.date_from || ''}
              onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.dateTo')}
            </label>
            <Input
              type="date"
              value={searchFilters.date_to || ''}
              onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Checkbox
            id="has-attachments"
            checked={searchFilters.has_attachments || false}
            onCheckedChange={(checked) => 
              handleFilterChange({ has_attachments: checked || undefined })
            }
            label={t('search.hasAttachments')}
          />

          <Checkbox
            id="is-starred"
            checked={searchFilters.is_starred || false}
            onCheckedChange={(checked) => 
              handleFilterChange({ is_starred: checked || undefined })
            }
            label={t('search.starred')}
          />

          <Checkbox
            id="is-unread"
            checked={searchFilters.is_read === false}
            onCheckedChange={(checked) => 
              handleFilterChange({ is_read: checked ? false : undefined })
            }
            label={t('search.unread')}
          />

          <Checkbox
            id="is-important"
            checked={searchFilters.is_important || false}
            onCheckedChange={(checked) => 
              handleFilterChange({ is_important: checked || undefined })
            }
            label={t('search.important')}
          />
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.sortBy')}
            </label>
            <Select
              value={searchFilters.sortBy || 'received_at'}
              onValueChange={(value) => handleFilterChange({ sortBy: value })}
            >
              <option value="received_at">{t('search.dateReceived')}</option>
              <option value="sent_at">{t('search.dateSent')}</option>
              <option value="subject">{t('search.subject')}</option>
              <option value="sender_name">{t('search.sender')}</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('search.sortOrder')}
            </label>
            <Select
              value={searchFilters.sortOrder || 'desc'}
              onValueChange={(value) => handleFilterChange({ sortOrder: value })}
            >
              <option value="desc">{t('search.newest')}</option>
              <option value="asc">{t('search.oldest')}</option>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Bar */}
      <div className="relative" ref={suggestionsRef}>
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              className="pl-10 pr-4"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-2">
            {/* Advanced Search Toggle */}
            <Button
              variant={showAdvancedSearch ? "primary" : "ghost"}
              size="sm"
              onClick={toggleAdvancedSearch}
              className="flex items-center space-x-1"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              {showAdvancedSearch && <ChevronUpIcon className="w-3 h-3" />}
              {!showAdvancedSearch && <ChevronDownIcon className="w-3 h-3" />}
            </Button>

            {/* Search History */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                disabled={searchHistory.length === 0}
              >
                <ClockIcon className="w-4 h-4" />
              </Button>
              {renderHistoryDropdown()}
            </div>

            {/* Saved Searches */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                disabled={savedSearches.length === 0}
              >
                <BookmarkIcon className="w-4 h-4" />
              </Button>
              {renderSavedDropdown()}
            </div>

            {/* Save Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!searchQuery.trim() && Object.keys(searchFilters).length === 0}
            >
              <StarIcon className="w-4 h-4" />
            </Button>

            {/* Clear Search */}
            {(searchQuery || Object.keys(searchFilters).length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Suggestions */}
        {renderSuggestions()}
      </div>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Advanced Search Form */}
      {renderAdvancedSearch()}

      {/* Search Results Summary */}
      {totalResults > 0 && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('search.resultsFound', { count: totalResults })}
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {t('search.error')}: {searchError}
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t('search.saveSearch')}
            </h3>
            <Input
              type="text"
              placeholder={t('search.searchName')}
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSearch;