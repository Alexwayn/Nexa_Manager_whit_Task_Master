import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

const ReorderModal = ({ isOpen, onClose, item }) => {
  const { t, ready } = useTranslation(['inventory', 'common'], { useSuspense: false });
  const [reorderQuantity, setReorderQuantity] = useState(item?.minStock || 0);
  const [urgency, setUrgency] = useState('normal');
  const [notes, setNotes] = useState('');
  const [supplier, setSupplier] = useState(item?.supplier || '');

  // Wait for i18n to be ready before rendering
  if (!ready || !item) return null;

  const handleReorder = () => {
    // Here you would implement the actual reorder logic
    const reorderData = {
      itemId: item?.id,
      itemName: item?.name,
      quantity: reorderQuantity,
      urgency,
      supplier,
      notes,
      estimatedCost: (item?.price || 0) * reorderQuantity,
    };

    console.log('Creating reorder:', reorderData);

    // Show success message
    alert(
      t('inventory:reorder.messages.created', {
        defaultValue: `Riordino creato per ${reorderQuantity} unità di ${item.name}`,
        quantity: reorderQuantity,
        itemName: item.name,
      }),
    );
    onClose();
  };

  const adjustQuantity = delta => {
    const newQuantity = Math.max(0, reorderQuantity + delta);
    setReorderQuantity(newQuantity);
  };

  if (!isOpen) return null;

  const estimatedCost = (item.price || 0) * reorderQuantity;
  const currentStockLevel = item.stock;
  const minStockLevel = item.minStock;
  const stockDeficit = Math.max(0, minStockLevel - currentStockLevel);

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div
        className='bg-white rounded-lg shadow-xl w-full max-w-2xl'
        style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0'>
          <div className='flex items-center space-x-3'>
            <ArrowPathIcon className='h-6 w-6 text-blue-600' />
            <h2 className='text-page-title text-gray-900'>
              {t('inventory:reorder.title', 'Riordina Articolo')}
            </h2>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto flex-grow'>
          {/* Item Information */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <h3 className='text-card-title text-gray-900 mb-3'>
              {t('inventory:reorder.itemInfo', 'Informazioni Articolo')}
            </h3>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>{t('inventory:reorder.fields.name', 'Nome:')}</span>
                <span className='ml-2 font-medium'>{item.name}</span>
              </div>
              <div>
                <span className='text-gray-600'>{t('inventory:reorder.fields.sku', 'SKU:')}</span>
                <span className='ml-2 font-medium'>{item.sku}</span>
              </div>
              <div>
                <span className='text-gray-600'>
                  {t('inventory:reorder.fields.currentStock', 'Scorta Attuale:')}
                </span>
                <span
                  className={`ml-2 font-medium ${
                    currentStockLevel <= minStockLevel ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {currentStockLevel}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>
                  {t('inventory:reorder.fields.minimumStock', 'Scorta Minima:')}:
                </span>
                <span className='ml-2 font-medium'>{minStockLevel}</span>
              </div>
              <div>
                <span className='text-gray-600'>
                  {t('inventory:reorder.fields.unitPrice', 'Prezzo Unitario:')}:
                </span>
                <span className='ml-2 font-medium'>€{item.price?.toFixed(2)}</span>
              </div>
              <div>
                <span className='text-gray-600'>
                  {t('inventory:reorder.fields.supplier', 'Fornitore:')}:
                </span>
                <span className='ml-2 font-medium'>{item.supplier}</span>
              </div>
            </div>

            {stockDeficit > 0 && (
              <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-md'>
                <div className='flex items-center'>
                  <ExclamationTriangleIcon className='h-5 w-5 text-red-600 mr-2' />
                  <span className='text-red-800 text-sm font-medium'>
                    {t('inventory:reorder.stockDeficit', {
                      deficit: stockDeficit,
                      defaultValue: `Deficit scorte: ${stockDeficit} unità sotto il livello minimo`,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reorder Details */}
          <div className='space-y-6'>
            {/* Quantity */}
            <div>
              <label className='block text-form-label text-gray-700 mb-2'>
                {t('inventory:reorder.quantity', 'Quantità Riordino')}
              </label>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => adjustQuantity(-1)}
                  className='p-2 border border-gray-300 rounded-md hover:bg-gray-50'
                  disabled={reorderQuantity <= 0}
                >
                  <MinusIcon className='h-4 w-4' />
                </button>
                <input
                  type='number'
                  value={reorderQuantity}
                  onChange={e => setReorderQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className='w-24 text-center border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  min='0'
                />
                <button
                  onClick={() => adjustQuantity(1)}
                  className='p-2 border border-gray-300 rounded-md hover:bg-gray-50'
                >
                  <PlusIcon className='h-4 w-4' />
                </button>
                <span className='text-sm text-gray-600'>
                  {t('inventory:reorder.units', 'unità')}
                </span>
              </div>
              <div className='mt-2 flex space-x-4'>
                <button
                  onClick={() => setReorderQuantity(stockDeficit)}
                  className='text-sm text-blue-600 hover:text-blue-700'
                  disabled={stockDeficit <= 0}
                >
                  {t('inventory:reorder.actions.fillDeficit', {
                    deficit: stockDeficit,
                    defaultValue: `Riempi deficit (${stockDeficit})`,
                  })}
                </button>
                <button
                  onClick={() => setReorderQuantity(minStockLevel)}
                  className='text-sm text-blue-600 hover:text-blue-700'
                >
                  {t('inventory:reorder.actions.reorderToMinimum', {
                    minimum: minStockLevel,
                    defaultValue: `Riordina al minimo (${minStockLevel})`,
                  })}
                </button>
                <button
                  onClick={() => setReorderQuantity(minStockLevel * 2)}
                  className='text-sm text-blue-600 hover:text-blue-700'
                >
                  {t('inventory:reorder.actions.reorderToDouble', {
                    double: minStockLevel * 2,
                    defaultValue: `Riordina al doppio del minimo (${minStockLevel * 2})`,
                  })}
                </button>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className='block text-form-label text-gray-700 mb-2'>
                {t('inventory:reorder.urgencyLabel', 'Livello di Urgenza')}
              </label>
              <div className='grid grid-cols-3 gap-3'>
                {[
                  {
                    value: 'low',
                    label: t('inventory:reorder.urgency.low', 'Bassa'),
                    color: 'green',
                  },
                  {
                    value: 'normal',
                    label: t('inventory:reorder.urgency.normal', 'Normale'),
                    color: 'blue',
                  },
                  {
                    value: 'high',
                    label: t('inventory:reorder.urgency.high', 'Alta'),
                    color: 'red',
                  },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setUrgency(option.value)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      urgency === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className='text-button-text'>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label htmlFor='supplier' className='block text-form-label text-gray-700 mb-2'>
                {t('inventory:reorder.supplier', 'Fornitore')}
              </label>
              <input
                type='text'
                id='supplier'
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder={t(
                  'inventory:reorder.placeholders.supplier',
                  'Es. Fornitore Principale',
                )}
                className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor='notes' className='block text-form-label text-gray-700 mb-2'>
                {t('inventory:reorder.notes', 'Note Aggiuntive')}
              </label>
              <textarea
                id='notes'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t(
                  'inventory:reorder.placeholders.notes',
                  'Aggiungi note per il riordino...',
                )}
                className='w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                rows='3'
              ></textarea>
            </div>

            {/* Cost Summary */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='text-card-title text-gray-900 mb-3'>
                {t('inventory:reorder.costSummaryTitle', 'Riepilogo Costi Stimati')}
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    {t('inventory:reorder.costSummary.quantity', 'Quantità:')}
                  </span>
                  <span className='font-medium'>
                    {reorderQuantity} {t('inventory:reorder.units', 'unità')}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>
                    {t('inventory:reorder.costSummary.unitPrice', 'Prezzo Unitario:')}
                  </span>
                  <span className='font-medium'>€{item.price?.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-base font-semibold pt-2 border-t border-gray-200 mt-2'>
                  <span className='text-gray-800'>
                    {t('inventory:reorder.costSummary.estimatedTotal', 'Totale Stimato:')}
                  </span>
                  <span className='text-blue-600'>€{estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end items-center p-6 bg-gray-50 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3'
          >
            {t('common:cancel', 'Annulla')}
          </button>
          <button
            onClick={handleReorder}
            className='px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300'
            disabled={reorderQuantity <= 0}
          >
            <div className='flex items-center'>
              <CheckCircleIcon className='h-5 w-5 mr-2' />
              <span>{t('inventory:reorder.createOrder', 'Crea Riordino')}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderModal;
