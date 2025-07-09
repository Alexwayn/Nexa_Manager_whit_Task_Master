import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  BuildingOfficeIcon,
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useOrganizationContext } from '@context/OrganizationContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Logger from '@utils/Logger';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * OrganizationSwitcher Component
 *
 * Provides organization switching functionality and organization management
 * access through a dropdown menu. Integrates with Clerk Organizations.
 */
export default function OrganizationSwitcher() {
  const {
    organization,
    organizationList,
    isLoaded,
    switchOrganization,
    isAdmin,
    getUserRole,
    hasMultipleOrganizations,
    needsOrganizationSelection,
    needsOrganizationCreation,
  } = useOrganizationContext();

  const { t, ready } = useTranslation('navigation');
  const navigate = useNavigate();

  // Safe translation function
  const safeT = (key, fallback = key) => {
    if (!ready) return fallback;
    return t(key);
  };

  const handleSwitchOrganization = async orgId => {
    try {
      await switchOrganization(orgId);
      Logger.info('OrganizationSwitcher: Successfully switched organization');
    } catch (error) {
      Logger.error('OrganizationSwitcher: Failed to switch organization', String(error?.message || error || 'Unknown error'));
    }
  };

  const handleManageOrganization = () => {
    Logger.info('OrganizationSwitcher: Opening organization management');
    navigate('/organization');
  };

  const handleCreateOrganization = () => {
    Logger.info('OrganizationSwitcher: Opening organization creation');
    navigate('/organization');
  };

  // Don't render if not loaded
  if (!isLoaded) {
    return (
      <div className='flex items-center space-x-2'>
        <div className='animate-pulse'>
          <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg'></div>
        </div>
        <div className='hidden lg:block animate-pulse'>
          <div className='h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded'></div>
        </div>
      </div>
    );
  }

  // Handle case where user needs to create or select organization
  if (needsOrganizationCreation) {
    return (
      <button
        onClick={handleCreateOrganization}
        className='flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
      >
        <PlusIcon className='h-4 w-4' />
        <span className='hidden lg:inline'>
          {safeT('organization.create', 'Create Organization')}
        </span>
      </button>
    );
  }

  if (needsOrganizationSelection) {
    return (
      <div className='flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
        <BuildingOfficeIcon className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
        <span className='text-sm text-yellow-800 dark:text-yellow-200'>
          {safeT('organization.selectRequired', 'Select Organization')}
        </span>
      </div>
    );
  }

  // Render organization switcher
  return (
    <Menu as='div' className='relative'>
      <Menu.Button className='flex items-center space-x-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors'>
        {/* Organization Icon */}
        <div className='flex-shrink-0'>
          {organization?.imageUrl ? (
            <img
              src={organization.imageUrl}
              alt={organization.name}
              className='h-6 w-6 rounded object-cover'
            />
          ) : (
            <div className='h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center'>
              <BuildingOfficeIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            </div>
          )}
        </div>

        {/* Organization Name */}
        <div className='hidden lg:flex lg:flex-col lg:items-start lg:min-w-0'>
          <span className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32'>
            {organization?.name || safeT('organization.personal', 'Personal')}
          </span>
          {getUserRole() && (
            <span className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
              {getUserRole().replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Dropdown Arrow */}
        {hasMultipleOrganizations && (
          <ChevronDownIcon className='h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0' />
        )}
      </Menu.Button>

      {/* Dropdown Menu */}
      {hasMultipleOrganizations && (
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <Menu.Items className='absolute left-0 z-10 mt-2 w-72 origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700'>
            <div className='py-1'>
              {/* Current Organization Header */}
              <div className='px-4 py-2 border-b border-gray-100 dark:border-gray-700'>
                <p className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                  {safeT('organization.current', 'Current Organization')}
                </p>
              </div>

              {/* Organization List */}
              <div className='max-h-60 overflow-y-auto'>
                {organizationList.map(orgMembership => {
                  const org = orgMembership.organization;
                  const isCurrentOrg = org.id === organization?.id;

                  return (
                    <Menu.Item key={org.id}>
                      {({ active }) => (
                        <button
                          onClick={() => !isCurrentOrg && handleSwitchOrganization(org.id)}
                          disabled={isCurrentOrg}
                          className={classNames(
                            active && !isCurrentOrg ? 'bg-gray-50 dark:bg-gray-700' : '',
                            isCurrentOrg ? 'bg-blue-50 dark:bg-blue-900/20' : '',
                            'flex w-full items-center px-4 py-3 text-sm transition-colors',
                          )}
                        >
                          {/* Organization Icon */}
                          <div className='flex-shrink-0 mr-3'>
                            {org.imageUrl ? (
                              <img
                                src={org.imageUrl}
                                alt={org.name}
                                className='h-8 w-8 rounded object-cover'
                              />
                            ) : (
                              <div className='h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center'>
                                <BuildingOfficeIcon className='h-5 w-5 text-gray-400 dark:text-gray-500' />
                              </div>
                            )}
                          </div>

                          {/* Organization Details */}
                          <div className='flex-1 min-w-0 text-left'>
                            <p
                              className={classNames(
                                isCurrentOrg
                                  ? 'text-blue-900 dark:text-blue-100 font-medium'
                                  : 'text-gray-900 dark:text-gray-100',
                                'truncate',
                              )}
                            >
                              {org.name}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                              {orgMembership.role?.replace('_', ' ')} • {org.membersCount || 0}{' '}
                              {safeT('organization.members', 'members')}
                            </p>
                          </div>

                          {/* Current Indicator */}
                          {isCurrentOrg && (
                            <div className='flex-shrink-0 ml-2'>
                              <div className='h-2 w-2 bg-blue-600 rounded-full'></div>
                            </div>
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>

              {/* Actions */}
              <div className='border-t border-gray-100 dark:border-gray-700'>
                {/* Manage Current Organization */}
                {isAdmin() && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleManageOrganization}
                        className={classNames(
                          active ? 'bg-gray-50 dark:bg-gray-700' : '',
                          'flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors',
                        )}
                      >
                        <Cog6ToothIcon className='mr-3 h-4 w-4' />
                        {safeT('organization.manage', 'Manage Organization')}
                      </button>
                    )}
                  </Menu.Item>
                )}

                {/* Create New Organization */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleCreateOrganization}
                      className={classNames(
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors',
                      )}
                    >
                      <PlusIcon className='mr-3 h-4 w-4' />
                      {safeT('organization.createNew', 'Create New Organization')}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      )}
    </Menu>
  );
}
