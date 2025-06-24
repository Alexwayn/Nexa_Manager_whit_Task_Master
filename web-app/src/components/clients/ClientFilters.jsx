import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/**
 * ClientFilters component for search and filtering functionality
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Handler for search input changes
 * @param {string} props.statusFilter - Current status filter
 * @param {Function} props.onStatusFilterChange - Handler for status filter changes
 * @param {string} props.revenueFilter - Current revenue filter
 * @param {Function} props.onRevenueFilterChange - Handler for revenue filter changes
 * @param {boolean} props.showStatusDropdown - Status dropdown visibility
 * @param {Function} props.onToggleStatusDropdown - Handler for status dropdown toggle
 * @param {boolean} props.showRevenueDropdown - Revenue dropdown visibility
 * @param {Function} props.onToggleRevenueDropdown - Handler for revenue dropdown toggle
 * @param {Function} props.onClearFilters - Handler for clearing all filters
 * @param {number} props.totalItems - Total number of filtered items
 * @returns {JSX.Element} ClientFilters component
 */
const ClientFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  revenueFilter,
  onRevenueFilterChange,
  showStatusDropdown,
  onToggleStatusDropdown,
  showRevenueDropdown,
  onToggleRevenueDropdown,
  onClearFilters,
  totalItems,
}) => {
  const statusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'active', label: 'Attivi' },
    { value: 'inactive', label: 'Inattivi' },
    { value: 'pending', label: 'In attesa' },
  ];

  const revenueOptions = [
    { value: 'all', label: 'Tutti i fatturati' },
    { value: 'high', label: 'Alto (≥€10.000)' },
    { value: 'medium', label: 'Medio (€1.000-€9.999)' },
    { value: 'low', label: 'Basso (<€1.000)' },
  ];

  const getFilterLabel = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : 'Seleziona...';
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || revenueFilter !== 'all';

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca clienti per nome, email, telefono..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-4">
          {/* Status Filter */}
          <div className="relative" data-dropdown="status">
            <button
              onClick={onToggleStatusDropdown}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {getFilterLabel(statusOptions, statusFilter)}
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onStatusFilterChange(option.value);
                        onToggleStatusDropdown();
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        statusFilter === option.value
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Revenue Filter */}
          <div className="relative" data-dropdown="revenue">
            <button
              onClick={onToggleRevenueDropdown}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {getFilterLabel(revenueOptions, revenueFilter)}
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            </button>
            {showRevenueDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {revenueOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onRevenueFilterChange(option.value);
                        onToggleRevenueDropdown();
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        revenueFilter === option.value
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Pulisci
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {totalItems !== undefined && (
        <div className="mt-4 text-sm text-gray-600">
          {totalItems === 0 ? (
            'Nessun cliente trovato'
          ) : (
            `${totalItems} cliente${totalItems !== 1 ? 'i' : ''} trovato${totalItems !== 1 ? 'i' : ''}`
          )}
          {hasActiveFilters && (
            <span className="ml-2 text-blue-600">
              (filtrati)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientFilters;