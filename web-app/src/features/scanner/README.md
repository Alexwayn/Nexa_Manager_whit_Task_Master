# Scanner Feature

## Overview

The Scanner feature provides document scanning, OCR (Optical Character Recognition), and receipt processing capabilities for Nexa Manager. It enables users to digitize physical documents and extract structured data for business processes.

## Public API

### Components
- `DocumentScanner` - Main scanning interface
- `OCRProcessor` - Text extraction from images
- `ReceiptProcessor` - Receipt data extraction
- `ScanPreview` - Scanned document preview
- `ScanHistory` - History of scanned documents

### Hooks
- `useScanner` - Scanner functionality management
- `useOCR` - OCR processing operations
- `useReceiptProcessing` - Receipt data extraction
- `useScanHistory` - Scan history management

### Services
- `scannerService` - Core scanning operations
- `ocrService` - Text extraction processing
- `receiptService` - Receipt data processing
- `imageProcessingService` - Image enhancement and processing

## Integration Patterns

Supports document digitization across features:
- **Financial**: Receipt scanning for expense tracking
- **Documents**: Scanned document storage
- **Clients**: Client document digitization

## Testing Approach

### Test Coverage Areas
- **Image Processing Accuracy**: Comprehensive testing of image enhancement and optimization
- **OCR Reliability**: Multi-provider OCR testing with fallback mechanisms
- **Data Extraction Precision**: Structured data extraction from various document types
- **Cache Management**: Result caching with proper timer management and cleanup
- **Error Handling**: Graceful degradation and recovery mechanisms

### Timer Management in Tests

Scanner services use timers for cache cleanup and batch processing. Tests implement proper timer management:

```typescript
describe('ScannerService', () => {
  let service: ScannerService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Only use fake timers if not already installed
    if (!jest.isMockFunction(setTimeout)) {
      jest.useFakeTimers();
    }
    
    service = new ScannerService();
  });

  afterEach(() => {
    // Clean up service resources before restoring timers
    if (service && typeof service.dispose === 'function') {
      service.dispose();
    }
    jest.useRealTimers();
  });
});
```

### Key Testing Patterns
- **Environment Variable Mocking**: Consistent OCR provider configuration across tests
- **Canvas API Mocking**: Full Canvas 2D context mocking for JSDOM compatibility
- **Async Operation Testing**: Proper promise handling for OCR and image processing
- **Resource Cleanup**: Proper disposal of services with timer-based operations
- **Provider Fallback Testing**: Multi-provider OCR fallback mechanism validation

## Dependencies

- Tesseract.js for OCR processing
- Canvas API for image manipulation
- File processing libraries