import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  PaperClipIcon,
  BookmarkIcon,
  EyeIcon,
  ChevronDownIcon,
  UserIcon,
  AtSymbolIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import EmailAttachmentManager from './EmailAttachmentManager';
import EmailTemplateSelector from './EmailTemplateSelector';
import EmailRecipientInput from './EmailRecipientInput';
import { useEmailComposer } from '@features/email';
import { useTranslation } from 'react-i18next';

const EmailComposer = ({
  isOpen = false,
  onClose,
  initialData = {},
  onSend,
  onSaveDraft,
  mode = 'compose', // 'compose', 'reply', 'forward'
}) => {
  const { t } = useTranslation('email');
  const {
    emailData,
    setEmailData,
    attachments,
    setAttachments,
    isDraft,
    isValid,
    errors,
    validateEmail,
    saveDraft,
    sendEmail,
    loading,
  } = useEmailComposer(initialData);

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [editorMode, setEditorMode] = useState('rich'); // 'rich' or 'plain'
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  const editorRef = useRef(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && emailData.html) {
      editorRef.current.innerHTML = emailData.html;
    }
  }, [emailData.html]);

  // Focus on recipient field when opened
  useEffect(() => {
    if (isOpen) {
      // Focus will be handled by the EmailRecipientInput component
      setTimeout(() => {
        const recipientInput = document.querySelector('[placeholder="Enter recipient email addresses"]');
        if (recipientInput) {
          recipientInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || editorRef.current.innerText;
      
      setEmailData(prev => ({
        ...prev,
        html,
        text,
      }));
    }
  };

  const handleEditorKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        case 'enter':
          if (e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
          break;
        case 's':
          e.preventDefault();
          handleSaveDraft();
          break;
        default:
          break;
      }
    }
  };

  const handleTemplateSelect = (template) => {
    setEmailData(prev => ({
      ...prev,
      subject: template.subject || prev.subject,
      html: template.html_content || template.html || prev.html,
      text: template.text_content || template.text || prev.text,
      templateId: template.id,
    }));
    
    setShowTemplateSelector(false);
    
    // Update editor content
    if (editorRef.current) {
      editorRef.current.innerHTML = template.html_content || template.html || '';
    }
  };

  const handleSend = async () => {
    if (!validateEmail()) return;

    // Show confirmation for emails with multiple recipients or attachments
    const recipientCount = (emailData.to || '').split(',').filter(email => email.trim()).length +
                          (emailData.cc || '').split(',').filter(email => email.trim()).length +
                          (emailData.bcc || '').split(',').filter(email => email.trim()).length;
    
    if (recipientCount > 3 || attachments.length > 0) {
      setShowSendConfirmation(true);
      return;
    }

    await performSend();
  };

  const performSend = async () => {
    try {
      const result = await sendEmail({
        ...emailData,
        attachments: attachments.map(att => att.id),
      });

      if (result.success) {
        onSend?.(result.data);
        onClose();
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const result = await saveDraft({
        ...emailData,
        attachments: attachments.map(att => att.id),
      });

      if (result.success) {
        onSaveDraft?.(result.data);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const formatToolbar = () => (
    <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => document.execCommand('bold')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Bold (Ctrl+B)"
        >
          <strong className="text-sm font-bold">B</strong>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('italic')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Italic (Ctrl+I)"
        >
          <em className="text-sm">I</em>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('underline')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Underline (Ctrl+U)"
        >
          <u className="text-sm">U</u>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('strikeThrough')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Strikethrough"
        >
          <s className="text-sm">S</s>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Lists */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => document.execCommand('insertUnorderedList')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <span className="text-sm">•</span>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('insertOrderedList')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <span className="text-sm">1.</span>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Alignment */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => document.execCommand('justifyLeft')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Align Left"
        >
          <span className="text-xs">⬅</span>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyCenter')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Align Center"
        >
          <span className="text-xs">⬌</span>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyRight')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
          title="Align Right"
        >
          <span className="text-xs">➡</span>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Links */}
      <button
        type="button"
        onClick={() => {
          const url = prompt('Enter URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
        }}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
        title="Insert Link"
      >
        <span className="text-xs">🔗</span>
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Font Size */}
      <select
        onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1"
        title="Font Size"
        defaultValue="3"
      >
        <option value="1">Small</option>
        <option value="3">Normal</option>
        <option value="5">Large</option>
        <option value="7">Extra Large</option>
      </select>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Editor Mode Toggle */}
      <button
        type="button"
        onClick={() => setEditorMode(editorMode === 'rich' ? 'plain' : 'rich')}
        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded border border-gray-300"
        title="Toggle Editor Mode"
      >
        {editorMode === 'rich' ? 'Plain Text' : 'Rich Text'}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PaperAirplaneIcon className="h-5 w-5 mr-2" />
              {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'Compose Email'}
              {isDraft && <span className="ml-2 text-sm text-orange-600">(Draft)</span>}
            </h2>
            {loading && (
              <div className="ml-3 flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Saving...
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Use Template"
            >
              <DocumentTextIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Preview"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Email Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Recipients */}
            <div className="space-y-3">
              {/* To Field */}
              <div className="flex items-start">
                <label className="w-12 text-sm font-medium text-gray-700 mt-3">To:</label>
                <div className="flex-1 relative">
                  <EmailRecipientInput
                    value={emailData.to || ''}
                    onChange={(value) => handleInputChange('to', value)}
                    placeholder="Enter recipient email addresses"
                    error={errors.to}
                    disabled={loading}
                    allowMultiple={true}
                    showSuggestions={true}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-10">
                    <button
                      type="button"
                      onClick={() => setShowCc(!showCc)}
                      className="text-xs text-blue-600 hover:text-blue-800 bg-white px-1 py-0.5 rounded border"
                    >
                      Cc
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBcc(!showBcc)}
                      className="text-xs text-blue-600 hover:text-blue-800 bg-white px-1 py-0.5 rounded border"
                    >
                      Bcc
                    </button>
                  </div>
                </div>
              </div>

              {/* CC Field */}
              {showCc && (
                <div className="flex items-start">
                  <label className="w-12 text-sm font-medium text-gray-700 mt-3">Cc:</label>
                  <div className="flex-1">
                    <EmailRecipientInput
                      value={emailData.cc || ''}
                      onChange={(value) => handleInputChange('cc', value)}
                      placeholder="Enter CC email addresses"
                      error={errors.cc}
                      disabled={loading}
                      allowMultiple={true}
                      showSuggestions={true}
                    />
                  </div>
                </div>
              )}

              {/* BCC Field */}
              {showBcc && (
                <div className="flex items-start">
                  <label className="w-12 text-sm font-medium text-gray-700 mt-3">Bcc:</label>
                  <div className="flex-1">
                    <EmailRecipientInput
                      value={emailData.bcc || ''}
                      onChange={(value) => handleInputChange('bcc', value)}
                      placeholder="Enter BCC email addresses"
                      error={errors.bcc}
                      disabled={loading}
                      allowMultiple={true}
                      showSuggestions={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <div className="flex items-center">
                <label className="w-12 text-sm font-medium text-gray-700">Subject:</label>
                <input
                  type="text"
                  value={emailData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Email subject"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength={200}
                />
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">
                  {(emailData.subject || '').length}/200 characters
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {editorMode === 'rich' && formatToolbar()}
                
                {/* Keyboard Shortcuts Help */}
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
                  <strong>Keyboard shortcuts:</strong> Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+K (Link), Ctrl+S (Save Draft), Ctrl+Shift+Enter (Send)
                </div>
                
                {editorMode === 'rich' ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    onKeyDown={handleEditorKeyDown}
                    className="min-h-[300px] p-4 focus:outline-none prose max-w-none"
                    style={{ minHeight: '300px' }}
                    suppressContentEditableWarning={true}
                    placeholder="Write your email..."
                  />
                ) : (
                  <textarea
                    value={emailData.text || ''}
                    onChange={(e) => handleInputChange('text', e.target.value)}
                    onKeyDown={handleEditorKeyDown}
                    className="w-full min-h-[300px] p-4 border-none focus:outline-none resize-none"
                    placeholder="Write your email..."
                  />
                )}
              </div>
              
              {/* Word Count */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {editorMode === 'rich' 
                    ? `${(emailData.text || '').split(/\s+/).filter(word => word.length > 0).length} words`
                    : `${(emailData.text || '').split(/\s+/).filter(word => word.length > 0).length} words`
                  }
                </span>
                <span>
                  {editorMode === 'rich' 
                    ? `${(emailData.text || '').length} characters`
                    : `${(emailData.text || '').length} characters`
                  }
                </span>
              </div>
            </div>

            {/* Attachments */}
            <EmailAttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              disabled={loading}
            />

            {/* Validation Errors */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          <span><strong className="capitalize">{field}:</strong> {error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setErrors({})}
                    className="text-red-400 hover:text-red-600 ml-2"
                    title="Dismiss errors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Save Draft
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !isValid}
              className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              )}
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <EmailTemplateSelector
              onSelectTemplate={handleTemplateSelect}
              onClose={() => setShowTemplateSelector(false)}
              showPreview={true}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <strong>To:</strong> {emailData.to}
                  {emailData.cc && <><br /><strong>Cc:</strong> {emailData.cc}</>}
                  {emailData.bcc && <><br /><strong>Bcc:</strong> {emailData.bcc}</>}
                </div>
                <div><strong>Subject:</strong> {emailData.subject}</div>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {editorMode === 'rich' ? (
                    <div dangerouslySetInnerHTML={{ __html: emailData.html }} />
                  ) : (
                    <pre className="whitespace-pre-wrap">{emailData.text}</pre>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div>
                    <strong>Attachments:</strong>
                    <ul className="mt-2 space-y-1">
                      {attachments.map(att => (
                        <li key={att.id} className="text-sm text-gray-600">
                          📎 {att.name} ({(att.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>You are about to send this email to:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div><strong>To:</strong> {emailData.to}</div>
                  {emailData.cc && <div><strong>Cc:</strong> {emailData.cc}</div>}
                  {emailData.bcc && <div><strong>Bcc:</strong> {emailData.bcc}</div>}
                </div>
                
                {attachments.length > 0 && (
                  <div>
                    <p><strong>With {attachments.length} attachment(s):</strong></p>
                    <ul className="mt-1 space-y-1">
                      {attachments.map(att => (
                        <li key={att.id} className="text-xs text-gray-500">
                          • {att.name} ({(att.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-orange-600">
                  <strong>Note:</strong> This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSendConfirmation(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSendConfirmation(false);
                    performSend();
                  }}
                  className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailComposer;
