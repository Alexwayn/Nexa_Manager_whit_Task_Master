import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  UserCircleIcon,
  BellIcon,
  KeyIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PhotoIcon,
  LockClosedIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth, useUser, UserProfile } from '@clerk/clerk-react';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { useTranslation } from '@hooks/useTranslation';
import Footer from '@components/shared/Footer';
import { businessService } from '@lib/businessService';
import BusinessProfileSettings from '@components/settings/BusinessProfileSettings';
import BillingSettings from '@components/settings/BillingSettings';
import SecuritySettings from '@components/settings/SecuritySettings';
import NotificationSettings from '@components/settings/NotificationSettings';
import EmailSettings from '@components/settings/EmailSettings';
import AccessibilitySettings from '@components/settings/AccessibilitySettings';
import BackupSettings from '@components/settings/BackupSettings';
import IntegrationsSettings from '@components/settings/IntegrationsSettings';
import RolesAndPermissionsSettings from '@components/settings/RolesAndPermissionsSettings';
import TaxSettings from '@components/settings/TaxSettings';
import DataExportSettings from '@components/settings/DataExportSettings';

export default function Settings() {
  const { t } = useTranslation('settings');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
  });

  // Debug logging
  useEffect(() => {
    console.log('Settings component mounted');
    console.log('isSignedIn:', isSignedIn);
    console.log('user:', user);
    console.log('activeTab:', activeTab);
    console.log('Current tab name:', tabs[activeTab]?.name);
    console.log('All tabs:', tabs.map((tab, index) => `${index}: ${tab.name}`));
  }, [isSignedIn, user, activeTab]);

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Tab configuration
  const tabs = [
    { name: t('tabs.profile'), description: t('tabs.profileDesc'), icon: UserCircleIcon },
    { name: t('tabs.security'), description: t('tabs.securityDesc'), icon: ShieldCheckIcon },
    { name: t('tabs.notifications'), description: t('tabs.notificationsDesc'), icon: BellIcon },
    { name: t('tabs.company'), description: t('tabs.companyDesc'), icon: BuildingOfficeIcon },
    { name: t('tabs.billing'), description: t('tabs.billingDesc'), icon: CreditCardIcon },
    { name: t('tabs.email'), description: t('tabDescriptions.email'), icon: EnvelopeIcon },
    { name: t('tabs.integrations'), description: t('tabs.integrationsDesc'), icon: DevicePhoneMobileIcon },
    { name: t('tabs.accessibility'), description: t('tabDescriptions.accessibility'), icon: ShieldCheckIcon },
    { name: t('tabs.backup'), description: t('tabDescriptions.backup'), icon: ArrowUpTrayIcon },
  ];

  // Panel components
  const renderPanelContent = (index) => {
    console.log('Rendering panel content for index:', index);
    
    // Fallback content per test
    const fallbackContent = (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {tabs[index]?.name} - Panel {index}
        </h2>
        <p className="text-gray-600 mb-4">
          {tabs[index]?.description}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Questo è il contenuto del pannello per "{tabs[index]?.name}". 
            Se vedi questo messaggio, significa che la struttura dei tab funziona correttamente.
          </p>
        </div>
      </div>
    );
    
    try {
      switch (index) {
        case 0: // Profile
          console.log('Rendering UserProfile');
          try {
            return (
              <div>
                <UserProfile />
              </div>
            );
          } catch (error) {
            console.error('UserProfile error:', error);
            return fallbackContent;
          }
        case 1: // Security
          console.log('Rendering SecuritySettings');
          try {
            return <SecuritySettings />;
          } catch (error) {
            console.error('SecuritySettings error:', error);
            return fallbackContent;
          }
        case 2: // Notifications
          console.log('Rendering NotificationSettings');
          try {
            return <NotificationSettings settings={notificationSettings} onSettingsChange={setNotificationSettings} showNotification={showNotification} />;
          } catch (error) {
            console.error('NotificationSettings error:', error);
            return fallbackContent;
          }
        case 3: // Company
          console.log('Rendering BusinessProfileSettings');
          try {
            return <BusinessProfileSettings showNotification={showNotification} />;
          } catch (error) {
            console.error('BusinessProfileSettings error:', error);
            return fallbackContent;
          }
        case 4: // Billing
          console.log('Rendering BillingSettings');
          try {
            return <BillingSettings showNotification={showNotification} />;
          } catch (error) {
            console.error('BillingSettings error:', error);
            return fallbackContent;
          }
        case 5: // Email
          console.log('Rendering EmailSettings');
          try {
            return <EmailSettings showNotification={showNotification} />;
          } catch (error) {
            console.error('EmailSettings error:', error);
            return fallbackContent;
          }
        case 6: // Integrations
          console.log('Rendering IntegrationsSettings');
          try {
            return <IntegrationsSettings showNotification={showNotification} />;
          } catch (error) {
            console.error('IntegrationsSettings error:', error);
            return fallbackContent;
          }
        case 7: // Accessibility
          console.log('Rendering AccessibilitySettings');
          try {
            return <AccessibilitySettings showNotification={showNotification} />;
          } catch (error) {
            console.error('AccessibilitySettings error:', error);
            return fallbackContent;
          }
        case 8: // Backup
          console.log('Rendering BackupSettings');
          try {
            return <BackupSettings showNotification={showNotification} />;
          } catch (error) {
            console.error('BackupSettings error:', error);
            return fallbackContent;
          }
        default:
          console.log('Rendering default fallback');
          return fallbackContent;
      }
    } catch (error) {
      console.error('Error rendering panel content:', error);
      return fallbackContent;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto'>
        {/* Mobile Layout */}
        <div className='block lg:hidden'>
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            {/* Mobile Tab Navigation */}
            <div className='border-b border-gray-200'>
              <Tab.List className='flex overflow-x-auto scrollbar-hide bg-gray-50'>
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    className={({ selected }) =>
                      `flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap focus:outline-none ${
                        selected
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <div className='flex items-center space-x-2'>
                      <tab.icon className='h-5 w-5' />
                      <span>{tab.name}</span>
                    </div>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Mobile Tab Panels */}
            <div className='p-4'>
              <Tab.Panels>
                {tabs.map((_, index) => (
                  <Tab.Panel key={index} className='focus:outline-none'>
                    {renderPanelContent(index)}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>

        {/* Desktop Layout */}
        <div className='hidden lg:flex lg:min-h-screen'>
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            {/* Sidebar Navigation */}
            <div className='w-80 bg-white border-r border-gray-200 flex-shrink-0'>
              <div className='p-6'>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>{t('title')}</h1>
                <p className='text-gray-600 text-sm mb-8'>{t('subtitle')}</p>
                
                <Tab.List className='space-y-2'>
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      className={({ selected }) =>
                        `w-full text-left p-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          selected
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`
                      }
                    >
                      <div className='flex items-start space-x-3'>
                        <tab.icon className={`h-5 w-5 mt-0.5 ${activeTab === index ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className='flex-1 min-w-0'>
                          <p className={`text-sm font-medium ${activeTab === index ? 'text-blue-700' : 'text-gray-900'}`}>
                            {tab.name}
                          </p>
                          <p className={`text-xs mt-1 ${activeTab === index ? 'text-blue-600' : 'text-gray-500'}`}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                    </Tab>
                  ))}
                </Tab.List>
              </div>
            </div>
            
            {/* Desktop Tab Panels */}
            <div className='flex-1'>
              <Tab.Panels className='w-full'>
                {tabs.map((_, index) => (
                  <Tab.Panel key={index} className='p-6 lg:p-8 focus:outline-none'>
                    {renderPanelContent(index)}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </div>

      {/* Notification */}
      <Transition
        show={notification.show}
        as={Fragment}
        enter='transform ease-out duration-300 transition'
        enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
        enterTo='translate-y-0 opacity-100 sm:translate-x-0'
        leave='transition ease-in duration-100'
        leaveFrom='opacity-100'
        leaveTo='opacity-0'
      >
        <div className='fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50'>
          <div className='max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden'>
            <div className='p-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  {notification.type === 'success' ? (
                    <CheckCircleIcon className='h-6 w-6 text-green-400' />
                  ) : (
                    <XCircleIcon className='h-6 w-6 text-red-400' />
                  )}
                </div>
                <div className='ml-3 w-0 flex-1 pt-0.5'>
                  <p className='text-sm font-medium text-gray-900'>{notification.message}</p>
                </div>
                <div className='ml-4 flex-shrink-0 flex'>
                  <button
                    className='bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                  >
                    <span className='sr-only'>Close</span>
                    <XMarkIcon className='h-5 w-5' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
