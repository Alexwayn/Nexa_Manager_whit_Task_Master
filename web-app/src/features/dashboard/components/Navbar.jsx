import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '@context/OptimizedThemeContext';
import LanguageSwitcher from '@components/common/LanguageSwitcher';
import { useClerk, useUser } from '@clerk/clerk-react';
import { NotificationCenter } from '@components/notifications';

export default function Navbar({ onOpenSidebar, sidebarCollapsed = false }) {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Use Clerk hooks for authentication
  const { signOut } = useClerk();
  const { user } = useUser();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation for dropdowns
  const handleDropdownKeyDown = (event, isOpen, setOpen) => {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(!isOpen);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav
      role='navigation'
      aria-label='Main navigation'
      className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full'
    >
      <div className='mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Left section */}
          <div className='flex items-center'>
            {/* Mobile menu button */}
            <button
              onClick={onOpenSidebar}
              className='lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              aria-label={t('openSidebar')}
              aria-expanded='false'
              aria-controls='sidebar'
            >
              <Bars3Icon className='h-6 w-6' aria-hidden='true' />
            </button>

            {/* Logo */}
            <Link
              to='/dashboard'
              className='flex-shrink-0 flex items-center ml-4 lg:ml-0'
              aria-label={t('goToHome')}
            >
              <img className='h-8 w-auto' src='/assets/logos/logo_nexa.png' alt={t('logoAlt')} />
              <span className='sr-only'>{t('companyName')}</span>
            </Link>
          </div>

          {/* Right section */}
          <div className='flex items-center space-x-4'>
            {/* Language Switcher */}
            <div className='hidden sm:block'>
              <LanguageSwitcher />
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className='p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
              aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
            >
              {theme === 'dark' ? (
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              ) : (
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                  />
                </svg>
              )}
            </button>

            {/* Notifications */}
            <NotificationCenter className="" />

            {/* User menu */}
            <div className='relative' ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onKeyDown={e => handleDropdownKeyDown(e, userMenuOpen, setUserMenuOpen)}
                className='flex items-center text-sm rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2'
                aria-label={t('userMenu')}
                aria-expanded={userMenuOpen}
                aria-haspopup='true'
                aria-controls='user-menu-dropdown'
              >
                {user?.imageUrl ? (
                  <img
                    className='h-8 w-8 rounded-full'
                    src={user.imageUrl}
                    alt={t('userAvatar', { name: user.firstName || 'User' })}
                  />
                ) : (
                  <UserCircleIcon className='h-8 w-8 text-gray-400' aria-hidden='true' />
                )}
                <span className='hidden sm:ml-2 sm:block text-sm font-medium text-gray-700 dark:text-gray-200'>
                  {user?.firstName || t('user')}
                </span>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <div
                  id='user-menu-dropdown'
                  role='menu'
                  aria-labelledby='user-menu-button'
                  className='origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50'
                >
                  <div className='py-1' role='none'>
                    {/* User info */}
                    <div className='px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600'>
                      <p className='font-medium'>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className='text-gray-500 dark:text-gray-400 truncate'>
                        {user?.emailAddresses?.[0]?.emailAddress}
                      </p>
                    </div>

                    {/* Menu items */}
                    <Link
                      to='/settings'
                      className='group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      role='menuitem'
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Cog6ToothIcon
                        className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                        aria-hidden='true'
                      />
                      {t('settings')}
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className='group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      role='menuitem'
                    >
                      <ArrowRightOnRectangleIcon
                        className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500'
                        aria-hidden='true'
                      />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
