import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock authentication context - replace with your actual auth implementation
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  permissions?: string[];
  organizationId?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// Mock auth state - replace with your actual auth context/store
const mockAuthState: AuthState = {
  isAuthenticated: true, // Set to false to test redirect behavior
  user: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'admin',
    permissions: ['manage_users', 'view_analytics', 'manage_billing'],
    organizationId: 'org-1'
  },
  isLoading: false
};

// Get auth state - replace with your actual auth implementation
const getAuthState = (): AuthState => {
  // This should come from your auth context, Redux store, or auth service
  return mockAuthState;
};

/**
 * Basic authentication guard hook
 * Provides authentication state and redirect functionality
 */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = getAuthState();

  const redirect = useCallback((to: string = '/login') => {
    navigate(to, { replace: true });
  }, [navigate]);

  return {
    isAuthenticated,
    user,
    isLoading,
    redirect
  };
};

/**
 * Admin authentication guard hook
 * Checks if user has admin privileges
 */
export const useAdminGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = getAuthState();

  const hasAccess = useMemo(() => {
    return isAuthenticated && user?.role === 'admin';
  }, [isAuthenticated, user?.role]);

  const redirect = useCallback((to: string = '/unauthorized') => {
    navigate(to, { replace: true });
  }, [navigate]);

  const requireAccess = useCallback(() => {
    if (!isAuthenticated) {
      redirect('/login');
      return false;
    }
    if (user?.role !== 'admin') {
      redirect('/unauthorized');
      return false;
    }
    return true;
  }, [isAuthenticated, user?.role, redirect]);

  return {
    isAuthenticated,
    user,
    isLoading,
    hasAccess,
    redirect,
    requireAccess
  };
};

/**
 * Organization authentication guard hook
 * Provides role and permission checking within organization context
 */
export const useOrgGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = getAuthState();

  const hasOrganization = useMemo(() => {
    return isAuthenticated && !!user?.organizationId;
  }, [isAuthenticated, user?.organizationId]);

  const checkRole = useCallback((requiredRole: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === requiredRole;
  }, [isAuthenticated, user]);

  const checkPermission = useCallback((permission: string): boolean => {
    if (!isAuthenticated || !user?.permissions) return false;
    return user.permissions.includes(permission);
  }, [isAuthenticated, user?.permissions]);

  const checkPermissions = useCallback((permissions: string[]): boolean => {
    if (!isAuthenticated || !user?.permissions) return false;
    return permissions.every(permission => user.permissions!.includes(permission));
  }, [isAuthenticated, user?.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!isAuthenticated || !user?.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
  }, [isAuthenticated, user?.permissions]);

  const redirect = useCallback((to: string = '/setup-organization') => {
    navigate(to, { replace: true });
  }, [navigate]);

  const requireOrganization = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return false;
    }
    if (!user?.organizationId) {
      redirect('/setup-organization');
      return false;
    }
    return true;
  }, [isAuthenticated, user?.organizationId, redirect, navigate]);

  const requireRole = useCallback((requiredRole: string) => {
    if (!requireOrganization()) return false;
    if (!checkRole(requiredRole)) {
      redirect('/unauthorized');
      return false;
    }
    return true;
  }, [requireOrganization, checkRole, redirect]);

  const requirePermission = useCallback((permission: string) => {
    if (!requireOrganization()) return false;
    if (!checkPermission(permission)) {
      redirect('/unauthorized');
      return false;
    }
    return true;
  }, [requireOrganization, checkPermission, redirect]);

  const requirePermissions = useCallback((permissions: string[]) => {
    if (!requireOrganization()) return false;
    if (!checkPermissions(permissions)) {
      redirect('/unauthorized');
      return false;
    }
    return true;
  }, [requireOrganization, checkPermissions, redirect]);

  return {
    isAuthenticated,
    user,
    isLoading,
    hasOrganization,
    checkRole,
    checkPermission,
    checkPermissions,
    hasAnyPermission,
    redirect,
    requireOrganization,
    requireRole,
    requirePermission,
    requirePermissions
  };
};

/**
 * Combined authentication hook
 * Provides all authentication functionality in one hook
 */
export const useAuth = () => {
  const authGuard = useAuthGuard();
  const adminGuard = useAdminGuard();
  const orgGuard = useOrgGuard();

  return {
    ...authGuard,
    admin: adminGuard,
    org: orgGuard
  };
};

export default {
  useAuthGuard,
  useAdminGuard,
  useOrgGuard,
  useAuth
};
