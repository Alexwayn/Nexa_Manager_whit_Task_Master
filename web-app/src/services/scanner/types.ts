// Scanner service specific types
import type {
  ProcessedDocument,
  OCRResult,
  OCROptions,
  OCRProvider,
  ProviderStatus,
  EnhancedImage,
  DocumentBounds,
  StructuredData,
  ProcessedFile,
  DocumentFilters,
  DocumentListResult
} from '@/types/scanner';

// Re-export types for service layer
export type {
  ProcessedDocument,
  OCRResult,
  OCROptions,
  OCRProvider,
  ProviderStatus,
  EnhancedImage,
  DocumentBounds,
  StructuredData,
  ProcessedFile,
  DocumentFilters,
  DocumentListResult
};

// Service-specific configuration types
export interface ScannerConfig {
  maxFileSize: number;
  acceptedFileTypes: string[];
  ocrProviders: OCRProviderConfig[];
  imageProcessing: ImageProcessingConfig;
  storage: StorageConfig;
}

export interface OCRProviderConfig {
  provider: OCRProvider;
  apiKey: string;
  endpoint?: string;
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface ImageProcessingConfig {
  maxResolution: {
    width: number;
    height: number;
  };
  compressionQuality: number;
  enableEnhancement: boolean;
}

export interface StorageConfig {
  tempStoragePath: string;
  permanentStoragePath: string;
  retentionDays: number;
}