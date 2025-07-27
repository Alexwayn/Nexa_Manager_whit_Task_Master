# Testing Documentation

This document provides comprehensive guidelines for testing in the Nexa Manager application, including patterns, best practices, and specific testing approaches for different components.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Jest coverage reports
- **Accessibility**: @testing-library/jest-dom
- **Mocking**: Jest mocks with custom utilities

## Test Structure

```
web-app/src/
├── __tests__/                    # Global test utilities and setup
│   ├── utils/                   # Test helper functions
│   ├── mocks/                   # Global mocks
│   └── setup.ts                 # Jest setup configuration
├── features/                    # Feature-based tests
│   ├── auth/__tests__/          # Authentication tests
│   ├── scanner/__tests__/       # Scanner system tests
│   ├── email/__tests__/         # Email system tests
│   └── clients/__tests__/       # Client management tests
└── shared/__tests__/            # Shared component tests
```

## Environment Variable Testing

### Pattern for Mocking Environment Variables

When testing services that depend on environment variables, use the following pattern:

```typescript
// Mock the env utility at the top of your test file
jest.mock('@/utils/env', () => ({
  getEnvVar: jest.fn((key, defaultValue = '') => {
    const envVars = {
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      VITE_AZURE_VISION_KEY: 'test-azure-key',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key'
    };
    return envVars[key] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true),
  isTestEnvironment: jest.fn(() => true)
}));
```

### Why This Pattern?

1. **Consistency**: All tests use the same environment variable values
2. **Isolation**: Tests don't depend on actual environment configuration
3. **Reliability**: Tests work in any environment (CI/CD, local, etc.)
4. **Flexibility**: Easy to override specific values for individual tests

### Example: OCR Provider Factory Test

```typescript
import { OCRProviderFactory } from '@scanner/services/ocrProviderFactory';
import { OCRProvider, ProviderStatus } from '@shared/types/scanner';

// Mock the env utility
jest.mock('@/utils/env', () => ({
  getEnvVar: jest.fn((key, defaultValue = '') => {
    const envVars = {
      VITE_OPENAI_API_KEY: 'test-openai-key',
      VITE_QWEN_API_KEY: 'test-qwen-key',
      VITE_AZURE_VISION_KEY: 'test-azure-key'
    };
    return envVars[key] || defaultValue;
  }),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => true)
}));

describe('OCRProviderFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset factory state
    (OCRProviderFactory as any).providers = new Map();
    (OCRProviderFactory as any).initialized = false;
  });

  it('should initialize with mocked environment variables', async () => {
    await OCRProviderFactory.initialize();
    expect((OCRProviderFactory as any).initialized).toBe(true);
  });
});
```

## Service Testing Patterns

### Factory Pattern Testing

For services using the factory pattern (like OCRProviderFactory):

```typescript
describe('ServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton state
    (ServiceFactory as any).instances = new Map();
    (ServiceFactory as any).initialized = false;
  });

  afterEach(() => {
    // Clean up after each test
    ServiceFactory.destroy();
  });
});
```

### Provider Status Testing

For services with provider status management:

```typescript
it('should return correct provider status', () => {
  const status = ServiceFactory.getProviderStatus(Provider.OpenAI);
  
  expect(status).toHaveProperty('available');
  expect(status).toHaveProperty('rateLimited');
  expect(typeof status.available).toBe('boolean');
  expect(typeof status.rateLimited).toBe('boolean');
});

it('should handle non-existent providers gracefully', () => {
  const status = ServiceFactory.getProviderStatus('nonexistent' as Provider);
  
  expect(status.available).toBe(false);
  expect(status.rateLimited).toBe(false);
});
```

## Component Testing

### React Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScannerPage } from '@scanner/components/ScannerPage';
import { TestProviders } from '@/__tests__/utils/TestProviders';

describe('ScannerPage', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <TestProviders>
        {component}
      </TestProviders>
    );
  };

  it('should render scanner interface', () => {
    renderWithProviders(<ScannerPage />);
    
    expect(screen.getByText('Document Scanner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('should handle file upload', async () => {
    renderWithProviders(<ScannerPage />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useScanner } from '@scanner/hooks/useScanner';
import { TestProviders } from '@/__tests__/utils/TestProviders';

describe('useScanner', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders>{children}</TestProviders>
  );

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useScanner(), { wrapper });
    
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.documents).toEqual([]);
  });

  it('should handle document processing', async () => {
    const { result } = renderHook(() => useScanner(), { wrapper });
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      await result.current.processDocument(file);
    });
    
    expect(result.current.documents).toHaveLength(1);
  });
});
```

## API Testing

### Service Layer Testing

```typescript
import { ocrService } from '@scanner/services/ocrService';
import { OCRProvider } from '@shared/types/scanner';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('OCRService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should extract text from image', async () => {
    const mockResponse = {
      text: 'Extracted text',
      confidence: 0.95,
      provider: OCRProvider.OpenAI
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const image = new Blob(['test'], { type: 'image/jpeg' });
    const result = await ocrService.extractText(image);

    expect(result.text).toBe('Extracted text');
    expect(result.confidence).toBe(0.95);
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const image = new Blob(['test'], { type: 'image/jpeg' });
    
    await expect(ocrService.extractText(image)).rejects.toThrow('API Error');
  });
});
```

## Error Handling Testing

### Error Boundary Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## Performance Testing

### Component Performance

```typescript
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('Component Performance', () => {
  it('should render within acceptable time', () => {
    const start = performance.now();
    
    render(<LargeComponent data={largeDataSet} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });
});
```

## Integration Testing

### End-to-End Workflows

```typescript
import { test, expect } from '@playwright/test';

test.describe('Scanner Workflow', () => {
  test('should complete document scanning process', async ({ page }) => {
    await page.goto('/scanner');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-document.jpg');
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();
    
    // Verify completion
    await expect(page.locator('[data-testid="scan-complete"]')).toBeVisible();
    
    // Check extracted text
    const extractedText = await page.locator('[data-testid="extracted-text"]').textContent();
    expect(extractedText).toBeTruthy();
  });
});
```

## Test Utilities

### Custom Render Function

```typescript
// __tests__/utils/TestProviders.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@shared/state/providers/AuthContext';
import { ThemeProvider } from '@shared/state/providers/ThemeContext';

export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

### Mock Data Factories

```typescript
// __tests__/utils/mockData.ts
import { ProcessedDocument, OCRResult } from '@shared/types/scanner';

export const createMockDocument = (overrides?: Partial<ProcessedDocument>): ProcessedDocument => ({
  id: 'test-doc-1',
  title: 'Test Document',
  category: 'invoice',
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'test-user',
  originalFile: {
    url: 'https://example.com/original.jpg',
    name: 'original.jpg',
    size: 1024,
    type: 'image/jpeg'
  },
  enhancedFile: {
    url: 'https://example.com/enhanced.jpg',
    size: 2048
  },
  textContent: 'Sample extracted text',
  ocrConfidence: 0.95,
  ocrLanguage: 'en',
  status: 'complete',
  sharingSettings: {
    isShared: false,
    accessLevel: 'view',
    sharedWith: []
  },
  accessLog: [],
  ...overrides
});

export const createMockOCRResult = (overrides?: Partial<OCRResult>): OCRResult => ({
  text: 'Sample OCR text',
  confidence: 0.95,
  provider: 'openai',
  processingTime: 1500,
  ...overrides
});
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking Strategy
- Mock external dependencies (APIs, services)
- Use environment variable mocking for consistent test environments
- Reset mocks between tests to avoid interference

### 3. Async Testing
- Always await async operations
- Use `waitFor` for elements that appear asynchronously
- Handle loading states in component tests

### 4. Error Testing
- Test both success and failure scenarios
- Verify error messages and error handling
- Test edge cases and boundary conditions

### 5. Performance Considerations
- Keep tests fast and focused
- Use shallow rendering when deep rendering isn't necessary
- Mock heavy operations and external services

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test scanner

# Run E2E tests
npm run playwright:test
```

## Coverage Requirements

- **Minimum Coverage**: 80% for all code
- **Critical Paths**: 95% coverage for authentication, payment, and data processing
- **New Features**: 90% coverage required before merge

## Continuous Integration

Tests are automatically run on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

All tests must pass before code can be merged to the main branch.