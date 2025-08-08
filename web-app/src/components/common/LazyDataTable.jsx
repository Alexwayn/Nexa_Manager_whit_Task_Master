import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LoadingSkeleton from './LoadingSkeleton';

const LazyDataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  onRowClick = null,
  sortable = true,
  searchable = true,
  pageSize = 50,
  height = 400,
  className = '',
  emptyMessage = 'No data available',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = useCallback((key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, [sortable]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Row renderer for react-window
  const Row = useCallback(({ index, style }) => {
    const item = paginatedData[index];
    if (!item) return null;

    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 hover:bg-gray-50 ${
          onRowClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onRowClick && onRowClick(item)}
      >
        {columns.map((column, colIndex) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-sm text-gray-900 ${
              column.width ? `w-${column.width}` : 'flex-1'
            } ${column.align || 'text-left'}`}
          >
            {column.render ? column.render(item[column.key], item) : item[column.key]}
          </div>
        ))}
      </div>
    );
  }, [paginatedData, columns, onRowClick]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <LoadingSkeleton type="table" rows={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading data</p>
          <p className="text-sm mt-2">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.width ? `w-${column.width}` : 'flex-1'
            } ${
              sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            onClick={() => column.sortable !== false && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {sortable && column.sortable !== false && sortConfig.key === column.key && (
                sortConfig.direction === 'asc' ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table Body */}
      {paginatedData.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <List
          height={height}
          itemCount={paginatedData.length}
          itemSize={60} // Row height
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {Row}
        </List>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, processedData.length)} of{' '}
            {processedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage < 3 ? i : currentPage - 2 + i;
              if (pageNum >= totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    pageNum === currentPage
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyDataTable;
