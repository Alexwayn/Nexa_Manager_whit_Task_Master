# Test Utilities Documentation

This directory contains comprehensive test utilities to make testing easier, more consistent, and more maintainable across the project.

## Overview

The test utilities are organized into several modules:

- **testHelpers.js** - General testing utilities and helper functions
- **testWrappers.js** - React component wrappers with providers
- **assertionHelpers.js** - Custom assertion functions for better test readability
- **testDataFactories.js** - Factory functions for creating consistent test data
- **index.js** - Central export point for all utilities

## Quick Start

```javascript
// Import everything you need from the index
import {
  customRender,
  createMockUser,
  expectToBeVisible,
  waitForAsync
} from '@/shared/__tests__/utils';

// Or import specific modules
import { renderWithProviders } from '@/shared/__tests__/utils/testWrappers';
import { createMockClient } from '@/shared/__tests__/utils/testDataFactories';
```

## Test Helpers (`testHelpers.js`)

### Async Utilities
- `waitForAsync(callback, timeout)` - Wait for async operations
- `waitForNextTick()` - Wait for next event loop tick
- `flushPromises()` - Flush all pending promises

### Mock Utilities
- `mockConsole()` - Mock console methods to reduce test noise
- `createMockFunction(returnValues)` - Create mock with predefined return values
- `createMockAsyncFunction(resolvedValues)` - Create async mock with resolved values
- `mockFetch(response, shouldReject)` - Mock fetch API
- `mockLocalStorage()` - Mock localStorage
- `mockSessionStorage()` - Mock sessionStorage

### DOM Utilities
- `typeInInput(input, text)` - Simulate user typing
- `submitForm(form)` - Simulate form submission
- `createMockFile(name, content, type)` - Create mock file for uploads
- `createMockImageFile(name, width, height)` - Create mock image file

### Browser API Mocks
- `mockMatchMedia(matches)` - Mock window.matchMedia
- `mockIntersectionObserver()` - Mock IntersectionObserver
- `mockResizeObserver()` - Mock ResizeObserver
- `setupFileAPIMocks()` - Setup file API mocks

## Test Wrappers (`testWrappers.js`)

### Core Render Functions
- `customRender(ui, options)` - Flexible render with provider options
- `renderWithProviders(ui, options)` - Render with all providers (default)
- `renderWithAllProviders(component, options)` - Explicit all providers
- `renderWithMinimalProviders(component, options)` - Theme + router only
- `renderWithTheme(component, options)` - Theme provider only
- `renderWithUI(component, options)` - UI providers only

### Provider Options
```javascript
const options = {
  providers: 'all', // 'all', 'minimal', 'theme', 'ui', 'none'
  themeProps: { theme: 'dark' },
  routerProps: { initialEntries: ['/dashboard'] },
  queryProps: { defaultOptions: { queries: { retry: false } } },
  uiProps: { toastPosition: 'top-right' }
};
```

### Theme Testing Utilities
- `themeTestUtils.testInBothThemes(component, testFn)` - Test in light/dark themes
- `themeTestUtils.getThemeProps(theme)` - Get theme-specific props

## Assertion Helpers (`assertionHelpers.js`)

### DOM Assertions
- `expectToHaveClasses(element, classes)` - Assert element has CSS classes
- `expectToHaveAttributes(element, attributes)` - Assert element attributes
- `expectToBeVisible(element)` - Assert element is visible
- `expectToHaveText(element, text, exact)` - Assert text content

### Form Assertions
- `expectFieldValue(field, value)` - Assert form field value
- `expectFieldToBeRequired(field)` - Assert field is required
- `expectFormToHaveErrors(form, errors)` - Assert form has validation errors
- `expectToBeChecked(input)` - Assert checkbox/radio is checked

### State Assertions
- `expectLoadingState(container)` - Assert loading indicator is present
- `expectErrorMessage(message, container)` - Assert error message is displayed
- `expectSuccessMessage(message, container)` - Assert success message

### API Assertions
- `expectApiResponse(response, options)` - Assert API response structure
- `expectApiError(errorResponse, statusCode)` - Assert API error structure
- `expectPaginatedResponse(response, options)` - Assert paginated response

### Business Logic Assertions
- `expectValidClient(client)` - Assert client object structure
- `expectValidInvoice(invoice)` - Assert invoice object structure
- `expectValidUser(user)` - Assert user object structure

### Async Assertions
- `expectElementToAppear(getElement, options)` - Wait for element to appear
- `expectElementToDisappear(getElement, options)` - Wait for element to disappear
- `expectConditionToBecomeTrue(condition, message, options)` - Wait for condition

### Mock Assertions
- `expectMockCalledWith(mockFn, args, callIndex)` - Assert mock called with args
- `expectMockCallCount(mockFn, count)` - Assert mock call count
- `expectMocksCalledInOrder(mockFns)` - Assert mocks called in order

### Utility Assertions
- `expectComponentToRender(Component, props)` - Assert component renders without crashing
- `expectValidUrl(url)` - Assert URL is valid
- `expectValidColor(color)` - Assert color value is valid
- `expectAccessibleElement(element, options)` - Assert accessibility attributes
- `expectResponsiveElement(element)` - Assert responsive design patterns

## Test Data Factories (`testDataFactories.js`)

### User & Auth Factories
- `createMockUser(overrides)` - Create mock user profile
- `createMockOrganization(overrides)` - Create mock organization
- `createAuthenticatedState(userOverrides)` - Create authenticated auth state
- `createUnauthenticatedState()` - Create unauthenticated auth state

### Business Entity Factories
- `createMockClient(overrides)` - Create mock client
- `createMockInvoice(overrides)` - Create mock invoice with items
- `createMockPayment(overrides)` - Create mock payment
- `createMockProduct(overrides)` - Create mock product
- `createMockDocument(overrides)` - Create mock document

### API Response Factories
- `createMockApiResponse(data, overrides)` - Create success API response
- `createMockApiError(overrides)` - Create error API response
- `createMockPaginatedResponse(data, overrides)` - Create paginated response

### State Factories
- `createMockLoadingState(overrides)` - Create loading state
- `createMockSuccessState(data, overrides)` - Create success state
- `createMockErrorState(error, overrides)` - Create error state

### UI Component Factories
- `createMockNotification(overrides)` - Create mock notification
- `createMockBreadcrumbs(count, overrides)` - Create breadcrumb trail
- `createMockTableData(columns, rowCount, overrides)` - Create table data

### Utility Functions
- `createMultiple(factory, count, overrides)` - Create multiple instances
- `createWithRelations(mainFactory, relations)` - Create with relationships
- `resetTestDataSeed(seed)` - Reset faker seed for consistency

## Usage Examples

### Basic Component Test
```javascript
import { customRender, expectToBeVisible } from '@/shared/__tests__/utils';

test('renders welcome message', () => {
  customRender(<WelcomeMessage name="John" />);
  expectToBeVisible(screen.getByText('Welcome, John!'));
});
```

### Form Testing
```javascript
import { 
  renderWithProviders, 
  expectFieldValue, 
  expectFormToHaveErrors,
  typeInInput 
} from '@/shared/__tests__/utils';

test('validates email field', async () => {
  renderWithProviders(<LoginForm />);
  
  const emailField = screen.getByLabelText('Email');
  await typeInInput(emailField, 'invalid-email');
  
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  expectFormToHaveErrors(screen.getByRole('form'), ['Invalid email format']);
});
```

### API Testing with Mock Data
```javascript
import { 
  createMockClient, 
  createMockApiResponse,
  expectApiResponse,
  mockFetch 
} from '@/shared/__tests__/utils';

test('fetches client data', async () => {
  const mockClient = createMockClient({ name: 'Test Client' });
  const mockResponse = createMockApiResponse(mockClient);
  
  mockFetch(mockResponse);
  
  const result = await clientService.getClient('123');
  
  expectApiResponse(result);
  expect(result.data.name).toBe('Test Client');
});
```

### Theme Testing
```javascript
import { themeTestUtils } from '@/shared/__tests__/utils';

themeTestUtils.testInBothThemes(<MyComponent />, (container, theme) => {
  const element = container.querySelector('.themed-element');
  expect(element).toHaveClass(`theme-${theme}`);
});
```

### Async Operations
```javascript
import { 
  waitForAsync, 
  expectElementToAppear,
  flushPromises 
} from '@/shared/__tests__/utils';

test('loads data asynchronously', async () => {
  renderWithProviders(<AsyncComponent />);
  
  await expectElementToAppear(() => screen.getByText('Loading...'));
  
  await flushPromises();
  
  await expectElementToAppear(() => screen.getByText('Data loaded'));
});
```

## Best Practices

1. **Use Factories for Consistent Data**: Always use factory functions for test data to ensure consistency and reduce maintenance.

2. **Choose the Right Wrapper**: Use the minimal provider wrapper needed for your test to improve performance and reduce complexity.

3. **Prefer Custom Assertions**: Use the custom assertion helpers for better error messages and test readability.

4. **Mock External Dependencies**: Use the provided mock utilities to isolate your tests from external dependencies.

5. **Test Accessibility**: Use `expectAccessibleElement` to ensure your components are accessible.

6. **Test Responsive Design**: Use `expectResponsiveElement` to verify responsive behavior.

7. **Clean Up Mocks**: Always clean up mocks in `afterEach` hooks to prevent test interference.

## Configuration

The test utilities are configured to work with the project's Jest setup and require the following dependencies:

- `@testing-library/react`
- `@testing-library/jest-dom`
- `@faker-js/faker`
- `jest`

Make sure these are properly configured in your Jest setup files.