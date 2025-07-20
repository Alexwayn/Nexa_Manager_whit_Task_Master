import React from 'react';

const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'default', // "default" or "pills"
}) => {
  const baseClasses =
    variant === 'pills'
      ? 'flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg'
      : 'border-b border-gray-200 dark:border-gray-700';

  const navClasses =
    variant === 'pills' ? 'flex space-x-1' : '-mb-px flex space-x-8 overflow-x-auto';

  const getTabClasses = tab => {
    const isActive = activeTab === tab.id;

    if (variant === 'pills') {
      return `${
        isActive
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2`;
    }

    return `${
      isActive
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`;
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      <nav className={navClasses}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={getTabClasses(tab)}
              disabled={tab.disabled}
            >
              {Icon && <Icon className='h-4 w-4 flex-shrink-0' />}
              <span>{tab.name}</span>
              {tab.badge && (
                <span className='ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs'>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
