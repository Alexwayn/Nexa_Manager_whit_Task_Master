import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, FolderIcon } from '@heroicons/react/24/outline';

const CreateFolderModal = ({ isOpen, onClose, onCreateFolder, parentPath = '' }) => {
  const { t } = useTranslation('documents');
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError(t('errors.folderNameRequired', 'Folder name is required'));
      return;
    }

    // Validate folder name (no special characters except spaces, hyphens, underscores)
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(folderName.trim())) {
      setError(t('errors.invalidFolderName', 'Folder name contains invalid characters'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const folderData = {
        name: folderName.trim(),
        description: description.trim(),
        parentPath: parentPath,
        createdAt: new Date().toISOString(),
        type: 'folder'
      };

      await onCreateFolder(folderData);
      
      // Reset form
      setFolderName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(error.message || t('errors.createFolderFailed', 'Failed to create folder'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FolderIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {t('createFolder.title', 'Create New Folder')}
                    </h3>
                    {parentPath && (
                      <p className="text-sm text-gray-500">
                        {t('createFolder.location', 'Location')}: {parentPath}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="mt-6 space-y-4">
                {/* Folder Name */}
                <div>
                  <label htmlFor="folderName" className="block text-sm font-medium text-gray-700">
                    {t('createFolder.name', 'Folder Name')} *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="folderName"
                      name="folderName"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={t('createFolder.namePlaceholder', 'Enter folder name')}
                      maxLength={255}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('createFolder.nameHint', 'Only letters, numbers, spaces, hyphens, and underscores are allowed')}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    {t('createFolder.description', 'Description')}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={t('createFolder.descriptionPlaceholder', 'Optional description for this folder')}
                      maxLength={500}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {description.length}/500 {t('common.characters', 'characters')}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {folderName.trim() && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {t('createFolder.preview', 'Preview')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-gray-900">{folderName.trim()}</span>
                    </div>
                    {description.trim() && (
                      <p className="text-xs text-gray-600 mt-1 ml-7">
                        {description.trim()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isLoading || !folderName.trim()}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('createFolder.creating', 'Creating...')}
                  </>
                ) : (
                  t('createFolder.create', 'Create Folder')
                )}
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal; 
