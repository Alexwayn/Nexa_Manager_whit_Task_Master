// File upload component for document scanning
import React, { useState, useRef, useCallback } from 'react';
import { 
  DocumentArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import type { FileUploadProps, ProcessedFile } from './types';

interface UploadState {
  isDragOver: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onError,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  multiple = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragOver: false,
    isProcessing: false,
    uploadProgress: 0,
    error: null
  });
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get file type display name
  const getFileTypeDisplay = useCallback((type: string): string => {
    switch (type) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'JPEG Image';
      case 'image/png':
        return 'PNG Image';
      case 'application/pdf':
        return 'PDF Document';
      default:
        return type;
    }
  }, []);

  // Get file icon
  const getFileIcon = useCallback((type: string) => {
    if (type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    } else if (type === 'application/pdf') {
      return <DocumentIcon className="h-8 w-8 text-red-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }

    return null;
  }, [acceptedTypes, maxFileSize, formatFileSize]);

  // Create file preview
  const createFilePreview = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, return a placeholder
        resolve('');
      }
    });
  }, []);

  // Process files
  const processFiles = useCallback(async (files: File[]) => {
    setUploadState(prev => ({ ...prev, isProcessing: true, error: null, uploadProgress: 0 }));
    
    try {
      const newProcessedFiles: ProcessedFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        setUploadState(prev => ({ ...prev, uploadProgress: progress }));
        
        // Validate file
        const validationError = validateFile(file);
        
        let preview = '';
        let error: string | undefined;
        
        if (validationError) {
          error = validationError;
        } else {
          try {
            preview = await createFilePreview(file);
          } catch (previewError) {
            console.warn('Failed to create preview for file:', file.name, previewError);
            // Continue processing even if preview fails
          }
        }
        
        const processedFile: ProcessedFile = {
          id: `file_${Date.now()}_${i}`,
          originalFile: file,
          preview,
          size: file.size,
          type: file.type,
          name: file.name,
          error
        };
        
        newProcessedFiles.push(processedFile);
      }
      
      setProcessedFiles(prev => multiple ? [...prev, ...newProcessedFiles] : newProcessedFiles);
      
      // Call callback with valid files only
      const validFiles = newProcessedFiles.filter(f => !f.error);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      
      // Report errors for invalid files
      const invalidFiles = newProcessedFiles.filter(f => f.error);
      if (invalidFiles.length > 0) {
        const errorMessage = `${invalidFiles.length} file(s) could not be processed: ${invalidFiles.map(f => f.error).join(', ')}`;
        onError(errorMessage);
      }
      
    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process files';
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      onError(errorMessage);
    } finally {
      setUploadState(prev => ({ ...prev, isProcessing: false, uploadProgress: 0 }));
    }
  }, [validateFile, createFilePreview, multiple, onFilesSelected, onError]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [processFiles]);

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: true }));
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setProcessedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setProcessedFiles([]);
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  // Get accepted file extensions for display
  const getAcceptedExtensions = useCallback(() => {
    return acceptedTypes.map(type => {
      switch (type) {
        case 'image/jpeg':
          return 'JPG';
        case 'image/png':
          return 'PNG';
        case 'application/pdf':
          return 'PDF';
        default:
          return type.split('/')[1]?.toUpperCase() || type;
      }
    }).join(', ');
  }, [acceptedTypes]);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploadState.isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploadState.isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">
            {uploadState.isDragOver ? 'Drop files here' : 'Upload Documents'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Drag and drop your files here, or{' '}
            <button
              type="button"
              onClick={openFilePicker}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              browse
            </button>
          </p>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Supported formats: {getAcceptedExtensions()}</p>
          <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
          {multiple && <p>You can select multiple files</p>}
        </div>
        
        {/* Progress bar */}
        {uploadState.isProcessing && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Processing files... {Math.round(uploadState.uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* File List */}
      {processedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              Selected Files ({processedFiles.length})
            </h4>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-3">
            {processedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center space-x-4 p-4 border rounded-lg ${
                  file.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                {/* File icon/preview */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getFileTypeDisplay(file.type)} • {formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <p className="text-sm text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
                
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {file.error ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{uploadState.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload instructions */}
      {processedFiles.length === 0 && !uploadState.isProcessing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Select documents to scan and extract text from images or PDFs
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;