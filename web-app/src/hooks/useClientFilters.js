import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing client search and filtering
 * @param {Array} clients - Array of client objects
 * @returns {Object} Filtered clients and filter controls
 */
export const useClientFilters = (clients) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.full_name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query) ||
          client.address?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((client) => {
        switch (statusFilter) {
          case 'active':
            return client.status === 'active' || !client.status;
          case 'inactive':
            return client.status === 'inactive';
          case 'pending':
            return client.status === 'pending';
          default:
            return true;
        }
      });
    }

    // Apply revenue filter
    if (revenueFilter !== 'all') {
      filtered = filtered.filter((client) => {
        const revenue = parseFloat(client.total_revenue || 0);
        switch (revenueFilter) {
          case 'high':
            return revenue >= 10000;
          case 'medium':
            return revenue >= 1000 && revenue < 10000;
          case 'low':
            return revenue < 1000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.full_name || '').toLowerCase();
          bValue = (b.name || b.full_name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'revenue':
          aValue = parseFloat(a.total_revenue || 0);
          bValue = parseFloat(b.total_revenue || 0);
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        default:
          aValue = (a.name || a.full_name || '').toLowerCase();
          bValue = (b.name || b.full_name || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [clients, searchQuery, statusFilter, revenueFilter, sortBy, sortOrder]);

  // Paginate clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const totalItems = filteredAndSortedClients.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRevenueFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  return {
    // Filtered data
    filteredClients: paginatedClients,
    totalFilteredClients: filteredAndSortedClients,
    
    // Filter states
    searchQuery,
    statusFilter,
    revenueFilter,
    sortBy,
    sortOrder,
    
    // Pagination states
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    
    // Filter setters
    setSearchQuery,
    setStatusFilter,
    setRevenueFilter,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setItemsPerPage,
    
    // Helper functions
    handleSort,
    clearFilters,
  };
};