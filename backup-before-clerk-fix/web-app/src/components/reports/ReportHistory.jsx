import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  ShareIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import reportingService from '../../lib/reportingService';

const ReportHistory = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterAndSortReports();
  }, [reports, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockReports = [
        {
          id: '1',
          type: 'revenue',
          title: 'Revenue Report Q4 2024',
          format: 'pdf',
          status: 'completed',
          createdAt: '2024-01-15T10:30:00Z',
          size: '2.4 MB',
          description: 'Comprehensive revenue analysis for Q4 2024 including monthly breakdowns and year-over-year comparisons',
          tags: ['quarterly', 'revenue', 'analysis'],
          downloadCount: 15
        },
        {
          id: '2',
          type: 'expense',
          title: 'Monthly Expense Summary',
          format: 'excel',
          status: 'completed',
          createdAt: '2024-01-14T14:20:00Z',
          size: '1.8 MB',
          description: 'Detailed breakdown of monthly expenses by category and department',
          tags: ['monthly', 'expenses', 'summary'],
          downloadCount: 8
        },
        {
          id: '3',
          type: 'client',
          title: 'Client Performance Analysis',
          format: 'pdf',
          status: 'processing',
          createdAt: '2024-01-14T09:15:00Z',
          size: '3.1 MB',
          description: 'Analysis of client engagement metrics and performance indicators',
          tags: ['clients', 'performance', 'metrics'],
          downloadCount: 3
        },
        {
          id: '4',
          type: 'inventory',
          title: 'Inventory Status Report',
          format: 'csv',
          status: 'completed',
          createdAt: '2024-01-13T16:45:00Z',
          size: '856 KB',
          description: 'Current inventory levels and stock movement analysis',
          tags: ['inventory', 'stock', 'levels'],
          downloadCount: 12
        },
        {
          id: '5',
          type: 'financial',
          title: 'Financial Dashboard Export',
          format: 'pdf',
          status: 'failed',
          createdAt: '2024-01-13T11:30:00Z',
          size: '0 KB',
          description: 'Export of financial dashboard data and visualizations',
          tags: ['financial', 'dashboard', 'export'],
          downloadCount: 0
        },
        {
          id: '6',
          type: 'profit-loss',
          title: 'P&L Statement 2024',
          format: 'excel',
          status: 'completed',
          createdAt: '2024-01-12T13:20:00Z',
          size: '2.1 MB',
          description: 'Annual profit and loss statement with detailed breakdowns',
          tags: ['profit-loss', 'annual', 'statement'],
          downloadCount: 25
        },
        {
          id: '7',
          type: 'cash-flow',
          title: 'Cash Flow Forecast',
          format: 'pdf',
          status: 'completed',
          createdAt: '2024-01-11T08:45:00Z',
          size: '1.5 MB',
          description: '6-month cash flow forecast with scenario analysis',
          tags: ['cash-flow', 'forecast', 'scenarios'],
          downloadCount: 7
        }
      ];
      
      setReports(mockReports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || report.type === filterType;
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort reports
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  };

  const handleDownload = async (reportId) => {
    try {
      // Mock download - replace with actual API call
      console.log('Downloading report:', reportId);
      // await reportingService.downloadReport(reportId);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      // Mock delete - replace with actual API call
      console.log('Deleting report:', reportId);
      setReports(reports.filter(report => report.id !== reportId));
      // await reportingService.deleteReport(reportId);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handlePreview = (reportId) => {
    console.log('Previewing report:', reportId);
    // Implement preview functionality
  };

  const handleShare = (reportId) => {
    console.log('Sharing report:', reportId);
    // Implement share functionality
  };

  const handleRegenerate = async (reportId) => {
    console.log('Regenerating report:', reportId);
    // Update status to processing
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, status: 'processing' }
        : report
    ));
    
    // Simulate processing time
    setTimeout(() => {
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: 'completed', createdAt: new Date().toISOString() }
          : report
      ));
    }, 3000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckIcon, text: 'Completed' },
      processing: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Processing' },
      failed: { color: 'bg-red-100 text-red-800', icon: XMarkIcon, text: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.completed;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const processingReports = reports.filter(r => r.status === 'processing').length;
  const totalDownloads = reports.reduce((sum, r) => sum + r.downloadCount, 0);

  if (isOpen === false) return null;

  const containerClasses = isOpen !== undefined 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    : "";
    
  const contentClasses = isOpen !== undefined
    ? "bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
    : "bg-white rounded-lg shadow-sm border border-gray-200";

  const content = (
    <div className={contentClasses}>
      {/* Header */}
      {isOpen !== undefined ? (
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Report History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Generated Reports
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            View, download, and manage your generated reports
          </p>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalReports}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{completedReports}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{processingReports}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-lg">
              <DocumentArrowDownIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
            <div className="text-sm text-gray-600">Total Downloads</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b bg-white">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="client">Client</option>
            <option value="financial">Financial</option>
            <option value="inventory">Inventory</option>
            <option value="profit-loss">Profit & Loss</option>
            <option value="cash-flow">Cash Flow</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="type-asc">Type A-Z</option>
            <option value="status-asc">Status A-Z</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {report.title}
                      </h4>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {report.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(report.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="h-4 w-4" />
                        {report.format.toUpperCase()}
                      </span>
                      <span>{report.size}</span>
                      <span className="flex items-center gap-1">
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        {report.downloadCount} downloads
                      </span>
                    </div>
                    
                    {report.tags && report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {report.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {report.status === 'failed' && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">
                          Report generation failed. Please try regenerating or contact support.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {report.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handlePreview(report.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Preview Report"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleShare(report.id)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                          title="Share Report"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDownload(report.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Download Report"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {(report.status === 'failed' || report.status === 'completed') && (
                      <button
                        onClick={() => handleRegenerate(report.id)}
                        className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                        title="Regenerate Report"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Report"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </p>
          {isOpen !== undefined && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return isOpen !== undefined ? (
    <div className={containerClasses}>
      {content}
    </div>
  ) : content;
};

export default ReportHistory;