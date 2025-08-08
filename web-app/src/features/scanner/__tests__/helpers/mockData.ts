import { OCRResult, ProcessedDocument, DocumentStatus, AccessLevel, ProviderStatus } from '@/types/scanner';

/**
 * Common mock data for scanner tests
 */

export const mockOCRResult: OCRResult = {
  text: 'Sample extracted text',
  confidence: 0.95,
  language: 'en',
  processingTime: 1500,
  metadata: {
    provider: 'openai',
    model: 'gpt-4-vision-preview',
    timestamp: new Date().toISOString()
  }
};

export const mockProcessedDocument: ProcessedDocument = {
  id: 'doc-123',
  title: 'Test Document',
  content: 'Sample document content',
  status: DocumentStatus.PROCESSED,
  accessLevel: AccessLevel.PRIVATE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'user-123',
  fileUrl: 'https://example.com/doc.pdf',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  metadata: {
    fileSize: 1024,
    pageCount: 1,
    processingTime: 2000,
    ocrProvider: 'openai'
  }
};

export const mockProviderStatus: ProviderStatus = {
  available: true,
  quotaRemaining: 1000,
  lastChecked: new Date().toISOString()
};

export const mockDbRecord = {
  id: 'doc-123',
  title: 'Test Document',
  content: 'Sample document content',
  status: 'processed',
  access_level: 'private',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'user-123',
  file_url: 'https://example.com/doc.pdf',
  thumbnail_url: 'https://example.com/thumb.jpg',
  file_size: 1024,
  page_count: 1,
  processing_time: 2000,
  ocr_provider: 'openai'
};
