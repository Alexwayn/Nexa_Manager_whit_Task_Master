import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ShareIcon,
  LinkIcon,
  LockClosedIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import Logger from '@utils/Logger';

// Import qrcode library
import QRCode from 'qrcode';

// Removed unused documentService import

/**
 * DocumentSharing Component
 * Provides secure document sharing with access control and analytics
 */
const DocumentSharing = ({
  document,
  documentType = 'quote', // 'quote', 'invoice', 'report'
  isOpen,
  onClose,
  onShare,
}) => {
  const { t } = useTranslation('documents');
  const [shareSettings, setShareSettings] = useState({
    accessType: 'link', // 'link', 'password', 'email'
    expiresAt: '',
    password: '',
    allowDownload: true,
    allowPrint: true,
    trackViews: true,
    notifyOnAccess: false,
    recipientEmail: '',
  });

  const [shareLink, setShareLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewStats, setViewStats] = useState({
    views: 0,
    downloads: 0,
    lastAccessed: null,
  });

  // Generate sharing link
  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate secure sharing link
      const shareToken = generateSecureToken();
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/shared/${documentType}/${shareToken}`;

      setShareLink(link);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrCode);

      // Save sharing configuration
      await saveShareConfiguration(shareToken, shareSettings);
    } catch (error) {
      Logger.error('Error generating share link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Logger.error('Failed to copy:', error);
    }
  };

  // Send link via email
  const sendViaEmail = async () => {
    if (!shareSettings.recipientEmail) return;

    try {
      const emailData = {
        to: shareSettings.recipientEmail,
        subject: `${t('sharing.emailSubject')}${document.title || document.number}`,
        body: generateEmailBody(),
        attachLink: shareLink,
      };

      // Call email service
      await sendShareEmail(emailData);
      onShare?.('email', shareSettings.recipientEmail);
    } catch (error) {
      Logger.error('Error sending email:', error);
    }
  };

  // Generate email body
  const generateEmailBody = () => {
    const docTypeName =
      documentType === 'quote'
        ? t('sharing.quote')
        : documentType === 'invoice'
          ? t('sharing.invoice')
          : t('sharing.document');

    const expirationText = shareSettings.expiresAt
      ? t('sharing.emailBodyExpiration', {
          date: new Date(shareSettings.expiresAt).toLocaleDateString(),
        })
      : '';

    return `
      ${t('sharing.emailBodyDearUser')}

      ${t('sharing.emailBodyShared', { docType: docTypeName.toLowerCase(), docName: document.title || document.number })}

      ${t('sharing.emailBodyViewLink')}
      ${shareLink}

      ${expirationText}

      ${t('sharing.emailBodyRegards')}
    `;
  };

  // Revoke access
  const revokeAccess = async () => {
    try {
      // API call to revoke access
      setShareLink('');
      setQrCodeUrl('');
    } catch (error) {
      Logger.error('Error revoking access:', error);
    }
  };

  // Generate secure token
  const generateSecureToken = () => {
    return [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
  };

  // Save share configuration (simulated)
  const saveShareConfiguration = async (token, settings) => {
    const config = {
      token,
      documentId: document.id,
      documentType,
      settings,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user-id', // Get from auth context
    };

    // Save to localStorage for demo (in real app, save to backend)
    const existingShares = JSON.parse(localStorage.getItem('document-shares') || '[]');
    existingShares.push(config);
    localStorage.setItem('document-shares', JSON.stringify(existingShares));
  };

  // Send share email (simulated)
  const sendShareEmail = async (emailData) => {
    // In real app, call email service
    Logger.info('Sending share email:', emailData);
    return Promise.resolve();
  };

  // Auto-generate link when modal opens and load view stats
  useEffect(() => {
    if (isOpen && document) {
      generateShareLink();
      // Mock loading view stats
      setViewStats({
        views: Math.floor(Math.random() * 50),
        downloads: Math.floor(Math.random() * 20),
        lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }, [isOpen, document, generateShareLink]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <ShareIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('sharing.title')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {document?.title || document?.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              {t('sharing.settingsTitle')}
            </h4>

            {/* Access Type */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShareSettings((prev) => ({ ...prev, accessType: 'link' }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  shareSettings.accessType === 'link'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <LinkIcon className="h-5 w-5 mx-auto mb-2" />
                <span className="text-sm">{t('sharing.publicLink')}</span>
              </button>
              <button
                onClick={() => setShareSettings((prev) => ({ ...prev, accessType: 'password' }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  shareSettings.accessType === 'password'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <LockClosedIcon className="h-5 w-5 mx-auto mb-2" />
                <span className="text-sm">{t('sharing.withPassword')}</span>
              </button>
              <button
                onClick={() => setShareSettings((prev) => ({ ...prev, accessType: 'email' }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  shareSettings.accessType === 'email'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 mx-auto mb-2" />
                <span className="text-sm">{t('sharing.onlyByEmail')}</span>
              </button>
            </div>

            {shareSettings.accessType === 'password' && (
              <input
                type="password"
                value={shareSettings.password}
                onChange={(e) =>
                  setShareSettings((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={t('sharing.passwordDescription')}
                className="w-full mt-2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            )}
            {shareSettings.accessType === 'email' && (
              <input
                type="email"
                value={shareSettings.recipientEmail}
                onChange={(e) =>
                  setShareSettings((prev) => ({ ...prev, recipientEmail: e.target.value }))
                }
                placeholder={t('sharing.emailDescription')}
                className="w-full mt-2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            )}

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data di scadenza (opzionale)
              </label>
              <input
                type="datetime-local"
                value={shareSettings.expiresAt}
                onChange={(e) =>
                  setShareSettings((prev) => ({ ...prev, expiresAt: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Opzioni avanzate
              <ChevronDownIcon
                className={`ml-1 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareSettings.allowDownload}
                    onChange={(e) =>
                      setShareSettings((prev) => ({ ...prev, allowDownload: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Consenti download
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareSettings.allowPrint}
                    onChange={(e) =>
                      setShareSettings((prev) => ({ ...prev, allowPrint: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Consenti stampa
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareSettings.trackViews}
                    onChange={(e) =>
                      setShareSettings((prev) => ({ ...prev, trackViews: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Traccia visualizzazioni
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareSettings.notifyOnAccess}
                    onChange={(e) =>
                      setShareSettings((prev) => ({ ...prev, notifyOnAccess: e.target.checked }))
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notifica accessi
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Generate Link Button */}
          {!shareLink && (
            <button
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              {isGenerating ? 'Generazione...' : 'Genera Link di Condivisione'}
            </button>
          )}

          {/* Generated Link */}
          {shareLink && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Link generato con successo!
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    {copied ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                    <p className="text-xs text-center text-gray-500 mt-2">Scansiona per aprire</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {shareSettings.accessType === 'email' && shareSettings.recipientEmail && (
                  <button
                    onClick={sendViaEmail}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Invia via Email
                  </button>
                )}
                <button
                  onClick={revokeAccess}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Revoca Accesso
                </button>
              </div>

              {/* View Statistics */}
              {shareSettings.trackViews && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Statistiche di accesso
                  </h5>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {viewStats.views}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Visualizzazioni
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {viewStats.downloads}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Download</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {viewStats.lastAccessed
                          ? viewStats.lastAccessed.toLocaleDateString('it-IT')
                          : 'Mai'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Ultimo accesso</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for Chevron Down icon
const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export default DocumentSharing;
