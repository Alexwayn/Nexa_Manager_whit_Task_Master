import { useState, useEffect, useCallback } from 'react';
import emailManagementService from '@features/email/services/emailManagementService';
import emailAttachmentService from '@lib/emailAttachmentService';
import { useUser } from '@clerk/clerk-react';
import { useEmailContext } from '@context/EmailContext';
import Logger from '@utils/Logger';

/**
 * Enhanced custom hook for email composition functionality
 * Handles email data, validation, drafts, and sending with context integration
 */
export const useEmailComposer = (initialData = {}) => {
  const { user } = useUser();
  const {
    composerOpen,
    composerData,
    openComposer,
    closeComposer,
    setComposerData,
    addNotification,
  } = useEmailContext();
  
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    html: '',
    text: '',
    templateId: null,
    clientId: null,
    relatedDocuments: [],
    isImportant: false,
    labels: [],
    ...initialData,
  });

  const [attachments, setAttachments] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [draftId, setDraftId] = useState(initialData.draftId || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save draft functionality
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);

  // Validation rules
  const validateEmail = useCallback(() => {
    const newErrors = {};

    // Validate recipient
    if (!emailData.to?.trim()) {
      newErrors.to = 'Recipient email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailData.to.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        newErrors.to = `Invalid email format: ${invalidEmails.join(', ')}`;
      }
    }

    // Validate CC if provided
    if (emailData.cc?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailData.cc.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        newErrors.cc = `Invalid CC email format: ${invalidEmails.join(', ')}`;
      }
    }

    // Validate BCC if provided
    if (emailData.bcc?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailData.bcc.split(',').map(email => email.trim());
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        newErrors.bcc = `Invalid BCC email format: ${invalidEmails.join(', ')}`;
      }
    }

    // Validate subject
    if (!emailData.subject?.trim()) {
      newErrors.subject = 'Subject is required';
    }

    // Validate content
    if (!emailData.html?.trim() && !emailData.text?.trim()) {
      newErrors.content = 'Email content is required';
    }

    // Validate attachments
    const totalAttachmentSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const config = emailAttachmentService.getConfig();
    
    if (totalAttachmentSize > config.maxTotalSize) {
      newErrors.attachments = `Total attachment size exceeds limit (${config.maxTotalSizeFormatted})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [emailData, attachments]);

  // Check if email is valid
  const isValid = Object.keys(errors).length === 0 && 
                  emailData.to?.trim() && 
                  emailData.subject?.trim() && 
                  (emailData.html?.trim() || emailData.text?.trim());

  // Auto-save draft when data changes
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Only auto-save if there's meaningful content
    if (emailData.to || emailData.subject || emailData.html || emailData.text) {
      const timeout = setTimeout(() => {
        saveDraft(emailData, true); // true = auto-save
      }, 3000); // Auto-save after 3 seconds of inactivity

      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [emailData, attachments]);

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && user?.id) {
      loadDraft(draftId);
    }
  }, [draftId, user?.id]);

  // Initialize with composer data from context
  useEffect(() => {
    if (composerData && composerOpen) {
      setEmailData(prev => ({
        ...prev,
        ...composerData,
      }));
    }
  }, [composerData, composerOpen]);

  /**
   * Load draft from storage
   */
  const loadDraft = async (id) => {
    try {
      setLoading(true);
      
      const result = await emailManagementService.getEmail(id, userId);
      
      if (result.success) {
        const draft = result.data;
        
        setEmailData({
          to: draft.recipients.to.map(r => r.email).join(', '),
          cc: draft.recipients.cc?.map(r => r.email).join(', ') || '',
          bcc: draft.recipients.bcc?.map(r => r.email).join(', ') || '',
          subject: draft.subject,
          html: draft.content.html || '',
          text: draft.content.text || '',
          templateId: draft.templateId || null,
          clientId: draft.clientId || null,
          relatedDocuments: draft.relatedDocuments || [],
          isImportant: draft.isImportant || false,
          labels: draft.labels || [],
        });

        // Load attachments
        if (draft.attachments && draft.attachments.length > 0) {
          setAttachments(draft.attachments);
        }

        setIsDraft(true);
        setLastSaved(new Date(draft.updatedAt || draft.createdAt));
        
        Logger.info('Draft loaded successfully', { draftId: id });
      }
    } catch (error) {
      Logger.error('Failed to load draft', { draftId: id, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save email as draft
   */
  const saveDraft = async (data = emailData, isAutoSave = false) => {
    try {
      if (!user?.id) return { success: false, error: 'User not authenticated' };

      // Don't save empty drafts
      if (!data.to && !data.subject && !data.html && !data.text) {
        return { success: true, message: 'Nothing to save' };
      }

      setLoading(!isAutoSave);

      // Prepare draft data
      const draftData = {
        messageId: draftId ? `draft_${draftId}` : `draft_${Date.now()}`,
        folderId: 'drafts',
        subject: data.subject || '(No Subject)',
        sender: {
          name: 'You',
          email: data.from || 'user@example.com', // Should come from user settings
        },
        recipients: {
          to: data.to ? data.to.split(',').map(email => ({ email: email.trim() })) : [],
          cc: data.cc ? data.cc.split(',').map(email => ({ email: email.trim() })) : [],
          bcc: data.bcc ? data.bcc.split(',').map(email => ({ email: email.trim() })) : [],
        },
        content: {
          text: data.text || '',
          html: data.html || '',
        },
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type,
        })),
        labels: data.labels || [],
        isRead: true,
        isStarred: false,
        isImportant: data.isImportant || false,
        receivedAt: new Date().toISOString(),
        clientId: data.clientId || null,
        relatedDocuments: data.relatedDocuments || [],
        isDraft: true,
        templateId: data.templateId || null,
      };

      let result;
      
      if (draftId) {
        // Update existing draft
        result = await emailManagementService.updateEmail?.(draftId, userId, draftData);
      } else {
        // Create new draft
        result = await emailManagementService.storeDraft?.(user.id, draftData);
      }

      // Fallback to generic email storage if draft-specific methods don't exist
      if (!result) {
        result = await emailManagementService.sendEmail(user.id, {
          ...draftData,
          isDraft: true,
        });
      }

      if (result.success) {
        if (!draftId) {
          setDraftId(result.data.id);
        }
        setIsDraft(true);
        setLastSaved(new Date());
        
        if (!isAutoSave) {
          Logger.info('Draft saved successfully', { draftId: draftId || result.data.id });
        }
      }

      return result;
    } catch (error) {
      Logger.error('Failed to save draft', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      if (!isAutoSave) {
        setLoading(false);
      }
    }
  };

  /**
   * Send email
   */
  const sendEmail = async (data = emailData) => {
    try {
      if (!user?.id) return { success: false, error: 'User not authenticated' };

      // Validate before sending
      if (!validateEmail()) {
        return { success: false, error: 'Please fix validation errors before sending' };
      }

      setLoading(true);

      // Prepare attachment data for sending
      let attachmentData = [];
      if (attachments.length > 0) {
        const attachmentResult = emailAttachmentService.prepareAttachmentsForEmail(
          attachments.map(att => att.id)
        );
        
        if (attachmentResult.success) {
          attachmentData = attachmentResult.data;
        } else {
          return { success: false, error: attachmentResult.error };
        }
      }

      // Prepare email data for sending
      const emailToSend = {
        to: data.to.trim(),
        cc: data.cc?.trim() || undefined,
        bcc: data.bcc?.trim() || undefined,
        subject: data.subject.trim(),
        html: data.html || undefined,
        text: data.text || data.html?.replace(/<[^>]*>/g, '') || '', // Strip HTML as fallback
        attachments: attachmentData,
        templateId: data.templateId || undefined,
        clientId: data.clientId || undefined,
        relatedDocuments: data.relatedDocuments || [],
        isImportant: data.isImportant || false,
        labels: data.labels || [],
      };

      const result = await emailManagementService.sendEmail(user.id, emailToSend);

      if (result.success) {
        // Clean up draft if it exists
        if (draftId) {
          await emailManagementService.deleteEmail(draftId, user.id, true);
        }

        // Clean up attachments
        attachments.forEach(att => {
          emailAttachmentService.deleteAttachment(att.id);
        });

        // Add success notification
        addNotification({
          id: `email_sent_${Date.now()}`,
          type: 'success',
          title: 'Email Sent',
          message: `Email sent to ${data.to}`,
          timestamp: new Date(),
          read: false,
        });

        // Close composer
        closeComposer();

        Logger.info('Email sent successfully', { 
          messageId: result.messageId,
          to: data.to,
          subject: data.subject,
        });
      } else {
        // Add error notification
        addNotification({
          id: `email_error_${Date.now()}`,
          type: 'error',
          title: 'Email Send Failed',
          message: result.error || 'Failed to send email',
          timestamp: new Date(),
          read: false,
        });
      }

      return result;
    } catch (error) {
      Logger.error('Failed to send email', { error: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset composer to initial state
   */
  const resetComposer = () => {
    setEmailData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      html: '',
      text: '',
      templateId: null,
      clientId: null,
      relatedDocuments: [],
      isImportant: false,
      labels: [],
    });
    setAttachments([]);
    setIsDraft(false);
    setDraftId(null);
    setErrors({});
    setLastSaved(null);
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    }

    // Update context
    setComposerData(null);
  };

  /**
   * Apply template to email
   */
  const applyTemplate = async (templateId, variables = {}) => {
    try {
      const result = await emailManagementService.applyTemplate(templateId, variables);
      
      if (result.success) {
        setEmailData(prev => ({
          ...prev,
          subject: result.data.subject || prev.subject,
          html: result.data.htmlContent || prev.html,
          text: result.data.textContent || prev.text,
          templateId,
        }));
        
        Logger.info('Template applied successfully', { templateId });
      }
      
      return result;
    } catch (error) {
      Logger.error('Failed to apply template', { templateId, error: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * Add recipient from contact/client
   */
  const addRecipient = (email, field = 'to') => {
    const currentValue = emailData[field] || '';
    const newValue = currentValue 
      ? `${currentValue}, ${email}`
      : email;
    
    setEmailData(prev => ({
      ...prev,
      [field]: newValue,
    }));
  };

  /**
   * Set email priority
   */
  const setPriority = (isImportant) => {
    setEmailData(prev => ({
      ...prev,
      isImportant,
    }));
  };

  /**
   * Add label to email
   */
  const addLabel = (label) => {
    setEmailData(prev => ({
      ...prev,
      labels: [...(prev.labels || []), label],
    }));
  };

  /**
   * Remove label from email
   */
  const removeLabel = (label) => {
    setEmailData(prev => ({
      ...prev,
      labels: (prev.labels || []).filter(l => l !== label),
    }));
  };

  return {
    // State
    emailData,
    setEmailData,
    attachments,
    setAttachments,
    isDraft,
    isValid,
    errors,
    loading,
    lastSaved,
    composerOpen,

    // Actions
    validateEmail,
    saveDraft,
    sendEmail,
    resetComposer,
    applyTemplate,
    addRecipient,
    setPriority,
    addLabel,
    removeLabel,
    loadDraft,
    openComposer,
    closeComposer,

    // Computed values
    hasUnsavedChanges: isDraft && lastSaved && (Date.now() - lastSaved.getTime() > 10000), // 10 seconds
    attachmentCount: attachments.length,
    totalAttachmentSize: attachments.reduce((sum, att) => sum + att.size, 0),
  };
};