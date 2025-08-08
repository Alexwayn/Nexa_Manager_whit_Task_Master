import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@hooks/useAuth';
import Logger from '@/utils/Logger';
import { useTranslation } from 'react-i18next';

import SettingsLoadingSpinner from '../components/settings/SettingsLoadingSpinner';
import SettingsTabNavigation from '../components/settings/SettingsTabNavigation';
import ProfileSection from '../components/settings/ProfileSection';
import SecuritySection from '../components/settings/SecuritySection';
import NotificationsSection from '../components/settings/NotificationsSection';
import BillingSection from '../components/settings/BillingSection';
import CompanySection from '../components/settings/CompanySection';

const SettingsRefactored = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Notification handler for child components
  const setNotification = (message, type = 'success') => {
    // This would typically integrate with a toast notification system
    Logger.info(`${type.toUpperCase()}: ${message}`);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <SettingsLoadingSpinner size='large' message='Caricamento impostazioni...' />
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Accesso richiesto</h2>
          <p className='text-gray-500'>
            Devi effettuare l&apos;accesso per visualizzare le impostazioni.
          </p>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeTab) {
      case 0:
        return (
          <LazyWrapper loadingMessage='Caricamento profilo...' loadingSize='medium'>
            <ProfileSection setNotification={setNotification} />
          </LazyWrapper>
        );
      case 1:
        return (
          <LazyWrapper loadingMessage='Caricamento sicurezza...' loadingSize='medium'>
            <SecuritySection setNotification={setNotification} />
          </LazyWrapper>
        );
      case 2:
        return (
          <LazyWrapper loadingMessage='Caricamento notifiche...' loadingSize='medium'>
            <NotificationsSection setNotification={setNotification} />
          </LazyWrapper>
        );
      case 3:
        return (
          <LazyWrapper loadingMessage='Caricamento azienda...' loadingSize='medium'>
            <CompanySection setNotification={setNotification} />
          </LazyWrapper>
        );
      case 4:
        return (
          <LazyWrapper loadingMessage='Caricamento fatturazione...' loadingSize='medium'>
            <BillingSection setNotification={setNotification} />
          </LazyWrapper>
        );
      default:
        return (
          <LazyWrapper loadingMessage='Caricamento profilo...' loadingSize='medium'>
            <ProfileSection setNotification={setNotification} />
          </LazyWrapper>
        );
    }
  };

  return (
    <ErrorBoundary
      title='Errore nelle impostazioni'
      message='Si è verificato un errore nel caricamento delle impostazioni. Riprova o ricarica la pagina.'
      showReload={true}
    >
      <PerformanceWrapper componentName='SettingsRefactored'>
        <div className='min-h-screen bg-gray-50'>
          {/* Page Header */}
          <ComponentErrorBoundary componentName='SettingsHeader'>
            <div className='bg-white border-b border-gray-200'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='py-6'>
                  <h1 className='text-3xl font-bold text-gray-900'>Impostazioni</h1>
                  <p className='mt-2 text-sm text-gray-500'>
                    Gestisci il tuo profilo, la sicurezza dell&apos;account e le preferenze
                  </p>
                </div>
              </div>
            </div>
          </ComponentErrorBoundary>

          {/* Main Content */}
          <ComponentErrorBoundary componentName='SettingsContent'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
              <div className='flex flex-col lg:flex-row gap-8'>
                {/* Left Sidebar - Tab Navigation */}
                <SettingsTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Right Content - Active Section */}
                <div className='lg:w-3/4'>
                  <div className='space-y-6'>{renderActiveSection()}</div>
                </div>
              </div>
            </div>
          </ComponentErrorBoundary>

          {/* Footer Note */}
          <ComponentErrorBoundary componentName='SettingsFooter'>
            <div className='bg-white border-t border-gray-200 mt-16'>
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
                <p className='text-xs text-gray-500 text-center'>
                  ⚡ Settings Refactored - Decomposed into reusable components with custom hooks
                </p>
              </div>
            </div>
          </ComponentErrorBoundary>
        </div>
      </PerformanceWrapper>
    </ErrorBoundary>
  );
};

export default SettingsRefactored;
