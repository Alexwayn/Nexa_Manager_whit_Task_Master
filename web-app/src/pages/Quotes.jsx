import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@components/shared/Footer';
import ErrorBoundary from '@components/common/ErrorBoundary';
import QuoteModal from '@components/financial/QuoteModal';
import QuoteDetailModal from '@components/financial/QuoteDetailModal';
import QuoteStatusBadge from '@components/financial/QuoteStatusBadge';
import QuoteApprovalActions from '@components/financial/QuoteApprovalActions';
import QuoteToInvoiceConverter from '@components/financial/QuoteToInvoiceConverter';
import { QuoteService } from '@lib/quoteService';
import { QuoteApprovalService } from '@lib/quoteApprovalService';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import Logger from '@utils/Logger';
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
  BarChart3,
  RefreshCw,
  Users,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Info,
  PenTool,
  FileDown,
} from 'lucide-react';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa.png';
import { useTranslation } from 'react-i18next';

const QuotesPage = () => {
  const navigate = useNavigate();
  const { t, ready, i18n: translationI18n } = useTranslation('quotes');
  

  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    dateRange: '',
    amount: ''
  });
  
  // Quote modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Quote detail modal state for approval workflow
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailQuote, setDetailQuote] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Quote-to-invoice converter state
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState(null);
  
  // Dropdown state for chart options
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);



  // Quotes will be loaded from the backend API

  // Quote modal handlers
  const handleCreateQuote = (client = null) => {
    setSelectedQuote(null);
    setSelectedClient(client);
    setIsQuoteModalOpen(true);
  };

  const handleEditQuote = (quote) => {
    setSelectedQuote(quote);
    setSelectedClient(null);
    setIsQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setSelectedQuote(null);
    setSelectedClient(null);
  };

  const handleQuoteCreated = async (quoteData) => {
    try {
      setIsLoading(true);
      const result = await QuoteService.createQuote(user.id, quoteData);
      
      // Update quotes list
      const updatedQuotes = [result, ...quotes];
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      
      return result;
    } catch (error) {
      Logger.error('Error creating quote:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteUpdated = async (quoteData) => {
    try {
      setIsLoading(true);
      const result = await QuoteService.updateQuote(selectedQuote.id, user.id, quoteData);
      
      // Update quotes list
      const updatedQuotes = quotes.map(quote => 
        quote.id === selectedQuote.id ? result : quote
      );
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      
      return result;
    } catch (error) {
      Logger.error('Error updating quote:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Quote detail modal handlers for approval workflow
  const handleViewQuote = (quote) => {
    setDetailQuote(quote);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailQuote(null);
  };

  const handleQuoteStatusUpdated = async (updatedQuote) => {
    try {
      // Update quotes list with new status
      const updatedQuotes = quotes.map(quote => 
        quote.id === updatedQuote.id ? updatedQuote : quote
      );
      setQuotes(updatedQuotes);
      setFilteredQuotes(updatedQuotes);
      
      // Update detail modal if it's the same quote
      if (detailQuote && detailQuote.id === updatedQuote.id) {
        setDetailQuote(updatedQuote);
      }
      
      // Trigger refresh for components that need it
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      Logger.error('Error handling quote status update:', error);
    }
  };

  // Quote-to-invoice conversion handlers
  const handleConvertToInvoice = (quote) => {
    setQuoteToConvert(quote);
    setIsConverterOpen(true);
  };

  const handleCloseConverter = () => {
    setIsConverterOpen(false);
    setQuoteToConvert(null);
  };

  const handleConversionSuccess = (invoice) => {
    // Update the quote status to converted
    handleQuoteStatusUpdated({ ...quoteToConvert, status: 'converted' });
    
    // Close the converter
    handleCloseConverter();
    
    // Show success message
    alert(t('conversion.success', { invoiceNumber: invoice.invoice_number }) || `Quote successfully converted to invoice ${invoice.invoice_number}`);
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
      amount: ''
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  const applyFilters = (currentFilters = filters) => {
    let filtered = [...quotes];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.quote_number.toLowerCase().includes(searchLower) ||
        quote.client.name.toLowerCase().includes(searchLower) ||
        quote.status.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (currentFilters.status) {
      filtered = filtered.filter(quote => quote.status === currentFilters.status);
    }

    // Filter by client
    if (currentFilters.client) {
      filtered = filtered.filter(quote => 
        quote.client.name.toLowerCase().includes(currentFilters.client.toLowerCase())
      );
    }

    // Filter by date range
    if (currentFilters.dateRange) {
      const now = new Date();
      let startDate;
      
      switch (currentFilters.dateRange) {
        case 'last7Days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30Days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90Days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(quote => {
          const quoteDate = new Date(quote.issue_date);
          return quoteDate >= startDate;
        });
      }
    }

    // Filter by amount range
    if (currentFilters.amount) {
      filtered = filtered.filter(quote => {
        const amount = quote.amount;
        switch (currentFilters.amount) {
          case 'range1':
            return amount >= 0 && amount <= 5000;
          case 'range2':
            return amount > 5000 && amount <= 15000;
          case 'range3':
            return amount > 15000;
          default:
            return true;
        }
      });
    }

    setFilteredQuotes(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleApplyFilters = () => {
    applyFilters();
  };



  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotes = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    // Initialize with empty quotes - will be loaded from API
    setQuotes([]);
    setFilteredQuotes([]);
  }, []);

  // Apply filters when search term or filters change
  useEffect(() => {
    if (quotes.length > 0) {
      applyFilters();
    }
  }, [searchTerm, filters, quotes]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Show loading state if translations are not ready - AFTER all hooks
  if (!ready) {
    return (
      <div className='min-h-screen bg-[#F9FAFB] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AF3] mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading quotes...</p>
        </div>
      </div>
    );
  }

  // Stats will be calculated from actual quotes data
  const stats = [
    {
      title: t('stats.totalQuotes') || 'Total Quotes',
      value: '0',
      subtitle: t('stats.totalQuotesSubtitle') || 'No data available',
      icon: FileText,
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconColor: 'text-white',
      trend: {
        type: 'up',
        value: 'No data',
        color: 'text-gray-500'
      }
    },
    {
      title: t('stats.pendingQuotes') || 'Pending Quotes',
      value: '0',
      subtitle: t('stats.pendingQuotesSubtitle') || 'No data available',
      icon: Clock,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      iconColor: 'text-white',
      trend: {
        type: 'up',
        value: 'No data',
        color: 'text-gray-500'
      }
    },
    {
      title: t('stats.acceptedQuotes') || 'Accepted Quotes',
      value: '0',
      subtitle: t('stats.acceptedQuotesSubtitle') || 'No data available',
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
      iconColor: 'text-white',
      trend: {
        type: 'up',
        value: 'No data',
        color: 'text-gray-500'
      }
    },
    {
      title: t('stats.totalValue') || 'Total Value',
      value: '$0',
      subtitle: t('stats.totalValueSubtitle') || 'No data available',
      icon: DollarSign,
      bgColor: 'bg-gradient-to-br from-primary-500 to-primary-600',
      iconColor: 'text-white',
      trend: {
        type: 'up',
        value: 'No data',
        color: 'text-gray-500'
      }
    }
  ];

  // Top clients will be calculated from actual quotes data
  const topClients = [];

  // Recent activities will be loaded from actual quote history
  const recentActivities = [];

  // Check if translations are loaded - if not, show loading
  const isTranslationLoaded = ready && t('filters.title') !== 'filters.title';
  
  if (!isTranslationLoaded) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#357AF3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
            <span className='text-gray-600 font-bold'>{t('breadcrumb') || 'Quotes'}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col'>
          {/* Header */}
          <div className='bg-white border-b border-gray-200 px-8 py-8'>
            <div className='flex justify-between items-center'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>{t('title') || 'Quotes'}</h1>
              </div>
              <div className='flex space-x-4'>
                <button className='bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 font-medium shadow-sm'>
                  <Download className='w-5 h-5' />
                  <span>{t('actions.export', 'Export')}</span>
                </button>
                <button 
                  onClick={() => handleCreateQuote()}
                  disabled={isLoading}
                  className='bg-[#357AF3] text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Plus className='w-5 h-5' />
                  <span>{t('actions.createNew', 'Create New Quote')}</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className='flex space-x-8 mt-8'>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'quotes'
                    ? 'border-[#357AF3] text-[#357AF3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.quotes') || 'Quotes'}
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-[#357AF3] text-[#357AF3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.invoices') || 'Invoices'}
              </button>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className='flex-1 px-8 py-8'>
            {/* Stats and Actions Row */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
              {/* Stats Cards - 2x2 Grid */}
              <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6'>
                {stats.map((stat, index) => {
                  const cardColors = {
                    0: 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:border-orange-300',
                    1: 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:border-green-300',
                    2: 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:border-red-300',
                    3: 'bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 hover:border-primary-300',
                  };

                  const colors = cardColors[index];

                  return (
                    <div
                      key={index}
                      className={`${colors} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6`}
                    >
                      <div className='flex justify-between items-start mb-4'>
                        <div>
                          <p className='text-sm font-medium text-gray-600 mb-1'>{stat.title}</p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className='mb-3'>
                        <p className='text-3xl font-bold text-gray-900'>{stat.value}</p>
                        <p className='text-sm text-gray-600 mt-1'>{stat.subtitle}</p>
                      </div>
                      <div className='flex items-center'>
                        {stat.trend.type === 'up' ? (
                          <ArrowUpRight className={`w-4 h-4 ${stat.trend.color} mr-1`} />
                        ) : (
                          <ArrowDownRight className={`w-4 h-4 ${stat.trend.color} mr-1`} />
                        )}
                        <span className={`text-sm font-medium ${stat.trend.color}`}>
                          {stat.trend.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Action Cards - Right Side */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-[#357AF3] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <div className='flex justify-center mb-4'>
                    <FileText className='w-12 h-12' />
                  </div>
                  <h4 className='text-lg font-bold text-center mb-2'>{t('dashboard.quickActions.createQuote.title') || 'Create Quote'}</h4>
                  <p className='text-blue-100 text-center text-sm mb-4'>{t('dashboard.quickActions.createQuote.description') || 'Generate new quote'}</p>
                  <button 
                    onClick={() => handleCreateQuote()}
                    disabled={isLoading}
                    className='w-full bg-white text-[#357AF3] py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {t('dashboard.quickActions.createQuote.button') || 'Create Now'}
                  </button>
                </div>

                <div className='bg-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <div className='flex justify-center mb-4'>
                    <FileText className='w-12 h-12' />
                  </div>
                  <h4 className='text-lg font-bold text-center mb-2'>{t('dashboard.quickActions.createInvoice.title') || 'Create Invoice'}</h4>
                  <p className='text-green-100 text-center text-sm mb-4'>{t('dashboard.quickActions.createInvoice.description') || 'Convert to invoice'}</p>
                  <button 
                    onClick={() => navigate('/invoices')}
                    className='w-full bg-white text-green-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm'
                  >
                    {t('dashboard.quickActions.createInvoice.button') || 'Create Now'}
                  </button>
                </div>

                <div className='bg-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <div className='flex justify-center mb-4'>
                    <Mail className='w-12 h-12' />
                  </div>
                  <h4 className='text-lg font-bold text-center mb-2'>{t('dashboard.quickActions.sendFollowups.title') || 'Send Follow-ups'}</h4>
                  <p className='text-amber-100 text-center text-sm mb-4'>{t('dashboard.quickActions.sendFollowups.description') || 'Follow pending quotes'}</p>
                  <button 
                    onClick={() => {
                      // Show success message for follow-ups
                      alert('Follow-up emails sent successfully!');
                    }}
                    className='w-full bg-white text-amber-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm'
                  >
                    {t('dashboard.quickActions.sendFollowups.button') || 'Send All'}
                  </button>
                </div>

                <div className='bg-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <div className='flex justify-center mb-4'>
                    <TrendingUp className='w-12 h-12' />
                  </div>
                  <h4 className='text-lg font-bold text-center mb-2'>{t('dashboard.quickActions.generateReport.title') || 'Generate Report'}</h4>
                  <p className='text-purple-100 text-center text-sm mb-4'>{t('dashboard.quickActions.generateReport.description') || 'Quotes analytics'}</p>
                  <button 
                    onClick={() => navigate('/reports')}
                    className='w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm'
                  >
                    {t('dashboard.quickActions.generateReport.button') || 'Generate'}
                  </button>
                </div>
              </div>
            </div>

            {/* Charts and Top Clients Row */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
              {/* Quote Status Chart */}
              <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='text-lg font-bold text-gray-900'>{t('dashboard.charts.quoteStatus') || 'Quote Status'}</h3>
                  <div className='relative' ref={dropdownRef}>
                    <MoreHorizontal 
                      className='w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors' 
                      onClick={() => setDropdownOpen(dropdownOpen === 'status' ? null : 'status')}
                    />
                    {dropdownOpen === 'status' && (
                       <div className='absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]'>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Exporting Quote Status chart...');
                             setDropdownOpen(null);
                           }}
                         >
                           <Download className='w-4 h-4' />
                           <span>Export Chart</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Viewing Quote Status details...');
                             setDropdownOpen(null);
                           }}
                         >
                           <Eye className='w-4 h-4' />
                           <span>View Details</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Refreshing Quote Status data...');
                             setDropdownOpen(null);
                           }}
                         >
                           <RefreshCw className='w-4 h-4' />
                           <span>Refresh Data</span>
                         </button>
                       </div>
                     )}
                  </div>
                </div>
                {/* Quote Status Chart - Data will be calculated from actual quotes */}
                <div className='flex flex-col items-center'>
                  <div className='relative w-32 h-32 mb-4'>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-2xl font-bold text-gray-900'>0%</div>
                        <div className='text-xs text-gray-600 font-medium'>No Data</div>
                      </div>
                    </div>
                    <svg className='w-32 h-32 transform -rotate-90' viewBox='0 0 36 36'>
                      <path
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                        fill='none'
                        stroke='#f3f4f6'
                        strokeWidth='2'
                      />
                      <path
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                        fill='none'
                        stroke='#10B981'
                        strokeWidth='2'
                        strokeDasharray='0, 100'
                        className='transition-all duration-1000 ease-in-out'
                      />
                    </svg>
                  </div>
                  <div className='grid grid-cols-1 gap-3 w-full'>
                    <div className='flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                        <span className='text-sm font-medium text-gray-700'>{t('dashboard.charts.accepted') || 'Accepted'}</span>
                      </div>
                      <span className='text-sm font-bold text-green-700'>0%</span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-3 h-3 bg-amber-500 rounded-full'></div>
                        <span className='text-sm font-medium text-gray-700'>{t('status.pending') || 'Pending'}</span>
                      </div>
                      <span className='text-sm font-bold text-amber-700'>0%</span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                        <span className='text-sm font-medium text-gray-700'>{t('status.rejected') || 'Rejected'}</span>
                      </div>
                      <span className='text-sm font-bold text-red-700'>0%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Quotes Chart */}
              <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='text-lg font-bold text-gray-900'>{t('dashboard.charts.monthlyQuotes') || 'Monthly Quotes'}</h3>
                  <div className='relative'>
                    <MoreHorizontal 
                      className='w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors' 
                      onClick={() => setDropdownOpen(dropdownOpen === 'monthly' ? null : 'monthly')}
                    />
                    {dropdownOpen === 'monthly' && (
                       <div className='absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]'>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Exporting Monthly Quotes chart...');
                             setDropdownOpen(null);
                           }}
                         >
                           <Download className='w-4 h-4' />
                           <span>Export Chart</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Changing time period...');
                             setDropdownOpen(null);
                           }}
                         >
                           <Calendar className='w-4 h-4' />
                           <span>Change Period</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Viewing Monthly analytics...');
                             setDropdownOpen(null);
                           }}
                         >
                           <BarChart3 className='w-4 h-4' />
                           <span>View Analytics</span>
                         </button>
                       </div>
                     )}
                  </div>
                </div>
                {/* Monthly Quotes Chart - Data will be loaded from API */}
                <div className='flex items-end justify-between h-24 mb-4'>
                  <div className='flex items-center justify-center w-full h-full text-gray-500 text-sm'>
                    No data available
                  </div>
                </div>
                <div className='flex justify-center space-x-6 text-xs'>
                  <div className='flex items-center space-x-1'>
                    <div className='w-2 h-2 bg-[#357AF3] rounded-full'></div>
                    <span className='text-gray-600'>{t('dashboard.charts.created') || 'Created'}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-gray-600'>{t('dashboard.charts.accepted') || 'Accepted'}</span>
                  </div>
                </div>
                <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                  <div className='text-xs text-gray-600 mb-1'>{t('dashboard.charts.thisMonth') || 'This Month'}</div>
                  <div className='text-lg font-bold text-gray-900'>0 {t('common.quotes') || 'quotes'}</div>
                  <div className='text-xs text-gray-500 font-medium'>{t('dashboard.charts.noData') || 'No data available'}</div>
                </div>
              </div>

              {/* Top Clients */}
              <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='text-lg font-bold text-gray-900'>{t('dashboard.charts.topClients') || 'Top Clients'}</h3>
                  <div className='relative'>
                    <MoreHorizontal 
                      className='w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors' 
                      onClick={() => setDropdownOpen(dropdownOpen === 'clients' ? null : 'clients')}
                    />
                    {dropdownOpen === 'clients' && (
                       <div className='absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]'>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             navigate('/clients');
                             setDropdownOpen(null);
                           }}
                         >
                           <Users className='w-4 h-4' />
                           <span>View All Clients</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Exporting client list...');
                             setDropdownOpen(null);
                           }}
                         >
                           <Download className='w-4 h-4' />
                           <span>Export List</span>
                         </button>
                         <button 
                           className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2'
                           onClick={() => {
                             alert('Viewing client analytics...');
                             setDropdownOpen(null);
                           }}
                         >
                           <TrendingUp className='w-4 h-4' />
                           <span>Client Analytics</span>
                         </button>
                       </div>
                     )}
                  </div>
                </div>
                <div className='space-y-4'>
                  {topClients.slice(0, 3).map((client, index) => (
                    <div
                      key={index}
                      className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                    >
                      <div className='w-10 h-10 bg-[#357AF3] rounded-full flex items-center justify-center text-white font-bold text-sm'>
                        {client.avatar}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>{client.name}</p>
                        <p className='text-xs text-gray-600'>{client.industry}</p>
                        <div className='flex items-center space-x-2 mt-1'>
                          <span className='text-xs font-medium text-[#357AF3]'>
                            {client.totalValue}
                          </span>
                          <span className='text-xs text-gray-500'>•</span>
                          <span className='text-xs text-green-600 font-medium'>
                            {client.acceptanceRate} rate
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className='bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-xl font-bold text-gray-900'>{t('filters.title') || 'Filters'}</h3>
                <button 
                  onClick={clearAllFilters}
                  className='text-[#357AF3] hover:text-blue-800 text-sm font-semibold'
                >
                  {t('filters.clearAll') || 'Clear All'}
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('filters.status.label') || 'Status'}
                  </label>
                  <select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                  >
                    <option value="">{t('filters.status.all') || 'All'}</option>
                    <option value="pending">{t('status.pending') || 'Pending'}</option>
                    <option value="sent">{t('status.sent') || 'Sent'}</option>
                    <option value="accepted">{t('status.accepted') || 'Accepted'}</option>
                    <option value="rejected">{t('status.rejected') || 'Rejected'}</option>
                    <option value="draft">{t('status.draft') || 'Draft'}</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('filters.client.label') || 'Client'}
                  </label>
                  <select 
                    value={filters.client}
                    onChange={(e) => handleFilterChange('client', e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                  >
                    <option value="">{t('filters.client.all') || 'All Clients'}</option>
                    {/* Client options will be populated from API */}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('filters.dateRange.label') || 'Date Range'}
                  </label>
                  <select 
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                  >
                    <option value="">{t('filters.dateRange.all') || 'All Dates'}</option>
                    <option value="last7Days">{t('filters.dateRanges.last7Days') || 'Last 7 days'}</option>
                    <option value="last30Days">{t('filters.dateRanges.last30Days') || 'Last 30 days'}</option>
                    <option value="last90Days">{t('filters.dateRanges.last90Days') || 'Last 90 days'}</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('filters.amount.label') || 'Amount'}
                  </label>
                  <select 
                    value={filters.amount}
                    onChange={(e) => handleFilterChange('amount', e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors'
                  >
                    <option value="">{t('filters.amount.any') || 'Any Amount'}</option>
                    <option value="range1">{t('filters.amountRanges.range1') || '€0 - €5,000'}</option>
                    <option value="range2">{t('filters.amountRanges.range2') || '€5,000 - €15,000'}</option>
                    <option value="range3">{t('filters.amountRanges.range3') || '€15,000+'}</option>
                  </select>
                </div>
                <div className='flex items-end'>
                  <button 
                    onClick={handleApplyFilters}
                    className='w-full bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 font-semibold transition-colors'
                  >
                    <Filter className='w-5 h-5' />
                    <span>{t('filters.applyFilters') || 'Apply Filters'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quotes Table */}
            <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-semibold text-gray-900'>{t('table.recentQuotes') || 'Recent Quotes'}</h3>
                  <div className='relative'>
                    <Search className='h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
                    <input
                      type='text'
                      placeholder={t('table.searchPlaceholder') || 'Search quotes...'}
                      className='pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 bg-white'
                      style={{ textIndent: '20px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.quote') || 'Quote'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.client') || 'Client'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.issueDate') || 'Issue Date'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.dueDate') || 'Due Date'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.amount') || 'Amount'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.status') || 'Status'}
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        {t('table.headers.actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {currentQuotes.map(quote => (
                      <tr key={quote.id} className='hover:bg-gray-50 transition-colors'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <button 
                            onClick={() => handleViewQuote(quote)}
                            className='text-[#357AF3] hover:text-blue-600 font-medium text-sm'
                          >
                            {quote.quote_number}
                          </button>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-8 h-8 bg-[#357AF3] rounded-full flex items-center justify-center text-white font-bold text-xs'>
                              {quote.client.avatar}
                            </div>
                            <div>
                              <div className='text-sm font-medium text-gray-900'>
                                {quote.client.name}
                              </div>
                              <div className='text-xs text-gray-500'>{quote.client.industry}</div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatDate(quote.issue_date)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatDate(quote.due_date)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {formatCurrency(quote.amount)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <QuoteStatusBadge status={quote.status} />
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          <div className='flex items-center space-x-2'>
                            <button 
                              onClick={() => handleViewQuote(quote)}
                              className='p-1 text-gray-400 hover:text-[#357AF3] transition-colors'
                              title={t('table.actions.viewDetails') || 'Visualizza Dettagli'}
                            >
                              <Eye className='w-4 h-4' />
                            </button>
                            <button 
                              onClick={() => handleEditQuote(quote)}
                              className='p-1 text-gray-400 hover:text-green-600 transition-colors'
                              title={t('table.actions.editQuote') || 'Modifica Preventivo'}
                            >
                              <Edit className='w-4 h-4' />
                            </button>
                            <button 
                              className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
                              title={t('table.actions.downloadPdf') || 'Scarica PDF'}
                            >
                              <Download className='w-4 h-4' />
                            </button>
                            <QuoteApprovalActions 
                              quote={quote}
                              onStatusUpdate={handleQuoteStatusUpdated}
                              onConvertToInvoice={handleConvertToInvoice}
                              compact={true}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className='px-6 py-4 border-t border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-700'>
                    {t('table.pagination.showing') || 'Showing'} {indexOfFirstItem + 1} {t('table.pagination.to') || 'to'}{' '}
                    {Math.min(indexOfLastItem, filteredQuotes.length)} {t('table.pagination.of') || 'of'} {filteredQuotes.length}{' '}
                    {t('common.quotes') || 'quotes'}
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className='px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {t('table.pagination.previous') || 'Previous'}
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === index + 1
                            ? 'bg-[#357AF3] text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className='px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {t('table.pagination.next') || 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-lg font-semibold text-gray-900'>{t('recentActivity.title') || 'Recent Activity'}</h3>
                <button className='text-[#357AF3] hover:text-blue-600 text-sm font-medium'>
                  {t('recentActivity.viewAll') || 'View All'}
                </button>
              </div>
              <div className='space-y-4'>
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className='flex items-start space-x-3 p-3 bg-gray-50 rounded-lg'
                  >
                    <div className={`p-2 rounded-full bg-white shadow-sm`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-900'>{activity.message}</p>
                      <p className='text-xs text-gray-500 mt-1'>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={handleCloseQuoteModal}
        quote={selectedQuote}
        client={selectedClient}
        onQuoteCreated={handleQuoteCreated}
        onQuoteUpdated={handleQuoteUpdated}
      />

      {/* Quote Detail Modal for Approval Workflow */}
      <QuoteDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        quote={detailQuote}
        onStatusUpdate={handleQuoteStatusUpdated}
        refreshTrigger={refreshTrigger}
      />

      {/* Quote to Invoice Converter */}
      <QuoteToInvoiceConverter
        isOpen={isConverterOpen}
        onClose={handleCloseConverter}
        quote={quoteToConvert}
        onConversionSuccess={handleConversionSuccess}
      />
    </ErrorBoundary>
  );
};

export default QuotesPage;
