// Type declarations for documentSharingService
import type { DocumentShare, ProcessedDocument, AccessLogEntry } from '@/types/scanner';

export interface ShareDocumentRequest {
  documentId: string;
  sharedWith: {
    email: string;
    accessLevel: 'view' | 'download' | 'edit';
  }[];
  message?: string;
  expiresAt?: Date;
  allowPublicLink?: boolean;
}

export interface ShareDocumentResponse {
  success: boolean;
  shareId?: string;
  publicLink?: string;
  error?: string;
}

export interface AccessTrackingData {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export declare class DocumentSharingService {
  shareDocument(request: ShareDocumentRequest, sharedBy: string): Promise<ShareDocumentResponse>;
  revokeDocumentShare(shareId: string, userId: string): Promise<{ success: boolean; error?: string }>;
  accessSharedDocument(
    shareToken: string, 
    action: 'view' | 'download' | 'edit',
    accessData?: Partial<AccessTrackingData>
  ): Promise<{ success: boolean; document?: ProcessedDocument; error?: string }>;
  getDocumentShares(documentId: string, userId: string): Promise<{
    success: boolean;
    shares?: DocumentShare[];
    error?: string;
  }>;
  getDocumentAccessHistory(documentId: string, userId: string): Promise<{
    success: boolean;
    accessHistory?: AccessLogEntry[];
    error?: string;
  }>;
}

declare const documentSharingService: DocumentSharingService;
export default documentSharingService;