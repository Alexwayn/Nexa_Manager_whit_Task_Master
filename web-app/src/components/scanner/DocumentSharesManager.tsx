import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  PencilIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { documentSharingService } from '@/services/scanner';
import type { DocumentShare, ProcessedDocument, AccessLevel } from '@/types/scanner';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentSharesManagerProps {
  document: ProcessedDocument;
  currentUserId: string;
  onSharesUpdated?: () => void;
}

const DocumentSharesManager: React.FC<DocumentSharesManagerProps> = ({
  document,
  currentUserId,
  onSharesUpdated
}) => {
  const { t } = useTranslation();
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingShareId, setRevokingShareId] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [document.id]);

  const loadShares = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await documentSharingService.getDocumentShares(document.id, currentUserId);
      
      if (result.success && result.shares) {
        setShares(result.shares);
      } else {
        setError(result.error || t('scanner.sharing.errors.loadSharesFailure'));
      }
    } catch (error) {
      setError(t('scanner.sharing.errors.loadSharesFailure'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    setRevokingShareId(shareId);

    try {
      const result = await documentSharingService.revokeDocumentShare(shareId, currentUserId);
      
      if (result.success) {
        // Remove the revoked share from the list
        setShares(shares.filter(share => share.id !== shareId));
        onSharesUpdated?.();
      } else {
        setError(result.error || t('scanner.sharing.errors.revokeFailure'));
      }
    } catch (error) {
      setError(t('scanner.sharing.errors.revokeFailure'));
    } finally {
      setRevokingShareId(null);
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

  const getAccessLevelIcon = (level: AccessLevel) => {
    switch (level) {
      case 'view':
        return <EyeIcon className="h-4 w-4" />;
      case 'download':
        return <ArrowDownTrayIcon className="h-4 w-4" />;
      case 'edit':
        return <PencilIcon className="h-4 w-4" />;
      default:
        return <EyeIcon className="h-4 w-4" />;
    }
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

  const getAccessLevelColor = (level: AccessLevel): string => {
    switch (level) {
      case 'view':
        return 'text-blue-600 bg-blue-50';
      case 'download':
        return 'text-green-600 bg-green-50';
      case 'edit':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isExpired = (share: DocumentShare): boolean => {
    return share.expiresAt ? new Date(share.expiresAt) < new Date() : false;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <button
          onClick={loadShares}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-8">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {t('scanner.sharing.noShares.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('scanner.sharing.noShares.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t('scanner.sharing.activeShares')} ({shares.length})
        </h3>
      </div>

      <div className="space-y-3">
        {shares.map((share) => (
          <div
            key={share.id}
            className={`p-4 border rounded-lg ${
              isExpired(share) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getAccessLevelColor(share.accessLevel)
                    }`}>
                      {getAccessLevelIcon(share.accessLevel)}
                      <span className="ml-1">{getAccessLevelLabel(share.accessLevel)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {share.sharedWith}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('scanner.sharing.sharedOn', { date: formatDate(share.createdAt) })}
                    </p>
                  </div>
                </div>

                {/* Share details */}
                <div className="mt-3 space-y-2">
                  {share.message && (
                    <p className="text-sm text-gray-600 italic">
                      "{share.message}"
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      {t('scanner.sharing.accessCount', { count: share.accessCount || 0 })}
                    </span>
                    {share.lastAccessedAt && (
                      <span>
                        {t('scanner.sharing.lastAccessed', { 
                          date: formatDate(share.lastAccessedAt) 
                        })}
                      </span>
                    )}
                    {share.expiresAt && (
                      <div className={`flex items-center space-x-1 ${
                        isExpired(share) ? 'text-red-600' : ''
                      }`}>
                        <CalendarIcon className="h-3 w-3" />
                        <span>
                          {isExpired(share) 
                            ? t('scanner.sharing.expired', { date: formatDate(share.expiresAt) })
                            : t('scanner.sharing.expires', { date: formatDate(share.expiresAt) })
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Public link */}
                  {share.publicLink && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="text"
                        value={share.publicLink}
                        readOnly
                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                      />
                      <button
                        onClick={() => copyPublicLink(share.publicLink!)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={t('scanner.sharing.copyLink')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => handleRevokeShare(share.id)}
                  disabled={revokingShareId === share.id}
                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  title={t('scanner.sharing.revokeAccess')}
                >
                  {revokingShareId === share.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentSharesManager;