# Feature Development Workflow

## Overview

This document outlines the standardized workflow for developing features in Nexa Manager, from initial planning to deployment. Following this workflow ensures consistency, quality, and maintainability across all features.

## Workflow Phases

### 1. Planning Phase

#### Feature Requirements
- [ ] Define feature scope and objectives
- [ ] Identify user stories and acceptance criteria
- [ ] Document API requirements and data models
- [ ] Plan integration points with existing features
- [ ] Estimate development effort and timeline

#### Technical Planning
- [ ] Review existing architecture patterns
- [ ] Identify reusable components and services
- [ ] Plan database schema changes if needed
- [ ] Consider performance and security implications
- [ ] Plan testing strategy

#### Documentation
- [ ] Create feature specification document
- [ ] Update project roadmap
- [ ] Document architectural decisions
- [ ] Plan user documentation updates

### 2. Setup Phase

#### Branch Creation
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/feature-name

# Example
git checkout -b feature/client-import-export
```

#### Feature Structure Creation
```bash
# Create feature directory structure
mkdir -p src/features/feature-name/{components,hooks,services,types,utils,__tests__}

# Create required files
touch src/features/feature-name/index.ts
touch src/features/feature-name/README.md
```

#### Initial Files Setup
```typescript
// src/features/feature-name/index.ts
/**
 * Feature Name - Public API
 * 
 * This file exports the public interface for the feature.
 * Only export what other features need to access.
 */

// Components
// export { ComponentName } from './components/ComponentName';

// Hooks
// export { useFeatureName } from './hooks/useFeatureName';

// Services
// export { featureService } from './services/featureService';

// Types
// export type { FeatureType } from './types/FeatureTypes';
```

### 3. Development Phase

#### Component Development

1. **Create Component Structure**
   ```typescript
   // src/features/feature-name/components/ComponentName.tsx
   import React from 'react';
   
   interface ComponentNameProps {
     // Define props interface
   }
   
   export const ComponentName: React.FC<ComponentNameProps> = (props) => {
     // Component implementation
     return <div>Component content</div>;
   };
   ```

2. **Add Component Tests**
   ```typescript
   // src/features/feature-name/components/ComponentName.test.tsx
   import { render, screen } from '@testing-library/react';
   import { ComponentName } from './ComponentName';
   
   describe('ComponentName', () => {
     test('renders correctly', () => {
       render(<ComponentName />);
       // Test assertions
     });
   });
   ```

3. **Export Component**
   ```typescript
   // Update src/features/feature-name/index.ts
   export { ComponentName } from './components/ComponentName';
   ```

#### Service Development

1. **Create Service**
   ```typescript
   // src/features/feature-name/services/featureService.ts
   import { api } from '@/shared/services/api';
   import type { FeatureData, CreateFeatureData } from '../types/FeatureTypes';
   
   export const featureService = {
     async getAll(): Promise<FeatureData[]> {
       const response = await api.get('/feature-endpoint');
       return response.data;
     },
     
     async create(data: CreateFeatureData): Promise<FeatureData> {
       const response = await api.post('/feature-endpoint', data);
       return response.data;
     },
     
     // Additional service methods
   };
   ```

2. **Add Service Tests**
   ```typescript
   // src/features/feature-name/services/featureService.test.ts
   import { featureService } from './featureService';
   
   describe('featureService', () => {
     test('creates feature successfully', async () => {
       const featureData = { name: 'Test Feature' };
       const result = await featureService.create(featureData);
       
       expect(result).toHaveProperty('id');
       expect(result.name).toBe(featureData.name);
     });
   });
   ```

#### Hook Development

1. **Create Custom Hook**
   ```typescript
   // src/features/feature-name/hooks/useFeatureName.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { featureService } from '../services/featureService';
   
   export const useFeatureName = () => {
     const queryClient = useQueryClient();
     
     const {
       data: features,
       loading,
       error
     } = useQuery({
       queryKey: ['features'],
       queryFn: featureService.getAll
     });
     
     const createMutation = useMutation({
       mutationFn: featureService.create,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['features'] });
       }
     });
     
     return {
       features,
       loading,
       error,
       createFeature: createMutation.mutate,
       isCreating: createMutation.isPending
     };
   };
   ```

2. **Add Hook Tests**
   ```typescript
   // src/features/feature-name/hooks/useFeatureName.test.ts
   import { renderHook, waitFor } from '@testing-library/react';
   import { useFeatureName } from './useFeatureName';
   
   describe('useFeatureName', () => {
     test('loads features on mount', async () => {
       const { result } = renderHook(() => useFeatureName());
       
       await waitFor(() => {
         expect(result.current.loading).toBe(false);
         expect(result.current.features).toBeDefined();
       });
     });
   });
   ```

#### Type Definition

1. **Create Types**
   ```typescript
   // src/features/feature-name/types/FeatureTypes.ts
   export interface FeatureData {
     id: string;
     name: string;
     description?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   
   export interface CreateFeatureData {
     name: string;
     description?: string;
   }
   
   export interface UpdateFeatureData {
     name?: string;
     description?: string;
   }
   
   export type FeatureStatus = 'active' | 'inactive' | 'pending';
   ```

### 4. Integration Phase

#### Cross-Feature Integration

1. **Identify Integration Points**
   ```typescript
   // Example: Integrating with auth feature
   import { useAuth } from '@/features/auth';
   import { clientService } from '@/features/clients';
   
   const MyFeatureComponent = () => {
     const { user } = useAuth();
     const { data: clients } = useQuery(['clients'], clientService.getAll);
     
     // Integration logic
   };
   ```

2. **Update Feature Documentation**
   ```markdown
   ## Integration Patterns
   
   ### With Auth Feature
   ```typescript
   import { useAuth } from '@/features/auth';
   // Usage example
   ```
   
   ### With Clients Feature
   ```typescript
   import { clientService } from '@/features/clients';
   // Usage example
   ```
   ```

#### Shared Resource Updates

1. **Add Shared Components if Needed**
   ```typescript
   // If creating reusable components
   // Move to src/shared/components/
   ```

2. **Update Shared Types**
   ```typescript
   // Add to src/shared/types/ if used across features
   ```

### 5. Testing Phase

#### Unit Testing
```bash
# Run feature-specific tests
npm run test:feature-name

# Run with coverage
npm run test:coverage:feature-name
```

#### Integration Testing
```typescript
// src/features/feature-name/__tests__/integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeatureComponent } from '../components/FeatureComponent';

describe('Feature Integration', () => {
  test('complete feature workflow', async () => {
    render(<FeatureComponent />);
    
    // Test complete user workflow
    fireEvent.click(screen.getByText('Create'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

#### End-to-End Testing
```typescript
// src/features/feature-name/__tests__/e2e.test.ts
import { test, expect } from '@playwright/test';

test('feature end-to-end workflow', async ({ page }) => {
  await page.goto('/feature-page');
  
  // Test complete user journey
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="name-input"]', 'Test Feature');
  await page.click('[data-testid="save-button"]');
  
  await expect(page.locator('[data-testid="feature-list"]')).toContainText('Test Feature');
});
```

### 6. Documentation Phase

#### Feature Documentation
```markdown
# Feature Name

## Overview
Brief description of the feature and its purpose.

## Public API
Document all exported components, hooks, and services.

## Integration Patterns
Show how to integrate with other features.

## Testing Approach
Describe testing strategies and patterns.

## Dependencies
List internal and external dependencies.
```

#### API Documentation
```typescript
/**
 * Feature Service
 * 
 * Provides business logic for feature operations.
 * 
 * @example
 * ```typescript
 * import { featureService } from '@/features/feature-name';
 * 
 * const features = await featureService.getAll();
 * ```
 */
export const featureService = {
  // Service implementation with JSDoc comments
};
```

### 7. Review Phase

#### Code Review Checklist

**Architecture & Design**
- [ ] Follows established feature patterns
- [ ] Uses appropriate abstractions
- [ ] Maintains separation of concerns
- [ ] Follows naming conventions

**Code Quality**
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Security best practices followed

**Testing**
- [ ] Unit tests cover core functionality
- [ ] Integration tests verify feature workflows
- [ ] Edge cases are tested
- [ ] Test coverage meets requirements

**Documentation**
- [ ] Feature README is comprehensive
- [ ] Public API is documented
- [ ] Integration patterns are explained
- [ ] Code comments are clear and helpful

#### Automated Checks
```bash
# Run all validation checks
npm run lint
npm run type-check
npm run test:architecture
npm run validate:feature-api
```

### 8. Deployment Phase

#### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Database migrations ready (if needed)
- [ ] Environment variables configured

#### Deployment Steps
```bash
# Merge to main branch
git checkout main
git pull origin main
git merge feature/feature-name

# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke

# Deploy to production
npm run deploy:production
```

#### Post-deployment
- [ ] Verify feature works in production
- [ ] Monitor for errors and performance issues
- [ ] Update project documentation
- [ ] Communicate feature availability to stakeholders

## Quality Gates

### Development Quality Gates

1. **Code Compilation**
   - TypeScript compiles without errors
   - No ESLint violations
   - Prettier formatting applied

2. **Testing**
   - All unit tests pass
   - Integration tests pass
   - Code coverage meets threshold (80%+)

3. **Architecture**
   - Follows feature-based patterns
   - No architectural rule violations
   - Public API properly defined

### Review Quality Gates

1. **Functionality**
   - Feature works as specified
   - Edge cases handled appropriately
   - Error scenarios managed

2. **Performance**
   - No performance regressions
   - Efficient data loading
   - Proper caching implemented

3. **Security**
   - Input validation implemented
   - Authentication/authorization checked
   - No security vulnerabilities

### Deployment Quality Gates

1. **Staging Validation**
   - Feature works in staging environment
   - Integration with other features verified
   - Performance acceptable

2. **Production Readiness**
   - Database migrations tested
   - Environment configuration verified
   - Rollback plan prepared

## Common Patterns

### Feature Component Pattern
```typescript
// Main feature component that orchestrates the feature
export const FeatureManager: React.FC = () => {
  const { features, loading, createFeature } = useFeatureName();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <FeatureHeader onCreateClick={() => setIsModalOpen(true)} />
      <FeatureList features={features} />
      <FeatureModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={createFeature}
      />
    </div>
  );
};
```

### Service Pattern
```typescript
// Service with consistent error handling and typing
export const featureService = {
  async getAll(): Promise<FeatureData[]> {
    try {
      const response = await api.get('/features');
      return response.data;
    } catch (error) {
      throw new FeatureServiceError('Failed to fetch features', error);
    }
  }
};
```

### Hook Pattern
```typescript
// Hook that encapsulates feature business logic
export const useFeatureName = () => {
  // Data fetching
  const query = useQuery({
    queryKey: ['features'],
    queryFn: featureService.getAll
  });
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: featureService.create,
    onSuccess: () => query.refetch()
  });
  
  // Return clean interface
  return {
    features: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    createFeature: createMutation.mutate,
    isCreating: createMutation.isPending
  };
};
```

## Troubleshooting

### Common Issues

#### Import Path Errors
```typescript
// ❌ Wrong - importing internal files
import { UserService } from '@/features/users/services/userService';

// ✅ Correct - using public API
import { UserService } from '@/features/users';
```

#### Circular Dependencies
```typescript
// ❌ Wrong - circular dependency
// fileA imports fileB, fileB imports fileA

// ✅ Correct - extract shared logic
// Create shared utility or restructure dependencies
```

#### Test Failures
```bash
# Debug test failures
npm run test:feature-name -- --verbose
npm run test:feature-name -- --watch
```

### Debug Commands
```bash
# Validate feature structure
npm run validate:feature-api

# Check architectural compliance
npm run test:architecture

# Analyze dependencies
npm run analyze:deps
```

## Best Practices

### Do's
- ✅ Follow established patterns consistently
- ✅ Write comprehensive tests
- ✅ Document public APIs thoroughly
- ✅ Use TypeScript strictly
- ✅ Handle errors gracefully

### Don'ts
- ❌ Skip testing phases
- ❌ Ignore architectural rules
- ❌ Create tight coupling between features
- ❌ Forget to update documentation
- ❌ Deploy without proper validation

### Tips
- Start with the simplest implementation that works
- Refactor as patterns emerge
- Consider reusability from the beginning
- Test edge cases and error scenarios
- Keep features focused and cohesive