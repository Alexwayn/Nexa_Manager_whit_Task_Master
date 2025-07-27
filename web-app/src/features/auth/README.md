# Authentication Feature

## Overview

The Authentication feature provides comprehensive user authentication and authorization functionality for Nexa Manager. It integrates Clerk authentication with Supabase backend services, providing secure user management, role-based access control, and organization-level permissions.

## Architecture

This feature follows a layered architecture:
- **Components**: React components for authentication UI and route protection
- **Hooks**: Custom hooks for authentication state management
- **Services**: Business logic for authentication operations
- **Utils**: Utility functions for authentication-related operations

## Public API

### Components

#### `ProtectedRoute`
Protects routes that require user authentication.

```tsx
import { ProtectedRoute } from '@/features/auth';

<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

#### `OrganizationProtectedRoute`
Protects routes that require organization membership.

```tsx
import { OrganizationProtectedRoute } from '@/features/auth';

<OrganizationProtectedRoute>
  <YourOrganizationComponent />
</OrganizationProtectedRoute>
```

#### `UnauthorizedAccess`
Displays unauthorized access message and provides navigation options.

```tsx
import { UnauthorizedAccess } from '@/features/auth';

<UnauthorizedAccess />
```

#### `withAuth` (HOC)
Higher-order component for wrapping components with authentication logic.

```tsx
import { withAuth } from '@/features/auth';

const ProtectedComponent = withAuth(YourComponent);
```

### Hooks

#### `useClerkAuth`
Provides Clerk authentication state and methods.

```tsx
import { useClerkAuth } from '@/features/auth';

const { user, isLoaded, isSignedIn, signOut } = useClerkAuth();
```

#### `useAuthGuard`
Provides authentication guard functionality with role checking.

```tsx
import { useAuthGuard } from '@/features/auth';

const { hasPermission, checkRole, isAuthorized } = useAuthGuard();
```

### Services

#### `authService`
Core authentication service for user management operations.

```tsx
import { authService } from '@/features/auth';

// Get current user
const user = await authService.getCurrentUser();

// Check user permissions
const hasAccess = await authService.checkPermission('read:clients');
```

#### `clerkSupabaseIntegration`
Integration service between Clerk and Supabase.

```tsx
import { clerkSupabaseIntegration } from '@/features/auth';

// Sync user data
await clerkSupabaseIntegration.syncUserData(clerkUser);
```

#### `securityService`
Security-related operations and validations.

```tsx
import { securityService } from '@/features/auth';

// Validate session
const isValid = await securityService.validateSession();
```

## Dependencies

### Internal Dependencies
- `@/shared/types` - Shared type definitions
- `@/shared/utils` - Shared utility functions
- `@/shared/constants` - Application constants

### External Dependencies
- `@clerk/clerk-react` - Clerk authentication
- `@supabase/supabase-js` - Supabase client
- `react-router-dom` - Routing functionality

## Integration Patterns

### Cross-Feature Communication

When other features need authentication data:

```tsx
// In other features
import { useClerkAuth } from '@/features/auth';

const MyFeatureComponent = () => {
  const { user, isSignedIn } = useClerkAuth();
  
  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome, {user.firstName}!</div>;
};
```

### Route Protection

```tsx
// In your router configuration
import { ProtectedRoute, OrganizationProtectedRoute } from '@/features/auth';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <OrganizationProtectedRoute requiredRole="admin">
    <AdminPanel />
  </OrganizationProtectedRoute>
} />
```

## Testing Approach

### Unit Tests
- Test authentication hooks with mock Clerk data
- Test service functions with mocked API responses
- Test component rendering with different auth states

### Integration Tests
- Test authentication flow end-to-end
- Test route protection with different user roles
- Test Clerk-Supabase integration

### Test Utilities
```tsx
// Test helper for mocking authentication
export const mockAuthUser = {
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }]
};

export const renderWithAuth = (component, authState = {}) => {
  // Render component with mocked auth context
};
```

## Configuration

### Environment Variables
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Clerk Configuration
- Configure allowed redirect URLs
- Set up organization settings
- Configure session management

### Supabase Configuration
- Set up Row Level Security (RLS) policies
- Configure user table structure
- Set up organization relationships

## Security Considerations

- All authentication tokens are handled securely by Clerk
- Supabase RLS policies enforce data access controls
- Session validation occurs on both client and server
- Organization-level permissions are enforced at the database level

## Troubleshooting

### Common Issues

1. **User not syncing with Supabase**
   - Check Clerk webhook configuration
   - Verify Supabase connection settings

2. **Route protection not working**
   - Ensure ProtectedRoute wraps the correct components
   - Check authentication state loading

3. **Permission checks failing**
   - Verify user roles in Clerk dashboard
   - Check Supabase RLS policies

### Debug Tools
```tsx
// Enable debug mode for authentication
import { authService } from '@/features/auth';

authService.enableDebugMode();
```