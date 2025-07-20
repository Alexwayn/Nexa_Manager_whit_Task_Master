import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  ShareIcon, 
  LinkIcon, 
  UserPlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ShareDocumentsModal = ({ isOpen, onClose, documents = [], onShare }) => {
  const { t } = useTranslation('documents');
  const [shareType, setShareType] = useState('link'); // 'link' or 'email'
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState('view'); // 'view', 'edit', 'download'
  const [expiration, setExpiration] = useState('30'); // days
  const [requireAuth, setRequireAuth] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setEmails('');
      setMessage('');
      setPermissions('view');
      setExpiration('30');
      setRequireAuth(false);
      setShareLink('');
      setError('');
      setCopied(false);
    }
  }, [isOpen]);

  const validateEmails = (emailString) => {
    const emailList = emailString.split(',').map(email => email.trim()).filter(email => email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    return {
      valid: invalidEmails.length === 0,
      emails: emailList,
      invalidEmails
    };
  };

  const generateShareLink = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Simulate API call to generate share link
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const linkId = Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}/shared/${linkId}`;
      
      setShareLink(generatedLink);
    } catch (error) {
      console.error('Error generating share link:', error);
      setError(t('share.errors.linkGeneration', 'Failed to generate share link'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleShare = async () => {
    setError('');

    if (shareType === 'email') {
      const emailValidation = validateEmails(emails);
      
      if (!emailValidation.valid) {
        setError(t('share.errors.invalidEmails', `Invalid emails: ${emailValidation.invalidEmails.join(', ')}`));
        return;
      }

      if (emailValidation.emails.length === 0) {
        setError(t('share.errors.noEmails', 'Please enter at least one email address'));
        return;
      }
    }

    try {
      const shareData = {
        documents: documents.map(doc => doc.id),
        type: shareType,
        permissions,
        expiration: parseInt(expiration),
        requireAuth,
        ...(shareType === 'email' && {
          emails: validateEmails(emails).emails,
          message: message.trim()
        }),
        ...(shareType === 'link' && {
          shareLink
        })
      };

      await onShare(shareData);
      onClose();
    } catch (error) {
      console.error('Error sharing documents:', error);
      setError(error.message || t('share.errors.shareFailed', 'Failed to share documents'));
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'view':
        return <EyeIcon className="h-5 w-5" />;
      case 'edit':
        return <PencilIcon className="h-5 w-5" />;
      case 'download':
        return <TrashIcon className="h-5 w-5" />;
      default:
        return <EyeIcon className="h-5 w-5" />;
    }
  };

  const canShare = () => {
    if (shareType === 'link') {
      return shareLink.length > 0;
    } else {
      return emails.trim().length > 0;
    }
  };

  if (!isOpen) return null;

  const documentNames = documents.map(doc => doc.name).join(', ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ShareIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {t('share.title', 'Share Documents')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {documents.length === 1 ? 
                      documentNames : 
                      t('share.multipleDocuments', `${documents.length} documents selected`)
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Share Type Selection */}
            <div className="mt-6">
              <label className="text-base font-medium text-gray-900">
                {t('share.method', 'Share Method')}
              </label>
              <fieldset className="mt-4">
                <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                  <div className="flex items-center">
                    <input
                      id="share-link"
                      name="share-method"
                      type="radio"
                      value="link"
                      checked={shareType === 'link'}
                      onChange={(e) => setShareType(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="share-link" className="ml-3 block text-sm font-medium text-gray-700">
                      <div className="flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        {t('share.methods.link', 'Shareable Link')}
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="share-email"
                      name="share-method"
                      type="radio"
                      value="email"
                      checked={shareType === 'email'}
                      onChange={(e) => setShareType(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="share-email" className="ml-3 block text-sm font-medium text-gray-700">
                      <div className="flex items-center">
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        {t('share.methods.email', 'Email Invite')}
                      </div>
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Link Generation */}
            {shareType === 'link' && (
              <div className="mt-6 space-y-4">
                {!shareLink ? (
                  <button
                    type="button"
                    onClick={generateShareLink}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('share.generating', 'Generating...')}
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        {t('share.generateLink', 'Generate Share Link')}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('share.shareLink', 'Share Link')}
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {copied ? (
                          <CheckIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Sharing */}
            {shareType === 'email' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="emails" className="block text-sm font-medium text-gray-700">
                    {t('share.emailAddresses', 'Email Addresses')} *
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="emails"
                      name="emails"
                      rows={3}
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={t('share.emailPlaceholder', 'Enter email addresses separated by commas')}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('share.emailHint', 'Separate multiple email addresses with commas')}
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    {t('share.message', 'Message')}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={t('share.messagePlaceholder', 'Optional message to include with the invitation')}
                      maxLength={500}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {message.length}/500 {t('common.characters', 'characters')}
                  </p>
                </div>
              </div>
            )}

            {/* Permissions & Settings */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('share.permissions', 'Permissions')}
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'view', label: t('share.permissions.view', 'View Only'), desc: t('share.permissions.viewDesc', 'Can view documents') },
                    { value: 'download', label: t('share.permissions.download', 'View & Download'), desc: t('share.permissions.downloadDesc', 'Can view and download documents') },
                    { value: 'edit', label: t('share.permissions.edit', 'Edit'), desc: t('share.permissions.editDesc', 'Can view, download, and edit documents') }
                  ].map((permission) => (
                    <div key={permission.value} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`permission-${permission.value}`}
                          name="permissions"
                          type="radio"
                          value={permission.value}
                          checked={permissions === permission.value}
                          onChange={(e) => setPermissions(e.target.value)}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`permission-${permission.value}`} className="font-medium text-gray-700 flex items-center">
                          {getPermissionIcon(permission.value)}
                          <span className="ml-2">{permission.label}</span>
                        </label>
                        <p className="text-gray-500">{permission.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label htmlFor="expiration" className="block text-sm font-medium text-gray-700">
                  {t('share.expiration', 'Link Expiration')}
                </label>
                <div className="mt-1">
                  <select
                    id="expiration"
                    name="expiration"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="1">{t('share.expiration.1day', '1 Day')}</option>
                    <option value="7">{t('share.expiration.1week', '1 Week')}</option>
                    <option value="30">{t('share.expiration.1month', '1 Month')}</option>
                    <option value="90">{t('share.expiration.3months', '3 Months')}</option>
                    <option value="365">{t('share.expiration.1year', '1 Year')}</option>
                    <option value="0">{t('share.expiration.never', 'Never')}</option>
                  </select>
                </div>
              </div>

              {/* Require Authentication */}
              <div className="flex items-center">
                <input
                  id="require-auth"
                  name="require-auth"
                  type="checkbox"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="require-auth" className="ml-2 block text-sm text-gray-700">
                  {t('share.requireAuth', 'Require authentication to access')}
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleShare}
              disabled={!canShare()}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              {shareType === 'link' ? 
                t('share.shareLink', 'Share Link') : 
                t('share.sendInvites', 'Send Invites')
              }
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentsModal; 