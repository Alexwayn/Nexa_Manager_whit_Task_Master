// Re-export ImageProcessingService from features directory
// This maintains compatibility with existing imports from @/services/scanner

export { ImageProcessingService } from '@/features/scanner/services/imageProcessingService';
export type {
  EnhancedImage,
  DocumentBounds,
  ImagePreprocessingOptions,
  CompressionResult
} from '@/types/scanner';
