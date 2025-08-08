import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  StarIcon,
  PaperClipIcon,
  CheckIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import EmailSecurityIndicator from '../../../components/EmailSecurityIndicator';

/**
 * VirtualEmailList Component - High-performance virtual scrolling email list
 * 
 * Features:
 * - Virtual scrolling for thousands of emails
 * - Infinite loading with pagination
 * - Lazy loading of email content
 * - Optimized rendering and memory usage
 * - Email selection and bulk operations
 */
const VirtualEmailList = ({
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
  totalCount = 0,
  itemHeight = 120,
  containerHeight = 600,
  labels = [],
  className = '',
  enableLazyLoading = true,
  cacheSize = 100,
}) => {
  const { t } = useTranslation('email');
  const listRef = useRef();
  const [loadedEmails, setLoadedEmails] = useState(new Map());
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // Memoized email items for performance
  const emailItems = useMemo(() => {
    return emails.map((email, index) => ({
      ...email,
      index,
      isLoaded: loadedEmails.has(email.id),
    }));
  }, [emails, loadedEmails]);

  // Check if item is loaded for infinite loader
  const isItemLoaded = useCallback((index) => {
    return !!emailItems[index];
  }, [emailItems]);

  // Load more items when needed
  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (onLoadMore && hasMore) {
      await onLoadMore(startIndex, stopIndex);
    }
  }, [onLoadMore, hasMore]);

  // Handle visible range change for lazy loading
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
    
    if (enableLazyLoading) {
      // Load email content for visible items
      const visibleEmails = emailItems.slice(visibleStartIndex, visibleStopIndex + 1);
      visibleEmails.forEach(email => {
        if (!loadedEmails.has(email.id)) {
          // Mark as loaded to prevent duplicate requests
          setLoadedEmails(prev => new Map(prev).set(email.id, true));
        }
      });
    }
  }, [emailItems, loadedEmails, enableLazyLoading]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  // Get label badge
  const getLabelBadge = useCallback((labelId) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) return null;

    const colorClasses = {
      'bg-green-500': 'bg-green-100 text-green-800',
      'bg-blue-500': 'bg-blue-100 text-blue-800',
      'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
      'bg-purple-500': 'bg-purple-100 text-purple-800',
    };

    return (
      <span
        key={labelId}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[label.color] || 'bg-gray-100 text-gray-800'}`}
      >
        {label.name}
      </span>
    );
  }, [labels]);

  // Email item renderer
  const EmailItem = useCallback(({ index, style }) => {
    const email = emailItems[index];
    
    if (!email) {
      // Loading placeholder
      return (
        <div style={style} className="p-3 border-b border-gray-200 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
        </div>
      );
    }

    const isSelected = selectedEmail?.id === email.id;
    const isChecked = selectedEmails.has(email.id);

    return (
      <div
        style={style}
        onClick={() => onEmailSelect?.(email)}
        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
        } ${!email.is_read ? 'bg-blue-50' : ''}`}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                e.stopPropagation();
                onEmailCheck?.(email.id, e.target.checked);
              }}
              className="rounded border-gray-300"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStarToggle?.(email.id, !email.is_starred);
              }}
              className="p-1"
            >
              {email.is_starred ? (
                <StarSolidIcon className="h-4 w-4 text-yellow-400" />
              ) : (
                <StarIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {email.attachments?.length > 0 && (
              <PaperClipIcon className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <span className="text-xs text-gray-500">
            {formatTimestamp(email.received_at || email.sent_at)}
          </span>
        </div>

        <div className="flex items-center space-x-2 mb-1">
          <span className={`font-medium text-sm ${!email.is_read ? 'text-black' : 'text-gray-900'}`}>
            {email.sender?.name || email.sender?.email || 'Unknown Sender'}
          </span>
          {email.labels?.map(labelId => getLabelBadge(labelId))}
          <EmailSecurityIndicator email={email} />
        </div>

        <div className={`font-semibold text-sm mb-1 ${!email.is_read ? 'text-blue-700' : 'text-gray-900'}`}>
          {email.subject || '(No Subject)'}
        </div>

        <div className="text-sm text-gray-600 line-clamp-2">
          {email.preview || (email.content?.text || email.content?.html)?.substring(0, 100) + '...'}
        </div>
      </div>
    );
  }, [
    emailItems,
    selectedEmail,
    selectedEmails,
    onEmailSelect,
    onEmailCheck,
    onStarToggle,
    formatTimestamp,
    getLabelBadge,
  ]);

  // Calculate item count for infinite loader
  const itemCount = hasMore ? emails.length + 1 : emails.length;

  if (loading && emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <p>{t('noEmails')}</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={5} // Load more when 5 items from the end
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              ref(list);
              listRef.current = list;
            }}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={itemHeight}
            onItemsRendered={({ visibleStartIndex, visibleStopIndex, ...rest }) => {
              onItemsRendered({
                visibleStartIndex,
                visibleStopIndex,
                ...rest,
              });
              handleItemsRendered({ visibleStartIndex, visibleStopIndex });
            }}
            overscanCount={5} // Render 5 extra items for smooth scrolling
            className="email-list-virtual"
          >
            {EmailItem}
          </List>
        )}
      </InfiniteLoader>
      
      {/* Performance stats (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 p-2 border-t">
          Showing {visibleRange.start + 1}-{Math.min(visibleRange.end + 1, emails.length)} of {totalCount} emails
          {enableLazyLoading && ` | Cached: ${loadedEmails.size}`}
        </div>
      )}
    </div>
  );
};

export default VirtualEmailList;
