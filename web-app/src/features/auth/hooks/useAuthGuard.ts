import { useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useOrganizationContext } from '@/shared/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import Logger from '@utils/Logger';

export interface AuthGuardResult {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  user: any;
  organization: any;
  userRole: string | null;
  hasAccess: boolean;
  redirect: () => void;
  checkRole: (role: string) => boolean;
  checkPermission: (permission: string) => boolean;
  checkPermissions: (permissions: string[]) => boolean;
  authError?: string;
}

export interface AuthGuardOptions {
  requiredRole?: 'admin' | 'basic_member' | string;
  requiredPermissions?: string[];
  organizationRequired?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
}

/**
 * Custom hook for authentication and authorization guards
 *
 * Provides a declarative way to check authentication and authorization
 * without wrapping components in HOCs or ProtectedRoute components.
 *
 * @param options - Authentication and authorization requirements
 * @returns Auth guard result with access control information
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const {
    requiredRole,
    requiredPermissions = [],
    organizationRequired = false,
    adminOnly = false,
    redirectTo = '/login',
  } = options;

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
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

  const result = useMemo(() => {
    const isLoading = !isLoaded || !orgLoaded || !isInitialized;

    // Loading state
    if (isLoading) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        isLoading: true,
        user: null,
        organization: null,
        userRole: null,
        hasAccess: false,
        redirect: () => {},
        checkRole: () => false,
        checkPermission: () => false,
        checkPermissions: () => false,
      };
    }

    // Authentication check
    const isAuthenticated = isSignedIn && !!user;

    if (!isAuthenticated) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        isLoading: false,
        user: null,
        organization: null,
        userRole: null,
        hasAccess: false,
        redirect: () =>
          navigate(redirectTo, {
            state: { returnTo: location.pathname + location.search },
            replace: true,
          }),
        checkRole: () => false,
        checkPermission: () => false,
        checkPermissions: () => false,
        authError: 'User not authenticated',
      };
    }

    // Onboarding check
    const hasCompletedOnboarding = user.unsafeMetadata?.onboardingComplete === true;
    const isOnOnboardingPage = location.pathname === '/onboarding';

    if (!hasCompletedOnboarding && !isOnOnboardingPage) {
      return {
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        organization: null,
        userRole: null,
        hasAccess: false,
        redirect: () => navigate('/onboarding', { replace: true }),
        checkRole: () => false,
        checkPermission: () => false,
        checkPermissions: () => false,
        authError: 'Onboarding not completed',
      };
    }

    // Organization requirements
    if (organizationRequired) {
      if (needsOrganizationCreation) {
        return {
          isAuthenticated: true,
          isAuthorized: false,
          isLoading: false,
          user,
          organization: null,
          userRole: null,
          hasAccess: false,
          redirect: () =>
            navigate('/organization', {
              state: { action: 'create' },
              replace: true,
            }),
          checkRole: () => false,
          checkPermission: () => false,
          checkPermissions: () => false,
          authError: 'Organization creation required',
        };
      }

      if (needsOrganizationSelection) {
        return {
          isAuthenticated: true,
          isAuthorized: false,
          isLoading: false,
          user,
          organization: null,
          userRole: null,
          hasAccess: false,
          redirect: () =>
            navigate('/organization', {
              state: { action: 'select' },
              replace: true,
            }),
          checkRole: () => false,
          checkPermission: () => false,
          checkPermissions: () => false,
          authError: 'Organization selection required',
        };
      }

      if (!organization || !isMember()) {
        return {
          isAuthenticated: true,
          isAuthorized: false,
          isLoading: false,
          user,
          organization,
          userRole: getUserRole(),
          hasAccess: false,
          redirect: () =>
            navigate('/dashboard', {
              state: {
                error: 'You do not have access to this organization.',
                returnTo: location.pathname + location.search,
              },
              replace: true,
            }),
          checkRole: () => false,
          checkPermission: () => false,
          checkPermissions: () => false,
          authError: 'Organization membership required',
        };
      }
    }

    // Helper functions
    const currentRole = getUserRole();
    const userPermissions = getUserPermissions(currentRole);

    const checkRole = (role: string): boolean => hasRole(role);

    const checkPermission = (permission: string): boolean => userPermissions.includes(permission);

    const checkPermissions = (permissions: string[]): boolean =>
      permissions.every(permission => userPermissions.includes(permission));

    // Role-based access control
    if (adminOnly && !isAdmin()) {
      return {
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        organization,
        userRole: currentRole,
        hasAccess: false,
        redirect: () =>
          navigate('/dashboard', {
            state: {
              error: 'Administrator access required.',
              returnTo: location.pathname + location.search,
            },
            replace: true,
          }),
        checkRole,
        checkPermission,
        checkPermissions,
        authError: 'Administrator access required',
      };
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return {
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        organization,
        userRole: currentRole,
        hasAccess: false,
        redirect: () =>
          navigate('/dashboard', {
            state: {
              error: `This page requires ${requiredRole} access. Your current role: ${currentRole || 'none'}.`,
              returnTo: location.pathname + location.search,
            },
            replace: true,
          }),
        checkRole,
        checkPermission,
        checkPermissions,
        authError: `Role ${requiredRole} required, current: ${currentRole || 'none'}`,
      };
    }

    // Permission-based access control
    if (requiredPermissions.length > 0 && !checkPermissions(requiredPermissions)) {
      const missingPermissions = requiredPermissions.filter(
        permission => !checkPermission(permission),
      );

      return {
        isAuthenticated: true,
        isAuthorized: false,
        isLoading: false,
        user,
        organization,
        userRole: currentRole,
        hasAccess: false,
        redirect: () =>
          navigate('/dashboard', {
            state: {
              error: `Missing required permissions: ${missingPermissions.join(', ')}`,
              returnTo: location.pathname + location.search,
            },
            replace: true,
          }),
        checkRole,
        checkPermission,
        checkPermissions,
        authError: `Missing permissions: ${missingPermissions.join(', ')}`,
      };
    }

    // All checks passed
    Logger.debug('useAuthGuard: Access granted', {
      userId: user.id,
      organizationId: organization?.id,
      userRole: currentRole,
      path: location.pathname,
    });

    return {
      isAuthenticated: true,
      isAuthorized: true,
      isLoading: false,
      user,
      organization,
      userRole: currentRole,
      hasAccess: true,
      redirect: () => {},
      checkRole,
      checkPermission,
      checkPermissions,
    };
  }, [
    isLoaded,
    orgLoaded,
    isInitialized,
    isSignedIn,
    user,
    organization,
    requiredRole,
    requiredPermissions,
    organizationRequired,
    adminOnly,
    needsOrganizationSelection,
    needsOrganizationCreation,
    location.pathname,
    navigate,
    redirectTo,
    hasRole,
    isAdmin,
    isMember,
    getUserRole,
  ]);

  return result;
}

/**
 * Simplified hook for basic authentication check
 */
export function useAuthCheck() {
  return useAuthGuard();
}

/**
 * Hook for admin-only access
 */
export function useAdminGuard() {
  return useAuthGuard({ adminOnly: true, organizationRequired: true });
}

/**
 * Hook for organization member access
 */
export function useOrgGuard() {
  return useAuthGuard({ organizationRequired: true });
}

/**
 * Hook for role-based access
 */
export function useRoleGuard(role: string) {
  return useAuthGuard({ requiredRole: role, organizationRequired: true });
}

/**
 * Hook for permission-based access
 */
export function usePermissionGuard(permissions: string[]) {
  return useAuthGuard({ requiredPermissions: permissions });
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
 * Example usage:
 *
 * // Basic authentication check
 * const { isAuthenticated, redirect } = useAuthCheck();
 * if (!isAuthenticated) redirect();
 *
 * // Admin guard
 * const { hasAccess, authError } = useAdminGuard();
 * if (!hasAccess) return <div>Access denied: {authError}</div>;
 *
 * // Role guard
 * const { isAuthorized } = useRoleGuard('manager');
 *
 * // Permission guard
 * const { checkPermission } = usePermissionGuard(['view_analytics']);
 * if (checkPermission('export_data')) {
 *   // Show export button
 * }
 *
 * // Custom requirements
 * const { hasAccess, user, organization } = useAuthGuard({
 *   requiredRole: 'admin',
 *   requiredPermissions: ['manage_users'],
 *   organizationRequired: true
 * });
 */
