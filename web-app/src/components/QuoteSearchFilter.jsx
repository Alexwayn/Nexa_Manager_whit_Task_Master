import { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const QuoteSearchFilter = ({
  onSearchChange,
  onFiltersChange,
  totalQuotes = 0,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Debounced search to avoid too many API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Notify parent component of search changes
  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  // Notify parent component of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const { t } = useTranslation('quotes');

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      clientId: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filters.status !== 'all' ||
      filters.clientId ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.amountMin ||
      filters.amountMax
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.clientId) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin || filters.amountMax) count++;
    return count;
  };

  const statusOptions = [
    { value: 'all', label: t('searchFilter.allStatuses') },
    { value: 'draft', label: t('searchFilter.status.draft') },
    { value: 'sent', label: t('searchFilter.status.sent') },
    { value: 'accepted', label: t('searchFilter.status.accepted') },
    { value: 'rejected', label: t('searchFilter.status.rejected') },
    { value: 'expired', label: t('searchFilter.status.expired') },
    { value: 'converted', label: t('searchFilter.status.converted') },
  ];

  const sortOptions = [
    { value: 'created_at', label: t('searchFilter.sortOptions.createdAt') },
    { value: 'issue_date', label: t('searchFilter.sortOptions.issueDate') },
    { value: 'due_date', label: t('searchFilter.sortOptions.dueDate') },
    { value: 'quote_number', label: t('searchFilter.sortOptions.quoteNumber') },
    { value: 'total_amount', label: t('searchFilter.sortOptions.totalAmount') },
    { value: 'client_name', label: t('searchFilter.sortOptions.clientName') },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      {/* Search and quick filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchFilter.placeholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3">
          {/* Results count */}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('searchFilter.results', { count: totalQuotes })}
          </span>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showAdvancedFilters ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            {t('searchFilter.filters')}
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>

          {/* Clear filters */}
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              {t('searchFilter.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date range filter */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t('searchFilter.dateRange')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder={t('searchFilter.from')}
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  placeholder={t('searchFilter.to')}
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Amount range filter */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                {t('searchFilter.amount')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t('searchFilter.min')}
                  value={filters.amountMin}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder={t('searchFilter.max')}
                  value={filters.amountMax}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sort options */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {t('searchFilter.sort')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">{t('searchFilter.sortOrder.desc')}</option>
                  <option value="asc">{t('searchFilter.sortOrder.asc')}</option>
                </select>
              </div>
            </div>

            {/* Client filter */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <UserIcon className="h-4 w-4 mr-2" />
                {t('searchFilter.client')}
              </label>
              <input
                type="text"
                placeholder={t('searchFilter.clientPlaceholder')}
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters() && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Filtri attivi:
                </span>

                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Ricerca: &quot;{searchTerm}&quot;
                  </span>
                )}

                {filters.status !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    Stato: {statusOptions.find((s) => s.value === filters.status)?.label}
                  </span>
                )}

                {(filters.dateFrom || filters.dateTo) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Periodo: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                  </span>
                )}

                {(filters.amountMin || filters.amountMax) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                    Importo: €{filters.amountMin || '0'} - €{filters.amountMax || '∞'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuoteSearchFilter;
