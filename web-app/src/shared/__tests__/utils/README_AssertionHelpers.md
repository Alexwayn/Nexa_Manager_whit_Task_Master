# Assertion Helpers

This module provides custom assertion utilities that extend Jest's built-in assertions with domain-specific logic for the Nexa Manager application. These helpers make tests more readable, maintainable, and provide better error messages.

## Overview

The assertion helpers are organized into several categories:

- **DOM Assertions** - For testing DOM elements and their properties
- **Form Assertions** - For testing form fields and validation
- **Loading State Assertions** - For testing loading indicators
- **Error State Assertions** - For testing error and success messages
- **Data Assertions** - For testing data structures and validation
- **API Response Assertions** - For testing API response formats
- **Business Logic Assertions** - For testing domain-specific objects
- **Async Assertions** - For testing asynchronous behavior
- **Mock Assertions** - For testing mock function calls

## Installation

Import the assertion helpers in your test files:

```javascript
import {
  expectToHaveClasses,
  expectValidClient,
  expectApiResponse,
  expectElementToAppear,
  // ... other helpers
} from '@/shared/__tests__/utils/assertionHelpers';
```

Or import the entire module:

```javascript
import assertionHelpers from '@/shared/__tests__/utils/assertionHelpers';
```

## Usage Examples

### DOM Assertions

#### expectToHaveClasses
Test that an element has specific CSS classes:

```javascript
test('button should have correct styling classes', () => {
  render(<Button variant="primary" size="large" />);
  const button = screen.getByRole('button');
  
  expectToHaveClasses(button, ['btn', 'btn-primary', 'btn-large']);
});
```

#### expectToHaveAttributes
Test that an element has specific attributes:

```javascript
test('input should have correct accessibility attributes', () => {
  render(<Input label="Email" required />);
  const input = screen.getByLabelText('Email');
  
  expectToHaveAttributes(input, {
    'type': 'email',
    'required': '',
    'aria-label': 'Email'
  });
});
```

#### expectToBeVisible / expectToBeHidden
Test element visibility:

```javascript
test('modal should be visible when open', () => {
  render(<Modal isOpen={true}>Content</Modal>);
  const modal = screen.getByRole('dialog');
  
  expectToBeVisible(modal);
});

test('tooltip should be hidden initially', () => {
  render(<Tooltip>Hover me</Tooltip>);
  const tooltip = screen.queryByRole('tooltip');
  
  expectToBeHidden(tooltip);
});
```

### Form Assertions

#### expectFieldValue
Test form field values:

```javascript
test('form should populate with user data', () => {
  const user = { name: 'John Doe', email: 'john@example.com' };
  render(<UserForm initialData={user} />);
  
  expectFieldValue(screen.getByLabelText('Name'), 'John Doe');
  expectFieldValue(screen.getByLabelText('Email'), 'john@example.com');
});
```

#### expectFormToHaveErrors
Test form validation:

```javascript
test('form should show validation errors', async () => {
  render(<ContactForm />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    const form = screen.getByRole('form');
    expectFormToHaveErrors(form, ['Email is required', 'Name is required']);
  });
});
```

### Loading State Assertions

#### expectLoadingState
Test loading indicators:

```javascript
test('should show loading state while fetching data', () => {
  render(<ClientList isLoading={true} />);
  
  expectLoadingState();
});

test('should hide loading state when data is loaded', () => {
  render(<ClientList isLoading={false} clients={mockClients} />);
  
  expectNotLoadingState();
});
```

### Error State Assertions

#### expectErrorMessage / expectSuccessMessage
Test error and success messages:

```javascript
test('should show error message on failed save', async () => {
  const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
  render(<ClientForm onSave={mockSave} />);
  
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expectErrorMessage('Save failed');
  });
});

test('should show success message on successful save', async () => {
  const mockSave = jest.fn().mockResolvedValue({ success: true });
  render(<ClientForm onSave={mockSave} />);
  
  fireEvent.click(screen.getByText('Save'));
  
  await waitFor(() => {
    expectSuccessMessage('Client saved successfully');
  });
});
```

### Data Assertions

#### expectArrayToContainItemsWithProperties
Test array contents:

```javascript
test('should filter clients by status', () => {
  const clients = [
    { id: 1, name: 'Client 1', status: 'active' },
    { id: 2, name: 'Client 2', status: 'inactive' },
    { id: 3, name: 'Client 3', status: 'active' },
  ];
  
  const activeClients = clients.filter(c => c.status === 'active');
  
  expectArrayToContainItemsWithProperties(activeClients, { status: 'active' }, 2);
});
```

#### expectObjectStructure
Test object structure:

```javascript
test('user profile should have correct structure', () => {
  const userProfile = getUserProfile();
  
  expectObjectStructure(userProfile, {
    id: 'string',
    email: 'string',
    profile: {
      firstName: 'string',
      lastName: 'string',
      avatar: 'string'
    },
    preferences: {
      theme: 'string',
      notifications: 'boolean'
    }
  });
});
```

### API Response Assertions

#### expectApiResponse
Test API response format:

```javascript
test('should return properly formatted API response', async () => {
  const response = await clientService.getClients();
  
  expectApiResponse(response, {
    expectSuccess: true,
    expectData: true,
    expectMeta: true
  });
});
```

#### expectPaginatedResponse
Test paginated API responses:

```javascript
test('should return paginated client list', async () => {
  const response = await clientService.getClients({ page: 1, limit: 10 });
  
  expectPaginatedResponse(response, {
    expectedPage: 1,
    expectedLimit: 10,
    minTotal: 0
  });
});
```

### Business Logic Assertions

#### expectValidClient / expectValidInvoice / expectValidUser
Test domain objects:

```javascript
test('should create valid client object', () => {
  const client = createClient({
    name: 'Test Client',
    email: 'test@example.com'
  });
  
  expectValidClient(client);
});

test('should create valid invoice with items', () => {
  const invoice = createInvoice({
    clientId: 'client-123',
    items: [
      { description: 'Service', quantity: 1, unitPrice: 100 }
    ]
  });
  
  expectValidInvoice(invoice);
});
```

### Async Assertions

#### expectElementToAppear / expectElementToDisappear
Test asynchronous DOM changes:

```javascript
test('should show success message after save', async () => {
  render(<ClientForm />);
  
  fireEvent.click(screen.getByText('Save'));
  
  await expectElementToAppear(() => 
    screen.getByText('Client saved successfully')
  );
});

test('should hide modal after close', async () => {
  render(<Modal isOpen={true} />);
  
  fireEvent.click(screen.getByText('Close'));
  
  await expectElementToDisappear(() => 
    screen.queryByRole('dialog')
  );
});
```

#### expectConditionToBecomeTrue
Test custom conditions:

```javascript
test('should update state after async operation', async () => {
  const { result } = renderHook(() => useAsyncOperation());
  
  act(() => {
    result.current.startOperation();
  });
  
  await expectConditionToBecomeTrue(() => 
    result.current.isComplete
  );
});
```

### Mock Assertions

#### expectMockCalledWith
Test mock function calls:

```javascript
test('should call API with correct parameters', () => {
  const mockApi = jest.fn();
  const service = new ClientService(mockApi);
  
  service.createClient({ name: 'Test Client' });
  
  expectMockCalledWith(mockApi, [
    'POST',
    '/clients',
    { name: 'Test Client' }
  ]);
});
```

#### expectMocksCalledInOrder
Test call order:

```javascript
test('should call hooks in correct order', () => {
  const mockValidate = jest.fn();
  const mockSave = jest.fn();
  const mockNotify = jest.fn();
  
  const form = new FormHandler({
    validate: mockValidate,
    save: mockSave,
    notify: mockNotify
  });
  
  form.submit();
  
  expectMocksCalledInOrder([mockValidate, mockSave, mockNotify]);
});
```

## Best Practices

### 1. Use Specific Assertions
Choose the most specific assertion for your test case:

```javascript
// Good - specific assertion
expectValidClient(client);

// Less ideal - generic assertion
expect(client).toHaveProperty('id');
expect(client).toHaveProperty('email');
expect(typeof client.email).toBe('string');
```

### 2. Combine Assertions for Complex Scenarios
Use multiple assertions to test complex scenarios:

```javascript
test('should handle form submission correctly', async () => {
  render(<ClientForm />);
  
  // Test initial state
  expectFormToBeValid(screen.getByRole('form'));
  expectFieldToBeEnabled(screen.getByLabelText('Name'));
  
  // Test validation
  fireEvent.click(screen.getByText('Submit'));
  await expectFormToHaveErrors(screen.getByRole('form'));
  
  // Test successful submission
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test' } });
  fireEvent.click(screen.getByText('Submit'));
  
  await expectSuccessMessage('Client created successfully');
  await expectElementToDisappear(() => screen.queryByRole('form'));
});
```

### 3. Use Custom Error Messages
Provide context with custom error messages:

```javascript
expectToHaveClasses(
  button, 
  ['btn-primary'], 
  'Primary button should have correct styling'
);
```

### 4. Test Edge Cases
Use assertion helpers to test edge cases:

```javascript
test('should handle empty data gracefully', () => {
  const emptyResponse = { success: true, data: [] };
  
  expectApiResponse(emptyResponse);
  expectArrayToContainItemsWithProperties(emptyResponse.data, {}, 0);
});
```

## Error Messages

The assertion helpers provide clear, actionable error messages:

```javascript
// Example error message
Expected element to have classes: btn, btn-primary
Received: btn, btn-secondary

// Example API error message
Expected API response to have property 'success' with value true
Received: { error: 'ValidationError', message: 'Invalid input' }
```

## Integration with Testing Library

These helpers work seamlessly with React Testing Library:

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expectToHaveClasses, expectValidClient } from './assertionHelpers';

test('complete integration example', async () => {
  const mockOnSave = jest.fn();
  render(<ClientForm onSave={mockOnSave} />);
  
  // Use Testing Library for interactions
  fireEvent.change(screen.getByLabelText('Name'), { 
    target: { value: 'Test Client' } 
  });
  fireEvent.click(screen.getByText('Save'));
  
  // Use assertion helpers for validation
  await waitFor(() => {
    expectMockCalledWith(mockOnSave, [expect.objectContaining({
      name: 'Test Client'
    })]);
  });
  
  const savedClient = mockOnSave.mock.calls[0][0];
  expectValidClient(savedClient);
});
```

## Contributing

When adding new assertion helpers:

1. Follow the existing naming convention (`expect[What]To[Condition]`)
2. Provide clear error messages
3. Add comprehensive tests
4. Update this documentation
5. Consider edge cases and error handling

## Related Files

- `assertionHelpers.js` - Main implementation
- `assertionHelpers.test.js` - Test suite
- `testHelpers.js` - General test utilities
- `testDataFactories.js` - Test data creation
- `testWrappers.js` - Component wrapper utilities