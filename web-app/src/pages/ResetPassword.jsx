import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function ResetPassword() {
  const { t } = useTranslation('login');
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already signed in, redirect to dashboard
    if (isSignedIn) {
      navigate('/dashboard');
      return;
    }

    // Redirect to login after a short delay to show the message
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSignedIn, navigate]);

  return (
    <ErrorBoundary>
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
            <InformationCircleIcon className='h-6 w-6 text-blue-600' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>Password Reset</h2>
          <p className='text-gray-600 mb-6'>
            Password resets are now handled through our secure login page. You'll be redirected
            automatically.
          </p>
          <p className='text-sm text-gray-500 mb-6'>
            Use the "Forgot password?" link on the login page to reset your password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className='w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Go to Login
          </button>
          <div className='mt-4'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
            <p className='text-xs text-gray-400 mt-2'>Redirecting in 5 seconds...</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
