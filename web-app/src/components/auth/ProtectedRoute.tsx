import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  // Show loading spinner while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <p className='ml-3 text-blue-600'>Loading...</p>
      </div>
    );
  }

  // If user is not signed in, redirect to login with return URL
  if (!isSignedIn || !user) {
    return (
      <Navigate 
        to='/login' 
        state={{ returnTo: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // Check if user has completed onboarding (except when already on onboarding page)
  const hasCompletedOnboarding = user.unsafeMetadata?.onboardingComplete === true;
  const isOnOnboardingPage = location.pathname === '/onboarding';
  
  // If user hasn't completed onboarding and is not on onboarding page, redirect to onboarding
  if (!hasCompletedOnboarding && !isOnOnboardingPage) {
    return <Navigate to='/onboarding' replace />;
  }
  
  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  if (hasCompletedOnboarding && isOnOnboardingPage) {
    return <Navigate to='/dashboard' replace />;
  }

  // User is authenticated and onboarding flow is properly handled, render protected content
  return <>{children}</>;
}
