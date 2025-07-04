import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const ReportsModal = ({ isOpen, onClose }) => {
  const { t, ready } = useTranslation('inventory');
  const [selectedReport, setSelectedReport] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    stockLevel: ''
  });

  // Safe translation function
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  const reportTypes = [
    {
      id: 'inventory-summary',
      name: safeT('reports.types.inventorySummary.name', {}, 'Inventory Summary'),
      description: safeT('reports.types.inventorySummary.description', {}, 'Complete overview of all inventory items'),
      icon: ChartBarIcon
    },
    {
      id: 'stock-levels',
      name: safeT('reports.types.stockLevels.name', {}, 'Stock Levels Report'),
      description: safeT('reports.types.stockLevels.description', {}, 'Current stock levels and alerts'),
      icon: DocumentTextIcon
    },
    {
      id: 'low-stock',
      name: safeT('reports.types.lowStock.name', {}, 'Low Stock Report'),
      description: safeT('reports.types.lowStock.description', {}, 'Items below minimum stock levels'),
      icon: DocumentTextIcon
    },
    {
      id: 'inventory-valuation',
      name: safeT('reports.types.inventoryValuation.name', {}, 'Inventory Valuation'),
      description: safeT('reports.types.inventoryValuation.description', {}, 'Total value of inventory by category'),
      icon: ChartBarIcon
    },
    {
      id: 'movement-history',
      name: safeT('reports.types.movementHistory.name', {}, 'Movement History'),
      description: safeT('reports.types.movementHistory.description', {}, 'Stock movements over time'),
      icon: DocumentTextIcon
    },
    {
      id: 'supplier-analysis',
      name: safeT('reports.types.supplierAnalysis.name', {}, 'Supplier Analysis'),
      description: safeT('reports.types.supplierAnalysis.description', {}, 'Performance analysis by supplier'),
      icon: ChartBarIcon
    }
  ];

  const handleGenerateReport = () => {
    // Here you would implement the actual report generation logic
    console.log('Generating report:', {
      type: selectedReport,
      dateRange,
      filters
    });
    
    // Show success message or download report
    alert(safeT('reports.messages.generated', {}, 'Report generated successfully!'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {safeT('reports.title', {}, 'Generate Reports')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report Types */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {safeT('reports.selectType', {}, 'Select Report Type')}
              </h3>
              <div className="space-y-3">
                {reportTypes.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <div
                      key={report.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedReport === report.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters and Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {safeT('reports.options', {}, 'Report Options')}
              </h3>
              
              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  {safeT('reports.dateRange', {}, 'Date Range')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={safeT('common.startDate', {}, 'Start Date')}
                  />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={safeT('common.endDate', {}, 'End Date')}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FunnelIcon className="h-4 w-4 inline mr-1" />
                  {safeT('reports.filters.label', {}, 'Filters')}
                </label>
                <div className="space-y-3">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{safeT('reports.filters.allCategories', {}, 'All Categories')}</option>
                    <option value="electronics">{safeT('reports.filters.electronics', {}, 'Electronics')}</option>
                    <option value="furniture">{safeT('reports.filters.furniture', {}, 'Furniture')}</option>
                    <option value="office-supplies">{safeT('reports.filters.officeSupplies', {}, 'Office Supplies')}</option>
                  </select>
                  
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{safeT('reports.filters.allLocations', {}, 'All Locations')}</option>
                    <option value="warehouse-a">{safeT('reports.filters.warehouseA', {}, 'Warehouse A')}</option>
                    <option value="warehouse-b">{safeT('reports.filters.warehouseB', {}, 'Warehouse B')}</option>
                    <option value="store-front">{safeT('reports.filters.storeFront', {}, 'Store Front')}</option>
                  </select>
                  
                  <select
                    value={filters.stockLevel}
                    onChange={(e) => setFilters({...filters, stockLevel: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{safeT('reports.filters.allStockLevels', {}, 'All Stock Levels')}</option>
                    <option value="in-stock">{safeT('reports.filters.inStock', {}, 'In Stock')}</option>
                    <option value="low-stock">{safeT('reports.filters.lowStock', {}, 'Low Stock')}</option>
                    <option value="out-of-stock">{safeT('reports.filters.outOfStock', {}, 'Out of Stock')}</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {safeT('reports.preview.title', {}, 'Report Preview')}
                </h4>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">{safeT('reports.preview.type', {}, 'Type')}:</span> {reportTypes.find(r => r.id === selectedReport)?.name}</p>
                  {dateRange.startDate && (
                    <p><span className="font-medium">{safeT('reports.preview.period', {}, 'Period')}:</span> {dateRange.startDate} to {dateRange.endDate || safeT('reports.preview.present', {}, 'Present')}</p>
                  )}
                  {filters.category && <p><span className="font-medium">{safeT('reports.preview.category', {}, 'Category')}:</span> {safeT(`reports.filters.${filters.category}`, {}, filters.category)}</p>}
                  {filters.location && <p><span className="font-medium">{safeT('reports.preview.location', {}, 'Location')}:</span> {safeT(`reports.filters.${filters.location.replace('-', '')}`, {}, filters.location)}</p>}
                  {filters.stockLevel && <p><span className="font-medium">{safeT('reports.preview.stockLevel', {}, 'Stock Level')}:</span> {safeT(`reports.filters.${filters.stockLevel.replace('-', '')}`, {}, filters.stockLevel)}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {safeT('common.cancel', {}, 'Cancel')}
          </button>
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>{safeT('reports.generate', {}, 'Generate Report')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;