import React, { useState, useRef, useEffect } from 'react';
import {
  StarIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';

/**
 * Email Search Results Component
 * Displays search results with highlighting and pagination
 */
const EmailSearchResults = ({
  results = [],
  totalResults = 0,
  currentPage = 1,
  pageSize = 20,
  isLoading = false,
  searchQuery = '',
  onPageChange,
  onEmailSelect,
  onEmailAction,
  selectedEmails = [],
  className = '',
}) => {
  const { t } = useTranslation('email');
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  /**
   * Calculate pagination info
   */
  const totalPages = Math.ceil(totalResults / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalResults);

  /**
   * Highlight search terms in text
   */
  const highlightText = (text, query) => {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      return t('common.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  /**
   * Toggle email expansion
   */
  const toggleEmailExpansion = (emailId) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
  };

  /**
   * Handle email selection
   */
  const handleEmailSelect = (email, isSelected) => {
    if (onEmailSelect) {
      onEmailSelect(email, isSelected);
    }
  };

  /**
   * Handle email action (star, mark read, etc.)
   */
  const handleEmailAction = (email, action) => {
    if (onEmailAction) {
      onEmailAction(email, action);
    }
  };

  /**
   * Render email item
   */
  const renderEmailItem = (email) => {
    const isSelected = selectedEmails.includes(email.id);
    const isExpanded = expandedEmails.has(email.id);
    const hasAttachments = email.attachments && email.attachments.length > 0;

    return (
      <div
        key={email.id}
        className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 transition-all duration-200 hover:shadow-md ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : 'bg-white dark:bg-gray-800'
        } ${!email.is_read ? 'font-semibold' : ''}`}
      >
        {/* Email Header */}
        <div className="flex items-start space-x-3">
          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleEmailSelect(email, checked)}
            className="mt-1"
          />

          {/* Email Content */}
          <div className="flex-1 min-w-0">
            {/* Sender and Date */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {highlightText(email.sender_name || email.sender_email, searchQuery)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {email.sender_email}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(email.received_at)}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                {highlightText(email.subject, searchQuery)}
              </h3>
            </div>

            {/* Preview */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {highlightText(email.preview || email.content?.substring(0, 200), searchQuery)}
                {email.content && email.content.length > 200 && '...'}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Attachments */}
                {hasAttachments && (
                  <div className="flex items-center space-x-1">
                    <PaperClipIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {email.attachments.length} {t('email.attachments')}
                    </span>
                  </div>
                )}

                {/* Labels */}
                {email.labels && email.labels.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <TagIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex space-x-1">
                      {email.labels.slice(0, 3).map((label, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                      {email.labels.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{email.labels.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Importance */}
                {email.is_important && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Read/Unread Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmailAction(email, email.is_read ? 'mark_unread' : 'mark_read')}
                  className="p-1"
                >
                  {email.is_read ? (
                    <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-4 h-4 text-blue-500" />
                  )}
                </Button>

                {/* Star Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmailAction(email, email.is_starred ? 'unstar' : 'star')}
                  className="p-1"
                >
                  {email.is_starred ? (
                    <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <StarIcon className="w-4 h-4 text-gray-400" />
                  )}
                </Button>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEmailExpansion(email.id)}
                  className="p-1"
                >
                  <span className="text-xs">
                    {isExpanded ? t('common.collapse') : t('common.expand')}
                  </span>
                </Button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Full Content */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t('email.content')}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {highlightText(email.content, searchQuery)}
                  </div>
                </div>

                {/* Attachments */}
                {hasAttachments && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('email.attachments')}
                    </h4>
                    <div className="space-y-2">
                      {email.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <PaperClipIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {attachment.filename}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({attachment.size})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipients */}
                {email.recipients && email.recipients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t('email.recipients')}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {email.recipients.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render pagination
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('search.showingResults', { start: startIndex, end: endIndex, total: totalResults })}
        </div>

        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center space-x-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>{t('common.previous')}</span>
          </Button>

          {/* Page Numbers */}
          {startPage > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}

          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "primary" : "ghost"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1"
          >
            <span>{t('common.next')}</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t('search.searching')}
          </span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('search.noResults')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('search.noResultsDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Results */}
      <div className="space-y-3">
        {results.map(renderEmailItem)}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default EmailSearchResults;