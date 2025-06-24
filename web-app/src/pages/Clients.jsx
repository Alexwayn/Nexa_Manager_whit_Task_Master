import React, { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

// Custom hooks for separation of concerns
import { useClients } from '@hooks/useClients';
import { useClientSearch } from '@hooks/useClientSearch';

// Import optimized components
import ClientTableRow from '@components/clients/ClientTableRow';
import ClientCard from '@components/clients/ClientCard';
import ClientModal from '@components/clients/ClientModal';
import DeleteConfirmationModal from '@components/clients/DeleteConfirmationModal';
import ErrorBoundary, { withErrorBoundary } from '@components/common/ErrorBoundary';

// Lazy load heavy components for better performance
const ClientFilters = lazy(() => import('@components/clients/ClientFilters'));
const ClientPagination = lazy(() => import('@components/clients/ClientPagination'));
const InvoiceModal = lazy(() => import('@components/clients/InvoiceModal'));

// Loading component for suspense
const LoadingSpinner = ({ className = 'h-8 w-8' }) => (
  <div className='flex items-center justify-center p-4'>
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}></div>
  </div>
);

/**
 * Optimized Clients Page Component
 * Features:
 * - Custom hooks for business logic separation
 * - Lazy loading for performance
 * - Error boundaries for reliability
 * - Memoized components to prevent unnecessary re-renders
 * - Clean UI state management
 */
function Clients() {
  const { t } = useTranslation('clients');
  const navigate = useNavigate();

  // Custom hooks for business logic (separation of concerns)
  const {
    clients,
    loading,
    error,
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    getDisplayName,
  } = useClients();

  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    currentPageClients,
    clientStats,
    filteredCount,
  } = useClientSearch(clients);

  // UI state management (separated from business logic)
  const [viewMode, setViewMode] = useState('table');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleAddClient = useCallback(() => {
    setCurrentClient(null);
    setIsClientModalOpen(true);
  }, []);

  const handleEditClient = useCallback(client => {
    setCurrentClient(client);
    setIsClientModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback(client => {
    setCurrentClient(client);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCreateInvoice = useCallback(client => {
    setCurrentClient(client);
    setIsInvoiceModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (currentClient) {
      const result = await deleteClient(currentClient.id);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setCurrentClient(null);
      }
    }
  }, [currentClient, deleteClient]);

  const handleClientSave = useCallback(
    async clientData => {
      let result;
      if (currentClient) {
        result = await updateClient(currentClient.id, clientData);
      } else {
        result = await createClient(clientData);
      }

      if (result.success) {
        setIsClientModalOpen(false);
        setCurrentClient(null);
      }
      return result;
    },
    [currentClient, updateClient, createClient],
  );

  // Memoized stats calculation
  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter(client => client.status === 'active' || !client.status).length,
      pending: clients.filter(client => client.status === 'pending').length,
      inactive: clients.filter(client => client.status === 'inactive').length,
    }),
    [clients],
  );

  // Memoized tab options
  const tabs = useMemo(
    () => [
      { id: 'all', name: t('tabs.all'), count: stats.total },
      { id: 'active', name: t('tabs.active'), count: stats.active },
      { id: 'pending', name: t('tabs.pending'), count: stats.pending },
      { id: 'inactive', name: t('tabs.inactive'), count: stats.inactive },
    ],
    [t, stats],
  );

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            {t('error.title')}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
          <button
            onClick={refreshClients}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
          >
            {t('error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Header */}
        <div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div className='flex items-center space-x-4'>
                <UserGroupIcon className='h-8 w-8 text-blue-600' />
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>{t('title')}</h1>
              </div>

              <div className='flex items-center space-x-4'>
                {/* Search */}
                <div className='relative'>
                  <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  />
                </div>

                {/* View Mode Toggle */}
                <div className='flex rounded-md border border-gray-300 dark:border-gray-600'>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ListBulletIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Squares2X2Icon className='h-5 w-5' />
                  </button>
                </div>

                {/* Add Client Button */}
                <button
                  onClick={handleAddClient}
                  className='bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 transition-colors'
                >
                  <PlusIcon className='h-4 w-4' />
                  <span>{t('addClient')}</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className='border-b border-gray-200 dark:border-gray-700'>
              <nav className='-mb-px flex space-x-8'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                    <span className='ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs'>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Filters */}
          <Suspense fallback={<LoadingSpinner />}>
            <ClientFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              loading={loading}
              onRefresh={refreshClients}
              totalItems={filteredCount}
            />
          </Suspense>

          {/* Client List */}
          <ErrorBoundary>
            <div className='mt-8'>
              {viewMode === 'table' ? (
                <div className='bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md'>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                      <thead className='bg-gray-50 dark:bg-gray-900'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                            {t('table.client')}
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                            {t('table.contact')}
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                            {t('table.status')}
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                            {t('table.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                        {currentPageClients.map(client => (
                          <ClientTableRow
                            key={client.id}
                            client={client}
                            onEdit={handleEditClient}
                            onDelete={handleDeleteClick}
                            onCreateInvoice={handleCreateInvoice}
                            getDisplayName={getDisplayName}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {currentPageClients.map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={handleEditClient}
                      onDelete={handleDeleteClick}
                      onCreateInvoice={handleCreateInvoice}
                      getDisplayName={getDisplayName}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {currentPageClients.length === 0 && (
                <div className='text-center py-12'>
                  <UserGroupIcon className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                    {filteredCount === 0 ? t('empty.noClients') : t('empty.noResults')}
                  </h3>
                  <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                    {filteredCount === 0 ? t('empty.createFirst') : t('empty.tryDifferentSearch')}
                  </p>
                  {filteredCount === 0 && (
                    <div className='mt-6'>
                      <button
                        onClick={handleAddClient}
                        className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
                      >
                        <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                        {t('addClient')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ErrorBoundary>

          {/* Pagination */}
          {currentPageClients.length > 0 && (
            <Suspense fallback={<LoadingSpinner />}>
              <ClientPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={6}
                totalItems={filteredCount}
                onPageChange={setCurrentPage}
              />
            </Suspense>
          )}
        </div>

        {/* Modals */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          client={currentClient}
          onSave={handleClientSave}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          clientName={currentClient ? getDisplayName(currentClient) : ''}
        />

        <Suspense fallback={<div />}>
          <InvoiceModal
            isOpen={isInvoiceModalOpen}
            onClose={() => setIsInvoiceModalOpen(false)}
            client={currentClient}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

// Export with error boundary HOC for additional protection
export default withErrorBoundary(Clients);
