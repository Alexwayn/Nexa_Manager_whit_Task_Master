# Document Scanner System

## Overview

The Document Scanner system is a comprehensive document digitization solution integrated into Nexa Manager. It provides AI-powered OCR (Optical Character Recognition) capabilities, allowing users to convert physical documents into searchable digital assets.

## Architecture

### Core Components

```
scanner/
├── components/
│   ├── ScannerPage.tsx          # Main scanner interface with tabbed UI
│   ├── CameraCapture.tsx        # Camera-based document capture
│   ├── FileUpload.tsx           # File upload with drag-and-drop
│   └── DocumentPreview.tsx      # Document preview and editing
├── services/
│   ├── cameraService.ts         # Camera access and control
│   ├── fileUploadService.ts     # File validation and processing
│   ├── imageProcessingService.ts # Image enhancement and optimization
│   ├── imageOptimizationService.ts # Advanced image optimization for API cost reduction
│   ├── ocrService.ts            # Main OCR orchestration service
│   ├── ocrProviderFactory.ts    # OCR provider factory and management
│   ├── fallbackOCRService.ts    # Fallback logic and degradation strategies
│   ├── ocrResultHandler.ts      # OCR result processing and formatting
│   └── documentStorageService.ts # Document persistence
├── hooks/
│   └── useScanner.ts            # Main scanner orchestration
└── types/
    └── scanner.ts               # TypeScript definitions
```

### Data Flow

1. **Document Input** - Camera capture or file upload
2. **Image Processing** - Enhancement, edge detection, optimization
3. **OCR Processing** - AI-powered text extraction with multiple providers
4. **Result Processing** - Text formatting, structured data extraction
5. **Storage** - Document persistence with metadata
6. **Integration** - Connection with business workflows

## Features

### 📷 Camera Capture
- Real-time camera access with permission handling
- Document edge detection and guides
- Capture preview with retake/confirm options
- Automatic image optimization for OCR

### 📁 File Upload
- Drag-and-drop interface for multiple files
- Support for JPG, PNG, and PDF formats
- File validation (type, size, format)
- Batch processing capabilities
- Upload progress tracking

### 🖼️ Image Processing
- **Advanced Image Optimization** - Comprehensive optimization service for API cost reduction
  - Smart compression with quality preservation
  - Resolution optimization for OCR accuracy
  - Format conversion (JPEG, PNG, WebP)
  - Batch processing capabilities
  - Size estimation and compression analysis
- **Document Enhancement** - Automatic image enhancement for better OCR results
  - Contrast and brightness adjustment optimized for text recognition
  - Shadow removal and noise reduction
  - Progressive JPEG support for web display
- **Multi-format Support** - Document edge detection and cropping
- **PDF Handling** - Multi-page PDF processing and conversion

### 🤖 AI-Powered OCR
- **Multi-Provider Architecture** with factory pattern for extensibility:
  - **OpenAI Vision API** - High accuracy for complex documents with GPT-4 Vision
  - **Qwen OCR API** - Cost-effective alternative with competitive accuracy
  - **Fallback Provider** - Always-available manual input fallback
- **Intelligent Provider Selection** with automatic failover and degradation strategies
- **Advanced Rate Limiting** and quota management per provider
- **Robust Error Handling** with retry mechanisms and graceful degradation
- **Real-time Status Monitoring** for all providers
- **Confidence Scoring** and quality assessment with provider-specific adjustments
- **Multi-language Support** with provider-optimized prompts

### 📊 Document Management
- **Supabase Integration** - Full database persistence with PostgreSQL backend
- **Structured Storage** - Comprehensive document metadata and file management
- **Multi-file Support** - Original, enhanced, and PDF versions with automatic bucket management
- **Client & Project Association** - Direct integration with business workflows
- **Advanced Search** - Full-text search across document content with filtering
- **Tagging System** - Flexible categorization with custom tags
- **Access Control** - Row Level Security (RLS) with user data isolation
- **Audit Trails** - Complete access logging and activity tracking
- **Statistics & Analytics** - Document usage metrics and storage analytics
- **Temporary Storage** - Secure temporary file handling during processing
- **Automatic Cleanup** - Scheduled cleanup of old temporary files

### 📊 Batch Processing System
- **Job Management** - Complete batch job lifecycle with creation, monitoring, and control
- **Concurrency Control** - Configurable concurrent processing limits for optimal performance
- **Progress Tracking** - Real-time progress updates with time estimation and completion metrics
- **Error Recovery** - Retry mechanisms with configurable failure handling and exponential backoff
- **Result Aggregation** - Comprehensive batch result collection with individual file status
- **Queue Management** - Job queuing with priority support, pause/resume, and cancellation
- **Statistics & Analytics** - Batch processing metrics, cache hit rates, and performance tracking
- **Resource Management** - Memory-efficient processing with automatic cleanup and disposal

### 🔗 Document Sharing & Collaboration
- **Secure Document Sharing** - Permission-based sharing with granular access controls
- **Access Level Management** - View, download, and edit permissions with role-based restrictions
- **Public Link Generation** - Secure shareable links with optional expiration dates
- **Email Notifications** - Automated notifications for sharing events and access changes
- **Activity Tracking** - Comprehensive access logging and audit trails
- **Share Management** - Create, revoke, and monitor document shares
- **External User Support** - Share documents with users outside the organization
- **Bulk Sharing** - Share documents with multiple recipients simultaneously

## TypeScript Types

### Core Document Types

```typescript
interface ProcessedDocument {
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
  originalFile: FileInfo;
  enhancedFile: FileInfo;
  pdfFile?: FileInfo;
  textContent: string;
  ocrConfidence: number;
  ocrLanguage: string;
  status: DocumentStatus;
  processingErrors?: string[];
  sharingSettings: SharingSettings;
  accessLog: AccessLogEntry[];
}

enum DocumentStatus {
  Processing = 'processing',
  Complete = 'complete',
  Error = 'error'
}

// Document Sharing Types
interface SharingSettings {
  isShared: boolean;
  accessLevel: AccessLevel;
  sharedWith: SharedUser[];
  publicLink?: string;
  expiresAt?: Date;
}

enum AccessLevel {
  View = 'view',
  Edit = 'edit',
  Download = 'download'
}

interface SharedUser {
  userId: string;
  email: string;
  accessLevel: AccessLevel;
  sharedAt: Date;
}

interface AccessLogEntry {
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
}

interface ShareDocumentRequest {
  documentId: string;
  sharedWith: {
    email: string;
    accessLevel: AccessLevel;
  }[];
  message?: string;
  expiresAt?: Date;
  allowPublicLink?: boolean;
}

interface DocumentShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string;
  sharedWithEmail: string;
  accessLevel: AccessLevel;
  shareToken: string;
  publicLink?: string;
  message?: string;
  expiresAt?: Date;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  isActive: boolean;
}
```

### OCR Service Types

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  provider: OCRProvider;
  processingTime: number;
  blocks?: TextBlock[];
  tables?: TableData[];
  rawResponse?: any;
  error?: OCRError;
}

enum OCRProvider {
  OpenAI = 'openai',
  Qwen = 'qwen',
  Azure = 'azure',
  Google = 'google',
  Fallback = 'fallback'
}
```

### Batch Processing Types

```typescript
interface BatchJob {
  id: string;
  files: File[];
  options: BatchProcessingOptions;
  status: BatchJobStatus;
  progress: BatchProgress;
  results: BatchResult[];
  errors: BatchError[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface BatchProcessingOptions {
  ocrOptions?: OCROptions;
  optimizeImages?: boolean;
  enableCaching?: boolean;
  maxConcurrency?: number;
  retryFailures?: boolean;
  maxRetries?: number;
  onProgress?: (progress: BatchProgress) => void;
  onFileComplete?: (result: BatchResult) => void;
  onError?: (error: BatchError) => void;
}

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  averageProcessingTime?: number;
}

enum BatchJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}
```

### Service Interfaces

```typescript
interface AIOCRService {
  extractText(image: Blob, options?: OCROptions): Promise<OCRResult>;
  getAvailableProviders(): OCRProvider[];
  setPreferredProvider(provider: OCRProvider): void;
  getProviderStatus(provider: OCRProvider): ProviderStatus;
}

interface BatchProcessingService {
  createBatchJob(files: File[], options?: BatchProcessingOptions): string;
  getJobStatus(jobId: string): BatchJob | null;
  cancelJob(jobId: string): boolean;
  pauseJob(jobId: string): boolean;
  resumeJob(jobId: string): boolean;
  getActiveJobs(): BatchJob[];
  clearCompletedJobs(): number;
  getBatchStats(): BatchStatistics;
  exportBatchResults(jobId: string): any;
}

interface DocumentStorageService {
  saveDocument(document: ProcessedDocument): Promise<string>;
  getDocument(id: string): Promise<ProcessedDocument>;
  deleteDocument(id: string): Promise<boolean>;
  updateDocument(id: string, updates: Partial<ProcessedDocument>): Promise<ProcessedDocument>;
  listDocuments(filters: DocumentFilters): Promise<DocumentListResult>;
  searchDocuments(searchQuery: string, filters?: DocumentFilters): Promise<DocumentListResult>;
  storeTemporaryFile(file: Blob, fileName: string, userId: string): Promise<string>;
  moveToPermStorage(tempPath: string, permanentPath: string): Promise<string>;
  cleanupTemporaryFile(tempPath: string): Promise<void>;
  cleanupOldTemporaryFiles(): Promise<void>;
  getDocumentStatistics(userId?: string): Promise<DocumentStatistics>;
}

interface DocumentSharingService {
  shareDocument(request: ShareDocumentRequest, sharedBy: string): Promise<ShareDocumentResponse>;
  revokeDocumentShare(shareId: string, userId: string): Promise<{ success: boolean; error?: string }>;
  accessSharedDocument(shareToken: string, action: 'view' | 'download' | 'edit', accessData?: Partial<AccessTrackingData>): Promise<{ success: boolean; document?: ProcessedDocument; error?: string }>;
  getDocumentShares(documentId: string, userId: string): Promise<{ success: boolean; shares?: DocumentShare[]; error?: string }>;
  getDocumentAccessHistory(documentId: string, userId: string): Promise<{ success: boolean; accessHistory?: AccessLogEntry[]; error?: string }>;
}
```

## OCR Provider Factory Architecture

### Provider Factory Pattern

The OCR system uses a factory pattern for extensible provider management:

```typescript
// Provider factory manages all OCR providers
export class OCRProviderFactory {
  static async initialize(): Promise<void>
  static getProvider(providerType: OCRProvider): IOCRProvider | null
  static getAvailableProviders(): OCRProvider[]
  static getProviderStatus(providerType: OCRProvider): ProviderStatus
  static getAllProviderStatuses(): Map<OCRProvider, ProviderStatus>
}

// Base provider interface
export interface IOCRProvider {
  readonly name: OCRProvider;
  extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>>;
  isAvailable(): boolean;
  getStatus(): ProviderStatus;
  initialize(): Promise<void>;
  destroy(): void;
}
```

### Provider Implementations

#### OpenAI Vision Provider
- **Model**: GPT-4 Vision Preview for high-accuracy OCR
- **Features**: 
  - Advanced image optimization (max 2048x2048, 20MB limit)
  - Intelligent prompting based on document type
  - Request queuing with rate limiting (60 req/min, 1000 req/hour)
  - Confidence estimation based on response quality
  - Table detection and structure preservation
- **Error Handling**: Comprehensive HTTP status handling, timeout management, quota tracking

#### Qwen OCR Provider  
- **Model**: Qwen-VL-OCR for cost-effective text extraction
- **Features**:
  - Image optimization (max 1920x1920, 10MB limit)
  - Multi-language support with context-aware prompting
  - Rate limiting (30 req/min, 500 req/hour)
  - Table structure detection and formatting
- **Error Handling**: API-specific error codes, retry mechanisms, quota monitoring

#### Fallback Provider
- **Purpose**: Always-available manual input option
- **Features**:
  - Immediate response with manual input prompt
  - No external dependencies
  - Consistent interface for seamless integration

### Intelligent Fallback System

The `FallbackOCRService` provides advanced retry logic and degradation strategies:

```typescript
export interface FallbackStrategy {
  maxRetries: number;
  retryDelay: number;
  providerPriority: OCRProvider[];
  degradationSteps: DegradationStep[];
}

export enum DegradationAction {
  REDUCE_IMAGE_QUALITY = 'reduce_image_quality',
  SIMPLIFY_PROMPT = 'simplify_prompt', 
  INCREASE_TIMEOUT = 'increase_timeout',
  SWITCH_PROVIDER = 'switch_provider',
  USE_BASIC_OCR = 'use_basic_ocr',
  MANUAL_INPUT = 'manual_input'
}
```

**Degradation Strategies**:
- **Timeout Errors**: Increase timeout by 1.5x multiplier
- **Rate Limiting**: Automatic provider switching
- **HTTP Errors**: Reduce image quality by 20%
- **Quota Exceeded**: Immediate provider switching
- **Multiple Failures**: Fall back to manual input

### Provider Status Monitoring

Real-time monitoring of all providers:

```typescript
interface ProviderStatus {
  available: boolean;
  quotaRemaining?: number;
  rateLimited: boolean;
  lastError?: string;
}
```

## Image Optimization Service

### Overview

The `ImageOptimizationService` is a singleton service that provides comprehensive image optimization capabilities designed to reduce API costs while maintaining OCR accuracy. It uses HTML5 Canvas for client-side processing and supports multiple optimization strategies.

### Key Features

#### 🎯 OCR-Optimized Processing
- **Smart Compression**: Balances file size reduction with OCR accuracy
- **Resolution Optimization**: Automatically calculates optimal dimensions (max 2048x2048)
- **Format Conversion**: Converts images to optimal formats (JPEG for photos, PNG for documents)
- **Enhancement for OCR**: Applies contrast and brightness adjustments to improve text recognition

#### 📊 Batch Processing
- **Multiple Image Support**: Process multiple images simultaneously
- **Progress Tracking**: Individual processing results with error handling
- **Consistent Quality**: Applies same optimization parameters across batch

#### 🔍 Analysis & Recommendations
- **Size Estimation**: Predict optimization results without full processing
- **Compression Analysis**: Detailed before/after comparison with metrics
- **Smart Recommendations**: Suggests optimal settings based on image characteristics
- **Performance Metrics**: Processing time and compression ratio tracking

#### 🖼️ Multiple Output Formats
- **OCR Optimization**: High-quality images optimized for text extraction (max 5MB)
- **Web Display**: Compressed images for UI display (max 1MB)
- **Thumbnails**: Small preview images for quick loading (max 100KB)

### TypeScript Interface

```typescript
interface OptimizationOptions {
  maxWidth?: number;           // Maximum width in pixels
  maxHeight?: number;          // Maximum height in pixels
  quality?: number;            // Compression quality (0.0-1.0)
  format?: 'jpeg' | 'png' | 'webp';  // Output format
  maxFileSize?: number;        // Maximum file size in bytes
  preserveAspectRatio?: boolean;      // Maintain original aspect ratio
  enableProgressive?: boolean;        // Enable progressive JPEG
}

interface OptimizationResult {
  optimizedImage: Blob;        // Optimized image blob
  originalSize: number;        // Original file size
  optimizedSize: number;       // Optimized file size
  compressionRatio: number;    // Compression ratio (original/optimized)
  dimensions: {
    original: { width: number; height: number };
    optimized: { width: number; height: number };
  };
  format: string;              // Output format used
  processingTime: number;      // Processing time in milliseconds
}
```

### Usage Examples

#### Basic OCR Optimization
```typescript
import ImageOptimizationService from '@/services/scanner/imageOptimizationService';

const optimizationService = ImageOptimizationService.getInstance();

// Optimize image for OCR processing
const result = await optimizationService.optimizeForOCR(imageBlob, {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  format: 'jpeg'
});

console.log(`Reduced size from ${result.originalSize} to ${result.optimizedSize} bytes`);
console.log(`Compression ratio: ${result.compressionRatio.toFixed(2)}x`);
```

#### Web Display Optimization
```typescript
// Optimize for web display
const displayResult = await optimizationService.optimizeForDisplay(imageBlob, {
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.8
});

// Create thumbnail
const thumbnailResult = await optimizationService.createThumbnail(imageBlob, 150);
```

#### Batch Processing
```typescript
// Process multiple images
const images = [blob1, blob2, blob3];
const results = await optimizationService.batchOptimize(images, {
  maxWidth: 1600,
  quality: 0.8
});

results.forEach((result, index) => {
  console.log(`Image ${index + 1}: ${result.compressionRatio.toFixed(2)}x compression`);
});
```

#### Analysis and Recommendations
```typescript
// Get optimization recommendations
const analysis = await optimizationService.getOptimizationRecommendations(imageBlob);

console.log('Recommendations:', analysis.recommendations);
console.log('Suggested options:', analysis.suggestedOptions);
console.log('Estimated savings:', analysis.estimatedSavings, 'bytes');

// Estimate optimization without processing
const estimation = await optimizationService.estimateOptimization(imageBlob, {
  quality: 0.7,
  maxWidth: 1600
});

console.log('Estimated size:', estimation.estimatedSize);
console.log('Estimated savings:', estimation.estimatedSavings);
```

### Advanced Features

#### Smart Quality Reduction
The service automatically reduces quality iteratively if the target file size isn't met:

```typescript
// Will automatically reduce quality to meet 2MB limit
const result = await optimizationService.optimizeForOCR(largeImage, {
  maxFileSize: 2 * 1024 * 1024  // 2MB limit
});
```

#### OCR Enhancement
For JPEG format, the service applies OCR-specific enhancements:
- Slight contrast increase (1.1x multiplier)
- Brightness adjustment (+5 units)
- High-quality image smoothing

#### Performance Optimization
- **Singleton Pattern**: Single instance for memory efficiency
- **Canvas Reuse**: Reuses HTML5 Canvas for multiple operations
- **Even Dimensions**: Ensures width/height are even numbers for better compression
- **Resource Cleanup**: Automatic cleanup of object URLs and canvas resources

### Integration with OCR Pipeline

The Image Optimization Service integrates seamlessly with the OCR processing pipeline:

1. **Pre-OCR Processing**: Images are optimized before being sent to OCR providers
2. **Provider-Specific Optimization**: Different settings for OpenAI (2048x2048, 20MB) vs Qwen (1920x1920, 10MB)
3. **Cost Reduction**: Reduces API costs by minimizing image sizes while maintaining accuracy
4. **Error Recovery**: Provides fallback optimization strategies for failed OCR requests

### Performance Metrics

The service tracks comprehensive metrics for optimization analysis:
- **Processing Time**: Time taken for optimization
- **Compression Ratio**: Original size / optimized size
- **Quality Assessment**: Before/after quality comparison
- **Memory Usage**: Canvas memory management
- **Error Rates**: Failed optimization tracking

## Configuration

### Environment Variables

```env
# OCR Provider Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_QWEN_API_KEY=your_qwen_api_key

# Scanner Configuration
VITE_SCANNER_MAX_FILE_SIZE=10485760  # 10MB
VITE_SCANNER_ACCEPTED_TYPES=image/jpeg,image/png,application/pdf
VITE_SCANNER_OCR_TIMEOUT=30000       # 30 seconds
```

### Scanner Configuration

```typescript
const scannerConfig: ScannerConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  ocrProviders: [
    {
      provider: OCRProvider.OpenAI,
      apiKey: process.env.VITE_OPENAI_API_KEY,
      enabled: true,
      priority: 1,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    },
    {
      provider: OCRProvider.Qwen,
      apiKey: process.env.VITE_QWEN_API_KEY,
      enabled: true,
      priority: 2,
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 2000
      }
    }
  ],
  imageProcessing: {
    maxResolution: { width: 2048, height: 2048 },
    compressionQuality: 0.8,
    enableEnhancement: true
  },
  storage: {
    tempStoragePath: 'temp/scanner',
    permanentStoragePath: 'documents',
    retentionDays: 30
  }
};
```

## Usage Examples

### Basic Scanner Usage

```typescript
import { ScannerPage } from '@/components/scanner';

const DocumentScannerPage = () => {
  const handleDocumentProcessed = (document: ProcessedDocument) => {
    console.log('Document processed:', document);
    // Handle successful processing - document is now saved
  };

  return (
    <ScannerPage
      onDocumentProcessed={handleDocumentProcessed}
      defaultCategory="invoices"
      clientId="client-123"
      projectId="project-456"
    />
  );
};
```

### ScannerPage Features

The ScannerPage component provides:

- **Tabbed Interface**: Switch between camera capture and file upload
- **Real-time Status**: Processing indicators for image processing, OCR, and saving
- **Error Management**: User-friendly error alerts with dismiss functionality
- **Document Review**: Preview and edit documents before final save
- **Responsive Design**: Works on desktop and mobile devices
- **Debug Information**: Development-only debug panel showing internal state

### Processing Workflow

1. **Document Input**: User captures via camera or uploads files
2. **Processing Status**: Real-time feedback during image processing
3. **OCR Extraction**: AI-powered text extraction with status updates
4. **Document Review**: Preview extracted content and metadata
5. **Final Save**: Document saved with client/project association
6. **Completion**: Callback fired with processed document

### Camera Capture

```typescript
import { CameraCapture } from '@/components/scanner';

const CameraScanPage = () => {
  const handleImageCaptured = (imageBlob: Blob) => {
    // Process captured image
  };

  return (
    <CameraCapture
      onImageCaptured={handleImageCaptured}
      showGuides={true}
      autoEnhance={true}
    />
  );
};
```

### File Upload

```typescript
import { FileUpload } from '@/components/scanner';

const FileUploadPage = () => {
  const handleFilesSelected = (files: ProcessedFile[]) => {
    // Process uploaded files
  };

  return (
    <FileUpload
      onFilesSelected={handleFilesSelected}
      acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
      maxFileSize={10 * 1024 * 1024}
      multiple={true}
    />
  );
};
```

### OCR Service Usage

```typescript
import { AIOCRService } from '@/services/scanner/ocrService';
import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';

// Initialize the OCR service
const ocrService = new AIOCRService();

const processDocument = async (imageBlob: Blob) => {
  try {
    // The service automatically handles provider selection and fallback
    const result = await ocrService.extractText(imageBlob, {
      provider: OCRProvider.OpenAI, // Preferred provider
      detectTables: true,
      language: 'en',
      timeout: 30000,
      maxRetries: 3
    });

    console.log('Extracted text:', result.text);
    console.log('Confidence:', result.confidence);
    console.log('Provider used:', result.provider);
    console.log('Processing time:', result.processingTime);
    
    if (result.tables) {
      console.log('Detected tables:', result.tables);
    }
    
    if (result.blocks) {
      console.log('Text blocks:', result.blocks);
    }
  } catch (error) {
    console.error('OCR processing failed:', error);
  }
};

// Check provider status
const checkProviderHealth = async () => {
  const healthCheck = await ocrService.healthCheck();
  console.log('OCR Service Health:', healthCheck);
  
  const statuses = ocrService.getAllProviderStatuses();
  for (const [provider, status] of statuses) {
    console.log(`${provider}:`, status);
  }
};

// Get recommended provider
const recommendedProvider = ocrService.getRecommendedProvider();
console.log('Recommended provider:', recommendedProvider);
```

### Batch Processing Usage

```typescript
import BatchProcessingService from '@/services/scanner/batchProcessingService';

const batchService = BatchProcessingService.getInstance();

// Create batch job with progress tracking
const files = [file1, file2, file3, file4];
const jobId = batchService.createBatchJob(files, {
  maxConcurrency: 3,
  optimizeImages: true,
  enableCaching: true,
  retryFailures: true,
  maxRetries: 2,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
    console.log(`Completed: ${progress.completed}/${progress.total}`);
    console.log(`Estimated time remaining: ${progress.estimatedTimeRemaining}ms`);
  },
  onFileComplete: (result) => {
    console.log(`File ${result.fileName} processed:`, result.success);
    if (result.ocrResult) {
      console.log('Extracted text:', result.ocrResult.text);
    }
  },
  onError: (error) => {
    console.error(`Error processing ${error.fileName}:`, error.error);
  }
});

// Monitor job status
const job = batchService.getJobStatus(jobId);
console.log('Job status:', job?.status);
console.log('Progress:', job?.progress);

// Control job execution
batchService.pauseJob(jobId);
batchService.resumeJob(jobId);
batchService.cancelJob(jobId);

// Get batch statistics
const stats = batchService.getBatchStats();
console.log('Total jobs:', stats.totalJobs);
console.log('Cache hit rate:', stats.cacheHitRate);
console.log('Average processing time:', stats.averageProcessingTime);

// Export results
const exportedResults = batchService.exportBatchResults(jobId);
console.log('Batch results:', exportedResults);
```

### Direct Provider Factory Usage

```typescript
import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';

// Initialize all providers
await OCRProviderFactory.initialize();

// Get specific provider
const openaiProvider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);
if (openaiProvider && openaiProvider.isAvailable()) {
  const result = await openaiProvider.extractText(imageBlob, {
    detectTables: true
  });
}

// Check all provider statuses
const allStatuses = OCRProviderFactory.getAllProviderStatuses();
for (const [provider, status] of allStatuses) {
  console.log(`${provider}: Available=${status.available}, Rate Limited=${status.rateLimited}`);
}
```

## Document Sharing Service

### Overview

The `DocumentSharingService` provides comprehensive document sharing capabilities with secure access controls, permission management, and activity tracking. It integrates with the Supabase backend for persistent storage and includes email notification support.

### Key Features

#### 🔐 Secure Sharing
- **Permission-based Access Control** - Granular permissions (view, download, edit)
- **Secure Token Generation** - Cryptographically secure share tokens
- **Expiration Management** - Optional expiration dates for shared links
- **Access Validation** - Real-time permission checking and validation

#### 👥 Multi-User Support
- **Bulk Sharing** - Share with multiple recipients simultaneously
- **External Users** - Support for users outside the organization
- **Email Integration** - Automated notifications for sharing events
- **User Management** - Track and manage shared user access

#### 📊 Activity Tracking
- **Access Logging** - Comprehensive tracking of document access
- **Usage Analytics** - Access counts, timestamps, and user activity
- **Audit Trails** - Complete history of sharing and access events
- **IP Tracking** - Optional IP address logging for security

#### 🔗 Public Links
- **Secure Link Generation** - Public shareable links with token validation
- **Access Control** - Permission-based actions on public links
- **Expiration Support** - Time-limited public access
- **Usage Monitoring** - Track public link usage and access patterns

### Usage Examples

#### Basic Document Sharing
```typescript
import { documentSharingService } from '@/services/scanner/documentSharingService';

// Share document with multiple users
const shareRequest = {
  documentId: 'doc-123',
  sharedWith: [
    { email: 'user1@example.com', accessLevel: AccessLevel.View },
    { email: 'user2@example.com', accessLevel: AccessLevel.Download }
  ],
  message: 'Please review this document',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  allowPublicLink: true
};

const result = await documentSharingService.shareDocument(shareRequest, currentUserId);
if (result.success) {
  console.log('Document shared successfully');
  console.log('Share ID:', result.shareId);
  console.log('Public link:', result.publicLink);
}
```

#### Access Shared Document
```typescript
// Access document via share token
const accessResult = await documentSharingService.accessSharedDocument(
  shareToken,
  'view',
  {
    userId: currentUserId,
    ipAddress: userIpAddress,
    userAgent: navigator.userAgent
  }
);

if (accessResult.success && accessResult.document) {
  console.log('Document accessed:', accessResult.document.title);
  // Display document content
}
```

#### Manage Document Shares
```typescript
// Get all shares for a document
const sharesResult = await documentSharingService.getDocumentShares(documentId, ownerId);
if (sharesResult.success) {
  sharesResult.shares?.forEach(share => {
    console.log(`Shared with: ${share.sharedWithEmail}`);
    console.log(`Access level: ${share.accessLevel}`);
    console.log(`Access count: ${share.accessCount}`);
  });
}

// Revoke a share
const revokeResult = await documentSharingService.revokeDocumentShare(shareId, ownerId);
if (revokeResult.success) {
  console.log('Share revoked successfully');
}
```

#### Access History and Analytics
```typescript
// Get document access history
const historyResult = await documentSharingService.getDocumentAccessHistory(documentId, ownerId);
if (historyResult.success) {
  historyResult.accessHistory?.forEach(entry => {
    console.log(`${entry.userId} performed ${entry.action} at ${entry.timestamp}`);
  });
}
```

### Database Schema

The sharing service uses the following Supabase tables:

#### document_shares
```sql
CREATE TABLE document_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES scanned_documents(id),
  shared_by TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'download', 'edit')),
  share_token TEXT UNIQUE NOT NULL,
  public_link TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

#### document_access_log
```sql
CREATE TABLE document_access_log (
  id SERIAL PRIMARY KEY,
  share_id TEXT NOT NULL REFERENCES document_shares(id),
  user_id TEXT,
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Features

#### Row Level Security (RLS)
- Users can only access shares they created or were shared with
- Document owners have full control over their document shares
- Automatic user data isolation and access control

#### Token Security
- Cryptographically secure 32-character share tokens
- Unique token generation with collision prevention
- Token-based access validation for public links

#### Permission Validation
- Real-time permission checking for all actions
- Access level enforcement (view, download, edit)
- Expiration date validation for time-limited shares

#### Audit and Compliance
- Comprehensive access logging for compliance requirements
- IP address tracking for security monitoring
- Complete audit trails for document access and sharing events

### Email Notification Integration

The service integrates with the email notification system to send:
- **Share Notifications** - Notify recipients when documents are shared
- **Revocation Notifications** - Inform users when access is revoked
- **Access Alerts** - Optional notifications for document access events

### Error Handling

Comprehensive error handling includes:
- **Permission Errors** - Clear messages for access denied scenarios
- **Validation Errors** - Input validation with user-friendly messages
- **Network Errors** - Retry logic and graceful degradation
- **Database Errors** - Transaction rollback and consistency maintenance

## Implementation Status

### ✅ Completed Tasks

1. **Project Structure Setup** ✅ **COMPLETE**
   - Directory structure created
   - TypeScript interfaces defined
   - Service layer scaffolded
   - Component exports configured

2. **Scanner UI Components - ScannerPage** ✅ **COMPLETE**
   - Complete tabbed interface (camera/upload)
   - Real-time processing status indicators
   - Comprehensive error handling with dismissible alerts
   - Document review workflow with preview integration
   - State management via useScanner hook
   - Responsive design with TailwindCSS
   - Debug information panel for development

3. **AI OCR Service Architecture** ✅ **COMPLETE**
   - **OCR Provider Factory** - Extensible factory pattern for provider management
   - **OpenAI Vision Provider** - Full GPT-4 Vision API integration with optimization
   - **Qwen OCR Provider** - Complete Qwen API integration with rate limiting
   - **Fallback OCR Provider** - Always-available manual input fallback
   - **Intelligent Fallback Service** - Advanced retry logic and degradation strategies
   - **OCR Result Handler** - Comprehensive text processing and structured data extraction
   - **Provider Status Monitoring** - Real-time health checks and quota tracking
   - **Rate Limiting & Quota Management** - Per-provider request throttling with token bucket algorithm
   - **Error Handling** - Robust error recovery with provider switching

4. **Image Processing & Optimization** ✅ **COMPLETE**
   - **Advanced Image Optimization Service** - Comprehensive optimization for API cost reduction
   - **OCR-Optimized Processing** - Smart compression with quality preservation (max 2048x2048, 5MB)
   - **Web Display Optimization** - Compressed images for UI display (max 800x600, 1MB)
   - **Thumbnail Generation** - Small preview images for quick loading (150px, 100KB)
   - **Batch Processing** - Multiple image processing with error handling and progress tracking
   - **Analysis & Recommendations** - Size estimation and optimization suggestions
   - **Format Support** - JPEG, PNG, WebP with progressive JPEG support
   - **OCR Enhancements** - Contrast, brightness, and smoothing adjustments

5. **Batch Processing System** ✅ **COMPLETE**
   - **Job Management** - Complete batch job lifecycle with status tracking
   - **Concurrency Control** - Configurable concurrent processing limits
   - **Progress Tracking** - Real-time progress updates with time estimation
   - **Error Recovery** - Retry mechanisms with configurable failure handling
   - **Result Aggregation** - Comprehensive batch result collection and export
   - **Queue Management** - Job queuing with priority support and cancellation
   - **Statistics & Analytics** - Batch processing metrics and performance tracking

6. **Result Caching System** ✅ **COMPLETE**
   - **Multi-Level Caching** - OCR results, processed documents, and image processing results
   - **Persistence** - localStorage integration with automatic cleanup
   - **Eviction Policies** - LRU and size-based eviction strategies
   - **Cache Analytics** - Hit rates, usage statistics, and performance metrics
   - **Key Generation** - Smart cache key generation for different data types

7. **Document Storage and Management** ✅ **COMPLETE**
   - **Supabase Integration** - Full PostgreSQL database persistence
   - **Multi-bucket Storage** - Separate buckets for permanent and temporary files
   - **Comprehensive CRUD Operations** - Complete document lifecycle management
   - **Advanced Search & Filtering** - Full-text search with metadata filtering
   - **File Management** - Automatic file cleanup and storage optimization
   - **Access Logging** - Complete audit trail with user activity tracking
   - **Statistics & Analytics** - Document usage metrics and storage analytics
   - **Security** - Row Level Security (RLS) with user data isolation

8. **Testing & Quality Assurance** ✅ **COMPLETE**
   - **Unit Test Suite** - Comprehensive tests for all core services
     - Rate Limiting Service with token bucket algorithm testing
     - OCR Provider Factory with provider management testing
     - Document Storage Service with Supabase integration testing
     - Image Processing Service with optimization testing
     - OCR Service with provider selection and fallback testing
     - Batch Processing Service with job management testing
     - Result Cache Service with persistence and eviction testing
   - **Integration Tests** - End-to-end workflow testing
     - Complete document scanning flow from input to storage
     - OCR provider fallback mechanism with degradation strategies
     - Error handling and recovery across all system components
   - **Performance Testing** - Scalability and load testing
   - **Error Scenario Testing** - Comprehensive failure mode testing

### 🔄 In Progress

9. **Scanner UI Components - Remaining**
   - CameraCapture component implementation
   - FileUpload component with drag-and-drop
   - DocumentPreview component for editing

### 📋 Upcoming Tasks

10. **Document Sharing Functionality**
    - Permission-based sharing system
    - Secure link generation
    - Access tracking and notifications

11. **Advanced Error Boundaries**
    - UI error boundaries for graceful degradation
    - User-friendly error recovery workflows

## Security Considerations

### Data Protection
- Temporary file cleanup after processing
- Encrypted storage for sensitive documents
- Access control and permission management
- Audit logging for document access

### API Security
- Secure API key management
- Rate limiting and quota monitoring
- Request validation and sanitization
- Error handling without data exposure

### Privacy
- Local image processing when possible
- Minimal data transmission to OCR providers
- User consent for cloud processing
- Data retention policy compliance

## Performance Optimization

### Image Processing
- Client-side image compression
- Optimal resolution for OCR accuracy
- Batch processing for multiple documents
- Progressive loading for large files

### OCR Processing
- Provider selection based on document type
- Caching of OCR results
- Parallel processing for multiple pages
- Fallback mechanisms for reliability

### Storage
- Efficient file storage and retrieval
- Metadata indexing for fast search
- Lazy loading of document content
- Automatic cleanup of temporary files

## Testing Strategy

### Unit Tests
- Service layer functionality
- Image processing algorithms
- OCR result handling
- Document storage operations

### Integration Tests
- End-to-end document processing
- Provider failover mechanisms
- Error handling and recovery
- Performance under load

### E2E Tests
- Complete user workflows
- Camera capture scenarios
- File upload processes
- Document sharing features

## Troubleshooting

### Common Issues

**Camera Access Denied**
- Check browser permissions
- Ensure HTTPS connection
- Verify camera availability

**OCR Processing Fails**
- Verify API keys configuration
- Check network connectivity
- Review image quality and format

**File Upload Errors**
- Validate file size limits
- Check supported file types
- Ensure sufficient storage space

**Poor OCR Accuracy**
- Improve image quality
- Use image enhancement features
- Try different OCR providers

### Debug Configuration

```typescript
const debugConfig = {
  enableLogging: true,
  logLevel: 'debug',
  saveProcessingSteps: true,
  showConfidenceScores: true
};
```

## Future Enhancements

### Planned Features
- Batch document processing
- Advanced document templates
- Machine learning model training
- Mobile app integration
- Offline processing capabilities

### API Integrations
- Additional OCR providers
- Document analysis services
- Translation services
- Cloud storage providers

---

## Additional Documentation

- [OCR Provider Factory](OCR_PROVIDER_FACTORY.md) - Detailed OCR architecture and provider management
- [Scanner API Documentation](SCANNER_API.md) - Comprehensive API reference for OCR services
- [Scanner Feature README](../src/components/scanner/README.md) - Component overview and usage
- [ScannerPage Implementation Guide](SCANNER_PAGE_IMPLEMENTATION.md) - Detailed implementation documentation
- [TypeScript Types](../src/types/scanner.ts) - Type definitions and interfaces
- [Implementation Tasks](../../.kiro/specs/document-scanner/tasks.md) - Development progress tracking