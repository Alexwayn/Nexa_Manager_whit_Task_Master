import { useState, useCallback, useEffect } from 'react';
import emailManagementService from '@features/email/services/emailManagementService';
import { useAuth } from '@clerk/clerk-react';
import Logger from '@utils/Logger';

/**
 * useEmailViewer Hook - Manages email viewer state and operations
 * 
 * Features:
 * - Email content loading and display
 * - Email actions (reply, forward, archive, delete, etc.)
 * - Thread management and conversation view
 * - Attachment handling
 */
export const useEmailViewer = (email) => {
  const { userId } = useAuth();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threadEmails, setThreadEmails] = useState([]);
  const [showThread, setShowThread] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');

  // Load thread emails if email has thread
  const loadThreadEmails = useCallback(async (threadKey) => {
    if (!userId || !threadKey) return;

    try {
      setLoading(true);
      
      // Search for emails with same thread key or subject
      const result = await emailManagementService.searchEmails(userId, '', {
        threadId: threadKey,
        limit: 50,
        sortBy: 'receivedAt',
        sortOrder: 'asc',
      });

      if (result.success) {
        setThreadEmails(result.data);
        setShowThread(result.data.length > 1);
      } else {
        Logger.error('Error loading thread emails:', result.error);
      }
    } catch (err) {
      Logger.error('Error in loadThreadEmails:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark email as read
  const markAsRead = useCallback(async (emailId, isRead = true) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.markAsRead(emailId, userId, isRead);
      if (!result.success) {
        Logger.error('Error marking email as read:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in markAsRead:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Star/unstar email
  const toggleStar = useCallback(async (emailId) => {
    if (!userId || !email) return;

    try {
      const result = await emailManagementService.starEmail(emailId, userId, !email.isStarred);
      if (!result.success) {
        Logger.error('Error toggling star:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in toggleStar:', err);
      return { success: false, error: err.message };
    }
  }, [userId, email]);

  // Archive email
  const archiveEmail = useCallback(async (emailId) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.moveToFolder(emailId, userId, 'archived');
      if (!result.success) {
        Logger.error('Error archiving email:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in archiveEmail:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Delete email
  const deleteEmail = useCallback(async (emailId, permanent = false) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.deleteEmail(emailId, userId, permanent);
      if (!result.success) {
        Logger.error('Error deleting email:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in deleteEmail:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Flag email
  const flagEmail = useCallback(async (emailId) => {
    if (!userId || !email) return;

    try {
      // Update email with important flag
      const result = await emailManagementService.bulkUpdateEmails([emailId], userId, {
        isImportant: !email.isImportant
      });
      
      if (!result.success) {
        Logger.error('Error flagging email:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in flagEmail:', err);
      return { success: false, error: err.message };
    }
  }, [userId, email]);

  // Reply to email
  const replyToEmail = useCallback(async (emailId, replyContent, replyAll = false) => {
    if (!userId || !email) return;

    try {
      setLoading(true);

      // Prepare reply email data
      const replyData = {
        to: replyAll ? 
          [email.sender.email, ...(email.recipients?.cc || []).map(r => r.email)] :
          [email.sender.email],
        subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
        text: replyContent,
        threadId: email.threadId || email.id,
        relatedDocuments: email.relatedDocuments,
        clientId: email.clientId,
      };

      const result = await emailManagementService.sendEmail(userId, replyData);
      
      if (result.success) {
        setReplyDraft('');
        // Reload thread emails to show the new reply
        if (email.threadKey) {
          await loadThreadEmails(email.threadKey);
        }
      } else {
        Logger.error('Error sending reply:', result.error);
      }
      
      return result;
    } catch (err) {
      Logger.error('Error in replyToEmail:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, email, loadThreadEmails]);

  // Forward email
  const forwardEmail = useCallback(async (emailId, forwardData) => {
    if (!userId || !email) return;

    try {
      setLoading(true);

      // Prepare forward email data
      const forwardEmailData = {
        to: forwardData.to,
        cc: forwardData.cc,
        bcc: forwardData.bcc,
        subject: email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`,
        text: `${forwardData.message || ''}\n\n---------- Forwarded message ----------\nFrom: ${email.sender.name} <${email.sender.email}>\nDate: ${new Date(email.receivedAt).toLocaleString()}\nSubject: ${email.subject}\n\n${email.content?.text || ''}`,
        html: forwardData.html,
        attachments: forwardData.includeAttachments ? email.attachments : [],
      };

      const result = await emailManagementService.sendEmail(userId, forwardEmailData);
      
      if (!result.success) {
        Logger.error('Error forwarding email:', result.error);
      }
      
      return result;
    } catch (err) {
      Logger.error('Error in forwardEmail:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  // Move to folder
  const moveToFolder = useCallback(async (emailId, folderId) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.moveToFolder(emailId, userId, folderId);
      if (!result.success) {
        Logger.error('Error moving email to folder:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in moveToFolder:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Apply label
  const applyLabel = useCallback(async (emailId, labelId) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.applyLabel(emailId, userId, labelId);
      if (!result.success) {
        Logger.error('Error applying label:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in applyLabel:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Remove label
  const removeLabel = useCallback(async (emailId, labelId) => {
    if (!userId) return;

    try {
      const result = await emailManagementService.removeLabel(emailId, userId, labelId);
      if (!result.success) {
        Logger.error('Error removing label:', result.error);
      }
      return result;
    } catch (err) {
      Logger.error('Error in removeLabel:', err);
      return { success: false, error: err.message };
    }
  }, [userId]);

  // Download attachment
  const downloadAttachment = useCallback(async (attachment) => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = attachment.url || attachment.downloadUrl;
      link.download = attachment.name;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (err) {
      Logger.error('Error downloading attachment:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Toggle thread view
  const toggleThreadView = useCallback(() => {
    setShowThread(prev => !prev);
  }, []);

  // Load thread emails when email changes
  useEffect(() => {
    if (email?.threadKey || email?.isThread) {
      loadThreadEmails(email.threadKey || email.subject);
    } else {
      setThreadEmails([]);
      setShowThread(false);
    }
  }, [email, loadThreadEmails]);

  // Auto-mark as read when email is viewed
  useEffect(() => {
    if (email && !email.isRead) {
      markAsRead(email.id, true);
    }
  }, [email, markAsRead]);

  return {
    // State
    loading,
    error,
    threadEmails,
    showThread,
    replyDraft,

    // Actions
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

    // Draft management
    setReplyDraft,
  };
};

export default useEmailViewer;