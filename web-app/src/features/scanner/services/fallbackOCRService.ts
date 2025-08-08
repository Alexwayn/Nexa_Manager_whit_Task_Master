// Fallback OCR Service - handles provider selection and retry logic
import type { 
  OCROptions, 
  OCRResult, 
  ProviderStatus,
  OCRError 
} from '@/types/scanner';
import { OCRProvider } from '@/types/scanner';
import { OCRProviderFactory, type IOCRProvider } from './ocrProviderFactory';

export interface FallbackStrategy {
  maxRetries: number;
  retryDelay: number;
  providerPriority: OCRProvider[];
  degradationSteps: DegradationStep[];
}

export interface DegradationStep {
  condition: (error: OCRError, attempt: number) => boolean;
  action: DegradationAction;
  parameters?: Record<string, any>;
}

export enum DegradationAction {
  REDUCE_IMAGE_QUALITY = 'reduce_image_quality',
  SIMPLIFY_PROMPT = 'simplify_prompt',
  INCREASE_TIMEOUT = 'increase_timeout',
  SWITCH_PROVIDER = 'switch_provider',
  USE_BASIC_OCR = 'use_basic_ocr',
  MANUAL_INPUT = 'manual_input'
}

export class FallbackOCRService {
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

  async extractTextWithFallback(
    image: Blob, 
    options?: OCROptions,
    strategy?: Partial<FallbackStrategy>
  ): Promise<OCRResult> {
    const effectiveStrategy = { ...this.defaultStrategy, ...strategy };
    const availableProviders = this.getOrderedProviders(effectiveStrategy.providerPriority);
    
    let lastError: OCRError | null = null;
    let currentImage = image;
    let currentOptions = { ...options };
    
    for (const providerType of availableProviders) {
      const provider = OCRProviderFactory.getProvider(providerType);
      
      if (!provider || !provider.isAvailable()) {
        continue;
      }

      for (let attempt = 0; attempt < effectiveStrategy.maxRetries; attempt++) {
        try {
          const result = await this.attemptExtraction(
            provider, 
            currentImage, 
            currentOptions,
            providerType
          );
          
          // Success! Return the result
          return result;
        } catch (error) {
          lastError = error as OCRError;
          
          // Apply degradation strategy
          const degradationResult = await this.applyDegradationStrategy(
            lastError,
            attempt,
            effectiveStrategy,
            currentImage,
            currentOptions
          );
          
          if (degradationResult.shouldSwitchProvider) {
            break; // Move to next provider
          }
          
          if (degradationResult.shouldStop) {
            throw lastError; // Stop all attempts
          }
          
          // Update image and options based on degradation
          currentImage = degradationResult.image || currentImage;
          currentOptions = degradationResult.options || currentOptions;
          
          // Wait before retry
          if (attempt < effectiveStrategy.maxRetries - 1) {
            const delay = effectiveStrategy.retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }

    // All providers and retries exhausted
    throw lastError || new Error('All OCR providers failed');
  }

  private getOrderedProviders(priority: OCRProvider[]): OCRProvider[] {
    const availableProviders = OCRProviderFactory.getAvailableProviders();
    const orderedProviders: OCRProvider[] = [];
    
    // Add providers in priority order
    for (const provider of priority) {
      if (availableProviders.includes(provider)) {
        orderedProviders.push(provider);
      }
    }
    
    // Add any remaining available providers
    for (const provider of availableProviders) {
      if (!orderedProviders.includes(provider)) {
        orderedProviders.push(provider);
      }
    }
    
    return orderedProviders;
  }

  private async attemptExtraction(
    provider: IOCRProvider,
    image: Blob,
    options: OCROptions,
    providerType: OCRProvider
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      const partialResult = await provider.extractText(image, options);
      const processingTime = Date.now() - startTime;
      
      // Ensure we have all required fields for OCRResult
      const result: OCRResult = {
        text: partialResult.text || '',
        confidence: partialResult.confidence || 0,
        provider: providerType,
        processingTime,
        blocks: partialResult.blocks,
        tables: partialResult.tables,
        rawResponse: partialResult.rawResponse,
        error: partialResult.error
      };

      return result;
    } catch (error) {
      // Convert to OCRError if needed
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      throw {
        code: 'EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown extraction error',
        provider: providerType,
        retryable: true
      } as OCRError;
    }
  }

  private async applyDegradationStrategy(
    error: OCRError,
    attempt: number,
    strategy: FallbackStrategy,
    currentImage: Blob,
    currentOptions: OCROptions
  ): Promise<{
    shouldSwitchProvider: boolean;
    shouldStop: boolean;
    image?: Blob;
    options?: OCROptions;
  }> {
    for (const step of strategy.degradationSteps) {
      if (step.condition(error, attempt)) {
        switch (step.action) {
          case DegradationAction.REDUCE_IMAGE_QUALITY:
            const reducedImage = await this.reduceImageQuality(
              currentImage, 
              step.parameters?.qualityReduction || 0.2
            );
            return {
              shouldSwitchProvider: false,
              shouldStop: false,
              image: reducedImage,
              options: currentOptions
            };

          case DegradationAction.SIMPLIFY_PROMPT:
            const simplifiedOptions = {
              ...currentOptions,
              detectTables: false, // Simplify by disabling table detection
              timeout: Math.min((currentOptions.timeout || 30000) * 0.8, 20000)
            };
            return {
              shouldSwitchProvider: false,
              shouldStop: false,
              image: currentImage,
              options: simplifiedOptions
            };

          case DegradationAction.INCREASE_TIMEOUT:
            const extendedOptions = {
              ...currentOptions,
              timeout: (currentOptions.timeout || 30000) * (step.parameters?.timeoutMultiplier || 1.5)
            };
            return {
              shouldSwitchProvider: false,
              shouldStop: false,
              image: currentImage,
              options: extendedOptions
            };

          case DegradationAction.SWITCH_PROVIDER:
            return {
              shouldSwitchProvider: true,
              shouldStop: false
            };

          case DegradationAction.USE_BASIC_OCR:
            // Force use of fallback provider
            const fallbackProvider = OCRProviderFactory.getProvider(OCRProvider.Fallback);
            if (fallbackProvider) {
              try {
                const result = await this.attemptExtraction(
                  fallbackProvider,
                  currentImage,
                  currentOptions,
                  OCRProvider.Fallback
                );
                throw result; // This will be caught and returned as success
              } catch (fallbackResult) {
                if (fallbackResult && typeof fallbackResult === 'object' && 'text' in fallbackResult) {
                  throw fallbackResult; // Return the fallback result
                }
              }
            }
            return {
              shouldSwitchProvider: true,
              shouldStop: false
            };

          case DegradationAction.MANUAL_INPUT:
            return {
              shouldSwitchProvider: false,
              shouldStop: true
            };
        }
      }
    }

    // No degradation step matched, continue with current settings
    return {
      shouldSwitchProvider: false,
      shouldStop: false
    };
  }

  private async reduceImageQuality(image: Blob, qualityReduction: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Reduce dimensions slightly
        const scaleFactor = 1 - (qualityReduction * 0.5);
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Reduce quality
        const quality = Math.max(0.3, 0.9 - qualityReduction);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to reduce image quality'));
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for quality reduction'));
      img.src = URL.createObjectURL(image);
    });
  }

  getProviderStatuses(): Map<OCRProvider, ProviderStatus> {
    return OCRProviderFactory.getAllProviderStatuses();
  }

  getRecommendedProvider(): OCRProvider | null {
    const statuses = this.getProviderStatuses();
    
    for (const provider of this.defaultStrategy.providerPriority) {
      const status = statuses.get(provider);
      if (status?.available && !status.rateLimited) {
        return provider;
      }
    }
    
    return null;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    availableProviders: OCRProvider[];
    issues: string[];
  }> {
    const availableProviders = OCRProviderFactory.getAvailableProviders();
    const issues: string[] = [];
    
    if (availableProviders.length === 0) {
      issues.push('No OCR providers are available');
    }
    
    const statuses = this.getProviderStatuses();
    for (const [provider, status] of statuses) {
      if (!status.available) {
        issues.push(`Provider ${provider} is not available: ${status.lastError || 'Unknown reason'}`);
      } else if (status.rateLimited) {
        issues.push(`Provider ${provider} is rate limited`);
      }
    }
    
    return {
      healthy: availableProviders.length > 0 && issues.length === 0,
      availableProviders,
      issues
    };
  }
}
