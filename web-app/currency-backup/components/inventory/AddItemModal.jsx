import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const AddItemModal = ({ isOpen, onClose, onSave }) => {
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
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    location: '',
    stock: '',
    minStock: '',
    price: '',
    supplier: '',
    description: '',
    image: null,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Automotive',
    'Health & Beauty',
    'Toys & Games',
  ];

  const locations = ['Warehouse A', 'Warehouse B', 'Store Front', 'Storage Room', 'Display Area'];

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = safeT('modals.addItem.errors.nameRequired', {}, 'Product name is required');
    if (!formData.sku.trim())
      newErrors.sku = safeT('modals.addItem.errors.skuRequired', {}, 'SKU is required');
    if (!formData.category)
      newErrors.category = safeT(
        'modals.addItem.errors.categoryRequired',
        {},
        'Category is required',
      );
    if (!formData.location)
      newErrors.location = safeT(
        'modals.addItem.errors.locationRequired',
        {},
        'Location is required',
      );
    if (!formData.stock || formData.stock < 0)
      newErrors.stock = safeT(
        'modals.addItem.errors.stockRequired',
        {},
        'Valid stock quantity is required',
      );
    if (!formData.minStock || formData.minStock < 0)
      newErrors.minStock = safeT(
        'modals.addItem.errors.minStockRequired',
        {},
        'Valid minimum stock is required',
      );
    if (!formData.price || formData.price <= 0)
      newErrors.price = safeT('modals.addItem.errors.priceRequired', {}, 'Valid price is required');
    if (!formData.supplier.trim())
      newErrors.supplier = safeT(
        'modals.addItem.errors.supplierRequired',
        {},
        'Supplier is required',
      );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      // Create new item object
      const newItem = {
        id: Date.now(), // Simple ID generation
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        location: formData.location,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        price: parseFloat(formData.price),
        supplier: formData.supplier,
        description: formData.description,
        lastUpdated: new Date().toLocaleDateString(),
        image: formData.image ? URL.createObjectURL(formData.image) : null,
      };

      await onSave(newItem);

      // Reset form
      setFormData({
        name: '',
        sku: '',
        category: '',
        location: '',
        stock: '',
        minStock: '',
        price: '',
        supplier: '',
        description: '',
        image: null,
      });

      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: '',
        sku: '',
        category: '',
        location: '',
        stock: '',
        minStock: '',
        price: '',
        supplier: '',
        description: '',
        image: null,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={handleClose}>
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
              <Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6'>
                <div className='absolute right-0 top-0 hidden pr-4 pt-4 sm:block'>
                  <button
                    type='button'
                    className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    onClick={handleClose}
                    disabled={saving}
                  >
                    <span className='sr-only'>{safeT('common.close', {}, 'Close')}</span>
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>

                <div className='sm:flex sm:items-start'>
                  <div className='w-full'>
                    <Dialog.Title as='h3' className='text-page-title text-gray-900 mb-6'>
                      {safeT('modals.addItem.title', {}, 'Add New Inventory Item')}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className='space-y-6'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Product Name */}
                        <div>
                          <label
                            htmlFor='name'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.name', {}, 'Product Name')} *
                          </label>
                          <input
                            type='text'
                            name='name'
                            id='name'
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.name ? 'border-red-300' : ''
                            }`}
                            placeholder={safeT(
                              'modals.addItem.placeholders.name',
                              {},
                              'Enter product name',
                            )}
                          />
                          {errors.name && (
                            <p className='mt-1 text-error text-red-600'>{errors.name}</p>
                          )}
                        </div>

                        {/* SKU */}
                        <div>
                          <label htmlFor='sku' className='block text-form-label text-gray-700 mb-2'>
                            {safeT('modals.addItem.fields.sku', {}, 'SKU')} *
                          </label>
                          <input
                            type='text'
                            name='sku'
                            id='sku'
                            value={formData.sku}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.sku ? 'border-red-300' : ''
                            }`}
                            placeholder={safeT('modals.addItem.placeholders.sku', {}, 'Enter SKU')}
                          />
                          {errors.sku && (
                            <p className='mt-1 text-error text-red-600'>{errors.sku}</p>
                          )}
                        </div>

                        {/* Category */}
                        <div>
                          <label
                            htmlFor='category'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.category', {}, 'Category')} *
                          </label>
                          <select
                            name='category'
                            id='category'
                            value={formData.category}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.category ? 'border-red-300' : ''
                            }`}
                          >
                            <option value=''>
                              {safeT(
                                'modals.addItem.placeholders.category',
                                {},
                                'Select a category',
                              )}
                            </option>
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          {errors.category && (
                            <p className='mt-1 text-error text-red-600'>{errors.category}</p>
                          )}
                        </div>

                        {/* Location */}
                        <div>
                          <label
                            htmlFor='location'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.location', {}, 'Location')} *
                          </label>
                          <select
                            name='location'
                            id='location'
                            value={formData.location}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.location ? 'border-red-300' : ''
                            }`}
                          >
                            <option value=''>
                              {safeT(
                                'modals.addItem.placeholders.location',
                                {},
                                'Select a location',
                              )}
                            </option>
                            {locations.map(location => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                          {errors.location && (
                            <p className='mt-1 text-error text-red-600'>{errors.location}</p>
                          )}
                        </div>

                        {/* Stock */}
                        <div>
                          <label
                            htmlFor='stock'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.stock', {}, 'Current Stock')} *
                          </label>
                          <input
                            type='number'
                            name='stock'
                            id='stock'
                            min='0'
                            value={formData.stock}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.stock ? 'border-red-300' : ''
                            }`}
                            placeholder={safeT('modals.addItem.placeholders.stock', {}, '0')}
                          />
                          {errors.stock && (
                            <p className='mt-1 text-error text-red-600'>{errors.stock}</p>
                          )}
                        </div>

                        {/* Minimum Stock */}
                        <div>
                          <label
                            htmlFor='minStock'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.minStock', {}, 'Minimum Stock')} *
                          </label>
                          <input
                            type='number'
                            name='minStock'
                            id='minStock'
                            min='0'
                            value={formData.minStock}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.minStock ? 'border-red-300' : ''
                            }`}
                            placeholder={safeT('modals.addItem.placeholders.minStock', {}, '0')}
                          />
                          {errors.minStock && (
                            <p className='mt-1 text-error text-red-600'>{errors.minStock}</p>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <label
                            htmlFor='price'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.price', {}, 'Price')} *
                          </label>
                          <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                              <span className='text-gray-500 text-input-text'>$</span>
                            </div>
                            <input
                              type='number'
                              name='price'
                              id='price'
                              min='0'
                              step='0.01'
                              value={formData.price}
                              onChange={handleInputChange}
                              className={`block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                                errors.price ? 'border-red-300' : ''
                              }`}
                              placeholder={safeT('modals.addItem.placeholders.price', {}, '0.00')}
                            />
                          </div>
                          {errors.price && (
                            <p className='mt-1 text-error text-red-600'>{errors.price}</p>
                          )}
                        </div>

                        {/* Supplier */}
                        <div>
                          <label
                            htmlFor='supplier'
                            className='block text-form-label text-gray-700 mb-2'
                          >
                            {safeT('modals.addItem.fields.supplier', {}, 'Supplier')} *
                          </label>
                          <input
                            type='text'
                            name='supplier'
                            id='supplier'
                            value={formData.supplier}
                            onChange={handleInputChange}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text ${
                              errors.supplier ? 'border-red-300' : ''
                            }`}
                            placeholder={safeT(
                              'modals.addItem.placeholders.supplier',
                              {},
                              'Enter supplier name',
                            )}
                          />
                          {errors.supplier && (
                            <p className='mt-1 text-error text-red-600'>{errors.supplier}</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          htmlFor='description'
                          className='block text-form-label text-gray-700 mb-2'
                        >
                          {safeT('modals.addItem.fields.description', {}, 'Description')}
                        </label>
                        <textarea
                          name='description'
                          id='description'
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-input-text'
                          placeholder={safeT(
                            'modals.addItem.placeholders.description',
                            {},
                            'Enter product description (optional)',
                          )}
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className='block text-form-label text-gray-700 mb-2'>
                          {safeT('modals.addItem.fields.image', {}, 'Product Image')}
                        </label>
                        <div className='mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md'>
                          <div className='space-y-1 text-center'>
                            <PhotoIcon className='mx-auto h-12 w-12 text-gray-400' />
                            <div className='flex text-body text-gray-600'>
                              <label
                                htmlFor='image'
                                className='relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500'
                              >
                                <span>
                                  {safeT(
                                    'modals.addItem.imageUpload.uploadFile',
                                    {},
                                    'Upload a file',
                                  )}
                                </span>
                                <input
                                  id='image'
                                  name='image'
                                  type='file'
                                  accept='image/*'
                                  className='sr-only'
                                  onChange={handleImageChange}
                                />
                              </label>
                              <p className='pl-1'>
                                {safeT(
                                  'modals.addItem.imageUpload.dragDrop',
                                  {},
                                  'or drag and drop',
                                )}
                              </p>
                            </div>
                            <p className='text-caption text-gray-500'>
                              {safeT(
                                'modals.addItem.imageUpload.fileTypes',
                                {},
                                'PNG, JPG, GIF up to 10MB',
                              )}
                            </p>
                            {formData.image && (
                              <p className='text-body text-green-600'>
                                {safeT(
                                  'modals.addItem.imageUpload.selected',
                                  { fileName: formData.image.name },
                                  `Selected: ${formData.image.name}`,
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className='flex justify-end space-x-3 pt-6'>
                        <button
                          type='button'
                          onClick={handleClose}
                          disabled={saving}
                          className='rounded-md border border-gray-300 bg-white px-4 py-2 text-button-text text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                        >
                          {safeT('modals.addItem.buttons.cancel', {}, 'Cancel')}
                        </button>
                        <button
                          type='submit'
                          disabled={saving}
                          className='rounded-md border border-transparent bg-blue-600 px-4 py-2 text-button-text text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
                        >
                          {saving
                            ? safeT('modals.addItem.buttons.adding', {}, 'Adding...')
                            : safeT('modals.addItem.buttons.add', {}, 'Add Item')}
                        </button>
                      </div>
                    </form>
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

export default AddItemModal;
