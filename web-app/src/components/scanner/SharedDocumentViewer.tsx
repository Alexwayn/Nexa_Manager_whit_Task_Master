import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentIcon, 
  EyeIcon, 
  ArrowDownTrayIcon, 
  PencilIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { DocumentSharingService } from '@/services/scanner';
import type { ProcessedDocument, AccessLevel } from '@/types/scanner';
import { useTranslation } from '@/hooks/useTranslation';
import DocumentPreview from './DocumentPreview';

interface SharedDocumentViewerProps {
  shareToken?: string; // Can be passed as prop or from URL params
}

const documentSharingService = new DocumentSharingService();

const SharedDocumentViewer: React.FC<SharedDocumentViewerProps> = ({ shareToken: propShareToken }) => {
  const { t } = useTranslation();
  const { shareToken: urlShareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  
  const shareToken = propShareToken || urlShareToken;
  
  const [document, setDocument] = useState<ProcessedDocument | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('view' as AccessLevel);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (shareToken) {
      loadSharedDocument();
    } else {
      setError(t('scanner.sharing.errors.invalidShareToken'));
      setIsLoading(false);
    }
  }, [shareToken]);

  const loadSharedDocument = async () => {
    if (!shareToken) return;

    setIsLoading(true);
    setError(null);

    try {
      // Track the view access
      const result = await documentSharingService.accessSharedDocument(
        shareToken,
        'view',
        {
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent
        }
      );

      if (result.success && result.document) {
        setDocument(result.document);
        // Extract access level from the share (would need to modify service to return this)
        setAccessLevel('view' as AccessLevel); // Default for now
      } else {
        setError(result.error || t('scanner.sharing.errors.accessDenied'));
      }
    } catch (error) {
      setError(t('scanner.sharing.errors.loadDocumentFailure'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!shareToken || !document || !canDownload()) return;

    setIsDownloading(true);

    try {
      // Track the download access
      const result = await documentSharingService.accessSharedDocument(
        shareToken,
        'download',
        {
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent
        }
      );

      if (result.success) {
        // Trigger download of the enhanced file
        const link = window.document.createElement('a');
        link.href = document.enhancedFile.url;
        link.download = `${document.title}.${getFileExtension(document.enhancedFile.url)}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        setError(result.error || t('scanner.sharing.errors.downloadFailure'));
      }
    } catch (error) {
      setError(t('scanner.sharing.errors.downloadFailure'));
    } finally {
      setIsDownloading(false);
    }
  };

  const getClientIP = async (): Promise<string | undefined> => {
    try {
      // This would typically use a service to get the client IP
      // For now, return undefined
      return undefined;
    } catch {
      return undefined;
    }
  };

  const getFileExtension = (url: string): string => {
    const parts = url.split('.');
    return parts[parts.length - 1] || 'jpg';
  };

  const canDownload = (): boolean => {
    return accessLevel === 'download' || accessLevel === 'edit';
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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('scanner.sharing.loadingDocument')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <ShieldExclamationIcon className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              {t('scanner.sharing.accessDenied')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('common.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-600" />
          <p className="mt-4 text-gray-600">{t('scanner.sharing.documentNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <DocumentIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-medium text-gray-900">{document.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{t('scanner.sharing.sharedDocument')}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {getAccessLevelIcon(accessLevel)}
                    <span>{getAccessLevelLabel(accessLevel)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {canDownload() && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  )}
                  {t('common.download')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.category')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.created')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(document.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.fileSize')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(document.enhancedFile.size / 1024 / 1024).toFixed(2)} MB
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.ocrConfidence')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{Math.round(document.ocrConfidence * 100)}%</dd>
            </div>
          </div>

          {document.description && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.description')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.description}</dd>
            </div>
          )}

          {document.tags.length > 0 && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">{t('scanner.document.tags')}</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}
        </div>

        {/* Document Preview */}
        <div className="bg-white rounded-lg shadow-sm">
          <DocumentPreview
            document={document}
            onEdit={() => {}}
            onSave={() => {}}
            onCancel={() => {}}
            showOCRResults={true}
          />
        </div>

        {/* OCR Text Content */}
        {document.textContent && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('scanner.document.extractedText')}
            </h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-md">
                {document.textContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDocumentViewer;
