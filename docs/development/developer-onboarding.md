# Developer Onboarding Guide

## Welcome to Nexa Manager

This guide will help you understand the project structure, development workflow, and best practices for contributing to Nexa Manager.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

## Project Overview

Nexa Manager is a comprehensive business management platform built with:
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Context + TanStack Query
- **Authentication**: Clerk with Supabase integration
- **Database**: Supabase (PostgreSQL) with RLS
- **Testing**: Jest + React Testing Library + Playwright

## Architecture Overview

### Feature-Based Architecture

Nexa Manager follows a feature-based architecture where code is organized by business domains:

```
web-app/src/
├── features/           # Business domain features
│   ├── auth/          # Authentication & authorization
│   ├── clients/       # Client management (CRM)
│   ├── financial/     # Invoices, quotes, expenses
│   ├── email/         # Email management & campaigns
│   ├── calendar/      # Events & scheduling
│   ├── dashboard/     # Main dashboard & KPIs
│   ├── analytics/     # Business analytics & reporting
│   ├── documents/     # Document management
│   └── scanner/       # Document scanning & OCR
├── shared/            # Shared resources
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Shared custom hooks
│   ├── services/      # Cross-cutting services
│   ├── types/         # Shared type definitions
│   ├── utils/         # Utility functions
│   └── constants/     # Application constants
└── pages/             # Route components
```

### Key Principles

1. **Feature Isolation**: Each feature is self-contained with its own components, hooks, and services
2. **Public APIs**: Features expose functionality through `index.ts` files
3. **Shared Resources**: Common functionality lives in the `shared/` directory
4. **Unidirectional Dependencies**: Features can depend on shared modules, but not vice versa

## Development Setup

### Prerequisites

- Node.js 20+ and npm 10+
- Git
- VS Code (recommended) with suggested extensions

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexa-manager
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment setup**
   ```bash
   cd web-app
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Importer
- Auto Rename Tag
- Tailwind CSS IntelliSense
- GitLens

## Project Structure

### Root Level Organization

```
nexa-manager/
├── .config/           # Consolidated tool configurations
│   ├── eslint/       # ESLint configuration
│   ├── prettier/     # Prettier configuration
│   ├── jest/         # Jest testing configuration
│   └── playwright/   # E2E testing configuration
├── docs/             # Project documentation
│   ├── api/          # API documentation
│   ├── architecture/ # Architecture decisions & guides
│   ├── development/  # Development guides
│   └── deployment/   # Deployment guides
├── tools/            # Development utilities
│   ├── scripts/      # Utility scripts
│   └── migrations/   # Database migrations
├── assets/           # Shared project assets
└── web-app/          # Main React application
```

### Feature Structure

Each feature follows a consistent internal structure:

```
feature-name/
├── components/       # Feature-specific React components
├── hooks/           # Feature-specific custom hooks
├── services/        # Business logic and API calls
├── types/           # Feature-specific type definitions
├── utils/           # Feature-specific utilities
├── __tests__/       # Feature tests
├── README.md        # Feature documentation
└── index.ts         # Public API exports
```

### File Naming Conventions

| File Type | Convention | Example |
|-----------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with 'use' prefix | `useUserData.ts` |
| Services | camelCase with 'Service' suffix | `userService.ts` |
| Types | PascalCase | `UserTypes.ts` |
| Utils | camelCase | `dateUtils.ts` |
| Constants | camelCase or UPPER_CASE | `apiConstants.ts` |
| Tests | Same as source + `.test` | `UserProfile.test.tsx` |

## Development Workflow

### 1. Feature Development

#### Creating a New Feature

1. **Create feature directory structure**
   ```bash
   mkdir -p src/features/my-feature/{components,hooks,services,types,utils,__tests__}
   ```

2. **Create public API file**
   ```typescript
   // src/features/my-feature/index.ts
   // Components
   export { MyComponent } from './components/MyComponent';
   
   // Hooks
   export { useMyFeature } from './hooks/useMyFeature';
   
   // Services
   export { myFeatureService } from './services/myFeatureService';
   
   // Types
   export type { MyFeatureType } from './types/MyFeatureTypes';
   ```

3. **Create feature documentation**
   ```bash
   touch src/features/my-feature/README.md
   ```

#### Working on Existing Features

1. **Understand the feature's public API**
   ```typescript
   // Check the feature's index.ts file
   import { /* available exports */ } from '@/features/feature-name';
   ```

2. **Follow the established patterns**
   - Components in `components/`
   - Business logic in `services/`
   - React-specific logic in `hooks/`
   - Types in `types/`

3. **Update public API when needed**
   - Add new exports to `index.ts`
   - Update feature documentation

### 2. Import Guidelines

#### ✅ Correct Import Patterns

```typescript
// External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal - features (public API only)
import { useAuth } from '@/features/auth';
import { clientService } from '@/features/clients';

// Internal - shared modules
import { Button } from '@/shared/components';
import { formatDate } from '@/shared/utils';

// Relative imports (within same feature)
import { UserCard } from './UserCard';
import { useUserData } from '../hooks/useUserData';
```

#### ❌ Incorrect Import Patterns

```typescript
// Don't import internal feature files directly
import { UserService } from '@/features/users/services/userService';

// Don't import from other features' internal files
import { UserCard } from '@/features/users/components/UserCard';

// Don't create circular dependencies
// fileA imports fileB, fileB imports fileA
```

### 3. Git Workflow

#### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

#### Commit Messages
Follow conventional commits:
```
type(scope): description

feat(auth): add multi-factor authentication
fix(clients): resolve client search pagination
docs(api): update authentication endpoints
refactor(shared): extract common validation logic
```

#### Pre-commit Checks
Automatic checks run before each commit:
- ESLint with architectural rules
- Prettier formatting
- TypeScript type checking
- Architectural validation tests

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript configuration**
   ```typescript
   // Enable strict mode in tsconfig.json
   "strict": true,
   "noImplicitAny": true,
   "strictNullChecks": true
   ```

2. **Define proper types**
   ```typescript
   // ✅ Good
   interface User {
     id: string;
     name: string;
     email: string;
     createdAt: Date;
   }
   
   // ❌ Avoid
   const user: any = getUserData();
   ```

3. **Use type guards for runtime checks**
   ```typescript
   function isUser(obj: unknown): obj is User {
     return typeof obj === 'object' && obj !== null && 'id' in obj;
   }
   ```

### React Guidelines

1. **Use functional components with hooks**
   ```typescript
   // ✅ Preferred
   const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
     const { user, loading } = useUser(userId);
     
     if (loading) return <LoadingSpinner />;
     
     return <div>{user.name}</div>;
   };
   ```

2. **Implement proper error boundaries**
   ```typescript
   <ErrorBoundary fallback={<ErrorFallback />}>
     <UserProfile userId={userId} />
   </ErrorBoundary>
   ```

3. **Use custom hooks for business logic**
   ```typescript
   // Extract complex logic into custom hooks
   const useUserManagement = () => {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);
     
     // Business logic here
     
     return { users, loading, createUser, updateUser, deleteUser };
   };
   ```

### Service Layer Guidelines

1. **Keep services framework-agnostic**
   ```typescript
   // ✅ Good - pure business logic
   export const userService = {
     async getUser(id: string): Promise<User> {
       const response = await api.get(`/users/${id}`);
       return response.data;
     }
   };
   
   // ❌ Avoid - React-specific code in services
   export const userService = {
     useUser(id: string) {
       return useQuery(['user', id], () => fetchUser(id));
     }
   };
   ```

2. **Handle errors consistently**
   ```typescript
   export const userService = {
     async createUser(userData: CreateUserData): Promise<User> {
       try {
         const response = await api.post('/users', userData);
         return response.data;
       } catch (error) {
         throw new UserServiceError('Failed to create user', error);
       }
     }
   };
   ```

## Testing Guidelines

### Test Organization

Tests should be co-located with their source files:

```
feature/
├── components/
│   ├── UserProfile.tsx
│   └── UserProfile.test.tsx
├── hooks/
│   ├── useUserData.ts
│   └── useUserData.test.ts
└── services/
    ├── userService.ts
    └── userService.test.ts
```

### Testing Patterns

#### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  test('displays user name', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

#### Hook Tests
```typescript
import { renderHook } from '@testing-library/react';
import { useUserData } from './useUserData';

describe('useUserData', () => {
  test('loads user data', async () => {
    const { result } = renderHook(() => useUserData('user-1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeDefined();
    });
  });
});
```

#### Service Tests
```typescript
import { userService } from './userService';

describe('userService', () => {
  test('creates user successfully', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const user = await userService.createUser(userData);
    
    expect(user).toHaveProperty('id');
    expect(user.name).toBe(userData.name);
  });
});
```

### Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run feature-specific tests
npm run test:auth
npm run test:clients

# Run architectural tests
npm run test:architecture
```

## Common Tasks

### Adding a New Component

1. **Create component file**
   ```typescript
   // src/features/my-feature/components/MyComponent.tsx
   import React from 'react';
   
   interface MyComponentProps {
     title: string;
     onAction: () => void;
   }
   
   export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
     return (
       <div>
         <h2>{title}</h2>
         <button onClick={onAction}>Action</button>
       </div>
     );
   };
   ```

2. **Add to feature's public API**
   ```typescript
   // src/features/my-feature/index.ts
   export { MyComponent } from './components/MyComponent';
   ```

3. **Create tests**
   ```typescript
   // src/features/my-feature/components/MyComponent.test.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { MyComponent } from './MyComponent';
   
   describe('MyComponent', () => {
     test('calls onAction when button clicked', () => {
       const mockAction = jest.fn();
       render(<MyComponent title="Test" onAction={mockAction} />);
       
       fireEvent.click(screen.getByText('Action'));
       expect(mockAction).toHaveBeenCalled();
     });
   });
   ```

### Adding a New Service

1. **Create service file**
   ```typescript
   // src/features/my-feature/services/myService.ts
   import { api } from '@/shared/services/api';
   
   export const myService = {
     async getData(): Promise<MyData[]> {
       const response = await api.get('/my-data');
       return response.data;
     },
     
     async createData(data: CreateMyData): Promise<MyData> {
       const response = await api.post('/my-data', data);
       return response.data;
     }
   };
   ```

2. **Add to feature's public API**
   ```typescript
   // src/features/my-feature/index.ts
   export { myService } from './services/myService';
   ```

3. **Create hook for React integration**
   ```typescript
   // src/features/my-feature/hooks/useMyData.ts
   import { useQuery, useMutation } from '@tanstack/react-query';
   import { myService } from '../services/myService';
   
   export const useMyData = () => {
     return useQuery({
       queryKey: ['my-data'],
       queryFn: myService.getData
     });
   };
   ```

### Cross-Feature Integration

When features need to communicate:

1. **Use public APIs only**
   ```typescript
   // ✅ Correct
   import { useAuth } from '@/features/auth';
   import { clientService } from '@/features/clients';
   
   const MyComponent = () => {
     const { user } = useAuth();
     const { data: clients } = useQuery(['clients'], clientService.getAll);
     
     // Component logic
   };
   ```

2. **Consider shared state for complex interactions**
   ```typescript
   // For complex cross-feature state, use shared context
   import { useGlobalState } from '@/shared/state';
   ```

3. **Document integration patterns**
   ```typescript
   // Update feature README.md with integration examples
   ```

## Troubleshooting

### Common Issues

#### Import Path Errors
```
Error: Import path restricted
```
**Solution**: Use feature's public API through `index.ts`
```typescript
// ❌ Wrong
import { UserService } from '@/features/users/services/userService';

// ✅ Correct
import { UserService } from '@/features/users';
```

#### Circular Dependency Errors
```
Error: Circular dependency detected
```
**Solution**: Extract shared logic or restructure dependencies
```typescript
// Create shared utility or move logic to appropriate layer
```

#### TypeScript Errors
```
Error: Cannot find module '@/features/...'
```
**Solution**: Check TypeScript path mapping in `tsconfig.json`

#### Test Failures
```
Error: Module not found in test
```
**Solution**: Check Jest configuration and module resolution

### Debug Commands

```bash
# Check ESLint issues
npm run lint

# Fix auto-fixable ESLint issues
npm run lint:fix

# Check TypeScript errors
npm run type-check

# Validate project structure
npm run validate:structure

# Run architectural validation
npm run test:architecture
```

### Getting Help

1. **Check feature documentation** - Each feature has a README.md
2. **Review architectural documentation** - See `docs/architecture/`
3. **Ask team members** - Use team communication channels
4. **Check existing patterns** - Look at similar implementations

## Next Steps

After completing this onboarding:

1. **Explore the codebase** - Browse different features to understand patterns
2. **Run the application** - Start the dev server and explore the UI
3. **Make a small change** - Try adding a simple component or fixing a bug
4. **Read feature documentation** - Deep dive into specific features you'll work on
5. **Review architectural decisions** - Understand why certain patterns were chosen

Welcome to the team! 🚀