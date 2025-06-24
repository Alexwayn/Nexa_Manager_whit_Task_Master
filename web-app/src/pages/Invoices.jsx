import React, { useState, useEffect } from 'react';
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
import Footer from '@components/shared/Footer';

const InvoicesPage = () => {
  // Always call ALL hooks first, in the same order every render
  const { t, ready } = useTranslation('invoices');
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data per le fatture - defined before useEffect
  const mockInvoices = [
    {
      id: 'INV-2023-056',
      client: {
        name: 'Acme Corporation',
        type: 'Technology',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '10 Jun 2023',
      dueDate: '24 Jun 2023',
      amount: '$3,450.00',
      status: 'paid',
    },
    {
      id: 'INV-2023-055',
      client: {
        name: 'Globex Industries',
        type: 'Manufacturing',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '05 Jun 2023',
      dueDate: '19 Jun 2023',
      amount: '$5,780.00',
      status: 'sent',
    },
    {
      id: 'INV-2023-054',
      client: {
        name: 'Soylent Corp',
        type: 'Food & Beverage',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b693?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '01 Jun 2023',
      dueDate: '15 Jun 2023',
      amount: '$2,150.00',
      status: 'paid',
    },
    {
      id: 'INV-2023-053',
      client: {
        name: 'Initech LLC',
        type: 'Software',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '28 May 2023',
      dueDate: '11 Jun 2023',
      amount: '$1,890.00',
      status: 'overdue',
    },
    {
      id: 'INV-2023-052',
      client: {
        name: 'Umbrella Corp',
        type: 'Pharmaceuticals',
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '25 May 2023',
      dueDate: '08 Jun 2023',
      amount: '$4,220.00',
      status: 'overdue',
    },
    {
      id: 'INV-2023-051',
      client: {
        name: 'Wayne Enterprises',
        type: 'Technology',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '20 May 2023',
      dueDate: '03 Jun 2023',
      amount: '$7,350.00',
      status: 'paid',
    },
    {
      id: 'INV-2023-050',
      client: {
        name: 'Stark Industries',
        type: 'Technology',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '15 May 2023',
      dueDate: '29 May 2023',
      amount: '$6,120.00',
      status: 'paid',
    },
    {
      id: 'INV-2023-049',
      client: {
        name: 'Cyberdyne Systems',
        type: 'Technology',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b693?w=40&h=40&fit=crop&crop=face&auto=format',
      },
      issueDate: '10 May 2023',
      dueDate: '24 May 2023',
      amount: '$3,890.00',
      status: 'draft',
    },
  ];

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
  }, []); // Empty dependency array since mockInvoices is static

  // Show loading state if translations are not ready - AFTER all hooks
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AF3] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock data per le statistiche
  const stats = [
    {
      title: t('stats.totalOutstanding.title'),
      amount: '$24,580.00',
      subtitle: t('stats.totalOutstanding.subtitle', { count: 38 }),
      trend: {
        value: t('stats.totalOutstanding.trend', { percent: 12 }),
        type: 'up',
        color: 'text-orange-600',
      },
      icon: DollarSign,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: t('stats.paidThisMonth.title'),
      amount: '$18,230.00',
      subtitle: t('stats.paidThisMonth.subtitle', { count: 26 }),
      trend: {
        value: t('stats.paidThisMonth.trend', { percent: 8 }),
        type: 'up',
        color: 'text-green-600',
      },
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: t('stats.overdue.title'),
      amount: '$8,750.00',
      subtitle: t('stats.overdue.subtitle', { count: 12 }),
      trend: { value: t('stats.overdue.trend', { percent: 5 }), type: 'up', color: 'text-red-600' },
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: t('stats.averagePaymentTime.title'),
      amount: '8 days',
      subtitle: t('stats.averagePaymentTime.subtitle'),
      trend: {
        value: t('stats.averagePaymentTime.trend', { days: 2 }),
        type: 'down',
        color: 'text-green-600',
      },
      icon: Clock,
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#357AF3]',
    },
  ];

  // Top clients data
  const topClients = [
    {
      name: 'Acme Corporation',
      amount: '$12,580.00',
      onTimePercentage: '95% on time',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
    },
    {
      name: 'Globex Industries',
      amount: '$9,240.00',
      onTimePercentage: '85% on time',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format',
    },
    {
      name: 'Soylent Corp',
      amount: '$6,450.00',
      onTimePercentage: '100% on time',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b693?w=40&h=40&fit=crop&crop=face&auto=format',
    },
    {
      name: 'Initech LLC',
      amount: '$4,320.00',
      onTimePercentage: '75% on time',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face&auto=format',
    },
  ];

  // Recent activity data
  const recentActivities = [
    {
      type: 'payment',
      message: t('recentActivity.payment', {
        invoiceId: 'INV-2023-056',
        clientName: 'Acme Corporation',
      }),
      time: t('recentActivity.time.minutesAgo', { count: 10 }),
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      type: 'created',
      message: t('recentActivity.created', {
        invoiceId: 'INV-2023-057',
        clientName: 'Wayne Enterprises',
      }),
      time: t('recentActivity.time.hourAgo'),
      icon: FileText,
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#357AF3]',
    },
    {
      type: 'reminder',
      message: t('recentActivity.reminder', {
        clientName: 'Initech LLC',
        invoiceId: 'INV-2023-053',
      }),
      time: t('recentActivity.time.hoursAgo', { count: 3 }),
      icon: Bell,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      type: 'overdue',
      message: t('recentActivity.overdue', {
        invoiceId: 'INV-2023-052',
        clientName: 'Wayne Enterprises',
      }),
      time: t('recentActivity.time.dayAgo'),
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  const getStatusBadge = (status) => {
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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border-b border-gray-200 px-6 py-3 flex items-center space-x-2">
        <ChevronLeft className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600 text-sm">{t('breadcrumb')}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            </div>
            <div className="flex space-x-3">
              <button className="bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors font-semibold">
                <Plus className="w-5 h-5" />
                <span>{t('actions.createNew')}</span>
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-colors font-semibold">
                <Download className="w-5 h-5" />
                <span>{t('actions.export')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-8">
          <div className="flex space-x-8">
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
              onClick={() => setActiveTab('quotes')}
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
        <div className="px-8 py-8">
          {/* Stats Cards + Action Buttons - Combined Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left: Stats Cards (2x2 Grid) */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat, index) => {
                  // Define card colors based on stat type
                  const cardColors = {
                    0: {
                      // Total Outstanding
                      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
                      border: 'border-orange-200',
                      shadow: 'shadow-orange-100/50',
                    },
                    1: {
                      // Paid This Month
                      bg: 'bg-gradient-to-br from-green-50 to-green-100',
                      border: 'border-green-200',
                      shadow: 'shadow-green-100/50',
                    },
                    2: {
                      // Overdue
                      bg: 'bg-gradient-to-br from-red-50 to-red-100',
                      border: 'border-red-200',
                      shadow: 'shadow-red-100/50',
                    },
                    3: {
                      // Average Payment Time
                      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
                      border: 'border-blue-200',
                      shadow: 'shadow-blue-100/50',
                    },
                  };

                  return (
                    <div
                      key={index}
                      className={`${cardColors[index].bg} rounded-xl border-2 ${cardColors[index].border} p-6 shadow-lg ${cardColors[index].shadow} hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">{stat.title}</p>
                        </div>
                        <div
                          className={`p-3 rounded-full ${stat.bgColor} ring-2 ring-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                        >
                          <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                          {stat.amount}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">{stat.subtitle}</p>
                      </div>
                      <div className="flex items-center bg-white/60 rounded-lg px-3 py-2 backdrop-blur-sm">
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

            {/* Right: Quick Action Cards - Beautiful Design */}
            <div className="grid grid-cols-2 gap-4">
              {/* Create Invoice */}
              <div className="bg-[#357AF3] rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex justify-center mb-4">
                  <FileText className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">
                  {t('quickActions.createInvoice.title')}
                </h4>
                <p className="text-blue-100 text-center text-sm mb-4">
                  {t('quickActions.createInvoice.description')}
                </p>
                <button className="w-full bg-white text-[#357AF3] py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  {t('quickActions.createInvoice.button')}
                </button>
              </div>

              {/* Create Quote */}
              <div className="bg-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex justify-center mb-4">
                  <FileText className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">
                  {t('quickActions.createQuote.title')}
                </h4>
                <p className="text-green-100 text-center text-sm mb-4">
                  {t('quickActions.createQuote.description')}
                </p>
                <button className="w-full bg-white text-green-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  {t('quickActions.createQuote.button')}
                </button>
              </div>

              {/* Send Reminders */}
              <div className="bg-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">
                  {t('quickActions.sendReminders.title')}
                </h4>
                <p className="text-amber-100 text-center text-sm mb-4">
                  {t('quickActions.sendReminders.description')}
                </p>
                <button className="w-full bg-white text-amber-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  {t('quickActions.sendReminders.button')}
                </button>
              </div>

              {/* Generate Report */}
              <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="flex justify-center mb-4">
                  <FileText className="w-12 h-12" />
                </div>
                <h4 className="text-lg font-bold text-center mb-2">
                  {t('quickActions.generateReport.title')}
                </h4>
                <p className="text-purple-100 text-center text-sm mb-4">
                  {t('quickActions.generateReport.description')}
                </p>
                <button className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                  {t('quickActions.generateReport.button')}
                </button>
              </div>
            </div>
          </div>

          {/* Analytics and Top Clients Row - Optimized Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Payment Status Chart - Redesigned */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {t('analytics.paymentStatus.title')}
                </h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
              </div>

              {/* Enhanced Layout with Chart and Stats */}
              <div className="space-y-6">
                {/* Donut Chart */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">55%</div>
                        <div className="text-xs text-gray-500">
                          {t('analytics.paymentStatus.paid')}
                        </div>
                      </div>
                    </div>
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="6"
                        strokeDasharray="138 113"
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="6"
                        strokeDasharray="75 176"
                        strokeDashoffset="-138"
                        className="transition-all duration-1000"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="6"
                        strokeDasharray="38 213"
                        strokeDashoffset="-213"
                        className="transition-all duration-1000"
                      />
                    </svg>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-lg font-bold text-green-700">55%</div>
                    <div className="text-xs text-green-600 font-medium">
                      {t('analytics.paymentStatus.paid')}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-lg font-bold text-amber-700">30%</div>
                    <div className="text-xs text-amber-600 font-medium">
                      {t('analytics.paymentStatus.pending')}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-lg font-bold text-red-700">15%</div>
                    <div className="text-xs text-red-600 font-medium">
                      {t('analytics.paymentStatus.overdue')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Invoices Chart - Redesigned */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t('analytics.monthlyInvoices.title')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('analytics.monthlyInvoices.subtitle')}
                  </p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
              </div>

              {/* Enhanced Bar Chart */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-end justify-between h-24 mb-3">
                    {[
                      { created: 32, paid: 28, month: 'Jan' },
                      { created: 45, paid: 38, month: 'Feb' },
                      { created: 38, paid: 34, month: 'Mar' },
                      { created: 52, paid: 45, month: 'Apr' },
                      { created: 41, paid: 36, month: 'May' },
                      { created: 48, paid: 42, month: 'Jun' },
                    ].map((data, index) => (
                      <div key={index} className="flex flex-col items-center group cursor-pointer">
                        <div className="relative flex flex-col items-center space-y-0.5 mb-2">
                          <div
                            className="bg-[#357AF3] rounded-sm transition-all duration-500 hover:bg-blue-700 group-hover:scale-110"
                            style={{
                              width: '14px',
                              height: `${Math.max(data.created * 0.8, 8)}px`,
                            }}
                            title={`${t('analytics.monthlyInvoices.created')}: ${data.created}`}
                          ></div>
                          <div
                            className="bg-green-500 rounded-sm transition-all duration-500 hover:bg-green-600 group-hover:scale-110"
                            style={{ width: '14px', height: `${Math.max(data.paid * 0.8, 6)}px` }}
                            title={`${t('analytics.monthlyInvoices.paid')}: ${data.paid}`}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats and Legend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#357AF3] rounded-sm mr-2"></div>
                      <span className="text-gray-600 font-medium">
                        {t('analytics.monthlyInvoices.created')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                      <span className="text-gray-600 font-medium">
                        {t('analytics.monthlyInvoices.paid')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">48</div>
                    <div className="text-xs text-gray-500">
                      {t('analytics.monthlyInvoices.thisMonth')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Clients - Compact in Same Row */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {t('analytics.topClients.title')}
                </h3>
                <button className="text-[#357AF3] hover:text-blue-800 text-xs font-semibold">
                  {t('analytics.topClients.viewAllClients')}
                </button>
              </div>
              <div className="space-y-4">
                {topClients.slice(0, 3).map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{client.name}</h4>
                        <p className="text-xs text-gray-600">{client.amount}</p>
                      </div>
                    </div>
                    <button className="text-[#357AF3] hover:text-blue-800 text-xs font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button className="w-full text-center text-[#357AF3] hover:text-blue-800 text-sm font-semibold py-2 border border-[#357AF3] rounded-lg hover:bg-blue-50 transition-colors">
                  {t('analytics.topClients.viewAllClients')}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('filters.title')}</h3>
              <button className="text-[#357AF3] hover:text-blue-800 text-sm font-semibold">
                {t('filters.clearAll')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.status.label')}
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors">
                  <option>{t('filters.status.all')}</option>
                  <option>{t('filters.status.paid')}</option>
                  <option>{t('filters.status.sent')}</option>
                  <option>{t('filters.status.overdue')}</option>
                  <option>{t('filters.status.draft')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.client.label')}
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors">
                  <option>{t('filters.client.all')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.dateRange.label')}
                </label>
                <input
                  type="text"
                  placeholder={t('filters.dateRange.placeholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-500 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filters.amount.label')}
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3] transition-colors">
                  <option>{t('filters.amount.any')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full bg-[#357AF3] text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 font-semibold transition-colors">
                  <Filter className="w-5 h-5" />
                  <span>{t('filters.applyFilters')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8">
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{t('table.title')}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 font-medium">{t('table.show')}</span>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[#357AF3] focus:border-[#357AF3]">
                  <option>{t('table.perPage.10')}</option>
                  <option>{t('table.perPage.25')}</option>
                  <option>{t('table.perPage.50')}</option>
                </select>
              </div>
            </div>

            {/* Table Header */}
            <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
              <div className="grid grid-cols-7 gap-6 text-sm font-semibold text-gray-700">
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
            <div className="divide-y divide-gray-200">
              {currentInvoices.map((invoice) => (
                <div key={invoice.id} className="px-8 py-6 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-7 gap-6 items-center">
                    <div>
                      <span className="text-[#357AF3] font-semibold hover:text-blue-800 cursor-pointer transition-colors">
                        {invoice.id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img
                        src={invoice.client.avatar}
                        alt={invoice.client.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{invoice.client.name}</div>
                        <div className="text-sm text-gray-500">{invoice.client.type}</div>
                      </div>
                    </div>
                    <div className="text-gray-600 font-medium">{invoice.issueDate}</div>
                    <div className="text-gray-600 font-medium">{invoice.dueDate}</div>
                    <div className="font-bold text-gray-900">{invoice.amount}</div>
                    <div>{getStatusBadge(invoice.status)}</div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            <div className="px-8 py-6 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600 font-medium">
                {t('pagination.showing', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, filteredInvoices.length),
                  total: filteredInvoices.length,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  {t('pagination.next')}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">
                {t('recentActivity.title')}
              </h3>
              <button className="text-[#357AF3] hover:text-blue-800 text-sm font-semibold">
                {t('recentActivity.viewAll')}
              </button>
            </div>
            <div className="space-y-6">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${activity.bgColor}`}>
                    <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
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

export default InvoicesPage;
