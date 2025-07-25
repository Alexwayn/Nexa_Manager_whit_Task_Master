// Core Scanner types and interfaces

export interface ProcessedDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  clientId?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  originalFile: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
  enhancedFile: {
    url: string;
    size: number;
  };
  pdfFile?: {
    url: string;
    size: number;
  };
  textContent: string;
  ocrConfidence: number;
  ocrLanguage: string;
  status: DocumentStatus;
  processingErrors?: string[];
  sharingSettings: SharingSettings;
  accessLog: AccessLogEntry[];
}

export enum DocumentStatus {
  Processing = 'processing',
  Complete = 'complete',
  Error = 'error'
}

export interface SharingSettings {
  isShared: boolean;
  accessLevel: AccessLevel;
  sharedWith: SharedUser[];
  publicLink?: string;
  expiresAt?: Date;
}

export enum AccessLevel {
  View = 'view',
  Edit = 'edit',
  Download = 'download'
}

export interface SharedUser {
  userId: string;
  email: string;
  accessLevel: AccessLevel;
  sharedAt: Date;
}

export interface AccessLogEntry {
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
}

// OCR Service Types
export enum OCRProvider {
  OpenAI = 'openai',
  Qwen = 'qwen',
  Azure = 'azure',
  Google = 'google',
  Fallback = 'fallback'
}

export interface OCROptions {
  provider?: OCRProvider;
  enhanceImage?: boolean;
  detectTables?: boolean;
  language?: string;
  timeout?: number;
  maxRetries?: number;
  priority?: number;
  customPrompt?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  provider: OCRProvider;
  processingTime: number;
  blocks?: TextBlock[];
  tables?: TableData[];
  rawResponse?: any;
  error?: OCRError;
}

export interface TextBlock {
  text: string;
  bounds?: Rect;
  confidence?: number;
}

export interface TableData {
  rows: number;
  columns: number;
  cells: TableCell[][];
}

export interface TableCell {
  text: string;
  rowSpan?: number;
  colSpan?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRError {
  code: string;
  message: string;
  provider: OCRProvider;
  retryable: boolean;
}

export interface ProviderStatus {
  available: boolean;
  quotaRemaining?: number;
  rateLimited: boolean;
  lastError?: string;
}

export interface StructuredData {
  title?: string;
  date?: Date;
  amount?: number;
  entities?: NamedEntity[];
  keyValuePairs?: Record<string, string>;
  documentType?: string;
  additionalData?: Record<string, any>;
}

export interface NamedEntity {
  text: string;
  type: string;
  confidence: number;
}

// Service Interfaces
export interface CameraService {
  initialize(): Promise<boolean>;
  startCamera(): Promise<MediaStream>;
  stopCamera(): void;
  captureImage(): Promise<Blob>;
  hasCamera(): boolean;
  requestPermission(): Promise<PermissionState>;
}

export interface FileUploadService {
  validateFile(file: File): boolean;
  processFiles(files: File[]): Promise<ProcessedFile[]>;
  getAcceptedFileTypes(): string[];
  getMaxFileSize(): number;
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

export interface ImageProcessingService {
  enhanceImage(image: Blob): Promise<EnhancedImage>;
  detectDocumentEdges(image: Blob): Promise<DocumentBounds>;
  cropToDocument(image: Blob, bounds: DocumentBounds): Promise<Blob>;
  adjustContrast(image: Blob, level: number): Promise<Blob>;
  adjustBrightness(image: Blob, level: number): Promise<Blob>;
  removeShadows(image: Blob): Promise<Blob>;
  convertToPDF(images: Blob[]): Promise<Blob>;
  // New preprocessing methods
  compressImage(image: Blob, options?: Partial<ImagePreprocessingOptions>): Promise<CompressionResult>;
  convertFormat(image: Blob, targetFormat: 'jpeg' | 'png' | 'webp', quality?: number): Promise<Blob>;
  optimizeForOCR(image: Blob): Promise<Blob>;
  preprocessForAPI(image: Blob, apiRequirements?: APIRequirements): Promise<CompressionResult>;
  // New PDF handling methods
  parsePDF(pdfBlob: Blob): Promise<Blob[]>;
  extractPDFPages(pdfBlob: Blob): Promise<PDFPage[]>;
  processMultiPageDocument(input: Blob | Blob[], options?: MultiPageProcessingOptions): Promise<MultiPageProcessingResult>;
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

export interface AIOCRService {
  extractText(image: Blob, options?: OCROptions): Promise<OCRResult>;
  getAvailableProviders(): OCRProvider[];
  setPreferredProvider(provider: OCRProvider): void;
  getProviderStatus(provider: OCRProvider): ProviderStatus;
}

export interface OCRResultHandler {
  formatText(result: OCRResult): string;
  mergeResults(results: OCRResult[]): OCRResult;
  extractStructuredData(result: OCRResult): StructuredData;
  getFormattedHTML(result: OCRResult): string;
  calculateConfidenceScore(result: OCRResult): number;
}

export interface DocumentStorageService {
  saveDocument(document: ProcessedDocument): Promise<string>;
  getDocument(id: string): Promise<ProcessedDocument>;
  deleteDocument(id: string): Promise<boolean>;
  updateDocument(id: string, updates: Partial<ProcessedDocument>): Promise<ProcessedDocument>;
  listDocuments(filters: DocumentFilters): Promise<DocumentListResult>;
}

export interface DocumentFilters {
  category?: string;
  clientId?: string;
  projectId?: string;
  tags?: string[];
  dateRange?: DateRange;
  searchText?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentListResult {
  documents: ProcessedDocument[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// PDF Processing Types
export interface PDFPage {
  pageNumber: number;
  image: Blob;
}

export interface MultiPageProcessingOptions {
  combineIntoPDF?: boolean;
  optimizeForOCR?: boolean;
  maxPagesPerBatch?: number;
}

export interface MultiPageProcessingResult {
  pages: Blob[];
  combinedPDF?: Blob;
  totalPages: number;
  processingInfo: PageProcessingInfo[];
}

export interface PageProcessingInfo {
  pageNumber: number;
  originalSize: number;
  processedSize: number;
  format: string;
}

// Image Preprocessing Types
export interface ImagePreprocessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  targetFileSize?: number;
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
}

export interface APIRequirements {
  maxFileSize?: number;
  maxDimensions?: { width: number; height: number };
  supportedFormats?: string[];
}