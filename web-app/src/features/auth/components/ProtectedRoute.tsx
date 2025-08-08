import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { shouldBypassAuth } from '@/utils/env';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();

  // Check if authentication should be bypassed in development
  const bypassAuth = shouldBypassAuth();
  
  if (bypassAuth) {
    console.log('🔓 Development Mode: Authentication bypassed');
    return <>{children}</>;
  }

  // Use Clerk for authentication
  const { isSignedIn, isLoaded } = useAuth();

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // If not signed in, redirect to login page
  if (!isSignedIn) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // If signed in, render the protected content
  return <>{children}</>;
}
