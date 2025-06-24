import React, { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { debounce } from '@lib/uiUtils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ClientSearchFilter = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch = () => {},
  loading = false,
  filteredCount = 0,
  totalClients = 0,
}) => {
  const { t } = useTranslation('clients');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce((query, currentFilters, currentSort) => {
    onSearch({
      query,
      filters: currentFilters,
      sort: currentSort,
    });
  }, 300);

  // Handle search input change
  const handleSearchChange = e => {
    const query = e.target.value;
    setSearchTerm(query);
    debouncedSearch(query, filters, { field: sortBy, direction: sortOrder });
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...filters,
      [filterKey]: value,
    };
    setFilters(newFilters);
    debouncedSearch(searchTerm, newFilters, { field: sortBy, direction: sortOrder });
  };

  // Removed unused handleSortChange function

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      city: '',
      hasEmail: '',
      hasPhone: '',
      hasVatNumber: '',
    });
    setSortBy('full_name');
    setSortOrder('asc');
    onSearch({
      query: '',
      filters: {
        city: '',
        hasEmail: '',
        hasPhone: '',
        hasVatNumber: '',
      },
      sort: {
        field: 'full_name',
        direction: 'asc',
      },
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || Object.values(filters).some(value => value !== '');

  // Sort options
  const sortOptions = [
    { label: t('searchFilter.sortOptions.nameAsc'), field: 'full_name', direction: 'asc' },
    { label: t('searchFilter.sortOptions.nameDesc'), field: 'full_name', direction: 'desc' },
    { label: t('searchFilter.sortOptions.emailAsc'), field: 'email', direction: 'asc' },
    { label: t('searchFilter.sortOptions.emailDesc'), field: 'email', direction: 'desc' },
    { label: t('searchFilter.sortOptions.cityAsc'), field: 'city', direction: 'asc' },
    { label: t('searchFilter.sortOptions.cityDesc'), field: 'city', direction: 'desc' },
    { label: t('searchFilter.sortOptions.dateDesc'), field: 'created_at', direction: 'desc' },
    { label: t('searchFilter.sortOptions.dateAsc'), field: 'created_at', direction: 'asc' },
  ];

  return (
    <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
      <div className='px-4 py-4 sm:px-6 lg:px-8'>
        {/* Search and quick actions row */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          {/* Search input */}
          <div className='flex-1 max-w-lg'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
              </div>
              <input
                type='text'
                value={searchTerm}
                onChange={handleSearchChange}
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder={t('searchFilter.placeholder')}
                disabled={loading}
              />
              {searchTerm && (
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    type='button'
                    onClick={() => {
                      setSearchTerm('');
                      debouncedSearch('', filters, { field: sortBy, direction: sortOrder });
                    }}
                    className='text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
                  >
                    <XMarkIcon className='h-5 w-5' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {/* Sort dropdown */}
            <Menu as='div' className='relative inline-block text-left'>
              <div>
                <Menu.Button className='inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'>
                  <span className='flex items-center gap-1'>
                    {sortOrder === 'asc' ? (
                      <ArrowUpIcon className='h-4 w-4' />
                    ) : (
                      <ArrowDownIcon className='h-4 w-4' />
                    )}
                    {t('searchFilter.sort')}
                  </span>
                  <ChevronDownIcon className='-mr-1 h-5 w-5 text-gray-400' aria-hidden='true' />
                </Menu.Button>
              </div>

              <Menu.Items className='absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                <div className='py-1'>
                  {sortOptions.map(option => (
                    <Menu.Item key={`${option.field}-${option.direction}`}>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            setSortBy(option.field);
                            setSortOrder(option.direction);
                            debouncedSearch(searchTerm, filters, {
                              field: option.field,
                              direction: option.direction,
                            });
                          }}
                          className={classNames(
                            active
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                              : 'text-gray-700 dark:text-gray-300',
                            sortBy === option.field && sortOrder === option.direction
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : '',
                            'block w-full text-left px-4 py-2 text-sm',
                          )}
                        >
                          {option.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>

            {/* Advanced filters toggle */}
            <button
              type='button'
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={classNames(
                showAdvancedFilters || Object.values(filters).some(v => v !== '')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 ring-primary-500'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                'inline-flex items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset',
              )}
            >
              <FunnelIcon className='h-4 w-4' />
              {t('searchFilter.filters')}
              {Object.values(filters).some(v => v !== '') && (
                <span className='ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-100 bg-primary-600 rounded-full'>
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                type='button'
                onClick={clearFilters}
                className='inline-flex items-center gap-x-1.5 rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              >
                <XMarkIcon className='h-4 w-4' />
                {t('searchFilter.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Advanced filters panel */}
        {showAdvancedFilters && (
          <div className='mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
              {t('searchFilter.advancedFilters')}
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* City filter */}
              <div>
                <label
                  htmlFor='city'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                >
                  {t('searchFilter.city')}
                </label>
                <input
                  type='text'
                  name='city'
                  id='city'
                  value={filters.city}
                  onChange={e => handleFilterChange('city', e.target.value)}
                  className='mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  placeholder={t('searchFilter.cityPlaceholder')}
                />
              </div>

              {/* Has email filter */}
              <div>
                <label
                  htmlFor='hasEmail'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                >
                  {t('searchFilter.hasEmail')}
                </label>
                <select
                  id='hasEmail'
                  name='hasEmail'
                  value={filters.hasEmail}
                  onChange={e => handleFilterChange('hasEmail', e.target.value)}
                  className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  <option value=''>{t('searchFilter.all')}</option>
                  <option value='true'>{t('searchFilter.yes')}</option>
                  <option value='false'>{t('searchFilter.no')}</option>
                </select>
              </div>

              {/* Has phone filter */}
              <div>
                <label
                  htmlFor='hasPhone'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                >
                  {t('searchFilter.hasPhone')}
                </label>
                <select
                  id='hasPhone'
                  name='hasPhone'
                  value={filters.hasPhone}
                  onChange={e => handleFilterChange('hasPhone', e.target.value)}
                  className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  <option value=''>{t('searchFilter.all')}</option>
                  <option value='true'>{t('searchFilter.yes')}</option>
                  <option value='false'>{t('searchFilter.no')}</option>
                </select>
              </div>

              {/* Has VAT number filter */}
              <div>
                <label
                  htmlFor='hasVatNumber'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                >
                  {t('searchFilter.hasVatNumber')}
                </label>
                <select
                  id='hasVatNumber'
                  name='hasVatNumber'
                  value={filters.hasVatNumber}
                  onChange={e => handleFilterChange('hasVatNumber', e.target.value)}
                  className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                >
                  <option value=''>{t('searchFilter.all')}</option>
                  <option value='true'>{t('searchFilter.yes')}</option>
                  <option value='false'>{t('searchFilter.no')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
          {t('searchFilter.showingOf', { filteredCount, totalClients })}
        </div>
      </div>
    </div>
  );
};

export default ClientSearchFilter;
