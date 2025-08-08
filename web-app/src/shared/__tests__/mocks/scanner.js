// Mock scanner configuration for tests

// Define OCRProvider values directly to avoid import issues
export const OCRProvider = {
  OpenAI: 'openai',
  Qwen: 'qwen',
  Azure: 'azure',
  Google: 'google',
  Fallback: 'fallback'
};

export const scannerConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB for tests
  acceptedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  ocrProviders: [
    {
      provider: OCRProvider.OpenAI,
      apiKey: 'test-openai-key',
      enabled: true,
      priority: 1,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    },
    {
      provider: OCRProvider.Qwen,
      apiKey: 'test-qwen-key',
      enabled: true,
      priority: 2,
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 2000
      }
    },
    {
      provider: OCRProvider.Fallback,
      apiKey: '',
      enabled: true,
      priority: 999 // Lowest priority
    }
  ],
  imageProcessing: {
    maxResolution: {
      width: 1024,
      height: 1024
    },
    compressionQuality: 0.9,
    enableEnhancement: true
  },
  storage: {
    tempStoragePath: '/tmp/scanner',
    permanentStoragePath: '/documents/scanned',
    retentionDays: 30
  }
};

export default scannerConfig;
