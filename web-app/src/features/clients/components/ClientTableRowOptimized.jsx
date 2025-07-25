import React, { memo, useCallback, useMemo } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import ComponentErrorBoundary from '@shared/components/feedback/ComponentErrorBoundary';
import { useTranslation } from 'react-i18next';

const ClientTableRowOptimized = memo(
  ({ client, onView, onEdit, onDelete, onCreateInvoice, onCreateQuote }) => {
    const { t } = useTranslation('clients');

    // Memoize client status styling
    const statusConfig = useMemo(() => {
      const configs = {
        active: { bg: 'bg-green-100', text: 'text-green-800', label: t('status.active') },
        inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('status.inactive') },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('status.pending') },
      };
      return configs[client.status] || configs.active;
    }, [client.status, t]);

    // Memoize action handlers to prevent unnecessary re-renders
    const handleView = useCallback(() => {
      onView?.(client);
    }, [onView, client]);

    const handleEdit = useCallback(() => {
      onEdit?.(client);
    }, [onEdit, client]);

    const handleDelete = useCallback(() => {
      onDelete?.(client);
    }, [onDelete, client]);

    const handleCreateInvoice = useCallback(() => {
      onCreateInvoice?.(client);
    }, [onCreateInvoice, client]);

    const handleCreateQuote = useCallback(() => {
      onCreateQuote?.(client);
    }, [onCreateQuote, client]);

    // Memoize formatted values
    const formattedPhone = useMemo(() => {
      return client.phone || t('card.notAvailable');
    }, [client.phone, t]);

    const formattedEmail = useMemo(() => {
      return client.email || t('card.notAvailable');
    }, [client.email, t]);

    const formattedCompany = useMemo(() => {
      return client.company || t('card.notAvailable');
    }, [client.company, t]);

    return (
      <ComponentErrorBoundary componentName='ClientTableRow'>
        <tr className='hover:bg-gray-50 transition-colors duration-150'>
          {/* Client Info */}
          <td className='px-6 py-4 whitespace-nowrap'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 h-10 w-10'>
                <img
                  className='h-10 w-10 rounded-full object-cover'
                  src={client.avatar || '/assets/profile.jpg'}
                  alt={`${client.firstName} ${client.lastName}`}
                  loading='lazy'
                />
              </div>
              <div className='ml-4'>
                <div className='text-sm font-medium text-gray-900'>
                  {client.firstName} {client.lastName}
                </div>
                <div className='text-sm text-gray-500'>{formattedCompany}</div>
              </div>
            </div>
          </td>

          {/* Contact Info */}
          <td className='px-6 py-4 whitespace-nowrap'>
            <div className='space-y-1'>
              <div className='flex items-center text-sm text-gray-900'>
                <PhoneIcon className='h-4 w-4 mr-2 text-gray-400' />
                {formattedPhone}
              </div>
              <div className='flex items-center text-sm text-gray-500'>
                <EnvelopeIcon className='h-4 w-4 mr-2 text-gray-400' />
                {formattedEmail}
              </div>
            </div>
          </td>

          {/* Status */}
          <td className='px-6 py-4 whitespace-nowrap'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
            >
              {statusConfig.label}
            </span>
          </td>

          {/* Actions */}
          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
            <div className='flex items-center justify-end space-x-2'>
              {/* Quick Actions */}
              <button
                onClick={handleView}
                className='text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-150'
                title={t('tableRow.viewClient')}
              >
                <EyeIcon className='h-4 w-4' />
              </button>

              <button
                onClick={handleEdit}
                className='text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors duration-150'
                title={t('tableRow.editClient')}
              >
                <PencilIcon className='h-4 w-4' />
              </button>

              <button
                onClick={handleCreateInvoice}
                className='text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-150'
                title={t('tableRow.createInvoice')}
              >
                <DocumentTextIcon className='h-4 w-4' />
              </button>

              <button
                onClick={handleCreateQuote}
                className='text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors duration-150'
                title={t('tableRow.createQuote')}
              >
                <CurrencyEuroIcon className='h-4 w-4' />
              </button>

              <button
                onClick={handleDelete}
                className='text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors duration-150'
                title={t('tableRow.deleteClient')}
              >
                <TrashIcon className='h-4 w-4' />
              </button>

              {/* More Actions Dropdown */}
              <div className='relative'>
                <button className='text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50 transition-colors duration-150'>
                  <EllipsisVerticalIcon className='h-4 w-4' />
                </button>
              </div>
            </div>
          </td>
        </tr>
      </ComponentErrorBoundary>
    );
  },
);

ClientTableRowOptimized.displayName = 'ClientTableRowOptimized';

export default ClientTableRowOptimized;
