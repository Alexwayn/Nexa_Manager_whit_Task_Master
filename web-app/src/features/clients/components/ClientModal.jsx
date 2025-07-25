import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import logger from '../../utils/Logger';

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Placeholder translation function
  const t = (key, params = {}) => {
    const translations = {
      'clients.modal.validation.required': 'Please fill in all required fields',
      'clients.modal.editClient': 'Edit Client',
      'clients.modal.newClient': 'New Client',
      'clients.modal.clientName': 'Client Name',
      'clients.modal.required': '*',
      'clients.modal.placeholders.name': 'Enter client name',
      'clients.modal.clientEmail': 'Email',
      'clients.modal.placeholders.email': 'Enter email address',
      'clients.modal.clientPhone': 'Phone',
      'clients.modal.placeholders.phone': 'Enter phone number',
      'clients.modal.clientAddress': 'Address',
      'clients.modal.placeholders.address': 'Enter address',
      'clients.modal.clientNotes': 'Notes',
      'clients.modal.placeholders.notes': 'Enter notes',
      'clients.modal.cancel': 'Cancel',
      'clients.modal.save': 'Save',
      'clients.modal.saving': 'Saving...',
    };

    let translation = translations[key] || key;

    // Simple parameter replacement
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });

    return translation;
  };

  // Initialize form with client data if in edit mode
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
  }, [client, isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert(t('clients.modal.validation.required'));
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      Logger.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-20' onClose={onClose}>
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
              <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <div className='flex justify-between items-center mb-4'>
                  <Dialog.Title as='h3' className='text-lg font-medium text-gray-900'>
                    {client ? t('clients.modal.editClient') : t('clients.modal.newClient')}
                  </Dialog.Title>
                  <button
                    type='button'
                    className='text-gray-400 hover:text-gray-500'
                    onClick={onClose}
                    disabled={saving}
                  >
                    <XMarkIcon className='h-5 w-5' />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('clients.modal.clientName')}{' '}
                      <span className='text-red-500'>{t('clients.modal.required')}</span>
                    </label>
                    <div className='relative flex items-center'>
                      <input
                        type='text'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                        placeholder={t('clients.modal.placeholders.name')}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {t('clients.modal.clientEmail')}{' '}
                        <span className='text-red-500'>{t('clients.modal.required')}</span>
                      </label>
                      <div className='relative flex items-center'>
                        <input
                          type='email'
                          name='email'
                          value={formData.email}
                          onChange={handleChange}
                          className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                          placeholder={t('clients.modal.placeholders.email')}
                          required
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        {t('clients.modal.clientPhone')}{' '}
                        <span className='text-red-500'>{t('clients.modal.required')}</span>
                      </label>
                      <div className='relative flex items-center'>
                        <input
                          type='tel'
                          name='phone'
                          value={formData.phone}
                          onChange={handleChange}
                          className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                          placeholder={t('clients.modal.placeholders.phone')}
                          required
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('clients.modal.clientAddress')}
                    </label>
                    <div className='relative flex items-center'>
                      <input
                        type='text'
                        name='address'
                        value={formData.address}
                        onChange={handleChange}
                        className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                        placeholder={t('clients.modal.placeholders.address')}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('clients.modal.clientNotes')}
                    </label>
                    <div className='relative flex items-center'>
                      <textarea
                        name='notes'
                        value={formData.notes}
                        onChange={handleChange}
                        rows='3'
                        className='w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
                        placeholder={t('clients.modal.placeholders.notes')}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className='flex justify-end space-x-3'>
                    <button
                      type='button'
                      className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                      onClick={onClose}
                      disabled={saving}
                    >
                      {t('clients.modal.cancel')}
                    </button>
                    <button
                      type='submit'
                      className='px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-500 disabled:bg-blue-300'
                      disabled={saving}
                    >
                      {saving ? t('clients.modal.saving') : t('clients.modal.save')}
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

export default ClientModal;
