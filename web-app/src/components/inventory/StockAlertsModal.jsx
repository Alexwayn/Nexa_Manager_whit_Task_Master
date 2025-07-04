import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ArchiveBoxIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const StockAlertsModal = ({ isOpen, onClose, inventoryData }) => {
  const { t } = useTranslation('inventory');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'critical', 'low', 'out'

  // Safe translation function with fallback
  const safeT = (key, options = {}, fallback = '') => {
    try {
      const result = t(key, options);
      return result !== key ? result : fallback;
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`);
      return fallback;
    }
  };

  // Calculate stock alerts
  const getStockAlerts = () => {
    if (!inventoryData) return [];
    
    return inventoryData.map(item => {
      const stockLevel = item.stock;
      const minStock = item.minStock || 10;
      const criticalLevel = Math.floor(minStock * 0.5);
      
      let alertType = 'normal';
      let alertMessage = '';
      let priority = 0;
      
      if (stockLevel === 0) {
        alertType = 'out';
        alertMessage = safeT('modals.stockAlerts.messages.outOfStock', {}, 'Out of stock');
        priority = 3;
      } else if (stockLevel <= criticalLevel) {
        alertType = 'critical';
        alertMessage = safeT('modals.stockAlerts.messages.critical', {}, 'Critical stock level');
        priority = 2;
      } else if (stockLevel <= minStock) {
        alertType = 'low';
        alertMessage = safeT('modals.stockAlerts.messages.low', {}, 'Low stock');
        priority = 1;
      }
      
      return {
        ...item,
        alertType,
        alertMessage,
        priority,
        minStock,
        criticalLevel
      };
    }).filter(item => item.priority > 0).sort((a, b) => b.priority - a.priority);
  };

  const stockAlerts = getStockAlerts();
  
  const filteredAlerts = stockAlerts.filter(item => {
    if (filter === 'all') return true;
    return item.alertType === filter;
  });

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'out': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'out': return XCircleIcon;
      case 'critical': return ExclamationTriangleIcon;
      case 'low': return ExclamationTriangleIcon;
      default: return CheckCircleIcon;
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredAlerts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAlerts.map(item => item.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      alert(safeT('modals.stockAlerts.messages.selectItemsFirst', {}, 'Please select items first.'));
      return;
    }

    switch (action) {
      case 'reorder':
        alert(safeT('modals.stockAlerts.messages.reorderCreated', {count: selectedItems.length}, `Reorder request created for ${selectedItems.length} items.`));
        break;
      case 'update':
        alert(safeT('modals.stockAlerts.messages.stockUpdateOpened', {count: selectedItems.length}, `Stock update form opened for ${selectedItems.length} items.`));
        break;
      case 'notify':
        alert(safeT('modals.stockAlerts.messages.notificationsSent', {count: selectedItems.length}, `Notifications sent for ${selectedItems.length} items.`));
        break;
    }
    
    setSelectedItems([]);
  };

  const alertCounts = {
    all: stockAlerts.length,
    out: stockAlerts.filter(item => item.alertType === 'out').length,
    critical: stockAlerts.filter(item => item.alertType === 'critical').length,
    low: stockAlerts.filter(item => item.alertType === 'low').length
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">{safeT('common.close', {}, 'Close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-6 flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mr-2" />
                      {safeT('modals.stockAlerts.title', {count: stockAlerts.length}, `Stock Alerts (${stockAlerts.length} items need attention)`)}
                    </Dialog.Title>

                    {stockAlerts.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{safeT('modals.stockAlerts.emptyState.title', {}, 'All stock levels are healthy!')}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {safeT('modals.stockAlerts.emptyState.description', {}, 'No items require immediate attention.')}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Filter Tabs */}
                        <div className="mb-6">
                          <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                              {[
                                { key: 'all', label: safeT('modals.stockAlerts.filters.all', {}, 'All Alerts'), count: alertCounts.all },
                                { key: 'out', label: safeT('modals.stockAlerts.filters.outOfStock', {}, 'Out of Stock'), count: alertCounts.out },
                                { key: 'critical', label: safeT('modals.stockAlerts.filters.critical', {}, 'Critical'), count: alertCounts.critical },
                                { key: 'low', label: safeT('modals.stockAlerts.filters.lowStock', {}, 'Low Stock'), count: alertCounts.low }
                              ].map(tab => (
                                <button
                                  key={tab.key}
                                  onClick={() => setFilter(tab.key)}
                                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                    filter === tab.key
                                      ? 'border-blue-500 text-blue-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                                >
                                  {tab.label}
                                  {tab.count > 0 && (
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                      filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {tab.count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </nav>
                          </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedItems.length > 0 && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-900">
                                {safeT('modals.stockAlerts.bulkActions.itemsSelected', {count: selectedItems.length}, `${selectedItems.length} items selected`)}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleBulkAction('reorder')}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                  {safeT('modals.stockAlerts.bulkActions.createReorder', {}, 'Create Reorder')}
                                </button>
                                <button
                                  onClick={() => handleBulkAction('update')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                >
                                  {safeT('modals.stockAlerts.bulkActions.updateStock', {}, 'Update Stock')}
                                </button>
                                <button
                                  onClick={() => handleBulkAction('notify')}
                                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                                >
                                  {safeT('modals.stockAlerts.bulkActions.sendNotifications', {}, 'Send Notifications')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Alerts Table */}
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedItems.length === filteredAlerts.length && filteredAlerts.length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label className="ml-3 text-sm font-medium text-gray-700">
                                {safeT('modals.stockAlerts.table.selectAll', {count: filteredAlerts.length}, `Select All (${filteredAlerts.length})`)}
                              </label>
                            </div>
                          </div>
                          
                          <ul className="divide-y divide-gray-200">
                            {filteredAlerts.map((item) => {
                              const AlertIcon = getAlertIcon(item.alertType);
                              return (
                                <li key={item.id} className="px-4 py-4 hover:bg-gray-50">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedItems.includes(item.id)}
                                      onChange={() => handleSelectItem(item.id)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="ml-4 flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className={`flex-shrink-0 p-2 rounded-lg border ${getAlertColor(item.alertType)}`}>
                                            <AlertIcon className="h-5 w-5" />
                                          </div>
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-6">
                                          <div className="text-center">
                                            <div className="text-sm font-medium text-gray-900 flex items-center">
                                              <ArchiveBoxIcon className="h-4 w-4 mr-1 text-gray-400" />
                                              {item.stock}
                                            </div>
                                            <div className="text-xs text-gray-500">{safeT('modals.stockAlerts.table.current', {}, 'Current')}</div>
                                          </div>
                                          
                                          <div className="text-center">
                                            <div className="text-sm font-medium text-gray-900">{item.minStock}</div>
                                            <div className="text-xs text-gray-500">{safeT('modals.stockAlerts.table.minimum', {}, 'Minimum')}</div>
                                          </div>
                                          
                                          <div className="text-center">
                                            <div className="flex items-center">
                                              <TagIcon className="h-4 w-4 mr-1 text-gray-400" />
                                              <span className="text-sm text-gray-900">{item.category}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{safeT('modals.stockAlerts.table.category', {}, 'Category')}</div>
                                          </div>
                                          
                                          <div className="text-center">
                                            <div className="flex items-center">
                                              <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                              <span className="text-sm text-gray-900">{item.location}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{safeT('modals.stockAlerts.table.location', {}, 'Location')}</div>
                                          </div>
                                          
                                          <div className="text-center">
                                            <div className="flex items-center">
                                              <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                              <span className="text-sm text-gray-900">{item.lastUpdated}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">{safeT('modals.stockAlerts.table.lastUpdated', {}, 'Last Updated')}</div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          item.alertType === 'out' ? 'bg-red-100 text-red-800' :
                                          item.alertType === 'critical' ? 'bg-orange-100 text-orange-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {item.alertMessage}
                                        </span>
                                        {item.alertType === 'out' && (
                                          <span className="ml-2 text-xs text-red-600 font-medium">
                                            {safeT('modals.stockAlerts.messages.immediateAction', {}, 'Immediate action required!')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {filteredAlerts.length === 0 && (
                          <div className="text-center py-8">
                            <CheckCircleIcon className="mx-auto h-8 w-8 text-green-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              {safeT('modals.stockAlerts.emptyFilter', {filter: filter === 'all' ? '' : filter}, `No ${filter === 'all' ? '' : filter} stock alerts in this category.`)}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {safeT('modals.stockAlerts.buttons.close', {}, 'Close')}
                      </button>
                      {stockAlerts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            alert(safeT('modals.stockAlerts.messages.generatingReport', {}, 'Generating stock alerts report...'));
                            onClose();
                          }}
                          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {safeT('modals.stockAlerts.buttons.generateReport', {}, 'Generate Report')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default StockAlertsModal;