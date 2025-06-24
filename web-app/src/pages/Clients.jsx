import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@context/AuthContext';
import { supabase } from '@lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useClientFilters } from '../hooks/useClientFilters';
import { useClientModals } from '../hooks/useClientModals';
import ClientTable from '../components/clients/ClientTable';
import ClientFilters from '../components/clients/ClientFilters';
import ClientPagination from '../components/clients/ClientPagination';
import ClientModal from '../components/clients/ClientModal';
import DeleteConfirmationModal from '../components/clients/DeleteConfirmationModal';
import InvoiceModal from '../components/clients/InvoiceModal';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
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
  ChartBarIcon,
  BellIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ChartPieIcon,
  DocumentArrowDownIcon,
  PresentationChartBarIcon,
  ArrowPathIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';

export default function Clients() {
  const { t } = useTranslation('clients');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use extracted hooks
  const {
    clients,
    loading,
    savingClient,
    deletingClient,
    refreshClients,
    saveClient,
    deleteClient,
    generateId,
    getDisplayName
  } = useClients();
  
  const {
    filteredClients,
    totalFilteredClients,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    revenueFilter,
    setRevenueFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    clearFilters
  } = useClientFilters(clients);
  
  const {
    isClientModalOpen,
    setIsClientModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    currentClient,
    setCurrentClient,
    showStatusDropdown,
    setShowStatusDropdown,
    showRevenueDropdown,
    setShowRevenueDropdown,
    openClientModal,
    openDeleteModal,
    openInvoiceModal,
    openQuoteModal,
    closeAllModals
  } = useClientModals();

  // Modal close handlers
  const closeClientModal = () => {
    setIsClientModalOpen(false);
    setCurrentClient(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentClient(null);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setCurrentClient(null);
  };

  const closeQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setCurrentClient(null);
  };
  
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  const [activeTab, setActiveTab] = useState('all');

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

  // Handler functions using extracted hooks
  const handleAddClient = () => openClientModal(null);
  const handleEditClient = (client) => openClientModal(client);
  
  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  const handleDeleteClick = (client) => openDeleteModal(client);
  const handleCreateInvoice = (client) => openInvoiceModal(client);
  const handleCreateQuote = (client) => openQuoteModal(client);

  // Delete client using extracted hook
  const confirmDelete = async () => {
    if (!currentClient?.id) {
      closeAllModals();
      return;
    }
    await deleteClient(currentClient.id);
    closeAllModals();
  };

  // Save client using extracted hook
  const handleSaveClient = async (clientData) => {
    const success = await saveClient(clientData, currentClient?.id);
    if (success) {
      closeAllModals();
    }
  };

  // Duplicate function removed - handleCreateInvoice already defined at line 118

  // Duplicate function removed - handleCreateQuote already defined at line 119

  // Salva una nuova fattura
  const handleSaveInvoice = (invoiceData) => {
    // In una implementazione reale, qui si salverebbe la fattura nel database
    Logger.info('Nuova fattura creata:', invoiceData);
    alert(`Fattura creata con successo per ${currentClient.name}`);
    setIsInvoiceModalOpen(false);
  };

  // Salva un nuovo preventivo
  const handleSaveQuote = (quoteData) => {
    // In una implementazione reale, qui si salverebbe il preventivo nel database
    Logger.info('Nuovo preventivo creato:', quoteData);
    alert(`Preventivo creato con successo per ${currentClient.name}`);
    setIsQuoteModalOpen(false);
  };

  // Cambia modalità visualizzazione
  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'grid' ? 'table' : 'grid'));
  };

  // Funzione per ottenere le iniziali da un nome
  const getInitials = (name) => {
    // Gestione nome mancante
    if (!name) {
      // Cerca altri campi nome nel cliente
      return 'CN'; // Cliente Nuovo
    }

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 1);
  };

  // getDisplayName function is imported from useClients hook

  // Calculate client statistics
  const getClientStats = () => {
    const total = clients.length;
    const active = clients.filter(client => client.status === 'active' || !client.status).length;
    const pending = clients.filter(client => client.status === 'pending').length;
    const inactive = clients.filter(client => client.status === 'inactive').length;
    
    return { total, active, pending, inactive };
  };

  // Get filtered clients by active tab
  const getFilteredClientsByTab = () => {
    switch (activeTab) {
      case 'active':
        return filteredClients.filter(client => client.status === 'active' || !client.status);
      case 'pending':
        return filteredClients.filter(client => client.status === 'pending');
      case 'inactive':
        return filteredClients.filter(client => client.status === 'inactive');
      default:
        return filteredClients;
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Use filtered data from hooks
  const stats = getClientStats();
  const currentClients = filteredClients;
  const getCurrentPageClients = () => filteredClients;
  const getTotalPages = () => totalPages;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border-b border-gray-200 px-6 py-3 flex items-center space-x-2">
        <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600 text-sm">{t('breadcrumb')}</span>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 px-6 py-6">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
              {/* Search Bar */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-56 focus-within:border-gray-300 focus-within:bg-white">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none border-none focus:ring-0 focus:border-none bg-transparent text-gray-600 text-sm placeholder-gray-400"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </div>
            <button
              onClick={handleAddClient}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{t('addClient')}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('all')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.all')} ({stats.total})
              </button>
              <button
                onClick={() => handleTabChange('active')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.active')} ({stats.active})
              </button>
              <button
                onClick={() => handleTabChange('pending')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.pending')} ({stats.pending})
              </button>
              <button
                onClick={() => handleTabChange('inactive')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'inactive'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.inactive')} ({stats.inactive})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <ClientFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            revenueFilter={revenueFilter}
            onRevenueFilterChange={setRevenueFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeToggle={toggleViewMode}
            loading={loading}
            onRefresh={refreshClients}
            onClearFilters={clearFilters}
            totalItems={getFilteredClientsByTab().length}
          />

          {/* Table or Card View */}
          {viewMode === 'table' ? (
            <>
              <ClientTable
                clients={currentClients}
                onEdit={openClientModal}
                onDelete={openDeleteModal}
                onCreateQuote={openQuoteModal}
                sortBy={sortBy}
                onSort={setSortBy}
              />
              <ClientPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredClients.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </>
          ) : (
            /* Card View */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {currentClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={openClientModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
              <ClientPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredClients.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
          {/* Client Statistics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Statistics</h3>

            <div className="space-y-4">
              <StatCard title="Total Clients" value={stats.total} color="blue" progress={100} />
              <StatCard
                title="Active Clients"
                value={stats.active}
                color="green"
                progress={(stats.active / stats.total) * 100}
              />
              <StatCard
                title="Pending Clients"
                value={stats.pending}
                color="yellow"
                progress={(stats.pending / stats.total) * 100}
              />
              <StatCard
                title="Inactive Clients"
                value={stats.inactive}
                color="red"
                progress={(stats.inactive / stats.total) * 100}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleAddClient}
                className="w-full bg-blue-600 text-white rounded-md py-3 flex items-center justify-center space-x-2 text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add New Client</span>
              </button>
              <button className="w-full border border-gray-300 text-gray-700 rounded-md py-3 flex items-center justify-center space-x-2 text-sm font-medium">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export Client List</span>
              </button>
              <button className="w-full border border-gray-300 text-gray-700 rounded-md py-3 flex items-center justify-center space-x-2 text-sm font-medium">
                <PresentationChartBarIcon className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>

          {/* Industry Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <IndustryItem name="Technology" count={12} percentage={32} color="blue" />
              <IndustryItem name="Manufacturing" count={8} percentage={21} color="green" />
              <IndustryItem name="Finance" count={6} percentage={16} color="yellow" />
              <IndustryItem name="Healthcare" count={5} percentage={13} color="purple" />
              <IndustryItem name="Retail" count={4} percentage={10} color="red" />
              <IndustryItem name="Other" count={3} percentage={8} color="gray" />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={closeClientModal}
        onSave={saveClient}
        client={currentClient}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteClient}
        clientName={currentClient?.name || currentClient?.full_name || 'Cliente'}
        isDeleting={loading}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        onSave={handleSaveInvoice}
        client={currentClient}
      />

      {/* Footer */}
      <Footer />

      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSave={handleSaveQuote}
        client={currentClient}
      />
    </div>
  );
}

// Componente per le righe della tabella
const ClientRow = ({ client, onEdit, onDelete }) => {
  const getDisplayName = (client) => {
    return client.name || client.full_name || client.email || 'Cliente';
  };

  const getStatusBadge = (status) => {
    const actualStatus = status || 'active';

    switch (actualStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            Active
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center space-x-4">
        <input type="checkbox" className="rounded border-gray-300" />
        <div className="flex-1 grid grid-cols-8 gap-4 items-center">
          {/* Company */}
          <div className="col-span-2 flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {getInitials(getDisplayName(client))}
            </div>
            <div>
              <div className="font-medium text-gray-900">{getDisplayName(client)}</div>
            </div>
          </div>

          {/* Industry */}
          <div className="text-gray-900">{client.industry || 'Technology'}</div>

          {/* Status */}
          <div>{getStatusBadge(client.status)}</div>

          {/* Location */}
          <div className="text-gray-600">{client.address || client.city || 'N/A'}</div>

          {/* Last Contact */}
          <div className="text-gray-600">{client.last_contact || '2 days ago'}</div>

          {/* Revenue */}
          <div className="font-medium text-gray-900">${client.revenue || '45,200'}</div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button onClick={() => onEdit(client)} className="text-gray-400 hover:text-gray-600">
              <PencilIcon className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <EyeIcon className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <EnvelopeIcon className="h-5 w-5" />
            </button>
            <button onClick={() => onDelete(client)} className="text-gray-400 hover:text-red-600">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente per la visualizzazione card dei clienti
const ClientCard = ({ client, onEdit, onDelete }) => {
  const getDisplayName = (client) => {
    return client.name || client.full_name || client.email || 'Cliente';
  };

  const getStatusBadge = (status) => {
    const actualStatus = status || 'active';

    switch (actualStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            Active
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (initial) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-amber-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const displayName = getDisplayName(client);
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(initials);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg`}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-500">Technology</p>
          </div>
        </div>
        {getStatusBadge(client.status)}
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {client.phone}
          </div>
        )}
        {client.address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {client.address}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-900">Last Contact</div>
          <div className="text-xs text-gray-500">2 days ago</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-900">Revenue</div>
          <div className="text-xs text-gray-500">$45,000</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(client)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Invoice
          </button>
          <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
            Quote
          </button>
        </div>
        <div className="flex space-x-2">
          <button className="text-gray-400 hover:text-gray-600">
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <EnvelopeIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onDelete(client)} className="text-gray-400 hover:text-red-600">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente per le statistiche
const StatCard = ({ title, value, color, progress }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const progressClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600 text-sm">{title}</span>
        <span className={`font-medium ${colorClasses[color]}`}>{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${progressClasses[color]}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// Componente per l'industry breakdown
const IndustryItem = ({ name, count, percentage, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-600">{name}</span>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{count}</span>
          <span className="text-sm text-gray-500">{percentage}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// ClientModal is imported from '../components/clients/ClientModal'

// DeleteConfirmationModal is imported from '../components/clients/DeleteConfirmationModal'

// InvoiceModal è importato da '../components/clients/InvoiceModal'

// Componente Modal per la creazione di un preventivo
const QuoteModal = ({ isOpen, onClose, onSave, client }) => {
  const today = new Date().toISOString().split('T')[0]; // Data odierna in formato YYYY-MM-DD

  const [formData, setFormData] = useState({
    quoteNumber: '',
    date: today,
    validUntil: '',
    amount: '',
    description: '',
    items: [{ description: '', quantity: 1, price: '', total: '' }],
  });

  // Aggiorna il form quando viene aperto il modal
  useEffect(() => {
    if (isOpen && client) {
      const quoteNumber = `PREV-${Date.now().toString().slice(-6)}`;

      // Calcola data di validità predefinita (30 giorni)
      const validUntilObj = new Date();
      validUntilObj.setDate(validUntilObj.getDate() + 30);
      const validUntil = validUntilObj.toISOString().split('T')[0];

      setFormData({
        quoteNumber,
        date: today,
        validUntil,
        amount: '',
        description: `Preventivo per ${client.name}`,
        items: [{ description: 'Servizio', quantity: 1, price: '', total: '' }],
      });
    }
  }, [isOpen, client, today]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Aggiorna il totale se cambiano quantità o prezzo
    if (field === 'quantity' || field === 'price') {
      const quantity =
        field === 'quantity'
          ? parseFloat(value) || 0
          : parseFloat(updatedItems[index].quantity) || 0;
      const price =
        field === 'price' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].total = (quantity * price).toFixed(2);
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    // Aggiorna l'importo totale
    const total = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      amount: total.toFixed(2),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: '', total: '' }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);

      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));

      // Aggiorna l'importo totale
      const total = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
      setFormData((prev) => ({
        ...prev,
        amount: total.toFixed(2),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validazione base
    if (!formData.quoteNumber || !formData.date || !formData.validUntil || !formData.amount) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    onSave({
      ...formData,
      clientId: client?.id,
      clientName: client?.name,
    });
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Crea Preventivo per {client?.name}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numero Preventivo <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          name="quoteNumber"
                          value={formData.quoteNumber}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Importo Totale <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Emissione <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valido Fino <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          name="validUntil"
                          value={formData.validUntil}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione
                    </label>
                    <div className="relative flex items-center">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Dettaglio Articoli</h4>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm bg-gray-100 py-1 px-2 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        + Aggiungi voce
                      </button>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Descrizione
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20"
                            >
                              Qtà
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32"
                            >
                              Prezzo
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32"
                            >
                              Totale
                            </th>
                            <th scope="col" className="px-3 py-2 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(index, 'description', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm"
                                    placeholder="Descrizione articolo"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(index, 'quantity', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) =>
                                      handleItemChange(index, 'price', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={item.total}
                                    readOnly
                                    className="w-full pl-10 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                  disabled={formData.items.length <= 1}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Crea Preventivo
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
