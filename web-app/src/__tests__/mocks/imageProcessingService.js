// Enhanced mock for imageProcessingService with proper async handling
const mockImageProcessingService = {
  // Mock image processing functions with realistic delays
  processImage: jest.fn(async (imageFile, options = {}) => {
    // Simulate processing time but keep it short for tests
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      processedImage: {
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        width: 100,
        height: 100,
        format: 'jpeg',
        size: 1024,
      },
      metadata: {
        originalSize: imageFile?.size || 1024,
        compressionRatio: 0.8,
        processingTime: 100,
      },
    };
  }),

  compressImage: jest.fn(async (imageFile, quality = 0.8) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      compressedImage: new Blob(['compressed image data'], { type: 'image/jpeg' }),
      originalSize: imageFile?.size || 1024,
      compressedSize: Math.floor((imageFile?.size || 1024) * quality),
      compressionRatio: quality,
    };
  }),

  resizeImage: jest.fn(async (imageFile, width, height) => {
    await new Promise(resolve => setTimeout(resolve, 75));
    
    return {
      success: true,
      resizedImage: new Blob(['resized image data'], { type: 'image/jpeg' }),
      originalDimensions: { width: 200, height: 200 },
      newDimensions: { width, height },
      aspectRatio: width / height,
    };
  }),

  convertFormat: jest.fn(async (imageFile, targetFormat = 'jpeg') => {
    await new Promise(resolve => setTimeout(resolve, 60));
    
    return {
      success: true,
      convertedImage: new Blob(['converted image data'], { type: `image/${targetFormat}` }),
      originalFormat: 'png',
      targetFormat,
      size: imageFile?.size || 1024,
    };
  }),

  extractMetadata: jest.fn(async (imageFile) => {
    await new Promise(resolve => setTimeout(resolve, 30));
    
    return {
      success: true,
      metadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        size: imageFile?.size || 1024,
        colorSpace: 'sRGB',
        hasAlpha: false,
        created: new Date().toISOString(),
        camera: {
          make: 'Mock Camera',
          model: 'Test Model',
          iso: 100,
          aperture: 'f/2.8',
          shutterSpeed: '1/60',
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    };
  }),

  generateThumbnail: jest.fn(async (imageFile, size = 150) => {
    await new Promise(resolve => setTimeout(resolve, 40));
    
    return {
      success: true,
      thumbnail: new Blob(['thumbnail data'], { type: 'image/jpeg' }),
      size: size,
      originalSize: { width: 1920, height: 1080 },
      thumbnailSize: { width: size, height: Math.floor(size * 0.75) },
    };
  }),

  applyFilter: jest.fn(async (imageFile, filterType = 'none') => {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    return {
      success: true,
      filteredImage: new Blob(['filtered image data'], { type: 'image/jpeg' }),
      filterApplied: filterType,
      intensity: 1.0,
      processingTime: 80,
    };
  }),

  cropImage: jest.fn(async (imageFile, cropArea) => {
    await new Promise(resolve => setTimeout(resolve, 45));
    
    return {
      success: true,
      croppedImage: new Blob(['cropped image data'], { type: 'image/jpeg' }),
      originalDimensions: { width: 1920, height: 1080 },
      cropArea: cropArea || { x: 0, y: 0, width: 500, height: 500 },
      newDimensions: { 
        width: cropArea?.width || 500, 
        height: cropArea?.height || 500 
      },
    };
  }),

  rotateImage: jest.fn(async (imageFile, degrees = 90) => {
    await new Promise(resolve => setTimeout(resolve, 35));
    
    return {
      success: true,
      rotatedImage: new Blob(['rotated image data'], { type: 'image/jpeg' }),
      rotationDegrees: degrees,
      originalDimensions: { width: 1920, height: 1080 },
      newDimensions: degrees % 180 === 0 
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 },
    };
  }),

  enhanceImage: jest.fn(async (imageFile, enhancements = {}) => {
    await new Promise(resolve => setTimeout(resolve, 120));
    
    return {
      success: true,
      enhancedImage: new Blob(['enhanced image data'], { type: 'image/jpeg' }),
      enhancements: {
        brightness: enhancements.brightness || 0,
        contrast: enhancements.contrast || 0,
        saturation: enhancements.saturation || 0,
        sharpness: enhancements.sharpness || 0,
        ...enhancements,
      },
      processingTime: 120,
    };
  }),

  batchProcess: jest.fn(async (imageFiles, operations = []) => {
    // Simulate batch processing with shorter timeout
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      results: imageFiles.map((file, index) => ({
        id: index,
        originalFile: file,
        processedImage: new Blob(['batch processed image data'], { type: 'image/jpeg' }),
        operations: operations,
        success: true,
        processingTime: 50,
      })),
      totalProcessingTime: 200,
      successCount: imageFiles.length,
      failureCount: 0,
    };
  }),

  validateImage: jest.fn(async (imageFile) => {
    await new Promise(resolve => setTimeout(resolve, 20));
    
    return {
      isValid: true,
      format: 'jpeg',
      size: imageFile?.size || 1024,
      dimensions: { width: 1920, height: 1080 },
      errors: [],
      warnings: [],
    };
  }),

  // Utility functions
  getSupportedFormats: jest.fn(() => ['jpeg', 'png', 'webp', 'gif', 'bmp']),
  
  getMaxFileSize: jest.fn(() => 10 * 1024 * 1024), // 10MB
  
  isFormatSupported: jest.fn((format) => {
    const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'bmp'];
    return supportedFormats.includes(format.toLowerCase());
  }),

  // Error simulation functions for testing error handling
  simulateError: jest.fn(async (errorType = 'processing') => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const errors = {
      processing: new Error('Image processing failed'),
      timeout: new Error('Processing timeout exceeded'),
      format: new Error('Unsupported image format'),
      size: new Error('Image file too large'),
      memory: new Error('Insufficient memory for processing'),
      network: new Error('Network error during processing'),
    };
    
    throw errors[errorType] || new Error('Unknown processing error');
  }),

  // Mock configuration
  config: {
    maxFileSize: 10 * 1024 * 1024,
    supportedFormats: ['jpeg', 'png', 'webp', 'gif', 'bmp'],
    defaultQuality: 0.8,
    timeoutMs: 5000, // Reduced timeout for tests
    maxConcurrentProcessing: 3,
  },

  // Reset all mocks
  resetMocks: jest.fn(() => {
    Object.values(mockImageProcessingService).forEach(mock => {
      if (typeof mock === 'function' && mock.mockReset) {
        mock.mockReset();
      }
    });
  }),
};

// Mock for image processing hooks
export const useMockImageProcessing = () => ({
  processImage: mockImageProcessingService.processImage,
  compressImage: mockImageProcessingService.compressImage,
  resizeImage: mockImageProcessingService.resizeImage,
  isProcessing: false,
  progress: 0,
  error: null,
  result: null,
  reset: jest.fn(),
});

// Mock for image processing context
export const mockImageProcessingContext = {
  service: mockImageProcessingService,
  isProcessing: false,
  queue: [],
  results: [],
  errors: [],
  addToQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  clearQueue: jest.fn(),
  clearResults: jest.fn(),
  clearErrors: jest.fn(),
};

// Mock for image processing worker
export const mockImageProcessingWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null,
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

export default mockImageProcessingService;
