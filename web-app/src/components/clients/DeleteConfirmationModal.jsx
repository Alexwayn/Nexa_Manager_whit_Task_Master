import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, clientName, isDeleting }) => {
  // Placeholder translation function
  const t = (key, params = {}) => {
    const translations = {
      'clients.delete.title': 'Delete Client',
      'clients.delete.message': `Are you sure you want to delete ${params.clientName}? This action cannot be undone.`,
      'clients.delete.cancel': 'Cancel',
      'clients.delete.confirm': 'Delete',
      'clients.delete.deleting': 'Deleting...',
    };
    
    let translation = translations[key] || key;
    
    // Simple parameter replacement
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {t('clients.delete.title')}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    {t('clients.delete.message', { clientName })}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    {t('clients.delete.cancel')}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-500 disabled:bg-red-300"
                    onClick={onConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? t('clients.delete.deleting') : t('clients.delete.confirm')}
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

export default DeleteConfirmationModal;