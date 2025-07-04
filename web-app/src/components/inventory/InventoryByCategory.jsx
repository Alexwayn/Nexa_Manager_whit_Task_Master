import React from 'react';
import { useTranslation } from 'react-i18next';

const InventoryByCategory = () => {
  const { t, ready } = useTranslation('inventory');

  // Safe translation function
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Sample data for categories
  const categories = [
    { 
      name: safeT('categories.furniture', {}, 'Furniture'), 
      value: 25, 
      color: 'bg-blue-500',
      percentage: 30 
    },
    { 
      name: safeT('categories.electronics', {}, 'Electronics'), 
      value: 35, 
      color: 'bg-teal-500',
      percentage: 25 
    },
    { 
      name: safeT('categories.supplies', {}, 'Supplies'), 
      value: 20, 
      color: 'bg-yellow-400',
      percentage: 20 
    },
    { 
      name: safeT('categories.accessories', {}, 'Accessories'), 
      value: 15, 
      color: 'bg-orange-400',
      percentage: 15 
    },
    { 
      name: safeT('categories.other', {}, 'Other'), 
      value: 5, 
      color: 'bg-purple-400',
      percentage: 10 
    }
  ];

  // Create simple pie chart using CSS
  const PieChart = () => {
    let cumulativePercentage = 0;
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="40"
          />
          {categories.map((category, index) => {
            const percentage = category.percentage;
            const strokeDasharray = `${(percentage / 100) * 502.4} 502.4`;
            const strokeDashoffset = -((cumulativePercentage / 100) * 502.4);
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={category.color.replace('bg-', '').replace('-500', '') === 'blue' ? '#3b82f6' : 
                        category.color.replace('bg-', '').replace('-500', '') === 'teal' ? '#14b8a6' :
                        category.color.replace('bg-', '').replace('-400', '') === 'yellow' ? '#facc15' :
                        category.color.replace('bg-', '').replace('-400', '') === 'orange' ? '#fb923c' :
                        '#a855f7'}
                strokeWidth="40"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-none shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {safeT('categories.inventoryByCategory', {}, 'Inventory by Category')}
        </h3>
      </div>

      {/* Chart */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        <PieChart />
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${category.color} rounded-full`}></div>
                <span className="text-gray-600 text-xs">{category.name}</span>
                <span className="text-gray-500 text-xs">({category.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryByCategory;