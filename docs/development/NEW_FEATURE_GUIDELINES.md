# New Feature Development Guidelines

## Overview

This guide provides step-by-step instructions for adding new features to the Nexa Manager project while maintaining the established feature-based architecture.

## Before You Start

### 1. Feature Assessment
Ask these questions before creating a new feature:

- **Scope**: Is this a standalone feature or an extension of an existing one?
- **Dependencies**: What shared services or components will it need?
- **Integration**: How will it integrate with existing features?
- **User Impact**: What user workflows will it affect?

### 2. Architecture Review
- Review existing similar features for patterns
- Identify reusable components in shared modules
- Plan the feature's public API surface
- Consider performance implications

## Feature Creation Process

### Step 1: Create Feature Structure

```bash
# Navigate to features directory
cd src/features

# Create new feature directory
mkdir new-feature-name

# Create standard subdirectories
mkdir -p new-feature-name/{components,hooks,services,types,utils,styles,__tests__}

# Create essential files
touch new-feature-name/index.ts
touch new-feature-name/README.md
```

### Step 2: Set Up Feature Documentation

Create `src/features/new-feature-name/README.md`:

```markdown
# Feature Name

## Overview
Brief description of what this feature does.

## Components
- `MainComponent` - Primary component for the feature
- `HelperComponent` - Supporting component

## Hooks
- `useFeatureData` - Manages feature data state
- `useFeatureActions` - Handles feature actions

## Services
- `featureService` - Core business logic
- `featureApiService` - API interactions

## Types
- `FeatureData` - Main data interface
- `FeatureConfig` - Configuration interface

## Usage Example
```tsx
import { MainComponent, useFeatureData } from '@features/new-feature-name';

function MyPage() {
  const { data, loading } = useFeatureData();
  
  return <MainComponent data={data} loading={loading} />;
}
```

## Dependencies
- Shared services: `@shared/services/apiService`
- Shared components: `@shared/components/ui/Button`

## Testing
Run feature tests: `npm run test:new-feature-name`
```

### Step 3: Implement Core Components

#### Component Structure
```typescript
// src/features/new-feature-name/components/MainComponent.tsx
import React from 'react';
import { useFeatureData } from '../hooks/useFeatureData';
import { Button } from '@shared/components/ui';
import type { FeatureData } from '../types';

interface MainComponentProps {
  data?: FeatureData;
  onAction?: () => void;
}

export const MainComponent: React.FC<MainComponentProps> = ({
  data,
  onAction
}) => {
  const { loading, error } = useFeatureData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="feature-main">
      <h2>Feature Title</h2>
      {data && (
        <div>
          {/* Feature content */}
        </div>
      )}
      <Button onClick={onAction}>Action</Button>
    </div>
  );
};

export default MainComponent;
```

#### Component Tests
```typescript
// src/features/new-feature-name/components/__tests__/MainComponent.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MainComponent } from '../MainComponent';

describe('MainComponent', () => {
  it('renders without crashing', () => {
    render(<MainComponent />);
    expect(screen.getByText('Feature Title')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Test loading state
  });

  it('handles error state', () => {
    // Test error state
  });
});
```

### Step 4: Create Custom Hooks

```typescript
// src/features/new-feature-name/hooks/useFeatureData.ts
import { useState, useEffect } from 'react';
import { featureService } from '../services/featureService';
import type { FeatureData } from '../types';

export interface UseFeatureDataResult {
  data: FeatureData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFeatureData = (): UseFeatureDataResult => {
  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await featureService.getData();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
```

### Step 5: Implement Services

```typescript
// src/features/new-feature-name/services/featureService.ts
import { apiService } from '@shared/services/apiService';
import type { FeatureData, CreateFeatureData } from '../types';

class FeatureService {
  private readonly baseUrl = '/api/feature';

  async getData(): Promise<FeatureData[]> {
    return apiService.get(`${this.baseUrl}/data`);
  }

  async createData(data: CreateFeatureData): Promise<FeatureData> {
    return apiService.post(`${this.baseUrl}/data`, data);
  }

  async updateData(id: string, data: Partial<FeatureData>): Promise<FeatureData> {
    return apiService.put(`${this.baseUrl}/data/${id}`, data);
  }

  async deleteData(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/data/${id}`);
  }
}

export const featureService = new FeatureService();
```

### Step 6: Define Types

```typescript
// src/features/new-feature-name/types/index.ts
export interface FeatureData {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureData {
  name: string;
  description: string;
}

export interface FeatureConfig {
  enabled: boolean;
  maxItems: number;
  refreshInterval: number;
}

export interface FeatureState {
  data: FeatureData[];
  loading: boolean;
  error: string | null;
}
```

### Step 7: Create Public API

```typescript
// src/features/new-feature-name/index.ts
// Components
export { MainComponent } from './components/MainComponent';
export { HelperComponent } from './components/HelperComponent';

// Hooks
export { useFeatureData } from './hooks/useFeatureData';
export { useFeatureActions } from './hooks/useFeatureActions';

// Services
export { featureService } from './services/featureService';

// Types
export type {
  FeatureData,
  CreateFeatureData,
  FeatureConfig,
  FeatureState
} from './types';
```

### Step 8: Add Feature Tests

```typescript
// src/features/new-feature-name/__tests__/feature-integration.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainComponent } from '../components/MainComponent';
import { featureService } from '../services/featureService';

// Mock the service
jest.mock('../services/featureService');

describe('Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays data', async () => {
    const mockData = [
      { id: '1', name: 'Test', description: 'Test description' }
    ];
    
    (featureService.getData as jest.Mock).mockResolvedValue(mockData);

    render(<MainComponent />);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MainComponent />);

    const button = screen.getByRole('button', { name: /action/i });
    await user.click(button);

    // Assert expected behavior
  });
});
```

## Integration Steps

### Step 1: Add to Routing (if needed)

```typescript
// src/router/routeConfig.js
import { lazy } from 'react';

const NewFeaturePage = lazy(() => import('@pages/NewFeaturePage'));

export const routes = [
  // ... existing routes
  {
    path: '/new-feature',
    element: <NewFeaturePage />,
    meta: {
      title: 'New Feature',
      requiresAuth: true
    }
  }
];
```

### Step 2: Add to Navigation (if needed)

```typescript
// Update navigation configuration
export const navigationItems = [
  // ... existing items
  {
    name: 'New Feature',
    href: '/new-feature',
    icon: NewFeatureIcon,
    permission: 'feature:read'
  }
];
```

### Step 3: Add Feature-Specific Scripts

```json
// package.json
{
  "scripts": {
    "test:new-feature": "jest --testPathPatterns=features/new-feature",
    "test:coverage:new-feature": "jest --testPathPatterns=features/new-feature --coverage --collectCoverageFrom='src/features/new-feature/**/*.{js,jsx,ts,tsx}'"
  }
}
```

## Best Practices

### Component Guidelines
- Use TypeScript for all new components
- Follow existing naming conventions
- Implement proper error boundaries
- Use consistent styling patterns
- Include accessibility attributes

### Hook Guidelines
- Start hook names with `use`
- Return objects with named properties
- Handle loading and error states
- Use TypeScript for type safety
- Include cleanup in useEffect

### Service Guidelines
- Use class-based services for complex logic
- Implement consistent error handling
- Use TypeScript interfaces
- Include comprehensive error messages
- Follow REST API conventions

### Testing Guidelines
- Aim for >80% test coverage
- Test happy path and error cases
- Use realistic test data
- Mock external dependencies
- Test user interactions

### Performance Guidelines
- Use React.memo for expensive components
- Implement proper loading states
- Use lazy loading for large components
- Optimize bundle size
- Monitor performance metrics

## Code Review Checklist

### Architecture
- [ ] Feature follows established patterns
- [ ] No direct dependencies on other features
- [ ] Proper use of shared resources
- [ ] Clean separation of concerns

### Code Quality
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Accessibility is considered

### Testing
- [ ] Unit tests cover main functionality
- [ ] Integration tests verify feature works
- [ ] Error cases are tested
- [ ] Performance is acceptable

### Documentation
- [ ] README is complete and accurate
- [ ] Code is well-commented
- [ ] API is documented
- [ ] Examples are provided

## Common Pitfalls to Avoid

### Architecture Violations
- ❌ Direct imports between features
- ❌ Bypassing feature public APIs
- ❌ Duplicating shared functionality
- ❌ Creating circular dependencies

### Code Issues
- ❌ Missing error handling
- ❌ Inconsistent naming conventions
- ❌ Poor TypeScript usage
- ❌ Missing loading states

### Testing Issues
- ❌ Insufficient test coverage
- ❌ Testing implementation details
- ❌ Missing edge case tests
- ❌ Flaky or unreliable tests

## Getting Help

### Resources
- Architecture documentation: `docs/architecture/`
- Existing feature examples: `src/features/`
- Shared components: `src/shared/components/`
- Development tools: `scripts/`

### Team Support
- Ask questions in team chat
- Request code reviews early
- Pair program for complex features
- Consult with architecture team

Following these guidelines ensures new features integrate seamlessly with the existing codebase while maintaining code quality and architectural consistency.