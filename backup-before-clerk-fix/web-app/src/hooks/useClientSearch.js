import { useState, useMemo, useEffect } from 'react';

export function useClientSearch(clients = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [sortBy, setSortBy] = useState('company');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, statusFilter, revenueFilter, sortBy]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(client => {
      const displayName = client.full_name || client.name || 'Cliente';
      return (
        displayName.toLowerCase().includes(query) ||
        (client.email && client.email.toLowerCase().includes(query)) ||
        (client.phone && client.phone.includes(query)) ||
        (client.city && client.city.toLowerCase().includes(query)) ||
        (client.vat_number && client.vat_number.toLowerCase().includes(query))
      );
    });
  }, [clients, searchQuery]);

  // Apply tab filters
  const tabFilteredClients = useMemo(() => {
    switch (activeTab) {
      case 'recent':
        return filteredClients
          .slice()
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 10);
      case 'vip':
        // Assuming VIP clients have some criteria - adjust as needed
        return filteredClients.filter(client => client.vat_number);
      case 'inactive':
        // Assuming inactive clients - adjust criteria as needed
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return filteredClients.filter(
          client => new Date(client.updated_at || client.created_at || 0) < thirtyDaysAgo,
        );
      default:
        return filteredClients;
    }
  }, [filteredClients, activeTab]);

  // Apply status and revenue filters
  const finalFilteredClients = useMemo(() => {
    let result = tabFilteredClients;

    // Apply status filter if needed
    if (statusFilter !== 'all') {
      result = result.filter(client => {
        // Implement status filtering logic based on your requirements
        return true; // Placeholder
      });
    }

    // Apply revenue filter if needed
    if (revenueFilter !== 'all') {
      result = result.filter(client => {
        // Implement revenue filtering logic based on your requirements
        return true; // Placeholder
      });
    }

    return result;
  }, [tabFilteredClients, statusFilter, revenueFilter]);

  // Sort clients
  const sortedClients = useMemo(() => {
    const sorted = [...finalFilteredClients];

    switch (sortBy) {
      case 'company':
        return sorted.sort((a, b) => {
          const nameA = (a.full_name || a.name || 'Cliente').toLowerCase();
          const nameB = (b.full_name || b.name || 'Cliente').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'email':
        return sorted.sort((a, b) => {
          const emailA = (a.email || '').toLowerCase();
          const emailB = (b.email || '').toLowerCase();
          return emailA.localeCompare(emailB);
        });
      case 'phone':
        return sorted.sort((a, b) => {
          const phoneA = a.phone || '';
          const phoneB = b.phone || '';
          return phoneA.localeCompare(phoneB);
        });
      case 'city':
        return sorted.sort((a, b) => {
          const cityA = (a.city || '').toLowerCase();
          const cityB = (b.city || '').toLowerCase();
          return cityA.localeCompare(cityB);
        });
      case 'created_desc':
        return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      case 'created_asc':
        return sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      default:
        return sorted;
    }
  }, [finalFilteredClients, sortBy]);

  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(sortedClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageClients = sortedClients.slice(startIndex, endIndex);

  // Client statistics
  const clientStats = useMemo(() => {
    const total = clients.length;
    const withEmail = clients.filter(client => client.email).length;
    const withPhone = clients.filter(client => client.phone).length;
    const withVat = clients.filter(client => client.vat_number).length;

    return {
      total,
      withEmail,
      withPhone,
      withVat,
      emailPercentage: total > 0 ? Math.round((withEmail / total) * 100) : 0,
      phonePercentage: total > 0 ? Math.round((withPhone / total) * 100) : 0,
      vatPercentage: total > 0 ? Math.round((withVat / total) * 100) : 0,
    };
  }, [clients]);

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    revenueFilter,
    setRevenueFilter,
    sortBy,
    setSortBy,

    // Pagination state
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,

    // Computed data
    filteredClients: sortedClients,
    currentPageClients,
    clientStats,

    // Counts
    totalClients: clients.length,
    filteredCount: sortedClients.length,
  };
}
