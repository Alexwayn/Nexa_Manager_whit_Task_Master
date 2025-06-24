import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

/**
 * ClientPagination component for table pagination
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.itemsPerPage - Items per page
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.startItem - Start item number for current page
 * @param {number} props.endItem - End item number for current page
 * @param {Function} props.onPageChange - Handler for page changes
 * @param {Function} props.onItemsPerPageChange - Handler for items per page changes
 * @returns {JSX.Element} ClientPagination component
 */
const ClientPagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const itemsPerPageOptions = [5, 10, 20, 50, 100];

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Precedente
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Successivo
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Mostra</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">per pagina</span>
          </div>

          {/* Results info */}
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{startItem}</span> -{' '}
            <span className="font-medium">{endItem}</span> di{' '}
            <span className="font-medium">{totalItems}</span> risultati
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
            title="Prima pagina"
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Pagina precedente"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {totalPages > 1 && getPageNumbers().map((pageNumber, index) => {
            if (pageNumber === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === pageNumber
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Pagina successiva"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
            title="Ultima pagina"
          >
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPagination;