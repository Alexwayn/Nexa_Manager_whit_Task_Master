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
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import { businessService } from '@lib/businessService';
import BusinessProfileSettings from '@components/settings/BusinessProfileSettings';
import IntegrationsSettings from '@components/settings/IntegrationsSettings';
import RolesAndPermissionsSettings from '@components/settings/RolesAndPermissionsSettings';
import TaxSettings from '@components/settings/TaxSettings';
import DataExportSettings from '@components/settings/DataExportSettings';
import BillingSettings from '@components/settings/BillingSettings';
import SecuritySettings from '@components/settings/SecuritySettings';
import NotificationSettings from '@components/settings/NotificationSettings';

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

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Renders the complete tabs structure with navigation and content
  const renderTabsWithContent = () => (
    <div className='w-full'>
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        {/* Mobile Tab Navigation */}
        <div className='block lg:hidden border-b border-gray-200'>
          <Tab.List className='flex overflow-x-auto scrollbar-hide bg-gray-50'>
            {[
              { name: t('tabs.profile'), icon: UserCircleIcon },
              { name: t('tabs.security'), icon: ShieldCheckIcon },
              { name: t('tabs.notifications'), icon: BellIcon },
              { name: t('tabs.company'), icon: BuildingOfficeIcon },
              { name: t('tabs.billing'), icon: CreditCardIcon },
              { name: t('tabs.rolesPermissions'), icon: KeyIcon },
              { name: t('tabs.tax'), icon: PhotoIcon },
              { name: t('tabs.dataExport'), icon: ArrowUpTrayIcon },
              { name: t('tabs.integrations'), icon: DevicePhoneMobileIcon },
            ].map((tab, index) => (
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

        {/* Desktop Layout */}
        <div className='hidden lg:flex lg:min-h-screen'>
          {/* Sidebar Navigation */}
          <div className='w-80 bg-white border-r border-gray-200 flex-shrink-0'>
            <div className='p-6'>
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>{t('title')}</h1>
              <p className='text-gray-600 text-sm mb-8'>{t('subtitle')}</p>
              
              <Tab.List className='space-y-2'>
                {[
                  { name: t('tabs.profile'), description: t('tabs.profileDesc'), icon: UserCircleIcon },
                  { name: t('tabs.security'), description: t('tabs.securityDesc'), icon: ShieldCheckIcon },
                  { name: t('tabs.notifications'), description: t('tabs.notificationsDesc'), icon: BellIcon },
                  { name: t('tabs.company'), description: t('tabs.companyDesc'), icon: BuildingOfficeIcon },
                  { name: t('tabs.billing'), description: t('tabs.billingDesc'), icon: CreditCardIcon },
                  { name: t('tabs.rolesPermissions'), description: t('tabs.rolesPermissionsDesc'), icon: KeyIcon },
                  { name: t('tabs.tax'), description: t('tabs.taxDesc'), icon: PhotoIcon },
                  { name: t('tabs.dataExport'), description: t('tabs.dataExportDesc'), icon: ArrowUpTrayIcon },
                  { name: t('tabs.integrations'), description: t('tabs.integrationsDesc'), icon: DevicePhoneMobileIcon },
                ].map((tab, index) => (
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
          
          {/* Tab Panels */}
          <div className='flex-1'>
            <Tab.Panels className='w-full'>
              {/* Profile Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <UserProfile />
              </Tab.Panel>

              {/* Security Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <SecuritySettings />
              </Tab.Panel>

              {/* Notifications Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <NotificationSettings settings={notificationSettings} onSettingsChange={setNotificationSettings} showNotification={showNotification} />
              </Tab.Panel>

              {/* Company Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <BusinessProfileSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Billing Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <BillingSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Roles and Permissions Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <RolesAndPermissionsSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Tax Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <TaxSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Data Export Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <DataExportSettings showNotification={showNotification} />
              </Tab.Panel>

              {/* Integrations Panel */}
              <Tab.Panel className='p-6 lg:p-8 focus:outline-none'>
                <IntegrationsSettings showNotification={showNotification} />
              </Tab.Panel>
            </Tab.Panels>
          </div>
        </div>
      </Tab.Group>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto'>
        {renderTabsWithContent()}
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
