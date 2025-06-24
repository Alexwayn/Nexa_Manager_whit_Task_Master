import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@components/dashboard/Sidebar';
import Navbar from '@components/dashboard/Navbar';
import { useTheme } from '@context/ThemeContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useTheme(); // Keep theme context active

  return (
    <div className='h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900'>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Navbar */}
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main content */}
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <div className='pb-6'>
            <div className='w-full px-2'>
              {/* Content area with fade-in animation */}
              <div className='animate-fade-in'>
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
