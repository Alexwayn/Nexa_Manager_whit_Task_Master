import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  CalendarDaysIcon,
  ArchiveBoxIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon, // Using this for Entrate e Spese as an example
  ChartBarIcon,
  DocumentChartBarIcon,
  QrCodeIcon,
  Cog6ToothIcon,
  MicrophoneIcon, // Added for Comando vocale
  DocumentTextIcon, // Added for Preventivi
  EnvelopeIcon, // Added for Email
  XMarkIcon,
  PresentationChartLineIcon, // Added for Advanced Analytics
  UserGroupIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  CalendarIcon,
  FolderIcon,
  CameraIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '@context/OptimizedThemeContext';
import nexaLogo from '@assets/logo_nexa.png';
import nexaLogoCollapsed from '@assets/logo_nexa_mager.png';

// Remove the separate SidebarContent function to avoid hooks order issues

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ onCloseSidebar, collapsed = false, onToggleCollapse }) {
  const { isDark } = useTheme();
  const { t, ready } = useTranslation('navigation');

  // Show loading state if translations are not ready - MUST be before other hooks/function calls
  if (!ready) {
    return (
      <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 border-r border-gray-200 dark:border-gray-700 w-64'>
        <div className='flex h-16 shrink-0 items-center justify-center'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#357AF3]'></div>
        </div>
      </div>
    );
  }

  // Define navigation data directly in the component after loading check
  const navigation = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('sidebar.clients'), href: '/clients', icon: UserGroupIcon },
    { name: t('sidebar.calendar'), href: '/calendar', icon: CalendarIcon },
    { name: t('sidebar.invoices'), href: '/invoices', icon: DocumentTextIcon },
    { name: t('sidebar.quotes'), href: '/quotes', icon: DocumentDuplicateIcon },
    { name: t('sidebar.transactions'), href: '/transactions', icon: CreditCardIcon },
    { name: t('sidebar.inventory'), href: '/inventory', icon: ArchiveBoxIcon },
    { name: t('sidebar.analytics'), href: '/analytics', icon: ChartBarIcon },
    { name: t('sidebar.reports'), href: '/reports', icon: DocumentChartBarIcon },
    { name: t('sidebar.documents'), href: '/documents', icon: FolderIcon },
    { name: t('sidebar.email'), href: '/email', icon: EnvelopeIcon },
    { name: t('sidebar.scanner'), href: '/scan', icon: CameraIcon },
    { name: t('sidebar.voice'), href: '/voice', icon: MicrophoneIcon },
  ];

  const tools = [
    { name: t('sidebar.barcodeScan'), href: '/scan', icon: QrCodeIcon },
    { name: t('sidebar.voiceCommand'), href: '/voice', icon: MicrophoneIcon },
  ];

  const settings = [{ name: t('sidebar.settings'), href: '/settings', icon: Cog6ToothIcon }];

  return (
    <div className={`flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
      collapsed ? 'px-2 pb-4 w-16' : 'px-6 pb-4 w-64'
    }`}>
      {/* Header with logo and toggle button */}
      <div className={`flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700 ${
        collapsed ? '-mx-2 px-2 justify-center' : '-mx-6 px-6 justify-between'
      }`}>
        {!collapsed && (
          <div className='flex items-center'>
            <img className='h-10 w-auto' src={nexaLogo} alt={t('sidebar.logoAlt', 'Nexa Manager')} />
          </div>
        )}
        
        {collapsed && (
          <img className='h-8 w-auto' src={nexaLogoCollapsed} alt={t('sidebar.logoAlt', 'Nexa Manager')} />
        )}

        {/* Desktop toggle button */}
        {onToggleCollapse && (
          <button
            type='button'
            className={`hidden lg:flex p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ${
              collapsed ? 'absolute top-4 right-2' : ''
            }`}
            onClick={onToggleCollapse}
          >
            <span className='sr-only'>{collapsed ? t('sidebar.expand') : t('sidebar.collapse')}</span>
            {collapsed ? (
              <ChevronDoubleRightIcon className='h-5 w-5' aria-hidden='true' />
            ) : (
              <ChevronDoubleLeftIcon className='h-5 w-5' aria-hidden='true' />
            )}
          </button>
        )}

        {/* Close button for mobile */}
        <button
          type='button'
          className='lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-300'
          onClick={onCloseSidebar}
        >
          <span className='sr-only'>{t('sidebar.close')}</span>
          <XMarkIcon className='h-6 w-6' aria-hidden='true' />
        </button>
      </div>

      <nav className='flex flex-1 flex-col'>
        <ul role='list' className='flex flex-1 flex-col gap-y-7'>
          {/* Main Navigation */}
          <li>
            <ul role='list' className='-mx-2 space-y-1'>
              {navigation.map(item => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onCloseSidebar} // Close sidebar on mobile when link is clicked
                    title={collapsed ? item.name : undefined} // Show tooltip when collapsed
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                        'group flex rounded-md p-2 text-nav-text transition-colors duration-200',
                        collapsed ? 'justify-center' : 'gap-x-3'
                      )
                    }
                  >
                    <item.icon className={classNames('h-6 w-6 shrink-0')} aria-hidden='true' />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          {/* Tools Section */}
          {!collapsed && (
            <li>
              <div className='text-xs font-semibold leading-6 text-gray-400 dark:text-gray-500 uppercase tracking-wide'>
                {t('sidebar.tools', 'Tools')}
              </div>
              <ul role='list' className='-mx-2 mt-2 space-y-1'>
                {tools.map(item => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={onCloseSidebar} // Close sidebar on mobile when link is clicked
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                          'group flex gap-x-3 rounded-md p-2 text-nav-text transition-colors duration-200',
                        )
                      }
                    >
                      <item.icon className='h-6 w-6 shrink-0' aria-hidden='true' />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          )}

          {/* Settings Section - at bottom */}
          <li className='mt-auto'>
            <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
              <ul role='list' className='-mx-2 space-y-1'>
                {settings.map(item => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={onCloseSidebar} // Close sidebar on mobile when link is clicked
                      title={collapsed ? item.name : undefined} // Show tooltip when collapsed
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                          'group flex rounded-md p-2 text-nav-text transition-colors duration-200',
                          collapsed ? 'justify-center' : 'gap-x-3'
                        )
                      }
                    >
                      <item.icon className='h-6 w-6 shrink-0' aria-hidden='true' />
                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
