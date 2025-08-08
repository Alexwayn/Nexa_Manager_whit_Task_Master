import React, { useState, useRef, useEffect } from 'react';
import {
  StarIcon,
  PaperClipIcon,
  ArchiveBoxIcon,
  TrashIcon,
  FlagIcon,
  EllipsisHorizontalIcon,
  ArrowUturnLeftIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

/**
 * EmailViewer Component - Display email content with threading and conversation view
 * 
 * Features:
 * - Full email content display with proper formatting
 * - Email threading and conversation view
 * - Attachment handling and preview
 * - Reply functionality
 * - Email actions (archive, delete, star, etc.)
 */
const EmailViewer = ({
  email,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onStar,
  onFlag,
  onMarkAsRead,
  labels = [],
  showThread = false,
  threadEmails = [],
  onThreadToggle,
  className = '',
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const replyInputRef = useRef(null);

  // Auto-focus reply input when reply box is shown
  useEffect(() => {
    if (showReplyBox && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyBox]);

  // Mark email as read when viewed
  useEffect(() => {
    if (email && !email.isRead && onMarkAsRead) {
      onMarkAsRead(email.id, true);
    }
  }, [email, onMarkAsRead]);

  if (!email) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-white ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No email selected</h3>
          <p className="text-gray-500">Select an email from the list to view its contents</p>
        </div>
      </div>
    );
  }

  // Get label badge component
  const getLabelBadge = (labelId) => {
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
  };

  // Get attachment icon based on file type
  const getAttachmentIcon = (attachment) => {
    const { name, type, mimeType } = attachment;
    const extension = name?.split('.').pop()?.toLowerCase();
    
    if (type === 'image' || mimeType?.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-600" />;
    } else if (type === 'video' || mimeType?.startsWith('video/')) {
      return <FilmIcon className="h-8 w-8 text-purple-600" />;
    } else if (type === 'pdf' || extension === 'pdf') {
      return <DocumentTextIcon className="h-8 w-8 text-red-600" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DocumentTextIcon className="h-8 w-8 text-blue-600" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <DocumentTextIcon className="h-8 w-8 text-green-600" />;
    } else {
      return <DocumentIcon className="h-8 w-8 text-gray-600" />;
    }
  };

  // Format email content with proper line breaks and formatting
  const formatEmailContent = (content) => {
    if (!content) return null;

    const htmlContent = content.html || content.text;
    if (!htmlContent) return null;

    // If it's HTML content, render it safely
    if (content.html) {
      return (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      );
    }

    // For plain text, format with proper line breaks
    return content.text.split('\n\n').map((paragraph, index) => {
      if (paragraph.includes('•') || paragraph.includes('-')) {
        // Handle bullet points
        const lines = paragraph.split('\n');
        const bulletLines = lines.filter(line => 
          line.trim().startsWith('•') || line.trim().startsWith('-')
        );
        
        if (bulletLines.length > 0) {
          return (
            <ul key={index} className="list-disc list-inside space-y-1 ml-4 mb-4">
              {bulletLines.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-900">
                  {item.replace(/^[•-]\s*/, '').trim()}
                </li>
              ))}
            </ul>
          );
        }
      }
      
      if (paragraph.trim()) {
        return (
          <p key={index} className="text-gray-900 leading-relaxed mb-4">
            {paragraph}
          </p>
        );
      }
      return null;
    });
  };

  // Handle reply submission
  const handleReplySubmit = () => {
    if (replyText.trim() && onReply) {
      onReply(email.id, replyText);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  // Toggle thread expansion
  const toggleThreadExpansion = (threadId) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render thread emails
  const renderThreadEmails = () => {
    if (!showThread || !threadEmails || threadEmails.length <= 1) {
      return null;
    }

    return (
      <div className="border-t border-gray-200 mt-6">
        <button
          onClick={onThreadToggle}
          className="flex items-center space-x-2 p-4 w-full text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            {threadEmails.length} messages in this conversation
          </span>
          {expandedThreads.has(email.threadKey) ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedThreads.has(email.threadKey) && (
          <div className="space-y-4 px-4 pb-4">
            {threadEmails.slice(1).map((threadEmail, index) => (
              <div key={threadEmail.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {threadEmail.sender?.name || threadEmail.sender?.email}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(threadEmail.receivedAt)}
                    </span>
                  </div>
                  {threadEmail.isStarred && (
                    <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  {formatEmailContent(threadEmail.content)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Email Header */}
      <div className="p-6 border-b border-gray-200">
        {/* Action buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onArchive && onArchive(email.id)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Archive"
            >
              <ArchiveBoxIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete && onDelete(email.id)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => onFlag && onFlag(email.id)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Flag"
            >
              <FlagIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={() => onStar && onStar(email.id)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={email.isStarred ? 'Unstar' : 'Star'}
            >
              {email.isStarred ? (
                <StarSolidIcon className="h-5 w-5 text-yellow-400" />
              ) : (
                <StarIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Subject */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          {email.subject || '(No Subject)'}
        </h1>

        {/* Sender info and labels */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {email.sender?.name ? (
                <span className="text-lg font-medium text-gray-600">
                  {email.sender.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-lg font-medium text-gray-600">?</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">
                  {email.sender?.name || 'Unknown Sender'}
                </span>
                <span className="text-gray-600">
                  &lt;{email.sender?.email || 'unknown@example.com'}&gt;
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>To: {email.recipients?.to?.[0]?.email || 'you'}</span>
                <span>•</span>
                <span>{formatDate(email.receivedAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex items-center space-x-1">
              {email.labels.map(labelId => getLabelBadge(labelId))}
            </div>
          )}
        </div>

        {/* Reply actions */}
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => onReplyAll && onReplyAll(email.id)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Reply All
          </button>
          <button
            onClick={() => onForward && onForward(email.id)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Forward
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Main email content */}
          <div className="space-y-4 max-w-none">
            {formatEmailContent(email.content)}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <PaperClipIcon className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {email.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAttachment(attachment)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getAttachmentIcon(attachment)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {attachment.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attachment.size}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thread emails */}
          {renderThreadEmails()}

          {/* Reply Section */}
          {showReplyBox && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">Reply to {email.sender?.name}</span>
                  <button
                    onClick={() => setShowReplyBox(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                      <PaperClipIcon className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Send</span>
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailViewer;
