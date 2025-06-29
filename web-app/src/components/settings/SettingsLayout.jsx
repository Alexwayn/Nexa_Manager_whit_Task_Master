import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  UserCircleIcon,
  BellIcon,
  KeyIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  CogIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import setting modules
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
// import NotificationSettings from './NotificationSettings';
// import CompanySettings from './CompanySettings';
// import BillingSettings from './BillingSettings';
// import EmailSettings from './EmailSettings';
import IntegrationsSettings from './IntegrationsSettings';
import BackupSettings from './BackupSettings';
import AccessibilitySettings from './AccessibilitySettings';
import CompanySettingsFallback from './CompanySettingsFallback';
import BillingSettingsFallback from './BillingSettingsFallback';
import EmailSettingsFallback from './EmailSettingsFallback';
import NotificationSettingsFallback from './NotificationSettingsFallback';

export default function SettingsLayout() {
  const { t } = useTranslation('settings');
  const { shouldShowLoading, shouldShowAuth, isAuthenticated } = useClerkAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Settings tabs configuration
  const tabs = [
    { 
      name: t('tabs.profile'), 
      icon: UserCircleIcon, 
      component: ProfileSettings,
      description: t('tabDescriptions.profile', 'Manage your personal information and preferences')
    },
    { 
      name: t('tabs.security'), 
      icon: ShieldCheckIcon, 
      component: SecuritySettings,
      description: t('tabDescriptions.security', 'Configure account security and access controls')
    },
    { 
      name: t('tabs.notifications'), 
      icon: BellIcon, 
      component: NotificationSettingsFallback,
      description: t('tabDescriptions.notifications', 'Set up your notification preferences')
    },
    { 
      name: t('tabs.company'), 
      icon: BuildingOfficeIcon, 
      component: CompanySettingsFallback,
      description: t('tabDescriptions.company', 'Manage company information and branding')
    },
    { 
      name: t('tabs.billing'), 
      icon: CreditCardIcon, 
      component: BillingSettingsFallback,
      description: t('tabDescriptions.billing', 'Configure billing and invoice settings')
    },
    { 
      name: t('tabs.email'), 
      icon: EnvelopeIcon, 
      component: EmailSettingsFallback,
      description: t('tabDescriptions.email', 'Manage email templates and settings')
    },
    { 
      name: t('tabs.integrations'), 
      icon: CogIcon, 
      component: IntegrationsSettings,
      description: t('tabDescriptions.integrations', 'Connect and manage third-party services')
    },
    { 
      name: t('tabs.accessibility'), 
      icon: EyeIcon, 
      component: AccessibilitySettings,
      description: t('tabDescriptions.accessibility', 'Monitor and improve accessibility compliance')
    },
    { 
      name: t('tabs.backup'), 
      icon: DocumentArrowDownIcon, 
      component: BackupSettings,
      description: t('tabDescriptions.backup', 'Backup and restore your data')
    },
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  // renderContent function removed - using tabs array approach instead

  // Show loading while authentication is initializing
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg text-gray-600">
            {t('common.loading', 'Loading...')}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Initializing authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (shouldShowAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('common.pleaseSignIn', 'Please sign in to access settings')}
          </h2>
          <p className="text-gray-600">
            Please ensure you are logged in to access the settings page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-lg text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-6 p-4 rounded-md ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            {/* Mobile Tab Navigation */}
            <div className="block lg:hidden border-b border-gray-200">
              <Tab.List className="flex overflow-x-auto scrollbar-hide bg-gray-50">
                {tabs.map((tab, idx) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      `flex-shrink-0 px-4 py-3 text-sm font-medium focus:outline-none transition-all duration-200 ${
                        selected
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                          : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </div>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="hidden lg:flex">
              <div className="w-64 bg-gray-50 p-6 border-r border-gray-200">
                <Tab.List className="flex flex-col space-y-2">
                  {tabs.map((tab, idx) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        `w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          selected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <tab.icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{tab.name}</div>
                          <div className="text-xs opacity-75 mt-1">{tab.description}</div>
                        </div>
                      </div>
                    </Tab>
                  ))}
                </Tab.List>
              </div>

              {/* Desktop Content Area */}
              <div className="flex-1">
                <Tab.Panels>
                  {tabs.map((tab, idx) => {
                    const TabComponent = tab.component;
                    return (
                      <Tab.Panel
                        key={idx}
                        className="p-6 focus:outline-none"
                      >
                        <TabComponent showNotification={showNotification} />
                      </Tab.Panel>
                    );
                  })}
                </Tab.Panels>
              </div>
            </div>

            {/* Mobile Content Area */}
            <div className="block lg:hidden">
              <Tab.Panels>
                {tabs.map((tab, idx) => {
                  const TabComponent = tab.component;
                  return (
                    <Tab.Panel
                      key={idx}
                      className="p-4 focus:outline-none"
                    >
                      <TabComponent showNotification={showNotification} />
                    </Tab.Panel>
                  );
                })}
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </div>
      <Footer />
    </div>
  );
} 