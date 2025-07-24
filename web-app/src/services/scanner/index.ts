// Scanner services exports
export { CameraService } from './cameraService';
export { FileUploadService } from './fileUploadService';
export { ImageProcessingService } from './imageProcessingService';
export { AIOCRService } from './ocrService';
export { OCRResultHandler } from './ocrResultHandler';
export { DocumentStorageService } from './documentStorageService';
export { DocumentTaggingService, documentTaggingService } from './documentTaggingService';
export { DocumentSearchService, documentSearchService } from './documentSearchService';
export { OCRProviderFactory, type IOCRProvider, type OCRProviderConfig } from './ocrProviderFactory';
export { FallbackOCRService, type FallbackStrategy, DegradationAction } from './fallbackOCRService';
export * from './types';