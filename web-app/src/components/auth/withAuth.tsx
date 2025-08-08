import React, { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';

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

interface WithAuthProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Basic authentication HOC
 * Redirects to login if user is not authenticated
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAuthProps>
): ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = getAuthState();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return (
      <WrappedComponent
        {...props}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    );
  };
}

/**
 * Admin authentication HOC
 * Requires user to be authenticated and have admin role
 */
export function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAuthProps>
): ComponentType<P> {
  return function AdminAuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = getAuthState();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />;
    }

    return (
      <WrappedComponent
        {...props}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    );
  };
}

/**
 * Organization authentication HOC
 * Requires user to be authenticated and belong to an organization
 */
export function withOrgAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAuthProps>
): ComponentType<P> {
  return function OrgAuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = getAuthState();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!user?.organizationId) {
      return <Navigate to="/setup-organization" replace />;
    }

    return (
      <WrappedComponent
        {...props}
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
      />
    );
  };
}

// Component to show when admin access is required
export const AdminRequired: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Admin Access Required
      </h2>
      <p className="text-gray-600 mb-4">
        You need administrator privileges to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

export default {
  withAuth,
  withAdminAuth,
  withOrgAuth,
  AdminRequired
};
