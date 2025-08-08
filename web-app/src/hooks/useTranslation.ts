// Basic translation hook - placeholder implementation
import { useCallback } from 'react';

// Simple translation function that returns the key if no translation is found
const translations: Record<string, string> = {
  'scanner.sharing.errors.invalidShareToken': 'Invalid share token',
  'scanner.sharing.errors.accessDenied': 'Access denied',
  'scanner.sharing.errors.loadDocumentFailure': 'Failed to load document',
  'scanner.sharing.errors.downloadFailure': 'Failed to download document',
  'scanner.sharing.errors.loadSharesFailure': 'Failed to load shares',
  'scanner.sharing.errors.revokeFailure': 'Failed to revoke share',
  'scanner.sharing.loadingDocument': 'Loading document...',
  'scanner.sharing.accessDenied': 'Access Denied',
  'scanner.sharing.documentNotFound': 'Document not found',
  'scanner.sharing.accessLevel.view': 'View',
  'scanner.sharing.accessLevel.download': 'Download',
  'scanner.sharing.accessLevel.edit': 'Edit',
  'scanner.sharing.activeShares': 'Active Shares',
  'scanner.sharing.noShares.title': 'No shares yet',
  'scanner.sharing.noShares.description': 'This document has not been shared with anyone.',
  'scanner.sharing.sharedOn': 'Shared on {{date}}',
  'scanner.sharing.accessCount': '{{count}} accesses',
  'scanner.sharing.lastAccessed': 'Last accessed {{date}}',
  'scanner.sharing.expired': 'Expired {{date}}',
  'scanner.sharing.expires': 'Expires {{date}}',
  'scanner.sharing.copyLink': 'Copy link',
  'scanner.sharing.revokeAccess': 'Revoke access',
  'common.goHome': 'Go Home',
  'common.retry': 'Retry'
};

// Simple interpolation function
const interpolate = (template: string, values: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
};

export const useTranslation = () => {
  const t = useCallback((key: string, interpolationValues?: Record<string, any>): string => {
    const translation = translations[key] || key;
    
    if (interpolationValues) {
      return interpolate(translation, interpolationValues);
    }
    
    return translation;
  }, []);

  return { t };
};

export default useTranslation;
