// Mock scanner types for tests

// Enums
export const DocumentStatus = {
  Processing: 'processing',
  Complete: 'complete',
  Error: 'error'
};

export const AccessLevel = {
  View: 'view',
  Edit: 'edit',
  Download: 'download'
};

export const OCRProvider = {
  OpenAI: 'openai',
  Qwen: 'qwen',
  Azure: 'azure',
  Google: 'google',
  Fallback: 'fallback'
};

// Mock interfaces as factory functions
export const createMockProcessedDocument = (overrides = {}) => ({
  id: 'mock-doc-id',
  title: 'Mock Document',
  description: 'Mock document description',
  category: 'invoice',
  tags: ['test'],
  clientId: 'mock-client-id',
  projectId: 'mock-project-id',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'mock-user-id',
  originalFile: {
    url: 'https://example.com/original.jpg',
    name: 'document.jpg',
    size: 1024000,
    type: 'image/jpeg'
  },
  enhancedFile: {
    url: 'https://example.com/enhanced.jpg',
    size: 512000
  },
  pdfFile: {
    url: 'https://example.com/document.pdf',
    size: 256000
  },
  textContent: 'Mock extracted text',
  ocrConfidence: 0.95,
  ocrLanguage: 'en',
  status: DocumentStatus.Complete,
  processingErrors: undefined,
  sharingSettings: {
    isShared: false,
    accessLevel: AccessLevel.View,
    sharedWith: []
  },
  accessLog: [],
  ...overrides
});

export const createMockOCRResult = (overrides = {}) => ({
  text: 'Mock OCR text',
  confidence: 0.95,
  provider: OCRProvider.OpenAI,
  processingTime: 1500,
  blocks: [
    {
      text: 'Mock OCR text',
      bounds: { x: 0, y: 0, width: 100, height: 20 },
      confidence: 0.95
    }
  ],
  ...overrides
});

export const createMockCacheOptions = (overrides = {}) => ({
  ttl: 86400000, // 24 hours
  maxSize: 10 * 1024 * 1024, // 10MB
  maxEntries: 1000,
  enablePersistence: true,
  compressionEnabled: false,
  ...overrides
});

export const createMockCacheStats = (overrides = {}) => ({
  totalEntries: 0,
  totalSize: 0,
  hitRate: 0,
  missRate: 0,
  oldestEntry: Date.now(),
  newestEntry: Date.now(),
  averageAccessCount: 0,
  ...overrides
});

// Export all types for easy access
export default {
  DocumentStatus,
  AccessLevel,
  OCRProvider,
  createMockProcessedDocument,
  createMockOCRResult,
  createMockCacheOptions,
  createMockCacheStats
};