import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import LoadingSkeleton from '@components/common/LoadingSkeleton';
import { usePerformanceMonitor } from '@utils/performance';

// Row height constants
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 56;
const OVERSCAN_COUNT = 5;

// Memoized table cell component
const TableCell = memo(({ 
  value, 
  column, 
  rowIndex, 
  isSelected, 
  onClick,
  className = '' 
}) => {
  const cellContent = useMemo(() => {
    if (column.render) {
      return column.render(value, rowIndex);
    }
    
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      }).format(value || 0);
    }
    
    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }
    
    if (column.type === 'number') {
      return new Intl.NumberFormat().format(value || 0);
    }
    
    return value || '-';
  }, [value, column, rowIndex]);

  return (
    <div
      className={`
        flex items-center px-4 py-3 text-sm
        ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800'}
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{
        width: column.width || 150,
        minWidth: column.minWidth || 100,
        maxWidth: column.maxWidth || 300,
      }}
    >
      <span className={`
        truncate
        ${column.align === 'center' ? 'text-center' : ''}
        ${column.align === 'right' ? 'text-right' : ''}
        ${column.className || ''}
      `}>
        {cellContent}
      </span>
    </div>
  );
});

TableCell.displayName = 'TableCell';

// Memoized table row component
const TableRow = memo(({ 
  index, 
  style, 
  data: { items, columns, selectedRows, onRowClick, onRowSelect } 
}) => {
  const item = items[index];
  const isSelected = selectedRows?.has(index);
  
  const handleRowClick = useCallback(() => {
    onRowClick?.(item, index);
  }, [item, index, onRowClick]);
  
  const handleRowSelect = useCallback((e) => {
    e.stopPropagation();
    onRowSelect?.(index, !isSelected);
  }, [index, isSelected, onRowSelect]);

  if (!item) {
    return (
      <div style={style} className="flex items-center px-4 py-3">
        <LoadingSkeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`
        flex border-b border-gray-200 dark:border-gray-700
        ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800'}
        hover:bg-gray-50 dark:hover:bg-gray-700
      `}
    >
      {/* Selection checkbox */}
      {onRowSelect && (
        <div className="flex items-center px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleRowSelect}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
      )}
      
      {/* Table cells */}
      {columns.map((column, colIndex) => (
        <TableCell
          key={`${index}-${colIndex}`}
          value={item[column.key]}
          column={column}
          rowIndex={index}
          isSelected={isSelected}
          onClick={handleRowClick}
        />
      ))}
    </div>
  );
});

TableRow.displayName = 'TableRow';

// Table header component
const TableHeader = memo(({ 
  columns, 
  sortConfig, 
  onSort, 
  onSelectAll, 
  selectedCount, 
  totalCount 
}) => {
  const handleSelectAll = useCallback((e) => {
    onSelectAll?.(e.target.checked);
  }, [onSelectAll]);

  return (
    <div 
      className="flex bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
      style={{ height: HEADER_HEIGHT }}
    >
      {/* Select all checkbox */}
      {onSelectAll && (
        <div className="flex items-center px-4">
          <input
            type="checkbox"
            checked={selectedCount === totalCount && totalCount > 0}
            ref={input => {
              if (input) input.indeterminate = selectedCount > 0 && selectedCount < totalCount;
            }}
            onChange={handleSelectAll}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>
      )}
      
      {/* Column headers */}
      {columns.map((column, index) => (
        <div
          key={index}
          className={`
            flex items-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
            ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
          `}
          style={{
            width: column.width || 150,
            minWidth: column.minWidth || 100,
            maxWidth: column.maxWidth || 300,
          }}
          onClick={() => column.sortable && onSort?.(column.key)}
        >
          <span className="truncate">{column.title}</span>
          {column.sortable && sortConfig?.key === column.key && (
            <span className="ml-1">
              {sortConfig.direction === 'asc' ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});

TableHeader.displayName = 'TableHeader';

// Main virtualized table component
const VirtualizedReportTable = memo(({
  data = [],
  columns = [],
  height = 400,
  loading = false,
  hasNextPage = false,
  loadNextPage,
  onRowClick,
  onRowSelect,
  onSelectAll,
  selectedRows = new Set(),
  sortConfig,
  onSort,
  searchTerm = '',
  onSearch,
  onExport,
  className = '',
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  ...props
}) => {
  const [containerHeight, setContainerHeight] = useState(height);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  
  // Performance monitoring
  const {
    startRender,
    endRender,
  } = usePerformanceMonitor('VirtualizedReportTable');

  // Track render performance
  useEffect(() => {
    const renderStart = startRender();
    return () => endRender(renderStart);
  });

  // Responsive height calculation
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // 100px buffer
        setContainerHeight(Math.min(Math.max(availableHeight, 300), height));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = data.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }
    
    // Apply sorting
    if (sortConfig?.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortConfig, columns]);

  // Infinite loading helpers
  const itemCount = hasNextPage ? processedData.length + 1 : processedData.length;
  const isItemLoaded = useCallback((index) => {
    return !!processedData[index];
  }, [processedData]);

  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (loadNextPage && hasNextPage) {
      await loadNextPage(startIndex, stopIndex);
    }
  }, [loadNextPage, hasNextPage]);

  // Row data for virtualization
  const rowData = useMemo(() => ({
    items: processedData,
    columns,
    selectedRows,
    onRowClick,
    onRowSelect,
  }), [processedData, columns, selectedRows, onRowClick, onRowSelect]);

  // Handle search
  const handleSearch = useCallback((e) => {
    onSearch?.(e.target.value);
  }, [onSearch]);

  // Handle export
  const handleExport = useCallback(() => {
    onExport?.(processedData);
  }, [onExport, processedData]);

  // Loading state
  if (loading && processedData.length === 0) {
    return (
      <div ref={containerRef} className={`${className}`}>
        <LoadingSkeleton type="table" rows={10} className="h-full" />
      </div>
    );
  }

  // Empty state
  if (!loading && processedData.length === 0) {
    return (
      <div ref={containerRef} className={`${className} flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700`} style={{ height: containerHeight }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium mb-2">No Data Found</p>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}>
      {/* Table controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
          
          {/* Selected count */}
          {selectedRows.size > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRows.size} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Export button */}
          {onExport && (
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          )}
          
          {/* Filter button */}
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>
      
      {/* Table header */}
      <TableHeader
        columns={columns}
        sortConfig={sortConfig}
        onSort={onSort}
        onSelectAll={onSelectAll}
        selectedCount={selectedRows.size}
        totalCount={processedData.length}
      />
      
      {/* Virtualized table body */}
      <div style={{ height: containerHeight - HEADER_HEIGHT - 80 }}> {/* 80px for controls */}
        {loadNextPage ? (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={(list) => {
                  ref(list);
                  listRef.current = list;
                }}
                height={containerHeight - HEADER_HEIGHT - 80}
                itemCount={itemCount}
                itemSize={ROW_HEIGHT}
                itemData={rowData}
                onItemsRendered={onItemsRendered}
                overscanCount={OVERSCAN_COUNT}
                {...props}
              >
                {TableRow}
              </List>
            )}
          </InfiniteLoader>
        ) : (
          <List
            ref={listRef}
            height={containerHeight - HEADER_HEIGHT - 80}
            itemCount={processedData.length}
            itemSize={ROW_HEIGHT}
            itemData={rowData}
            overscanCount={OVERSCAN_COUNT}
            {...props}
          >
            {TableRow}
          </List>
        )}
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span>{loadingMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
});

VirtualizedReportTable.displayName = 'VirtualizedReportTable';

export default VirtualizedReportTable;