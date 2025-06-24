import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName = '',
  confirmText,
  cancelText,
  isLoading = false,
  type = 'danger', // "danger", "warning", "info"
}) {
  const { t } = useTranslation('common');

  const finalTitle = title || t('confirmationModal.title');
  const finalMessage = message || t('confirmationModal.message');
  const finalConfirmText = confirmText || t('confirmationModal.confirmText');
  const finalCancelText = cancelText || t('confirmationModal.cancelText');
  const loadingText = t('confirmationModal.loadingText');

  const typeStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      buttonText: 'text-white',
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      buttonText: 'text-white',
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      buttonText: 'text-white',
    },
  };

  const currentStyle = typeStyles[type] || typeStyles.danger;

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentStyle.iconBg} sm:mx-0 sm:h-10 sm:w-10`}
                  >
                    <ExclamationTriangleIcon className={`h-6 w-6 ${currentStyle.iconColor}`} />
                  </div>
                  <div className="ml-4 text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                    >
                      {finalTitle}
                    </Dialog.Title>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {finalMessage}
                    {itemName && (
                      <>
                        <br />
                        <span className="font-medium text-gray-900 dark:text-white">
                          &quot;{itemName}&quot;
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="mt-6 flex space-x-3 justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {finalCancelText}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent ${currentStyle.buttonBg} px-4 py-2 text-sm font-medium ${currentStyle.buttonText} shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {loadingText}
                      </>
                    ) : (
                      finalConfirmText
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
