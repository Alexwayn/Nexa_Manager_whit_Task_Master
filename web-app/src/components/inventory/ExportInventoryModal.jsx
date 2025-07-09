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
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const ExportInventoryModal = ({ isOpen, onClose, inventoryData }) => {
  const { t, ready, i18n } = useTranslation('inventory');

  // Debug translation loading
  React.useEffect(() => {
    if (ready && isOpen) {
      console.log('🔍 ExportInventoryModal Translation Debug:');
      console.log('- Language:', i18n.language);
      console.log('- Ready:', ready);
      console.log('- exportInventory.title:', t('exportInventory.title'));
      console.log('- Available namespaces:', Object.keys(i18n.store?.data?.[i18n.language] || {}));

      // Test if inventory namespace is loaded
      const inventoryData = i18n.store?.data?.[i18n.language]?.inventory;
      console.log('- Inventory namespace loaded:', !!inventoryData);
      if (inventoryData) {
        console.log('- Has exportInventory section:', !!inventoryData.exportInventory);
      }
    }
  }, [ready, isOpen, t, i18n]);

  const safeT = (key, options = {}, fallback = '') => {
    if (!ready) return fallback;
    try {
      // Remove 'modals.' prefix if present to match the JSON structure
      const cleanKey = key.startsWith('modals.') ? key.replace('modals.', '') : key;
      const translation = t(cleanKey, options);
      return translation && translation !== cleanKey ? translation : fallback;
    } catch (error) {
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
    image: false,
  });
  const [filters, setFilters] = useState({
    category: 'all',
    stockLevel: 'all',
    location: 'all',
    dateRange: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'csv',
      name: safeT('modals.exportInventory.formats.csv.name', {}, 'CSV'),
      description: safeT(
        'modals.exportInventory.formats.csv.description',
        {},
        'Valori separati da virgola per fogli di calcolo',
      ),
      icon: TableCellsIcon,
      extension: '.csv',
      colors: {
        border: 'border-green-500',
        bg: 'bg-green-50',
        icon: 'text-green-500',
        check: 'text-green-600',
        hoverBg: 'hover:bg-green-50',
      },
    },
    {
      id: 'excel',
      name: safeT('modals.exportInventory.formats.excel.name', {}, 'Excel'),
      description: safeT(
        'modals.exportInventory.formats.excel.description',
        {},
        'Formato Microsoft Excel con formattazione',
      ),
      icon: DocumentIcon,
      extension: '.xlsx',
      colors: {
        border: 'border-emerald-500',
        bg: 'bg-emerald-50',
        icon: 'text-emerald-500',
        check: 'text-emerald-600',
        hoverBg: 'hover:bg-emerald-50',
      },
    },
    {
      id: 'pdf',
      name: safeT('modals.exportInventory.formats.pdf.name', {}, 'PDF'),
      description: safeT(
        'modals.exportInventory.formats.pdf.description',
        {},
        'Report formattato per la stampa',
      ),
      icon: DocumentTextIcon,
      extension: '.pdf',
      colors: {
        border: 'border-red-500',
        bg: 'bg-red-50',
        icon: 'text-red-500',
        check: 'text-red-600',
        hoverBg: 'hover:bg-red-50',
      },
    },
    {
      id: 'json',
      name: safeT('modals.exportInventory.formats.json.name', {}, 'JSON'),
      description: safeT(
        'modals.exportInventory.formats.json.description',
        {},
        'Dati grezzi per integrazione di sistema',
      ),
      icon: Cog6ToothIcon,
      extension: '.json',
      colors: {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        icon: 'text-purple-500',
        check: 'text-purple-600',
        hoverBg: 'hover:bg-purple-50',
      },
    },
  ];

  const availableFields = [
    {
      key: 'name',
      label: safeT('modals.exportInventory.availableFields.name', {}, 'Nome Prodotto'),
      required: true,
    },
    {
      key: 'sku',
      label: safeT('modals.exportInventory.availableFields.sku', {}, 'SKU'),
      required: true,
    },
    {
      key: 'category',
      label: safeT('modals.exportInventory.availableFields.category', {}, 'Categoria'),
      required: false,
    },
    {
      key: 'stock',
      label: safeT('modals.exportInventory.availableFields.stock', {}, 'Scorte Attuali'),
      required: false,
    },
    {
      key: 'minStock',
      label: safeT('modals.exportInventory.availableFields.minStock', {}, 'Scorte Minime'),
      required: false,
    },
    {
      key: 'price',
      label: safeT('modals.exportInventory.availableFields.price', {}, 'Prezzo'),
      required: false,
    },
    {
      key: 'location',
      label: safeT('modals.exportInventory.availableFields.location', {}, 'Posizione'),
      required: false,
    },
    {
      key: 'supplier',
      label: safeT('modals.exportInventory.availableFields.supplier', {}, 'Fornitore'),
      required: false,
    },
    {
      key: 'lastUpdated',
      label: safeT(
        'modals.exportInventory.availableFields.lastUpdated',
        {},
        'Ultimo Aggiornamento',
      ),
      required: false,
    },
    {
      key: 'description',
      label: safeT('modals.exportInventory.availableFields.description', {}, 'Descrizione'),
      required: false,
    },
    {
      key: 'image',
      label: safeT('modals.exportInventory.availableFields.image', {}, 'URL Immagine'),
      required: false,
    },
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

  const getUniqueValues = field => {
    if (!inventoryData) return [];
    return [...new Set(inventoryData.map(item => item[field]).filter(Boolean))];
  };

  const handleFieldToggle = fieldKey => {
    const field = availableFields.find(f => f.key === fieldKey);
    if (field?.required) return; // Don't allow toggling required fields

    setExportFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
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
      alert(
        safeT(
          'modals.exportInventory.messages.exportCompleted',
          {
            fileName,
            formatName: format.name,
            recordCount: filteredData.length,
            fieldCount: selectedFields.length,
          },
          `Esportazione completata!\n\nFile: ${fileName}\nFormato: ${format.name}\nRecord: ${filteredData.length}\nCampi: ${selectedFields.length}`,
        ),
      );

      onClose();
    } catch (error) {
      alert(
        safeT('modals.exportInventory.messages.exportFailed', {}, 'Esportazione fallita. Riprova.'),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const filteredData = getFilteredData();
  const selectedFieldsCount = Object.values(exportFields).filter(Boolean).length;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
        </Transition.Child>

        <div className='fixed inset-0 z-10 overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            >
              <Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6'>
                <div className='absolute right-0 top-0 hidden pr-4 pt-4 sm:block'>
                  <button
                    type='button'
                    className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    onClick={onClose}
                  >
                    <span className='sr-only'>{safeT('common.close', {}, 'Chiudi')}</span>
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>

                <div className='sm:flex sm:items-start'>
                  <div className='w-full'>
                    <Dialog.Title
                      as='h3'
                      className='text-page-title text-gray-900 mb-6 flex items-center'
                    >
                      <DocumentArrowDownIcon className='h-6 w-6 text-blue-500 mr-2' />
                      {ready
                        ? t('exportInventory.title') || 'Esporta Dati Inventario'
                        : 'Esporta Dati Inventario'}
                    </Dialog.Title>

                    <div className='space-y-6'>
                      {/* Export Format Selection */}
                      <div>
                        <label className='text-card-title text-gray-900'>
                          {ready
                            ? t('exportInventory.fields.format') || 'Formato Esportazione'
                            : 'Formato Esportazione'}
                        </label>
                        <p className='text-subtitle text-gray-500'>
                          {ready
                            ? t('exportInventory.fields.formatDesc') ||
                              'Scegli il formato per i tuoi dati esportati'
                            : 'Scegli il formato per i tuoi dati esportati'}
                        </p>
                        <fieldset className='mt-4'>
                          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                            {exportFormats.map(format => {
                              const Icon = format.icon;
                              return (
                                <label
                                  key={format.id}
                                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 ${
                                    exportFormat === format.id
                                      ? `${format.colors.border} ${format.colors.bg} shadow-md`
                                      : `border-gray-300 bg-white ${format.colors.hoverBg} hover:shadow-sm`
                                  }`}
                                >
                                  <input
                                    type='radio'
                                    name='export-format'
                                    value={format.id}
                                    checked={exportFormat === format.id}
                                    onChange={e => setExportFormat(e.target.value)}
                                    className='sr-only'
                                  />
                                  <div className='flex flex-1'>
                                    <div className='flex flex-col'>
                                      <div className='flex items-center'>
                                        <Icon
                                          className={`h-5 w-5 mr-2 ${
                                            exportFormat === format.id
                                              ? format.colors.icon
                                              : 'text-gray-400'
                                          }`}
                                        />
                                        <span className='block text-sm font-medium text-gray-900'>
                                          {format.name}
                                        </span>
                                      </div>
                                      <span className='mt-1 flex items-center text-sm text-gray-500'>
                                        {format.description}
                                      </span>
                                    </div>
                                  </div>
                                  {exportFormat === format.id && (
                                    <CheckIcon
                                      className={`h-5 w-5 ${format.colors.check}`}
                                      aria-hidden='true'
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      </div>

                      {/* Data Filters */}
                      <div>
                        <label className='text-base font-medium text-gray-900 flex items-center'>
                          <FunnelIcon className='h-5 w-5 mr-2' />
                          {safeT('modals.exportInventory.dataFilters.title', {}, 'Filtri Dati')}
                        </label>
                        <p className='text-sm leading-5 text-gray-500'>
                          {safeT(
                            'modals.exportInventory.dataFilters.description',
                            {},
                            "Filtra quali dati includere nell'esportazione",
                          )}
                        </p>
                        <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                          <div>
                            <label className='block text-form-label text-gray-700'>
                              {safeT(
                                'modals.exportInventory.dataFilters.category',
                                {},
                                'Categoria',
                              )}
                            </label>
                            <select
                              value={filters.category}
                              onChange={e =>
                                setFilters(prev => ({ ...prev, category: e.target.value }))
                              }
                              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                            >
                              <option value='all'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.allCategories',
                                  {},
                                  'Tutte le Categorie',
                                )}
                              </option>
                              {getUniqueValues('category').map(category => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className='block text-form-label text-gray-700'>
                              {safeT(
                                'modals.exportInventory.dataFilters.stockLevel',
                                {},
                                'Livello Scorte',
                              )}
                            </label>
                            <select
                              value={filters.stockLevel}
                              onChange={e =>
                                setFilters(prev => ({ ...prev, stockLevel: e.target.value }))
                              }
                              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                            >
                              <option value='all'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.allStockLevels',
                                  {},
                                  'Tutti i Livelli di Scorte',
                                )}
                              </option>
                              <option value='out'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.outOfStock',
                                  {},
                                  'Esaurito',
                                )}
                              </option>
                              <option value='low'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.lowStock',
                                  {},
                                  'Scorte Basse',
                                )}
                              </option>
                              <option value='normal'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.normalStock',
                                  {},
                                  'Scorte Normali',
                                )}
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className='block text-form-label text-gray-700'>
                              {safeT(
                                'modals.exportInventory.dataFilters.location',
                                {},
                                'Posizione',
                              )}
                            </label>
                            <select
                              value={filters.location}
                              onChange={e =>
                                setFilters(prev => ({ ...prev, location: e.target.value }))
                              }
                              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                            >
                              <option value='all'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.allLocations',
                                  {},
                                  'Tutte le Posizioni',
                                )}
                              </option>
                              {getUniqueValues('location').map(location => (
                                <option key={location} value={location}>
                                  {location}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className='block text-form-label text-gray-700'>
                              {safeT(
                                'modals.exportInventory.dataFilters.dateRange',
                                {},
                                'Intervallo Date',
                              )}
                            </label>
                            <select
                              value={filters.dateRange}
                              onChange={e =>
                                setFilters(prev => ({ ...prev, dateRange: e.target.value }))
                              }
                              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                            >
                              <option value='all'>
                                {safeT('modals.exportInventory.dataFilters.allTime', {}, 'Sempre')}
                              </option>
                              <option value='today'>
                                {safeT('modals.exportInventory.dataFilters.today', {}, 'Oggi')}
                              </option>
                              <option value='week'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.thisWeek',
                                  {},
                                  'Questa Settimana',
                                )}
                              </option>
                              <option value='month'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.thisMonth',
                                  {},
                                  'Questo Mese',
                                )}
                              </option>
                              <option value='quarter'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.thisQuarter',
                                  {},
                                  'Questo Trimestre',
                                )}
                              </option>
                              <option value='year'>
                                {safeT(
                                  'modals.exportInventory.dataFilters.thisYear',
                                  {},
                                  "Quest'Anno",
                                )}
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Field Selection */}
                      <div>
                        <div className='flex items-center justify-between'>
                          <div>
                            <label className='text-card-title text-gray-900'>
                              {safeT(
                                'modals.exportInventory.fields.fieldsToExport',
                                {},
                                'Campi da Esportare',
                              )}
                            </label>
                            <p className='text-sm leading-5 text-gray-500'>
                              {safeT(
                                'modals.exportInventory.fields.fieldsDesc',
                                {},
                                "Seleziona i campi da includere nell'esportazione",
                              )}
                            </p>
                          </div>
                          <button
                            type='button'
                            onClick={handleSelectAllFields}
                            className='text-sm text-blue-600 hover:text-blue-500'
                          >
                            {selectedFieldsCount === availableFields.length
                              ? safeT(
                                  'modals.exportInventory.fieldSelection.deselectAll',
                                  {},
                                  'Deseleziona Tutto',
                                )
                              : safeT(
                                  'modals.exportInventory.fieldSelection.selectAll',
                                  {},
                                  'Seleziona Tutto',
                                )}
                          </button>
                        </div>
                        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                          {availableFields.map(field => (
                            <div key={field.key} className='relative flex items-start'>
                              <div className='flex h-5 items-center'>
                                <input
                                  id={field.key}
                                  type='checkbox'
                                  checked={exportFields[field.key]}
                                  onChange={() => handleFieldToggle(field.key)}
                                  disabled={field.required}
                                  className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50'
                                />
                              </div>
                              <div className='ml-3 text-sm'>
                                <label htmlFor={field.key} className='font-medium text-gray-700'>
                                  {field.label}
                                  {field.required && <span className='text-red-500 ml-1'>*</span>}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Export Preview */}
                      <div className='bg-gray-50 rounded-lg p-4'>
                        <h4 className='text-sm font-medium text-gray-900 mb-2'>
                          {safeT(
                            'modals.exportInventory.exportPreview.title',
                            {},
                            'Anteprima Esportazione',
                          )}
                        </h4>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div>
                            <span className='text-gray-500'>
                              {safeT(
                                'modals.exportInventory.exportPreview.recordsToExport',
                                { count: filteredData.length },
                                `Record da esportare: ${filteredData.length}`,
                              )}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-500'>
                              {safeT(
                                'modals.exportInventory.exportPreview.fieldsSelected',
                                { count: selectedFieldsCount },
                                `Campi selezionati: ${selectedFieldsCount}`,
                              )}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-500'>
                              {safeT(
                                'modals.exportInventory.exportPreview.format',
                                { format: exportFormats.find(f => f.id === exportFormat)?.name },
                                `Formato: ${exportFormats.find(f => f.id === exportFormat)?.name}`,
                              )}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-500'>
                              {safeT(
                                'modals.exportInventory.exportPreview.estimatedSize',
                                {
                                  size: `${Math.round(filteredData.length * selectedFieldsCount * 0.1)}KB`,
                                },
                                `Dimensione stimata: ${Math.round(filteredData.length * selectedFieldsCount * 0.1)}KB`,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className='flex justify-end space-x-3 pt-6'>
                      <button
                        type='button'
                        onClick={onClose}
                        disabled={isExporting}
                        className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                      >
                        <span className='text-button-text'>
                          {safeT('common.cancel', {}, 'Annulla')}
                        </span>
                      </button>
                      <button
                        type='button'
                        onClick={handleExport}
                        disabled={
                          isExporting || filteredData.length === 0 || selectedFieldsCount === 0
                        }
                        className='rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                      >
                        {isExporting ? (
                          <>
                            <svg
                              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            <span className='text-button-text'>
                              {safeT(
                                'modals.exportInventory.buttons.exporting',
                                {},
                                'Esportazione...',
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            <DocumentArrowDownIcon className='h-4 w-4 mr-2' />
                            <span className='text-button-text'>
                              {safeT(
                                'modals.exportInventory.buttons.exportData',
                                {},
                                'Esporta Dati',
                              )}
                            </span>
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
