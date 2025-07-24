// AI OCR service implementation
import type { 
  AIOCRService as IAIOCRService, 
  OCRResult, 
  OCROptions, 
  ProviderStatus,
  OCRError
} from '@/types/scanner';
import { OCRProvider } from '@/types/scanner';
import { OCRProviderFactory } from './ocrProviderFactory';
import { FallbackOCRService, type FallbackStrategy } from './fallbackOCRService';

export class AIOCRService implements IAIOCRService {
  private preferredProvider: OCRProvider = OCRProvider.OpenAI;
  private initialized = false;
  private fallbackService: FallbackOCRService;

  constructor() {
    this.fallbackService = new FallbackOCRService();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await OCRProviderFactory.initialize();
      this.initialized = true;
      
      // Set preferred provider to first available provider if current is not available
      const availableProviders = this.getAvailableProviders();
      if (availableProviders.length > 0 && !availableProviders.includes(this.preferredProvider)) {
        this.preferredProvider = availableProviders[0];
      }
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw new Error('OCR service initialization failed');
    }
  }

  async extractText(image: Blob, options?: OCROptions): Promise<OCRResult> {
    await this.initialize();

    // Use fallback service for robust extraction with automatic retry and degradation
    const fallbackStrategy: Partial<FallbackStrategy> = {
      providerPriority: [
        options?.provider || this.preferredProvider,
        ...this.getAlternativeProviders(options?.provider || this.preferredProvider)
      ],
      maxRetries: options?.maxRetries || 3
    };

    try {
      return await this.fallbackService.extractTextWithFallback(image, options, fallbackStrategy);
    } catch (error) {
      // If fallback service fails, try one more time with basic extraction
      return this.attemptBasicExtraction(image, options);
    }
  }

  private getAlternativeProviders(primaryProvider: OCRProvider): OCRProvider[] {
    const allProviders = [OCRProvider.OpenAI, OCRProvider.Qwen, OCRProvider.Fallback];
    return allProviders.filter(provider => provider !== primaryProvider);
  }

  private async attemptBasicExtraction(image: Blob, options?: OCROptions): Promise<OCRResult> {
    // Last resort: try direct provider access
    const availableProviders = this.getAvailableProviders();
    
    for (const providerType of availableProviders) {
      try {
        const result = await this.attemptExtraction(image, providerType, options, 15000);
        return result;
      } catch (error) {
        continue; // Try next provider
      }
    }

    // Absolute fallback
    return {
      text: '[OCR Extraction Failed]\n\nAll automatic text extraction methods have failed. Please manually enter the text content from the document.',
      confidence: 0.1,
      provider: OCRProvider.Fallback,
      processingTime: 0,
      error: {
        code: 'ALL_PROVIDERS_FAILED',
        message: 'All OCR providers failed to extract text',
        provider: OCRProvider.Fallback,
        retryable: false
      }
    };
  }

  private async attemptExtraction(
    image: Blob, 
    provider: OCRProvider, 
    options?: OCROptions,
    timeout = 30000
  ): Promise<OCRResult> {
    const providerInstance = OCRProviderFactory.getProvider(provider);
    
    if (!providerInstance) {
      throw {
        code: 'PROVIDER_NOT_FOUND',
        message: `OCR provider ${provider} not available`,
        provider,
        retryable: false
      } as OCRError;
    }

    if (!providerInstance.isAvailable()) {
      throw {
        code: 'PROVIDER_UNAVAILABLE',
        message: `OCR provider ${provider} is not available`,
        provider,
        retryable: false
      } as OCRError;
    }

    const startTime = Date.now();
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject({
            code: 'TIMEOUT',
            message: `OCR request timed out after ${timeout}ms`,
            provider,
            retryable: true
          } as OCRError);
        }, timeout);
      });

      // Race between the actual extraction and timeout
      const extractionPromise = providerInstance.extractText(image, options);
      const partialResult = await Promise.race([extractionPromise, timeoutPromise]);
      
      const processingTime = Date.now() - startTime;
      
      // Ensure we have all required fields for OCRResult
      const result: OCRResult = {
        text: partialResult.text || '',
        confidence: partialResult.confidence || 0,
        provider,
        processingTime,
        blocks: partialResult.blocks,
        tables: partialResult.tables,
        rawResponse: partialResult.rawResponse,
        error: partialResult.error
      };

      return result;
    } catch (error) {
      // If it's already an OCRError, just rethrow
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      // Convert generic errors to OCRError
      throw {
        code: 'EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown extraction error',
        provider,
        retryable: true
      } as OCRError;
    }
  }

  getAvailableProviders(): OCRProvider[] {
    return OCRProviderFactory.getAvailableProviders();
  }

  setPreferredProvider(provider: OCRProvider): void {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.includes(provider)) {
      this.preferredProvider = provider;
    } else {
      throw new Error(`Provider ${provider} is not available`);
    }
  }

  getProviderStatus(provider: OCRProvider): ProviderStatus {
    return OCRProviderFactory.getProviderStatus(provider);
  }

  getAllProviderStatuses(): Map<OCRProvider, ProviderStatus> {
    return OCRProviderFactory.getAllProviderStatuses();
  }

  async destroy(): Promise<void> {
    await OCRProviderFactory.destroy();
    this.initialized = false;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    availableProviders: OCRProvider[];
    issues: string[];
  }> {
    return this.fallbackService.healthCheck();
  }

  getRecommendedProvider(): OCRProvider | null {
    return this.fallbackService.getRecommendedProvider();
  }
}

