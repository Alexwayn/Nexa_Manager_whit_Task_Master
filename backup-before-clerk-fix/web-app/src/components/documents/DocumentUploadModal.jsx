import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon, XCircleIcon } from '@heroicons/react/24/outline';

const DocumentUploadModal = ({ isOpen, onClose, onUpload, currentPath = '' }) => {
  const { t } = useTranslation('documents');
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // File validation settings
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 10;

  const validateFile = (file) => {
    const errors = [];
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(t('upload.errors.invalidType', 'File type not allowed'));
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(t('upload.errors.tooLarge', 'File size exceeds 10MB limit'));
    }
    
    return errors;
  };

  const handleFileSelect = useCallback((selectedFiles) => {
    const newFiles = Array.from(selectedFiles);
    const validatedFiles = [];
    const newErrors = [];

    // Check total file count
    if (files.length + newFiles.length > MAX_FILES) {
      newErrors.push(t('upload.errors.tooManyFiles', `Maximum ${MAX_FILES} files allowed`));
      setErrors(newErrors);
      return;
    }

    newFiles.forEach((file) => {
      const fileErrors = validateFile(file);
      
      if (fileErrors.length === 0) {
        // Add unique ID and metadata
        const fileWithMetadata = {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending'
        };
        validatedFiles.push(fileWithMetadata);
      } else {
        newErrors.push(`${file.name}: ${fileErrors.join(', ')}`);
      }
    });

    setFiles(prev => [...prev, ...validatedFiles]);
    setErrors(newErrors);
  }, [files.length, t]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    handleFileSelect(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('word') || type.includes('document')) {
      return '📝';
    } else if (type.includes('excel') || type.includes('sheet')) {
      return '📊';
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return '📎';
    }
    return '📁';
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    try {
      for (const fileItem of files) {
        if (fileItem.status === 'completed') continue;

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading' } : f
        ));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({
            ...prev,
            [fileItem.id]: progress
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const uploadData = {
          file: fileItem.file,
          name: fileItem.name,
          size: fileItem.size,
          type: fileItem.type,
          path: currentPath,
          uploadedAt: new Date().toISOString()
        };

        await onUpload(uploadData);

        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed' } : f
        ));
      }

      // Close modal after successful upload
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      setErrors([error.message || t('upload.errors.uploadFailed', 'Upload failed')]);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'error' } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return; // Prevent closing during upload
    setFiles([]);
    setUploadProgress({});
    setErrors([]);
    setIsDragOver(false);
    onClose();
  };

  if (!isOpen) return null;

  const hasFiles = files.length > 0;
  const canUpload = hasFiles && !isUploading && files.some(f => f.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                {t('upload.title', 'Upload Documents')}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleClose}
                disabled={isUploading}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {currentPath && (
              <p className="mt-2 text-sm text-gray-500">
                {t('upload.uploadTo', 'Upload to')}: {currentPath}
              </p>
            )}

            {/* Drag and Drop Area */}
            <div
              className={`mt-6 border-2 border-dashed rounded-lg p-6 text-center ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`} />
              <p className="mt-2 text-sm text-gray-600">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('upload.clickToUpload', 'Click to upload')}
                </button>{' '}
                {t('upload.orDragAndDrop', 'or drag and drop')}
              </p>
              <p className="text-xs text-gray-500">
                {t('upload.supportedFormats', 'PDF, DOC, XLS, PPT, Images up to 10MB')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {t('upload.errors.title', 'Upload Errors')}
                    </h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* File List */}
            {hasFiles && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {t('upload.selectedFiles', 'Selected Files')} ({files.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{getFileIcon(fileItem.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileItem.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileItem.size)}
                          </p>
                          {fileItem.status === 'uploading' && uploadProgress[fileItem.id] !== undefined && (
                            <div className="mt-1">
                              <div className="bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[fileItem.id]}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {uploadProgress[fileItem.id]}%
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          {fileItem.status === 'completed' && (
                            <span className="text-green-500 text-sm">✓</span>
                          )}
                          {fileItem.status === 'error' && (
                            <span className="text-red-500 text-sm">✗</span>
                          )}
                          {fileItem.status === 'uploading' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </div>
                      {fileItem.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => removeFile(fileItem.id)}
                          className="ml-3 text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!canUpload}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('upload.uploading', 'Uploading...')}
                </>
              ) : (
                t('upload.upload', 'Upload Files')
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={handleClose}
              disabled={isUploading}
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal; 