# Protected Routes with Clerk Middleware - Developer Guide

This guide explains how to implement and use the enhanced protected routes system with Clerk authentication and organization-based access control.

## 🏗️ **System Architecture**

The protected routes system consists of several components working together:

1. **Base ProtectedRoute** - Basic authentication
2. **OrganizationProtectedRoute** - Advanced auth + organization + roles + permissions
3. **withAuth HOC** - Component-level authentication wrapper
4. **useAuthGuard hooks** - Declarative authentication checks
5. **UnauthorizedAccess** - User-friendly error pages

## 🔐 **Authentication Levels**

### 1. Basic Authentication
```tsx
import ProtectedRoute from '@components/auth/ProtectedRoute';

<Route path="/profile" element={
  <ProtectedRoute>
    <UserProfile />
  </ProtectedRoute>
} />
```

**Features:**
- ✅ User authentication check
- ✅ Onboarding flow handling
- ✅ Automatic redirect to login
- ✅ Return URL preservation

### 2. Organization-Based Protection
```tsx
import OrganizationProtectedRoute from '@components/auth/OrganizationProtectedRoute';

<Route path="/team" element={
  <OrganizationProtectedRoute organizationRequired={true}>
    <TeamDashboard />
  </OrganizationProtectedRoute>
} />
```

**Features:**
- ✅ All basic authentication features
- ✅ Organization membership validation
- ✅ Organization creation/selection flow
- ✅ Multi-tenant data isolation

### 3. Role-Based Access Control
```tsx
<Route path="/admin" element={
  <OrganizationProtectedRoute 
    adminOnly={true}
    organizationRequired={true}
  >
    <AdminPanel />
  </OrganizationProtectedRoute>
} />
```

**Supported Roles:**
- `admin` - Full administrative access
- `basic_member` - Standard member access
- Custom roles as defined in your system

### 4. Permission-Based Access Control
```tsx
<Route path="/billing" element={
  <OrganizationProtectedRoute 
    requiredPermissions={['manage_billing', 'view_analytics']}
    organizationRequired={true}
  >
    <BillingDashboard />
  </OrganizationProtectedRoute>
} />
```

**Default Permissions:**
- `read` - View basic data
- `write` - Create/edit data
- `delete` - Remove data
- `manage_users` - User management
- `manage_organization` - Organization settings
- `view_analytics` - Analytics access
- `export_data` - Data export
- `manage_billing` - Billing management
- `access_reports` - Report access
- `manage_settings` - System settings

## 🧩 **Component-Level Protection**

### Using Higher-Order Components (HOCs)

```tsx
import { withAuth, withAdminAuth, withOrgAuth } from '@components/auth/withAuth';

// Basic authentication
const MyComponent = ({ user, isAuthenticated }) => (
  <div>Welcome {user?.firstName}!</div>
);
export default withAuth(MyComponent);

// Admin-only component
const AdminComponent = ({ user, isAdmin }) => (
  <div>Admin Dashboard</div>
);
export default withAdminAuth(AdminComponent);

// Organization member component
const TeamComponent = ({ organization, userRole }) => (
  <div>Team: {organization?.name}</div>
);
export default withOrgAuth(TeamComponent);
```

### Using Custom Hooks

```tsx
import { useAuthGuard, useAdminGuard, useOrgGuard } from '@hooks/useAuthGuard';

const MyComponent = () => {
  const { isAuthenticated, user, redirect } = useAuthGuard();
  
  if (!isAuthenticated) {
    redirect();
    return null;
  }
  
  return <div>Hello {user?.firstName}!</div>;
};

const AdminComponent = () => {
  const { hasAccess, authError } = useAdminGuard();
  
  if (!hasAccess) {
    return <div>Access denied: {authError}</div>;
  }
  
  return <div>Admin content</div>;
};
```

### Conditional Content Rendering

```tsx
import { useOrgGuard } from '@hooks/useAuthGuard';

const Dashboard = () => {
  const { checkPermission, checkRole, isAdmin } = useOrgGuard();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {isAdmin && (
        <button>Admin Settings</button>
      )}
      
      {checkRole('admin') && (
        <AdminPanel />
      )}
      
      {checkPermission('manage_users') && (
        <UserManagement />
      )}
      
      {checkPermission('view_analytics') && (
        <AnalyticsWidget />
      )}
    </div>
  );
};
```

## 🛡️ **Security Best Practices**

### 1. Principle of Least Privilege
```tsx
// ❌ Don't give unnecessary permissions
<OrganizationProtectedRoute adminOnly={true}>
  <SimpleDataView />
</OrganizationProtectedRoute>

// ✅ Use specific permissions needed
<OrganizationProtectedRoute requiredPermissions={['read']}>
  <SimpleDataView />
</OrganizationProtectedRoute>
```

### 2. Layer Security Checks
```tsx
// ✅ Combine route-level and component-level checks
<Route path="/sensitive" element={
  <OrganizationProtectedRoute adminOnly={true}>
    <SensitiveComponent />
  </OrganizationProtectedRoute>
} />

const SensitiveComponent = () => {
  const { isAdmin, checkPermission } = useAdminGuard();
  
  // Additional checks within component
  const canDeleteData = isAdmin && checkPermission('delete');
  
  return (
    <div>
      {canDeleteData && <DangerousDeleteButton />}
    </div>
  );
};
```

### 3. Handle Edge Cases
```tsx
<OrganizationProtectedRoute 
  adminOnly={true}
  fallbackUrl="/dashboard"  // Where to redirect if unauthorized
  unauthorizedComponent={() => <CustomErrorPage />}  // Custom error handling
>
  <AdminPanel />
</OrganizationProtectedRoute>
```

## 🔧 **Configuration Examples**

### Basic Setup
```tsx
// App.jsx
import { ClerkProvider } from '@clerk/clerk-react';
import { OrganizationProvider } from '@context/OrganizationContext';

function App() {
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <OrganizationProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </OrganizationProvider>
    </ClerkProvider>
  );
}
```

### Route Configuration
```tsx
// AppRouter.jsx
import ProtectedRoute from '@components/auth/ProtectedRoute';
import OrganizationProtectedRoute from '@components/auth/OrganizationProtectedRoute';

const AppRouter = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    {/* Protected routes */}
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      {/* Basic auth required */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      
      {/* Organization required */}
      <Route path="/team" element={
        <OrganizationProtectedRoute organizationRequired={true}>
          <TeamDashboard />
        </OrganizationProtectedRoute>
      } />
      
      {/* Admin only */}
      <Route path="/admin/*" element={
        <OrganizationProtectedRoute adminOnly={true}>
          <AdminRoutes />
        </OrganizationProtectedRoute>
      } />
    </Route>
  </Routes>
);
```

## 🧪 **Testing Protected Routes**

### Test Setup
```tsx
// test-utils.tsx
import { ClerkProvider } from '@clerk/clerk-react';
import { OrganizationProvider } from '@context/OrganizationContext';
import { BrowserRouter } from 'react-router-dom';

export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ClerkProvider publishableKey="test-key">
      <OrganizationProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </OrganizationProvider>
    </ClerkProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};
```

### Test Examples
```tsx
// ProtectedRoute.test.tsx
import { renderWithProviders } from './test-utils';
import ProtectedRoute from '@components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    // Mock unauthenticated state
    jest.mock('@clerk/clerk-react', () => ({
      useAuth: () => ({ isLoaded: true, isSignedIn: false }),
      useUser: () => ({ user: null })
    }));
    
    const { container } = renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Assert redirect to login
    expect(window.location.pathname).toBe('/login');
  });
  
  it('renders content for authenticated users', () => {
    // Mock authenticated state
    jest.mock('@clerk/clerk-react', () => ({
      useAuth: () => ({ isLoaded: true, isSignedIn: true }),
      useUser: () => ({ 
        user: { 
          id: 'user-123', 
          unsafeMetadata: { onboardingComplete: true } 
        } 
      })
    }));
    
    const { getByText } = renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(getByText('Protected Content')).toBeInTheDocument();
  });
});
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Infinite redirect loops**
   ```tsx
   // ❌ Don't use ProtectedRoute inside other ProtectedRoute
   <ProtectedRoute>
     <ProtectedRoute>
       <Component />
     </ProtectedRoute>
   </ProtectedRoute>
   
   // ✅ Use single protection layer
   <OrganizationProtectedRoute organizationRequired={true}>
     <Component />
   </OrganizationProtectedRoute>
   ```

2. **Hook usage outside providers**
   ```tsx
   // ❌ Using hooks outside provider context
   const MyComponent = () => {
     const { user } = useAuthGuard(); // Error: Must be within OrganizationProvider
   };
   
   // ✅ Ensure component is within provider tree
   <OrganizationProvider>
     <MyComponent />
   </OrganizationProvider>
   ```

3. **Missing organization context**
   ```tsx
   // ❌ Organization hooks without organization requirement
   const { organization } = useOrgGuard(); // May be null
   
   // ✅ Explicitly require organization
   const { organization } = useAuthGuard({ organizationRequired: true });
   ```

### Debug Logging

Enable debug logging to troubleshoot access control issues:

```tsx
// Logger configuration
import Logger from '@utils/Logger';

// Components automatically log access decisions
// Check browser console for detailed information
```

## 📊 **Performance Considerations**

### Lazy Loading
```tsx
// ✅ Use lazy loading for protected routes
const AdminPanel = lazy(() => import('@pages/AdminPanel'));

<Route path="/admin" element={
  <OrganizationProtectedRoute adminOnly={true}>
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  </OrganizationProtectedRoute>
} />
```

### Memoization
```tsx
// ✅ Memoize expensive auth checks
const ExpensiveComponent = React.memo(() => {
  const { checkPermissions } = useOrgGuard();
  
  const hasComplexPermission = useMemo(() => 
    checkPermissions(['perm1', 'perm2', 'perm3']),
    [checkPermissions]
  );
  
  return hasComplexPermission ? <ComplexView /> : <SimpleView />;
});
```

## 🚀 **Migration Guide**

### From Basic Auth to Organization Auth
```tsx
// Before
<ProtectedRoute>
  <TeamComponent />
</ProtectedRoute>

// After
<OrganizationProtectedRoute organizationRequired={true}>
  <TeamComponent />
</OrganizationProtectedRoute>
```

### Adding Permission Checks
```tsx
// Before
const AdminComponent = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  if (!isAdmin) return <div>Access denied</div>;
  return <AdminPanel />;
};

// After
const AdminComponent = () => {
  const { hasAccess } = useAdminGuard();
  
  if (!hasAccess) return <AdminRequired />;
  return <AdminPanel />;
};
```

## 📚 **API Reference**

### OrganizationProtectedRoute Props
```tsx
interface OrganizationProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  fallbackUrl?: string;
  adminOnly?: boolean;
  unauthorizedComponent?: ComponentType<{ reason: string }>;
}
```

### useAuthGuard Options
```tsx
interface AuthGuardOptions {
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
}
```

### withAuth Options
```tsx
interface WithAuthOptions {
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
  loadingComponent?: ComponentType;
  unauthorizedComponent?: ComponentType<{ reason: string }>;
}
```

---

This enhanced protected routes system provides enterprise-grade security with Clerk authentication, ensuring proper access control throughout your application while maintaining excellent developer experience. 