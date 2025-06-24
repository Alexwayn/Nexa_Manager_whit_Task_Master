import { useTranslation } from 'react-i18next';

export default function StatCard({
  title,
  value,
  color = 'blue',
  progress = null,
  icon: Icon = null,
}) {
  const { t } = useTranslation('common');
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400',
  };

  const progressColorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center">
          {Icon && (
            <div className={`flex-shrink-0 p-3 rounded-md ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className={Icon ? 'ml-5 w-0 flex-1' : 'w-full'}>
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">{value}</dd>
            </dl>
          </div>
        </div>
        {progress !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{t('statCard.progress')}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${progressColorClasses[color]}`}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
