import { useEffect } from 'react';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  UsersIcon,
  StarIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/solid';
import nexaLogo from '@assets/logo_nexa.png';

export default function Register() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('login');
  
  // Get the URL from which the user was redirected (if available)
  const from = location.state?.returnTo || '/onboarding';

  // If user is already signed in, redirect to onboarding or dashboard
  if (isLoaded && isSignedIn) {
    return <Navigate to={from} replace />;
  }

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <p className='ml-3 text-blue-600'>Loading...</p>
      </div>
    );
  }

  const MarketingSection = () => (
    <div className='hidden lg:flex lg:w-3/5 bg-gradient-to-br from-indigo-50 via-white to-blue-50 items-center justify-center p-12 relative overflow-hidden'>
      {/* Subtle background shapes */}
      <div className='absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-30 -translate-x-16 -translate-y-16'></div>
      <div className='absolute bottom-0 right-0 w-72 h-72 bg-indigo-100 rounded-full opacity-30 translate-x-16 translate-y-16'></div>

      <div className='z-10 w-full max-w-2xl'>
        {/* Badge */}
        <span className='inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4'>
          {t('marketing.badge')} - Registration
        </span>

        {/* Logo Image */}
        <img src={nexaLogo} alt={t('marketing.logoAlt')} className='h-16 mb-6' />

        {/* Description for Registration */}
        <h2 className='text-3xl font-bold text-gray-900 mb-4'>
          Join thousands of successful businesses
        </h2>
        <p className='text-lg text-gray-600 mb-8'>
          Start managing your business more efficiently with our comprehensive platform.
          <span className='text-blue-600 font-semibold'>
            {' '}
            Create your account in seconds
          </span>
          {' '}and unlock powerful business management tools.
        </p>

        {/* Registration Benefits */}
        <div className='grid grid-cols-1 gap-6 mb-12'>
          <div className='flex items-center space-x-3'>
            <BuildingOfficeIcon className='h-8 w-8 text-blue-500' />
            <div>
              <p className='font-semibold text-gray-800'>Complete Business Setup</p>
              <p className='text-sm text-gray-600'>Professional profile with your company details</p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <ClipboardDocumentCheckIcon className='h-8 w-8 text-green-500' />
            <div>
              <p className='font-semibold text-gray-800'>Instant Access</p>
              <p className='text-sm text-gray-600'>Start using all features immediately after setup</p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <CheckCircleSolidIcon className='h-8 w-8 text-purple-500' />
            <div>
              <p className='font-semibold text-gray-800'>Secure & Compliant</p>
              <p className='text-sm text-gray-600'>Enterprise-grade security for your business data</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-3 gap-8 text-center opacity-80'>
          <div>
            <UsersIcon className='h-8 w-8 text-blue-500 mx-auto mb-2' />
            <p className='text-2xl font-semibold text-gray-800'>5.000+</p>
            <p className='text-sm text-gray-500'>{t('marketing.stats.users')}</p>
          </div>
          <div>
            <CheckCircleSolidIcon className='h-8 w-8 text-green-500 mx-auto mb-2' />
            <p className='text-2xl font-semibold text-gray-800'>99.9%</p>
            <p className='text-sm text-gray-500'>{t('marketing.stats.uptime')}</p>
          </div>
          <div>
            <StarIcon className='h-8 w-8 text-yellow-500 mx-auto mb-2' />
            <p className='text-2xl font-semibold text-gray-800'>4.8/5</p>
            <p className='text-sm text-gray-500'>{t('marketing.stats.reviews')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className='min-h-screen flex'>
        {/* Marketing Section - Left side on desktop */}
        <MarketingSection />

        {/* Registration Section - Right side */}
        <div className='w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white'>
          <div className='w-full max-w-md'>
            {/* Mobile Logo */}
            <div className='text-center mb-8 lg:hidden'>
              <img src={nexaLogo} alt={t('marketing.logoAlt')} className='h-12 mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-900'>Create Your Account</h1>
              <p className='text-gray-600 mt-2'>Join the business management revolution</p>
            </div>

            {/* Clerk SignUp Component */}
            <div className='flex justify-center'>
              <SignUp
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-0 w-full',
                    headerTitle: 'text-2xl font-semibold text-gray-900',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                    formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                    footerActionLink: 'text-blue-600 hover:text-blue-800',
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton',
                  },
                }}
                redirectUrl="/onboarding"
                routing="path"
                path="/register"
              />
            </div>

            {/* Additional Info */}
            <div className='mt-8 text-center'>
              <p className='text-xs text-gray-500'>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                Your business data is encrypted and secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 