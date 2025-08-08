import React from 'react';
import EmailViewer from './EmailViewer';
import { useEmailViewer } from '../hooks/useEmailViewer';

/**
 * EmailViewerContainer - Container component that manages email viewer state
 * and connects EmailViewer component with email management service
 */
const EmailViewerContainer = ({
  email,
  labels = [],
  showThread = false,
  onEmailUpdate,
  className = '',
}) => {
  const {
    loading,
    error,
    threadEmails,
    showThread: showThreadState,
    markAsRead,
    toggleStar,
    archiveEmail,
    deleteEmail,
    flagEmail,
    replyToEmail,
    forwardEmail,
    moveToFolder,
    applyLabel,
    removeLabel,
    downloadAttachment,
    toggleThreadView,
  } = useEmailViewer(email);

  // Handle reply
  const handleReply = async (emailId, replyContent) => {
    const result = await replyToEmail(emailId, replyContent, false);
    if (result.success && onEmailUpdate) {
      onEmailUpdate('reply', { emailId, success: true });
    }
    return result;
  };

  // Handle reply all
  const handleReplyAll = async (emailId) => {
    // This would typically open a compose modal with all recipients
    if (onEmailUpdate) {
      onEmailUpdate('replyAll', { emailId });
    }
  };

  // Handle forward
  const handleForward = async (emailId) => {
    // This would typically open a compose modal for forwarding
    if (onEmailUpdate) {
      onEmailUpdate('forward', { emailId });
    }
  };

  // Handle archive
  const handleArchive = async (emailId) => {
    const result = await archiveEmail(emailId);
    if (result.success && onEmailUpdate) {
      onEmailUpdate('archive', { emailId, success: true });
    }
    return result;
  };

  // Handle delete
  const handleDelete = async (emailId) => {
    const result = await deleteEmail(emailId);
    if (result.success && onEmailUpdate) {
      onEmailUpdate('delete', { emailId, success: true });
    }
    return result;
  };

  // Handle star toggle
  const handleStar = async (emailId) => {
    const result = await toggleStar(emailId);
    if (result.success && onEmailUpdate) {
      onEmailUpdate('star', { emailId, success: true, isStarred: !email.isStarred });
    }
    return result;
  };

  // Handle flag
  const handleFlag = async (emailId) => {
    const result = await flagEmail(emailId);
    if (result.success && onEmailUpdate) {
      onEmailUpdate('flag', { emailId, success: true, isImportant: !email.isImportant });
    }
    return result;
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading email</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <EmailViewer
      email={email}
      onReply={handleReply}
      onReplyAll={handleReplyAll}
      onForward={handleForward}
      onArchive={handleArchive}
      onDelete={handleDelete}
      onStar={handleStar}
      onFlag={handleFlag}
      onMarkAsRead={markAsRead}
      labels={labels}
      showThread={showThread || showThreadState}
      threadEmails={threadEmails}
      onThreadToggle={toggleThreadView}
      className={className}
    />
  );
};

export default EmailViewerContainer;
