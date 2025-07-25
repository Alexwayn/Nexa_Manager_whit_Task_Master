// Scanner services exports
export { CameraService } from './cameraService';
export { FileUploadService } from './fileUploadService';
export { ImageProcessingService } from './imageProcessingService';
export { AIOCRService } from './ocrService';
export { OCRResultHandler } from './ocrResultHandler';
export { DocumentStorageService } from './documentStorageService';
export { DocumentTaggingService, documentTaggingService } from './documentTaggingService';
export { DocumentSearchService, documentSearchService, type SearchResult, type SearchOptions, type SearchField } from './documentSearchService';
export { DocumentSharingService, documentSharingService } from './documentSharingService';
export { DocumentAccessTrackingService, documentAccessTrackingService } from './documentAccessTrackingService';
export { OCRProviderFactory, type IOCRProvider, type OCRProviderConfig } from './ocrProviderFactory';
export { FallbackOCRService, type FallbackStrategy, DegradationAction } from './fallbackOCRService';
export { default as BatchProcessingService } from './batchProcessingService';
export { default as ImageOptimizationService } from './imageOptimizationService';
export * from './types';