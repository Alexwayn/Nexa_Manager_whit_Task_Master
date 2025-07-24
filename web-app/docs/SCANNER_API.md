# Scanner System API Documentation

## Overview

The Scanner System API provides comprehensive document digitization capabilities through a multi-provider OCR architecture with intelligent fallback mechanisms.

## Core Services

### DocumentStorageService

Comprehensive document storage and management service with Supabase integration.

#### Methods

##### `saveDocument(document: ProcessedDocument): Promise<string>`
Saves a processed document to the database with full metadata and file references.

```typescript
const documentId = await storageService.saveDocument({
  title: 'Invoice #12345',
  category: 'invoices',
  tags: ['client-abc', 'q1-2024'],
  clientId: 'client-123',
  textContent: 'Extracted text content...',
  ocrConfidence: 0.95,
  // ... other document properties
});
```

##### `getDocument(id: string): Promise<ProcessedDocument>`
Retrieves a document by ID with all metadata and file information.

```typescript
const document = await storageService.getDocument('doc_123');
console.log('Document title:', document.title);
console.log('Text content:', document.textContent);
```

##### `listDocuments(filters?: DocumentFilters): Promise<DocumentListResult>`
Lists documents with advanced filtering, pagination, and search capabilities.

```typescript
const result = await storageService.listDocuments({
  category: 'invoices',
  clientId: 'client-123',
  tags: ['urgent'],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  searchText: 'invoice',
  page: 1,
  pageSize: 20
});

console.log('Documents:', result.documents);
console.log('Total count:', result.totalCount);
```

##### `searchDocuments(searchQuery: string, filters?: DocumentFilters): Promise<DocumentListResult>`
Performs full-text search across document content and metadata.

```typescript
const searchResults = await storageService.searchDocuments('contract terms', {
  category: 'contracts',
  clientId: 'client-456'
});
```

##### `updateDocument(id: string, updates: Partial<ProcessedDocument>): Promise<ProcessedDocument>`
Updates document metadata and properties.

```typescript
const updatedDoc = await storageService.updateDocument('doc_123', {
  title: 'Updated Invoice Title',
  tags: ['processed', 'paid'],
  status: DocumentStatus.Complete
});
```

##### `deleteDocument(id: string): Promise<boolean>`
Deletes a document and all associated files from storage.

```typescript
const success = await storageService.deleteDocument('doc_123');
if (success) {
  console.log('Document deleted successfully');
}
```

##### `storeTemporaryFile(file: Blob, fileName: string, userId: string): Promise<string>`
Stores a file temporarily during processing workflow.

```typescript
const tempPath = await storageService.storeTemporaryFile(
  imageBlob, 
  'document.jpg', 
  'user-123'
);
```

##### `moveToPermStorage(tempPath: string, permanentPath: string): Promise<string>`
Moves a file from temporary to permanent storage and returns the public URL.

```typescript
const permanentUrl = await storageService.moveToPermStorage(
  tempPath, 
  'documents/user-123/doc_456.jpg'
);
```

##### `getDocumentStatistics(userId?: string): Promise<DocumentStatistics>`
Retrieves comprehensive document usage and storage statistics.

```typescript
const stats = await storageService.getDocumentStatistics('user-123');
console.log('Total documents:', stats.totalDocuments);
console.log('Storage used:', stats.totalSize);
console.log('By category:', stats.byCategory);
console.log('Recent documents:', stats.recentDocuments);
```

##### `cleanupOldTemporaryFiles(): Promise<void>`
Automatically cleans up temporary files older than 1 hour.

```typescript
await storageService.cleanupOldTemporaryFiles();
```

#### Database Schema

The service uses the following Supabase tables:

**scanned_documents**
```sql
CREATE TABLE scanned_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  client_id TEXT,
  project_id TEXT,
  created_by TEXT NOT NULL,
  original_file_url TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  original_file_size BIGINT NOT NULL,
  original_file_type TEXT NOT NULL,
  enhanced_file_url TEXT NOT NULL,
  enhanced_file_size BIGINT NOT NULL,
  pdf_file_url TEXT,
  pdf_file_size BIGINT,
  text_content TEXT NOT NULL,
  ocr_confidence DECIMAL(3,2) NOT NULL,
  ocr_language TEXT NOT NULL,
  status TEXT NOT NULL,
  processing_errors TEXT[],
  sharing_settings JSONB,
  access_log JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Storage Buckets**
- `scanner-documents` - Permanent document storage
- `scanner-temp` - Temporary file storage during processing

#### Security Features

- **Row Level Security (RLS)** - Users can only access their own documents
- **Bucket Policies** - Secure file access with proper authentication
- **Access Logging** - Complete audit trail of document access
- **Data Isolation** - Organization-based data separation
- **Encrypted Storage** - Files encrypted at rest in Supabase

### OCRProviderFactory

Central factory for managing OCR providers.

#### Methods

##### `initialize(): Promise<void>`
Initializes all configured OCR providers.

```typescript
await OCRProviderFactory.initialize();
```

##### `getProvider(providerType: OCRProvider): IOCRProvider | null`
Retrieves a specific OCR provider instance.

```typescript
const provider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);
```

##### `getAvailableProviders(): OCRProvider[]`
Returns list of currently available providers.

```typescript
const providers = OCRProviderFactory.getAvailableProviders();
// Returns: [OCRProvider.OpenAI, OCRProvider.Qwen, OCRProvider.Fallback]
```

##### `getProviderStatus(providerType: OCRProvider): ProviderStatus`
Gets current status of a specific provider.

```typescript
const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);
// Returns: { available: true, rateLimited: false, quotaRemaining: 950 }
```

##### `getAllProviderStatuses(): Map<OCRProvider, ProviderStatus>`
Gets status of all providers.

```typescript
const statuses = OCRProviderFactory.getAllProviderStatuses();
for (const [provider, status] of statuses) {
  console.log(`${provider}: ${status.available ? 'Available' : 'Unavailable'}`);
}
```

### AIOCRService

Main OCR service with intelligent provider selection and fallback.

#### Constructor

```typescript
const ocrService = new AIOCRService();
```

#### Methods

##### `extractText(image: Blob, options?: OCROptions): Promise<OCRResult>`
Extracts text from an image with automatic provider selection and fallback.

**Parameters:**
- `image: Blob` - Image data to process
- `options?: OCROptions` - Optional configuration

**OCROptions:**
```typescript
interface OCROptions {
  provider?: OCRProvider;        // Preferred provider
  enhanceImage?: boolean;        // Enable image enhancement
  detectTables?: boolean;        // Enable table detection
  language?: string;             // Document language
  timeout?: number;              // Request timeout (ms)
  maxRetries?: number;           // Maximum retry attempts
}
```

**Returns:** `Promise<OCRResult>`
```typescript
interface OCRResult {
  text: string;                  // Extracted text
  confidence: number;            // Confidence score (0-1)
  provider: OCRProvider;         // Provider used
  processingTime: number;        // Processing time (ms)
  blocks?: TextBlock[];          // Text blocks with positions
  tables?: TableData[];          // Detected tables
  rawResponse?: any;             // Raw provider response
  error?: OCRError;              // Error information
}
```

**Example:**
```typescript
const result = await ocrService.extractText(imageBlob, {
  provider: OCRProvider.OpenAI,
  detectTables: true,
  language: 'en',
  timeout: 30000,
  maxRetries: 3
});

console.log('Text:', result.text);
console.log('Confidence:', result.confidence);
console.log('Provider:', result.provider);
```

##### `getAvailableProviders(): OCRProvider[]`
Returns list of available providers.

##### `setPreferredProvider(provider: OCRProvider): void`
Sets the preferred provider for future requests.

```typescript
ocrService.setPreferredProvider(OCRProvider.Qwen);
```

##### `getProviderStatus(provider: OCRProvider): ProviderStatus`
Gets status of a specific provider.

##### `getAllProviderStatuses(): Map<OCRProvider, ProviderStatus>`
Gets status of all providers.

##### `healthCheck(): Promise<HealthCheckResult>`
Performs comprehensive health check of the OCR system.

```typescript
const health = await ocrService.healthCheck();
// Returns: { healthy: true, availableProviders: [...], issues: [] }
```

##### `getRecommendedProvider(): OCRProvider | null`
Gets the currently recommended provider based on availability and performance.

##### `destroy(): Promise<void>`
Cleans up resources and destroys the service.

### FallbackOCRService

Advanced fallback service with degradation strategies.

#### Constructor

```typescript
const fallbackService = new FallbackOCRService();
```

#### Methods

##### `extractTextWithFallback(image: Blob, options?: OCROptions, strategy?: Partial<FallbackStrategy>): Promise<OCRResult>`
Extracts text with custom fallback strategy.

**FallbackStrategy:**
```typescript
interface FallbackStrategy {
  maxRetries: number;
  retryDelay: number;
  providerPriority: OCRProvider[];
  degradationSteps: DegradationStep[];
}
```

**Example:**
```typescript
const customStrategy = {
  maxRetries: 5,
  retryDelay: 2000,
  providerPriority: [OCRProvider.Qwen, OCRProvider.OpenAI],
  degradationSteps: [
    {
      condition: (error, attempt) => error.code === 'TIMEOUT',
      action: DegradationAction.REDUCE_IMAGE_QUALITY,
      parameters: { qualityReduction: 0.3 }
    }
  ]
};

const result = await fallbackService.extractTextWithFallback(
  imageBlob,
  { detectTables: true },
  customStrategy
);
```

### OCRResultHandler

Processes and formats OCR results.

#### Methods

##### `formatText(result: OCRResult): string`
Formats raw OCR text with cleanup and enhancement.

```typescript
const handler = new OCRResultHandler();
const cleanText = handler.formatText(ocrResult);
```

##### `mergeResults(results: OCRResult[]): OCRResult`
Intelligently merges results from multiple providers.

```typescript
const mergedResult = handler.mergeResults([result1, result2, result3]);
```

##### `extractStructuredData(result: OCRResult): StructuredData`
Extracts structured data from OCR text.

```typescript
const structuredData = handler.extractStructuredData(ocrResult);
// Returns: { title, date, amount, entities, keyValuePairs, documentType }
```

##### `getFormattedHTML(result: OCRResult): string`
Converts OCR result to formatted HTML.

```typescript
const html = handler.getFormattedHTML(ocrResult);
```

##### `calculateConfidenceScore(result: OCRResult): number`
Calculates enhanced confidence score with provider-specific adjustments.

## Provider-Specific APIs

### OpenAI Vision Provider

#### Configuration
```typescript
{
  apiKey: string;
  endpoint: 'https://api.openai.com/v1/chat/completions';
  timeout: 30000;
  maxRetries: 3;
  rateLimit: {
    requestsPerMinute: 60;
    requestsPerHour: 1000;
  };
}
```

#### Features
- GPT-4 Vision Preview model
- Advanced image optimization (max 2048x2048, 20MB)
- Request queuing with rate limiting
- Table detection and structure preservation
- Confidence estimation based on response quality

#### Error Codes
- `RATE_LIMITED` - Rate limit exceeded
- `QUOTA_EXCEEDED` - API quota exhausted
- `TIMEOUT` - Request timed out
- `HTTP_4XX/5XX` - HTTP error responses
- `INVALID_RESPONSE` - Malformed API response

### Qwen OCR Provider

#### Configuration
```typescript
{
  apiKey: string;
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  timeout: 30000;
  maxRetries: 3;
  rateLimit: {
    requestsPerMinute: 30;
    requestsPerHour: 500;
  };
}
```

#### Features
- Qwen-VL-OCR model
- Cost-effective alternative
- Image optimization (max 1920x1920, 10MB)
- Multi-language support
- Table structure detection

### Fallback Provider

#### Features
- Always available (no external dependencies)
- Provides manual input prompt
- Immediate response
- Consistent interface

## Error Handling

### OCRError Interface

```typescript
interface OCRError {
  code: string;           // Error code
  message: string;        // Human-readable message
  provider: OCRProvider;  // Provider that generated error
  retryable: boolean;     // Whether error is retryable
}
```

### Common Error Codes

| Code | Description | Retryable | Action |
|------|-------------|-----------|---------|
| `PROVIDER_UNAVAILABLE` | Provider not configured | No | Check configuration |
| `RATE_LIMITED` | Rate limit exceeded | Yes | Wait and retry |
| `QUOTA_EXCEEDED` | API quota exhausted | No | Switch provider |
| `TIMEOUT` | Request timed out | Yes | Retry with longer timeout |
| `HTTP_4XX` | Client error | Depends | Check request format |
| `HTTP_5XX` | Server error | Yes | Retry with backoff |
| `INVALID_RESPONSE` | Malformed response | Yes | Retry or switch provider |
| `ALL_PROVIDERS_FAILED` | All providers exhausted | No | Use fallback |

### Error Recovery Strategies

1. **Immediate Retry**: For transient network errors
2. **Delayed Retry**: For rate limiting with exponential backoff
3. **Provider Switch**: For quota/availability issues
4. **Image Degradation**: Reduce quality for processing issues
5. **Prompt Simplification**: Disable complex features
6. **Manual Fallback**: Request manual input

## Rate Limiting

### Implementation
- **Token Bucket Algorithm**: Prevents exceeding rate limits
- **Request Queuing**: Queues requests when rate limited
- **Automatic Delays**: Calculates optimal delays between requests
- **Quota Tracking**: Monitors daily/hourly usage

### Configuration
```typescript
interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
}
```

### Monitoring
```typescript
interface ProviderStatus {
  available: boolean;
  quotaRemaining?: number;
  rateLimited: boolean;
  lastError?: string;
}
```

## Usage Examples

### Basic Text Extraction

```typescript
import { AIOCRService } from '@/services/scanner/ocrService';

const ocrService = new AIOCRService();

try {
  const result = await ocrService.extractText(imageBlob, {
    provider: OCRProvider.OpenAI,
    detectTables: true,
    language: 'en'
  });
  
  console.log('Extracted text:', result.text);
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.processingTime);
} catch (error) {
  console.error('OCR failed:', error);
}
```

### Provider Status Monitoring

```typescript
// Check all provider statuses
const statuses = ocrService.getAllProviderStatuses();
for (const [provider, status] of statuses) {
  console.log(`${provider}:`, {
    available: status.available,
    rateLimited: status.rateLimited,
    quotaRemaining: status.quotaRemaining
  });
}

// Health check
const health = await ocrService.healthCheck();
if (!health.healthy) {
  console.warn('OCR system issues:', health.issues);
}
```

### Custom Fallback Strategy

```typescript
import { FallbackOCRService, DegradationAction } from '@/services/scanner/fallbackOCRService';

const fallbackService = new FallbackOCRService();

const customStrategy = {
  maxRetries: 5,
  retryDelay: 1500,
  providerPriority: [OCRProvider.Qwen, OCRProvider.OpenAI],
  degradationSteps: [
    {
      condition: (error, attempt) => error.code === 'TIMEOUT' && attempt < 3,
      action: DegradationAction.INCREASE_TIMEOUT,
      parameters: { timeoutMultiplier: 2.0 }
    },
    {
      condition: (error) => error.code.startsWith('HTTP_5'),
      action: DegradationAction.SWITCH_PROVIDER
    }
  ]
};

const result = await fallbackService.extractTextWithFallback(
  imageBlob,
  { detectTables: true },
  customStrategy
);
```

### Result Processing

```typescript
import { OCRResultHandler } from '@/services/scanner/ocrResultHandler';

const handler = new OCRResultHandler();

// Format and clean text
const cleanText = handler.formatText(ocrResult);

// Extract structured data
const structuredData = handler.extractStructuredData(ocrResult);
console.log('Document type:', structuredData.documentType);
console.log('Extracted date:', structuredData.date);
console.log('Amount:', structuredData.amount);

// Generate HTML
const html = handler.getFormattedHTML(ocrResult);

// Enhanced confidence score
const enhancedConfidence = handler.calculateConfidenceScore(ocrResult);
```

### Multiple Provider Results

```typescript
// Get results from multiple providers
const providers = [OCRProvider.OpenAI, OCRProvider.Qwen];
const results = await Promise.allSettled(
  providers.map(provider => 
    ocrService.extractText(imageBlob, { provider })
  )
);

// Merge successful results
const successfulResults = results
  .filter(result => result.status === 'fulfilled')
  .map(result => result.value);

if (successfulResults.length > 1) {
  const mergedResult = handler.mergeResults(successfulResults);
  console.log('Merged text:', mergedResult.text);
  console.log('Combined confidence:', mergedResult.confidence);
}
```

## Performance Optimization

### Image Preprocessing
- Automatic resizing to optimal dimensions
- Format conversion for each provider
- Quality adjustment for file size optimization
- Caching to avoid re-processing

### Request Management
- Connection pooling for HTTP requests
- Request queuing to prevent API overwhelming
- Parallel processing for multiple images
- Timeout management to prevent hanging

### Memory Management
- Automatic blob cleanup after processing
- Provider resource cleanup on shutdown
- Cache size limits to prevent memory leaks

## Testing

### Unit Test Example

```typescript
import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';

describe('OCRProviderFactory', () => {
  beforeAll(async () => {
    await OCRProviderFactory.initialize();
  });

  test('should return available providers', () => {
    const providers = OCRProviderFactory.getAvailableProviders();
    expect(providers).toContain(OCRProvider.Fallback);
  });

  test('should handle provider status correctly', () => {
    const status = OCRProviderFactory.getProviderStatus(OCRProvider.OpenAI);
    expect(status).toHaveProperty('available');
    expect(status).toHaveProperty('rateLimited');
  });
});
```

### Integration Test Example

```typescript
import { AIOCRService } from '@/services/scanner/ocrService';

describe('OCR Integration', () => {
  let ocrService: AIOCRService;

  beforeEach(() => {
    ocrService = new AIOCRService();
  });

  test('should extract text from image', async () => {
    const mockImage = new Blob(['mock image data'], { type: 'image/jpeg' });
    const result = await ocrService.extractText(mockImage);
    
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.provider).toBeDefined();
  });

  test('should handle provider failures gracefully', async () => {
    // Mock all providers to fail except fallback
    const result = await ocrService.extractText(mockImage);
    expect(result.provider).toBe(OCRProvider.Fallback);
  });
});
```

---

This API documentation provides comprehensive coverage of the Scanner System's OCR capabilities, enabling developers to effectively integrate and extend the document digitization functionality.