import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const InventorySidebar = ({ onReorder }) => {
  const { t } = useTranslation('inventory');

  // Sample data for stock warnings
  const stockWarnings = [
    {
      id: 1,
      name: '4K Monitor 27-inch',
      stock: 12,
      minStock: 15,
      type: 'critical',
      bgColor: '#FEE2E2',
      iconColor: '#DC2626',
      textColor: '#DC2626'
    },
    {
      id: 2,
      name: 'Adjustable Standing Desk',
      stock: 19,
      minStock: 20,
      type: 'warning',
      bgColor: '#FEF9C3',
      iconColor: '#CA8A04',
      textColor: '#CA8A04'
    },
    {
      id: 3,
      name: 'Wireless Mouse',
      stock: 8,
      minStock: 10,
      type: 'critical',
      bgColor: '#FEE2E2',
      iconColor: '#DC2626',
      textColor: '#DC2626'
    },
    {
      id: 4,
      name: 'USB-C Hub',
      stock: 14,
      minStock: 15,
      type: 'warning',
      bgColor: '#FEF9C3',
      iconColor: '#CA8A04',
      textColor: '#CA8A04'
    },
  ];

  return (
    <div className="w-[362px] flex flex-col gap-6">
      {/* Stock Warnings */}
      <div className="bg-white rounded-none shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('sidebar.stockWarnings', 'Stock Warnings')}
          </h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            {t('sidebar.viewAll', 'View All')}
          </button>
        </div>
        
                {stockWarnings.length > 0 ? (
          <div className="space-y-3">
            {stockWarnings.map((item) => (
            <div 
              key={item.id}
              className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
            >
              {/* Status Icon */}
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.bgColor }}
              >
                {item.type === 'critical' ? (
                  <ExclamationTriangleIcon 
                    className="w-5 h-5" 
                    style={{ color: item.iconColor }}
                  />
                ) : (
                  <ExclamationCircleIcon 
                    className="w-5 h-5" 
                    style={{ color: item.iconColor }}
                  />
                )}
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-base mb-1 truncate">
                  {item.name}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span style={{ color: item.textColor }} className="font-medium">
                    {t('sidebar.inStock', { count: item.stock, defaultValue: `${item.stock} in stock` })}
                  </span>
                  <span className="text-gray-600">
                    ({t('sidebar.min', { count: item.minStock, defaultValue: `Min: ${item.minStock}` })})
                  </span>
                </div>
              </div>
              
              {/* Reorder Button */}
              <button 
                onClick={() => onReorder && onReorder({
                  id: item.id,
                  name: item.name,
                  sku: `SKU-${item.id.toString().padStart(3, '0')}`,
                  stock: item.stock,
                  minStock: item.minStock,
                  price: 25.99, // Default price for demo
                  supplier: 'Default Supplier'
                })}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex-shrink-0 px-3 py-1 hover:bg-blue-50 rounded"
              >
                {t('sidebar.reorder', 'Reorder')}
              </button>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="font-semibold">{t('sidebar.healthyStock', 'All stock levels are healthy!')}</p>
            <p>{t('sidebar.noAttention', 'No items require immediate attention.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySidebar;