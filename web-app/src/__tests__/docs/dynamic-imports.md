# Dynamic Imports in Jest Tests

## Overview

This document explains how dynamic imports are handled in the Jest test environment for the Nexa Manager project.

## Configuration

### Babel Configuration

Dynamic imports are supported through the following Babel configuration in `babel.config.cjs`:

```javascript
plugins: [
  '@babel/plugin-syntax-jsx',
  '@babel/plugin-syntax-import-meta',
  '@babel/plugin-syntax-dynamic-import', // Enables dynamic import() syntax
  // ... other plugins
]
```

### Jest Configuration

Jest is configured to use Babel for transforming dynamic imports:

```javascript
transform: {
  '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
    configFile: require.resolve('../../web-app/babel.config.cjs'),
    babelrc: false
  }],
}
```

## Supported Dynamic Import Patterns

### 1. Basic Dynamic Imports

```javascript
// Basic dynamic import
const module = await import('@/utils/Logger');

// With destructuring
const { default: Logger } = await import('@/utils/Logger');
```

### 2. React.lazy Components

```javascript
import { lazy } from 'react';

const LazyComponent = lazy(() => import('@/components/MyComponent'));
```

### 3. Conditional Dynamic Imports

```javascript
if (condition) {
  const module = await import('@/utils/ConditionalModule');
}
```

### 4. Dynamic Imports with Error Handling

```javascript
try {
  const module = await import('@/utils/SomeModule');
} catch (error) {
  console.error('Failed to load module:', error);
}
```

### 5. Computed Module Paths

```javascript
const moduleName = 'Logger';
const module = await import(`@/utils/${moduleName}`);
```

### 6. Concurrent Dynamic Imports

```javascript
const [module1, module2] = await Promise.all([
  import('@/utils/Module1'),
  import('@/utils/Module2')
]);
```

## Testing Dynamic Imports

### Test Examples

```javascript
describe('Dynamic Import Tests', () => {
  it('should load module dynamically', async () => {
    const module = await import('@/utils/Logger');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('should handle React.lazy components', async () => {
    const { lazy } = await import('react');
    const LazyComponent = lazy(() => import('@/components/MyComponent'));
    
    expect(LazyComponent).toBeDefined();
    expect(typeof LazyComponent).toBe('object');
  });

  it('should handle import failures gracefully', async () => {
    try {
      await import('@/non-existent-module');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

### Best Practices

1. **Always use async/await**: Dynamic imports return promises
2. **Handle errors**: Wrap dynamic imports in try-catch blocks
3. **Test both success and failure cases**: Ensure robust error handling
4. **Use path aliases**: Leverage the configured path aliases for cleaner imports
5. **Mock when necessary**: Use Jest mocks for external dependencies

## Path Alias Support

All configured path aliases work with dynamic imports:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@utils/` → `src/utils/`
- `@services/` → `src/services/`
- `@lib/` → `src/lib/`
- And all other configured aliases

## Performance Considerations

- Dynamic imports in tests are synchronous (transformed by Babel)
- No actual code splitting occurs in the test environment
- Use `Promise.all()` for concurrent imports when testing multiple modules

## Troubleshooting

### Common Issues

1. **Syntax Error**: Ensure `@babel/plugin-syntax-dynamic-import` is installed
2. **Module Not Found**: Check path aliases and module paths
3. **Timeout Issues**: Use appropriate test timeouts for complex imports

### Debug Tips

```javascript
// Log the imported module structure
const module = await import('@/utils/Logger');
console.log('Module structure:', Object.keys(module));

// Test with explicit error handling
try {
  const module = await import('@/utils/Logger');
  console.log('Import successful:', typeof module);
} catch (error) {
  console.error('Import failed:', error.message);
}
```

## Related Files

- `babel.config.cjs` - Babel configuration with dynamic import support
- `.config/jest/jest.config.cjs` - Jest configuration
- `src/__tests__/utils/dynamicImport.test.js` - Comprehensive dynamic import tests

## Dependencies

- `@babel/plugin-syntax-dynamic-import` - Enables dynamic import syntax
- `babel-jest` - Babel transformer for Jest
- `@babel/core` - Babel core functionality