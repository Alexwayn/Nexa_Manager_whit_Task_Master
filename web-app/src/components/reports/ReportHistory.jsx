import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon
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
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

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
          title: 'Revenue Report',
          format: 'pdf',
          status: 'completed',
          createdAt: '2024-01-15T10:30:00Z',
          size: '2.3 MB',
          downloadUrl: '/reports/revenue-2024-01-15.pdf'
        },
        {
          id: '2',
          type: 'client',
          title: 'Client Analytics Report',
          format: 'excel',
          status: 'completed',
          createdAt: '2024-01-14T14:20:00Z',
          size: '1.8 MB',
          downloadUrl: '/reports/client-analytics-2024-01-14.xlsx'
        },
        {
          id: '3',
          type: 'tax',
          title: 'Tax Summary Report',
          format: 'csv',
          status: 'failed',
          createdAt: '2024-01-13T09:15:00Z',
          size: null,
          downloadUrl: null,
          error: 'Insufficient data for the selected period'
        },
        {
          id: '4',
          type: 'aging',
          title: 'Aging Report',
          format: 'pdf',
          status: 'processing',
          createdAt: '2024-01-12T16:45:00Z',
          size: null,
          downloadUrl: null
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = [...reports];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    // Apply sorting
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
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  };

  const handleDownload = async (report) => {
    if (report.downloadUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = report.downloadUrl;
      link.download = `${report.title}-${report.id}.${report.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        // Mock deletion - replace with actual API call
        setReports(prev => prev.filter(report => report.id !== reportId));
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.completed;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
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

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="client">Client</option>
              <option value="tax">Tax</option>
              <option value="aging">Aging</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading reports...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {report.title}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(report.createdAt)}
                            </span>
                            <span className="capitalize">{report.type}</span>
                            <span className="uppercase">{report.format}</span>
                            {report.size && <span>{report.size}</span>}
                          </div>
                          {report.error && (
                            <p className="text-sm text-red-600 mt-1">{report.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(report.status)}
                      
                      {report.status === 'completed' && report.downloadUrl && (
                        <button
                          onClick={() => handleDownload(report)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Download Report"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Report"
                      >
                        <TrashIcon className="h-5 w-5" />
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
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;