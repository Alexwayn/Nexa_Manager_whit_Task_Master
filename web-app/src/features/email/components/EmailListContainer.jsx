import React from 'react';
import EmailList from './EmailList';
import useEmailList from '../hooks/useEmailList';

/**
 * EmailListContainer - Container component that manages email list state
 * and connects EmailList component with email management service
 */
const EmailListContainer = ({
  folderId = 'inbox',
  selectedEmail,
  onEmailSelect,
  labels = [],
  showThreads = false,
  className = '',
}) => {
  const {
    emails,
    selectedEmails,
    loading,
    error,
    hasMore,
    stats,
    loadMore,
    refresh,
    search,
    selectEmail,
    toggleEmailSelection,
    selectAllEmails,
    toggleStar,
    performBulkAction,
  } = useEmailList({
    folderId,
    pageSize: 50,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Handle email selection
  const handleEmailSelect = (email) => {
    selectEmail(email);
    if (onEmailSelect) {
      onEmailSelect(email);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action, emailIds) => {
    performBulkAction(action, emailIds);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading emails</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <EmailList
      emails={emails}
      selectedEmail={selectedEmail}
      selectedEmails={selectedEmails}
      onEmailSelect={handleEmailSelect}
      onEmailCheck={toggleEmailSelection}
      onStarToggle={toggleStar}
      onBulkAction={handleBulkAction}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      showThreads={showThreads}
      labels={labels}
      className={className}
    />
  );
};

export default EmailListContainer;
