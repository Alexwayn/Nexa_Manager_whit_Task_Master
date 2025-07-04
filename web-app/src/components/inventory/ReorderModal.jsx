import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

const ReorderModal = ({ isOpen, onClose, item }) => {
  const { t, ready, i18n } = useTranslation(['inventory', 'common']);
  const [reorderQuantity, setReorderQuantity] = useState(item?.minStock || 0);
  const [urgency, setUrgency] = useState('normal');
  const [notes, setNotes] = useState('');
  const [supplier, setSupplier] = useState(item?.supplier || '');

  // Safe translation function with explicit namespace
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) {
      return fallback;
    }
    try {
      // Determina il namespace dalla chiave
      const isCommonKey = key.startsWith('common.');
      const namespace = isCommonKey ? 'common' : 'inventory';
      const actualKey = isCommonKey ? key.replace('common.', '') : key;
      
      const translation = t(actualKey, { ...options, ns: namespace });
      
      // Verifica se la traduzione è valida
      const isValidTranslation = translation !== actualKey && 
                                translation !== `${namespace}:${actualKey}` &&
                                translation !== key;
      
      return isValidTranslation ? translation : fallback;
    } catch (error) {
      console.error(`❌ Errore traduzione per ${key}:`, error);
      return fallback;
    }
  };





  const handleReorder = () => {
    // Here you would implement the actual reorder logic
    const reorderData = {
      itemId: item?.id,
      itemName: item?.name,
      quantity: reorderQuantity,
      urgency,
      supplier,
      notes,
      estimatedCost: (item?.price || 0) * reorderQuantity
    };
    
    console.log('Creating reorder:', reorderData);
    
    // Show success message
    alert(safeT('reorder.messages.created', { quantity: reorderQuantity, itemName: item.name }, `Reorder created for ${reorderQuantity} units of ${item.name}`));
    onClose();
  };

  const adjustQuantity = (delta) => {
    const newQuantity = Math.max(0, reorderQuantity + delta);
    setReorderQuantity(newQuantity);
  };

  if (!isOpen || !item) return null;

  const estimatedCost = (item.price || 0) * reorderQuantity;
  const currentStockLevel = item.stock;
  const minStockLevel = item.minStock;
  const stockDeficit = Math.max(0, minStockLevel - currentStockLevel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ArrowPathIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {safeT('reorder.title', {}, 'Reorder Item')}
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
          {/* Item Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              {safeT('reorder.itemInfo', {}, 'Item Information')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.name', {}, 'Name:')}:</span>
                <span className="ml-2 font-medium">{item.name}</span>
              </div>
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.sku', {}, 'SKU:')}:</span>
                <span className="ml-2 font-medium">{item.sku}</span>
              </div>
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.currentStock', {}, 'Current Stock:')}:</span>
                <span className={`ml-2 font-medium ${
                  currentStockLevel <= minStockLevel ? 'text-red-600' : 'text-green-600'
                }`}>
                  {currentStockLevel}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.minimumStock', {}, 'Minimum Stock:')}:</span>
                <span className="ml-2 font-medium">{minStockLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.unitPrice', {}, 'Unit Price:')}:</span>
                <span className="ml-2 font-medium">${item.price?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">{safeT('reorder.fields.supplier', {}, 'Supplier:')}:</span>
                <span className="ml-2 font-medium">{item.supplier}</span>
              </div>
            </div>
            
            {stockDeficit > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm font-medium">
                    {safeT('reorder.stockDeficit', {deficit: stockDeficit}, `Stock deficit: ${stockDeficit} units below minimum level`)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reorder Details */}
          <div className="space-y-6">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {safeT('reorder.quantity', {}, 'Reorder Quantity')}
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => adjustQuantity(-1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={reorderQuantity <= 0}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
                <button
                  onClick={() => adjustQuantity(1)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">{safeT('reorder.units', {}, 'units')}</span>
              </div>
              <div className="mt-2 flex space-x-4">
                <button
                  onClick={() => setReorderQuantity(stockDeficit)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={stockDeficit <= 0}
                >
                  {safeT('reorder.actions.fillDeficit', {deficit: stockDeficit}, `Fill deficit (${stockDeficit})`)}
                </button>
                <button
                  onClick={() => setReorderQuantity(minStockLevel)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {safeT('reorder.actions.reorderToMinimum', {minimum: minStockLevel}, `Reorder to minimum (${minStockLevel})`)}
                </button>
                <button
                  onClick={() => setReorderQuantity(minStockLevel * 2)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {safeT('reorder.actions.reorderToDouble', {double: minStockLevel * 2}, `Reorder to double minimum (${minStockLevel * 2})`)}
                </button>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {safeT('reorder.urgencyLabel', {}, 'Urgency Level')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'low', label: safeT('reorder.urgency.low', {}, 'Low'), color: 'green' },
                  { value: 'normal', label: safeT('reorder.urgency.normal', {}, 'Normal'), color: 'blue' },
                  { value: 'high', label: safeT('reorder.urgency.high', {}, 'High'), color: 'red' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setUrgency(option.value)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      urgency === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {safeT('reorder.supplier', {}, 'Supplier')}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={safeT('reorder.placeholders.supplier', {}, 'Enter supplier name')}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {safeT('reorder.notes', {}, 'Notes (Optional)')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={safeT('reorder.placeholders.notes', {}, 'Add any special instructions or notes...')}
              />
            </div>

            {/* Cost Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                {safeT('reorder.costSummaryTitle', {}, 'Cost Summary')}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">{safeT('reorder.costSummary.quantity', {}, 'Quantity:')}:</span>
                  <span className="font-medium">{reorderQuantity} {safeT('reorder.units', {}, 'units')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">{safeT('reorder.costSummary.unitPrice', {}, 'Unit Price:')}:</span>
                  <span className="font-medium">${item.price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1">
                  <span className="text-blue-700 font-medium">{safeT('reorder.costSummary.estimatedTotal', {}, 'Estimated Total:')}:</span>
                  <span className="font-bold text-blue-900">${estimatedCost.toFixed(2)}</span>
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
            onClick={handleReorder}
            disabled={reorderQuantity <= 0 || !supplier.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>{safeT('reorder.createOrder', {}, 'Create Reorder')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderModal;