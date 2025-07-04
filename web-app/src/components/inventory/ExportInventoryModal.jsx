import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  DocumentIcon,
  CheckIcon,
  CalendarIcon,
  FunnelIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const ExportInventoryModal = ({ isOpen, onClose, inventoryData }) => {
  const { t, ready } = useTranslation('inventory');
  
  const safeT = (key, options = {}, fallback = '') => {
    if (!ready) return fallback;
    try {
      return t(key, options) || fallback;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return fallback;
    }
  };
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFields, setExportFields] = useState({
    name: true,
    sku: true,
    category: true,
    stock: true,
    minStock: true,
    price: true,
    location: true,
    supplier: true,
    lastUpdated: true,
    description: false,
    image: false
  });
  const [filters, setFilters] = useState({
    category: 'all',
    stockLevel: 'all',
    location: 'all',
    dateRange: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'csv',
      name: safeT('modals.exportInventory.formats.csv.name', {}, 'CSV'),
      description: safeT('modals.exportInventory.formats.csv.description', {}, 'Comma-separated values for spreadsheets'),
      icon: TableCellsIcon,
      extension: '.csv'
    },
    {
      id: 'excel',
      name: safeT('modals.exportInventory.formats.excel.name', {}, 'Excel'),
      description: safeT('modals.exportInventory.formats.excel.description', {}, 'Microsoft Excel format with formatting'),
      icon: DocumentIcon,
      extension: '.xlsx'
    },
    {
      id: 'pdf',
      name: safeT('modals.exportInventory.formats.pdf.name', {}, 'PDF'),
      description: safeT('modals.exportInventory.formats.pdf.description', {}, 'Formatted report for printing'),
      icon: DocumentTextIcon,
      extension: '.pdf'
    },
    {
      id: 'json',
      name: safeT('modals.exportInventory.formats.json.name', {}, 'JSON'),
      description: safeT('modals.exportInventory.formats.json.description', {}, 'Raw data for system integration'),
      icon: Cog6ToothIcon,
      extension: '.json'
    }
  ];

  const availableFields = [
    { key: 'name', label: safeT('modals.exportInventory.availableFields.name', {}, 'Product Name'), required: true },
    { key: 'sku', label: safeT('modals.exportInventory.availableFields.sku', {}, 'SKU'), required: true },
    { key: 'category', label: safeT('modals.exportInventory.availableFields.category', {}, 'Category'), required: false },
    { key: 'stock', label: safeT('modals.exportInventory.availableFields.stock', {}, 'Current Stock'), required: false },
    { key: 'minStock', label: safeT('modals.exportInventory.availableFields.minStock', {}, 'Minimum Stock'), required: false },
    { key: 'price', label: safeT('modals.exportInventory.availableFields.price', {}, 'Price'), required: false },
    { key: 'location', label: safeT('modals.exportInventory.availableFields.location', {}, 'Location'), required: false },
    { key: 'supplier', label: safeT('modals.exportInventory.availableFields.supplier', {}, 'Supplier'), required: false },
    { key: 'lastUpdated', label: safeT('modals.exportInventory.availableFields.lastUpdated', {}, 'Last Updated'), required: false },
    { key: 'description', label: safeT('modals.exportInventory.availableFields.description', {}, 'Description'), required: false },
    { key: 'image', label: safeT('modals.exportInventory.availableFields.image', {}, 'Image URL'), required: false }
  ];

  const getFilteredData = () => {
    if (!inventoryData) return [];
    
    return inventoryData.filter(item => {
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      
      // Stock level filter
      if (filters.stockLevel !== 'all') {
        const minStock = item.minStock || 10;
        switch (filters.stockLevel) {
          case 'out':
            if (item.stock > 0) return false;
            break;
          case 'low':
            if (item.stock > minStock) return false;
            break;
          case 'normal':
            if (item.stock <= minStock) return false;
            break;
        }
      }
      
      // Location filter
      if (filters.location !== 'all' && item.location !== filters.location) {
        return false;
      }
      
      return true;
    });
  };

  const getUniqueValues = (field) => {
    if (!inventoryData) return [];
    return [...new Set(inventoryData.map(item => item[field]).filter(Boolean))];
  };

  const handleFieldToggle = (fieldKey) => {
    const field = availableFields.find(f => f.key === fieldKey);
    if (field?.required) return; // Don't allow toggling required fields
    
    setExportFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleSelectAllFields = () => {
    const allSelected = availableFields.every(field => exportFields[field.key]);
    const newState = {};
    availableFields.forEach(field => {
      newState[field.key] = !allSelected;
    });
    setExportFields(newState);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredData = getFilteredData();
      const selectedFields = Object.keys(exportFields).filter(key => exportFields[key]);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const format = exportFormats.find(f => f.id === exportFormat);
      const fileName = `inventory_export_${new Date().toISOString().split('T')[0]}${format.extension}`;
      
      // In a real implementation, you would generate and download the actual file
      alert(safeT('modals.exportInventory.messages.exportCompleted', { fileName, formatName: format.name, recordCount: filteredData.length, fieldCount: selectedFields.length }, `Export completed!\n\nFile: ${fileName}\nFormat: ${format.name}\nRecords: ${filteredData.length}\nFields: ${selectedFields.length}`));
      
      onClose();
    } catch (error) {
      alert(safeT('modals.exportInventory.messages.exportFailed', {}, 'Export failed. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  const filteredData = getFilteredData();
  const selectedFieldsCount = Object.values(exportFields).filter(Boolean).length;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                      <DocumentArrowDownIcon className="h-6 w-6 text-blue-500 mr-2" />
                      {safeT('modals.exportInventory.title', {}, 'Export Inventory Data')}
                    </Dialog.Title>

                    <div className="space-y-6">
                      {/* Export Format Selection */}
                      <div>
                        <label className="text-base font-medium text-gray-900">{safeT('modals.exportInventory.fields.format', {}, 'Export Format')}</label>
                        <p className="text-sm leading-5 text-gray-500">{safeT('modals.exportInventory.fields.formatDesc', {}, 'Choose the format for your exported data')}</p>
                        <fieldset className="mt-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {exportFormats.map((format) => {
                              const Icon = format.icon;
                              return (
                                <label
                                  key={format.id}
                                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                                    exportFormat === format.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="export-format"
                                    value={format.id}
                                    checked={exportFormat === format.id}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="sr-only"
                                  />
                                  <div className="flex flex-1">
                                    <div className="flex flex-col">
                                      <div className="flex items-center">
                                        <Icon className="h-5 w-5 text-gray-400 mr-2" />
                                        <span className="block text-sm font-medium text-gray-900">
                                          {format.name}
                                        </span>
                                      </div>
                                      <span className="mt-1 flex items-center text-sm text-gray-500">
                                        {format.description}
                                      </span>
                                    </div>
                                  </div>
                                  {exportFormat === format.id && (
                                    <CheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      </div>

                      {/* Data Filters */}
                      <div>
                        <label className="text-base font-medium text-gray-900 flex items-center">
                          <FunnelIcon className="h-5 w-5 mr-2" />
                          {safeT('modals.exportInventory.dataFilters.title', {}, 'Data Filters')}
                        </label>
                        <p className="text-sm leading-5 text-gray-500">{safeT('modals.exportInventory.dataFilters.description', {}, 'Filter which data to include in the export')}</p>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{safeT('modals.exportInventory.dataFilters.category', {}, 'Category')}</label>
                            <select
                              value={filters.category}
                              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="all">{safeT('modals.exportInventory.dataFilters.allCategories', {}, 'All Categories')}</option>
                              {getUniqueValues('category').map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{safeT('modals.exportInventory.dataFilters.stockLevel', {}, 'Stock Level')}</label>
                            <select
                              value={filters.stockLevel}
                              onChange={(e) => setFilters(prev => ({ ...prev, stockLevel: e.target.value }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="all">{safeT('modals.exportInventory.dataFilters.allStockLevels', {}, 'All Stock Levels')}</option>
                              <option value="out">{safeT('modals.exportInventory.dataFilters.outOfStock', {}, 'Out of Stock')}</option>
                              <option value="low">{safeT('modals.exportInventory.dataFilters.lowStock', {}, 'Low Stock')}</option>
                              <option value="normal">{safeT('modals.exportInventory.dataFilters.normalStock', {}, 'Normal Stock')}</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{safeT('modals.exportInventory.dataFilters.location', {}, 'Location')}</label>
                            <select
                              value={filters.location}
                              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="all">{safeT('modals.exportInventory.dataFilters.allLocations', {}, 'All Locations')}</option>
                              {getUniqueValues('location').map(location => (
                                <option key={location} value={location}>{location}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{safeT('modals.exportInventory.dataFilters.dateRange', {}, 'Date Range')}</label>
                            <select
                              value={filters.dateRange}
                              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="all">{safeT('modals.exportInventory.dataFilters.allTime', {}, 'All Time')}</option>
                              <option value="today">{safeT('modals.exportInventory.dataFilters.today', {}, 'Today')}</option>
                              <option value="week">{safeT('modals.exportInventory.dataFilters.thisWeek', {}, 'This Week')}</option>
                              <option value="month">{safeT('modals.exportInventory.dataFilters.thisMonth', {}, 'This Month')}</option>
                              <option value="quarter">{safeT('modals.exportInventory.dataFilters.thisQuarter', {}, 'This Quarter')}</option>
                              <option value="year">{safeT('modals.exportInventory.dataFilters.thisYear', {}, 'This Year')}</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Field Selection */}
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-base font-medium text-gray-900">{safeT('modals.exportInventory.fields.fieldsToExport', {}, 'Fields to Export')}</label>
                            <p className="text-sm leading-5 text-gray-500">
                              {safeT('modals.exportInventory.fields.fieldsDesc', {selectedFieldsCount}, 'Select which fields to include ({selectedFieldsCount} selected)')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSelectAllFields}
                            className="text-sm text-blue-600 hover:text-blue-500"
                          >
                            {selectedFieldsCount === availableFields.length ? safeT('modals.exportInventory.fieldSelection.deselectAll', {}, 'Deselect All') : safeT('modals.exportInventory.fieldSelection.selectAll', {}, 'Select All')}
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {availableFields.map((field) => (
                            <div key={field.key} className="relative flex items-start">
                              <div className="flex h-5 items-center">
                                <input
                                  id={field.key}
                                  type="checkbox"
                                  checked={exportFields[field.key]}
                                  onChange={() => handleFieldToggle(field.key)}
                                  disabled={field.required}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor={field.key} className="font-medium text-gray-700">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Export Preview */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">{safeT('modals.exportInventory.exportPreview.title', {}, 'Export Preview')}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">{safeT('modals.exportInventory.exportPreview.recordsToExport', {}, 'Records to export:')}</span>
                            <span className="ml-2 font-medium text-gray-900">{filteredData.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{safeT('modals.exportInventory.exportPreview.fieldsSelected', {}, 'Fields selected:')}</span>
                            <span className="ml-2 font-medium text-gray-900">{selectedFieldsCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{safeT('modals.exportInventory.exportPreview.format', {}, 'Format:')}</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {exportFormats.find(f => f.id === exportFormat)?.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">{safeT('modals.exportInventory.exportPreview.estimatedSize', {}, 'Estimated size:')}</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {Math.round(filteredData.length * selectedFieldsCount * 0.1)}KB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isExporting}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {safeT('common.cancel', {}, 'Cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || filteredData.length === 0 || selectedFieldsCount === 0}
                        className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isExporting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {safeT('modals.exportInventory.buttons.exporting', {}, 'Exporting...')}
                          </>
                        ) : (
                          <>
                            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                            {safeT('modals.exportInventory.buttons.exportData', {}, 'Export Data')}
                          </>
                        )}
                      </button>
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

export default ExportInventoryModal;