import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  OrganizationProfile,
  CreateOrganization,
  useOrganization,
  useOrganizationList
} from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useOrganizationContext } from '@context/OrganizationContext';
import Layout from '@components/dashboard/Layout';
import Logger from '@utils/Logger';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Organization Management Page
 * 
 * Comprehensive organization management interface using Clerk's
 * prebuilt components with custom styling and additional features.
 */
export default function OrganizationManagement() {
  const { t, ready } = useTranslation(['common', 'navigation']);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const { organization, isLoaded } = useOrganization();
  const { organizationList } = useOrganizationList();
  const { 
    isAdmin, 
    getUserRole, 
    needsOrganizationCreation,
    needsOrganizationSelection 
  } = useOrganizationContext();

  // Safe translation function
  const safeT = (key, fallback = key) => {
    if (!ready) return fallback;
    return t(key);
  };

  // Redirect to organization creation if needed
  if (needsOrganizationCreation) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {safeT('organization.createFirst', 'Create Your First Organization')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {safeT('organization.createFirstDesc', 'Get started by creating your organization to collaborate with your team.')}
            </p>
          </div>

          {/* Clerk's Create Organization Component */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <CreateOrganization 
              routing="hash"
              afterCreateOrganizationUrl="/organization"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border-0",
                  headerTitle: "text-gray-900 dark:text-gray-100",
                  headerSubtitle: "text-gray-600 dark:text-gray-400",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                  formFieldInput: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
                  formFieldLabel: "text-gray-700 dark:text-gray-300",
                },
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Handle loading states
  if (!isLoaded) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Tab configuration
  const tabs = [
    {
      name: safeT('organization.profile', 'Profile'),
      icon: BuildingOfficeIcon,
      component: 'profile',
      adminOnly: false
    },
    {
      name: safeT('organization.members', 'Members'),
      icon: UserGroupIcon,
      component: 'members',
      adminOnly: false
    },
    {
      name: safeT('organization.settings', 'Settings'),
      icon: Cog6ToothIcon,
      component: 'settings',
      adminOnly: true
    },
    {
      name: safeT('organization.analytics', 'Analytics'),
      icon: ChartBarIcon,
      component: 'analytics',
      adminOnly: true
    }
  ];

  // Filter tabs based on user permissions
  const availableTabs = tabs.filter(tab => !tab.adminOnly || isAdmin());

  const renderTabContent = (tabComponent) => {
    const commonAppearance = {
      elements: {
        rootBox: "w-full",
        card: "bg-transparent shadow-none border-0 p-0",
        headerTitle: "text-gray-900 dark:text-gray-100 text-xl font-semibold",
        headerSubtitle: "text-gray-600 dark:text-gray-400",
        formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
        formButtonSecondary: "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300",
        formFieldInput: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
        formFieldLabel: "text-gray-700 dark:text-gray-300",
        tableHead: "bg-gray-50 dark:bg-gray-800",
        tableBody: "bg-white dark:bg-gray-900",
        tableCell: "text-gray-900 dark:text-gray-100",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        avatarBox: "border-2 border-gray-200 dark:border-gray-700",
      },
    };

    switch (tabComponent) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Organization Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4">
                {organization?.imageUrl ? (
                  <img
                    src={organization.imageUrl}
                    alt={organization.name}
                    className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {organization?.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {organization?.membersCount || 0} {safeT('organization.members', 'members')} • {safeT('navigation.organization.current', 'Current Organization')}
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                    {getUserRole()?.replace('_', ' ') || 'Member'}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization Profile Component */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <OrganizationProfile
                routing="hash"
                appearance={commonAppearance}
              />
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {safeT('organization.teamMembers', 'Team Members')}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {safeT('organization.membersDesc', 'Manage team members, roles, and permissions.')}
              </p>
            </div>
            {/* OrganizationProfile component includes member management in its Members tab */}
            <OrganizationProfile
              routing="hash"
              appearance={commonAppearance}
            />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            {/* Settings Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {safeT('organization.advancedSettings', 'Advanced Settings')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {safeT('organization.settingsDesc', 'Configure organization preferences, security settings, and integrations.')}
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  <Cog6ToothIcon className="h-6 w-6 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {safeT('organization.generalSettings', 'General Settings')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {safeT('organization.generalSettingsDesc', 'Basic organization information and preferences')}
                  </p>
                </button>

                <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  <UserGroupIcon className="h-6 w-6 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {safeT('organization.memberSettings', 'Member Settings')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {safeT('organization.memberSettingsDesc', 'Default roles and member permissions')}
                  </p>
                </button>
              </div>
            </div>

            {/* Full Organization Profile for Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <OrganizationProfile
                routing="hash"
                appearance={commonAppearance}
              />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {safeT('organization.analyticsComingSoon', 'Analytics Coming Soon')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {safeT('organization.analyticsDesc', 'Organization usage analytics and insights will be available soon.')}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {safeT('organization.management', 'Organization Management')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {safeT('organization.managementDesc', 'Manage your organization settings, members, and preferences.')}
          </p>
        </div>

        {/* Tab Navigation */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {availableTabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-md py-2.5 px-4 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75',
                    'flex items-center justify-center space-x-2',
                    selected
                      ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.5] dark:hover:bg-gray-700/[0.5]'
                  )
                }
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {availableTabs.map((tab, index) => (
              <Tab.Panel
                key={tab.name}
                className="focus:outline-none"
              >
                {renderTabContent(tab.component)}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </Layout>
  );
} 