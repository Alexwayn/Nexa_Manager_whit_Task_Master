# Image Optimization Service

## Overview

The `ImageOptimizationService` is a comprehensive client-side image optimization solution designed specifically for the Document Scanner system. It provides intelligent image compression, format conversion, and enhancement capabilities to reduce API costs while maintaining OCR accuracy.

## Architecture

### Singleton Pattern
The service uses a singleton pattern to ensure efficient resource management and prevent multiple canvas instances:

```typescript
const optimizationService = ImageOptimizationService.getInstance();
```

### Core Components

- **Canvas Processing**: HTML5 Canvas for client-side image manipulation
- **Smart Compression**: Iterative quality reduction to meet target file sizes
- **Format Conversion**: Support for JPEG, PNG, and WebP formats
- **Batch Processing**: Efficient handling of multiple images
- **Analysis Engine**: Image characteristic analysis and optimization recommendations

## Key Features

### 🎯 OCR-Optimized Processing

#### Smart Dimension Calculation
- Automatically calculates optimal dimensions while preserving aspect ratio
- Ensures even-numbered dimensions for better compression
- Prevents upscaling to maintain image quality
- Maximum resolution: 2048x2048 pixels for OCR accuracy

#### OCR-Specific Enhancements
```typescript
private enhanceForOCR(): void {
  // Apply contrast enhancement (1.1x multiplier)
  // Add brightness adjustment (+5 units)
  // Use high-quality image smoothing
}
```

#### Quality Optimization
- Default quality: 0.85 for OCR processing
- Iterative quality reduction if file size exceeds limits
- Minimum quality threshold: 0.3 to maintain readability

### 📊 Multiple Output Formats

#### OCR Processing (optimizeForOCR)
- **Max Dimensions**: 2048x2048 pixels
- **Max File Size**: 5MB
- **Quality**: 0.85
- **Format**: JPEG (default)
- **Use Case**: Sending to OCR APIs

#### Web Display (optimizeForDisplay)
- **Max Dimensions**: 800x600 pixels
- **Max File Size**: 1MB
- **Quality**: 0.8
- **Format**: JPEG with progressive encoding
- **Use Case**: UI preview and display

#### Thumbnails (createThumbnail)
- **Max Dimensions**: 150x150 pixels (configurable)
- **Max File Size**: 100KB
- **Quality**: 0.7
- **Format**: JPEG
- **Use Case**: Quick previews and lists

### 🔄 Batch Processing

Process multiple images efficiently with error handling:

```typescript
const results = await optimizationService.batchOptimize(images, options);
// Returns array of OptimizationResult, continues on individual failures
```

Features:
- Individual error handling per image
- Progress tracking and logging
- Consistent optimization parameters
- Memory-efficient processing

### 📈 Analysis & Recommendations

#### Size Estimation
Predict optimization results without full processing:

```typescript
const estimation = await optimizationService.estimateOptimization(image, options);
// Returns: estimatedSize, estimatedSavings, estimatedCompressionRatio
```

#### Smart Recommendations
Analyze image characteristics and suggest optimal settings:

```typescript
const analysis = await optimizationService.getOptimizationRecommendations(image);
// Returns: recommendations[], suggestedOptions, estimatedSavings
```

Recommendation logic:
- **Large files (>10MB)**: Aggressive compression (quality: 0.7, max: 1600px)
- **Medium files (>5MB)**: Moderate compression (quality: 0.8, max: 2048px)
- **High resolution (>4MP)**: Dimension reduction recommended
- **PNG photos**: JPEG conversion suggested for better compression

## API Reference

### Core Methods

#### optimizeForOCR(image, options?)
Optimize image for OCR API consumption with high accuracy preservation.

**Parameters:**
- `image: Blob` - Input image blob
- `options?: OptimizationOptions` - Optional optimization parameters

**Returns:** `Promise<OptimizationResult>`

**Default Options:**
```typescript
{
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  format: 'jpeg',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  preserveAspectRatio: true,
  enableProgressive: false
}
```

#### optimizeForDisplay(image, options?)
Optimize image for web display with smaller file sizes.

**Parameters:**
- `image: Blob` - Input image blob
- `options?: OptimizationOptions` - Optional optimization parameters

**Returns:** `Promise<OptimizationResult>`

#### createThumbnail(image, size?)
Create small thumbnail version of the image.

**Parameters:**
- `image: Blob` - Input image blob
- `size?: number` - Thumbnail size in pixels (default: 150)

**Returns:** `Promise<OptimizationResult>`

#### batchOptimize(images, options?)
Process multiple images with the same optimization settings.

**Parameters:**
- `images: Blob[]` - Array of image blobs
- `options?: OptimizationOptions` - Optimization parameters

**Returns:** `Promise<OptimizationResult[]>`

### Analysis Methods

#### estimateOptimization(image, options?)
Estimate optimization results without full processing.

**Returns:**
```typescript
{
  estimatedSize: number;
  estimatedSavings: number;
  estimatedCompressionRatio: number;
}
```

#### getOptimizationRecommendations(image)
Analyze image and provide optimization recommendations.

**Returns:**
```typescript
{
  recommendations: string[];
  suggestedOptions: OptimizationOptions;
  estimatedSavings: number;
}
```

### Utility Methods

#### dispose()
Clean up resources and reset canvas dimensions.

## TypeScript Interfaces

### OptimizationOptions
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
```

### OptimizationResult
```typescript
interface OptimizationResult {
  optimizedImage: Blob;        // Optimized image blob
  originalSize: number;        // Original file size in bytes
  optimizedSize: number;       // Optimized file size in bytes
  compressionRatio: number;    // Compression ratio (original/optimized)
  dimensions: {
    original: { width: number; height: number };
    optimized: { width: number; height: number };
  };
  format: string;              // Output format used
  processingTime: number;      // Processing time in milliseconds
}
```

## Usage Examples

### Basic OCR Optimization
```typescript
import ImageOptimizationService from '@/services/scanner/imageOptimizationService';

const service = ImageOptimizationService.getInstance();

// Optimize for OCR with default settings
const result = await service.optimizeForOCR(imageBlob);

console.log(`Compressed from ${result.originalSize} to ${result.optimizedSize} bytes`);
console.log(`Compression ratio: ${result.compressionRatio.toFixed(2)}x`);
console.log(`Processing time: ${result.processingTime}ms`);
```

### Custom Optimization
```typescript
// Custom optimization for specific requirements
const result = await service.optimizeForOCR(imageBlob, {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.9,
  format: 'png',
  maxFileSize: 3 * 1024 * 1024 // 3MB limit
});
```

### Web Display Optimization
```typescript
// Optimize for web display
const displayResult = await service.optimizeForDisplay(imageBlob);

// Create thumbnail
const thumbnailResult = await service.createThumbnail(imageBlob, 200);
```

### Batch Processing
```typescript
const images = [blob1, blob2, blob3];
const results = await service.batchOptimize(images, {
  maxWidth: 1600,
  quality: 0.8
});

// Process results
results.forEach((result, index) => {
  if (result.optimizedImage) {
    console.log(`Image ${index + 1}: ${result.compressionRatio.toFixed(2)}x compression`);
  }
});
```

### Analysis and Recommendations
```typescript
// Get optimization recommendations
const analysis = await service.getOptimizationRecommendations(imageBlob);

console.log('Recommendations:');
analysis.recommendations.forEach(rec => console.log(`- ${rec}`));

console.log('Suggested options:', analysis.suggestedOptions);
console.log(`Estimated savings: ${(analysis.estimatedSavings / 1024).toFixed(1)} KB`);

// Quick size estimation
const estimation = await service.estimateOptimization(imageBlob, {
  quality: 0.7,
  maxWidth: 1600
});

console.log(`Estimated size: ${(estimation.estimatedSize / 1024).toFixed(1)} KB`);
```

## Performance Optimization

### Memory Management
- **Canvas Reuse**: Single canvas instance for all operations
- **Resource Cleanup**: Automatic cleanup of object URLs
- **Efficient Processing**: Minimal memory allocation during processing

### Processing Efficiency
- **Even Dimensions**: Ensures width/height are even for better compression
- **Quality Iteration**: Smart quality reduction algorithm
- **Format Selection**: Optimal format selection based on image type

### Error Handling
- **Graceful Degradation**: Continues processing on individual failures
- **Comprehensive Logging**: Detailed error logging with context
- **Resource Safety**: Proper cleanup even on errors

## Integration with OCR Pipeline

### Pre-Processing Integration
The service integrates seamlessly with the OCR processing pipeline:

1. **Image Upload/Capture** → Image Optimization Service
2. **Optimization** → OCR Provider (OpenAI/Qwen)
3. **Result Processing** → Document Storage

### Provider-Specific Optimization
Different optimization strategies for different OCR providers:

```typescript
// OpenAI Vision API optimization
const openaiResult = await service.optimizeForOCR(image, {
  maxWidth: 2048,
  maxHeight: 2048,
  maxFileSize: 20 * 1024 * 1024 // 20MB limit
});

// Qwen API optimization
const qwenResult = await service.optimizeForOCR(image, {
  maxWidth: 1920,
  maxHeight: 1920,
  maxFileSize: 10 * 1024 * 1024 // 10MB limit
});
```

### Cost Reduction Benefits
- **Reduced API Costs**: Smaller images = lower processing costs
- **Faster Processing**: Optimized images process faster
- **Better Accuracy**: Enhanced images improve OCR results
- **Bandwidth Savings**: Smaller uploads reduce network usage

## Error Handling

### Common Error Scenarios
- **Canvas Not Supported**: Fallback error handling
- **Image Load Failure**: Invalid or corrupted image files
- **Processing Timeout**: Large image processing timeouts
- **Memory Limitations**: Browser memory constraints

### Error Recovery
```typescript
try {
  const result = await service.optimizeForOCR(imageBlob);
  // Process successful result
} catch (error) {
  console.error('Optimization failed:', error.message);
  // Handle error - possibly use original image
}
```

## Testing

### Unit Tests
- Image processing accuracy
- Compression ratio validation
- Format conversion testing
- Error handling scenarios

### Integration Tests
- OCR pipeline integration
- Batch processing performance
- Memory usage validation
- Cross-browser compatibility

## Browser Compatibility

### Supported Features
- **HTML5 Canvas**: All modern browsers
- **Blob API**: Full support in modern browsers
- **Image Processing**: Hardware-accelerated where available

### Fallback Strategies
- **Canvas Support Check**: Validates canvas 2D context availability
- **Format Support**: Automatic format fallback for unsupported types
- **Memory Constraints**: Graceful handling of memory limitations

## Future Enhancements

### Planned Features
- **WebAssembly Integration**: Faster image processing
- **Worker Thread Support**: Background processing
- **Advanced Algorithms**: Machine learning-based optimization
- **Format Support**: Additional format support (AVIF, HEIF)

### Performance Improvements
- **Streaming Processing**: Process large images in chunks
- **Caching**: Cache optimization results
- **Progressive Enhancement**: Incremental quality improvements

---

## Related Documentation

- [Scanner System Overview](SCANNER_SYSTEM.md)
- [OCR Provider Factory](OCR_PROVIDER_FACTORY.md)
- [Scanner API Documentation](SCANNER_API.md)
- [TypeScript Types](../src/types/scanner.ts)