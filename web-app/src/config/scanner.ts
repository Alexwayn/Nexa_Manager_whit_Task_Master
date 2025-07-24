// Scanner feature configuration
import type { ScannerConfig } from '@/services/scanner/types';
import { OCRProvider } from '@/types/scanner';

export const scannerConfig: ScannerConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  ocrProviders: [
    {
      provider: OCRProvider.OpenAI,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
      priority: 1,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    },
    {
      provider: OCRProvider.Qwen,
      apiKey: import.meta.env.VITE_QWEN_API_KEY || '',
      enabled: !!import.meta.env.VITE_QWEN_API_KEY,
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
      width: 2048,
      height: 2048
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

// Environment-specific overrides
if (import.meta.env.DEV) {
  // Development settings
  scannerConfig.maxFileSize = 5 * 1024 * 1024; // 5MB for dev
  scannerConfig.imageProcessing.maxResolution = {
    width: 1024,
    height: 1024
  };
}

export default scannerConfig;