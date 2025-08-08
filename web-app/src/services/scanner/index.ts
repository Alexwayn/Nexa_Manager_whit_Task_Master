// Re-export all scanner services from features directory
// This maintains compatibility with existing imports from @/services/scanner

// Core OCR Services
export {
  AIOCRService,
  OCRProviderFactory,
  FallbackOCRService
} from '@/features/scanner/services';

// Document Services
export {
  DocumentStorageService,
  DocumentTaggingService,
  DocumentSearchService,
  DocumentSharingService,
  documentSharingService,
  DocumentAccessTrackingService,
  documentAccessTrackingService
} from '@/features/scanner/services';

// Processing Services
export {
  CameraService,
  FileUploadService,
  ImageProcessingService,
  OCRResultHandler,
  BatchProcessingService,
  ImageOptimizationService
} from '@/features/scanner/services';

// Utility Services
export { RateLimitingService } from './rateLimitingService';
export { ResultCacheService } from './resultCacheService';

// Types
export type {
  OCRResult,
  ProcessedDocument,
  ScannerConfig
} from '@/features/scanner/services';
