# Scanner API Documentation

This document provides comprehensive API documentation for the Scanner feature, including service interfaces, type definitions, and usage examples.

## Table of Contents

- [Core Services](#core-services)
- [Type Definitions](#type-definitions)
- [Environment Configuration](#environment-configuration)
- [Error Handling](#error-handling)
- [Testing Patterns](#testing-patterns)

## Core Services

### OCRProviderFactory

The `OCRProviderFactory` is a singleton service that manages multiple OCR providers with intelligent fallback capabilities.

#### Methods

##### `initialize(): Promise<void>`

Initializes the factory and all configured OCR providers.

```typescript
import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';

await OCRProviderFactory.initialize();
```

**Returns**: `Promise<void>`
**Throws**: `Error` if initialization fails

##### `getAvailableProviders(): OCRProvider[]`

Returns an array of currently available OCR providers.

```typescript
const providers = OCRProviderFactory.getAvailableProviders();
// Returns: ['openai', 'qwen', 'fallback']
```

**Returns**: `OCRProvider[]` - Array of available provider identifiers

##### `getProviderStatus(provider: OCRProvider): ProviderStatus`

Gets the current status of a specific OCR provider.

```typescript
const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);
console.log(status.available); // boolean
console.log(status.rateLimited); // boolean
```

**Parameters**:
- `provider: OCRProvider` - The provider to check

**Returns**: `ProviderStatus` object with:
- `available: boolean` - Whether the provider is currently available
- `rateLimited: boolean` - Whether the provider is rate limited
- `quotaRemaining?: number` - Remaining quota (if available)
- `lastError?: string` - Last error message (if any)

##### `getAllProviderStatuses(): Map<OCRProvider, ProviderStatus>`

Returns a map of all provider statuses.

```typescript
const statuses = OCRProviderFactory.getAllProviderStatuses();
statuses.forEach((status, provider) => {
  console.log(`${provider}: ${status.available ? 'available' : 'unavailable'}`);
});
```

**Returns**: `Map<OCRProvider, ProviderStatus>`

##### `processDocument(image: Blob, options?: OCROptions): Promise<OCRResult>`

Processes a document image using the best available OCR provider.

```typescript
const image = new Blob([imageData], { type: 'image/jpeg' });
const result = await OCRProviderFactory.processDocument(image, {
  enhanceImage: true,
  detectTables: true,
  language: 'en'
});

console.log(result.text);
console.log(result.confidence);
console.log(result.provider);
```

**Parameters**:
- `image: Blob` - The image to process
- `options?: OCROptions` - Processing options

**Returns**: `Promise<OCRResult>`
**Throws**: `OCRError` if all providers fail

##### `destroy(): Promise<void>`

Cleans up all providers and resets the factory state.

```typescript
await OCRProviderFactory.destroy();
```

**Returns**: `Promise<void>`

### ImageProcessingService

Handles image enhancement and optimization for OCR processing.

#### Methods

##### `enhanceImage(image: Blob): Promise<EnhancedImage>`

Enhances an image for better OCR results.

```typescript
import { imageProcessingService } from '@scanner/services/imageProcessingService';

const enhanced = await imageProcessingService.enhanceImage(imageBlob);
console.log(enhanced.width, enhanced.height);
```

**Parameters**:
- `image: Blob` - The image to enhance

**Returns**: `Promise<EnhancedImage>` with:
- `original: Blob` - Original image
- `enhanced: Blob` - Enhanced image
- `width: number` - Image width
- `height: number` - Image height

##### `optimizeForOCR(image: Blob): Promise<Blob>`

Optimizes an image specifically for OCR processing.

```typescript
const optimized = await imageProcessingService.optimizeForOCR(imageBlob);
```

**Parameters**:
- `image: Blob` - The image to optimize

**Returns**: `Promise<Blob>` - Optimized image

##### `convertToPDF(images: Blob[]): Promise<Blob>`

Converts multiple images into a single PDF document.

```typescript
const pdf = await imageProcessingService.convertToPDF([image1, image2, image3]);
```

**Parameters**:
- `images: Blob[]` - Array of images to convert

**Returns**: `Promise<Blob>` - PDF document

### DocumentStorageService

Manages document persistence and retrieval in Supabase.

#### Methods

##### `saveDocument(document: ProcessedDocument): Promise<string>`

Saves a processed document to the database.

```typescript
import { documentStorageService } from '@scanner/services/documentStorageService';

const documentId = await documentStorageService.saveDocument({
  title: 'Invoice #123',
  category: 'financial',
  tags: ['invoice', 'client-abc'],
  textContent: 'Extracted text content...',
  ocrConfidence: 0.95,
  // ... other properties
});
```

**Parameters**:
- `document: ProcessedDocument` - The document to save

**Returns**: `Promise<string>` - The document ID
**Throws**: `Error` if save operation fails

##### `getDocument(id: string): Promise<ProcessedDocument>`

Retrieves a document by ID.

```typescript
const document = await documentStorageService.getDocument('doc-id-123');
console.log(document.title);
console.log(document.textContent);
```

**Parameters**:
- `id: string` - The document ID

**Returns**: `Promise<ProcessedDocument>`
**Throws**: `Error` if document not found

##### `listDocuments(filters: DocumentFilters): Promise<DocumentListResult>`

Lists documents with optional filtering.

```typescript
const results = await documentStorageService.listDocuments({
  category: 'financial',
  searchText: 'invoice',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date()
  },
  page: 1,
  pageSize: 20
});

console.log(`Found ${results.totalCount} documents`);
results.documents.forEach(doc => console.log(doc.title));
```

**Parameters**:
- `filters: DocumentFilters` - Filtering options

**Returns**: `Promise<DocumentListResult>` with:
- `documents: ProcessedDocument[]` - Array of documents
- `totalCount: number` - Total number of matching documents
- `page: number` - Current page number
- `pageSize: number` - Number of documents per page

##### `deleteDocument(id: string): Promise<boolean>`

Deletes a document and its associated files.

```typescript
const success = await documentStorageService.deleteDocument('doc-id-123');
```

**Parameters**:
- `id: string` - The document ID

**Returns**: `Promise<boolean>` - Success status

## Type Definitions

### OCRProvider

Enumeration of available OCR providers.

```typescript
enum OCRProvider {
  OpenAI = 'openai',
  Qwen = 'qwen',
  Azure = 'azure',
  Google = 'google',
  Fallback = 'fallback'
}
```

### OCROptions

Configuration options for OCR processing.

```typescript
interface OCROptions {
  provider?: OCRProvider;        // Preferred provider
  enhanceImage?: boolean;        // Apply image enhancement
  detectTables?: boolean;        // Detect table structures
  language?: string;             // Document language (ISO 639-1)
  timeout?: number;              // Request timeout in ms
  maxRetries?: number;           // Maximum retry attempts
  priority?: number;             // Processing priority (1-10)
  customPrompt?: string;         // Custom OCR prompt
}
```

### OCRResult

Result of OCR processing.

```typescript
interface OCRResult {
  text: string;                  // Extracted text
  confidence: number;            // Confidence score (0-1)
  provider: OCRProvider;         // Provider used
  processingTime: number;        // Processing time in ms
  blocks?: TextBlock[];          // Text blocks with positions
  tables?: TableData[];          // Detected tables
  rawResponse?: any;             // Raw provider response
  error?: OCRError;              // Error information (if any)
}
```

### ProcessedDocument

Complete document entity with metadata.

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
```

### ProviderStatus

Status information for an OCR provider.

```typescript
interface ProviderStatus {
  available: boolean;            // Provider availability
  quotaRemaining?: number;       // Remaining API quota
  rateLimited: boolean;          // Rate limit status
  lastError?: string;            // Last error message
}
```

### DocumentFilters

Filtering options for document queries.

```typescript
interface DocumentFilters {
  category?: string;             // Document category
  clientId?: string;             // Associated client ID
  projectId?: string;            // Associated project ID
  tags?: string[];               // Document tags
  dateRange?: DateRange;         // Date range filter
  searchText?: string;           // Full-text search
  page?: number;                 // Page number (1-based)
  pageSize?: number;             // Documents per page
}
```

## Environment Configuration

### Required Environment Variables

```env
# OCR Provider API Keys
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_QWEN_API_KEY=your_qwen_api_key
VITE_AZURE_VISION_KEY=your_azure_key

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Storage Configuration
VITE_STORAGE_BUCKET=scanner-documents
```

### Environment Utility Usage

The scanner services use the environment utility for consistent configuration:

```typescript
import { getEnvVar, isDevelopment, isProduction } from '@/utils/env';

// Get API key with fallback
const apiKey = getEnvVar('VITE_OPENAI_API_KEY', '');

// Environment checks
if (isDevelopment()) {
  console.log('Running in development mode');
}

if (isProduction()) {
  // Production-specific configuration
}
```

## Error Handling

### OCRError

Standard error type for OCR operations.

```typescript
interface OCRError {
  code: string;                  // Error code
  message: string;               // Human-readable message
  provider: OCRProvider;         // Provider that failed
  retryable: boolean;            // Whether retry is recommended
}
```

### Common Error Codes

- `PROVIDER_UNAVAILABLE` - OCR provider is not available
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `INVALID_IMAGE_FORMAT` - Unsupported image format
- `IMAGE_TOO_LARGE` - Image exceeds size limits
- `PROCESSING_TIMEOUT` - Processing timeout exceeded
- `INSUFFICIENT_QUOTA` - API quota exhausted
- `AUTHENTICATION_FAILED` - API key invalid or expired

### Error Handling Example

```typescript
try {
  const result = await OCRProviderFactory.processDocument(image);
  console.log('Success:', result.text);
} catch (error) {
  if (error instanceof OCRError) {
    console.error(`OCR Error [${error.code}]:`, error.message);
    
    if (error.retryable) {
      // Implement retry logic
      console.log('Retrying with different provider...');
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing Patterns

### Environment Variable Mocking

For consistent testing across different environments, mock the environment utility:

```typescript
// Mock at the top of test files
jest.mock('@/utils/env', () => ({
  getEnvVar: jest.fn((key, defaultValue = '') => {
    const envVars = {
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      VITE_AZURE_VISION_KEY: 'test-azure-key',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key'
    };
    return envVars[key] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true),
  isTestEnvironment: jest.fn(() => true)
}));
```

### Service Testing Pattern

```typescript
import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';
import { OCRProvider } from '@shared/types/scanner';

describe('OCRProviderFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset factory state for isolated tests
    (OCRProviderFactory as any).providers = new Map();
    (OCRProviderFactory as any).initialized = false;
  });

  afterEach(async () => {
    // Clean up after each test
    await OCRProviderFactory.destroy();
  });

  it('should initialize without errors', async () => {
    await expect(OCRProviderFactory.initialize()).resolves.not.toThrow();
    expect((OCRProviderFactory as any).initialized).toBe(true);
  });

  it('should return available providers', async () => {
    await OCRProviderFactory.initialize();
    const providers = OCRProviderFactory.getAvailableProviders();
    
    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toContain(OCRProvider.Fallback);
  });

  it('should handle provider status correctly', async () => {
    await OCRProviderFactory.initialize();
    const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);
    
    expect(status).toHaveProperty('available');
    expect(status).toHaveProperty('rateLimited');
    expect(typeof status.available).toBe('boolean');
    expect(typeof status.rateLimited).toBe('boolean');
  });
});
```

### Mock Data Factories

Create consistent test data:

```typescript
// Test utilities
export const createMockOCRResult = (overrides?: Partial<OCRResult>): OCRResult => ({
  text: 'Sample extracted text',
  confidence: 0.95,
  provider: OCRProvider.OpenAI,
  processingTime: 1500,
  blocks: [],
  tables: [],
  ...overrides
});

export const createMockDocument = (overrides?: Partial<ProcessedDocument>): ProcessedDocument => ({
  id: 'test-doc-1',
  title: 'Test Document',
  category: 'invoice',
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user',
  originalFile: {
    url: 'https://example.com/original.jpg',
    name: 'original.jpg',
    size: 1024,
    type: 'image/jpeg'
  },
  enhancedFile: {
    url: 'https://example.com/enhanced.jpg',
    size: 2048
  },
  textContent: 'Sample extracted text',
  ocrConfidence: 0.95,
  ocrLanguage: 'en',
  status: DocumentStatus.Complete,
  sharingSettings: {
    isShared: false,
    accessLevel: AccessLevel.View,
    sharedWith: []
  },
  accessLog: [],
  ...overrides
});
```

## API Rate Limits

### Provider-Specific Limits

| Provider | Requests/Minute | Requests/Hour | Requests/Day |
|----------|----------------|---------------|--------------|
| OpenAI   | 60             | 1,000         | 10,000       |
| Qwen     | 100            | 2,000         | 20,000       |
| Azure    | 120            | 3,000         | 30,000       |
| Fallback | Unlimited      | Unlimited     | Unlimited    |

### Rate Limiting Implementation

The factory automatically handles rate limiting:

```typescript
// Rate limiting is handled internally
const result = await OCRProviderFactory.processDocument(image);
// Will automatically switch providers if rate limited
```

## Performance Considerations

### Image Optimization

- **Maximum Resolution**: 2048x2048 pixels for OCR processing
- **Compression Quality**: 0.9 for optimal balance of quality and size
- **Format Conversion**: Automatic conversion to optimal formats
- **Batch Processing**: Support for multiple documents

### Caching Strategy

- **Result Caching**: OCR results cached for 24 hours
- **Image Caching**: Processed images cached for 1 hour
- **Provider Status**: Status cached for 5 minutes

### Database Optimization

- **Indexed Columns**: Full-text search on content, category, tags
- **Pagination**: Efficient pagination for large result sets
- **Connection Pooling**: Optimized database connections

## Security Considerations

### API Key Management

- Environment variables for API keys
- No hardcoded credentials in source code
- Separate keys for different environments

### Data Protection

- Row Level Security (RLS) on all database tables
- Encrypted file storage in Supabase
- Audit logging for all document access
- Secure sharing with permission controls

### Input Validation

- File type validation before processing
- File size limits to prevent abuse
- Image format verification
- Content sanitization for extracted text

## Migration Guide

### From Legacy OCR Implementation

If migrating from a previous OCR implementation:

1. **Update Imports**:
   ```typescript
   // Old
   import { ocrService } from '@/services/ocrService';
   
   // New
   import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';
   ```

2. **Update Initialization**:
   ```typescript
   // Old
   ocrService.initialize();
   
   // New
   await OCRProviderFactory.initialize();
   ```

3. **Update Processing Calls**:
   ```typescript
   // Old
   const result = await ocrService.extractText(image);
   
   // New
   const result = await OCRProviderFactory.processDocument(image);
   ```

### Breaking Changes

- `extractText()` method renamed to `processDocument()`
- Initialization is now async and required
- Provider management is now centralized
- Error types have changed to `OCRError`

## Support and Troubleshooting

### Common Issues

1. **Provider Initialization Fails**
   - Check API key configuration
   - Verify network connectivity
   - Check provider service status

2. **Rate Limiting Errors**
   - Monitor API usage
   - Implement request queuing
   - Use multiple providers for load balancing

3. **Poor OCR Accuracy**
   - Enable image enhancement
   - Check image quality and resolution
   - Try different providers for comparison

### Debug Mode

Enable debug logging in development:

```typescript
// Set environment variable
VITE_DEBUG_OCR=true

// Or programmatically
OCRProviderFactory.setDebugMode(true);
```

### Monitoring

Monitor OCR performance:

```typescript
// Get provider statistics
const stats = OCRProviderFactory.getStatistics();
console.log('Total requests:', stats.totalRequests);
console.log('Success rate:', stats.successRate);
console.log('Average processing time:', stats.averageProcessingTime);
```