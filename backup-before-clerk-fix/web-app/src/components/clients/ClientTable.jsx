import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/**
 * ClientTable component for displaying clients in a table format
 * @param {Object} props - Component props
 * @param {Array} props.clients - Array of client objects to display
 * @param {Function} props.onEdit - Handler for editing a client
 * @param {Function} props.onDelete - Handler for deleting a client
 * @param {Function} props.onCreateQuote - Handler for creating a quote
 * @param {Function} props.onSort - Handler for sorting columns
 * @param {string} props.sortBy - Current sort field
 * @param {string} props.sortOrder - Current sort order ('asc' or 'desc')
 * @param {Function} props.getDisplayName - Function to get client display name
 * @returns {JSX.Element} ClientTable component
 */
const ClientTable = ({
  clients,
  onEdit,
  onDelete,
  onCreateQuote,
  onSort,
  sortBy,
  sortOrder,
  getDisplayName,
}) => {
  const getSortIcon = field => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className='h-4 w-4' />
    ) : (
      <ChevronDownIcon className='h-4 w-4' />
    );
  };

  const formatCurrency = amount => {
    if (!amount) return '€0,00';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = dateString => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getStatusBadge = status => {
    const statusConfig = {
      active: { label: 'Attivo', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inattivo', className: 'bg-red-100 text-red-800' },
      pending: { label: 'In attesa', className: 'bg-yellow-100 text-yellow-800' },
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (clients.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-500 text-lg mb-2'>Nessun cliente trovato</div>
        <div className='text-gray-400 text-sm'>
          Prova a modificare i filtri di ricerca o aggiungi un nuovo cliente
        </div>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
              onClick={() => onSort('name')}
            >
              <div className='flex items-center space-x-1'>
                <span>Nome</span>
                {getSortIcon('name')}
              </div>
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
              onClick={() => onSort('email')}
            >
              <div className='flex items-center space-x-1'>
                <span>Email</span>
                {getSortIcon('email')}
              </div>
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
              onClick={() => onSort('phone')}
            >
              <div className='flex items-center space-x-1'>
                <span>Telefono</span>
                {getSortIcon('phone')}
              </div>
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'
            >
              Stato
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
              onClick={() => onSort('lastActivity')}
            >
              <div className='flex items-center space-x-1'>
                <span>Fatturato</span>
                {getSortIcon('revenue')}
              </div>
            </th>
            <th
              scope='col'
              className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
              onClick={() => onSort('createdAt')}
            >
              <div className='flex items-center space-x-1'>
                <span>Data Creazione</span>
                {getSortIcon('created_at')}
              </div>
            </th>
            <th scope='col' className='relative px-6 py-3'>
              <span className='sr-only'>Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {clients.map(client => (
            <tr key={client.id} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 h-10 w-10'>
                    <div className='h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center'>
                      <span className='text-sm font-medium text-gray-700'>
                        {getDisplayName(client).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className='ml-4'>
                    <div className='text-sm font-medium text-gray-900'>
                      {getDisplayName(client)}
                    </div>
                    {client.address && (
                      <div className='text-sm text-gray-500'>{client.address}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-900'>{client.email || '-'}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-900'>{client.phone || '-'}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>{getStatusBadge(client.status)}</td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-900'>{formatCurrency(client.total_revenue)}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-gray-900'>{formatDate(client.created_at)}</div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => onCreateQuote(client)}
                    className='text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50'
                    title='Crea Preventivo'
                  >
                    <DocumentTextIcon className='h-4 w-4' />
                  </button>
                  <button
                    onClick={() => onEdit(client)}
                    className='text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50'
                    title='Modifica'
                  >
                    <PencilIcon className='h-4 w-4' />
                  </button>
                  <button
                    onClick={() => onDelete(client)}
                    className='text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50'
                    title='Elimina'
                  >
                    <TrashIcon className='h-4 w-4' />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;
