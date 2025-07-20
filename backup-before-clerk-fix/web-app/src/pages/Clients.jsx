import React, { useState, lazy, Suspense, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  TableCellsIcon,
  HomeIcon,
  ChevronRightIcon as BreadcrumbChevronIcon,
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';

// Custom hooks for separation of concerns
import { useClients } from '@hooks/useClients';

// Import optimized components
import ClientModal from '@components/clients/ClientModal';
import DeleteConfirmationModal from '@components/clients/DeleteConfirmationModal';
import ErrorBoundary, { withErrorBoundary } from '@components/common/ErrorBoundary';

// Import services for export and reporting
import clientService from '@lib/clientService';
import { notify } from '@lib/uiUtils';
import Logger from '@utils/Logger';

// Lazy load heavy components for better performance
const InvoiceModal = lazy(() => import('@components/clients/InvoiceModal'));

// Loading component for suspense
const LoadingSpinner = ({ className = 'h-8 w-8' }) => (
  <div className='flex items-center justify-center p-4'>
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}></div>
  </div>
);

// Utility functions
const getDisplayName = client => {
  return (
    client.company_name ||
    client.name ||
    client.first_name + ' ' + client.last_name ||
    'Unknown Client'
  );
};

const getInitials = name => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const formatRevenue = amount => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatLastContact = (date, t) => {
  if (!date) return '-';
  const now = new Date();
  const contactDate = new Date(date);
  const diffTime = Math.abs(now - contactDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return t('time.today', 'Today');
  if (diffDays === 2) return t('time.yesterday', 'Yesterday');
  if (diffDays <= 7) return t('time.daysAgo', '{{count}} days ago', { count: diffDays });
  return contactDate.toLocaleDateString();
};

// Status Badge Component
const StatusBadge = ({ status, t }) => {
  const getStatusStyles = status => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800'; // Default to active
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'active':
        return t('status.active', 'Active');
      case 'pending':
        return t('status.pending', 'Pending');
      case 'inactive':
        return t('status.inactive', 'Inactive');
      default:
        return t('status.active', 'Active');
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-metric-small font-medium ${getStatusStyles(status)}`}
    >
      {getStatusText(status)}
    </span>
  );
};

// Client Card Component for grid view
const ClientCard = ({
  client,
  getDisplayName,
  getInitials,
  formatRevenue,
  formatLastContact,
  t,
  onEdit,
  onDelete,
  onCreateInvoice,
  onPhoneCall,
  onSendEmail,
}) => {
  const displayName = getDisplayName(client);
  const initials = getInitials(displayName);

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
      {/* Header with avatar and name */}
      <div className='flex items-center mb-4'>
        <div className='flex-shrink-0 h-12 w-12'>
          <div className='h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center'>
            <span className='text-nav-text font-medium text-white'>{initials}</span>
          </div>
        </div>
        <div className='ml-4 flex-1 min-w-0'>
          <h3 className='text-card-title text-gray-900 truncate'>{displayName}</h3>
          <p className='text-subtitle text-gray-500 truncate'>{client.email}</p>
        </div>
        <div className='ml-2'>
          <StatusBadge status={client.status} t={t} />
        </div>
      </div>

      {/* Details */}
      <div className='space-y-3 mb-4'>
        <div className='flex justify-between text-nav-text'>
          <span className='text-gray-500'>{t('table.industry', 'Industry')}:</span>
          <span className='text-gray-900 font-medium'>{client.industry || 'Technology'}</span>
        </div>
        <div className='flex justify-between text-nav-text'>
          <span className='text-gray-500'>{t('table.location', 'Location')}:</span>
          <span className='text-gray-900'>
            {client.city || client.location || 'San Francisco, CA'}
          </span>
        </div>
        <div className='flex justify-between text-nav-text'>
          <span className='text-gray-500'>{t('table.revenue', 'Revenue')}:</span>
          <span className='text-gray-900 font-semibold'>{formatRevenue(client.revenue || 0)}</span>
        </div>
        <div className='flex justify-between text-nav-text'>
          <span className='text-gray-500'>{t('sort.lastContact')}:</span>
          <span className='text-gray-900'>
            {formatLastContact(client.last_contact || client.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
        <div className='flex items-center space-x-2'>
          {client.phone && (
            <button
              className='p-2 text-gray-400 hover:text-blue-500 rounded-md hover:bg-gray-100'
              title={t('actions.call')}
              onClick={() => onPhoneCall(client)}
            >
              <PhoneIcon className='h-4 w-4' />
            </button>
          )}
          {client.email && (
            <button
              className='p-2 text-gray-400 hover:text-green-500 rounded-md hover:bg-gray-100'
              title={t('actions.sendEmail')}
              onClick={() => onSendEmail(client)}
            >
              <EnvelopeIcon className='h-4 w-4' />
            </button>
          )}
          <button
            className='p-2 text-gray-400 hover:text-purple-500 rounded-md hover:bg-gray-100'
            title={t('actions.createInvoice')}
            onClick={() => onCreateInvoice(client)}
          >
            <DocumentTextIcon className='h-4 w-4' />
          </button>
        </div>
        <div className='flex items-center space-x-1'>
          <button
            className='px-3 py-1 text-button-text font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
            onClick={() => onEdit(client)}
          >
            {t('actions.edit')}
          </button>
          <button
            className='p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50'
            onClick={() => onDelete(client)}
            title={t('actions.deleteClient', 'Elimina cliente')}
          >
            <TrashIcon className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

// Client Statistics Sidebar Component
const ClientStatistics = ({ clients, t, onAddClient, onExportList, onGenerateReport }) => {
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(client => client.status === 'active' || !client.status).length;
    const pending = clients.filter(client => client.status === 'pending').length;
    const inactive = clients.filter(client => client.status === 'inactive').length;

    // Industry breakdown
    const industries = clients.reduce((acc, client) => {
      const industry = client.industry || 'other';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {});

    const industryBreakdown = Object.entries(industries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([industry, count]) => ({
        name: industry,
        count,
        percentage: Math.round((count / total) * 100),
      }));

    return { total, active, pending, inactive, industryBreakdown };
  }, [clients]);

  const getIndustryColor = index => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-gray-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className='w-80 bg-white border-l border-gray-200 p-6'>
      <h2 className='text-section-title text-gray-900 mb-6'>
        {t('statistics.title', 'Client Statistics')}
      </h2>

      {/* Total Clients */}
      <div className='mb-6'>
        <div className='text-card-metric font-bold text-gray-900'>{stats.total}</div>
        <div className='text-subtitle text-gray-500'>
          {t('statistics.totalClients', 'Total Clients')}
        </div>
        <div className='mt-2 h-2 bg-gray-200 rounded-full'>
          <div className='h-2 bg-blue-500 rounded-full' style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className='space-y-4 mb-8'>
        <div className='flex justify-between items-center'>
          <span className='text-subtitle text-gray-600'>
            {t('statistics.activeClients', 'Active Clients')}
          </span>
          <span className='text-nav-text font-semibold text-gray-900'>{stats.active}</span>
        </div>
        <div className='h-2 bg-gray-200 rounded-full'>
          <div
            className='h-2 bg-green-500 rounded-full'
            style={{ width: `${(stats.active / stats.total) * 100}%` }}
          ></div>
        </div>

        <div className='flex justify-between items-center'>
          <span className='text-subtitle text-gray-600'>
            {t('statistics.pendingClients', 'Pending Clients')}
          </span>
          <span className='text-nav-text font-semibold text-gray-900'>{stats.pending}</span>
        </div>
        <div className='h-2 bg-gray-200 rounded-full'>
          <div
            className='h-2 bg-yellow-500 rounded-full'
            style={{ width: `${(stats.pending / stats.total) * 100}%` }}
          ></div>
        </div>

        <div className='flex justify-between items-center'>
          <span className='text-subtitle text-gray-600'>
            {t('statistics.inactiveClients', 'Inactive Clients')}
          </span>
          <span className='text-nav-text font-semibold text-gray-900'>{stats.inactive}</span>
        </div>
        <div className='h-2 bg-gray-200 rounded-full'>
          <div
            className='h-2 bg-red-500 rounded-full'
            style={{ width: `${(stats.inactive / stats.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Industry Breakdown */}
      <div>
        <h3 className='text-nav-text font-medium text-gray-900 mb-4'>
          {t('statistics.industryBreakdown', 'Industry Breakdown')}
        </h3>
        <div className='space-y-3'>
          {stats.industryBreakdown.map((industry, index) => (
            <div key={industry.name} className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className={`w-3 h-3 rounded-full mr-3 ${getIndustryColor(index)}`}></div>
                <span className='text-subtitle text-gray-600'>
                  {t(`industry.${industry.name}`, industry.name)}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-nav-text font-semibold text-gray-900'>{industry.count}</span>
                <span className='text-metric-small text-gray-500'>{industry.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mt-8 space-y-3'>
        <button
          onClick={onAddClient}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-button-text font-medium hover:bg-blue-700 transition-colors flex items-center justify-center'
        >
          <UserGroupIcon className='w-4 h-4 mr-2' />
          {t('statistics.addNewClient', 'Add New Client')}
        </button>
        <button
          onClick={onExportList}
          className='w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-button-text font-medium hover:bg-gray-50 transition-colors flex items-center justify-center'
        >
          <ArrowDownTrayIcon className='w-4 h-4 mr-2' />
          {t('statistics.exportList', 'Export Client List')}
        </button>
        <button
          onClick={onGenerateReport}
          className='w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-button-text font-medium hover:bg-gray-50 transition-colors flex items-center justify-center'
        >
          <DocumentChartBarIcon className='w-4 h-4 mr-2' />
          {t('statistics.generateReport', 'Generate Report')}
        </button>
      </div>
    </div>
  );
};

/**
 * Modern Clients Page Component with full translation support
 */
function Clients() {
  const { t } = useTranslation(['clients', 'common']);
  const navigate = useNavigate();

  // View mode state (table or card)
  const [viewMode, setViewMode] = useState('table');

  // Custom hooks for business logic
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

  // Remove the useClientSearch hook and implement filtering directly
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('company_name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // UI state management
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // Add filter dropdown state
  const [filters, setFilters] = useState({
    industry: '',
    status: '',
    revenue: '',
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, filters, sortBy]);

  // Implement proper filtering logic that works with demo data
  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => {
        const displayName = getDisplayName(client).toLowerCase();
        return (
          displayName.includes(query) ||
          (client.email && client.email.toLowerCase().includes(query)) ||
          (client.phone && client.phone.includes(query)) ||
          (client.city && client.city.toLowerCase().includes(query)) ||
          (client.industry && client.industry.toLowerCase().includes(query))
        );
      });
    }

    // Apply tab filter
    if (activeTab !== 'all') {
      result = result.filter(client => {
        const status = client.status || 'active';
        return status === activeTab;
      });
    }

    // Apply industry filter
    if (filters.industry) {
      result = result.filter(client => {
        const clientIndustry = client.industry || 'other';
        return clientIndustry.toLowerCase() === filters.industry.toLowerCase();
      });
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(client => {
        const status = client.status || 'active';
        return status === filters.status;
      });
    }

    // Apply revenue filter
    if (filters.revenue) {
      result = result.filter(client => {
        const revenue = client.revenue || 0;
        switch (filters.revenue) {
          case '0-10000':
            return revenue >= 0 && revenue <= 10000;
          case '10000-50000':
            return revenue > 10000 && revenue <= 50000;
          case '50000-100000':
            return revenue > 50000 && revenue <= 100000;
          case '100000+':
            return revenue > 100000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'company_name':
          return getDisplayName(a).localeCompare(getDisplayName(b));
        case 'created_at':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'last_contact':
          return (
            new Date(b.last_contact || b.created_at || 0) -
            new Date(a.last_contact || a.created_at || 0)
          );
        case 'revenue':
          return (b.revenue || 0) - (a.revenue || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [clients, searchQuery, activeTab, filters, sortBy, getDisplayName]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedClients.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageClients = filteredAndSortedClients.slice(startIndex, startIndex + itemsPerPage);

  // Calculate stats for the current filtered data
  const stats = useMemo(() => {
    const allClients = clients;
    const total = allClients.length;
    const active = allClients.filter(client => (client.status || 'active') === 'active').length;
    const pending = allClients.filter(client => client.status === 'pending').length;
    const inactive = allClients.filter(client => client.status === 'inactive').length;

    return { total, active, pending, inactive };
  }, [clients]);

  // Tab options with counts
  const tabs = useMemo(
    () => [
      { id: 'all', name: t('tabs.all'), count: stats.total },
      { id: 'active', name: t('tabs.active'), count: stats.active },
      { id: 'pending', name: t('tabs.pending'), count: stats.pending },
      { id: 'inactive', name: t('tabs.inactive'), count: stats.inactive },
    ],
    [stats, t],
  );

  // Event handlers
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
    console.log('🗑️ Delete confirmation started');
    console.log('Current client:', currentClient);

    if (currentClient) {
      console.log('🔄 Calling deleteClient for ID:', currentClient.id);
      const result = await deleteClient(currentClient.id);
      console.log('📝 Delete result:', result);

      if (result.success) {
        console.log('✅ Delete successful, closing modal');
        setIsDeleteModalOpen(false);
        setCurrentClient(null);
      } else {
        console.error('❌ Delete failed:', result.error);
        // Show error notification if available
        notify.error('Error deleting client: ' + result.error);
      }
    } else {
      console.error('❌ No current client selected for deletion');
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

  // Handle invoice save
  const handleInvoiceSave = useCallback(async invoiceData => {
    try {
      console.log('💰 Invoice created successfully:', invoiceData);
      // Here you would typically save to a database
      // For now, just show success message and close modal
      setIsInvoiceModalOpen(false);
      setCurrentClient(null);

      // Show success notification
      notify.success('Invoice created successfully!');

      return { success: true };
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      notify.error('Error creating invoice: ' + error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Handle phone call
  const handlePhoneCall = useCallback(client => {
    console.log('📞 Calling client:', client);
    console.log('📞 Client phone data:', {
      phone: client.phone,
      mobile: client.mobile,
      telephone: client.telephone,
    });

    const phoneNumber = client.phone || client.mobile || client.telephone;

    if (!phoneNumber) {
      notify.warning('No phone number available for this client');
      console.log('❌ No phone number found in client data');
      return;
    }

    // Create tel: link to trigger phone call
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, ''); // Clean phone number
    const telLink = `tel:${cleanPhoneNumber}`;

    try {
      window.open(telLink, '_self');
      notify.success(`Calling ${getDisplayName(client)}...`);
    } catch (error) {
      console.error('Error making phone call:', error);
      // Fallback: copy phone number to clipboard
      navigator.clipboard
        .writeText(phoneNumber)
        .then(() => {
          notify.info(`Phone number copied to clipboard: ${phoneNumber}`);
        })
        .catch(() => {
          notify.info(`Phone: ${phoneNumber}`);
        });
    }
  }, []);

  // Handle send email
  const handleSendEmail = useCallback(client => {
    console.log('📧 Sending email to client:', client);
    console.log('📧 Client email data:', {
      email: client.email,
      contact_email: client.contact_email,
    });

    const emailAddress = client.email || client.contact_email;

    if (!emailAddress) {
      notify.warning('No email address available for this client');
      console.log('❌ No email address found in client data');
      return;
    }

    // Create mailto link
    const subject = encodeURIComponent(`Message for ${getDisplayName(client)}`);
    const body = encodeURIComponent(`Hello ${getDisplayName(client)},\n\n`);
    const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${body}`;

    try {
      window.open(mailtoLink, '_self');
      notify.success(`Opening email to ${getDisplayName(client)}...`);
    } catch (error) {
      console.error('Error opening email client:', error);
      // Fallback: copy email to clipboard
      navigator.clipboard
        .writeText(emailAddress)
        .then(() => {
          notify.info(`Email address copied to clipboard: ${emailAddress}`);
        })
        .catch(() => {
          notify.info(`Email: ${emailAddress}`);
        });
    }
  }, []);

  // Export clients to CSV
  const handleExportList = useCallback(async () => {
    try {
      if (clients.length === 0) {
        notify.warning(t('actions.exportData') + ' - ' + t('empty.noClients'));
        return;
      }

      // Use the filtered clients for export
      const clientsToExport =
        filteredAndSortedClients.length > 0 ? filteredAndSortedClients : clients;

      // Create CSV content
      const headers = [
        'Company Name',
        'Email',
        'Phone',
        'Industry',
        'Status',
        'City',
        'Revenue',
        'Created Date',
        'Last Contact',
      ];

      const csvRows = [
        headers.join(','),
        ...clientsToExport.map(client =>
          [
            `"${getDisplayName(client)}"`,
            `"${client.email || ''}"`,
            `"${client.phone || ''}"`,
            `"${client.industry || ''}"`,
            `"${client.status || 'active'}"`,
            `"${client.city || client.location || ''}"`,
            `"${client.revenue || 0}"`,
            `"${client.created_at ? new Date(client.created_at).toLocaleDateString() : ''}"`,
            `"${client.last_contact ? new Date(client.last_contact).toLocaleDateString() : ''}"`,
          ].join(','),
        ),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clienti_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify.success(
        t('actions.exportData') +
          ' - ' +
          t('pagination.showing', 'Exported {{count}} clients', { count: clientsToExport.length }),
      );
    } catch (error) {
      Logger.error('Export error:', error);
      notify.error(t('actions.exportData') + ' - Error: ' + error.message);
    }
  }, [clients, filteredAndSortedClients, getDisplayName, t]);

  // Generate client report
  const handleGenerateReport = useCallback(async () => {
    try {
      if (clients.length === 0) {
        notify.warning(t('statistics.generateReport') + ' - ' + t('empty.noClients'));
        return;
      }

      const reportData = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active' || !c.status).length,
        pendingClients: clients.filter(c => c.status === 'pending').length,
        inactiveClients: clients.filter(c => c.status === 'inactive').length,
        industries: clients.reduce((acc, client) => {
          const industry = client.industry || 'other';
          acc[industry] = (acc[industry] || 0) + 1;
          return acc;
        }, {}),
        totalRevenue: clients.reduce((sum, client) => sum + (client.revenue || 0), 0),
        averageRevenue:
          clients.length > 0
            ? clients.reduce((sum, client) => sum + (client.revenue || 0), 0) / clients.length
            : 0,
        generatedAt: new Date().toISOString(),
      };

      // Create a simple text report
      const reportLines = [
        '='.repeat(50),
        `CLIENT REPORT - ${new Date().toLocaleDateString()}`,
        '='.repeat(50),
        '',
        'SUMMARY:',
        `Total Clients: ${reportData.totalClients}`,
        `Active Clients: ${reportData.activeClients}`,
        `Pending Clients: ${reportData.pendingClients}`,
        `Inactive Clients: ${reportData.inactiveClients}`,
        '',
        'FINANCIAL:',
        `Total Revenue: ${formatRevenue(reportData.totalRevenue)}`,
        `Average Revenue: ${formatRevenue(reportData.averageRevenue)}`,
        '',
        'INDUSTRY BREAKDOWN:',
        ...Object.entries(reportData.industries)
          .sort(([, a], [, b]) => b - a)
          .map(
            ([industry, count]) =>
              `${industry}: ${count} clients (${Math.round((count / reportData.totalClients) * 100)}%)`,
          ),
        '',
        '='.repeat(50),
        `Generated at: €{new Date().toLocaleString()}`,
        '='.repeat(50),
      ];

      const reportContent = reportLines.join('\n');
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `client_report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify.success(t('statistics.generateReport') + ' - Report generated successfully');
    } catch (error) {
      Logger.error('Report generation error:', error);
      notify.error(t('statistics.generateReport') + ' - Error: ' + error.message);
    }
  }, [clients, formatRevenue, t]);

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner className='h-32 w-32' />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {t('common.error', 'Error Loading Clients')}
          </h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={refreshClients}
            className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
          >
            {t('common.retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        {/* Main Content */}
        <div className='flex-1 flex'>
          <div className='flex-1'>
            {/* Breadcrumb */}
            <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-base'>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors text-nav-text'
                  >
                    <HomeIcon className='h-5 w-5' />
                    <span>{t('common.navigation.home', 'Dashboard')}</span>
                  </button>
                  <ChevronDownIcon className='h-5 w-5 text-gray-400 rotate-[-90deg]' />
                  <span className='text-gray-600 font-bold text-nav-text'>{t('breadcrumb')}</span>
                </div>
              </div>
            </div>

            {/* Header */}
            <div className='bg-white border-b border-gray-200'>
              <div className='px-6 py-4'>
                {/* Header with title and controls */}
                <div className='flex justify-between items-center mb-6'>
                  <h1 className='text-page-title text-gray-900'>{t('title')}</h1>
                  <div className='flex items-center space-x-3'>
                    {/* Search Input */}
                    <div className='relative'>
                      <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
                      <input
                        type='text'
                        placeholder={t('search.placeholder', 'Search clients...')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-nav-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 bg-white'
                        style={{ textIndent: '20px' }}
                      />
                    </div>

                    {/* View Mode Toggle */}
                    <div className='flex items-center bg-gray-100 rounded-lg p-1'>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'table'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title={t('actions.switchToTable')}
                      >
                        <TableCellsIcon className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'card'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title={t('actions.switchToCard')}
                      >
                        <Squares2X2Icon className='h-4 w-4' />
                      </button>
                    </div>

                    <button
                      onClick={handleAddClient}
                      className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors text-button-text font-medium'
                    >
                      <PlusIcon className='h-4 w-4' />
                      <span>{t('addClient')}</span>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className='border-b border-gray-200'>
                  <nav className='flex space-x-8'>
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-nav-text whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.name} ({tab.count})
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <button
                    className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-nav-text font-medium transition-colors ${
                      showFilters
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FunnelIcon className='h-4 w-4' />
                    <span>{t('common:filter')}</span>
                  </button>

                  {showFilters && (
                    <>
                      <select
                        className='border border-gray-300 rounded-lg px-3 py-2 text-nav-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        value={filters.industry}
                        onChange={e => setFilters({ ...filters, industry: e.target.value })}
                      >
                        <option value=''>{t('filters.industry', 'Industry')}</option>
                        <option value='technology'>Technology</option>
                        <option value='manufacturing'>Manufacturing</option>
                        <option value='finance'>Finance</option>
                        <option value='healthcare'>Healthcare</option>
                        <option value='retail'>Retail</option>
                        <option value='food & beverage'>Food & Beverage</option>
                        <option value='software'>Software</option>
                        <option value='conglomerate'>Conglomerate</option>
                      </select>

                      <select
                        className='border border-gray-300 rounded-lg px-3 py-2 text-nav-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option value=''>{t('filters.status')}</option>
                        <option value='active'>{t('tabs.active')}</option>
                        <option value='pending'>{t('tabs.pending')}</option>
                        <option value='inactive'>{t('tabs.inactive')}</option>
                      </select>

                      <select
                        className='border border-gray-300 rounded-lg px-3 py-2 text-nav-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        value={filters.revenue}
                        onChange={e => setFilters({ ...filters, revenue: e.target.value })}
                      >
                        <option value=''>{t('filters.revenue')}</option>
                        <option value='0-10000'>€0 - €10K</option>
                        <option value='10000-50000'>€10K - €50K</option>
                        <option value='50000-100000'>€50K - €100K</option>
                        <option value='100000+'>€100K+</option>
                      </select>

                      {/* Clear Filters Button */}
                      {(filters.industry || filters.status || filters.revenue) && (
                        <button
                          className='px-3 py-2 text-nav-text font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
                          onClick={() => setFilters({ industry: '', status: '', revenue: '' })}
                        >
                          {t('filters.clearFilters')}
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className='flex items-center space-x-4'>
                  <button className='flex items-center space-x-2 px-3 py-2 text-nav-text font-medium text-gray-700 hover:bg-gray-50 rounded-lg'>
                    <ArrowsUpDownIcon className='h-4 w-4' />
                    <span>{t('sort.by')}:</span>
                  </button>

                  <select
                    className='border border-gray-300 rounded-lg px-3 py-2 text-nav-text text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value='company_name'>{t('sort.company')}</option>
                    <option value='created_at'>{t('sort.date')}</option>
                    <option value='last_contact'>{t('sort.lastContact')}</option>
                    <option value='revenue'>{t('filters.revenue')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className='px-6 py-6'>
              {/* Results Info */}
              <div className='mb-4 text-subtitle text-gray-600'>
                {t('pagination.showing', 'Showing {{start}} to {{end}} of {{total}} results', {
                  start: Math.min(startIndex + 1, filteredAndSortedClients.length),
                  end: Math.min(startIndex + itemsPerPage, filteredAndSortedClients.length),
                  total: filteredAndSortedClients.length,
                })}
              </div>

              {viewMode === 'table' ? (
                /* Table View */
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.company', 'Company')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.industry', 'Industry')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.status', 'Status')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.location', 'Location')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.lastContact', 'Last Contact')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.revenue', 'Revenue')}
                          </th>
                          <th className='px-6 py-3 text-left text-table-header text-gray-500 uppercase tracking-wider'>
                            {t('table.actions', 'Actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {currentPageClients.length === 0 ? (
                          <tr>
                            <td
                              colSpan='7'
                              className='px-6 py-12 text-center text-subtitle text-gray-500'
                            >
                              {t('empty.noClients', 'No clients found matching your criteria.')}
                            </td>
                          </tr>
                        ) : (
                          currentPageClients.map(client => {
                            const displayName = getDisplayName(client);
                            const initials = getInitials(displayName);

                            return (
                              <tr key={client.id} className='hover:bg-gray-50'>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='flex items-center'>
                                    <div className='flex-shrink-0 h-10 w-10'>
                                      <div className='h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center'>
                                        <span className='text-nav-text font-medium text-white'>
                                          {initials}
                                        </span>
                                      </div>
                                    </div>
                                    <div className='ml-4'>
                                      <div className='text-nav-text font-medium text-gray-900'>
                                        {displayName}
                                      </div>
                                      <div className='text-subtitle text-gray-500'>
                                        {client.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-nav-text text-gray-900'>
                                  {client.industry || 'Technology'}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <StatusBadge status={client.status} t={t} />
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-nav-text text-gray-900'>
                                  {client.city || client.location || 'San Francisco, CA'}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-nav-text text-gray-900'>
                                  {formatLastContact(client.last_contact || client.created_at, t)}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-nav-text font-semibold text-gray-900'>
                                  {formatRevenue(client.revenue || 0)}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-nav-text font-medium'>
                                  <div className='flex items-center space-x-2'>
                                    {client.phone && (
                                      <button
                                        className='text-gray-400 hover:text-blue-500'
                                        title={t('actions.call')}
                                        onClick={() => handlePhoneCall(client)}
                                      >
                                        <PhoneIcon className='h-4 w-4' />
                                      </button>
                                    )}
                                    {client.email && (
                                      <button
                                        className='text-gray-400 hover:text-green-500'
                                        title={t('actions.sendEmail')}
                                        onClick={() => handleSendEmail(client)}
                                      >
                                        <EnvelopeIcon className='h-4 w-4' />
                                      </button>
                                    )}
                                    <button
                                      className='text-gray-400 hover:text-purple-500'
                                      title={t('actions.createInvoice')}
                                      onClick={() => handleCreateInvoice(client)}
                                    >
                                      <DocumentTextIcon className='h-4 w-4' />
                                    </button>
                                    <button
                                      className='text-blue-600 hover:text-blue-700 text-button-text'
                                      onClick={() => handleEditClient(client)}
                                    >
                                      {t('actions.edit')}
                                    </button>
                                    <button
                                      className='text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded'
                                      onClick={() => handleDeleteClick(client)}
                                      title={t('actions.deleteClient', 'Elimina cliente')}
                                    >
                                      <TrashIcon className='h-4 w-4' />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredAndSortedClients.length > 0 && (
                    <div className='bg-white px-4 py-3 border-t border-gray-200 sm:px-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1 flex justify-between sm:hidden'>
                          <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-nav-text font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            {t('pagination.previous')}
                          </button>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-nav-text font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            {t('pagination.next')}
                          </button>
                        </div>
                        <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                          <div>
                            <p className='text-subtitle text-gray-700'>
                              {t(
                                'pagination.showing',
                                'Showing {{start}} to {{end}} of {{total}} results',
                                {
                                  start: Math.min(startIndex + 1, filteredAndSortedClients.length),
                                  end: Math.min(
                                    startIndex + itemsPerPage,
                                    filteredAndSortedClients.length,
                                  ),
                                  total: filteredAndSortedClients.length,
                                },
                              )}
                            </p>
                          </div>
                          <div>
                            <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                              <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-nav-text font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                <ChevronLeftIcon className='h-5 w-5' />
                              </button>
                              <span className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-nav-text font-medium text-gray-700'>
                                {currentPage} / {totalPages}
                              </span>
                              <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-nav-text font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                <ChevronRightIcon className='h-5 w-5' />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Card View */
                <div>
                  {currentPageClients.length === 0 ? (
                    <div className='text-center py-12'>
                      <p className='text-gray-500'>
                        {t('empty.noClients', 'No clients found matching your criteria.')}
                      </p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
                      {currentPageClients.map(client => (
                        <ClientCard
                          key={client.id}
                          client={client}
                          getDisplayName={getDisplayName}
                          getInitials={getInitials}
                          formatRevenue={formatRevenue}
                          formatLastContact={date => formatLastContact(date, t)}
                          t={t}
                          onEdit={handleEditClient}
                          onDelete={handleDeleteClick}
                          onCreateInvoice={handleCreateInvoice}
                          onPhoneCall={handlePhoneCall}
                          onSendEmail={handleSendEmail}
                        />
                      ))}
                    </div>
                  )}

                  {/* Card View Pagination */}
                  {filteredAndSortedClients.length > 0 && (
                    <div className='flex items-center justify-between'>
                      <div className='text-sm text-gray-700'>
                        {t(
                          'pagination.showing',
                          'Showing {{start}} to {{end}} of {{total}} results',
                          {
                            start: Math.min(startIndex + 1, filteredAndSortedClients.length),
                            end: Math.min(
                              startIndex + itemsPerPage,
                              filteredAndSortedClients.length,
                            ),
                            total: filteredAndSortedClients.length,
                          },
                        )}
                      </div>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className='px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {t('pagination.previous')}
                        </button>
                        <span className='px-3 py-2 text-sm text-gray-700'>
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className='px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {t('pagination.next')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistics Sidebar */}
          <ClientStatistics
            clients={clients}
            t={t}
            onAddClient={handleAddClient}
            onExportList={handleExportList}
            onGenerateReport={handleGenerateReport}
          />
        </div>

        {/* Footer */}
        <Footer />

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
            onSave={handleInvoiceSave}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

// Export with error boundary HOC for additional protection
export default withErrorBoundary(Clients);
