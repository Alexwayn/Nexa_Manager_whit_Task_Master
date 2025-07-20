import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ReactNode, ReactElement } from 'react';
import { useOrganizationContext } from '@context/OrganizationContext';
import Logger from '@utils/Logger';

interface OrganizationProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  fallbackUrl?: string;
  adminOnly?: boolean;
  unauthorizedComponent?: () => ReactElement;
}

/**
 * OrganizationProtectedRoute Component
 *
 * Extends ProtectedRoute with organization-specific access control.
 * Enforces organization membership, roles, and permissions.
 *
 * @param children - Components to render if access is granted
 * @param requiredRole - Minimum role required (admin, basic_member, etc.)
 * @param requiredPermissions - Array of required permissions
 * @param organizationRequired - Whether organization membership is required
 * @param fallbackUrl - URL to redirect to if access is denied
 * @param adminOnly - Shorthand for admin-only access
 */
export default function OrganizationProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  organizationRequired = true,
  fallbackUrl = '/dashboard',
  adminOnly = false,
  unauthorizedComponent: _unauthorizedComponent,
}: OrganizationProtectedRouteProps) {
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

  // Show loading spinner while Clerk and organization context are initializing
  if (!isLoaded || !orgLoaded || !isInitialized) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <p className='ml-3 text-blue-600'>Loading...</p>
      </div>
    );
  }

  // Basic authentication check
  if (!isSignedIn || !user) {
    Logger.warn('OrganizationProtectedRoute: User not authenticated, redirecting to login');
    return (
      <Navigate to='/login' state={{ returnTo: location.pathname + location.search }} replace />
    );
  }

  // Check onboarding completion
  const hasCompletedOnboarding = user.unsafeMetadata?.onboardingComplete === true;
  const isOnOnboardingPage = location.pathname === '/onboarding';

  if (!hasCompletedOnboarding && !isOnOnboardingPage) {
    Logger.info('OrganizationProtectedRoute: User needs to complete onboarding');
    return <Navigate to='/onboarding' replace />;
  }

  // Organization checks
  if (organizationRequired) {
    // Handle case where user needs to create an organization
    if (needsOrganizationCreation) {
      Logger.info('OrganizationProtectedRoute: User needs to create organization');
      return <Navigate to='/organization' state={{ action: 'create' }} replace />;
    }

    // Handle case where user needs to select an organization
    if (needsOrganizationSelection) {
      Logger.info('OrganizationProtectedRoute: User needs to select organization');
      return <Navigate to='/organization' state={{ action: 'select' }} replace />;
    }

    // Check if user belongs to current organization
    if (!organization || !isMember()) {
      Logger.warn('OrganizationProtectedRoute: User not a member of required organization');
      return (
        <Navigate
          to={fallbackUrl}
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
    Logger.warn('OrganizationProtectedRoute: Admin access required but user is not admin');
    return (
      <Navigate
        to={fallbackUrl}
        state={{
          error: 'Administrator access required for this page.',
          returnTo: location.pathname + location.search,
        }}
        replace
      />
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    const userRole = getUserRole();
    Logger.warn('OrganizationProtectedRoute: Insufficient role', {
      required: requiredRole,
      current: userRole,
    });
    return (
      <Navigate
        to={fallbackUrl}
        state={{
          error: `This page requires ${requiredRole} access. Your current role: ${userRole || 'none'}.`,
          returnTo: location.pathname + location.search,
        }}
        replace
      />
    );
  }

  // Permission-based access control
  if (requiredPermissions.length > 0) {
    // This would integrate with your custom permission system
    // For now, we'll use a simple role-to-permission mapping
    const userPermissions = getUserPermissions(getUserRole());
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission),
      );
      Logger.warn('OrganizationProtectedRoute: Missing required permissions', {
        required: requiredPermissions,
        missing: missingPermissions,
        userRole: getUserRole(),
      });
      return (
        <Navigate
          to={fallbackUrl}
          state={{
            error: `Missing required permissions: ${missingPermissions.join(', ')}`,
            returnTo: location.pathname + location.search,
          }}
          replace
        />
      );
    }
  }

  // All checks passed, render protected content
  Logger.debug('OrganizationProtectedRoute: Access granted', {
    userId: user.id,
    organizationId: organization?.id,
    userRole: getUserRole(),
    path: location.pathname,
  });

  return <>{children}</>;
}

/**
 * Helper function to map roles to permissions
 * This can be extended to integrate with a more sophisticated permission system
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
    ],
    basic_member: ['read', 'write', 'view_analytics', 'access_reports'],
  };

  return rolePermissions[role || ''] || [];
}
