import React, { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

/**
 * Voice Analytics Table Component
 * Displays detailed analytics data in a sortable, filterable table format
 */
const VoiceAnalyticsTable = ({ data, type = 'commands' }) => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium">No data available</div>
        <div className="text-sm">Start using voice commands to see analytics data here</div>
      </div>
    );
  }

  // Filter data based on search text
  const filteredData = data.filter(item => {
    const searchText = filterText.toLowerCase();
    return (
      (item.command && item.command.toLowerCase().includes(searchText)) ||
      (item.action && item.action.toLowerCase().includes(searchText)) ||
      (item.errorType && item.errorType.toLowerCase().includes(searchText)) ||
      (item.sessionId && item.sessionId.toLowerCase().includes(searchText))
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4" /> : 
      <ChevronDownIcon className="h-4 w-4" />;
  };

  const renderCommandsTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('timestamp')}
          >
            <div className="flex items-center space-x-1">
              <span>Timestamp</span>
              <SortIcon field="timestamp" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('command')}
          >
            <div className="flex items-center space-x-1">
              <span>Command</span>
              <SortIcon field="command" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('action')}
          >
            <div className="flex items-center space-x-1">
              <span>Action</span>
              <SortIcon field="action" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('confidence')}
          >
            <div className="flex items-center space-x-1">
              <span>Confidence</span>
              <SortIcon field="confidence" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('responseTime')}
          >
            <div className="flex items-center space-x-1">
              <span>Response Time</span>
              <SortIcon field="responseTime" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {paginatedData.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatTimestamp(item.timestamp)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.command}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.action}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {(item.confidence * 100).toFixed(1)}%
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDuration(item.responseTime)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {item.success ? 'Success' : 'Failed'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderFailuresTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('timestamp')}
          >
            <div className="flex items-center space-x-1">
              <span>Timestamp</span>
              <SortIcon field="timestamp" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('recognizedText')}
          >
            <div className="flex items-center space-x-1">
              <span>Recognized Text</span>
              <SortIcon field="recognizedText" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('errorType')}
          >
            <div className="flex items-center space-x-1">
              <span>Error Type</span>
              <SortIcon field="errorType" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('confidence')}
          >
            <div className="flex items-center space-x-1">
              <span>Confidence</span>
              <SortIcon field="confidence" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Error Message
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {paginatedData.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatTimestamp(item.timestamp)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.recognizedText || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {item.errorType}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : '-'}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
              {item.errorMessage}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSessionsTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('startTime')}
          >
            <div className="flex items-center space-x-1">
              <span>Start Time</span>
              <SortIcon field="startTime" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('duration')}
          >
            <div className="flex items-center space-x-1">
              <span>Duration</span>
              <SortIcon field="duration" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('commandCount')}
          >
            <div className="flex items-center space-x-1">
              <span>Commands</span>
              <SortIcon field="commandCount" />
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort('trigger')}
          >
            <div className="flex items-center space-x-1">
              <span>Trigger</span>
              <SortIcon field="trigger" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Session ID
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {paginatedData.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatTimestamp(item.startTime)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDuration(item.duration)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.commandCount || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.trigger}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
              {item.sessionId?.substring(0, 8)}...
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {type === 'commands' && 'Command History'}
            {type === 'failures' && 'Failure Log'}
            {type === 'sessions' && 'Session History'}
          </h3>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {type === 'commands' && renderCommandsTable()}
        {type === 'failures' && renderFailuresTable()}
        {type === 'sessions' && renderSessionsTable()}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAnalyticsTable;