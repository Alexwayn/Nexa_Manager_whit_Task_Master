import React, { useState, useEffect } from 'react';
import Footer from '@components/shared/Footer';
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
import nexaLogo from '@assets/logo_nexa.png';
import { useTranslation } from 'react-i18next';

const QuotesPage = () => {
  const { t, ready } = useTranslation('quotes');
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Safe translation function that handles loading state and interpolation
  const safeT = (key, options = {}, fallback = key) => {
    if (!ready) return fallback;
    return t(key, options);
  };

  // Mock data for quotes - defined before useEffect
  const mockQuotes = [
    {
      id: 1,
      quote_number: 'PREV-2024-001',
      client: {
        name: 'Acme Corporation',
        avatar: 'AC',
        industry: 'Technology',
        email: 'contact@acme.com',
      },
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      amount: 15750.0,
      status: 'pending',
    },
    {
      id: 2,
      quote_number: 'PREV-2024-002',
      client: {
        name: 'Globex Industries',
        avatar: 'GI',
        industry: 'Manufacturing',
        email: 'info@globex.com',
      },
      issue_date: '2024-01-18',
      due_date: '2024-02-18',
      amount: 8200.0,
      status: 'accepted',
    },
    {
      id: 3,
      quote_number: 'PREV-2024-003',
      client: {
        name: 'Soylent Corp',
        avatar: 'SC',
        industry: 'Food & Beverage',
        email: 'hello@soylent.com',
      },
      issue_date: '2024-01-20',
      due_date: '2024-02-20',
      amount: 12500.0,
      status: 'rejected',
    },
    {
      id: 4,
      quote_number: 'PREV-2024-004',
      client: {
        name: 'Initech LLC',
        avatar: 'IL',
        industry: 'Software',
        email: 'contact@initech.com',
      },
      issue_date: '2024-01-22',
      due_date: '2024-02-22',
      amount: 9750.0,
      status: 'draft',
    },
  ];

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    setQuotes(mockQuotes);
    setFilteredQuotes(mockQuotes);
  }, []); // Empty dependency array since mockQuotes is static

  // Show loading state if translations are not ready - AFTER all hooks
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AF3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  // Stats data for quotes
  const stats = [
    {
      title: 'Total Pending',
      amount: '$32,850.00',
      subtitle: 'From 24 quotes',
      trend: { value: '15% from last month', type: 'up', color: 'text-orange-600' },
      icon: DollarSign,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Accepted This Month',
      amount: '$28,430.00',
      subtitle: 'From 18 quotes',
      trend: { value: '12% from last month', type: 'up', color: 'text-green-600' },
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Rejected',
      amount: '$6,250.00',
      subtitle: 'From 5 quotes',
      trend: { value: '3% from last month', type: 'up', color: 'text-red-600' },
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Average Response Time',
      amount: '5 days',
      subtitle: 'Last 30 days',
      trend: { value: '1 day improvement', type: 'down', color: 'text-green-600' },
      icon: Clock,
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#357AF3]',
    },
  ];

  // Top clients data for quotes
  const topClients = [
    {
      name: 'Acme Corporation',
      avatar: 'AC',
      totalQuotes: 12,
      acceptedQuotes: 10,
      totalValue: '$45,750.00',
      acceptanceRate: '83%',
      industry: 'Technology',
    },
    {
      name: 'Globex Industries',
      avatar: 'GI',
      totalQuotes: 8,
      acceptedQuotes: 7,
      totalValue: '$32,200.00',
      acceptanceRate: '88%',
      industry: 'Manufacturing',
    },
    {
      name: 'Soylent Corp',
      avatar: 'SC',
      totalQuotes: 6,
      acceptedQuotes: 4,
      totalValue: '$28,500.00',
      acceptanceRate: '67%',
      industry: 'Food & Beverage',
    },
    {
      name: 'Initech LLC',
      avatar: 'IL',
      totalQuotes: 5,
      acceptedQuotes: 5,
      totalValue: '$22,750.00',
      acceptanceRate: '100%',
      industry: 'Software',
    },
  ];

  // Recent activities for quotes
  const recentActivities = [
    {
      id: 1,
      type: 'quote_created',
      message: safeT('recentActivities.quoteCreated', {
        quoteNumber: 'PREV-2024-015',
        clientName: 'Tech Solutions Inc.',
      }, 'Quote PREV-2024-015 created for Tech Solutions Inc.'),
      time: '2 hours ago',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      id: 2,
      type: 'quote_accepted',
      message: safeT('recentActivities.quoteAccepted', {
        quoteNumber: 'PREV-2024-014',
        clientName: 'Global Manufacturing',
      }, 'Quote PREV-2024-014 accepted by Global Manufacturing'),
      time: '4 hours ago',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      id: 3,
      type: 'quote_sent',
      message: safeT('recentActivities.quoteSent', {
        quoteNumber: 'PREV-2024-013',
        clientName: 'Digital Agency Pro',
      }, 'Quote PREV-2024-013 sent to Digital Agency Pro'),
      time: '6 hours ago',
      icon: Mail,
      color: 'text-purple-600',
    },
    {
      id: 4,
      type: 'quote_rejected',
      message: safeT('recentActivities.quoteRejected', {
        quoteNumber: 'PREV-2024-012',
        clientName: 'StartupCo',
      }, 'Quote PREV-2024-012 rejected by StartupCo'),
      time: '1 day ago',
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    return safeT(`status.${status}`, {}, status.charAt(0).toUpperCase() + status.slice(1));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotes = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border-b border-gray-200 px-6 py-3 flex items-center space-x-2">
        <ChevronLeft className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600 text-sm">{safeT('breadcrumb', {}, 'Quotes')}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{safeT('title', {}, 'Quotes')}</h1>
            </div>
            <div className="flex space-x-4">
              <button className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 font-medium shadow-sm">
                <Download className="w-5 h-5" />
                <span>{safeT('actions.export', {}, 'Export')}</span>
              </button>
              <button className="bg-[#357AF3] text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2 font-medium shadow-sm">
                <Plus className="w-5 h-5" />
                <span>{safeT('actions.createNew', {}, 'Create New Quote')}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 mt-8">
            {['quotes', 'invoices'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-[#357AF3] text-[#357AF3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'quotes' ? 'Quotes' : 'Invoices'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 px-8 py-8">
          {/* Stats and Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Stats Cards - 2x2 Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const cardColors = {
                  0: {
                    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
                    border: 'border-orange-200',
                    shadow: 'shadow-orange-100/50',
                  },
                  1: {
                    bg: 'bg-gradient-to-br from-green-50 to-green-100',
                    border: 'border-green-200',
                    shadow: 'shadow-green-100/50',
                  },
                  2: {
                    bg: 'bg-gradient-to-br from-red-50 to-red-100',
                    border: 'border-red-200',
                    shadow: 'shadow-red-100/50',
                  },
                  3: {
                    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
                    border: 'border-blue-200',
                    shadow: 'shadow-blue-100/50',
                  },
                };

                const colors = cardColors[index];

                return (
                  <div
                    key={index}
                    className={`${colors.bg} rounded-xl border-2 ${colors.border} p-6 shadow-lg ${colors.shadow} hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-gray-900">{stat.amount}</p>
                      <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
                    </div>
                    <div className="flex items-center">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#357AF3] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-center mb-4">
                  <FileText className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">Create Quote</h4>
                <p className="text-blue-100 text-center text-sm mb-4">Generate new quote</p>
                <button className="w-full bg-white text-[#357AF3] py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  Create Now
                </button>
              </div>

              <div className="bg-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-center mb-4">
                  <FileText className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">Create Invoice</h4>
                <p className="text-green-100 text-center text-sm mb-4">Convert to invoice</p>
                <button className="w-full bg-white text-green-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  Create Now
                </button>
              </div>

              <div className="bg-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">Send Follow-ups</h4>
                <p className="text-amber-100 text-center text-sm mb-4">Follow pending quotes</p>
                <button className="w-full bg-white text-amber-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  Send All
                </button>
              </div>

              <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-center mb-4">
                  <TrendingUp className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">Generate Report</h4>
                <p className="text-purple-100 text-center text-sm mb-4">Quotes analytics</p>
                <button className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Charts and Top Clients Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quote Status Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Quote Status</h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">62%</div>
                      <div className="text-xs text-gray-600 font-medium">Accepted</div>
                    </div>
                  </div>
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="62, 100"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full">
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Accepted</span>
                    </div>
                    <span className="text-sm font-bold text-green-700">62%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">25%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Rejected</span>
                    </div>
                    <span className="text-sm font-bold text-red-700">13%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Quotes Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Monthly Quotes</h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
              </div>
              <div className="flex items-end justify-between h-24 mb-4">
                {[
                  { created: 28, accepted: 22 },
                  { created: 35, accepted: 28 },
                  { created: 32, accepted: 26 },
                  { created: 42, accepted: 35 },
                  { created: 38, accepted: 30 },
                  { created: 45, accepted: 38 },
                ].map((data, index) => (
                  <div key={index} className="flex flex-col items-center space-y-1">
                    <div className="flex flex-col items-center space-y-1">
                      <div
                        className="w-3 bg-[#357AF3] rounded-t transition-all duration-1000 ease-in-out"
                        style={{ height: `${(data.created / 50) * 60}px` }}
                      />
                      <div
                        className="w-3 bg-green-500 rounded-t transition-all duration-1000 ease-in-out"
                        style={{ height: `${(data.accepted / 50) * 60}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center space-x-6 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-[#357AF3] rounded-full"></div>
                  <span className="text-gray-600">Created</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Accepted</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">This Month</div>
                <div className="text-lg font-bold text-gray-900">45 quotes</div>
                <div className="text-xs text-green-600 font-medium">+12% from last month</div>
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Top Clients</h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
              </div>
              <div className="space-y-4">
                {topClients.slice(0, 3).map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#357AF3] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {client.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-600">{client.industry}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-medium text-[#357AF3]">
                          {client.totalValue}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-green-600 font-medium">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#357AF3] focus:border-transparent">
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Accepted</option>
                    <option>Rejected</option>
                    <option>Draft</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#357AF3] focus:border-transparent">
                    <option>All Clients</option>
                    <option>Acme Corporation</option>
                    <option>Globex Industries</option>
                    <option>Soylent Corp</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#357AF3] focus:border-transparent">
                    <option>Date Range</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#357AF3] focus:border-transparent">
                    <option>Amount Range</option>
                    <option>$0 - $5,000</option>
                    <option>$5,000 - $15,000</option>
                    <option>$15,000+</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <button className="bg-[#357AF3] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm">
                Apply Filters
              </button>
            </div>
          </div>

          {/* Quotes Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Quotes</h3>
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search quotes..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#357AF3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-[#357AF3] hover:text-blue-600 font-medium text-sm">
                          {quote.quote_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#357AF3] rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {quote.client.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {quote.client.name}
                            </div>
                            <div className="text-xs text-gray-500">{quote.client.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quote.issue_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quote.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(quote.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}
                        >
                          {getStatusText(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-[#357AF3] transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to{' '}
                  {Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length}{' '}
                  quotes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
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
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button className="text-[#357AF3] hover:text-blue-600 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`p-2 rounded-full bg-white shadow-sm`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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
  );
};

export default QuotesPage;
