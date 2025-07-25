import { ImageProcessingService } from '@/services/scanner/imageProcessingService';
import { 
  EnhancedImage, 
  DocumentBounds, 
  ImagePreprocessingOptions,
  CompressionResult 
} from '@/types/scanner';

// Mock canvas and image APIs
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(),
  toBlob: jest.fn()
};

const mockContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
};

const mockImageData = {
  data: new Uint8ClampedArray(800 * 600 * 4),
  width: 800,
  height: 600
};

// Mock DOM APIs
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

Object.defineProperty(global, 'Image', {
  value: jest.fn(() => ({
    onload: null,
    onerror: null,
    src: '',
    width: 800,
    height: 600
  })),
  writable: true
});

global.document = {
  createElement: jest.fn(() => mockCanvas)
} as any;

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
} as any;

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  let mockBlob: Blob;

  beforeEach(() => {
    service = new ImageProcessingService();
    mockBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockCanvas.getContext.mockReturnValue(mockContext);
    mockContext.getImageData.mockReturnValue(mockImageData);
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(new Blob(['processed'], { type: 'image/jpeg' }));
    });
  });

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const result = await service.compressImage(mockBlob);

      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('dimensions');
      
      expect(result.format).toBe('jpeg');
      expect(result.originalSize).toBe(mockBlob.size);
    });

    it('should apply custom compression options', async () => {
      const options: Partial<ImagePreprocessingOptions> = {
        maxWidth: 1024,
        maxHeight: 768,
        quality: 0.7,
        format: 'png'
      };

      const result = await service.compressImage(mockBlob, options);

      expect(result.format).toBe('png');
      expect(result.dimensions.width).toBeLessThanOrEqual(1024);
      expect(result.dimensions.height).toBeLessThanOrEqual(768);
    });

    it('should maintain aspect ratio when specified', async () => {
      const options: Partial<ImagePreprocessingOptions> = {
        maxWidth: 400,
        maxHeight: 400,
        maintainAspectRatio: true
      };

      const result = await service.compressImage(mockBlob, options);

      // With original 800x600 and max 400x400, maintaining aspect ratio should give 400x300
      expect(result.dimensions.width).toBe(400);
      expect(result.dimensions.height).toBe(300);
    });

    it('should handle target file size constraints', async () => {
      const targetSize = 1024; // 1KB
      const options: Partial<ImagePreprocessingOptions> = {
        targetFileSize: targetSize
      };

      // Mock toBlob to return different sizes based on quality
      let callCount = 0;
      mockCanvas.toBlob.mockImplementation((callback, type, quality) => {
        callCount++;
        const size = callCount === 1 ? 2048 : 512; // First call too large, second call acceptable
        const mockBlob = new Blob(['x'.repeat(size)], { type: 'image/jpeg' });
        Object.defineProperty(mockBlob, 'size', { value: size });
        callback(mockBlob);
      });

      const result = await service.compressImage(mockBlob, options);

      expect(result.compressedSize).toBeLessThanOrEqual(targetSize);
    });
  });

  describe('convertFormat', () => {
    it('should convert image to different format', async () => {
      const result = await service.convertFormat(mockBlob, 'png', 0.9);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        0.9
      );
    });

    it('should handle webp format conversion', async () => {
      await service.convertFormat(mockBlob, 'webp', 0.8);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.8
      );
    });
  });

  describe('optimizeForOCR', () => {
    it('should optimize image for OCR processing', async () => {
      const result = await service.optimizeForOCR(mockBlob);

      expect(result).toBeInstanceOf(Blob);
      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });

    it('should apply OCR-specific enhancements', async () => {
      await service.optimizeForOCR(mockBlob);

      // Verify that image data was processed (OCR optimizations applied)
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);
    });
  });

  describe('preprocessForAPI', () => {
    it('should preprocess image for API requirements', async () => {
      const apiRequirements = {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        maxDimensions: { width: 1920, height: 1080 },
        supportedFormats: ['jpeg', 'png']
      };

      const result = await service.preprocessForAPI(mockBlob, apiRequirements);

      expect(result.dimensions.width).toBeLessThanOrEqual(1920);
      expect(result.dimensions.height).toBeLessThanOrEqual(1080);
      expect(['jpeg', 'png']).toContain(result.format);
    });

    it('should select optimal format based on supported formats', async () => {
      const apiRequirements = {
        supportedFormats: ['png']
      };

      const result = await service.preprocessForAPI(mockBlob, apiRequirements);

      expect(result.format).toBe('png');
    });
  });

  describe('enhanceImage', () => {
    it('should enhance image and return before/after comparison', async () => {
      const result: EnhancedImage = await service.enhanceImage(mockBlob);

      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('enhanced');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      
      expect(result.original).toBe(mockBlob);
      expect(result.enhanced).toBeInstanceOf(Blob);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should apply image enhancements to image data', async () => {
      await service.enhanceImage(mockBlob);

      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });
  });

  describe('detectDocumentEdges', () => {
    it('should detect document boundaries', async () => {
      const bounds: DocumentBounds = await service.detectDocumentEdges(mockBlob);

      expect(bounds).toHaveProperty('topLeft');
      expect(bounds).toHaveProperty('topRight');
      expect(bounds).toHaveProperty('bottomLeft');
      expect(bounds).toHaveProperty('bottomRight');
      
      // Verify bounds are within image dimensions
      expect(bounds.topLeft.x).toBeGreaterThanOrEqual(0);
      expect(bounds.topLeft.y).toBeGreaterThanOrEqual(0);
      expect(bounds.bottomRight.x).toBeLessThanOrEqual(800);
      expect(bounds.bottomRight.y).toBeLessThanOrEqual(600);
    });

    it('should return reasonable document bounds with margin', async () => {
      const bounds = await service.detectDocumentEdges(mockBlob);

      // With 5% margin on 800x600 image
      const expectedMarginX = 800 * 0.05;
      const expectedMarginY = 600 * 0.05;

      expect(bounds.topLeft.x).toBe(expectedMarginX);
      expect(bounds.topLeft.y).toBe(expectedMarginY);
      expect(bounds.bottomRight.x).toBe(800 - expectedMarginX);
      expect(bounds.bottomRight.y).toBe(600 - expectedMarginY);
    });
  });

  describe('cropToDocument', () => {
    it('should crop image to document bounds', async () => {
      const bounds: DocumentBounds = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 700, y: 100 },
        bottomLeft: { x: 100, y: 500 },
        bottomRight: { x: 700, y: 500 }
      };

      const result = await service.cropToDocument(mockBlob, bounds);

      expect(result).toBeInstanceOf(Blob);
      expect(global.document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should calculate correct crop dimensions', async () => {
      const bounds: DocumentBounds = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 750, y: 50 },
        bottomLeft: { x: 50, y: 550 },
        bottomRight: { x: 750, y: 550 }
      };

      await service.cropToDocument(mockBlob, bounds);

      // Verify canvas was created with correct dimensions
      const croppedCanvas = mockCanvas;
      expect(croppedCanvas.width).toBe(700); // 750 - 50
      expect(croppedCanvas.height).toBe(500); // 550 - 50
    });
  });

  describe('adjustContrast', () => {
    it('should adjust image contrast', async () => {
      const contrastLevel = 50;
      const result = await service.adjustContrast(mockBlob, contrastLevel);

      expect(result).toBeInstanceOf(Blob);
      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });

    it('should handle negative contrast values', async () => {
      const result = await service.adjustContrast(mockBlob, -30);

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('adjustBrightness', () => {
    it('should adjust image brightness', async () => {
      const brightnessLevel = 25;
      const result = await service.adjustBrightness(mockBlob, brightnessLevel);

      expect(result).toBeInstanceOf(Blob);
      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });

    it('should handle negative brightness values', async () => {
      const result = await service.adjustBrightness(mockBlob, -20);

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('removeShadows', () => {
    it('should remove shadows from image', async () => {
      const result = await service.removeShadows(mockBlob);

      expect(result).toBeInstanceOf(Blob);
      expect(mockContext.getImageData).toHaveBeenCalled();
      expect(mockContext.putImageData).toHaveBeenCalled();
    });
  });

  describe('convertToPDF', () => {
    it('should convert multiple images to PDF', async () => {
      // Mock jsPDF
      const mockPDF = {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297
          }
        },
        addPage: jest.fn(),
        addImage: jest.fn(),
        output: jest.fn(() => new Blob(['pdf content'], { type: 'application/pdf' }))
      };

      jest.doMock('jspdf', () => ({
        jsPDF: jest.fn(() => mockPDF)
      }));

      const images = [mockBlob, mockBlob];
      const result = await service.convertToPDF(images);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should handle single image PDF conversion', async () => {
      const mockPDF = {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297
          }
        },
        addPage: jest.fn(),
        addImage: jest.fn(),
        output: jest.fn(() => new Blob(['pdf content'], { type: 'application/pdf' }))
      };

      jest.doMock('jspdf', () => ({
        jsPDF: jest.fn(() => mockPDF)
      }));

      const result = await service.convertToPDF([mockBlob]);

      expect(result).toBeInstanceOf(Blob);
      expect(mockPDF.addPage).not.toHaveBeenCalled(); // No additional pages for single image
    });
  });

  describe('parsePDF', () => {
    it('should parse PDF and extract pages as images', async () => {
      // Mock PDF.js
      const mockPage = {
        getViewport: jest.fn(() => ({ width: 800, height: 600 })),
        render: jest.fn(() => ({ promise: Promise.resolve() }))
      };

      const mockPDF = {
        numPages: 2,
        getPage: jest.fn(() => Promise.resolve(mockPage))
      };

      const mockPDFJS = {
        getDocument: jest.fn(() => ({ promise: Promise.resolve(mockPDF) })),
        GlobalWorkerOptions: { workerSrc: '' },
        version: '3.0.0'
      };

      jest.doMock('pdfjs-dist', () => mockPDFJS);

      const pdfBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      const result = await service.parsePDF(pdfBlob);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Blob);
      expect(result[1]).toBeInstanceOf(Blob);
    });
  });

  describe('processMultiPageDocument', () => {
    it('should process multiple pages with default options', async () => {
      const images = [mockBlob, mockBlob, mockBlob];
      const result = await service.processMultiPageDocument(images);

      expect(result.pages).toHaveLength(3);
      expect(result.totalPages).toBe(3);
      expect(result.processingInfo).toHaveLength(3);
      expect(result.combinedPDF).toBeUndefined();
    });

    it('should combine pages into PDF when requested', async () => {
      const mockPDF = {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297
          }
        },
        addPage: jest.fn(),
        addImage: jest.fn(),
        output: jest.fn(() => new Blob(['pdf content'], { type: 'application/pdf' }))
      };

      jest.doMock('jspdf', () => ({
        jsPDF: jest.fn(() => mockPDF)
      }));

      const images = [mockBlob, mockBlob];
      const result = await service.processMultiPageDocument(images, {
        combineIntoPDF: true
      });

      expect(result.combinedPDF).toBeInstanceOf(Blob);
      expect(result.combinedPDF?.type).toBe('application/pdf');
    });

    it('should limit pages per batch', async () => {
      const manyImages = Array(100).fill(mockBlob);
      const result = await service.processMultiPageDocument(manyImages, {
        maxPagesPerBatch: 10
      });

      expect(result.pages).toHaveLength(10);
      expect(result.totalPages).toBe(10);
    });

    it('should optimize for OCR when requested', async () => {
      const images = [mockBlob];
      const result = await service.processMultiPageDocument(images, {
        optimizeForOCR: true
      });

      expect(result.pages).toHaveLength(1);
      // Verify OCR optimization was applied (image data was processed)
      expect(mockContext.getImageData).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle canvas context creation failure', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      await expect(service.enhanceImage(mockBlob)).rejects.toThrow('Unable to create canvas context');
    });

    it('should handle image loading failure', async () => {
      const mockImage = {
        onload: null,
        onerror: null,
        src: ''
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImage);

      const promise = service.enhanceImage(mockBlob);

      // Simulate image loading error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(promise).rejects.toThrow('Failed to load image');
    });

    it('should handle blob conversion failure', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null);
      });

      await expect(service.enhanceImage(mockBlob)).rejects.toThrow('Failed to convert canvas to jpeg blob');
    });
  });
});