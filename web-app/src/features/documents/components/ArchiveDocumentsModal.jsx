import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  ArchiveBoxIcon, 
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  DocumentIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  DocumentIcon as DocumentSolidIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
} from '@heroicons/react/24/solid';

const ArchiveDocumentsModal = ({ 
  isOpen, 
  onClose, 
  onArchiveDocuments, 
  availableDocuments = [],
  preSelectedDocuments = [] 
}) => {
  const { t } = useTranslation('documents');
  
  // State management
  const [selectedDocuments, setSelectedDocuments] = useState(new Set(preSelectedDocuments));
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [errors, setErrors] = useState({});

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return availableDocuments;
    
    const query = searchQuery.toLowerCase();
    return availableDocuments.filter(doc => 
      doc.name.toLowerCase().includes(query) ||
      doc.type.toLowerCase().includes(query) ||
      doc.owner.toLowerCase().includes(query)
    );
  }, [availableDocuments, searchQuery]);

  // Get file icon based on document type
  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <DocumentSolidIcon className="w-5 h-5 text-red-500" />;
      case 'word':
        return <DocumentSolidIcon className="w-5 h-5 text-blue-500" />;
      case 'powerpoint':
        return <PresentationChartBarIcon className="w-5 h-5 text-orange-500" />;
      case 'excel':
        return <TableCellsIcon className="w-5 h-5 text-green-500" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle document selection
  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
    
    // Clear validation errors when user makes selection
    if (errors.noDocuments) {
      setErrors(prev => ({ ...prev, noDocuments: undefined }));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const selectableDocumentIds = filteredDocuments
      .filter(doc => doc.status !== 'Archived')
      .map(doc => doc.id);
    setSelectedDocuments(new Set(selectableDocumentIds));
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedDocuments(new Set());
  };

  // Get selected documents data
  const selectedDocumentsData = useMemo(() => {
    return availableDocuments.filter(doc => selectedDocuments.has(doc.id));
  }, [availableDocuments, selectedDocuments]);

  // Handle proceed to confirmation
  const handleProceedToConfirmation = () => {
    if (selectedDocuments.size === 0) {
      setErrors({ noDocuments: t('modals.archive.validation.noDocuments', 'Please select at least one document') });
      return;
    }

    // Check if any selected documents are already archived
    const alreadyArchived = selectedDocumentsData.filter(doc => doc.status === 'Archived');
    if (alreadyArchived.length > 0) {
      setErrors({ 
        alreadyArchived: t('modals.archive.validation.alreadyArchived', 'Some documents are already archived') 
      });
      return;
    }

    setErrors({});
    setShowConfirmation(true);
  };

  // Handle archive confirmation
  const handleConfirmArchive = async () => {
    setIsArchiving(true);
    
    try {
      const archiveData = {
        documentIds: Array.from(selectedDocuments),
        archivedAt: new Date().toISOString(),
        reason: archiveReason.trim() || undefined,
        originalStatus: 'active',
        canRestore: true
      };

      await onArchiveDocuments(archiveData);
      handleClose();
    } catch (error) {
      console.error('Archive operation failed:', error);
      setErrors({
        submit: error.message || t('modals.archive.validation.archiveFailed', 'Failed to archive documents')
      });
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isArchiving) return; // Prevent closing during operation
    
    // Reset all state
    setSelectedDocuments(new Set(preSelectedDocuments));
    setSearchQuery('');
    setShowConfirmation(false);
    setArchiveReason('');
    setErrors({});
    onClose();
  };

  // Handle back from confirmation
  const handleBackFromConfirmation = () => {
    setShowConfirmation(false);
    setArchiveReason('');
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {showConfirmation && (
                  <button
                    type="button"
                    onClick={handleBackFromConfirmation}
                    className="mr-3 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    disabled={isArchiving}
                  >
                    <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ArchiveBoxIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {showConfirmation 
                      ? t('modals.archive.confirmTitle', 'Confirm Archive')
                      : t('modals.archive.title', 'Archive Documents')
                    }
                  </h3>
                  <p className="text-sm text-gray-500">
                    {showConfirmation
                      ? t('modals.archive.confirmMessage', 'Are you sure you want to archive {{count}} documents?', { count: selectedDocuments.size })
                      : t('modals.archive.description', 'Archive documents you no longer need')
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={handleClose}
                disabled={isArchiving}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {!showConfirmation ? (
              // Document Selection View
              <div className="space-y-4">
                {/* Search and Controls */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('modals.archive.searchPlaceholder', 'Search documents...')}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      disabled={isArchiving}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      disabled={isArchiving || filteredDocuments.length === 0}
                    >
                      {t('modals.archive.selectAll', 'Select All')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      disabled={isArchiving || selectedDocuments.size === 0}
                    >
                      {t('modals.archive.clearAll', 'Clear All')}
                    </button>
                  </div>
                </div>

                {/* Selected Count */}
                {selectedDocuments.size > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                    <p className="text-sm text-purple-700">
                      {t('modals.archive.selectedCount', '{{count}} documents selected', { count: selectedDocuments.size })}
                    </p>
                  </div>
                )}

                {/* Documents List */}
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {filteredDocuments.length === 0 ? (
                    <div className="p-8 text-center">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? 'Try adjusting your search query.' : 'No documents available to archive.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredDocuments.map((document) => {
                        const isSelected = selectedDocuments.has(document.id);
                        const isAlreadyArchived = document.status === 'Archived';
                        
                        return (
                          <div
                            key={document.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isAlreadyArchived ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleDocumentSelect(document.id)}
                                  disabled={isArchiving || isAlreadyArchived}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
                                />
                              </div>
                              <div className="flex-shrink-0">
                                {getFileIcon(document.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {document.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {document.type} • {document.size} • {document.owner}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">{document.date}</span>
                                    {isAlreadyArchived && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Archived
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Validation Errors */}
                {(errors.noDocuments || errors.alreadyArchived) && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">
                          {errors.noDocuments || errors.alreadyArchived}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Confirmation View
              <div className="space-y-4">
                {/* Selected Documents Preview */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {selectedDocumentsData.map((document) => (
                      <div key={document.id} className="p-3 flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(document.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {document.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {document.type} • {document.size}
                          </p>
                        </div>
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Archive Reason */}
                <div>
                  <label htmlFor="archiveReason" className="block text-sm font-medium text-gray-700">
                    {t('modals.archive.reason', 'Archive Reason (Optional)')}
                  </label>
                  <textarea
                    id="archiveReason"
                    rows={3}
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder={t('modals.archive.reasonPlaceholder', 'Why are you archiving these documents?')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                    disabled={isArchiving}
                  />
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {!showConfirmation ? (
              <>
                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  disabled={isArchiving || selectedDocuments.size === 0}
                  className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                >
                  {t('modals.archive.continue', 'Continue')}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={handleClose}
                  disabled={isArchiving}
                >
                  {t('modals.archive.cancel', 'Cancel')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConfirmArchive}
                  disabled={isArchiving}
                  className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
                >
                  {isArchiving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('modals.archive.archiving', 'Archiving...')}
                    </>
                  ) : (
                    t('modals.archive.archive', 'Archive Documents')
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={handleBackFromConfirmation}
                  disabled={isArchiving}
                >
                  {t('modals.archive.back', 'Back')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDocumentsModal;
