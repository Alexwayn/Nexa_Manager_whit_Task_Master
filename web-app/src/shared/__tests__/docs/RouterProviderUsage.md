# Router Provider Usage Guide

This guide explains how to use the router context wrapper in tests for components that depend on React Router.

## Available Router Providers

### 1. TestRouterProvider (Default)
Basic router provider using BrowserRouter for most component tests.

```javascript
import { TestRouterProvider } from '@/shared/__tests__/mocks/providers';

test('component with router', () => {
  render(
    <TestRouterProvider>
      <MyComponent />
    </TestRouterProvider>
  );
});
```

### 2. TestMemoryRouterProvider
Memory router for controlled routing tests with specific initial routes.

```javascript
import { TestMemoryRouterProvider } from '@/shared/__tests__/mocks/providers';

test('component at specific route', () => {
  render(
    <TestMemoryRouterProvider initialEntries={['/dashboard', '/settings']} initialIndex={0}>
      <MyComponent />
    </TestMemoryRouterProvider>
  );
});
```

### 3. TestRouterProviderWithMocks
Router provider with mocked navigation hooks for testing navigation behavior.

```javascript
import { TestRouterProviderWithMocks } from '@/shared/__tests__/mocks/providers';

test('component navigation', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: '/test', search: '', hash: '', state: null };
  
  render(
    <TestRouterProviderWithMocks 
      mockNavigate={mockNavigate}
      mockLocation={mockLocation}
    >
      <MyComponent />
    </TestRouterProviderWithMocks>
  );
  
  // Test navigation calls
  fireEvent.click(screen.getByText('Navigate'));
  expect(mockNavigate).toHaveBeenCalledWith('/expected-path');
});
```

### 4. AllProvidersWrapper
Combines router and query providers for comprehensive testing.

```javascript
import { AllProvidersWrapper } from '@/shared/__tests__/mocks/providers';

test('component with all providers', () => {
  render(
    <AllProvidersWrapper>
      <MyComponent />
    </AllProvidersWrapper>
  );
});
```

## Using with Test Utilities

### renderWithRouter
Convenience function for rendering with router context.

```javascript
import { renderWithRouter } from '@/__tests__/utils/testUtils';

test('component with router utility', () => {
  renderWithRouter(<MyComponent />);
});
```

### renderWithMemoryRouter
Render with memory router for controlled routing.

```javascript
import { renderWithMemoryRouter } from '@/__tests__/utils/testUtils';

test('component at specific route', () => {
  renderWithMemoryRouter(<MyComponent />, {
    initialEntries: ['/dashboard'],
    initialIndex: 0
  });
});
```

### renderWithProviders
Enhanced render with multiple provider options.

```javascript
import { renderWithProviders } from '@/__tests__/utils/testUtils';

test('component with custom providers', () => {
  renderWithProviders(<MyComponent />, {
    withRouter: true,
    withQuery: true,
    routerProps: { initialEntries: ['/test'] }
  });
});
```

## Testing Navigation

### Testing useNavigate Hook

```javascript
import { mockRouterHooks, expectNavigation } from '@/__tests__/utils/testUtils';

test('navigation behavior', () => {
  const { navigate } = mockRouterHooks();
  
  render(
    <TestRouterProvider>
      <NavigationComponent />
    </TestRouterProvider>
  );
  
  fireEvent.click(screen.getByText('Go to Dashboard'));
  expectNavigation(navigate, '/dashboard');
});
```

### Testing useLocation Hook

```javascript
test('location-dependent component', () => {
  const mockLocation = { pathname: '/dashboard', search: '?tab=analytics' };
  
  mockRouterHooks({ location: mockLocation });
  
  render(
    <TestRouterProvider>
      <LocationComponent />
    </TestRouterProvider>
  );
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Analytics Tab')).toBeInTheDocument();
});
```

### Testing useParams Hook

```javascript
test('component with route params', () => {
  const mockParams = { id: '123', category: 'electronics' };
  
  mockRouterHooks({ params: mockParams });
  
  render(
    <TestRouterProvider>
      <ProductComponent />
    </TestRouterProvider>
  );
  
  expect(screen.getByText('Product ID: 123')).toBeInTheDocument();
  expect(screen.getByText('Category: electronics')).toBeInTheDocument();
});
```

## Testing Link Components

```javascript
test('link navigation', () => {
  const { navigate } = mockRouterHooks();
  
  render(
    <TestRouterProvider>
      <Link to="/about">About Us</Link>
    </TestRouterProvider>
  );
  
  fireEvent.click(screen.getByText('About Us'));
  expectNavigation(navigate, '/about');
});
```

## Integration Testing with Routes

```javascript
import { TestRouterWithRoutes } from '@/shared/__tests__/mocks/providers';

test('full routing integration', () => {
  render(
    <TestRouterWithRoutes initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </TestRouterWithRoutes>
  );
  
  expect(screen.getByTestId('dashboard')).toBeInTheDocument();
});
```

## Best Practices

1. **Use TestRouterProvider for basic tests** - Most components just need router context
2. **Use TestMemoryRouterProvider for route-specific tests** - When testing behavior at specific routes
3. **Use TestRouterProviderWithMocks for navigation testing** - When testing navigation behavior
4. **Use AllProvidersWrapper for integration tests** - When testing components that need multiple providers
5. **Mock router hooks for unit tests** - When testing specific hook behavior
6. **Use renderWithRouter utilities** - For cleaner test code

## Common Patterns

### Testing Protected Routes

```javascript
test('protected route redirects', () => {
  const mockNavigate = jest.fn();
  
  render(
    <TestRouterProviderWithMocks mockNavigate={mockNavigate}>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </TestRouterProviderWithMocks>
  );
  
  // Expect redirect to login
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});
```

### Testing Route Guards

```javascript
test('route guard allows access', () => {
  mockRouterHooks({
    location: { pathname: '/admin' }
  });
  
  render(
    <TestRouterProvider>
      <AdminGuard>
        <AdminPanel />
      </AdminGuard>
    </TestRouterProvider>
  );
  
  expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
});
```

### Testing Dynamic Routes

```javascript
test('dynamic route rendering', () => {
  mockRouterHooks({
    params: { userId: '456' }
  });
  
  render(
    <TestRouterProvider>
      <UserProfile />
    </TestRouterProvider>
  );
  
  expect(screen.getByText('User Profile: 456')).toBeInTheDocument();
});
```