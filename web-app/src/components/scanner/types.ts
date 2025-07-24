// Scanner component types
import type { ProcessedDocument } from '@/types/scanner';

export interface ScannerProps {
  onDocumentProcessed: (document: ProcessedDocument) => void;
  defaultCategory?: string;
  clientId?: string;
  projectId?: string;
}

export interface CameraCaptureProps {
  onCapture: (image: Blob) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

export interface FileUploadProps {
  onFilesSelected: (files: ProcessedFile[]) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
}

export interface DocumentPreviewProps {
  document: ProcessedDocument;
  onEdit: (document: ProcessedDocument) => void;
  onSave: (document: ProcessedDocument) => void;
  onCancel: () => void;
  showOCRResults?: boolean;
}

export interface ProcessedFile {
  id: string;
  originalFile: File;
  preview: string;
  size: number;
  type: string;
  name: string;
  error?: string;
}

export interface EnhancedImage {
  original: Blob;
  enhanced: Blob;
  width: number;
  height: number;
}

export interface DocumentBounds {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export interface Point {
  x: number;
  y: number;
}