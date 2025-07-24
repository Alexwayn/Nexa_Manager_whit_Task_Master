# OCR Provider Factory Documentation

## Overview

The OCR Provider Factory is a comprehensive system for managing multiple OCR (Optical Character Recognition) providers with intelligent fallback, rate limiting, and error handling. It provides a unified interface for text extraction while handling the complexities of different API providers.

## Architecture

### Factory Pattern

The system uses the Factory pattern to create and manage OCR providers:

```typescript
export class OCRProviderFactory {
  private static providers: Map<OCRProvider, IOCRProvider> = new Map();
  private static initialized = false;

  static async initialize(): Promise<void>
  static getProvider(providerType: OCRProvider): IOCRProvider | null
  static getAvailableProviders(): OCRProvider[]
  static getProviderStatus(providerType: OCRProvider): ProviderStatus
  static getAllProviderStatuses(): Map<OCRProvider, ProviderStatus>
  static async destroy(): Promise<void>
}
```

### Provider Interface

All providers implement the `IOCRProvider` interface:

```typescript
export interface IOCRProvider {
  readonly name: OCRProvider;
  extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>>;
  isAvailable(): boolean;
  getStatus(): ProviderStatus;
  initialize(): Promise<void>;
  destroy(): void;
}
```

### Base Provider Class

The `BaseOCRProvider` provides common functionality:

```typescript
export abstract class BaseOCRProvider implements IOCRProvider {
  protected config: OCRProviderConfig;
  protected requestCount = 0;
  protected lastRequestTime = 0;
  protected rateLimitResetTime = 0;
  protected lastError: string | null = null;

  // Common methods for rate limiting, error handling, etc.
  protected isRateLimited(): boolean
  protected updateRequestTracking(): void
  protected createOCRError(code: string, message: string, retryable = false): OCRError
  protected async blobToBase64(blob: Blob): Promise<string>
}
```

## Provider Implementations

### OpenAI Vision Provider

**Features:**
- Uses GPT-4 Vision Preview model
- Advanced image optimization (max 2048x2048, 20MB)
- Request queuing with rate limiting (60 req/min, 1000 req/hour)
- Comprehensive error handling
- Table detection and structure preservation
- Confidence estimation based on response quality

**Configuration:**
```typescript
{
  apiKey: process.env.VITE_OPENAI_API_KEY,
  endpoint: 'https://api.openai.com/v1/chat/completions',
  timeout: 30000,
  maxRetries: 3,
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000
  }
}
```

**Image Optimization:**
- Automatic resizing to optimal dimensions (max 2048x2048)
- Format conversion to JPEG with 90% quality
- Size validation (20MB limit)
- Maintains aspect ratio

**Error Handling:**
- HTTP 429 (Rate Limited): Automatic retry with backoff
- HTTP 402 (Quota Exceeded): Provider switching
- Timeout errors: Configurable timeout with retry
- Network errors: Retry with exponential backoff

### Qwen OCR Provider

**Features:**
- Uses Qwen-VL-OCR model
- Cost-effective alternative to OpenAI
- Image optimization (max 1920x1920, 10MB)
- Multi-language support
- Rate limiting (30 req/min, 500 req/hour)
- Table structure detection

**Configuration:**
```typescript
{
  apiKey: process.env.VITE_QWEN_API_KEY,
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  timeout: 30000,
  maxRetries: 3,
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 500
  }
}
```

**Image Optimization:**
- Resizing to Qwen-optimal dimensions (max 1920x1920)
- JPEG compression with 85% quality
- 10MB size limit
- Format validation

### Fallback Provider

**Features:**
- Always available (no external dependencies)
- Provides manual input prompt
- Consistent interface
- Immediate response

**Use Cases:**
- All other providers are unavailable
- API quotas exceeded
- Network connectivity issues
- Development/testing scenarios

## Intelligent Fallback System

### FallbackOCRService

The `FallbackOCRService` provides advanced retry logic and degradation strategies:

```typescript
export interface FallbackStrategy {
  maxRetries: number;
  retryDelay: number;
  providerPriority: OCRProvider[];
  degradationSteps: DegradationStep[];
}
```

### Degradation Actions

1. **REDUCE_IMAGE_QUALITY**: Reduces image quality by 20% to handle size/processing issues
2. **SIMPLIFY_PROMPT**: Disables table detection and reduces timeout for faster processing
3. **INCREASE_TIMEOUT**: Extends timeout by 1.5x multiplier for slow responses
4. **SWITCH_PROVIDER**: Moves to next available provider in priority list
5. **USE_BASIC_OCR**: Forces use of fallback provider
6. **MANUAL_INPUT**: Stops processing and requests manual input

### Default Strategy

```typescript
private defaultStrategy: FallbackStrategy = {
  maxRetries: 3,
  retryDelay: 1000,
  providerPriority: [
    OCRProvider.OpenAI,
    OCRProvider.Qwen,
    OCRProvider.Fallback
  ],
  degradationSteps: [
    {
      condition: (error, attempt) => error.code === 'TIMEOUT' && attempt < 2,
      action: DegradationAction.INCREASE_TIMEOUT,
      parameters: { timeoutMultiplier: 1.5 }
    },
    {
      condition: (error, attempt) => error.code === 'RATE_LIMITED' && attempt < 3,
      action: DegradationAction.SWITCH_PROVIDER
    },
    {
      condition: (error, attempt) => error.code.startsWith('HTTP_') && attempt < 2,
      action: DegradationAction.REDUCE_IMAGE_QUALITY,
      parameters: { qualityReduction: 0.2 }
    },
    {
      condition: (error, _attempt) => error.code === 'QUOTA_EXCEEDED',
      action: DegradationAction.SWITCH_PROVIDER
    },
    {
      condition: (_error, attempt) => attempt >= 2,
      action: DegradationAction.USE_BASIC_OCR
    }
  ]
};
```

## Rate Limiting & Quota Management

### Per-Provider Rate Limiting

Each provider has configurable rate limits:

```typescript
interface OCRProviderConfig {
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}
```

### Implementation

- **Token Bucket Algorithm**: Prevents exceeding rate limits
- **Request Queuing**: Queues requests when rate limited
- **Automatic Delays**: Calculates optimal delays between requests
- **Quota Tracking**: Monitors daily/hourly usage
- **Header Parsing**: Extracts quota info from API response headers

### Status Monitoring

```typescript
interface ProviderStatus {
  available: boolean;
  quotaRemaining?: number;
  rateLimited: boolean;
  lastError?: string;
}
```

## Error Handling

### OCR Error Types

```typescript
interface OCRError {
  code: string;
  message: string;
  provider: OCRProvider;
  retryable: boolean;
}
```

### Common Error Codes

- **PROVIDER_UNAVAILABLE**: Provider not configured or initialized
- **RATE_LIMITED**: Rate limit exceeded, retry after delay
- **QUOTA_EXCEEDED**: API quota exhausted
- **TIMEOUT**: Request timed out
- **HTTP_4XX/5XX**: HTTP error responses
- **INVALID_RESPONSE**: Malformed API response
- **API_ERROR**: Generic API error
- **ALL_PROVIDERS_FAILED**: All providers exhausted

### Error Recovery

1. **Immediate Retry**: For transient network errors
2. **Delayed Retry**: For rate limiting with exponential backoff
3. **Provider Switch**: For quota/availability issues
4. **Degradation**: Reduce quality/complexity for processing issues
5. **Fallback**: Manual input when all else fails

## Usage Examples

### Basic Usage

```typescript
import { OCRProviderFactory } from '@/services/scanner/ocrProviderFactory';

// Initialize factory
await OCRProviderFactory.initialize();

// Get provider
const provider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);
if (provider && provider.isAvailable()) {
  const result = await provider.extractText(imageBlob, {
    detectTables: true,
    language: 'en'
  });
  console.log('Extracted text:', result.text);
}
```

### With Fallback Service

```typescript
import { AIOCRService } from '@/services/scanner/ocrService';

const ocrService = new AIOCRService();

// Automatic provider selection and fallback
const result = await ocrService.extractText(imageBlob, {
  provider: OCRProvider.OpenAI, // Preferred
  detectTables: true,
  maxRetries: 3
});
```

### Health Monitoring

```typescript
// Check overall health
const healthCheck = await ocrService.healthCheck();
console.log('Healthy:', healthCheck.healthy);
console.log('Available providers:', healthCheck.availableProviders);
console.log('Issues:', healthCheck.issues);

// Check individual provider status
const statuses = OCRProviderFactory.getAllProviderStatuses();
for (const [provider, status] of statuses) {
  console.log(`${provider}:`, {
    available: status.available,
    rateLimited: status.rateLimited,
    quotaRemaining: status.quotaRemaining,
    lastError: status.lastError
  });
}
```

### Custom Fallback Strategy

```typescript
import { FallbackOCRService } from '@/services/scanner/fallbackOCRService';

const fallbackService = new FallbackOCRService();

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

## Configuration

### Environment Variables

```env
# Required for OpenAI provider
VITE_OPENAI_API_KEY=sk-your-openai-api-key

# Required for Qwen provider  
VITE_QWEN_API_KEY=your-qwen-api-key

# Optional: Override default timeouts
VITE_OCR_TIMEOUT=30000

# Optional: Override rate limits
VITE_OPENAI_RATE_LIMIT_PER_MINUTE=60
VITE_QWEN_RATE_LIMIT_PER_MINUTE=30
```

### Provider Configuration

```typescript
const providerConfigs = new Map<OCRProvider, OCRProviderConfig>([
  [OCRProvider.OpenAI, {
    apiKey: process.env.VITE_OPENAI_API_KEY,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    timeout: 30000,
    maxRetries: 3,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  }],
  [OCRProvider.Qwen, {
    apiKey: process.env.VITE_QWEN_API_KEY,
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    timeout: 30000,
    maxRetries: 3,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 500
    }
  }]
]);
```

## Performance Considerations

### Image Optimization

- **Automatic Resizing**: Reduces processing time and API costs
- **Format Conversion**: Optimizes for each provider's requirements
- **Quality Adjustment**: Balances file size with OCR accuracy
- **Caching**: Avoids re-processing identical images

### Request Management

- **Connection Pooling**: Reuses HTTP connections
- **Request Queuing**: Prevents overwhelming APIs
- **Parallel Processing**: Processes multiple images concurrently
- **Timeout Management**: Prevents hanging requests

### Memory Management

- **Blob Cleanup**: Releases image data after processing
- **Provider Cleanup**: Properly destroys providers on shutdown
- **Cache Limits**: Prevents memory leaks from caching

## Testing

### Unit Tests

```typescript
describe('OCRProviderFactory', () => {
  test('should initialize providers correctly', async () => {
    await OCRProviderFactory.initialize();
    const providers = OCRProviderFactory.getAvailableProviders();
    expect(providers.length).toBeGreaterThan(0);
  });

  test('should handle provider failures gracefully', async () => {
    const provider = OCRProviderFactory.getProvider(OCRProvider.OpenAI);
    // Mock API failure
    const result = await provider.extractText(mockImage);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('OCR Integration', () => {
  test('should extract text from real image', async () => {
    const ocrService = new AIOCRService();
    const result = await ocrService.extractText(testImage);
    expect(result.text).toContain('expected text');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should fallback when primary provider fails', async () => {
    // Mock primary provider failure
    const result = await ocrService.extractText(testImage);
    expect(result.provider).toBe(OCRProvider.Qwen); // Fallback provider
  });
});
```

## Troubleshooting

### Common Issues

**Provider Not Available**
- Check API key configuration
- Verify network connectivity
- Check provider status endpoint

**Rate Limiting**
- Monitor request frequency
- Implement request queuing
- Consider upgrading API plan

**Poor OCR Accuracy**
- Improve image quality
- Try different providers
- Enable table detection
- Adjust image preprocessing

**Timeout Errors**
- Increase timeout values
- Reduce image size
- Check network latency
- Use faster provider

### Debug Configuration

```typescript
const debugConfig = {
  enableLogging: true,
  logLevel: 'debug',
  saveFailedRequests: true,
  trackPerformance: true
};
```

## Future Enhancements

### Planned Features

- **Azure Computer Vision**: Additional provider option
- **Google Cloud Vision**: Enterprise-grade OCR
- **Custom Model Support**: Local/private model integration
- **Batch Processing**: Multiple images in single request
- **Result Caching**: Cache OCR results to reduce API calls
- **A/B Testing**: Compare provider accuracy
- **Cost Optimization**: Automatic provider selection based on cost

### API Extensions

- **Webhook Support**: Async processing notifications
- **Streaming Results**: Real-time text extraction
- **Custom Prompts**: User-defined extraction prompts
- **Template Matching**: Document template recognition
- **Multi-language Detection**: Automatic language identification

---

This OCR Provider Factory provides a robust, scalable foundation for document text extraction with enterprise-grade reliability and performance.