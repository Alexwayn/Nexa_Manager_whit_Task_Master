import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  TagIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const QuickActions = ({ onAddItem, onManageCategories, onExportInventory, onStockAlerts }) => {
  const { t, ready } = useTranslation('inventory');

  // Safe translation function
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  const actions = [
    {
      id: 1,
      title: safeT('quickActions.addNewItem', {}, 'Add New Item'),
      icon: PlusIcon,
      gradientBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      hoverGradient: 'from-blue-100 to-blue-200',
      hoverBorder: 'border-blue-300',
      iconBg: 'bg-blue-500',
      hoverIconBg: 'bg-blue-600',
      textColor: 'text-blue-700',
      hoverTextColor: 'text-blue-800',
      onClick: onAddItem
    },
    {
      id: 2,
      title: safeT('quickActions.manageCategories', {}, 'Manage Categories'),
      icon: TagIcon,
      gradientBg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      hoverGradient: 'from-amber-100 to-amber-200',
      hoverBorder: 'border-amber-300',
      iconBg: 'bg-amber-500',
      hoverIconBg: 'bg-amber-600',
      textColor: 'text-amber-700',
      hoverTextColor: 'text-amber-800',
      onClick: onManageCategories
    },
    {
      id: 3,
      title: safeT('quickActions.exportInventory', {}, 'Export Inventory'),
      icon: DocumentArrowDownIcon,
      gradientBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      hoverGradient: 'from-purple-100 to-purple-200',
      hoverBorder: 'border-purple-300',
      iconBg: 'bg-purple-500',
      hoverIconBg: 'bg-purple-600',
      textColor: 'text-purple-700',
      hoverTextColor: 'text-purple-800',
      onClick: onExportInventory
    },
    {
      id: 4,
      title: safeT('quickActions.stockAlerts', {}, 'Stock Alerts'),
      icon: ExclamationTriangleIcon,
      gradientBg: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-200',
      hoverGradient: 'from-red-100 to-red-200',
      hoverBorder: 'border-red-300',
      iconBg: 'bg-red-500',
      hoverIconBg: 'bg-red-600',
      textColor: 'text-red-700',
      hoverTextColor: 'text-red-800',
      onClick: onStockAlerts
    }
  ];

  return (
    <div className="bg-white rounded-none shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {safeT('quickActions.title', {}, 'Quick Actions')}
        </h3>
      </div>

      {/* Action Cards */}
      <div className="p-6 flex-1 flex items-center">
        <div className="grid grid-cols-2 gap-3 w-full">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`group flex flex-col items-center p-4 ${action.gradientBg} border ${action.borderColor} rounded-xl hover:${action.hoverGradient} hover:${action.hoverBorder} transition-all duration-300 transform hover:scale-105 hover:shadow-lg min-h-[100px]`}
            >
              <div className={`${action.iconBg} p-2 rounded-lg mb-3 group-hover:${action.hoverIconBg} transition-colors duration-300`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className={`text-center text-sm font-medium leading-tight ${action.textColor} group-hover:${action.hoverTextColor}`}>{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;