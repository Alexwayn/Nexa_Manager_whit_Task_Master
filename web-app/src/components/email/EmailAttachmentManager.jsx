import React, { useState, useCallback, useRef } from 'react';
import {
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import emailAttachmentService from '@lib/emailAttachmentService';

const EmailAttachmentManager = ({ 
  attachments = [], 
  onAttachmentsChange, 
  maxFiles = 10,
  disabled = false 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const config = emailAttachmentService.getConfig();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [disabled, attachments]);

  const handleFileInput = useCallback(async (e) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files);
    await handleFiles(files);
    
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  }, [disabled, attachments]);

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      const result = await emailAttachmentService.uploadAttachments(files, attachments);
      
      if (result.success) {
        const newAttachments = [...attachments, ...result.data];
        onAttachmentsChange(newAttachments);
        
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
        }
      } else {
        setErrors([result.error]);
      }
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (attachmentId) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    onAttachmentsChange(updatedAttachments);
    
    // Also delete from service
    emailAttachmentService.deleteAttachment(attachmentId);
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />;
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
      return <ArchiveBoxIcon className="h-6 w-6 text-yellow-500" />;
    }
    return <DocumentIcon className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const isNearLimit = totalSize > config.maxTotalSize * 0.8;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${isNearLimit ? 'border-orange-300 bg-orange-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept={config.allowedTypes.join(',')}
          disabled={disabled}
        />

        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600">Uploading files...</p>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className={`h-12 w-12 mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                Maximum {config.maxFiles} files, {config.maxFileSizeFormatted} per file, {config.maxTotalSizeFormatted} total
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Size Warning */}
      {isNearLimit && (
        <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
          <div className="text-sm text-orange-800">
            Approaching size limit: {formatFileSize(totalSize)} / {config.maxTotalSizeFormatted}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setErrors([])}
              className="text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Attachments ({attachments.length}/{config.maxFiles})
            </h4>
            <div className="text-sm text-gray-500">
              Total: {formatFileSize(totalSize)}
            </div>
          </div>

          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • {attachment.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => {
                      // In a real app, this would open a preview modal
                      alert(`Preview functionality would show ${attachment.name}`);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove"
                    disabled={disabled}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Type Information */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-700">
          Allowed file types
        </summary>
        <div className="mt-2 pl-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Documents:</strong>
              <br />PDF, Word, Excel, PowerPoint, Text
            </div>
            <div>
              <strong>Images:</strong>
              <br />JPEG, PNG, GIF, WebP, SVG
            </div>
            <div>
              <strong>Archives:</strong>
              <br />ZIP, RAR, 7Z
            </div>
            <div>
              <strong>Blocked:</strong>
              <br />Executable files (.exe, .bat, etc.)
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default EmailAttachmentManager; 