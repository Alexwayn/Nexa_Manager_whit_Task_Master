import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CalculatorIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ClientCard({ client, onEdit, onDelete, onCreateInvoice, onCreateQuote }) {
  const { t, i18n } = useTranslation(['clients', 'common']);

  // Funzione per ottenere il nome da visualizzare
  const getDisplayName = client => {
    return client.full_name || client.name || t('card.fallbackName');
  };

  // Funzione per generare le iniziali dell'avatar
  const getInitials = name => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const displayName = getDisplayName(client);
  const initials = getInitials(displayName);

  return (
    <div className='bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'>
      <div className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center'>
                <span className='text-base font-medium text-white'>{initials}</span>
              </div>
            </div>
            <div className='ml-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white truncate'>
                {displayName}
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>{client.email}</p>
            </div>
          </div>

          {/* Actions Menu */}
          <Menu as='div' className='relative inline-block text-left'>
            <div>
              <Menu.Button className='inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-2 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
                <EllipsisVerticalIcon className='h-5 w-5' />
              </Menu.Button>
            </div>

            <Menu.Items className='origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10'>
              <div className='py-1'>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onEdit(client)}
                      className={classNames(
                        active
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200',
                        'group flex items-center px-4 py-2 text-sm w-full text-left',
                      )}
                    >
                      <PencilIcon className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500' />
                      {t('actions.edit')}
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onCreateInvoice && onCreateInvoice(client)}
                      className={classNames(
                        active
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200',
                        'group flex items-center px-4 py-2 text-sm w-full text-left',
                      )}
                    >
                      <DocumentTextIcon className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500' />
                      {t('actions.createInvoice')}
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onCreateQuote && onCreateQuote(client)}
                      className={classNames(
                        active
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200',
                        'group flex items-center px-4 py-2 text-sm w-full text-left',
                      )}
                    >
                      <CalculatorIcon className='mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500' />
                      {t('actions.createQuote')}
                    </button>
                  )}
                </Menu.Item>

                <div className='border-t border-gray-100 dark:border-gray-600'></div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onDelete(client)}
                      className={classNames(
                        active
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400'
                          : 'text-red-700 dark:text-red-400',
                        'group flex items-center px-4 py-2 text-sm w-full text-left',
                      )}
                    >
                      <TrashIcon className='mr-3 h-5 w-5 text-red-400 group-hover:text-red-500' />
                      {t('actions.delete')}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>

        {/* Client Info */}
        <div className='mt-4 space-y-2'>
          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
            <PhoneIcon className='h-4 w-4 mr-2' />
            <span>{client.phone || t('card.noPhone')}</span>
          </div>
          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
            <MapPinIcon className='h-4 w-4 mr-2' />
            <span>{client.city || t('card.noCity')}</span>
          </div>
          {client.vat_number && (
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-medium'>{t('card.vatNumber')}</span> {client.vat_number}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='mt-4 flex space-x-2'>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className='flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
              title={t('actions.call')}
            >
              <PhoneIcon className='h-4 w-4 mr-1' />
              {t('actions.call')}
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className='flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
              title={t('history.email')}
            >
              <EnvelopeIcon className='h-4 w-4 mr-1' />
              {t('history.email')}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            {t('card.createdAt')}{' '}
            {client.created_at
              ? new Date(client.created_at).toLocaleDateString(i18n.language)
              : t('card.notAvailable')}
          </div>
        </div>
      </div>
    </div>
  );
}
