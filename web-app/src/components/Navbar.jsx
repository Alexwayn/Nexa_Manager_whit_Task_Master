import React, { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  BellIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ onOpenSidebar }) {
  const { user, logout, authError, recoverSession, userAvatar, updateUserAvatar } = useAuth();
  const { setLightTheme, setDarkTheme, setAutoTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const { t, ready } = useTranslation('navigation');
  const [profilePicture, setProfilePicture] = useState('/assets/profile.jpg');

  // Use avatar from context and update local state
  useEffect(() => {
    if (userAvatar) {
      setProfilePicture(userAvatar);
    } else if (user?.id) {
      // If there's no userAvatar but user is authenticated, try to fetch it
      updateUserAvatar(true);
    }
  }, [userAvatar, user, updateUserAvatar]);

  // Handle auth errors by attempting to recover the session
  useEffect(() => {
    if (authError && authError.message && authError.message.includes('Invalid Refresh Token')) {
      Logger.warn(safeT('log.sessionRecoveryAttempt', 'Attempting session recovery'));
      const attemptRecovery = async () => {
        const recovered = await recoverSession();
        if (!recovered) {
          Logger.warn(safeT('log.sessionRecoveryFailed', 'Session recovery failed'));
          navigate('/login');
        } else {
          Logger.info(safeT('log.sessionRecovered', 'Session recovered'));
        }
      };

      attemptRecovery();
    }
  }, [authError, recoverSession, navigate, ready]);

  // Force avatar update when window becomes visible (e.g. after tab change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        // Force avatar update when page becomes visible
        updateUserAvatar(true);
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateUserAvatar]);

  // Update avatar every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        if (user?.id) {
          updateUserAvatar(true);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(intervalId);
  }, [user, updateUserAvatar]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      Logger.error(safeT('log.logoutError', 'Logout error'), error.message);
    }
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  // Safe translation function that handles loading state
  const safeT = (key, fallback = key) => {
    if (!ready) return fallback;
    return t(key);
  };

  const userNavigation = [
    { name: safeT('user.profile', 'Profile'), href: '/settings', onClick: () => navigate('/settings') },
    { name: safeT('user.settings', 'Settings'), href: '/settings', onClick: () => navigate('/settings') },
  ];

  const themeOptions = [
    { name: safeT('theme.light', 'Light'), value: 'light', icon: SunIcon, onClick: setLightTheme },
    { name: safeT('theme.dark', 'Dark'), value: 'dark', icon: MoonIcon, onClick: setDarkTheme },
    { name: safeT('theme.auto', 'Auto'), value: 'auto', icon: ComputerDesktopIcon, onClick: setAutoTheme },
  ];

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
              onClick={onOpenSidebar}
            >
              <span className="sr-only">{safeT('openSidebar', 'Open sidebar')}</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-2.5 p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
                <span className="sr-only">{safeT('changeTheme', 'Change theme')}</span>
                {isDark ? (
                  <MoonIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <SunIcon className="h-6 w-6" aria-hidden="true" />
                )}
              </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {themeOptions.map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={option.onClick}
                          className={classNames(
                            active ? 'bg-gray-100 dark:bg-gray-700' : '',
                            'flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                          )}
                        >
                          <option.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                          {option.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
            </Menu>

            {/* Help button */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <span className="sr-only">{safeT('help', 'Help')}</span>
              <QuestionMarkCircleIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Settings button */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              onClick={navigateToSettings}
            >
              <span className="sr-only">{safeT('settings', 'Settings')}</span>
              <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Notifications button */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <span className="sr-only">{safeT('notifications', 'Notifications')}</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div
              className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700"
              aria-hidden="true"
            />

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">{safeT('openUserMenu', 'Open user menu')}</span>
                <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-full w-full text-gray-300 dark:text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </span>
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
                    aria-hidden="true"
                  >
                    {user?.email || safeT('defaultUser', 'User')}
                  </span>
                  <ChevronDownIcon
                    className="ml-2 h-5 w-5 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                  />
                </span>
              </Menu.Button>
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-700/5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            item.onClick();
                          }}
                          className={classNames(
                            active ? 'bg-gray-50 dark:bg-gray-700' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100',
                          )}
                        >
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={classNames(
                          active ? 'bg-red-50 dark:bg-red-900/20' : '',
                          'block w-full text-left px-3 py-1 text-sm leading-6 text-red-700 dark:text-red-400',
                        )}
                      >
                        {safeT('logout', 'Logout')}
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
}
