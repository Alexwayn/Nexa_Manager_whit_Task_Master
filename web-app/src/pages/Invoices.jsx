import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import {
  Plus,
  Download,
  Search,
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logos/logo_nexa.png';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import InvoiceService from '@features/financial/services/invoiceService';
import InvoiceAnalyticsService from '@features/financial/services/invoiceAnalyticsService';
import { InvoiceModal, QuoteModal } from '@features/financial';
import { ViewInvoiceModal } from '@features/financial';
import { getUserIdForUuidTables } from '@shared/utils';
import Logger from '@utils/Logger';
import Footer from '@shared/components/Footer';

const InvoicesPage = () => {
  // Always call ALL hooks first, in the same order every render
  const { t, ready } = useTranslation('invoices');
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    dateRange: '',
    amount: '',
  });

  const dateInputRef = useRef(null);

  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Dropdown states for analytics card menus
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        activeDropdown &&
        dropdownRefs.current[activeDropdown] &&
        !dropdownRefs.current[activeDropdown].contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = dropdownId => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  // Dropdown menu options for analytics cards
  const paymentStatusOptions = [
    {
      label: t('dropdownOptions.viewDetails', 'View Details'),
      icon: Eye,
      action: () => navigate('/analytics'),
    },
    {
      label: t('dropdownOptions.exportReport', 'Export Report'),
      icon: Download,
      action: () => console.log('Export payment status report'),
    },
    {
      label: t('dropdownOptions.refreshData', 'Refresh Data'),
      icon: ArrowUpRight,
      action: () => window.location.reload(),
    },
  ];

  const monthlyInvoicesOptions = [
    {
      label: t('dropdownOptions.viewAnalytics', 'View Analytics'),
      icon: TrendingUp,
      action: () => navigate('/analytics'),
    },
    {
      label: t('dropdownOptions.exportChart', 'Export Chart'),
      icon: Download,
      action: () => console.log('Export monthly invoices chart'),
    },
    {
      label: t('dropdownOptions.changeView', 'Change View'),
      icon: Calendar,
      action: () => console.log('Change chart view'),
    },
  ];

  // Dropdown menu component
  const CardDropdownMenu = ({ dropdownId, options }) => (
    <div className='relative' ref={el => (dropdownRefs.current[dropdownId] = el)}>
      <button
        onClick={() => toggleDropdown(dropdownId)}
        className='w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors'
        aria-label='Card options'
      >
        <MoreHorizontal className='w-5 h-5' />
      </button>

      {activeDropdown === dropdownId && (
        <div className='absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10'>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.action();
                setActiveDropdown(null);
              }}
              className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2'
            >
              {option.icon && <option.icon className='h-4 w-4' />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Load real invoice data
  const loadInvoices = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert Clerk user ID to UUID for database queries
      const dbUserId = getUserIdForUuidTables(user.id);
      Logger.info('Loading invoices for user:', {
        clerkId: user.id,
        dbUserId,
        userEmail: user.primaryEmailAddress?.emailAddress,
      });

      // Fetch invoices
      const invoicesResult = await InvoiceService.getInvoices(dbUserId, {
        limit: 100, // Get more invoices for better analytics
        sort_by: 'issue_date',
        sort_order: 'desc',
      });

      Logger.info('Invoices loaded successfully:', {
        count: invoicesResult.invoices.length,
        pagination: invoicesResult.pagination,
      });

      // Transform data for UI compatibility
      const transformedInvoices = invoicesResult.invoices.map(invoice => ({
        id: invoice.invoice_number,
        client: {
          name: invoice.clients?.full_name || 'Unknown Client',
          type: 'Business', // Default type since we don't have industry in clients table
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(invoice.clients?.full_name || 'UC')}&background=357AF3&color=fff&size=40`,
        },
        issueDate: new Date(invoice.issue_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        dueDate: new Date(invoice.due_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: invoice.currency || 'EUR',
        }).format(invoice.total_amount),
        status: invoice.status,
        rawData: invoice, // Keep original data for actions
      }));

      setInvoices(transformedInvoices);
      setFilteredInvoices(transformedInvoices);

      // Fetch analytics
      const analyticsResult = await InvoiceAnalyticsService.getInvoiceAnalytics(dbUserId);
      if (analyticsResult.success) {
        Logger.info('Analytics loaded successfully:', analyticsResult.data);
        setAnalytics(analyticsResult.data);
      } else {
        Logger.warn('Failed to load analytics:', analyticsResult.error);
      }
    } catch (err) {
      Logger.error('Error loading invoices:', err);
      setError(err.message || 'An unexpected error occurred while loading invoices');
      // Set empty arrays instead of demo data
      setInvoices([]);
      setFilteredInvoices([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // Load data when user is available
  useEffect(() => {
    if (user?.id) {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Apply filters when invoices data changes
  useEffect(() => {
    if (invoices.length > 0) {
      applyFilters();
    }
  }, [invoices]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, invoices]);

  // Modal handlers
  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setSelectedClient(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = invoice => {
    setSelectedInvoice(invoice);
    setSelectedClient(null);
    setIsInvoiceModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
    setSelectedClient(null);
  };

  const handleInvoiceCreated = newInvoice => {
    Logger.info('New invoice created:', newInvoice);
    // Refresh the invoices list
    loadInvoices();
  };

  const handleInvoiceUpdated = updatedInvoice => {
    Logger.info('Invoice updated:', updatedInvoice);
    // Refresh the invoices list
    loadInvoices();
  };

  const handleCloseQuoteModal = () => {
    setIsQuoteModalOpen(false);
  };

  const handleQuoteCreated = newQuote => {
    Logger.info('New quote created:', newQuote);
    // Optionally refresh data or show success message
    setIsQuoteModalOpen(false);
  };

  const handleQuoteUpdated = updatedQuote => {
    Logger.info('Quote updated:', updatedQuote);
    // Optionally refresh data or show success message
    setIsQuoteModalOpen(false);
  };

  const handleCreateQuote = () => {
    setIsQuoteModalOpen(true);
  };

  const handleSendReminders = () => {
    // TODO: Implement reminder functionality
    alert(t('quickActions.sendReminders.title') + ' - Coming soon!');
  };

  const handleGenerateReport = () => {
    navigate('/reports');
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    alert(t('actions.export') + ' - Coming soon!');
  };

  const handleViewInvoice = invoice => {
    setSelectedInvoice(invoice);
    setIsViewInvoiceModalOpen(true);
  };

  const handleDownloadInvoice = invoice => {
    // Generate and download professional PDF invoice
    try {
      const invoiceData = {
        id: invoice.id,
        number: invoice.invoice_number || invoice.id,
        client: invoice.client_name || 'N/A',
        amount: invoice.total_amount || invoice.amount || 0,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        status: invoice.status || 'pending',
        items: invoice.items || [],
      };

      // Create new PDF document
      const pdf = new jsPDF();

      // Set font
      pdf.setFont('helvetica');

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 123, 255); // Blue color
      pdf.text('INVOICE', 105, 30, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100); // Gray color
      pdf.text(`#${invoiceData.number}`, 105, 40, { align: 'center' });

      // Line under header
      pdf.setDrawColor(0, 123, 255);
      pdf.setLineWidth(1);
      pdf.line(20, 50, 190, 50);

      // Invoice details section
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0); // Black color

      // Bill To section
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 20, 70);
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoiceData.client, 20, 80);

      // Invoice details section
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice Details:', 120, 70);
      pdf.setFont('helvetica', 'normal');

      const issueDate = invoiceData.issueDate
        ? new Date(invoiceData.issueDate).toLocaleDateString()
        : 'N/A';
      const dueDate = invoiceData.dueDate
        ? new Date(invoiceData.dueDate).toLocaleDateString()
        : 'N/A';

      pdf.text(`Issue Date: ${issueDate}`, 120, 80);
      pdf.text(`Due Date: ${dueDate}`, 120, 90);
      pdf.text(`Status: ${invoiceData.status.toUpperCase()}`, 120, 100);

      // Items table header
      const tableStartY = 120;
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(248, 249, 250); // Light gray background
      pdf.rect(20, tableStartY, 170, 10, 'F');

      pdf.text('Description', 25, tableStartY + 7);
      pdf.text('Qty', 100, tableStartY + 7);
      pdf.text('Unit Price', 120, tableStartY + 7);
      pdf.text('Total', 160, tableStartY + 7);

      // Table border
      pdf.setDrawColor(221, 221, 221);
      pdf.setLineWidth(0.5);
      pdf.rect(20, tableStartY, 170, 10);

      // Items
      let currentY = tableStartY + 20;
      pdf.setFont('helvetica', 'normal');

      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, index) => {
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const total = quantity * price;

          pdf.text(item.description || 'Service/Product', 25, currentY);
          pdf.text(quantity.toString(), 100, currentY);
          pdf.text(`€{price.toFixed(2)}`, 120, currentY);
          pdf.text(`€{total.toFixed(2)}`, 160, currentY);

          // Row border
          pdf.rect(20, currentY - 7, 170, 10);
          currentY += 15;
        });
      } else {
        // Default item if no items available
        pdf.text('Service/Product', 25, currentY);
        pdf.text('1', 100, currentY);
        pdf.text(`€{invoiceData.amount.toFixed(2)}`, 120, currentY);
        pdf.text(`€{invoiceData.amount.toFixed(2)}`, 160, currentY);
        pdf.rect(20, currentY - 7, 170, 10);
        currentY += 15;
      }

      // Total section
      currentY += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(0, 123, 255);
      pdf.text(`Total: €{invoiceData.amount.toFixed(2)}`, 190, currentY, { align: 'right' });

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Thank you for your business!', 105, 280, { align: 'center' });

      // Save the PDF
      pdf.save(`invoice-${invoiceData.number}.pdf`);

      // Show success message
      alert(
        t('success.invoiceDownloaded', { defaultValue: 'Invoice PDF downloaded successfully!' }),
      );
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert(t('error.downloadFailed', { defaultValue: 'Failed to download invoice PDF' }));
    }
  };

  const handleDeleteInvoice = invoice => {
    if (
      window.confirm(
        t('actions.confirmDelete', {
          defaultValue: 'Are you sure you want to delete this invoice?',
        }),
      )
    ) {
      // TODO: Implement delete invoice functionality
      alert(t('actions.delete', { defaultValue: 'Delete Invoice' }) + ' - Coming soon!');
    }
  };

  // Filter functions
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: '',
      client: '',
      dateRange: '',
      amount: '',
    };
    setFilters(clearedFilters);
    setFilteredInvoices(invoices);
    setCurrentPage(1);
  };

  const applyFilters = (currentFilters = filters) => {
    let filtered = [...invoices];

    // Filter by search term
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        invoice =>
          invoice.id.toLowerCase().includes(searchLower) ||
          invoice.client.name.toLowerCase().includes(searchLower) ||
          invoice.status.toLowerCase().includes(searchLower),
      );
    }

    // Filter by status
    if (currentFilters.status && currentFilters.status !== '') {
      filtered = filtered.filter(
        invoice => invoice.status.toLowerCase() === currentFilters.status.toLowerCase(),
      );
    }

    // Filter by client
    if (currentFilters.client && currentFilters.client !== '') {
      filtered = filtered.filter(invoice =>
        invoice.client.name.toLowerCase().includes(currentFilters.client.toLowerCase()),
      );
    }

    // Filter by date range
    if (currentFilters.dateRange) {
      const filterDate = new Date(currentFilters.dateRange);
      filtered = filtered.filter(invoice => {
        const issueDate = new Date(invoice.rawData.issue_date);
        return issueDate >= filterDate;
      });
    }

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const handleViewAllClients = () => {
    navigate('/clients');
  };

  const handleApplyFilters = () => {
    applyFilters();
  };

  // Show loading state if translations are not ready or data is loading - AFTER all hooks
  if (!ready || loading) {
    return (
      <div className='min-h-screen bg-[#F9FAFB] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AF3] mx-auto mb-4'></div>
          <p className='text-gray-600'>{loading ? t('loading.invoices') : t('loading.generic')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-[#F9FAFB] flex items-center justify-center'>
        <div className='text-center'>
          <XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <p className='text-red-600 mb-4'>
            {t('error.title')} {error}
          </p>
          <button
            onClick={loadInvoices}
            className='bg-[#357AF3] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            {t('error.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Calculate real statistics from analytics data
  const calculateStats = () => {
    if (!analytics) {
      return [
        {
          title: t('stats.totalOutstanding.title'),
          amount: '€0.00',
          subtitle: t('stats.totalOutstanding.subtitle', { count: 0 }),
          trend: { value: '0%', type: 'up', color: 'text-gray-600' },
          icon: DollarSign,
          bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
          iconColor: 'text-white',
        },
        {
          title: t('stats.paidThisMonth.title'),
          amount: '€0.00',
          subtitle: t('stats.paidThisMonth.subtitle', { count: 0 }),
          trend: { value: '0%', type: 'up', color: 'text-gray-600' },
          icon: CheckCircle,
          bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
          iconColor: 'text-white',
        },
        {
          title: t('stats.overdue.title'),
          amount: '€0.00',
          subtitle: t('stats.overdue.subtitle', { count: 0 }),
          trend: { value: '0%', type: 'up', color: 'text-gray-600' },
          icon: XCircle,
          bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
          iconColor: 'text-white',
        },
        {
          title: t('stats.averagePaymentTime.title'),
          amount: '0 days',
          subtitle: t('stats.averagePaymentTime.subtitle'),
          trend: { value: '0 days', type: 'down', color: 'text-gray-600' },
          icon: Clock,
          bgColor: 'bg-gradient-to-br from-primary-500 to-primary-600',
          iconColor: 'text-white',
        },
      ];
    }

    const totalOutstanding =
      (analytics.revenueAnalytics?.pendingRevenue || 0) +
      (analytics.revenueAnalytics?.overdueRevenue || 0);
    const totalPaid = analytics.revenueAnalytics?.paidRevenue || 0;
    const overdueCount = analytics.statusDistribution?.overdue || 0;
    const paidCount = analytics.statusDistribution?.paid || 0;
    const avgPaymentTime = analytics.performanceMetrics?.averagePaymentTime || 0;

    return [
      {
        title: t('stats.totalOutstanding.title'),
        amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
          totalOutstanding,
        ),
        subtitle: t('stats.totalOutstanding.subtitle', { count: analytics.totalInvoices || 0 }),
        trend: { value: '0%', type: 'up', color: 'text-orange-600' },
        icon: DollarSign,
        bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
        iconColor: 'text-white',
      },
      {
        title: t('stats.paidThisMonth.title'),
        amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
          totalPaid,
        ),
        subtitle: t('stats.paidThisMonth.subtitle', { count: paidCount }),
        trend: { value: '0%', type: 'up', color: 'text-green-600' },
        icon: CheckCircle,
        bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
        iconColor: 'text-white',
      },
      {
        title: t('stats.overdue.title'),
        amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
          analytics.revenueAnalytics?.overdueRevenue || 0,
        ),
        subtitle: t('stats.overdue.subtitle', { count: overdueCount }),
        trend: { value: '0%', type: 'up', color: 'text-red-600' },
        icon: XCircle,
        bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
        iconColor: 'text-white',
      },
      {
        title: t('stats.averagePaymentTime.title'),
        amount: `${Math.round(avgPaymentTime)} days`,
        subtitle: t('stats.averagePaymentTime.subtitle'),
        trend: { value: '0 days', type: 'down', color: 'text-green-600' },
        icon: Clock,
        bgColor: 'bg-gradient-to-br from-primary-500 to-primary-600',
        iconColor: 'text-white',
      },
    ];
  };

  const stats = calculateStats();

  // Calculate top clients from real data
  const calculateTopClients = () => {
    if (!invoices.length) return [];

    // Group invoices by client and calculate totals
    const clientTotals = invoices.reduce((acc, invoice) => {
      const clientName = invoice.client.name;
      if (!acc[clientName]) {
        acc[clientName] = {
          name: clientName,
          avatar: invoice.client.avatar,
          totalAmount: 0,
          invoiceCount: 0,
          paidCount: 0,
        };
      }

      // Parse amount (remove currency symbol and convert to number)
      const amount = parseFloat(invoice.amount.replace(/[€€,]/g, ''));
      acc[clientName].totalAmount += amount;
      acc[clientName].invoiceCount += 1;

      if (invoice.status === 'paid') {
        acc[clientName].paidCount += 1;
      }

      return acc;
    }, {});

    // Convert to array and sort by total amount
    return Object.values(clientTotals)
      .map(client => ({
        ...client,
        amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
          client.totalAmount,
        ),
        onTimePercentage:
          client.invoiceCount > 0
            ? `${Math.round((client.paidCount / client.invoiceCount) * 100)}% ${t('status.paid')}`
            : `0% ${t('status.paid')}`,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 4);
  };

  const topClients = calculateTopClients();

  // Generate recent activities from real invoice data
  const generateRecentActivities = () => {
    if (!invoices.length) return [];

    const activities = [];
    const recentInvoices = invoices.slice(0, 4);

    recentInvoices.forEach((invoice, index) => {
      const daysSinceIssue = Math.floor(Math.random() * 7) + 1; // Random days for demo

      if (invoice.status === 'paid') {
        activities.push({
          type: 'payment',
          message: t('recentActivity.payment', {
            invoiceId: invoice.id,
            clientName: invoice.client.name,
          }),
          time: t('recentActivity.time.daysAgo', { count: daysSinceIssue }),
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
        });
      } else if (invoice.status === 'sent') {
        activities.push({
          type: 'created',
          message: t('recentActivity.created', {
            invoiceId: invoice.id,
            clientName: invoice.client.name,
          }),
          time: t('recentActivity.time.daysAgo', { count: daysSinceIssue }),
          icon: FileText,
          bgColor: 'bg-blue-50',
          iconColor: 'text-[#357AF3]',
        });
      } else if (invoice.status === 'overdue') {
        activities.push({
          type: 'overdue',
          message: t('recentActivity.overdue', {
            invoiceId: invoice.id,
            clientName: invoice.client.name,
          }),
          time: t('recentActivity.time.daysAgo', { count: daysSinceIssue }),
          icon: XCircle,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
        });
      }
    });

    return activities.slice(0, 4);
  };

  const recentActivities = generateRecentActivities();

  const getStatusBadge = status => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: t('status.paid') },
      sent: { bg: 'bg-blue-100', text: 'text-[#357AF3]', label: t('status.sent') },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: t('status.overdue') },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('status.draft') },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  return (
    <div className='min-h-screen bg-[#F9FAFB]'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
        <div className='flex items-center space-x-2 text-base'>
          <HomeIcon className='h-5 w-5 text-blue-600' />
          <button
            onClick={() => navigate('/dashboard')}
            className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            Dashboard
          </button>
          <ChevronRightIcon className='h-5 w-5 text-gray-400' />
          <span className='text-gray-600 font-bold'>{t('breadcrumb')}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header Section */}
        <div className='bg-white border-b border-gray-200 px-8 py-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-page-title'>{t('title')}</h1>
            </div>
            <div className='flex space-x-3'>
              <button
                onClick={handleCreateInvoice}
                className='bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors font-semibold'
              >
                <Plus className='w-5 h-5' />
                <span>{t('actions.createNew')}</span>
              </button>
              <button
                onClick={handleExportData}
                className='bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors font-semibold'
              >
                <Download className='w-5 h-5' />
                <span>{t('actions.export')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='bg-white border-b border-gray-200 px-8'>
          <div className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'text-[#357AF3] border-[#357AF3]'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              {t('tabs.invoices')}
            </button>
            <button
              onClick={() => navigate('/quotes')}
              className={`py-4 px-2 text-base font-semibold border-b-2 transition-colors ${
                activeTab === 'quotes'
                  ? 'text-[#357AF3] border-[#357AF3]'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            >
              {t('tabs.quotes')}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='px-8 py-8'>
          {/* Stats Cards + Action Buttons - Combined Layout */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
            {/* Left: Stats Cards (2x2 Grid) */}
            <div className='lg:col-span-2'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {stats.map((stat, index) => {
                  // Define card colors based on stat type
                  const cardColors = {
                    0: 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:border-orange-300', // Total Outstanding
                    1: 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:border-green-300', // Paid This Month
                    2: 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:border-red-300', // Overdue
                    3: 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 hover:border-primary-300', // Average Payment Time
                  };

                  return (
                    <div
                      key={index}
                      className={`${cardColors[index]} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer group`}
                    >
                      <div className='flex justify-between items-start mb-4'>
                        <div>
                          <p className='text-card-title'>{stat.title}</p>
                        </div>
                        <div
                          className={`p-3 rounded-full ${stat.bgColor} ring-2 ring-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                        >
                          <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className='mb-4'>
                        <p className='text-card-metric group-hover:text-gray-800 transition-colors'>
                          {stat.amount}
                        </p>
                        <p className='text-subtitle'>{stat.subtitle}</p>
                      </div>
                      <div className='flex items-center bg-white/60 rounded-lg px-3 py-2 backdrop-blur-sm'>
                        {stat.trend.type === 'up' ? (
                          <ArrowUpRight className={`w-4 h-4 ${stat.trend.color} mr-2`} />
                        ) : (
                          <ArrowDownRight className={`w-4 h-4 ${stat.trend.color} mr-2`} />
                        )}
                        <span className={`text-sm font-semibold ${stat.trend.color}`}>
                          {stat.trend.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Quick Action Cards - Beautiful Design with Patterns */}
            <div className='grid grid-cols-2 gap-4'>
              {/* Create Invoice */}
              <div className='group relative bg-gradient-to-br from-[#4F46E5] to-[#357AF3] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
                {/* Background Pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
                  <div className='absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12'></div>
                  <div className='absolute top-1/2 right-0 w-16 h-16 bg-white rounded-full translate-x-8'></div>
                </div>
                <div className='relative z-10 flex flex-col h-full'>
                  <div className='flex-grow'>
                    <div className='flex justify-center mb-3'>
                      <FileText className='w-10 h-10' />
                    </div>
                    <h4 className='text-lg font-bold text-center mb-2'>
                      {t('quickActions.createInvoice.title')}
                    </h4>
                    <p className='text-blue-100 text-xs mb-4 leading-relaxed flex-grow text-center'>
                      {t('quickActions.createInvoice.description')}
                    </p>
                  </div>
                  <div className='flex justify-center mt-auto'>
                    <button
                      onClick={handleCreateInvoice}
                      className='bg-white/90 backdrop-blur-sm text-[#4F46E5] px-3 py-1.5 rounded-lg font-semibold hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg text-xs w-full max-w-[120px] text-center'
                    >
                      {t('quickActions.createInvoice.button')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Create Quote */}
              <div className='group relative bg-gradient-to-br from-[#059669] to-[#10B981] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
                {/* Background Pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 right-0 w-28 h-28 bg-white rounded-full translate-x-14 -translate-y-14'></div>
                  <div className='absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10'></div>
                  <div className='absolute top-1/3 left-0 w-12 h-12 bg-white rounded-full -translate-x-6'></div>
                  <div className='absolute bottom-1/3 right-1/4 w-8 h-8 bg-white rounded-full'></div>
                </div>
                <div className='relative z-10 flex flex-col h-full'>
                  <div className='flex-grow'>
                    <div className='flex justify-center mb-3'>
                      <FileText className='w-10 h-10' />
                    </div>
                    <h4 className='text-lg font-bold text-center mb-2'>
                      {t('quickActions.createQuote.title')}
                    </h4>
                    <p className='text-green-100 text-xs mb-4 leading-relaxed flex-grow text-center'>
                      {t('quickActions.createQuote.description')}
                    </p>
                  </div>
                  <div className='flex justify-center mt-auto'>
                    <button
                      onClick={handleCreateQuote}
                      className='bg-white/90 backdrop-blur-sm text-[#059669] px-3 py-1.5 rounded-lg font-semibold hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg text-xs w-full max-w-[120px] text-center'
                    >
                      {t('quickActions.createQuote.button')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Send Reminders */}
              <div className='group relative bg-gradient-to-br from-[#D97706] to-[#F59E0B] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
                {/* Background Pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-1/4 left-0 w-24 h-24 bg-white rounded-full -translate-x-12'></div>
                  <div className='absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 translate-y-16'></div>
                  <div className='absolute top-0 right-1/3 w-16 h-16 bg-white rounded-full -translate-y-8'></div>
                  <div className='absolute bottom-1/4 left-1/3 w-10 h-10 bg-white rounded-full'></div>
                </div>
                <div className='relative z-10 flex flex-col h-full'>
                  <div className='flex-grow'>
                    <div className='flex justify-center mb-3'>
                      <Mail className='w-10 h-10' />
                    </div>
                    <h4 className='text-lg font-bold text-center mb-2'>
                      {t('quickActions.sendReminders.title')}
                    </h4>
                    <p className='text-orange-100 text-xs mb-4 leading-relaxed flex-grow text-center'>
                      {t('quickActions.sendReminders.description')}
                    </p>
                  </div>
                  <div className='flex justify-center mt-auto'>
                    <button
                      onClick={handleSendReminders}
                      className='bg-white/90 backdrop-blur-sm text-[#D97706] px-3 py-1.5 rounded-lg font-semibold hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg text-xs w-full max-w-[120px] text-center'
                    >
                      {t('quickActions.sendReminders.button')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate Report */}
              <div className='group relative bg-gradient-to-br from-[#7C3AED] to-[#A855F7] rounded-2xl p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full'>
                {/* Background Pattern */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute top-0 left-1/4 w-20 h-20 bg-white rounded-full -translate-y-10'></div>
                  <div className='absolute bottom-1/4 right-0 w-28 h-28 bg-white rounded-full translate-x-14'></div>
                  <div className='absolute top-1/2 left-0 w-14 h-14 bg-white rounded-full -translate-x-7'></div>
                  <div className='absolute bottom-0 left-1/2 w-18 h-18 bg-white rounded-full translate-y-9'></div>
                  <div className='absolute top-1/4 right-1/4 w-6 h-6 bg-white rounded-full'></div>
                </div>
                <div className='relative z-10 flex flex-col h-full'>
                  <div className='flex-grow'>
                    <div className='flex justify-center mb-3'>
                      <FileText className='w-10 h-10' />
                    </div>
                    <h4 className='text-lg font-bold text-center mb-2'>
                      {t('quickActions.generateReport.title')}
                    </h4>
                    <p className='text-purple-100 text-xs mb-4 leading-relaxed flex-grow text-center'>
                      {t('quickActions.generateReport.description')}
                    </p>
                  </div>
                  <div className='flex justify-center mt-auto'>
                    <button
                      onClick={handleGenerateReport}
                      className='bg-white/90 backdrop-blur-sm text-[#7C3AED] px-3 py-1.5 rounded-lg font-semibold hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg text-xs w-full max-w-[120px] text-center'
                    >
                      {t('quickActions.generateReport.button')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics and Top Clients Row - Optimized Layout */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Payment Status Chart - Redesigned */}
            <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-section-title'>{t('analytics.paymentStatus.title')}</h3>
                <CardDropdownMenu
                  dropdownId='paymentStatusOptions'
                  options={paymentStatusOptions}
                />
              </div>

              {/* Enhanced Layout with Chart and Stats */}
              <div className='space-y-6'>
                {/* Donut Chart */}
                <div className='flex justify-center'>
                  <div className='relative w-32 h-32'>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-xl font-bold text-gray-900'>
                          {analytics?.statusDistribution
                            ? Math.round(
                                ((analytics.statusDistribution.paid || 0) /
                                  (analytics.totalInvoices || 1)) *
                                  100,
                              )
                            : 0}
                          %
                        </div>
                        <div className='text-xs text-gray-500'>
                          {t('analytics.paymentStatus.paid')}
                        </div>
                      </div>
                    </div>
                    <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                      <circle cx='50' cy='50' r='40' fill='none' stroke='#F3F4F6' strokeWidth='6' />
                      {analytics?.statusDistribution && analytics.totalInvoices > 0 && (
                        <>
                          <circle
                            cx='50'
                            cy='50'
                            r='40'
                            fill='none'
                            stroke='#10B981'
                            strokeWidth='6'
                            strokeDasharray={`${((analytics.statusDistribution.paid || 0) / analytics.totalInvoices) * 251} ${251 - ((analytics.statusDistribution.paid || 0) / analytics.totalInvoices) * 251}`}
                            strokeDashoffset='0'
                            className='transition-all duration-1000'
                          />
                          <circle
                            cx='50'
                            cy='50'
                            r='40'
                            fill='none'
                            stroke='#F59E0B'
                            strokeWidth='6'
                            strokeDasharray={`${((analytics.statusDistribution.sent || 0) / analytics.totalInvoices) * 251} ${251 - ((analytics.statusDistribution.sent || 0) / analytics.totalInvoices) * 251}`}
                            strokeDashoffset={`-${((analytics.statusDistribution.paid || 0) / analytics.totalInvoices) * 251}`}
                            className='transition-all duration-1000'
                          />
                          <circle
                            cx='50'
                            cy='50'
                            r='40'
                            fill='none'
                            stroke='#EF4444'
                            strokeWidth='6'
                            strokeDasharray={`${((analytics.statusDistribution.overdue || 0) / analytics.totalInvoices) * 251} ${251 - ((analytics.statusDistribution.overdue || 0) / analytics.totalInvoices) * 251}`}
                            strokeDashoffset={`-${(((analytics.statusDistribution.paid || 0) + (analytics.statusDistribution.sent || 0)) / analytics.totalInvoices) * 251}`}
                            className='transition-all duration-1000'
                          />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className='grid grid-cols-3 gap-3'>
                  <div className='text-center p-3 bg-green-50 rounded-lg border border-green-100'>
                    <div className='w-3 h-3 bg-green-500 rounded-full mx-auto mb-2'></div>
                    <div className='text-lg font-bold text-green-700'>
                      {analytics?.statusDistribution && analytics.totalInvoices > 0
                        ? Math.round(
                            ((analytics.statusDistribution.paid || 0) / analytics.totalInvoices) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                    <div className='text-xs text-green-600 font-medium'>
                      {t('analytics.paymentStatus.paid')}
                    </div>
                  </div>
                  <div className='text-center p-3 bg-amber-50 rounded-lg border border-amber-100'>
                    <div className='w-3 h-3 bg-amber-500 rounded-full mx-auto mb-2'></div>
                    <div className='text-lg font-bold text-amber-700'>
                      {analytics?.statusDistribution && analytics.totalInvoices > 0
                        ? Math.round(
                            ((analytics.statusDistribution.sent || 0) / analytics.totalInvoices) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                    <div className='text-xs text-amber-600 font-medium'>
                      {t('analytics.paymentStatus.pending')}
                    </div>
                  </div>
                  <div className='text-center p-3 bg-red-50 rounded-lg border border-red-100'>
                    <div className='w-3 h-3 bg-red-500 rounded-full mx-auto mb-2'></div>
                    <div className='text-lg font-bold text-red-700'>
                      {analytics?.statusDistribution && analytics.totalInvoices > 0
                        ? Math.round(
                            ((analytics.statusDistribution.overdue || 0) /
                              analytics.totalInvoices) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                    <div className='text-xs text-red-600 font-medium'>
                      {t('analytics.paymentStatus.overdue')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Invoices Chart - Redesigned */}
            <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h3 className='text-section-title'>{t('analytics.monthlyInvoices.title')}</h3>
                  <p className='text-xs text-gray-500 mt-1'>
                    {t('analytics.monthlyInvoices.subtitle')}
                  </p>
                </div>
                <CardDropdownMenu
                  dropdownId='monthlyInvoicesOptions'
                  options={monthlyInvoicesOptions}
                />
              </div>

              {/* Enhanced Bar Chart */}
              <div className='space-y-4'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-end justify-between h-24 mb-3'>
                    {(() => {
                      // Generate last 6 months data from real invoices
                      const monthsData = [];
                      const now = new Date();

                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
                        const monthName = date.toLocaleDateString('en-US', { month: 'short' });

                        // Count invoices for this month
                        const monthInvoices = invoices.filter(invoice => {
                          const issueDate = new Date(invoice.issueDate);
                          return (
                            issueDate.getFullYear() === date.getFullYear() &&
                            issueDate.getMonth() === date.getMonth()
                          );
                        });

                        const created = monthInvoices.length;
                        const paid = monthInvoices.filter(inv => inv.status === 'paid').length;

                        monthsData.push({ created, paid, month: monthName });
                      }

                      const maxValue = Math.max(
                        ...monthsData.map(d => Math.max(d.created, d.paid)),
                        1,
                      );

                      return monthsData.map((data, index) => (
                        <div
                          key={index}
                          className='flex flex-col items-center group cursor-pointer'
                        >
                          <div className='relative flex flex-col items-center space-y-0.5 mb-2'>
                            <div
                              className='bg-[#357AF3] rounded-sm transition-all duration-500 hover:bg-blue-700 group-hover:scale-110'
                              style={{
                                width: '14px',
                                height: `${Math.max((data.created / maxValue) * 60, 4)}px`,
                              }}
                              title={`${t('analytics.monthlyInvoices.created')}: ${data.created}`}
                            ></div>
                            <div
                              className='bg-green-500 rounded-sm transition-all duration-500 hover:bg-green-600 group-hover:scale-110'
                              style={{
                                width: '14px',
                                height: `${Math.max((data.paid / maxValue) * 60, 2)}px`,
                              }}
                              title={`${t('analytics.monthlyInvoices.paid')}: ${data.paid}`}
                            ></div>
                          </div>
                          <span className='text-xs text-gray-500 font-medium'>{data.month}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Stats and Legend */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4 text-xs'>
                    <div className='flex items-center'>
                      <div className='w-3 h-3 bg-[#357AF3] rounded-sm mr-2'></div>
                      <span className='text-gray-600 font-medium'>
                        {t('analytics.monthlyInvoices.created')}
                      </span>
                    </div>
                    <div className='flex items-center'>
                      <div className='w-3 h-3 bg-green-500 rounded-sm mr-2'></div>
                      <span className='text-gray-600 font-medium'>
                        {t('analytics.monthlyInvoices.paid')}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-bold text-gray-900'>
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return invoices.filter(invoice => {
                          const issueDate = new Date(invoice.issueDate);
                          return (
                            issueDate.getMonth() === currentMonth &&
                            issueDate.getFullYear() === currentYear
                          );
                        }).length;
                      })()}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {t('analytics.monthlyInvoices.thisMonth')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Clients - Compact in Same Row */}
            <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-section-title'>{t('analytics.topClients.title')}</h3>
                <button
                  onClick={handleViewAllClients}
                  className='text-[#357AF3] hover:text-blue-800 text-xs font-semibold'
                >
                  {t('analytics.topClients.viewAllClients')}
                </button>
              </div>
              <div className='space-y-4'>
                {topClients.length > 0 ? (
                  <>
                    {topClients.slice(0, 3).map((client, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex items-center space-x-3'>
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className='w-8 h-8 rounded-full object-cover'
                          />
                          <div>
                            <h4 className='font-semibold text-gray-900 text-sm'>{client.name}</h4>
                            <p className='text-xs text-gray-600'>{client.amount}</p>
                          </div>
                        </div>
                        <button className='text-[#357AF3] hover:text-blue-800 text-xs font-semibold'>
                          <ArrowUpRight className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleViewAllClients}
                      className='w-full text-center text-[#357AF3] hover:text-blue-800 text-sm font-semibold py-2 border border-[#357AF3] rounded-lg hover:bg-blue-50 transition-colors'
                    >
                      {t('analytics.topClients.viewAllClients')}
                    </button>
                  </>
                ) : (
                  <div className='text-center py-8'>
                    <DollarSign className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500 text-sm'>
                      {t('analytics.topClients.noClients', 'No client data available')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className='bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-section-title'>{t('filters.title')}</h3>
              <button
                onClick={clearAllFilters}
                className='text-[#357AF3] hover:text-blue-800 text-sm font-semibold'
              >
                {t('filters.clearAll')}
              </button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('filters.status.label')}
                </label>
                <select
                  value={filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                >
                  <option value=''>{t('filters.status.all')}</option>
                  <option value='paid'>{t('filters.status.paid')}</option>
                  <option value='sent'>{t('filters.status.sent')}</option>
                  <option value='overdue'>{t('filters.status.overdue')}</option>
                  <option value='draft'>{t('filters.status.draft')}</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('filters.client.label')}
                </label>
                <input
                  type='text'
                  value={filters.client}
                  onChange={e => handleFilterChange('client', e.target.value)}
                  placeholder={t('filters.client.all')}
                  className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('filters.dateRange.label')}
                </label>
                <div className='relative'>
                  <input
                    ref={dateInputRef}
                    type='date'
                    value={filters.dateRange}
                    onChange={e => handleFilterChange('dateRange', e.target.value)}
                    placeholder={t('filters.dateRange.placeholder')}
                    className='w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('filters.amount.label')}
                </label>
                <select
                  value={filters.amount}
                  onChange={e => handleFilterChange('amount', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                >
                  <option value=''>{t('filters.amount.any')}</option>
                </select>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={handleApplyFilters}
                  className='w-full bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 font-semibold transition-colors'
                >
                  <Filter className='w-5 h-5' />
                  <span>{t('filters.applyFilters')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className='bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8'>
            <div className='px-8 py-6 border-b border-gray-200 flex justify-between items-center'>
              <h3 className='text-section-title'>{t('table.title')}</h3>
              <div className='relative'>
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <input
                  type='text'
                  placeholder='Search invoices...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-64 bg-white border border-gray-300 rounded-lg pl-12 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500'
                  style={{ textIndent: '20px' }}
                />
              </div>
            </div>

            {/* Table Header */}
            <div className='bg-gray-50 px-8 py-4 border-b border-gray-200 text-table-header'>
              <div className='grid grid-cols-7 gap-6 text-sm font-semibold text-gray-700'>
                <div>{t('table.headers.invoice')}</div>
                <div>{t('table.headers.client')}</div>
                <div>{t('table.headers.issueDate')}</div>
                <div>{t('table.headers.dueDate')}</div>
                <div>{t('table.headers.amount')}</div>
                <div>{t('table.headers.status')}</div>
                <div>{t('table.headers.actions')}</div>
              </div>
            </div>

            {/* Table Body */}
            <div className='divide-y divide-gray-200'>
              {currentInvoices.length > 0 ? (
                currentInvoices.map(invoice => (
                  <div key={invoice.id} className='px-8 py-6 hover:bg-gray-50 transition-colors'>
                    <div className='grid grid-cols-7 gap-6 items-center'>
                      <div>
                        <span className='text-[#357AF3] font-semibold hover:text-blue-800 cursor-pointer transition-colors'>
                          {invoice.id}
                        </span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <img
                          src={invoice.client.avatar}
                          alt={invoice.client.name}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                        <div>
                          <div className='font-semibold text-gray-900'>{invoice.client.name}</div>
                          <div className='text-sm text-gray-500'>{invoice.client.type}</div>
                        </div>
                      </div>
                      <div className='text-gray-600 font-medium'>{invoice.issueDate}</div>
                      <div className='text-gray-600 font-medium'>{invoice.dueDate}</div>
                      <div className='font-bold text-gray-900'>{invoice.amount}</div>
                      <div>{getStatusBadge(invoice.status)}</div>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => handleViewInvoice(invoice.rawData)}
                          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <Eye className='w-4 h-4 text-gray-500' />
                        </button>
                        <button
                          onClick={() => handleEditInvoice(invoice.rawData)}
                          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <Edit className='w-4 h-4 text-gray-500' />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice.rawData)}
                          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <Download className='w-4 h-4 text-gray-500' />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.rawData)}
                          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <Trash2 className='w-4 h-4 text-gray-500' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='px-8 py-16 text-center'>
                  <FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    {t('table.noInvoices.title', 'No invoices found')}
                  </h3>
                  <p className='text-gray-500 mb-6'>
                    {t(
                      'table.noInvoices.description',
                      'Get started by creating your first invoice.',
                    )}
                  </p>
                  <button
                    onClick={handleCreateInvoice}
                    className='bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors font-semibold mx-auto'
                  >
                    <Plus className='w-5 h-5' />
                    <span>{t('actions.createNew', 'Create New Invoice')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            <div className='px-8 py-6 border-t border-gray-200 flex justify-between items-center'>
              <div className='text-sm text-gray-600 font-medium'>
                {t('pagination.showing', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, filteredInvoices.length),
                  total: filteredInvoices.length,
                })}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className='px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                >
                  {t('pagination.previous')}
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      currentPage === index + 1
                        ? 'bg-[#357AF3] text-white border-[#357AF3]'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className='px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'
                >
                  {t('pagination.next')}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className='bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm'>
            <div className='flex justify-between items-center mb-8'>
              <h3 className='text-section-title'>{t('recentActivity.title')}</h3>
              <button className='text-[#357AF3] hover:text-blue-800 text-sm font-semibold'>
                {t('recentActivity.viewAll')}
              </button>
            </div>
            <div className='space-y-6'>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className='flex items-start space-x-4'>
                    <div className={`p-3 rounded-full ${activity.bgColor}`}>
                      <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                    </div>
                    <div className='flex-1'>
                      <p className='text-gray-900 font-medium'>{activity.message}</p>
                      <p className='text-sm text-gray-500 mt-1'>{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-8'>
                  <Clock className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                  <p className='text-gray-500'>
                    {t('recentActivity.noActivity', 'No recent activity to display')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        invoice={selectedInvoice}
        client={selectedClient}
        onInvoiceCreated={handleInvoiceCreated}
        onInvoiceUpdated={handleInvoiceUpdated}
      />

      {/* Quote Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={handleCloseQuoteModal}
        onQuoteCreated={handleQuoteCreated}
        onQuoteUpdated={handleQuoteUpdated}
      />

      {/* View Invoice Modal */}
      <ViewInvoiceModal
        isOpen={isViewInvoiceModalOpen}
        onClose={() => setIsViewInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoicesPage;
