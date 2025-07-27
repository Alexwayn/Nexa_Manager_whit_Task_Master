# Shared Resource Usage Patterns

## Overview

This document outlines how to effectively use and contribute to shared resources in Nexa Manager. Shared resources are reusable components, hooks, services, and utilities that provide common functionality across multiple features.

## Shared Resource Categories

### 1. Shared Components (`shared/components/`)

#### UI Components (`shared/components/ui/`)
Basic building blocks for the user interface.

**Available Components:**
- `Button` - Standardized button component
- `Input` - Form input with validation
- `Modal` - Reusable modal dialog
- `LoadingSpinner` - Loading indicator
- `ErrorBoundary` - Error handling wrapper

**Usage Example:**
```typescript
import { Button, Modal, Input } from '@/shared/components/ui';

const MyFeatureComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div>
      <Button 
        variant="primary" 
        onClick={() => setIsModalOpen(true)}
      >
        Open Modal
      </Button>
      
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Feature Modal"
      >
        <Input 
          label="Name"
          placeholder="Enter name"
          required
        />
      </Modal>
    </div>
  );
};
```

#### Form Components (`shared/components/forms/`)
Specialized components for form handling.

**Available Components:**
- `FormField` - Wrapper for form inputs with validation
- `FormSection` - Grouped form fields
- `FormActions` - Standardized form buttons
- `ValidationMessage` - Error/success messages

**Usage Example:**
```typescript
import { FormField, FormSection, FormActions } from '@/shared/components/forms';
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Basic Information">
        <FormField
          label="Name"
          error={errors.name?.message}
        >
          <input {...register('name', { required: 'Name is required' })} />
        </FormField>
      </FormSection>
      
      <FormActions>
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary">Cancel</Button>
      </FormActions>
    </form>
  );
};
```

#### Layout Components (`shared/components/layout/`)
Components for page and section layout.

**Available Components:**
- `PageHeader` - Standardized page headers
- `PageContent` - Main content wrapper
- `Sidebar` - Navigation sidebar
- `Card` - Content card wrapper

**Usage Example:**
```typescript
import { PageHeader, PageContent, Card } from '@/shared/components/layout';

const MyFeaturePage = () => {
  return (
    <>
      <PageHeader 
        title="Feature Management"
        subtitle="Manage your features"
        actions={<Button>Add Feature</Button>}
      />
      
      <PageContent>
        <Card>
          <h3>Feature List</h3>
          {/* Feature content */}
        </Card>
      </PageContent>
    </>
  );
};
```

### 2. Shared Hooks (`shared/hooks/`)

#### Data Management Hooks
- `useLocalStorage` - Persistent local storage
- `useSessionStorage` - Session-based storage
- `useDebounce` - Debounced values
- `usePagination` - Pagination logic

**Usage Example:**
```typescript
import { useLocalStorage, useDebounce, usePagination } from '@/shared/hooks';

const MyFeatureComponent = () => {
  const [searchTerm, setSearchTerm] = useLocalStorage('feature-search', '');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { currentPage, pageSize, goToPage, goToNext, goToPrevious } = usePagination();
  
  // Use hooks in component logic
};
```

#### UI State Hooks
- `useModal` - Modal state management
- `useToggle` - Boolean state toggle
- `useDisclosure` - Show/hide state
- `useClipboard` - Clipboard operations

**Usage Example:**
```typescript
import { useModal, useToggle, useClipboard } from '@/shared/hooks';

const MyComponent = () => {
  const { isOpen, open, close } = useModal();
  const [isExpanded, toggleExpanded] = useToggle(false);
  const { copy, copied } = useClipboard();
  
  return (
    <div>
      <button onClick={toggleExpanded}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      
      <button onClick={() => copy('text to copy')}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};
```

### 3. Shared Services (`shared/services/`)

#### API Service (`shared/services/api/`)
Centralized API communication.

**Usage Example:**
```typescript
import { api } from '@/shared/services/api';

export const myFeatureService = {
  async getAll() {
    const response = await api.get('/my-feature');
    return response.data;
  },
  
  async create(data) {
    const response = await api.post('/my-feature', data);
    return response.data;
  }
};
```

#### Storage Service (`shared/services/storage/`)
File and data storage operations.

**Usage Example:**
```typescript
import { storageService } from '@/shared/services/storage';

export const uploadFeatureImage = async (file: File) => {
  const uploadedFile = await storageService.upload({
    file,
    bucket: 'feature-images',
    path: `features/${Date.now()}-${file.name}`
  });
  
  return uploadedFile.url;
};
```

#### Notification Service (`shared/services/notification/`)
User notifications and alerts.

**Usage Example:**
```typescript
import { notificationService } from '@/shared/services/notification';

const MyComponent = () => {
  const handleSave = async () => {
    try {
      await saveFeature();
      notificationService.success('Feature saved successfully');
    } catch (error) {
      notificationService.error('Failed to save feature');
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
};
```

### 4. Shared Utilities (`shared/utils/`)

#### Date Utilities (`shared/utils/date/`)
Date formatting and manipulation.

**Usage Example:**
```typescript
import { formatDate, isDateInRange, addDays } from '@/shared/utils/date';

const MyComponent = ({ createdAt, dueDate }) => {
  const formattedDate = formatDate(createdAt, 'MMM dd, yyyy');
  const isOverdue = isDateInRange(new Date(), dueDate, addDays(dueDate, 7));
  
  return (
    <div>
      <span>Created: {formattedDate}</span>
      {isOverdue && <span className="text-red-500">Overdue</span>}
    </div>
  );
};
```

#### Validation Utilities (`shared/utils/validation/`)
Common validation functions.

**Usage Example:**
```typescript
import { validateEmail, validatePhone, validateRequired } from '@/shared/utils/validation';

const validateForm = (data) => {
  const errors = {};
  
  if (!validateRequired(data.name)) {
    errors.name = 'Name is required';
  }
  
  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Invalid phone format';
  }
  
  return errors;
};
```

#### Formatting Utilities (`shared/utils/formatting/`)
Data formatting functions.

**Usage Example:**
```typescript
import { formatCurrency, formatNumber, truncateText } from '@/shared/utils/formatting';

const MyComponent = ({ amount, description }) => {
  return (
    <div>
      <span>{formatCurrency(amount, 'EUR')}</span>
      <p>{truncateText(description, 100)}</p>
    </div>
  );
};
```

### 5. Shared Types (`shared/types/`)

#### Common Types (`shared/types/common/`)
Frequently used type definitions.

**Usage Example:**
```typescript
import type { ApiResponse, PaginatedResponse, BaseEntity } from '@/shared/types/common';

interface MyFeature extends BaseEntity {
  name: string;
  description: string;
}

interface MyFeatureResponse extends ApiResponse<MyFeature[]> {}

interface MyFeatureListResponse extends PaginatedResponse<MyFeature> {}
```

#### API Types (`shared/types/api/`)
API-related type definitions.

**Usage Example:**
```typescript
import type { ApiError, ApiSuccess, RequestConfig } from '@/shared/types/api';

const handleApiCall = async (): Promise<ApiSuccess<MyData> | ApiError> => {
  try {
    const response = await api.get('/endpoint');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 6. Shared Constants (`shared/constants/`)

#### Application Constants (`shared/constants/app/`)
Application-wide constants.

**Usage Example:**
```typescript
import { APP_NAME, VERSION, SUPPORTED_LANGUAGES } from '@/shared/constants/app';

const AppHeader = () => {
  return (
    <header>
      <h1>{APP_NAME} v{VERSION}</h1>
      <select>
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </header>
  );
};
```

#### Route Constants (`shared/constants/routes/`)
Application routes and navigation.

**Usage Example:**
```typescript
import { ROUTES } from '@/shared/constants/routes';
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const goToClients = () => {
    navigate(ROUTES.CLIENTS.LIST);
  };
  
  return <button onClick={goToClients}>View Clients</button>;
};
```

## Usage Patterns

### 1. Importing Shared Resources

#### Single Import
```typescript
import { Button } from '@/shared/components/ui';
import { useLocalStorage } from '@/shared/hooks';
import { formatDate } from '@/shared/utils/date';
```

#### Multiple Imports from Same Module
```typescript
import { 
  Button, 
  Input, 
  Modal 
} from '@/shared/components/ui';

import { 
  formatDate, 
  addDays, 
  isDateInRange 
} from '@/shared/utils/date';
```

#### Namespace Imports (for utilities)
```typescript
import * as dateUtils from '@/shared/utils/date';
import * as validationUtils from '@/shared/utils/validation';

const formattedDate = dateUtils.formatDate(new Date());
const isValid = validationUtils.validateEmail(email);
```

### 2. Extending Shared Components

#### Component Composition
```typescript
import { Button } from '@/shared/components/ui';

const FeatureButton: React.FC<{ onFeatureAction: () => void }> = ({ onFeatureAction }) => {
  return (
    <Button 
      variant="primary"
      onClick={onFeatureAction}
      className="feature-specific-styles"
    >
      Feature Action
    </Button>
  );
};
```

#### Hook Composition
```typescript
import { useLocalStorage, useDebounce } from '@/shared/hooks';

const useFeatureSearch = () => {
  const [searchTerm, setSearchTerm] = useLocalStorage('feature-search', '');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch
  };
};
```

### 3. Service Integration

#### Combining Shared Services
```typescript
import { api } from '@/shared/services/api';
import { notificationService } from '@/shared/services/notification';
import { storageService } from '@/shared/services/storage';

export const myFeatureService = {
  async createWithImage(data, imageFile) {
    try {
      // Upload image first
      const imageUrl = await storageService.upload({
        file: imageFile,
        bucket: 'features'
      });
      
      // Create feature with image URL
      const response = await api.post('/features', {
        ...data,
        imageUrl
      });
      
      notificationService.success('Feature created successfully');
      return response.data;
    } catch (error) {
      notificationService.error('Failed to create feature');
      throw error;
    }
  }
};
```

## Contributing to Shared Resources

### 1. When to Create Shared Resources

#### Create Shared Component When:
- Component is used in 3+ features
- Component provides common UI pattern
- Component has no feature-specific business logic

#### Create Shared Hook When:
- Logic is reused across multiple features
- Hook provides common state management pattern
- Hook encapsulates complex but generic functionality

#### Create Shared Service When:
- Service provides cross-cutting functionality
- Service integrates with external systems
- Service manages global application state

#### Create Shared Utility When:
- Function is pure and reusable
- Function provides common data transformation
- Function implements standard algorithms

### 2. Creating Shared Components

#### Component Structure
```typescript
// shared/components/ui/MySharedComponent.tsx
import React from 'react';
import { cn } from '@/shared/utils/styling';

interface MySharedComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const MySharedComponent: React.FC<MySharedComponentProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn(
        'base-styles',
        variant === 'primary' && 'primary-styles',
        variant === 'secondary' && 'secondary-styles',
        size === 'sm' && 'small-styles',
        size === 'md' && 'medium-styles',
        size === 'lg' && 'large-styles',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### Component Tests
```typescript
// shared/components/ui/MySharedComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MySharedComponent } from './MySharedComponent';

describe('MySharedComponent', () => {
  test('renders with default props', () => {
    render(<MySharedComponent>Test Content</MySharedComponent>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  test('applies variant styles', () => {
    render(<MySharedComponent variant="secondary">Test</MySharedComponent>);
    expect(screen.getByText('Test')).toHaveClass('secondary-styles');
  });
});
```

#### Export from Index
```typescript
// shared/components/ui/index.ts
export { MySharedComponent } from './MySharedComponent';
export { Button } from './Button';
export { Input } from './Input';
// ... other exports
```

### 3. Creating Shared Hooks

#### Hook Structure
```typescript
// shared/hooks/useMySharedHook.ts
import { useState, useEffect } from 'react';

interface UseMySharedHookOptions {
  initialValue?: string;
  debounceMs?: number;
}

export const useMySharedHook = (options: UseMySharedHookOptions = {}) => {
  const { initialValue = '', debounceMs = 300 } = options;
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [value, debounceMs]);
  
  return {
    value,
    setValue,
    debouncedValue
  };
};
```

#### Hook Tests
```typescript
// shared/hooks/useMySharedHook.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMySharedHook } from './useMySharedHook';

describe('useMySharedHook', () => {
  test('debounces value changes', async () => {
    const { result } = renderHook(() => useMySharedHook({ debounceMs: 100 }));
    
    act(() => {
      result.current.setValue('test');
    });
    
    expect(result.current.value).toBe('test');
    expect(result.current.debouncedValue).toBe('');
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(result.current.debouncedValue).toBe('test');
  });
});
```

### 4. Documentation Requirements

#### Component Documentation
```typescript
/**
 * MySharedComponent - A reusable component for common UI patterns
 * 
 * @example
 * ```tsx
 * <MySharedComponent variant="primary" size="lg">
 *   Content here
 * </MySharedComponent>
 * ```
 */
export const MySharedComponent: React.FC<MySharedComponentProps> = (props) => {
  // Implementation
};
```

#### README Updates
```markdown
# Shared Components

## MySharedComponent

A reusable component for common UI patterns.

### Props
- `variant`: 'primary' | 'secondary' - Visual style variant
- `size`: 'sm' | 'md' | 'lg' - Component size
- `children`: ReactNode - Component content

### Usage
```tsx
import { MySharedComponent } from '@/shared/components/ui';

<MySharedComponent variant="primary" size="lg">
  Content
</MySharedComponent>
```
```

## Best Practices

### Do's
- ✅ Use shared resources when available
- ✅ Contribute reusable functionality to shared modules
- ✅ Follow established patterns and conventions
- ✅ Document shared resources thoroughly
- ✅ Write comprehensive tests for shared code

### Don'ts
- ❌ Duplicate functionality that exists in shared modules
- ❌ Add feature-specific logic to shared resources
- ❌ Create shared resources for single-use cases
- ❌ Break existing shared resource APIs without migration
- ❌ Skip testing shared resources

### Guidelines
- Keep shared resources generic and configurable
- Use TypeScript for better API documentation
- Provide clear usage examples
- Consider backward compatibility when updating
- Follow semantic versioning for breaking changes

## Troubleshooting

### Common Issues

#### Import Errors
```typescript
// ❌ Wrong - importing from internal paths
import { Button } from '@/shared/components/ui/Button';

// ✅ Correct - using public API
import { Button } from '@/shared/components/ui';
```

#### Type Errors
```typescript
// ❌ Wrong - missing type imports
import { MyComponent } from '@/shared/components';

// ✅ Correct - importing types when needed
import { MyComponent, type MyComponentProps } from '@/shared/components';
```

#### Circular Dependencies
```typescript
// ❌ Wrong - shared resource importing from features
// shared/utils/featureUtils.ts importing from features/

// ✅ Correct - keep shared resources feature-agnostic
```

### Debug Commands
```bash
# Test shared resources
npm run test:shared

# Check shared resource usage
npm run analyze:shared-usage

# Validate shared resource APIs
npm run validate:shared-apis
```