import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  StarIcon,
  PaperClipIcon,
  CheckIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

/**
 * EmailList Component - Virtual scrolling email list with selection and bulk operations
 * 
 * Features:
 * - Virtual scrolling for performance with large email lists
 * - Email selection and bulk operations
 * - Email threading and conversation view
 * - Real-time updates and filtering
 */
const EmailList = ({
  emails = [],
  selectedEmail,
  selectedEmails = new Set(),
  onEmailSelect,
  onEmailCheck,
  onStarToggle,
  onBulkAction,
  loading = false,
  hasMore = false,
  onLoadMore,
  showThreads = false,
  labels = [],
  className = '',
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [hoveredEmail, setHoveredEmail] = useState(null);

  // Group emails by thread if threading is enabled
  const processedEmails = useMemo(() => {
    if (!showThreads) {
      return emails;
    }

    // Group emails by threadId or subject
    const threads = new Map();
    const standaloneEmails = [];

    emails.forEach(email => {
      const threadKey = email.threadId || email.subject;
      if (threadKey && emails.filter(e => (e.threadId || e.subject) === threadKey).length > 1) {
        if (!threads.has(threadKey)) {
          threads.set(threadKey, []);
        }
        threads.get(threadKey).push(email);
      } else {
        standaloneEmails.push(email);
      }
    });

    // Convert threads to thread objects and combine with standalone emails
    const threadedEmails = [];
    
    // Add standalone emails
    standaloneEmails.forEach(email => {
      threadedEmails.push({ ...email, isThread: false });
    });

    // Add threads (show latest email as representative)
    threads.forEach((threadEmails, threadKey) => {
      const sortedThreadEmails = threadEmails.sort((a, b) => 
        new Date(b.receivedAt) - new Date(a.receivedAt)
      );
      const latestEmail = sortedThreadEmails[0];
      
      threadedEmails.push({
        ...latestEmail,
        isThread: true,
        threadCount: threadEmails.length,
        threadEmails: sortedThreadEmails,
        threadKey,
      });
    });

    // Sort by received date
    return threadedEmails.sort((a, b) => 
      new Date(b.receivedAt) - new Date(a.receivedAt)
    );
  }, [emails, showThreads]);

  // Handle select all checkbox
  useEffect(() => {
    const allEmailIds = processedEmails.map(email => email.id);
    const selectedCount = allEmailIds.filter(id => selectedEmails.has(id)).length;
    
    if (selectedCount === 0) {
      setSelectAll(false);
    } else if (selectedCount === allEmailIds.length) {
      setSelectAll(true);
    } else {
      setSelectAll('indeterminate');
    }
  }, [selectedEmails, processedEmails]);

  // Handle select all toggle
  const handleSelectAllToggle = useCallback(() => {
    const allEmailIds = processedEmails.map(email => email.id);
    
    if (selectAll === true) {
      // Deselect all
      allEmailIds.forEach(id => onEmailCheck(id, false));
    } else {
      // Select all
      allEmailIds.forEach(id => onEmailCheck(id, true));
    }
  }, [selectAll, processedEmails, onEmailCheck]);

  // Get label badge component
  const getLabelBadge = useCallback((labelId) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) return null;

    const colorClasses = {
      'bg-green-500': 'bg-green-100 text-green-800',
      'bg-blue-500': 'bg-blue-100 text-blue-800',
      'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
      'bg-purple-500': 'bg-purple-100 text-purple-800',
      'bg-red-500': 'bg-red-100 text-red-800',
      'bg-indigo-500': 'bg-indigo-100 text-indigo-800',
    };

    return (
      <span
        key={labelId}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          colorClasses[label.color] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {label.name}
      </span>
    );
  }, [labels]);

  // Format time display
  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Email item renderer for virtual list
  const EmailItem = useCallback(({ index, style }) => {
    const email = processedEmails[index];
    if (!email) return null;

    const isSelected = selectedEmail?.id === email.id;
    const isChecked = selectedEmails.has(email.id);
    const isHovered = hoveredEmail === email.id;

    return (
      <div
        style={style}
        className={`border-b border-gray-200 cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-50 border-l-4 border-l-blue-600' 
            : isHovered 
              ? 'bg-gray-50' 
              : 'bg-white hover:bg-gray-50'
        } ${!email.isRead ? 'bg-blue-25' : ''}`}
        onClick={() => onEmailSelect(email)}
        onMouseEnter={() => setHoveredEmail(email.id)}
        onMouseLeave={() => setHoveredEmail(null)}
      >
        <div className="p-3">
          {/* Header row with checkbox, star, and time */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onEmailCheck(email.id, e.target.checked);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStarToggle(email.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {email.isStarred ? (
                  <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                ) : (
                  <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                )}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {email.hasAttachments && (
                <PaperClipIcon className="h-4 w-4 text-gray-400" data-testid="paper-clip-icon" />
              )}
              <span className="text-sm text-gray-500">
                {formatTime(email.receivedAt)}
              </span>
            </div>
          </div>

          {/* Sender and labels row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className={`font-medium truncate ${
                !email.isRead ? 'text-black' : 'text-gray-900'
              }`}>
                {email.sender?.name || email.sender?.email || 'Unknown Sender'}
              </span>
              {email.isThread && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {email.threadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {email.labels?.map(labelId => getLabelBadge(labelId))}
            </div>
          </div>

          {/* Subject */}
          <div className={`font-semibold mb-1 truncate ${
            !email.isRead ? 'text-blue-700' : 'text-gray-900'
          }`}>
            {email.subject || '(No Subject)'}
          </div>

          {/* Preview */}
          <div className="text-sm text-gray-600 line-clamp-2">
            {email.preview || email.content?.text || '(No preview available)'}
          </div>

          {/* Thread indicator */}
          {email.isThread && (
            <div className="mt-2 text-xs text-gray-500">
              {email.threadCount} messages in conversation
            </div>
          )}
        </div>
      </div>
    );
  }, [
    processedEmails,
    selectedEmail,
    selectedEmails,
    hoveredEmail,
    onEmailSelect,
    onEmailCheck,
    onStarToggle,
    getLabelBadge,
    formatTime,
  ]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action) => {
    const selectedEmailIds = Array.from(selectedEmails);
    if (selectedEmailIds.length === 0) return;

    onBulkAction(action, selectedEmailIds);
  }, [selectedEmails, onBulkAction]);

  if (loading && processedEmails.length === 0) {
    return (
      <div className={`flex flex-col bg-white ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-3 border-b border-gray-200">
            <div className="animate-pulse">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Email List Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectAll === true}
            ref={(input) => {
              if (input) input.indeterminate = selectAll === 'indeterminate';
            }}
            onChange={handleSelectAllToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {selectedEmails.size > 0 
              ? `${selectedEmails.size} selected`
              : `${processedEmails.length} emails`
            }
          </span>
        </div>
        
        {/* Bulk action buttons */}
        {selectedEmails.size > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('archive')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Archive selected"
            >
              <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Delete selected"
            >
              <TrashIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => handleBulkAction('markRead')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Mark as read"
            >
              <CheckIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => handleBulkAction('star')}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Star selected"
            >
              <StarIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="More actions"
            >
              <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Virtual Email List */}
      <div className="flex-1">
        {processedEmails.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No emails</h3>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading emails...' : 'No emails found in this folder'}
              </p>
            </div>
          </div>
        ) : (
          <List
            height={600} // This should be dynamic based on container
            itemCount={processedEmails.length}
            itemSize={120} // Approximate height per email item
            itemData={processedEmails}
            overscanCount={5}
          >
            {EmailItem}
          </List>
        )}
      </div>

      {/* Load more indicator */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more emails'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailList;
