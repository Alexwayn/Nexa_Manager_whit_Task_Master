import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DocumentIcon, 
  FolderIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const DocumentsList = ({ 
  documents = [], 
  folders = [], 
  onDocumentSelect, 
  onFolderSelect,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentShare,
  onDocumentDownload,
  selectedItems = [],
  onSelectionChange,
  showSelection = false,
  currentPath = '',
  sortBy = 'name',
  sortOrder = 'asc',
  onSortChange
}) => {
  const { t } = useTranslation('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort documents
  const filteredAndSortedItems = useMemo(() => {
    let items = [];

    // Add folders
    if (folders.length > 0) {
      items.push(...folders.map(folder => ({ ...folder, type: 'folder' })));
    }

    // Add documents
    items.push(...documents.map(doc => ({ ...doc, type: 'document' })));

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'folder') {
        items = items.filter(item => item.type === 'folder');
      } else {
        items = items.filter(item => item.type === 'document' && 
          (item.fileType || item.mimeType || '').toLowerCase().includes(filterType));
      }
    }

    // Sort items
    items.sort((a, b) => {
      // Always show folders first
      if (a.type === 'folder' && b.type === 'document') return -1;
      if (a.type === 'document' && b.type === 'folder') return 1;

      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'date':
          aValue = new Date(a.createdAt || a.modifiedAt || 0);
          bValue = new Date(b.createdAt || b.modifiedAt || 0);
          break;
        case 'type':
          aValue = a.fileType || a.mimeType || '';
          bValue = b.fileType || b.mimeType || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [documents, folders, searchTerm, filterType, sortBy, sortOrder]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (item) => {
    if (item.type === 'folder') {
      return <FolderIcon className="h-8 w-8 text-blue-500" />;
    }

    const fileType = item.fileType || item.mimeType || '';
    if (fileType.includes('pdf')) {
      return <span className="text-2xl">📄</span>;
    } else if (fileType.includes('image')) {
      return <span className="text-2xl">🖼️</span>;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <span className="text-2xl">📝</span>;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <span className="text-2xl">📊</span>;
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return <span className="text-2xl">📎</span>;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      onSortChange?.(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange?.(field, 'asc');
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      onFolderSelect?.(item);
    } else {
      onDocumentSelect?.(item);
    }
  };

  const handleSelectItem = (item, isSelected) => {
    if (!showSelection || !onSelectionChange) return;

    let newSelection;
    if (isSelected) {
      newSelection = selectedItems.filter(id => id !== item.id);
    } else {
      newSelection = [...selectedItems, item.id];
    }
    onSelectionChange(newSelection);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4" /> : 
      <ChevronDownIcon className="h-4 w-4" />;
  };

  if (filteredAndSortedItems.length === 0 && !searchTerm && filterType === 'all') {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {t('list.empty.title', 'No documents')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('list.empty.message', 'Get started by uploading your first document.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('list.search.placeholder', 'Search documents and folders...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          {t('list.filters', 'Filters')}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">{t('list.filter.all', 'All Types')}</option>
              <option value="folder">{t('list.filter.folders', 'Folders')}</option>
              <option value="pdf">{t('list.filter.pdf', 'PDF')}</option>
              <option value="image">{t('list.filter.images', 'Images')}</option>
              <option value="document">{t('list.filter.documents', 'Documents')}</option>
              <option value="spreadsheet">{t('list.filter.spreadsheets', 'Spreadsheets')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Table View */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {showSelection && (
                <th scope="col" className="relative px-6 sm:w-12 sm:px-6">
                  <span className="sr-only">{t('list.select', 'Select')}</span>
                </th>
              )}
              <th 
                scope="col" 
                className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>{t('list.columns.name', 'Name')}</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>{t('list.columns.type', 'Type')}</span>
                  <SortIcon field="type" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center space-x-1">
                  <span>{t('list.columns.size', 'Size')}</span>
                  <SortIcon field="size" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>{t('list.columns.modified', 'Modified')}</span>
                  <SortIcon field="date" />
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t('list.actions', 'Actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredAndSortedItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {showSelection && (
                    <td className="relative px-6 sm:w-12 sm:px-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectItem(item, isSelected)}
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                    </td>
                  )}
                  <td className="py-4 pl-4 pr-3 sm:pl-6">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(item)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type === 'folder' ? 
                      t('list.type.folder', 'Folder') : 
                      (item.fileType || item.mimeType || t('list.type.unknown', 'Unknown'))
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.type === 'folder' ? '-' : formatFileSize(item.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.modifiedAt || item.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {item.type === 'document' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onDocumentSelect?.(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title={t('list.actions.view', 'View')}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDocumentDownload?.(item)}
                            className="text-gray-600 hover:text-gray-900"
                            title={t('list.actions.download', 'Download')}
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDocumentShare?.(item)}
                            className="text-green-600 hover:text-green-900"
                            title={t('list.actions.share', 'Share')}
                          >
                            <ShareIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDocumentEdit?.(item)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title={t('list.actions.edit', 'Edit')}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => item.type === 'folder' ? 
                          onFolderSelect?.(item) : onDocumentDelete?.(item)}
                        className="text-red-600 hover:text-red-900"
                        title={item.type === 'folder' ? 
                          t('list.actions.open', 'Open') : 
                          t('list.actions.delete', 'Delete')
                        }
                      >
                        {item.type === 'folder' ? 
                          <FolderIcon className="h-5 w-5" /> : 
                          <TrashIcon className="h-5 w-5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No Results */}
      {filteredAndSortedItems.length === 0 && (searchTerm || filterType !== 'all') && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('list.noResults.title', 'No results found')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('list.noResults.message', 'Try adjusting your search terms or filters.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsList; 
