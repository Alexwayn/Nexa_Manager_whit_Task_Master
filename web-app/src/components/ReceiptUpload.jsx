import React, { useState, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@context/AuthContext';
import { uploadReceipt, validateFile } from '@lib/storageService';
import { notify } from '@lib/uiUtils';
import Logger from '@utils/Logger';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ReceiptUpload({
  isOpen,
  onClose,
  onUploadComplete,
  maxFiles = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxFileSize = 10485760, // 10MB
  title = 'Carica Ricevute',
  description = 'Carica le tue ricevute per tenere traccia delle spese',
}) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  // Reset component state
  const resetComponent = useCallback(() => {
    setFiles([]);
    setUploading(false);
    setUploadResults(null);
    setDragOver(false);
    setPreviewFile(null);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (newFiles) => {
      const validFiles = [];
      const errors = [];

      Array.from(newFiles).forEach((file) => {
        // Check if we've reached max files limit
        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`Massimo ${maxFiles} file consentiti`);
          return;
        }

        // Validate file
        const validation = validateFile(file, allowedTypes, maxFileSize);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`);
          return;
        }

        // Check for duplicates
        const isDuplicate = files.some((f) => f.name === file.name && f.size === file.size);
        if (isDuplicate) {
          errors.push(`${file.name}: File già selezionato`);
          return;
        }

        // Create file object with preview
        const fileObj = {
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview: null,
        };

        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileObj.preview = e.target.result;
            setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? fileObj : f)));
          };
          reader.readAsDataURL(file);
        }

        validFiles.push(fileObj);
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }

      if (errors.length > 0) {
        notify.error(errors.join('\n'));
      }
    },
    [files, maxFiles, allowedTypes, maxFileSize],
  );

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Preview file
  const previewFileHandler = (fileObj) => {
    setPreviewFile(fileObj);
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      notify.error('Seleziona almeno un file da caricare');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    const results = {
      successful: [],
      failed: [],
      errors: [],
    };

    try {
      for (const fileObj of files) {
        try {
          const result = await uploadReceipt(user.id, fileObj.file);

          if (result.success) {
            results.successful.push({
              name: fileObj.name,
              url: result.url,
              path: result.path,
            });
          } else {
            results.failed.push(fileObj.name);
            results.errors.push(`${fileObj.name}: ${result.error}`);
          }
        } catch (error) {
          results.failed.push(fileObj.name);
          results.errors.push(`${fileObj.name}: ${error.message}`);
        }
      }

      setUploadResults(results);

      if (results.successful.length > 0) {
        notify.success(`${results.successful.length} ricevute caricate con successo`);

        // Call completion callback with results
        if (onUploadComplete) {
          onUploadComplete(results.successful);
        }
      }

      if (results.failed.length > 0) {
        notify.error(`${results.failed.length} file non sono stati caricati`);
      }
    } catch (error) {
      Logger.error('Upload error:', error);
      notify.error('Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentIcon;
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                  >
                    {title}
                  </Dialog.Title>

                  <div className="space-y-6">
                    {/* Description */}
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>

                    {/* File upload area */}
                    <div
                      className={classNames(
                        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                        dragOver
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="receipt-upload" className="cursor-pointer">
                          <span className="mt-2 block text-lg font-medium text-gray-900 dark:text-gray-100">
                            Trascina i file qui o{' '}
                            <span className="text-primary-600 dark:text-primary-400">
                              seleziona file
                            </span>
                          </span>
                        </label>
                        <input
                          ref={fileInputRef}
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept={allowedTypes.join(',')}
                          multiple
                          onChange={handleFileChange}
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          JPG, PNG, GIF, PDF fino a {Math.round(maxFileSize / 1024 / 1024)}MB
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          Massimo {maxFiles} file per volta
                        </p>
                      </div>
                    </div>

                    {/* Selected files */}
                    {files.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          File selezionati ({files.length}/{maxFiles})
                        </h4>
                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                          {files.map((fileObj) => {
                            const IconComponent = getFileIcon(fileObj.type);
                            return (
                              <div
                                key={fileObj.id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1 min-w-0">
                                    {fileObj.preview ? (
                                      <img
                                        src={fileObj.preview}
                                        alt={fileObj.name}
                                        className="h-12 w-12 rounded object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <IconComponent className="h-12 w-12 text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className="ml-3 flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {fileObj.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(fileObj.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {fileObj.preview && (
                                      <button
                                        type="button"
                                        onClick={() => previewFileHandler(fileObj)}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                        title="Anteprima"
                                      >
                                        <EyeIcon className="h-5 w-5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeFile(fileObj.id)}
                                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                      title="Rimuovi"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upload results */}
                    {uploadResults && (
                      <div className="space-y-4">
                        {uploadResults.successful.length > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex">
                              <CheckCircleIcon className="h-5 w-5 text-green-400" />
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                                  Caricamento completato
                                </h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                  <p>
                                    {uploadResults.successful.length} ricevute caricate con successo
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {uploadResults.failed.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex">
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                                  Errori durante il caricamento
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                  <ul className="list-disc list-inside space-y-1">
                                    {uploadResults.errors.slice(0, 5).map((error, index) => (
                                      <li key={index} className="text-xs">
                                        {error}
                                      </li>
                                    ))}
                                    {uploadResults.errors.length > 5 && (
                                      <li className="text-xs font-medium">
                                        ... e altri {uploadResults.errors.length - 5} errori
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Aggiungi Altri File
                      </button>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            resetComponent();
                            onClose();
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={handleUpload}
                          disabled={files.length === 0 || uploading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Caricando...
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                              Carica Ricevute ({files.length})
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* File Preview Modal */}
      {previewFile && (
        <Transition appear show={!!previewFile} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setPreviewFile(null)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        Anteprima: {previewFile.name}
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={() => setPreviewFile(null)}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="flex justify-center">
                      {previewFile.preview ? (
                        <img
                          src={previewFile.preview}
                          alt={previewFile.name}
                          className="max-w-full max-h-96 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <div className="text-center">
                            <DocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Anteprima non disponibile
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <p>Dimensione: {formatFileSize(previewFile.size)}</p>
                      <p>Tipo: {previewFile.type}</p>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
}
