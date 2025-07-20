import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const SettingsTabNavigation = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation('settings');

  const tabs = [
    { name: t('tabs.profile'), icon: UserCircleIcon },
    { name: t('tabs.security'), icon: ShieldCheckIcon },
    { name: t('tabs.notifications'), icon: BellIcon },
    { name: t('tabs.company'), icon: BuildingOfficeIcon },
    { name: t('tabs.billing'), icon: CreditCardIcon },
  ];

  return (
    <div className='lg:w-1/4'>
      <div className='bg-white rounded-lg shadow p-4 sticky top-6'>
        <nav className='space-y-1'>
          {tabs.map((tab, index) => (
            <button
              key={tab.name}
              onClick={() => onTabChange(index)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === index
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon
                className={`mr-3 h-5 w-5 ${
                  activeTab === index ? 'text-blue-500' : 'text-gray-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SettingsTabNavigation;
