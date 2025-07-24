const { ImageProcessingService } = require('../scanner/imageProcessingService');

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: jest.fn((pageNum) => Promise.resolve({
        getViewport: jest.fn(() => ({ width: 800, height: 600 })),
        render: jest.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  }))
}));

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    },
    addPage: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' }))
  }))
}));

// Mock canvas and image APIs
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 100,
      height: 100
    })),
    putImageData: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  }))
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: jest.fn((callback) => {
    callback(new Blob(['mock image'], { type: 'image/jpeg' }));
  })
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: jest.fn(() => 'data:image/jpeg;base64,mock')
});

// Mock Image constructor
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 100;
    this.height = 100;
    
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('ImageProcessingService', () => {
  let service;
  let mockBlob;

  beforeEach(() => {
    service = new ImageProcessingService();
    mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
  });

  describe('Image Preprocessing', () => {
    it('should compress image with default options', async () => {
      const result = await service.compressImage(mockBlob);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('dimensions');
    });

    it('should convert image format', async () => {
      const result = await service.convertFormat(mockBlob, 'png', 0.8);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should optimize image for OCR', async () => {
      const result = await service.optimizeForOCR(mockBlob);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should preprocess image for API', async () => {
      const apiRequirements = {
        maxFileSize: 2 * 1024 * 1024, // 2MB
        maxDimensions: { width: 1024, height: 1024 },
        supportedFormats: ['jpeg', 'png']
      };
      
      const result = await service.preprocessForAPI(mockBlob, apiRequirements);
      
      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('format');
    });
  });

  describe('PDF Handling', () => {
    it('should convert images to PDF', async () => {
      const images = [mockBlob, mockBlob];
      
      const result = await service.convertToPDF(images);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should parse PDF and extract pages', async () => {
      const pdfBlob = new Blob(['mock pdf'], { type: 'application/pdf' });
      
      const result = await service.parsePDF(pdfBlob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should extract PDF pages with page numbers', async () => {
      const pdfBlob = new Blob(['mock pdf'], { type: 'application/pdf' });
      
      const result = await service.extractPDFPages(pdfBlob);
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('pageNumber');
        expect(result[0]).toHaveProperty('image');
      }
    });

    it('should process multi-page document', async () => {
      const options = {
        combineIntoPDF: true,
        optimizeForOCR: true,
        maxPagesPerBatch: 10
      };
      
      const result = await service.processMultiPageDocument([mockBlob, mockBlob], options);
      
      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('processingInfo');
      expect(result.totalPages).toBe(2);
    });
  });

  describe('Image Enhancement', () => {
    it('should enhance image', async () => {
      const result = await service.enhanceImage(mockBlob);
      
      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('enhanced');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
    });

    it('should adjust contrast', async () => {
      const result = await service.adjustContrast(mockBlob, 20);
      
      expect(result).toBeInstanceOf(Blob);
    });

    it('should adjust brightness', async () => {
      const result = await service.adjustBrightness(mockBlob, 15);
      
      expect(result).toBeInstanceOf(Blob);
    });
  });
});