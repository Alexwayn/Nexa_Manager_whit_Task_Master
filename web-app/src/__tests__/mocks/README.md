# Mocking Infrastructure Documentation

This directory contains a comprehensive mocking infrastructure for testing the Nexa Manager application. The mocking system provides detailed mocks for all external dependencies, services, and third-party libraries.

## 📁 File Structure

```
__tests__/mocks/
├── index.js              # Main mock exports and global setup
├── supabase.js           # Supabase client and services mocks
├── logger.js             # Logger service mocks
├── reactRouter.js        # React Router mocks
├── services.js           # Application services mocks
├── externalLibraries.js  # Third-party library mocks
├── mockConfig.js         # Mock configuration and state management
└── README.md             # This documentation file
```

## 🚀 Quick Start

### Basic Setup

```javascript
import { setupAllMocks, cleanupAllMocks } from '../mocks/mockConfig';

// In your test file
beforeAll(async () => {
  await setupAllMocks();
});

afterAll(async () => {
  await cleanupAllMocks();
});
```

### Using Preset Configurations

```javascript
import { 
  setupUnitTestMocks, 
  setupIntegrationTestMocks,
  setupE2ETestMocks 
} from '../mocks/mockConfig';

// For unit tests
beforeAll(() => setupUnitTestMocks());

// For integration tests
beforeAll(() => setupIntegrationTestMocks());

// For E2E tests
beforeAll(() => setupE2ETestMocks());
```

## 📋 Available Mocks

### 1. Supabase Mocks (`supabase.js`)

Comprehensive mocking for Supabase client and all its services.

```javascript
import { mockSupabase, createMockSupabaseClient } from '../mocks/supabase';

// Basic usage
const client = createMockSupabaseClient();

// Mock authentication
client.auth.signIn.mockResolvedValue({
  data: { user: mockUser, session: mockSession },
  error: null
});

// Mock database queries
client.from('clients').select.mockReturnValue({
  data: [mockClient],
  error: null
});

// Mock storage operations
client.storage.from('avatars').upload.mockResolvedValue({
  data: { path: 'avatars/test.jpg' },
  error: null
});
```

**Features:**
- Authentication (sign in/out, user management)
- Database operations (CRUD, queries, filters)
- Storage (upload, download, delete)
- Realtime subscriptions
- Error simulation
- Response builders

### 2. Logger Mocks (`logger.js`)

Advanced logging system mocks with testing utilities.

```javascript
import { mockLogger, createLoggerWithSpies } from '../mocks/logger';

// Basic usage
mockLogger.info('Test message');
mockLogger.error('Error message', { context: 'test' });

// Testing utilities
expect(mockLogger.hasLogs('info')).toBe(true);
expect(mockLogger.findLogs('error', 'Error message')).toHaveLength(1);
mockLogger.expectLog('info', 'Test message');

// Performance logging
mockLogger.startTimer('operation');
// ... some operation
mockLogger.endTimer('operation');
```

**Features:**
- All log levels (debug, info, warn, error)
- Performance timing
- Log querying and assertions
- Child logger creation
- Transport mocking
- Statistics tracking

### 3. React Router Mocks (`reactRouter.js`)

Complete React Router mocking with navigation testing.

```javascript
import { mockReactRouter, routerTestUtils } from '../mocks/reactRouter';

// Mock navigation
const navigate = mockReactRouter.useNavigate();
navigate('/dashboard');

// Test navigation calls
expect(navigate).toHaveBeenCalledWith('/dashboard');

// Router wrapper for testing
const RouterWrapper = routerTestUtils.createRouterWrapper({
  initialEntries: ['/clients']
});

render(
  <RouterWrapper>
    <YourComponent />
  </RouterWrapper>
);
```

**Features:**
- All React Router hooks
- Router components (BrowserRouter, MemoryRouter, etc.)
- Navigation components (Link, NavLink, etc.)
- History management
- Route matching
- Testing utilities

### 4. Services Mocks (`services.js`)

Application-specific service mocks.

```javascript
import { mockServices } from '../mocks/services';

// Email service
mockServices.EmailService.sendEmail.mockResolvedValue({ success: true });
mockServices.EmailService.validateEmail.mockReturnValue(true);

// Financial service
mockServices.FinancialService.formatCurrency.mockReturnValue('€1,234.56');
mockServices.FinancialService.calculateTax.mockReturnValue(220.00);

// Tax calculation
mockServices.TaxCalculationService.calculateIVA.mockReturnValue({
  net: 1000,
  tax: 220,
  gross: 1220
});
```

**Features:**
- EmailService (validation, templates, sending)
- FinancialService (formatting, calculations)
- TaxCalculationService (IVA, exemptions)
- IncomeService (CRUD, analytics)
- ExpenseService (CRUD, analytics)

### 5. External Libraries Mocks (`externalLibraries.js`)

Third-party library mocks for common dependencies.

```javascript
import { externalLibraryMocks } from '../mocks/externalLibraries';

// PDF generation
const pdf = externalLibraryMocks.pdf;
pdf.text('Hello World', 10, 10);
pdf.save('document.pdf');

// Chart.js
const chart = externalLibraryMocks.chart;
chart.update();
chart._updateData({ labels: ['A', 'B'], datasets: [...] });

// Date utilities
const dateLib = externalLibraryMocks.date;
const formatted = dateLib.format(new Date(), 'yyyy-MM-dd');

// Validation
const schema = externalLibraryMocks.validation.string().email();
schema.validate('test@example.com');

// Toast notifications
externalLibraryMocks.toast.success('Operation completed!');
```

**Features:**
- PDF generation (jsPDF, PDFKit)
- Charts (Chart.js, React Chart.js 2)
- Date/time utilities (date-fns, moment, dayjs)
- Validation (Yup, Joi, Zod)
- Crypto/security operations
- Toast notifications
- File operations

## ⚙️ Configuration

### Mock State Manager

The `mockConfig.js` file provides a centralized mock state manager:

```javascript
import { mockStateManager, MOCK_CONFIG } from '../mocks/mockConfig';

// Custom configuration
const customConfig = {
  supabase: {
    autoMock: true,
    defaultUser: {
      id: 'custom-user-id',
      email: 'custom@example.com'
    }
  },
  logger: {
    level: 'error', // Only log errors
    enableConsole: true
  }
};

await mockStateManager.setupMocks(customConfig);
```

### Preset Configurations

```javascript
// Available presets
PRESET_CONFIGS = {
  minimal,      // Only essential mocks
  unit,         // All mocks for unit testing
  integration,  // Selective mocking for integration tests
  e2e          // Minimal mocking for E2E tests
}
```

## 🧪 Testing Patterns

### Unit Testing

```javascript
import { render, screen } from '@testing-library/react';
import { setupUnitTestMocks, cleanupAllMocks } from '../mocks/mockConfig';
import { mockSupabase } from '../mocks/supabase';
import ClientList from '../../components/ClientList';

describe('ClientList', () => {
  beforeAll(() => setupUnitTestMocks());
  afterAll(() => cleanupAllMocks());
  
  beforeEach(() => {
    // Setup test-specific mocks
    mockSupabase.from('clients').select.mockResolvedValue({
      data: [{ id: 1, name: 'Test Client' }],
      error: null
    });
  });
  
  it('should render client list', async () => {
    render(<ClientList />);
    
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
  });
});
```

### Integration Testing

```javascript
import { renderWithProviders } from '../utils/testUtils';
import { setupIntegrationTestMocks } from '../mocks/mockConfig';
import { mockServices } from '../mocks/services';

describe('Invoice Creation Flow', () => {
  beforeAll(() => setupIntegrationTestMocks());
  
  it('should create invoice with tax calculation', async () => {
    // Mock only external dependencies
    mockServices.TaxCalculationService.calculateIVA.mockReturnValue({
      net: 1000,
      tax: 220,
      gross: 1220
    });
    
    const { user } = renderWithProviders(<InvoiceForm />);
    
    // Test the full flow
    await user.type(screen.getByLabelText('Amount'), '1000');
    await user.click(screen.getByText('Calculate Tax'));
    
    expect(screen.getByText('€1,220.00')).toBeInTheDocument();
  });
});
```

### Error Testing

```javascript
import { mockSupabase } from '../mocks/supabase';

it('should handle database errors', async () => {
  // Mock error response
  mockSupabase.from('clients').select.mockResolvedValue({
    data: null,
    error: { message: 'Database connection failed' }
  });
  
  render(<ClientList />);
  
  expect(await screen.findByText('Error loading clients')).toBeInTheDocument();
});
```

### Performance Testing

```javascript
import { mockLogger } from '../mocks/logger';

it('should log performance metrics', async () => {
  render(<ExpensiveComponent />);
  
  // Check if performance was logged
  expect(mockLogger.hasLogs('info')).toBe(true);
  const perfLogs = mockLogger.findLogs('info', 'performance');
  expect(perfLogs.length).toBeGreaterThan(0);
});
```

## 🔧 Advanced Usage

### Custom Mock Creation

```javascript
import { createMockSupabaseClient } from '../mocks/supabase';

// Create custom Supabase client with specific behavior
const customClient = createMockSupabaseClient({
  defaultUser: { id: 'admin-user', role: 'admin' },
  enableRealtime: false
});

// Register custom mock
mockStateManager.registerMock('customSupabase', customClient);
```

### Mock Spying and Verification

```javascript
import { mockLogger } from '../mocks/logger';

// Spy on specific methods
const errorSpy = jest.spyOn(mockLogger, 'error');

// Trigger error
triggerError();

// Verify error was logged
expect(errorSpy).toHaveBeenCalledWith(
  expect.stringContaining('Error occurred'),
  expect.objectContaining({ context: 'test' })
);
```

### Mock Data Factories

```javascript
import { generateMockClient, generateMockInvoice } from '../utils/testUtils';

// Generate test data
const client = generateMockClient({ name: 'Custom Client' });
const invoice = generateMockInvoice({ clientId: client.id });

// Use in tests
mockSupabase.from('invoices').insert.mockResolvedValue({
  data: [invoice],
  error: null
});
```

## 📊 Mock Statistics and Debugging

```javascript
import { getMockStats } from '../mocks/mockConfig';

// Get mock statistics
const stats = getMockStats();
console.log('Total mocks:', stats.totalMocks);
console.log('Setup status:', stats.isSetup);
console.log('Mock details:', stats.mocks);

// Debug specific mock
const supabaseMock = mockStateManager.getMock('supabase');
console.log('Supabase calls:', supabaseMock.from.mock.calls);
```

## 🚨 Common Pitfalls and Solutions

### 1. Mock Not Working

**Problem:** Mock is not being used in tests.

**Solution:** Ensure mocks are set up before importing the module under test:

```javascript
// ❌ Wrong order
import ComponentToTest from './ComponentToTest';
import { setupAllMocks } from '../mocks/mockConfig';

// ✅ Correct order
import { setupAllMocks } from '../mocks/mockConfig';
beforeAll(() => setupAllMocks());
import ComponentToTest from './ComponentToTest';
```

### 2. Mock State Pollution

**Problem:** Tests affecting each other due to shared mock state.

**Solution:** Reset mocks between tests:

```javascript
afterEach(() => {
  jest.clearAllMocks();
  mockStateManager.resetMocks();
});
```

### 3. Async Mock Issues

**Problem:** Async operations not properly mocked.

**Solution:** Use proper async mock patterns:

```javascript
// ❌ Wrong
mockSupabase.from('clients').select.mockReturnValue({ data: [] });

// ✅ Correct
mockSupabase.from('clients').select.mockResolvedValue({ data: [] });
```

### 4. Module Hoisting Issues

**Problem:** Jest hoisting causing mock setup issues.

**Solution:** Use `jest.doMock()` for dynamic mocking:

```javascript
// In mockConfig.js
jest.doMock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockClient)
}));
```

## 📝 Best Practices

1. **Always clean up mocks** after tests to prevent pollution
2. **Use preset configurations** for consistent test environments
3. **Mock at the right level** - unit tests mock everything, integration tests mock selectively
4. **Verify mock calls** to ensure your code is calling dependencies correctly
5. **Use descriptive mock data** that makes test failures easier to understand
6. **Test error scenarios** by mocking error responses
7. **Keep mocks simple** - don't over-engineer mock implementations
8. **Document custom mocks** when creating project-specific mock behavior

## 🔄 Migration Guide

If you're migrating from an existing test setup:

1. **Replace manual mocks** with the centralized mock system
2. **Update test setup** to use `setupAllMocks()` and `cleanupAllMocks()`
3. **Migrate custom mocks** to the new mock factories
4. **Update assertions** to use the new mock utilities
5. **Test thoroughly** to ensure all functionality still works

## 🤝 Contributing

When adding new mocks:

1. **Follow the existing patterns** in the mock files
2. **Add comprehensive JSDoc comments** for all mock methods
3. **Include testing utilities** for common use cases
4. **Update this documentation** with usage examples
5. **Add tests** for the mock implementations themselves

---

**Happy Testing! 🎉**

For questions or issues with the mocking infrastructure, please refer to the test files for examples or create an issue in the project repository.