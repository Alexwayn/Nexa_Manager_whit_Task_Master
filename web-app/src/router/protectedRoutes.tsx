import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@components/auth/ProtectedRoute';
import OrganizationProtectedRoute from '@components/auth/OrganizationProtectedRoute';
import { AdminRequired } from '@components/auth/UnauthorizedAccess';

// Import lazy-loaded components
import { lazy } from 'react';

const Dashboard = lazy(() => import('@pages/Dashboard'));
const Settings = lazy(() => import('@pages/Settings'));
const Analytics = lazy(() => import('@pages/Analytics'));
const Reports = lazy(() => import('@pages/Reports'));
const OrganizationManagement = lazy(() => import('@pages/OrganizationManagement'));

/**
 * Enhanced Protected Routes Configuration
 * 
 * This file demonstrates different ways to configure protected routes
 * with various access control requirements.
 */

// Example 1: Basic protected routes (authentication only)
export const BasicProtectedRoutes = () => (
  <Routes>
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
  </Routes>
);

// Example 2: Organization-required routes
export const OrganizationRoutes = () => (
  <Routes>
    <Route path="/analytics" element={
      <OrganizationProtectedRoute organizationRequired={true}>
        <Analytics />
      </OrganizationProtectedRoute>
    } />
    
    <Route path="/reports" element={
      <OrganizationProtectedRoute 
        organizationRequired={true}
        requiredPermissions={['view_analytics', 'access_reports']}
      >
        <Reports />
      </OrganizationProtectedRoute>
    } />
  </Routes>
);

// Example 3: Admin-only routes
export const AdminRoutes = () => (
  <Routes>
    <Route path="/organization" element={
      <OrganizationProtectedRoute 
        adminOnly={true}
        fallbackUrl="/dashboard"
        unauthorizedComponent={() => <AdminRequired />}
      >
        <OrganizationManagement />
      </OrganizationProtectedRoute>
    } />
    
    <Route path="/settings" element={
      <OrganizationProtectedRoute 
        requiredRole="admin"
        organizationRequired={true}
      >
        <Settings />
      </OrganizationProtectedRoute>
    } />
  </Routes>
);

// Example 4: Role-based routes
export const RoleBasedRoutes = () => (
  <Routes>
    {/* Manager-only route */}
    <Route path="/manager-dashboard" element={
      <OrganizationProtectedRoute 
        requiredRole="manager"
        organizationRequired={true}
        fallbackUrl="/dashboard"
      >
        <div>Manager Dashboard</div>
      </OrganizationProtectedRoute>
    } />
    
    {/* Basic member route */}
    <Route path="/member-area" element={
      <OrganizationProtectedRoute 
        requiredRole="basic_member"
        organizationRequired={true}
      >
        <div>Member Area</div>
      </OrganizationProtectedRoute>
    } />
  </Routes>
);

// Example 5: Permission-based routes
export const PermissionBasedRoutes = () => (
  <Routes>
    {/* Billing management - requires specific permissions */}
    <Route path="/billing" element={
      <OrganizationProtectedRoute 
        requiredPermissions={['manage_billing', 'view_analytics']}
        organizationRequired={true}
        fallbackUrl="/dashboard"
      >
        <div>Billing Management</div>
      </OrganizationProtectedRoute>
    } />
    
    {/* User management - admin only with specific permissions */}
    <Route path="/users" element={
      <OrganizationProtectedRoute 
        adminOnly={true}
        requiredPermissions={['manage_users']}
        organizationRequired={true}
      >
        <div>User Management</div>
      </OrganizationProtectedRoute>
    } />
  </Routes>
);

// Example 6: Mixed route configurations
export const MixedRoutes = () => (
  <Routes>
    {/* Public/basic auth route */}
    <Route path="/profile" element={
      <ProtectedRoute>
        <div>User Profile</div>
      </ProtectedRoute>
    } />
    
    {/* Organization member route */}
    <Route path="/team" element={
      <OrganizationProtectedRoute organizationRequired={true}>
        <div>Team Area</div>
      </OrganizationProtectedRoute>
    } />
    
    {/* Complex requirements */}
    <Route path="/advanced-analytics" element={
      <OrganizationProtectedRoute 
        requiredRole="admin"
        requiredPermissions={['view_analytics', 'export_data']}
        organizationRequired={true}
        fallbackUrl="/analytics"
      >
        <div>Advanced Analytics</div>
      </OrganizationProtectedRoute>
    } />
  </Routes>
);

/**
 * HOC Examples for Components
 */

// Using withAuth HOC
import { withAuth, withAdminAuth, withOrgAuth } from '@components/auth/withAuth';

// Basic component with auth
const MyComponent = ({ user, isAuthenticated }: any) => (
  <div>
    <h1>Welcome {user?.firstName}!</h1>
    <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
  </div>
);

// Enhanced components with different auth requirements
export const AuthenticatedComponent = withAuth(MyComponent);
export const AdminComponent = withAdminAuth(MyComponent);
export const OrgComponent = withOrgAuth(MyComponent);

/**
 * Hook Examples for Components
 */

// Using auth hooks
import { useAuthGuard, useAdminGuard, useOrgGuard } from '@hooks/useAuthGuard';

export const HookBasedComponent = () => {
  const { isAuthenticated, user, redirect } = useAuthGuard();
  
  if (!isAuthenticated) {
    redirect();
    return null;
  }
  
  return <div>Hello {user?.firstName}!</div>;
};

export const AdminOnlyComponent = () => {
  const { hasAccess } = useAdminGuard();
  
  if (!hasAccess) {
    return <AdminRequired />;
  }
  
  return <div>Admin content here</div>;
};

export const ConditionalContentComponent = () => {
  const { checkPermission, checkRole } = useOrgGuard();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {checkRole('admin') && (
        <button>Admin Settings</button>
      )}
      
      {checkPermission('manage_users') && (
        <button>Manage Users</button>
      )}
      
      {checkPermission('view_analytics') && (
        <button>View Analytics</button>
      )}
    </div>
  );
};

/**
 * Route Configuration Best Practices
 */

export const BestPracticeRoutes = () => (
  <Routes>
    {/* 1. Always use the most specific protection needed */}
    <Route 
      path="/public-profile" 
      element={
        <ProtectedRoute>
          <div>Public Profile</div>
        </ProtectedRoute>
      } 
    />
    
    <Route 
      path="/org-dashboard" 
      element={
        <OrganizationProtectedRoute organizationRequired={true}>
          <div>Organization Dashboard</div>
        </OrganizationProtectedRoute>
      } 
    />
    
    {/* 2. Combine requirements when needed */}
    <Route 
      path="/sensitive-data" 
      element={
        <OrganizationProtectedRoute 
          adminOnly={true}
          requiredPermissions={['access_sensitive_data']}
          organizationRequired={true}
        >
          <div>Sensitive Data</div>
        </OrganizationProtectedRoute>
      } 
    />
    
    {/* 3. Provide appropriate fallbacks */}
    <Route 
      path="/reports" 
      element={
        <OrganizationProtectedRoute 
          requiredPermissions={['view_reports']}
          fallbackUrl="/dashboard"
          unauthorizedComponent={() => (
            <div>You need reporting permissions to access this page.</div>
          )}
        >
          <div>Reports</div>
        </OrganizationProtectedRoute>
      } 
    />
  </Routes>
);

export default {
  BasicProtectedRoutes,
  OrganizationRoutes,
  AdminRoutes,
  RoleBasedRoutes,
  PermissionBasedRoutes,
  MixedRoutes,
  BestPracticeRoutes
}; 