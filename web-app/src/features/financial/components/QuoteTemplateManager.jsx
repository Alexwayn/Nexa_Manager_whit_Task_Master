import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Logger from '@/utils/Logger';
import { useTranslation } from 'react-i18next';

const QuoteTemplateManager = ({ isOpen, onClose, onSelectTemplate, currentUser }) => {
  const { t } = useTranslation('quotes');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState('');

  // Load templates when component opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadTemplates();
    }
  }, [isOpen, currentUser, t]);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to load from local storage first (for persistence)
      const savedTemplates = localStorage.getItem('quote-templates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
        setLoading(false);
        return;
      }

      // Default templates if none saved
      const defaultTemplates = [
        {
          id: 1,
          name: t('templateManager.defaultTemplates.standardConsulting.name'),
          description: t('templateManager.defaultTemplates.standardConsulting.description'),
          category: t('templateManager.defaultTemplates.standardConsulting.category'),
          items: [
            {
              description: t('templateManager.defaultTemplates.standardConsulting.items.item1'),
              quantity: 1,
              unitPrice: 80,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.standardConsulting.items.item2'),
              quantity: 4,
              unitPrice: 60,
              taxRate: 22,
            },
          ],
          notes: t('templateManager.defaultTemplates.standardConsulting.notes'),
          terms: t('templateManager.defaultTemplates.standardConsulting.terms'),
          createdAt: new Date().toISOString(),
          isDefault: true,
        },
        {
          id: 2,
          name: t('templateManager.defaultTemplates.softwareDevelopment.name'),
          description: t('templateManager.defaultTemplates.softwareDevelopment.description'),
          category: t('templateManager.defaultTemplates.softwareDevelopment.category'),
          items: [
            {
              description: t('templateManager.defaultTemplates.softwareDevelopment.items.item1'),
              quantity: 20,
              unitPrice: 70,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.softwareDevelopment.items.item2'),
              quantity: 80,
              unitPrice: 65,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.softwareDevelopment.items.item3'),
              quantity: 16,
              unitPrice: 55,
              taxRate: 22,
            },
          ],
          notes: t('templateManager.defaultTemplates.softwareDevelopment.notes'),
          terms: t('templateManager.defaultTemplates.softwareDevelopment.terms'),
          createdAt: new Date().toISOString(),
          isDefault: false,
        },
        {
          id: 3,
          name: t('templateManager.defaultTemplates.systemMaintenance.name'),
          description: t('templateManager.defaultTemplates.systemMaintenance.description'),
          category: t('templateManager.defaultTemplates.systemMaintenance.category'),
          items: [
            {
              description: t('templateManager.defaultTemplates.systemMaintenance.items.item1'),
              quantity: 12,
              unitPrice: 150,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.systemMaintenance.items.item2'),
              quantity: 12,
              unitPrice: 50,
              taxRate: 22,
            },
          ],
          notes: t('templateManager.defaultTemplates.systemMaintenance.notes'),
          terms: t('templateManager.defaultTemplates.systemMaintenance.terms'),
          createdAt: new Date().toISOString(),
          isDefault: false,
        },
        {
          id: 4,
          name: t('templateManager.defaultTemplates.productSale.name'),
          description: t('templateManager.defaultTemplates.productSale.description'),
          category: t('templateManager.defaultTemplates.productSale.category'),
          items: [
            {
              description: t('templateManager.defaultTemplates.productSale.items.item1'),
              quantity: 2,
              unitPrice: 250,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.productSale.items.item2'),
              quantity: 1,
              unitPrice: 100,
              taxRate: 22,
            },
          ],
          notes: t('templateManager.defaultTemplates.productSale.notes'),
          terms: t('templateManager.defaultTemplates.productSale.terms'),
          createdAt: new Date().toISOString(),
          isDefault: false,
        },
        {
          id: 5,
          name: t('templateManager.defaultTemplates.customProject.name'),
          description: t('templateManager.defaultTemplates.customProject.description'),
          category: t('templateManager.defaultTemplates.customProject.category'),
          items: [
            {
              description: t('templateManager.defaultTemplates.customProject.items.item1'),
              quantity: 1,
              unitPrice: 500,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.customProject.items.item2'),
              quantity: 1,
              unitPrice: 1500,
              taxRate: 22,
            },
            {
              description: t('templateManager.defaultTemplates.customProject.items.item3'),
              quantity: 1,
              unitPrice: 300,
              taxRate: 22,
            },
          ],
          notes: t('templateManager.defaultTemplates.customProject.notes'),
          terms: t('templateManager.defaultTemplates.customProject.terms'),
          createdAt: new Date().toISOString(),
          isDefault: false,
        },
      ];

      // Save default templates to localStorage
      localStorage.setItem('quote-templates', JSON.stringify(defaultTemplates));
      setTemplates(defaultTemplates);
    } catch (error) {
      Logger.error('Error loading templates:', error);
      setError(t('templateManager.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const calculateTemplateTotal = template => {
    const subtotal = template.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxAmount = template.items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + lineTotal * (item.taxRate / 100);
    }, 0);

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleSelectTemplate = template => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    onClose();
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowCreateModal(true);
  };

  const handleEditTemplate = template => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handlePreviewTemplate = template => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDeleteTemplate = async templateId => {
    if (window.confirm(t('templateManager.deleteConfirm'))) {
      try {
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
        // Save to localStorage
        localStorage.setItem('quote-templates', JSON.stringify(updatedTemplates));
        Logger.info('Template deleted:', templateId);
      } catch (error) {
        Logger.error('Error deleting template:', error);
        setError(t('templateManager.deleteError'));
      }
    }
  };

  const handleSaveTemplate = async templateData => {
    try {
      let updatedTemplates;

      if (selectedTemplate) {
        // Update existing template
        updatedTemplates = templates.map(t =>
          t.id === selectedTemplate.id
            ? { ...templateData, id: selectedTemplate.id, updatedAt: new Date().toISOString() }
            : t,
        );
      } else {
        // Create new template
        const newTemplate = {
          ...templateData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          isDefault: false,
        };
        updatedTemplates = [...templates, newTemplate];
      }

      setTemplates(updatedTemplates);
      // Save to localStorage
      localStorage.setItem('quote-templates', JSON.stringify(updatedTemplates));

      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      Logger.error('Error saving template:', error);
      setError(t('templateManager.form.saveError'));
    }
  };

  // Removed unused getCategoryColor function

  // Removed unused handleDuplicateTemplate function

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
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
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title
                    as='h3'
                    className='text-lg font-medium leading-6 text-gray-900 dark:text-white'
                  >
                    {t('templateManager.title')}
                  </Dialog.Title>
                  <div className='absolute top-0 right-0 pt-4 pr-4'>
                    <button
                      onClick={onClose}
                      className='rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500'
                    >
                      <XMarkIcon className='h-6 w-6' />
                    </button>
                  </div>
                  <div className='mt-4'>
                    <div className='flex justify-between items-center mb-4'>
                      <button
                        onClick={handleCreateTemplate}
                        className='inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      >
                        <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                        {t('templateManager.createNew')}
                      </button>
                      <div className='w-64'>
                        <input
                          type='text'
                          placeholder={t('templateManager.searchPlaceholder')}
                          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm'
                          // onChange={...}
                        />
                      </div>
                    </div>

                    {loading && <p>{t('templateManager.loading')}</p>}
                    {error && <p className='text-red-500'>{error}</p>}

                    <div className='overflow-x-auto'>
                      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                        <thead className='bg-gray-50 dark:bg-gray-700'>
                          <tr>
                            <th
                              scope='col'
                              className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                            >
                              {t('templateManager.form.nameLabel')}
                            </th>
                            <th
                              scope='col'
                              className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                            >
                              {t('templateManager.form.categoryLabel')}
                            </th>
                            <th
                              scope='col'
                              className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                            >
                              {t('templateManager.previewModal.total')}
                            </th>
                            <th scope='col' className='relative px-6 py-3'>
                              <span className='sr-only'>Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                          {templates.length > 0 ? (
                            templates.map(template => (
                              <tr key={template.id}>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {template.name}
                                  </div>
                                  <div className='text-sm text-gray-500 dark:text-gray-400'>
                                    {template.description}
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                  {template.category}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                  {formatCurrency(calculateTemplateTotal(template).total)}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                                  <div className='flex items-center justify-end space-x-2'>
                                    <button
                                      onClick={() => handleSelectTemplate(template)}
                                      className='text-blue-600 hover:text-blue-800'
                                      title={t('templateManager.select')}
                                    >
                                      <CheckCircleIcon className='h-5 w-5' />
                                    </button>
                                    <button
                                      onClick={() => handlePreviewTemplate(template)}
                                      className='text-gray-500 hover:text-gray-700'
                                      title={t('templateManager.preview')}
                                    >
                                      <EyeIcon className='h-5 w-5' />
                                    </button>
                                    <button
                                      onClick={() => handleEditTemplate(template)}
                                      className='text-yellow-500 hover:text-yellow-700'
                                      title={t('templateManager.edit')}
                                    >
                                      <PencilIcon className='h-5 w-5' />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className='text-red-500 hover:text-red-700'
                                      title={t('templateManager.delete')}
                                    >
                                      <TrashIcon className='h-5 w-5' />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan='4' className='px-6 py-12 text-center'>
                                <DocumentTextIcon className='mx-auto h-12 w-12 text-gray-400' />
                                <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                                  {t('templateManager.noTemplates')}
                                </h3>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {showCreateModal && (
        <TemplateFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveTemplate}
          isEditing={false}
        />
      )}

      {showEditModal && (
        <TemplateFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveTemplate}
          template={selectedTemplate}
          isEditing={true}
        />
      )}

      {showPreviewModal && (
        <TemplatePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          template={selectedTemplate}
        />
      )}
    </>
  );
};

// Template Form Modal Component
const TemplateFormModal = ({ isOpen, onClose, onSave, template, isEditing }) => {
  const { t } = useTranslation('quotes');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Servizi',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
    notes: '',
    terms: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setFormData({
          name: template.name || '',
          description: template.description || '',
          category: template.category || 'Servizi',
          items: template.items || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
          notes: template.notes || '',
          terms: template.terms || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'Servizi',
          items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
          notes: '',
          terms: '',
        });
      }
    }
  }, [isOpen, template]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 22 }],
    }));
  };

  const removeItem = index => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert(t('templateManager.form.nameRequired'));
      return;
    }

    const validItems = formData.items.filter(
      item => item.description && item.description.trim() !== '',
    );

    if (validItems.length === 0) {
      alert(t('templateManager.form.itemRequired'));
      return;
    }

    onSave({ ...formData, items: validItems });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                <div className='flex items-center justify-between mb-6'>
                  <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-white'>
                    {isEditing
                      ? t('templateManager.form.editTitle')
                      : t('templateManager.form.createTitle')}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className='rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Basic Info */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t('templateManager.form.nameLabel')}
                      </label>
                      <input
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t('templateManager.form.categoryLabel')}
                      </label>
                      <select
                        name='category'
                        value={formData.category}
                        onChange={handleChange}
                        className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        {[
                          t('templateManager.form.categories.services'),
                          t('templateManager.form.categories.development'),
                          t('templateManager.form.categories.maintenance'),
                          t('templateManager.form.categories.products'),
                          t('templateManager.form.categories.other'),
                        ].map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      {t('templateManager.form.descriptionLabel')}
                    </label>
                    <textarea
                      name='description'
                      value={formData.description}
                      onChange={handleChange}
                      rows={2}
                      className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>

                  {/* Items */}
                  <div>
                    <div className='flex items-center justify-between mb-3'>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('templateManager.form.itemsLabel')}
                      </label>
                      <button
                        type='button'
                        onClick={addItem}
                        className='inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200'
                      >
                        <PlusIcon className='h-4 w-4 mr-1' />
                        {t('templateManager.form.addItem')}
                      </button>
                    </div>

                    <div className='space-y-3'>
                      {formData.items.map((item, index) => (
                        <div key={index} className='grid grid-cols-12 gap-2 items-end'>
                          <div className='col-span-5'>
                            <input
                              type='text'
                              placeholder={t('templateManager.form.itemDescriptionPlaceholder')}
                              value={item.description}
                              onChange={e => handleItemChange(index, 'description', e.target.value)}
                              className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                          <div className='col-span-2'>
                            <input
                              type='number'
                              placeholder={t('templateManager.form.itemQtyPlaceholder')}
                              value={item.quantity}
                              onChange={e =>
                                handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                          <div className='col-span-2'>
                            <input
                              type='number'
                              placeholder={t('templateManager.form.itemPricePlaceholder')}
                              step='0.01'
                              value={item.unitPrice}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'unitPrice',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                          <div className='col-span-2'>
                            <input
                              type='number'
                              placeholder={t('templateManager.form.itemTaxPlaceholder')}
                              value={item.taxRate}
                              onChange={e =>
                                handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                              }
                              className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                          <div className='col-span-1'>
                            {formData.items.length > 1 && (
                              <button
                                type='button'
                                onClick={() => removeItem(index)}
                                className='p-2 text-red-600 hover:text-red-700'
                              >
                                <TrashIcon className='h-4 w-4' />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t('templateManager.form.defaultNotesLabel')}
                      </label>
                      <textarea
                        name='notes'
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                        {t('templateManager.form.termsLabel')}
                      </label>
                      <textarea
                        name='terms'
                        value={formData.terms}
                        onChange={handleChange}
                        rows={3}
                        className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
                    <button
                      type='button'
                      onClick={onClose}
                      className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    >
                      {t('templateManager.form.cancel')}
                    </button>
                    <button
                      type='submit'
                      className='px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
                    >
                      {isEditing
                        ? t('templateManager.form.update')
                        : t('templateManager.form.create')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Template Preview Modal Component
const TemplatePreviewModal = ({ isOpen, onClose, template }) => {
  const { t } = useTranslation('quotes');
  if (!template) return null;

  const calculateTotal = items => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + lineTotal * (item.taxRate / 100);
    }, 0);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totals = calculateTotal(template.items);

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                <div className='flex items-center justify-between mb-6'>
                  <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-white'>
                    {t('templateManager.previewModal.title', { name: template.name })}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className='rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='space-y-6'>
                  {/* Template Info */}
                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <h3 className='font-medium text-gray-900 dark:text-white mb-2'>
                      {template.name}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 mb-2'>{template.description}</p>
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                      {template.category}
                    </span>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-3'>
                      {t('templateManager.previewModal.items')}
                    </h4>
                    <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
                      <table className='min-w-full divide-y divide-gray-300 dark:divide-gray-600'>
                        <thead className='bg-gray-50 dark:bg-gray-700'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                              {t('templateManager.previewModal.description')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                              {t('templateManager.previewModal.quantity')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                              {t('templateManager.previewModal.unitPrice')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                              {t('templateManager.previewModal.tax')}
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                              {t('templateManager.previewModal.total')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                          {template.items.map((item, index) => (
                            <tr key={index}>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                {item.description}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                {item.quantity}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                                {item.taxRate}%
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t('templateManager.previewModal.subtotal')}
                        </span>
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {formatCurrency(totals.subtotal)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t('templateManager.previewModal.taxAmount')}
                        </span>
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {formatCurrency(totals.taxAmount)}
                        </span>
                      </div>
                      <div className='flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-600 pt-2'>
                        <span className='text-gray-900 dark:text-white'>
                          {t('templateManager.previewModal.grandTotal')}
                        </span>
                        <span className='text-gray-900 dark:text-white'>
                          {formatCurrency(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  {(template.notes || template.terms) && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {template.notes && (
                        <div>
                          <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                            {t('templateManager.previewModal.notes')}
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md'>
                            {template.notes}
                          </p>
                        </div>
                      )}
                      {template.terms && (
                        <div>
                          <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                            {t('templateManager.previewModal.terms')}
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md'>
                            {template.terms}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className='flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  >
                    {t('templateManager.previewModal.close')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuoteTemplateManager;
