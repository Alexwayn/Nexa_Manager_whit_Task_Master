import { ComponentType } from 'react';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
import { useOrganizationContext } from '@context/OrganizationContext';
import { Navigate, useLocation } from 'react-router-dom';
import Logger from '@utils/Logger';

interface AuthProps {
  isAuthenticated: boolean;
  user: any;
  organization: any;
  userRole: string | null;
  isAdmin: boolean;
  isMember: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
}

interface WithAuthOptions {
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
  loadingComponent?: ComponentType;
  unauthorizedComponent?: ComponentType<{ reason: string }>;
}

/**
 * Higher-Order Component for Authentication and Authorization
 *
 * Wraps components with authentication logic and provides auth-related props.
 * Supports role-based and permission-based access control.
 *
 * @param WrappedComponent - Component to wrap with auth logic
 * @param options - Authentication and authorization options
 * @returns Enhanced component with authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P & AuthProps>,
  options: WithAuthOptions = {},
) {
  const {
    requiredRole,
    requiredPermissions = [],
    organizationRequired = false,
    adminOnly = false,
    redirectTo = '/login',
    loadingComponent: LoadingComponent,
    unauthorizedComponent: UnauthorizedComponent,
  } = options;

  const WithAuthComponent = (props: P) => {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const location = useLocation();
    const {
      organization,
      isLoaded: orgLoaded,
      isInitialized,
      hasRole,
      isAdmin,
      isMember,
      getUserRole,
      needsOrganizationSelection,
      needsOrganizationCreation,
    } = useOrganizationContext();

    const isLoading = !isLoaded || !orgLoaded || !isInitialized;

    // Loading state
    if (isLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <div className='flex justify-center items-center h-screen'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <p className='ml-3 text-blue-600'>Loading...</p>
        </div>
      );
    }

    // Authentication check
    if (!isSignedIn || !user) {
      Logger.warn('withAuth: User not authenticated, redirecting');
      return (
        <Navigate
          to={redirectTo}
          state={{ returnTo: location.pathname + location.search }}
          replace
        />
      );
    }

    // Onboarding check
    const hasCompletedOnboarding = user.unsafeMetadata?.onboardingComplete === true;
    const isOnOnboardingPage = location.pathname === '/onboarding';

    if (!hasCompletedOnboarding && !isOnOnboardingPage) {
      return <Navigate to='/onboarding' replace />;
    }

    // Organization requirements
    if (organizationRequired) {
      if (needsOrganizationCreation) {
        return <Navigate to='/organization' state={{ action: 'create' }} replace />;
      }

      if (needsOrganizationSelection) {
        return <Navigate to='/organization' state={{ action: 'select' }} replace />;
      }

      if (!organization || !isMember()) {
        if (UnauthorizedComponent) {
          return <UnauthorizedComponent reason='Organization membership required' />;
        }
        return (
          <Navigate
            to='/dashboard'
            state={{
              error: 'You do not have access to this organization.',
              returnTo: location.pathname + location.search,
            }}
            replace
          />
        );
      }
    }

    // Role-based access control
    if (adminOnly && !isAdmin()) {
      const reason = 'Administrator access required';
      if (UnauthorizedComponent) {
        return <UnauthorizedComponent reason={reason} />;
      }
      return (
        <Navigate
          to='/dashboard'
          state={{
            error: reason,
            returnTo: location.pathname + location.search,
          }}
          replace
        />
      );
    }

    if (requiredRole && !hasRole(requiredRole)) {
      const userRole = getUserRole();
      const reason = `This page requires ${requiredRole} access. Your current role: ${userRole || 'none'}.`;
      if (UnauthorizedComponent) {
        return <UnauthorizedComponent reason={reason} />;
      }
      return (
        <Navigate
          to='/dashboard'
          state={{
            error: reason,
            returnTo: location.pathname + location.search,
          }}
          replace
        />
      );
    }

    // Permission-based access control
    const userPermissions = getUserPermissions(getUserRole());

    const hasPermission = (permission: string): boolean => {
      return userPermissions.includes(permission);
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
      return permissions.every(permission => userPermissions.includes(permission));
    };

    if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
      const missingPermissions = requiredPermissions.filter(
        permission => !hasPermission(permission),
      );
      const reason = `Missing required permissions: ${missingPermissions.join(', ')}`;

      if (UnauthorizedComponent) {
        return <UnauthorizedComponent reason={reason} />;
      }
      return (
        <Navigate
          to='/dashboard'
          state={{
            error: reason,
            returnTo: location.pathname + location.search,
          }}
          replace
        />
      );
    }

    // All checks passed - create auth props
    const authProps: AuthProps = {
      isAuthenticated: isSignedIn,
      user,
      organization,
      userRole: getUserRole(),
      isAdmin: isAdmin(),
      isMember: isMember(),
      hasRole,
      hasPermission,
      hasAllPermissions,
      isLoading: false,
    };

    Logger.debug('withAuth: Access granted', {
      userId: user.id,
      organizationId: organization?.id,
      userRole: getUserRole(),
      path: location.pathname,
    });

    return <WrappedComponent {...props} {...authProps} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
}

/**
 * Helper function to get user permissions based on role
 */
function getUserPermissions(role: string | null): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'read',
      'write',
      'delete',
      'manage_users',
      'manage_organization',
      'view_analytics',
      'export_data',
      'manage_billing',
      'access_reports',
      'manage_settings',
      'manage_quotes',
      'manage_invoices',
      'manage_clients',
      'manage_inventory',
      'access_advanced_reports',
    ],
    basic_member: [
      'read',
      'write',
      'view_analytics',
      'access_reports',
      'manage_quotes',
      'manage_invoices',
      'manage_clients',
    ],
  };

  return rolePermissions[role || ''] || [];
}

/**
 * Predefined auth decorators for common use cases
 */

// Admin-only decorator
export const withAdminAuth = <P extends object>(Component: ComponentType<P & AuthProps>) =>
  withAuth(Component, { adminOnly: true, organizationRequired: true });

// Organization member decorator
export const withOrgAuth = <P extends object>(Component: ComponentType<P & AuthProps>) =>
  withAuth(Component, { organizationRequired: true });

// Role-specific decorators
export const withRole =
  <P extends object>(role: string) =>
  (Component: ComponentType<P & AuthProps>) =>
    withAuth(Component, { requiredRole: role, organizationRequired: true });

// Permission-specific decorator
export const withPermissions =
  <P extends object>(permissions: string[]) =>
  (Component: ComponentType<P & AuthProps>) =>
    withAuth(Component, { requiredPermissions: permissions });

/**
 * Example usage:
 *
 * // Basic usage
 * const ProtectedComponent = withAuth(MyComponent);
 *
 * // Admin-only component
 * const AdminComponent = withAdminAuth(MyAdminComponent);
 *
 * // Role-specific component
 * const ManagerComponent = withRole('manager')(MyManagerComponent);
 *
 * // Permission-specific component
 * const ReportsComponent = withPermissions(['view_analytics', 'access_reports'])(MyReportsComponent);
 *
 * // Custom options
 * const CustomProtectedComponent = withAuth(MyComponent, {
 *   requiredRole: 'admin',
 *   requiredPermissions: ['manage_users'],
 *   organizationRequired: true,
 *   redirectTo: '/unauthorized',
 *   loadingComponent: CustomLoader,
 *   unauthorizedComponent: CustomUnauthorized
 * });
 */
