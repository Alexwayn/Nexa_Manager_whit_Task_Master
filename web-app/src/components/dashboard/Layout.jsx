import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '@components/dashboard/Sidebar';
import Navbar from '@components/dashboard/Navbar';
import { useTheme } from '@context/OptimizedThemeContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Default expanded state
  const { t } = useTranslation('navigation');
  useTheme(); // Keep theme context active

  // Skip links functionality - TEMPORARILY DISABLED
  useEffect(() => {
    // SKIP LINKS - Temporarily commented out (can be re-enabled later)
    /*
    const addSkipLinks = () => {
      if (document.querySelector('.skip-links')) return;
      
      const skipLinks = document.createElement('div');
      skipLinks.className = 'skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">${t('skipToMain')}</a>
        <a href="#sidebar-navigation" class="skip-link">${t('skipToNavigation')}</a>
        <a href="#sidebar" class="skip-link">${t('skipToSidebar')}</a>
      `;
      document.body.insertBefore(skipLinks, document.body.firstChild);
    };

    addSkipLinks();
    */
  }, [t]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 w-full">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      }`}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-900/80" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                  <span className="sr-only">{t('closeSidebar')}</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Sidebar onCloseSidebar={() => setSidebarOpen(false)} collapsed={false} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col w-full transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'
      }`}>
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800">
          <Navbar setSidebarOpen={setSidebarOpen} sidebarCollapsed={sidebarCollapsed} />
        </div>
        
        {/* Main Content */}
        <main className="flex-1" id="main-content" role="main" aria-label={t('mainContent')}>
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
