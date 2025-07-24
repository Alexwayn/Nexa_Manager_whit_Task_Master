// OCR Provider Factory implementation
import type { 
  OCROptions, 
  OCRResult, 
  ProviderStatus,
  OCRError,
  TextBlock,
  TableData 
} from '@/types/scanner';
import { OCRProvider } from '@/types/scanner';

// Base OCR Provider interface
export interface IOCRProvider {
  readonly name: OCRProvider;
  extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>>;
  isAvailable(): boolean;
  getStatus(): ProviderStatus;
  initialize(): Promise<void>;
  destroy(): void;
}

// Provider configuration interface
export interface OCRProviderConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

// Provider factory class
export class OCRProviderFactory {
  private static providers: Map<OCRProvider, IOCRProvider> = new Map();
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize all available providers
    const providerConfigs = this.getProviderConfigs();
    
    for (const [providerType, config] of providerConfigs) {
      try {
        const provider = this.createProvider(providerType, config);
        await provider.initialize();
        this.providers.set(providerType, provider);
      } catch (error) {
        console.warn(`Failed to initialize OCR provider ${providerType}:`, error);
      }
    }

    this.initialized = true;
  }

  static getProvider(providerType: OCRProvider): IOCRProvider | null {
    return this.providers.get(providerType) || null;
  }

  static getAvailableProviders(): OCRProvider[] {
    return Array.from(this.providers.keys()).filter(providerType => {
      const provider = this.providers.get(providerType);
      return provider?.isAvailable() ?? false;
    });
  }

  static getProviderStatus(providerType: OCRProvider): ProviderStatus {
    const provider = this.providers.get(providerType);
    
    if (!provider) {
      return {
        available: false,
        rateLimited: false,
        lastError: 'Provider not found or not initialized'
      };
    }

    return provider.getStatus();
  }

  static getAllProviderStatuses(): Map<OCRProvider, ProviderStatus> {
    const statuses = new Map<OCRProvider, ProviderStatus>();
    
    for (const [providerType, provider] of this.providers) {
      statuses.set(providerType, provider.getStatus());
    }

    return statuses;
  }

  static async destroy(): Promise<void> {
    for (const provider of this.providers.values()) {
      try {
        provider.destroy();
      } catch (error) {
        console.warn('Error destroying OCR provider:', error);
      }
    }
    
    this.providers.clear();
    this.initialized = false;
  }

  private static createProvider(providerType: OCRProvider, config: OCRProviderConfig): IOCRProvider {
    switch (providerType) {
      case OCRProvider.OpenAI:
        return new OpenAIVisionProvider(config);
      case OCRProvider.Qwen:
        return new QwenOCRProvider(config);
      case OCRProvider.Fallback:
        return new FallbackOCRProvider(config);
      default:
        throw new Error(`Unsupported OCR provider: ${providerType}`);
    }
  }

  private static getProviderConfigs(): Map<OCRProvider, OCRProviderConfig> {
    const configs = new Map<OCRProvider, OCRProviderConfig>();

    // OpenAI configuration
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      configs.set(OCRProvider.OpenAI, {
        apiKey: openaiKey,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        timeout: 30000,
        maxRetries: 3,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000
        }
      });
    }

    // Qwen configuration
    const qwenKey = import.meta.env.VITE_QWEN_API_KEY;
    if (qwenKey) {
      configs.set(OCRProvider.Qwen, {
        apiKey: qwenKey,
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        timeout: 30000,
        maxRetries: 3,
        rateLimit: {
          requestsPerMinute: 30,
          requestsPerHour: 500
        }
      });
    }

    // Fallback is always available
    configs.set(OCRProvider.Fallback, {
      timeout: 5000,
      maxRetries: 1
    });

    return configs;
  }
}

// Base provider class with common functionality
export abstract class BaseOCRProvider implements IOCRProvider {
  protected config: OCRProviderConfig;
  protected requestCount = 0;
  protected lastRequestTime = 0;
  protected rateLimitResetTime = 0;
  protected lastError: string | null = null;

  constructor(
    public readonly name: OCRProvider,
    config: OCRProviderConfig
  ) {
    this.config = config;
  }

  abstract extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>>;
  abstract isAvailable(): boolean;

  async initialize(): Promise<void> {
    // Base initialization - can be overridden by subclasses
  }

  destroy(): void {
    // Base cleanup - can be overridden by subclasses
  }

  getStatus(): ProviderStatus {
    return {
      available: this.isAvailable(),
      rateLimited: this.isRateLimited(),
      lastError: this.lastError || undefined,
      quotaRemaining: this.getQuotaRemaining()
    };
  }

  protected async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  protected isRateLimited(): boolean {
    if (!this.config.rateLimit) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.config.rateLimit.requestsPerMinute; // ms between requests

    return timeSinceLastRequest < minInterval;
  }

  protected getQuotaRemaining(): number | undefined {
    // This would need to be implemented based on actual API quotas
    // For now, return undefined to indicate unknown quota
    return undefined;
  }

  protected updateRequestTracking(): void {
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  protected createOCRError(code: string, message: string, retryable = false): OCRError {
    return {
      code,
      message,
      provider: this.name,
      retryable
    };
  }
}

// OpenAI Vision Provider implementation
class OpenAIVisionProvider extends BaseOCRProvider {
  private quotaRemaining: number | undefined;
  private dailyQuotaUsed = 0;
  private lastQuotaReset = new Date().toDateString();
  private requestQueue: Array<() => Promise<any>> = [];
  private processingQueue = false;

  constructor(config: OCRProviderConfig) {
    super(OCRProvider.OpenAI, config);
  }

  async extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    if (!this.isAvailable()) {
      throw this.createOCRError('PROVIDER_UNAVAILABLE', 'OpenAI provider is not available');
    }

    // Check daily quota reset
    this.checkQuotaReset();

    if (this.isRateLimited()) {
      throw this.createOCRError('RATE_LIMITED', 'Rate limit exceeded', true);
    }

    // Queue the request to handle rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.performExtraction(image, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async performExtraction(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    this.updateRequestTracking();

    try {
      // Optimize image for OpenAI API requirements
      const optimizedImage = await this.optimizeImageForAPI(image);
      const base64Image = await this.blobToBase64(optimizedImage);
      
      // Prepare the request payload
      const payload = {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.buildPrompt(options)
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'high' // Use high detail for better OCR accuracy
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1 // Low temperature for consistent OCR results
      };

      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Nexa-Manager-Scanner/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        throw this.createOCRError(
          'RATE_LIMITED', 
          `Rate limited. Retry after ${waitTime}ms`, 
          true
        );
      }

      // Handle quota exceeded
      if (response.status === 402) {
        throw this.createOCRError(
          'QUOTA_EXCEEDED', 
          'OpenAI API quota exceeded', 
          false
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw this.createOCRError(
          `HTTP_${response.status}`, 
          `OpenAI API error: ${errorData.error?.message || response.statusText}`,
          response.status >= 500 || response.status === 429
        );
      }

      // Update quota information from response headers
      this.updateQuotaFromHeaders(response.headers);

      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw this.createOCRError(
          'INVALID_RESPONSE', 
          'Invalid response structure from OpenAI API', 
          true
        );
      }

      const extractedText = data.choices[0].message.content || '';
      
      // Track usage
      this.dailyQuotaUsed++;
      this.lastError = null; // Clear any previous errors

      // Parse structured data if tables are detected
      const blocks = this.parseTextBlocks(extractedText);
      const tables = options?.detectTables ? this.parseTablesFromText(extractedText) : undefined;

      return {
        text: extractedText,
        confidence: this.calculateConfidence(data),
        blocks,
        tables,
        rawResponse: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMessage;
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createOCRError('TIMEOUT', 'Request timed out', true);
      }
      
      // If it's already an OCRError, rethrow it
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      throw this.createOCRError('API_ERROR', errorMessage, true);
    }
  }

  private async optimizeImageForAPI(image: Blob): Promise<Blob> {
    // OpenAI Vision API has a 20MB limit and works best with certain formats
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (image.size <= maxSize && (image.type === 'image/jpeg' || image.type === 'image/png')) {
      return image;
    }

    // Convert to canvas for optimization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate optimal dimensions (max 2048x2048 for high detail)
        const maxDimension = 2048;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and optimize
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = URL.createObjectURL(image);
    });
  }

  private buildPrompt(options?: OCROptions): string {
    let prompt = 'Extract all text from this document image with high accuracy. ';
    
    if (options?.detectTables) {
      prompt += 'If tables are present, preserve their structure using appropriate formatting (spaces, tabs, or markdown table format). ';
    }
    
    if (options?.language) {
      prompt += `The document is primarily in ${options.language}. `;
    }
    
    prompt += 'Return only the extracted text content, maintaining the original formatting and structure. Do not add any commentary or explanations.';
    
    return prompt;
  }

  private calculateConfidence(response: any): number {
    // OpenAI doesn't provide confidence scores, so we estimate based on response quality
    const finishReason = response.choices[0]?.finish_reason;
    const textLength = response.choices[0]?.message?.content?.length || 0;
    
    if (finishReason === 'stop' && textLength > 10) {
      return 0.9; // High confidence for complete responses
    } else if (finishReason === 'length' && textLength > 0) {
      return 0.8; // Good confidence but truncated
    } else if (textLength > 0) {
      return 0.7; // Moderate confidence
    }
    
    return 0.3; // Low confidence for poor responses
  }

  private parseTextBlocks(text: string): TextBlock[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line) => ({
      text: line.trim(),
      confidence: 0.9 // Assume high confidence for parsed blocks
    }));
  }

  private parseTablesFromText(text: string): TableData[] {
    const tables: TableData[] = [];
    const lines = text.split('\n');
    
    // Simple table detection (looking for lines with multiple columns separated by spaces/tabs)
    let currentTable: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect table-like structure (multiple columns separated by 2+ spaces or tabs)
      if (trimmedLine.includes('\t') || /\s{2,}/.test(trimmedLine)) {
        currentTable.push(trimmedLine);
      } else if (currentTable.length > 0) {
        // End of table, process it
        if (currentTable.length >= 2) { // At least 2 rows to be considered a table
          const table = this.processTableLines(currentTable);
          if (table) {
            tables.push(table);
          }
        }
        currentTable = [];
      }
    }
    
    // Process final table if exists
    if (currentTable.length >= 2) {
      const table = this.processTableLines(currentTable);
      if (table) {
        tables.push(table);
      }
    }
    
    return tables;
  }

  private processTableLines(lines: string[]): TableData | null {
    try {
      const rows = lines.map(line => {
        // Split by tabs first, then by multiple spaces
        let cells = line.includes('\t') 
          ? line.split('\t') 
          : line.split(/\s{2,}/);
        
        return cells.map(cell => ({
          text: cell.trim()
        }));
      });
      
      if (rows.length === 0 || rows[0].length === 0) {
        return null;
      }
      
      return {
        rows: rows.length,
        columns: rows[0].length,
        cells: rows
      };
    } catch {
      return null;
    }
  }

  private updateQuotaFromHeaders(headers: Headers): void {
    // OpenAI includes quota information in response headers
    const remaining = headers.get('x-ratelimit-remaining-requests');
    const resetTime = headers.get('x-ratelimit-reset-requests');
    
    if (remaining) {
      this.quotaRemaining = parseInt(remaining);
    }
    
    if (resetTime) {
      this.rateLimitResetTime = Date.now() + (parseInt(resetTime) * 1000);
    }
  }

  private checkQuotaReset(): void {
    const today = new Date().toDateString();
    if (today !== this.lastQuotaReset) {
      this.dailyQuotaUsed = 0;
      this.lastQuotaReset = today;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          // Error handling is done in the individual request
        }
        
        // Rate limiting delay between requests
        const delay = this.calculateDelay();
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.processingQueue = false;
  }

  private calculateDelay(): number {
    if (!this.config.rateLimit) {
      return 0;
    }

    const minInterval = 60000 / this.config.rateLimit.requestsPerMinute;
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    return Math.max(0, minInterval - timeSinceLastRequest);
  }

  protected getQuotaRemaining(): number | undefined {
    return this.quotaRemaining;
  }

  getStatus(): ProviderStatus {
    return {
      available: this.isAvailable(),
      rateLimited: this.isRateLimited(),
      lastError: this.lastError || undefined,
      quotaRemaining: this.quotaRemaining
    };
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && this.dailyQuotaUsed < 1000; // Reasonable daily limit
  }
}

// Qwen OCR Provider implementation
class QwenOCRProvider extends BaseOCRProvider {
  private quotaRemaining: number | undefined;
  private dailyQuotaUsed = 0;
  private lastQuotaReset = new Date().toDateString();
  private requestQueue: Array<() => Promise<any>> = [];
  private processingQueue = false;

  constructor(config: OCRProviderConfig) {
    super(OCRProvider.Qwen, config);
  }

  async extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    if (!this.isAvailable()) {
      throw this.createOCRError('PROVIDER_UNAVAILABLE', 'Qwen provider is not available');
    }

    // Check daily quota reset
    this.checkQuotaReset();

    if (this.isRateLimited()) {
      throw this.createOCRError('RATE_LIMITED', 'Rate limit exceeded', true);
    }

    // Queue the request to handle rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.performExtraction(image, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async performExtraction(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    this.updateRequestTracking();

    try {
      // Optimize image for Qwen API requirements
      const optimizedImage = await this.optimizeImageForAPI(image);
      const base64Image = await this.blobToBase64(optimizedImage);
      
      // Prepare the request payload
      const payload = {
        model: 'qwen-vl-ocr',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: base64Image
                },
                {
                  type: 'text',
                  text: this.buildPrompt(options)
                }
              ]
            }
          ]
        },
        parameters: {
          temperature: 0.1, // Low temperature for consistent OCR results
          top_p: 0.8,
          max_tokens: 2000
        }
      };

      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Nexa-Manager-Scanner/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        throw this.createOCRError(
          'RATE_LIMITED', 
          `Rate limited. Retry after ${waitTime}ms`, 
          true
        );
      }

      // Handle quota exceeded
      if (response.status === 402 || response.status === 403) {
        throw this.createOCRError(
          'QUOTA_EXCEEDED', 
          'Qwen API quota exceeded', 
          false
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw this.createOCRError(
          `HTTP_${response.status}`, 
          `Qwen API error: ${errorData.message || errorData.error?.message || response.statusText}`,
          response.status >= 500 || response.status === 429
        );
      }

      // Update quota information from response headers
      this.updateQuotaFromHeaders(response.headers);

      const data = await response.json();
      
      // Validate response structure
      if (!data.output || typeof data.output.text !== 'string') {
        throw this.createOCRError(
          'INVALID_RESPONSE', 
          'Invalid response structure from Qwen API', 
          true
        );
      }

      const extractedText = data.output.text || '';
      
      // Track usage
      this.dailyQuotaUsed++;
      this.lastError = null; // Clear any previous errors

      // Parse structured data if tables are detected
      const blocks = this.parseTextBlocks(extractedText);
      const tables = options?.detectTables ? this.parseTablesFromText(extractedText) : undefined;

      return {
        text: extractedText,
        confidence: this.calculateConfidence(data, extractedText),
        blocks,
        tables,
        rawResponse: data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = errorMessage;
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createOCRError('TIMEOUT', 'Request timed out', true);
      }
      
      // If it's already an OCRError, rethrow it
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      throw this.createOCRError('API_ERROR', errorMessage, true);
    }
  }

  private async optimizeImageForAPI(image: Blob): Promise<Blob> {
    // Qwen API has specific requirements for image format and size
    const maxSize = 10 * 1024 * 1024; // 10MB limit for Qwen
    
    if (image.size <= maxSize && (image.type === 'image/jpeg' || image.type === 'image/png')) {
      return image;
    }

    // Convert to canvas for optimization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate optimal dimensions (Qwen works well with up to 1920x1920)
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and optimize
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, 'image/jpeg', 0.85); // Slightly lower quality for Qwen
      };
      
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = URL.createObjectURL(image);
    });
  }

  private buildPrompt(options?: OCROptions): string {
    let prompt = 'Please extract all text from this image with high accuracy. ';
    
    if (options?.detectTables) {
      prompt += 'If there are tables in the image, please maintain their structure and format them clearly. ';
    }
    
    if (options?.language) {
      prompt += `The text is primarily in ${options.language}. `;
    }
    
    prompt += 'Preserve the original formatting, line breaks, and structure. Return only the extracted text without any additional commentary.';
    
    return prompt;
  }

  private calculateConfidence(_response: any, text: string): number {
    // Qwen doesn't provide explicit confidence scores, so we estimate based on response quality
    const textLength = text.length;
    const hasStructure = text.includes('\n') || text.includes('\t');
    const hasSpecialChars = /[^\w\s]/.test(text);
    
    let confidence = 0.8; // Base confidence for Qwen
    
    if (textLength > 100) confidence += 0.05;
    if (hasStructure) confidence += 0.05;
    if (hasSpecialChars) confidence += 0.05;
    
    // Check for common OCR errors that might indicate lower confidence
    const commonErrors = ['|||', '___', '???', 'lll'];
    const hasErrors = commonErrors.some(error => text.includes(error));
    if (hasErrors) confidence -= 0.1;
    
    return Math.min(Math.max(confidence, 0.3), 0.95);
  }

  private parseTextBlocks(text: string): TextBlock[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line) => ({
      text: line.trim(),
      confidence: 0.85 // Assume good confidence for parsed blocks
    }));
  }

  private parseTablesFromText(text: string): TableData[] {
    const tables: TableData[] = [];
    const lines = text.split('\n');
    
    // Look for table patterns in Qwen's output
    let currentTable: string[] = [];
    let inTable = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect table start/continuation (multiple columns separated by spaces/tabs or |)
      const isTableLine = trimmedLine.includes('|') || 
                         trimmedLine.includes('\t') || 
                         /\s{3,}/.test(trimmedLine) ||
                         (inTable && trimmedLine.length > 0);
      
      if (isTableLine && trimmedLine.length > 0) {
        currentTable.push(trimmedLine);
        inTable = true;
      } else if (inTable && trimmedLine.length === 0) {
        // Empty line might be part of table formatting
        continue;
      } else if (inTable) {
        // End of table
        if (currentTable.length >= 2) {
          const table = this.processTableLines(currentTable);
          if (table) {
            tables.push(table);
          }
        }
        currentTable = [];
        inTable = false;
      }
    }
    
    // Process final table if exists
    if (currentTable.length >= 2) {
      const table = this.processTableLines(currentTable);
      if (table) {
        tables.push(table);
      }
    }
    
    return tables;
  }

  private processTableLines(lines: string[]): TableData | null {
    try {
      const rows = lines.map(line => {
        let cells: string[];
        
        // Handle different table formats
        if (line.includes('|')) {
          // Markdown-style table
          cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        } else if (line.includes('\t')) {
          // Tab-separated
          cells = line.split('\t').map(cell => cell.trim());
        } else {
          // Space-separated (3+ spaces)
          cells = line.split(/\s{3,}/).map(cell => cell.trim());
        }
        
        return cells.map(cell => ({
          text: cell
        }));
      }).filter(row => row.length > 0);
      
      if (rows.length === 0) {
        return null;
      }
      
      // Normalize column count (use the maximum)
      const maxColumns = Math.max(...rows.map(row => row.length));
      
      const normalizedRows = rows.map(row => {
        while (row.length < maxColumns) {
          row.push({ text: '' });
        }
        return row;
      });
      
      return {
        rows: normalizedRows.length,
        columns: maxColumns,
        cells: normalizedRows
      };
    } catch {
      return null;
    }
  }

  private updateQuotaFromHeaders(headers: Headers): void {
    // Qwen might include quota information in response headers
    const remaining = headers.get('x-ratelimit-remaining');
    const resetTime = headers.get('x-ratelimit-reset');
    
    if (remaining) {
      this.quotaRemaining = parseInt(remaining);
    }
    
    if (resetTime) {
      this.rateLimitResetTime = parseInt(resetTime) * 1000;
    }
  }

  private checkQuotaReset(): void {
    const today = new Date().toDateString();
    if (today !== this.lastQuotaReset) {
      this.dailyQuotaUsed = 0;
      this.lastQuotaReset = today;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          // Error handling is done in the individual request
        }
        
        // Rate limiting delay between requests
        const delay = this.calculateDelay();
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.processingQueue = false;
  }

  private calculateDelay(): number {
    if (!this.config.rateLimit) {
      return 0;
    }

    const minInterval = 60000 / this.config.rateLimit.requestsPerMinute;
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    return Math.max(0, minInterval - timeSinceLastRequest);
  }

  protected getQuotaRemaining(): number | undefined {
    return this.quotaRemaining;
  }

  getStatus(): ProviderStatus {
    return {
      available: this.isAvailable(),
      rateLimited: this.isRateLimited(),
      lastError: this.lastError || undefined,
      quotaRemaining: this.quotaRemaining
    };
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && this.dailyQuotaUsed < 500; // Reasonable daily limit for Qwen
  }
}

// Fallback OCR Provider implementation
class FallbackOCRProvider extends BaseOCRProvider {
  private fallbackProviders: OCRProvider[] = [];


  constructor(config: OCRProviderConfig) {
    super(OCRProvider.Fallback, config);
    this.initializeFallbackChain();
  }

  private initializeFallbackChain(): void {
    // Define fallback priority order
    this.fallbackProviders = [
      OCRProvider.OpenAI,
      OCRProvider.Qwen,
      // Could add more providers like Azure, Google, etc.
    ];
  }

  async extractText(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    // First, try to use any available primary providers as fallback
    const availableProviders = OCRProviderFactory.getAvailableProviders()
      .filter(provider => provider !== OCRProvider.Fallback);

    for (const providerType of this.fallbackProviders) {
      if (providerType !== OCRProvider.Fallback && availableProviders.includes(providerType)) {
        try {
          const provider = OCRProviderFactory.getProvider(providerType);
          if (provider && provider.isAvailable()) {
            const result = await this.tryProviderWithRetry(provider, image, options);
            if (result) {
              return {
                ...result,
                text: `[Fallback OCR Result]\n\n${result.text}`,
                confidence: Math.max(0.1, (result.confidence || 0.5) - 0.2) // Reduce confidence for fallback
              };
            }
          }
        } catch (error) {
          console.warn(`Fallback provider ${providerType} failed:`, error);
          continue; // Try next provider
        }
      }
    }

    // If all providers fail, try basic text extraction techniques
    const basicResult = await this.performBasicOCR(image, options);
    if (basicResult.text && basicResult.text.trim().length > 0) {
      return basicResult;
    }

    // Final fallback - return manual input prompt
    return this.getManualInputPrompt(options);
  }

  private async tryProviderWithRetry(
    provider: IOCRProvider, 
    image: Blob, 
    options?: OCROptions,
    maxRetries = 2
  ): Promise<Partial<OCRResult> | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await provider.extractText(image, {
          ...options,
          timeout: 15000 // Shorter timeout for fallback
        });
        
        if (result.text && result.text.trim().length > 0) {
          return result;
        }
      } catch (error) {
        if (attempt === maxRetries) {
          console.warn(`Provider ${provider.name} failed after ${maxRetries + 1} attempts:`, error);
          return null;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }

  private async performBasicOCR(image: Blob, options?: OCROptions): Promise<Partial<OCRResult>> {
    try {
      // Try to extract text using browser's built-in capabilities
      // This is a simplified approach - in a real implementation, you might use
      // libraries like Tesseract.js for client-side OCR
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Try to detect if image has text-like patterns
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasTextLikePatterns = this.analyzeImageForText(imageData);
          
          if (hasTextLikePatterns) {
            resolve({
              text: '[Basic OCR detected text-like content]\n\nThis image appears to contain text, but automatic extraction failed. Please manually enter the text content.',
              confidence: 0.3,
              rawResponse: {
                fallback: true,
                method: 'basic_analysis',
                hasTextPatterns: true
              }
            });
          } else {
            resolve({
              text: '[No text detected]\n\nThis image does not appear to contain readable text.',
              confidence: 0.2,
              rawResponse: {
                fallback: true,
                method: 'basic_analysis',
                hasTextPatterns: false
              }
            });
          }
        };
        
        img.onerror = () => {
          resolve(this.getManualInputPrompt(options));
        };
        
        img.src = URL.createObjectURL(image);
      });
    } catch (error) {
      console.warn('Basic OCR analysis failed:', error);
      return this.getManualInputPrompt(options);
    }
  }

  private analyzeImageForText(imageData: ImageData): boolean {
    const { data, width, height } = imageData;
    let textLikeRegions = 0;
    const sampleSize = Math.min(1000, width * height / 100); // Sample 1% of pixels
    
    for (let i = 0; i < sampleSize; i++) {
      const pixelIndex = Math.floor(Math.random() * (width * height)) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      
      // Check for high contrast (typical of text)
      const brightness = (r + g + b) / 3;
      const isHighContrast = brightness < 50 || brightness > 200;
      
      if (isHighContrast) {
        textLikeRegions++;
      }
    }
    
    // If more than 20% of sampled pixels are high contrast, likely contains text
    return (textLikeRegions / sampleSize) > 0.2;
  }

  private getManualInputPrompt(options?: OCROptions): Partial<OCRResult> {
    let promptText = '[OCR Extraction Failed - Manual Input Required]\n\n';
    
    if (options?.detectTables) {
      promptText += 'This document appears to contain tables. Please manually enter the content, preserving the table structure.\n\n';
    }
    
    promptText += 'All automatic text extraction methods have failed. Please review the document image and manually enter the text content below.\n\n';
    promptText += 'Tips for manual entry:\n';
    promptText += '• Preserve the original formatting and line breaks\n';
    promptText += '• Include all visible text, numbers, and symbols\n';
    promptText += '• Maintain table structure if present\n';
    promptText += '• Double-check for accuracy\n\n';
    promptText += '[Enter text content here]';

    return {
      text: promptText,
      confidence: 0.1,
      rawResponse: {
        fallback: true,
        method: 'manual_input_required',
        allProvidersExhausted: true,
        availableProviders: OCRProviderFactory.getAvailableProviders()
      }
    };
  }

  isAvailable(): boolean {
    return true; // Fallback is always available
  }

  getStatus(): ProviderStatus {
    const availableProviders = OCRProviderFactory.getAvailableProviders()
      .filter(provider => provider !== OCRProvider.Fallback);

    return {
      available: true,
      rateLimited: false,
      lastError: availableProviders.length === 0 ? 'No primary providers available' : undefined,
      quotaRemaining: undefined
    };
  }
}