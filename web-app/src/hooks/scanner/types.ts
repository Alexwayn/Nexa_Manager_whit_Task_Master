// Scanner hook types
import type { ProcessedDocument, OCRResult, ProcessedFile } from '@/types/scanner';

export interface UseCameraReturn {
  isSupported: boolean;
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => Promise<Blob>;
  requestPermission: () => Promise<PermissionState>;
}

export interface UseFileUploadReturn {
  files: ProcessedFile[];
  isProcessing: boolean;
  error: string | null;
  processFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
}

export interface UseImageProcessingReturn {
  isProcessing: boolean;
  error: string | null;
  enhanceImage: (image: Blob) => Promise<{ original: Blob; enhanced: Blob }>;
  detectEdges: (image: Blob) => Promise<any>;
  cropImage: (image: Blob, bounds: any) => Promise<Blob>;
}

export interface UseOCRReturn {
  isProcessing: boolean;
  result: OCRResult | null;
  error: string | null;
  extractText: (image: Blob, options?: any) => Promise<void>;
  clearResult: () => void;
}

export interface UseDocumentStorageReturn {
  isLoading: boolean;
  error: string | null;
  saveDocument: (document: ProcessedDocument) => Promise<string>;
  getDocument: (id: string) => Promise<ProcessedDocument>;
  deleteDocument: (id: string) => Promise<boolean>;
  updateDocument: (id: string, updates: Partial<ProcessedDocument>) => Promise<ProcessedDocument>;
}

export interface UseScannerReturn {
  // Camera functionality
  camera: UseCameraReturn;
  
  // File upload functionality
  fileUpload: UseFileUploadReturn;
  
  // Image processing
  imageProcessing: UseImageProcessingReturn;
  
  // OCR functionality
  ocr: UseOCRReturn;
  
  // Document storage
  storage: UseDocumentStorageReturn;
  
  // Overall state
  isProcessing: boolean;
  currentStep: ScannerStep;
  processedDocument: ProcessedDocument | null;
  lastError: Error | null;
  
  // Actions
  processDocument: (image: Blob) => Promise<void>;
  saveProcessedDocument: (metadata: Partial<ProcessedDocument>) => Promise<string>;
  reset: () => void;
}

export enum ScannerStep {
  Idle = 'idle',
  Capturing = 'capturing',
  Processing = 'processing',
  OCR = 'ocr',
  Review = 'review',
  Saving = 'saving',
  Complete = 'complete',
  Error = 'error'
}
