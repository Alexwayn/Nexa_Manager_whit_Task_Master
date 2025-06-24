import { useState, useEffect } from 'react';

/**
 * Custom hook for managing client modal states and interactions
 * @returns {Object} Modal states and handlers
 */
export const useClientModals = () => {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRevenueDropdown, setShowRevenueDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Find the closest dropdown element
      const statusDropdown = event.target.closest('[data-dropdown="status"]');
      const revenueDropdown = event.target.closest('[data-dropdown="revenue"]');

      // If click is not on any dropdown, close both
      if (!statusDropdown && !revenueDropdown) {
        setShowStatusDropdown(false);
        setShowRevenueDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open modal for adding a new client
  const handleAddClient = () => {
    setCurrentClient(null);
    setIsClientModalOpen(true);
  };

  // Open modal for editing an existing client
  const handleEditClient = (client, getDisplayName) => {
    // Adapt the client for display and editing
    const adaptedClient = {
      ...client,
      name: getDisplayName ? getDisplayName(client) : client.name || client.full_name || 'Cliente',
    };
    setCurrentClient(adaptedClient);
    setIsClientModalOpen(true);
  };

  // Open confirmation modal for deleting a client
  const handleDeleteClick = (client, getDisplayName) => {
    // Adapt the client for display
    const adaptedClient = {
      ...client,
      name: getDisplayName ? getDisplayName(client) : client.name || client.full_name || 'Cliente',
    };
    setCurrentClient(adaptedClient);
    setIsDeleteModalOpen(true);
  };

  // Open invoice modal for a client
  const handleCreateInvoice = (client, getDisplayName) => {
    const adaptedClient = {
      ...client,
      name: getDisplayName ? getDisplayName(client) : client.name || client.full_name || 'Cliente',
    };
    setCurrentClient(adaptedClient);
    setIsInvoiceModalOpen(true);
  };

  // Open quote modal for a client
  const handleCreateQuote = (client, getDisplayName) => {
    const adaptedClient = {
      ...client,
      name: getDisplayName ? getDisplayName(client) : client.name || client.full_name || 'Cliente',
    };
    setCurrentClient(adaptedClient);
    setIsQuoteModalOpen(true);
  };

  // Close all modals
  const closeAllModals = () => {
    setIsClientModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsInvoiceModalOpen(false);
    setIsQuoteModalOpen(false);
    setCurrentClient(null);
  };

  // Close client modal
  const closeClientModal = () => {
    setIsClientModalOpen(false);
    setCurrentClient(null);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentClient(null);
  };

  // Close invoice modal
  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setCurrentClient(null);
  };

  // Close quote modal
  const closeQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setCurrentClient(null);
  };

  // Toggle status dropdown
  const toggleStatusDropdown = () => {
    setShowStatusDropdown(!showStatusDropdown);
    setShowRevenueDropdown(false); // Close other dropdown
  };

  // Toggle revenue dropdown
  const toggleRevenueDropdown = () => {
    setShowRevenueDropdown(!showRevenueDropdown);
    setShowStatusDropdown(false); // Close other dropdown
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowStatusDropdown(false);
    setShowRevenueDropdown(false);
  };

  return {
    // Modal states
    isClientModalOpen,
    isDeleteModalOpen,
    isInvoiceModalOpen,
    isQuoteModalOpen,
    currentClient,

    // Dropdown states
    showStatusDropdown,
    showRevenueDropdown,

    // Modal handlers
    handleAddClient,
    handleEditClient,
    handleDeleteClick,
    handleCreateInvoice,
    handleCreateQuote,
    closeAllModals,
    closeClientModal,
    closeDeleteModal,
    closeInvoiceModal,
    closeQuoteModal,

    // Dropdown handlers
    toggleStatusDropdown,
    toggleRevenueDropdown,
    closeAllDropdowns,

    // Direct setters (for advanced use cases)
    setIsClientModalOpen,
    setIsDeleteModalOpen,
    setIsInvoiceModalOpen,
    setIsQuoteModalOpen,
    setCurrentClient,
    setShowStatusDropdown,
    setShowRevenueDropdown,

    // Aliases for backward compatibility
    openClientModal: handleAddClient,
    openDeleteModal: handleDeleteClick,
    openInvoiceModal: handleCreateInvoice,
    openQuoteModal: handleCreateQuote,
  };
};