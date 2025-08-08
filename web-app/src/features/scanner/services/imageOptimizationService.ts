// Image optimization service for API cost reduction
import Logger from '@/utils/Logger';
import { captureError } from '@/lib/sentry';

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // in bytes
  preserveAspectRatio?: boolean;
  enableProgressive?: boolean;
}

export interface OptimizationResult {
  optimizedImage: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    optimized: { width: number; height: number };
  };
  format: string;
  processingTime: number;
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * Optimize image for OCR API consumption
   */
  async optimizeForOCR(
    image: Blob,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    const defaultOptions: OptimizationOptions = {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.85,
      format: 'jpeg',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      preserveAspectRatio: true,
      enableProgressive: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Load image
      const img = await this.loadImage(image);
      const originalDimensions = { width: img.width, height: img.height };
      
      // Calculate optimal dimensions
      const optimizedDimensions = this.calculateOptimalDimensions(
        originalDimensions,
        finalOptions
      );

      // Resize and optimize
      const optimizedBlob = await this.processImage(
        img,
        optimizedDimensions,
        finalOptions
      );

      const processingTime = Date.now() - startTime;
      const compressionRatio = image.size / optimizedBlob.size;

      const result: OptimizationResult = {
        optimizedImage: optimizedBlob,
        originalSize: image.size,
        optimizedSize: optimizedBlob.size,
        compressionRatio,
        dimensions: {
          original: originalDimensions,
          optimized: optimizedDimensions
        },
        format: finalOptions.format!,
        processingTime
      };

      Logger.info('Image optimization completed', {
        originalSize: image.size,
        optimizedSize: optimizedBlob.size,
        compressionRatio: compressionRatio.toFixed(2),
        processingTime
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown optimization error';
      Logger.error('Image optimization failed', errorMessage);
      
      captureError(error instanceof Error ? error : new Error(errorMessage), {
        component: 'ImageOptimizationService',
        action: 'optimizeForOCR',
        extra: {
          originalSize: image.size,
          originalType: image.type,
          options: finalOptions
        }
      });

      throw new Error(`Image optimization failed: ${errorMessage}`);
    }
  }

  /**
   * Optimize image for web display
   */
  async optimizeForDisplay(
    image: Blob,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const displayOptions: OptimizationOptions = {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'jpeg',
      maxFileSize: 1 * 1024 * 1024, // 1MB
      preserveAspectRatio: true,
      enableProgressive: true,
      ...options
    };

    return this.optimizeForOCR(image, displayOptions);
  }

  /**
   * Create thumbnail version of image
   */
  async createThumbnail(
    image: Blob,
    size: number = 150
  ): Promise<OptimizationResult> {
    const thumbnailOptions: OptimizationOptions = {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg',
      maxFileSize: 100 * 1024, // 100KB
      preserveAspectRatio: true
    };

    return this.optimizeForOCR(image, thumbnailOptions);
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimize(
    images: Blob[],
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await this.optimizeForOCR(images[i], options);
        results.push(result);
      } catch (error) {
        Logger.warn(`Failed to optimize image ${i + 1}/${images.length}`, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Estimate optimization savings
   */
  async estimateOptimization(
    image: Blob,
    options: OptimizationOptions = {}
  ): Promise<{
    estimatedSize: number;
    estimatedSavings: number;
    estimatedCompressionRatio: number;
  }> {
    // Quick estimation without full processing
    const img = await this.loadImage(image);
    const dimensions = this.calculateOptimalDimensions(
      { width: img.width, height: img.height },
      options
    );

    // Rough estimation based on dimensions and quality
    const pixelReduction = (dimensions.width * dimensions.height) / (img.width * img.height);
    const qualityFactor = (options.quality || 0.85);
    const estimatedSize = Math.round(image.size * pixelReduction * qualityFactor);
    
    return {
      estimatedSize,
      estimatedSavings: image.size - estimatedSize,
      estimatedCompressionRatio: image.size / estimatedSize
    };
  }

  private async loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  private calculateOptimalDimensions(
    original: { width: number; height: number },
    options: OptimizationOptions
  ): { width: number; height: number } {
    const { maxWidth = 2048, maxHeight = 2048, preserveAspectRatio = true } = options;
    
    let { width, height } = original;

    if (preserveAspectRatio) {
      // Calculate scale factor to fit within max dimensions
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    } else {
      width = Math.min(width, maxWidth);
      height = Math.min(height, maxHeight);
    }

    // Ensure dimensions are even numbers for better compression
    width = width % 2 === 0 ? width : width - 1;
    height = height % 2 === 0 ? height : height - 1;

    return { width, height };
  }

  private async processImage(
    img: HTMLImageElement,
    dimensions: { width: number; height: number },
    options: OptimizationOptions
  ): Promise<Blob> {
    const { width, height } = dimensions;
    const { quality = 0.85, format = 'jpeg', maxFileSize } = options;

    // Set canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Configure context for better quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Clear canvas and draw image
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(img, 0, 0, width, height);

    // Apply image enhancements for OCR
    if (format === 'jpeg') {
      this.enhanceForOCR();
    }

    // Convert to blob
    let resultBlob = await this.canvasToBlob(format, quality);

    // If still too large, reduce quality iteratively
    if (maxFileSize && resultBlob.size > maxFileSize) {
      resultBlob = await this.reduceToTargetSize(resultBlob, maxFileSize, format);
    }

    // Clean up
    URL.revokeObjectURL(img.src);

    return resultBlob;
  }

  private enhanceForOCR(): void {
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Apply slight contrast enhancement for better OCR
    const contrast = 1.1;
    const brightness = 5;

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
      data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green
      data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }

    // Put enhanced image data back
    this.ctx.putImageData(imageData, 0, 0);
  }

  private async canvasToBlob(format: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  private async reduceToTargetSize(
    blob: Blob,
    targetSize: number,
    format: string
  ): Promise<Blob> {
    let quality = 0.8;
    let currentBlob = blob;
    let attempts = 0;
    const maxAttempts = 5;

    while (currentBlob.size > targetSize && attempts < maxAttempts && quality > 0.3) {
      quality -= 0.1;
      currentBlob = await this.canvasToBlob(format, quality);
      attempts++;
    }

    Logger.info('Image size reduction completed', {
      attempts,
      finalQuality: quality,
      finalSize: currentBlob.size,
      targetSize
    });

    return currentBlob;
  }

  /**
   * Get optimization recommendations based on image analysis
   */
  async getOptimizationRecommendations(image: Blob): Promise<{
    recommendations: string[];
    suggestedOptions: OptimizationOptions;
    estimatedSavings: number;
  }> {
    const img = await this.loadImage(image);
    const recommendations: string[] = [];
    const suggestedOptions: OptimizationOptions = {};
    
    // Analyze image characteristics
    const totalPixels = img.width * img.height;
    const bytesPerPixel = image.size / totalPixels;

    // Size recommendations
    if (image.size > 10 * 1024 * 1024) { // > 10MB
      recommendations.push('Image is very large. Consider significant compression.');
      suggestedOptions.quality = 0.7;
      suggestedOptions.maxWidth = 1600;
      suggestedOptions.maxHeight = 1600;
    } else if (image.size > 5 * 1024 * 1024) { // > 5MB
      recommendations.push('Image is large. Moderate compression recommended.');
      suggestedOptions.quality = 0.8;
      suggestedOptions.maxWidth = 2048;
      suggestedOptions.maxHeight = 2048;
    }

    // Resolution recommendations
    if (totalPixels > 4000000) { // > 4MP
      recommendations.push('High resolution detected. Reducing dimensions will improve processing speed.');
      suggestedOptions.maxWidth = Math.min(2048, img.width);
      suggestedOptions.maxHeight = Math.min(2048, img.height);
    }

    // Format recommendations
    if (image.type === 'image/png' && bytesPerPixel > 3) {
      recommendations.push('PNG format detected. JPEG may provide better compression for photos.');
      suggestedOptions.format = 'jpeg';
    }

    // Estimate savings
    const estimation = await this.estimateOptimization(image, suggestedOptions);

    // Clean up
    URL.revokeObjectURL(img.src);

    return {
      recommendations,
      suggestedOptions,
      estimatedSavings: estimation.estimatedSavings
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up canvas if needed
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

export default ImageOptimizationService;
