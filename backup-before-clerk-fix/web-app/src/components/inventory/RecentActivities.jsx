import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

const RecentActivities = () => {
  const { t, ready } = useTranslation('inventory');

  // Safe translation function
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  const activities = [
    {
      id: 1,
      type: 'stock_adjustment',
      icon: ArrowPathIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: safeT('activities.stockAdjustment', {}, 'Stock Adjustment'),
      product: '27" Monitor',
      time: safeT('activities.minutesAgo', { count: 10 }, '10 minutes ago'),
      detail: '+5 units',
    },
    {
      id: 2,
      type: 'new_item',
      icon: PlusIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: safeT('activities.newItemAdded', {}, 'New Item Added'),
      product: 'Wireless Earbuds',
      time: safeT('activities.hoursAgo', { count: 2 }, '2 hours ago'),
      detail: 'Initial stock: 25',
    },
    {
      id: 3,
      type: 'reorder',
      icon: ShoppingCartIcon,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      title: safeT('activities.itemReordered', {}, 'Item Reordered'),
      product: 'Ink Cartridges',
      time: safeT('activities.hoursAgo', { count: 4 }, '4 hours ago'),
      detail: 'Order placed: 20 units',
    },
    {
      id: 4,
      type: 'stock_adjustment',
      icon: ArrowPathIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-red-600',
      title: safeT('activities.stockAdjustment', {}, 'Stock Adjustment'),
      product: 'Notebook Set',
      time: safeT('activities.yesterday', {}, 'Yesterday'),
      detail: '-10 units',
    },
  ];

  return (
    <div className='bg-white rounded-none shadow-sm h-full flex flex-col'>
      {/* Header */}
      <div className='flex justify-between items-center px-6 pt-6 pb-6 border-b border-gray-200'>
        <h3 className='text-lg font-semibold text-gray-900'>
          {safeT('activities.recentActivities', {}, 'Recent Activities')}
        </h3>
        <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
          {safeT('activities.viewAll', {}, 'View All')}
        </button>
      </div>

      {/* Activities List */}
      <div className='px-6 pb-6 flex-1'>
        <div className='space-y-3'>
          {activities.slice(0, 4).map(activity => (
            <div key={activity.id} className='flex items-center space-x-3'>
              <div className={`${activity.iconBg} rounded-lg p-1.5`}>
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>{activity.title}</p>
                <p className='text-xs text-gray-500 truncate'>
                  {activity.product} • {activity.detail}
                </p>
              </div>
              <span className='text-xs text-gray-400 whitespace-nowrap'>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;
