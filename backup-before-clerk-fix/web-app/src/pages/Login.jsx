import { useEffect } from 'react';
import { useAuthBypass as useAuth } from '@hooks/useClerkBypass';
import { SignIn } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  UsersIcon,
  StarIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
} from '@heroicons/react/24/solid';
import nexaLogo from '@assets/logo_nexa.png';

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('login');

  // Get the URL from which the user was redirected (if available)
  const from = location.state?.returnTo || '/dashboard';

  // If user is already signed in, redirect to intended destination
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
        <span className='inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4'>
          {t('marketing.badge')}
        </span>

        {/* Logo Image */}
        <img src={nexaLogo} alt={t('marketing.logoAlt')} className='h-16 mb-6' />

        {/* Description */}
        <p className='text-lg text-gray-600 mb-8'>
          {t('marketing.description.main')}
          <span className='text-blue-600 font-semibold'>
            {' '}
            {t('marketing.description.highlight')}
          </span>
          {t('marketing.description.main_after')}
        </p>

        {/* Stats Section */}
        <div className='grid grid-cols-3 gap-8 mb-12 text-center'>
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

        {/* Feature Icons Grid */}
        <div className='grid grid-cols-4 gap-6 opacity-60'>
          <div className='text-center'>
            <div className='bg-white rounded-lg p-3 shadow-sm mb-2'>
              <UsersIcon className='h-6 w-6 text-blue-500 mx-auto' />
            </div>
            <p className='text-xs text-gray-500'>{t('marketing.features.clients')}</p>
          </div>
          <div className='text-center'>
            <div className='bg-white rounded-lg p-3 shadow-sm mb-2'>
              <CheckCircleSolidIcon className='h-6 w-6 text-green-500 mx-auto' />
            </div>
            <p className='text-xs text-gray-500'>{t('marketing.features.invoices')}</p>
          </div>
          <div className='text-center'>
            <div className='bg-white rounded-lg p-3 shadow-sm mb-2'>
              <StarIcon className='h-6 w-6 text-yellow-500 mx-auto' />
            </div>
            <p className='text-xs text-gray-500'>{t('marketing.features.analytics')}</p>
          </div>
          <div className='text-center'>
            <div className='bg-white rounded-lg p-3 shadow-sm mb-2'>
              <UsersIcon className='h-6 w-6 text-purple-500 mx-auto' />
            </div>
            <p className='text-xs text-gray-500'>{t('marketing.features.reports')}</p>
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

        {/* Login Section - Right side */}
        <div className='w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white'>
          <div className='w-full max-w-md'>
            {/* Mobile Logo */}
            <div className='text-center mb-8 lg:hidden'>
              <img src={nexaLogo} alt={t('marketing.logoAlt')} className='h-12 mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-900'>{t('title')}</h1>
              <p className='text-gray-600 mt-2'>{t('subtitle')}</p>
            </div>

            {/* Clerk SignIn Component */}
            <div className='flex justify-center'>
              <SignIn
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
                redirectUrl={from}
                routing='path'
                path='/login'
              />
            </div>

            {/* Additional Info */}
            <div className='mt-8 text-center'>
              <p className='text-xs text-gray-500'>{t('security.notice')}</p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
