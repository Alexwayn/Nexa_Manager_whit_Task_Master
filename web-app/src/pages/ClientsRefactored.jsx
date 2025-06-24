import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Custom hooks
import { useClients } from '@hooks/useClients';
import { useClientSearch } from '@hooks/useClientSearch';

// Import components
import ClientTableRow from '@components/clients/ClientTableRow';
import ClientCard from '@components/clients/ClientCard';
import StatCard from '@components/shared/StatCard';
import ConfirmationModal from '@components/shared/ConfirmationModal';
import ViewModeToggle from '@components/shared/ViewModeToggle';

// Import performance and error handling components
import ErrorBoundary from '@components/common/ErrorBoundary';
import ComponentErrorBoundary from '@components/common/ComponentErrorBoundary';
import LazyWrapper from '@components/common/LazyWrapper';
import PerformanceWrapper from '@components/common/PerformanceWrapper';
import Logger from '@utils/Logger';

// Lazy load heavy components
const ClientSearchFilter = lazy(() => import('../components/ClientSearchFilter'));
const ClientHistoryView = lazy(() => import('../components/ClientHistoryView'));
const ClientImportExport = lazy(() => import('../components/ClientImportExport'));

// Logo
import nexaLogo from '@assets/logo_nexa.png';

export default function ClientsRefactored() {
  const navigate = useNavigate();

  // Custom hooks for business logic
  const {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refreshClients,
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

  // UI state
  const [viewMode, setViewMode] = useState('table');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [savingClient, setSavingClient] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  // Event handlers
  const handleAddClient = () => {
    setCurrentClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client) => {
    setCurrentClient(client);
    setIsClientModalOpen(true);
  };

  const handleDeleteClick = (client) => {
    setCurrentClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleCreateInvoice = (client) => {
    setCurrentClient(client);
    setIsInvoiceModalOpen(true);
  };

  const handleCreateQuote = (client) => {
    setCurrentClient(client);
    setIsQuoteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentClient) return;

    setDeletingClient(true);
    try {
      const result = await deleteClient(currentClient.id);
      if (result.success) {
        setIsDeleteModalOpen(false);
        setCurrentClient(null);
      } else {
        Logger.error('Error deleting client:', result.error);
      }
    } catch (error) {
      Logger.error('Error deleting client:', error);
    } finally {
      setDeletingClient(false);
    }
  };

  const tabs = [
    { id: 'all', name: 'Tutti i Clienti', count: clientStats.total },
    { id: 'recent', name: 'Recenti', count: Math.min(10, clientStats.total) },
    { id: 'vip', name: 'VIP', count: clientStats.withVat },
    { id: 'inactive', name: 'Inattivi', count: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-8">
        <p>{error}</p>
        <button
          onClick={refreshClients}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="Errore nella gestione clienti"
      message="Si è verificato un errore nel caricamento della sezione clienti. Riprova o ricarica la pagina."
      showReload={true}
    >
      <PerformanceWrapper componentName="ClientsRefactored">
        <div className="space-y-6">
          {/* Header */}
          <ComponentErrorBoundary componentName="ClientsHeader">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestione Clienti
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredCount} di {clientStats.total} clienti
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    <button
                      onClick={handleAddClient}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Nuovo Cliente
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                      <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </ComponentErrorBoundary>

          {/* Statistics Cards */}
          <ComponentErrorBoundary componentName="ClientsStats">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Totale Clienti"
                value={clientStats.total}
                color="blue"
                icon={UserGroupIcon}
              />
              <StatCard
                title="Con Email"
                value={clientStats.withEmail}
                color="green"
                progress={clientStats.emailPercentage}
              />
              <StatCard
                title="Con Telefono"
                value={clientStats.withPhone}
                color="yellow"
                progress={clientStats.phonePercentage}
              />
              <StatCard
                title="Con P.IVA"
                value={clientStats.withVat}
                color="purple"
                progress={clientStats.vatPercentage}
              />
            </div>
          </ComponentErrorBoundary>

          {/* Search and Filters */}
          <ComponentErrorBoundary componentName="ClientsSearchFilters">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cerca clienti..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="company">Ordina per Nome</option>
                  <option value="email">Ordina per Email</option>
                  <option value="city">Ordina per Città</option>
                  <option value="created_desc">Più Recenti</option>
                  <option value="created_asc">Meno Recenti</option>
                </select>
              </div>
            </div>
          </ComponentErrorBoundary>

          {/* Clients Display */}
          <ComponentErrorBoundary componentName="ClientsDisplay">
            <div>
              {viewMode === 'table' ? (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Telefono
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Città
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          P.IVA
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Creato
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Azioni</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentPageClients.map((client) => (
                        <ClientTableRow
                          key={client.id}
                          client={client}
                          onEdit={handleEditClient}
                          onDelete={handleDeleteClick}
                          onCreateInvoice={handleCreateInvoice}
                          onCreateQuote={handleCreateQuote}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentPageClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={handleEditClient}
                      onDelete={handleDeleteClick}
                      onCreateInvoice={handleCreateInvoice}
                      onCreateQuote={handleCreateQuote}
                    />
                  ))}
                </div>
              )}
            </div>
          </ComponentErrorBoundary>

          {/* Pagination */}
          <ComponentErrorBoundary componentName="ClientsPagination">
            <div>
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Precedente
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Successivo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando <span className="font-medium">{(currentPage - 1) * 6 + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 6, filteredCount)}
                        </span>{' '}
                        di <span className="font-medium">{filteredCount}</span> risultati
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ComponentErrorBoundary>

          {/* Delete Confirmation Modal */}
          <ComponentErrorBoundary componentName="ClientsModals">
            <div>
              <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Conferma eliminazione"
                message="Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata."
                itemName={currentClient ? getDisplayName(currentClient) : ''}
                isLoading={deletingClient}
              />

              {/* TODO: Add the following modals */}
              {/* ClientFormModal */}
              {/* InvoiceModal */}
              {/* QuoteModal */}
            </div>
          </ComponentErrorBoundary>
        </div>
      </PerformanceWrapper>
    </ErrorBoundary>
  );
}
