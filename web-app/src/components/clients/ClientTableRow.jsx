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

export default function ClientTableRow({
  client,
  onEdit,
  onDelete,
  onCreateInvoice,
  onCreateQuote,
}) {
  const { t, i18n } = useTranslation('clients');

  // Funzione per ottenere il nome da visualizzare
  const getDisplayName = (client) => {
    return client.full_name || client.name || t('card.fallbackName');
  };

  // Funzione per generare le iniziali dell'avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const displayName = getDisplayName(client);
  const initials = getInitials(displayName);

  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">{initials}</span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {client.phone || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {client.city || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {client.vat_number || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {client.created_at ? new Date(client.created_at).toLocaleDateString(i18n.language) : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <div className="flex space-x-1">
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors duration-200"
                title={t('actions.call')}
              >
                <PhoneIcon className="h-4 w-4" />
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400 transition-colors duration-200"
                title={t('history.email')}
              >
                <EnvelopeIcon className="h-4 w-4" />
              </a>
            )}
            {client.city && (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(client.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
                title={t('actions.map')}
              >
                <MapPinIcon className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Actions Menu */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-2 py-1 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Menu.Button>
            </div>

            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
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
                        <PencilIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
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
                        <DocumentTextIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
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
                        <CalculatorIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                        {t('actions.createQuote')}
                      </button>
                    )}
                  </Menu.Item>

                  <div className="border-t border-gray-100 dark:border-gray-600"></div>

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
                        <TrashIcon className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
                        {t('actions.delete')}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
          </Menu>
        </div>
      </td>
    </tr>
  );
}
