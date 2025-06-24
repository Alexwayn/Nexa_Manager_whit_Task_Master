import { Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ViewModeToggle({ viewMode, onViewModeChange, className = '' }) {
  const { t } = useTranslation('common');
  const modes = [
    { id: 'grid', icon: Squares2X2Icon, label: t('viewMode.grid') },
    { id: 'table', icon: TableCellsIcon, label: t('viewMode.table') },
  ];

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      {modes.map((mode, index) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;
        const isFirst = index === 0;
        const isLast = index === modes.length - 1;

        return (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            className={`
              relative inline-flex items-center px-3 py-2 text-sm font-medium border
              focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors duration-200
              ${isFirst ? 'rounded-l-md' : ''}
              ${isLast ? 'rounded-r-md' : ''}
              ${!isFirst && !isLast ? '' : ''}
              ${!isFirst ? '-ml-px' : ''}
              ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 z-10'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            title={t('viewMode.viewAs', { mode: mode.label.toLowerCase() })}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-2 hidden sm:block">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
