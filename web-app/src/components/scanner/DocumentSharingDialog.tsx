import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  ShareIcon, 
  UserPlusIcon, 
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { documentSharingService } from '@/services/scanner';
import type { ProcessedDocument, AccessLevel } from '@/types/scanner';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentSharingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProcessedDocument;
  currentUserId: string;
}

interface ShareRecipient {
  email: string;
  accessLevel: AccessLevel;
  isValid: boolean;
}

const DocumentSharingDialog: React.FC<DocumentSharingDialogProps> = ({
  isOpen,
  onClose,
  document,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState<ShareRecipient[]>([
    { email: '', accessLevel: 'view' as AccessLevel, isValid: false }
  ]);
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [allowPublicLink, setAllowPublicLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{
    success: boolean;
    publicLink?: string;
    error?: string;
  } | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRecipients([{ email: '', accessLevel: 'view' as AccessLevel, isValid: false }]);
      setMessage('');
      setExpiresAt('');
      setAllowPublicLink(false);
      setShareResult(null);
    }
  }, [isOpen]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { email: '', accessLevel: 'view' as AccessLevel, isValid: false }
    ]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof ShareRecipient, value: any) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'email') {
      updated[index].isValid = validateEmail(value);
    }
    
    setRecipients(updated);
  };

  const getAccessLevelLabel = (level: AccessLevel): string => {
    switch (level) {
      case 'view':
        return t('scanner.sharing.accessLevel.view');
      case 'download':
        return t('scanner.sharing.accessLevel.download');
      case 'edit':
        return t('scanner.sharing.accessLevel.edit');
      default:
        return level;
    }
  };

  const getAccessLevelDescription = (level: AccessLevel): string => {
    switch (level) {
      case 'view':
        return t('scanner.sharing.accessLevel.viewDescription');
      case 'download':
        return t('scanner.sharing.accessLevel.downloadDescription');
      case 'edit':
        return t('scanner.sharing.accessLevel.editDescription');
      default:
        return '';
    }
  };

  const handleShare = async () => {
    const validRecipients = recipients.filter(r => r.email && r.isValid);
    
    if (validRecipients.length === 0) {
      setShareResult({
        success: false,
        error: t('scanner.sharing.errors.noValidRecipients')
      });
      return;
    }

    setIsSharing(true);
    setShareResult(null);

    try {
      const shareRequest = {
        documentId: document.id,
        sharedWith: validRecipients.map(r => ({
          email: r.email,
          accessLevel: r.accessLevel
        })),
        message: message || undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        allowPublicLink
      };

      const result = await documentSharingService.shareDocument(shareRequest, currentUserId);
      
      setShareResult(result);
      
      if (result.success) {
        // Auto-close after successful share
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setShareResult({
        success: false,
        error: t('scanner.sharing.errors.shareFailure')
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyPublicLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const canShare = recipients.some(r => r.email && r.isValid) && !isSharing;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <ShareIcon className="h-6 w-6 text-blue-600" />
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {t('scanner.sharing.title')}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Document Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">{document.title}</h3>
                  <p className="text-sm text-gray-600">
                    {t('scanner.sharing.documentInfo', {
                      category: document.category,
                      created: document.createdAt.toLocaleDateString()
                    })}
                  </p>
                </div>

                {/* Share Result */}
                {shareResult && (
                  <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                    shareResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {shareResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        shareResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {shareResult.success 
                          ? t('scanner.sharing.success.title')
                          : t('scanner.sharing.error.title')
                        }
                      </p>
                      <p className={`text-sm mt-1 ${
                        shareResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {shareResult.success 
                          ? t('scanner.sharing.success.message')
                          : shareResult.error
                        }
                      </p>
                      {shareResult.publicLink && (
                        <div className="mt-3 flex items-center space-x-2">
                          <input
                            type="text"
                            value={shareResult.publicLink}
                            readOnly
                            className="flex-1 text-sm bg-white border border-green-300 rounded px-3 py-1"
                          />
                          <button
                            onClick={() => copyPublicLink(shareResult.publicLink!)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title={t('scanner.sharing.copyLink')}
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recipients */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('scanner.sharing.recipients')}
                  </label>
                  <div className="space-y-3">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            placeholder={t('scanner.sharing.emailPlaceholder')}
                            value={recipient.email}
                            onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md text-sm ${
                              recipient.email && !recipient.isValid
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                          />
                          {recipient.email && !recipient.isValid && (
                            <p className="text-xs text-red-600 mt-1">
                              {t('scanner.sharing.errors.invalidEmail')}
                            </p>
                          )}
                        </div>
                        <select
                          value={recipient.accessLevel}
                          onChange={(e) => updateRecipient(index, 'accessLevel', e.target.value as AccessLevel)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="view">{getAccessLevelLabel('view' as AccessLevel)}</option>
                          <option value="download">{getAccessLevelLabel('download' as AccessLevel)}</option>
                          <option value="edit">{getAccessLevelLabel('edit' as AccessLevel)}</option>
                        </select>
                        {recipients.length > 1 && (
                          <button
                            onClick={() => removeRecipient(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addRecipient}
                    className="mt-3 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    <span>{t('scanner.sharing.addRecipient')}</span>
                  </button>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('scanner.sharing.message')} ({t('common.optional')})
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('scanner.sharing.messagePlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Options */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowPublicLink"
                      checked={allowPublicLink}
                      onChange={(e) => setAllowPublicLink(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowPublicLink" className="text-sm text-gray-700">
                      {t('scanner.sharing.allowPublicLink')}
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.sharing.expiresAt')} ({t('common.optional')})
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!canShare}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                      canShare
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSharing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('scanner.sharing.sharing')}</span>
                      </div>
                    ) : (
                      t('scanner.sharing.share')
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DocumentSharingDialog;
