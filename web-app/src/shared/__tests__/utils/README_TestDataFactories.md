# Test Data Factories

This module provides a comprehensive set of factory functions for creating consistent, realistic test data for all major entities in the Nexa Manager application.

## Overview

Test data factories help create consistent, predictable test data that:
- Reduces test setup boilerplate
- Ensures data consistency across tests
- Provides realistic data that matches production schemas
- Supports easy customization through overrides
- Maintains reproducibility with seeded random data

## Installation

The factories use `@faker-js/faker` for generating realistic data:

```bash
npm install --save-dev @faker-js/faker
```

## Basic Usage

```javascript
import { 
  createMockUser, 
  createMockClient, 
  createMockInvoice 
} from '@/shared/__tests__/utils/testDataFactories';

// Create a basic user
const user = createMockUser();

// Create a user with custom properties
const adminUser = createMockUser({
  role: 'admin',
  first_name: 'John',
  email: 'john@example.com'
});

// Create multiple clients
const clients = createMockClients(5);
```

## Available Factories

### User and Authentication

- `createMockUser(overrides)` - Creates a user profile
- `createMockOrganization(overrides)` - Creates an organization
- `createAuthenticatedState(userOverrides)` - Creates authenticated auth state
- `createUnauthenticatedState()` - Creates unauthenticated auth state
- `createLoadingState()` - Creates loading auth state

### Business Entities

- `createMockClient(overrides)` - Creates a client
- `createMockClients(count, overrides)` - Creates multiple clients
- `createMockInvoice(overrides)` - Creates an invoice with items
- `createMockInvoices(count, overrides)` - Creates multiple invoices
- `createMockInvoiceItem(overrides)` - Creates an invoice line item
- `createMockPayment(overrides)` - Creates a payment record
- `createMockProduct(overrides)` - Creates a product
- `createMockDocument(overrides)` - Creates a document record
- `createMockCalendarEvent(overrides)` - Creates a calendar event

### Email System

- `createMockEmail(overrides)` - Creates an email message
- `createMockEmailAddress(overrides)` - Creates an email address object
- `createMockEmailRecipients(overrides)` - Creates email recipients structure
- `createMockEmailAttachment(overrides)` - Creates an email attachment
- `createMockEmailTemplate(overrides)` - Creates an email template

### Scanner System

- `createMockProcessedDocument(overrides)` - Creates a processed document
- `createMockOCRResult(overrides)` - Creates an OCR processing result

### Analytics

- `createMockAnalyticsMetrics(overrides)` - Creates analytics metrics
- `createMockTrendData(count, overrides)` - Creates trend data points

### API Responses

- `createMockApiResponse(data, overrides)` - Creates a success API response
- `createMockApiError(overrides)` - Creates an error API response
- `createMockPaginatedResponse(data, overrides)` - Creates a paginated response

### Form States

- `createMockFormState(data, overrides)` - Creates a form state
- `createMockFormStateWithErrors(data, errors, overrides)` - Creates a form state with validation errors

## Advanced Usage

### Creating Related Data

Use `createWithRelations` to create objects with related entities:

```javascript
import { createWithRelations, createMockInvoice, createMockClient, createMockPayment } from './testDataFactories';

const invoiceWithRelations = createWithRelations(createMockInvoice, {
  client: () => createMockClient({ name: 'ACME Corp' }),
  payments: () => [
    createMockPayment({ amount: 500 }),
    createMockPayment({ amount: 300 })
  ]
});
```

### Creating Multiple Items

Use `createMultiple` for creating arrays of similar items:

```javascript
import { createMultiple, createMockUser } from './testDataFactories';

const adminUsers = createMultiple(createMockUser, 3, { role: 'admin' });
const testUsers = createMultiple(createMockUser, 10);
```

### Reproducible Test Data

Use `resetTestDataSeed` to ensure consistent data across test runs:

```javascript
import { resetTestDataSeed, createMockUser } from './testDataFactories';

beforeEach(() => {
  resetTestDataSeed(12345); // Use consistent seed
});

test('should create consistent user data', () => {
  const user1 = createMockUser();
  const user2 = createMockUser();
  
  // With same seed, first user will always have same properties
  expect(user1.first_name).toBe('Expected Name');
});
```

## Common Patterns

### Testing Components with Mock Data

```javascript
import { render } from '@testing-library/react';
import { createMockClient } from '@/shared/__tests__/utils/testDataFactories';
import ClientCard from '@/components/clients/ClientCard';

test('should render client card correctly', () => {
  const client = createMockClient({
    name: 'Test Client',
    status: 'active'
  });

  render(<ClientCard client={client} />);
  
  expect(screen.getByText('Test Client')).toBeInTheDocument();
});
```

### Testing API Services

```javascript
import { createMockApiResponse, createMockClient } from '@/shared/__tests__/utils/testDataFactories';
import clientService from '@/lib/clientService';

test('should handle client creation', async () => {
  const mockClient = createMockClient({ name: 'New Client' });
  const mockResponse = createMockApiResponse(mockClient);
  
  jest.spyOn(clientService, 'create').mockResolvedValue(mockResponse);
  
  const result = await clientService.create({ name: 'New Client' });
  
  expect(result.data.name).toBe('New Client');
});
```

### Testing Forms

```javascript
import { createMockFormState, createMockFormStateWithErrors } from '@/shared/__tests__/utils/testDataFactories';

test('should handle form validation', () => {
  const validFormState = createMockFormState({
    name: 'John Doe',
    email: 'john@example.com'
  });

  const invalidFormState = createMockFormStateWithErrors(
    { name: '', email: 'invalid' },
    { name: 'Name is required', email: 'Invalid email format' }
  );

  expect(validFormState.isValid).toBe(true);
  expect(invalidFormState.isValid).toBe(false);
});
```

### Testing Authentication States

```javascript
import { createAuthenticatedState, createUnauthenticatedState } from '@/shared/__tests__/utils/testDataFactories';

test('should render differently for authenticated users', () => {
  const authState = createAuthenticatedState({
    role: 'admin',
    first_name: 'Admin User'
  });

  const unauthState = createUnauthenticatedState();

  // Test authenticated state
  render(<Dashboard authState={authState} />);
  expect(screen.getByText('Welcome, Admin User')).toBeInTheDocument();

  // Test unauthenticated state
  render(<Dashboard authState={unauthState} />);
  expect(screen.getByText('Please log in')).toBeInTheDocument();
});
```

## Data Structure Examples

### User Object
```javascript
{
  id: "user_123e4567-e89b-12d3-a456-426614174000",
  email: "john.doe@example.com",
  first_name: "John",
  last_name: "Doe",
  avatar_url: "https://example.com/avatar.jpg",
  role: "user",
  is_active: true,
  last_login: "2024-01-15T10:30:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-15T10:30:00.000Z",
  preferences: {
    theme: "light",
    language: "en",
    timezone: "UTC",
    notifications: {
      email: true,
      push: true,
      desktop: false
    },
    dashboard: {
      layout: "default",
      widgets: ["revenue", "clients", "invoices"]
    }
  }
}
```

### Invoice Object
```javascript
{
  id: "invoice_123e4567-e89b-12d3-a456-426614174000",
  invoice_number: "INV-000001",
  client_id: "client_123e4567-e89b-12d3-a456-426614174000",
  amount: 1000.00,
  tax_amount: 210.00,
  total_amount: 1210.00,
  currency: "EUR",
  status: "sent",
  due_date: "2024-02-15T00:00:00.000Z",
  issued_date: "2024-01-15T00:00:00.000Z",
  paid_date: null,
  items: [
    {
      id: "item_123e4567-e89b-12d3-a456-426614174000",
      description: "Consulting Services",
      quantity: 10,
      unit_price: 100.00,
      total: 1000.00
    }
  ],
  notes: "Payment due within 30 days",
  created_at: "2024-01-15T00:00:00.000Z",
  updated_at: "2024-01-15T00:00:00.000Z"
}
```

## Best Practices

### 1. Use Specific Overrides
```javascript
// Good - specific test data
const client = createMockClient({
  name: 'Test Client for Invoice Creation',
  status: 'active'
});

// Avoid - generic data that doesn't relate to test
const client = createMockClient();
```

### 2. Reset Seed for Consistency
```javascript
beforeEach(() => {
  resetTestDataSeed(12345);
});
```

### 3. Create Test-Specific Factories
```javascript
// Create specialized factories for specific test scenarios
const createActiveClient = (overrides = {}) => 
  createMockClient({ status: 'active', ...overrides });

const createOverdueInvoice = (overrides = {}) => 
  createMockInvoice({ 
    status: 'overdue', 
    due_date: generateTimestamp(30), // 30 days ago
    ...overrides 
  });
```

### 4. Use Relations for Integration Tests
```javascript
const testData = createWithRelations(createMockInvoice, {
  client: () => createMockClient({ name: 'Integration Test Client' }),
  payments: () => [createMockPayment({ status: 'completed' })]
});
```

### 5. Validate Generated Data
```javascript
test('factory should create valid data', () => {
  const user = createMockUser();
  
  expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(user.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(typeof user.id).toBe('string');
});
```

## Extending Factories

To add new factories or extend existing ones:

```javascript
// Add to testDataFactories.js
export const createMockCustomEntity = (overrides = {}) => {
  return createFactory({
    id: generateTestId('custom'),
    name: faker.company.name(),
    // ... other properties
    created_at: generateTimestamp(7),
    updated_at: generateTimestamp(1),
  }, overrides);
};

// Use in tests
import { createMockCustomEntity } from './testDataFactories';

const entity = createMockCustomEntity({ name: 'Custom Name' });
```

## Troubleshooting

### Common Issues

1. **Inconsistent Data Between Test Runs**
   - Solution: Use `resetTestDataSeed()` in `beforeEach`

2. **Missing Required Fields**
   - Solution: Check factory implementation and add missing fields

3. **Invalid Data Types**
   - Solution: Validate factory output in tests

4. **Performance Issues with Large Datasets**
   - Solution: Use `createMultiple` efficiently and consider mocking instead of generating large datasets

### Debugging

```javascript
// Log generated data to inspect structure
const user = createMockUser();
console.log('Generated user:', JSON.stringify(user, null, 2));

// Validate data structure
expect(user).toMatchObject({
  id: expect.any(String),
  email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  created_at: expect.any(String)
});
```

## Contributing

When adding new factories:

1. Follow the existing naming convention (`createMock[EntityName]`)
2. Include comprehensive JSDoc comments
3. Add corresponding tests in `testDataFactories.test.js`
4. Update this README with usage examples
5. Ensure factories match the actual data structures used in the application