import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Check if we're in development mode without Clerk
const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const shouldBypassClerk = isDevelopment && isLocalhost;

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  // If we're in development mode, bypass authentication completely
  if (shouldBypassClerk) {
    console.log('🚧 ProtectedRoute: Bypassing authentication in development mode');
    return <>{children}</>;
  }

  // Production mode with Clerk
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not signed in, redirect to sign-in page
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If signed in, render the protected content
  return <>{children}</>;
}
