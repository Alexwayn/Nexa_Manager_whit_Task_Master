import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoIcon } from '@heroicons/react/24/outline';

const FileUploadField = ({
  label,
  currentImage,
  altText,
  isUploading = false,
  uploadProgress = 0,
  onFileSelect,
  onRemove,
  accept = 'image/*',
  maxSize = '2MB',
  supportedFormats = 'SVG, PNG o JPG',
  className = '',
  imageClassName = 'h-16 w-16',
  error = null,
}) => {
  const { t } = useTranslation('settings');

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const finalAltText = altText || t('fileUpload.altText');

  return (
    <div className={className}>
      {label && <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>}

      <div className='flex items-center mt-1'>
        <div
          className={`relative flex-shrink-0 ${imageClassName} overflow-hidden rounded border border-gray-200`}
        >
          <img className='h-full w-full object-contain' src={currentImage} alt={finalAltText} />
          {isUploading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40'>
              <svg
                className='animate-spin h-8 w-8 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            </div>
          )}
        </div>

        <div className='ml-5'>
          <div className='flex'>
            <label
              htmlFor={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
              className='bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isUploading ? t('fileUpload.uploading') : t('fileUpload.change')}
            </label>
            <input
              id={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
              name={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
              type='file'
              className='sr-only'
              accept={accept}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {onRemove && (
              <button
                type='button'
                onClick={onRemove}
                disabled={isUploading}
                className='ml-2 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {t('fileUpload.remove')}
              </button>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && uploadProgress > 0 && (
            <div className='mt-2'>
              <div className='bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {t('fileUpload.progress', { progress: uploadProgress })}
              </p>
            </div>
          )}

          {/* File info */}
          {!isUploading && (
            <p className='mt-2 text-xs text-gray-500'>
              {t('fileUpload.info', { formats: supportedFormats, size: maxSize })}
            </p>
          )}

          {/* Error message */}
          {error && <p className='mt-2 text-xs text-red-600'>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default FileUploadField;
