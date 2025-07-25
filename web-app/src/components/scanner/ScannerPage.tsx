// Scanner page component - main entry point for document scanning
import React, { useState, useEffect } from 'react';
import { CameraIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useScanner } from '@/hooks/scanner/useScanner';
import { ScannerStep } from '@/hooks/scanner/types';
import type { ScannerProps } from './types';
import CameraCapture from './CameraCapture';
import FileUpload from './FileUpload';
import DocumentPreview from './DocumentPreview';
import { ScannerErrorBoundary } from './ScannerErrorBoundary';
import { useErrorNotifications, NotificationContainer } from './ErrorNotification';

type ScannerTab = 'camera' | 'upload';

const ScannerPage: React.FC<ScannerProps> = ({
  onDocumentProcessed,
  defaultCategory,
  clientId,
  projectId
}) => {
  const [activeTab, setActiveTab] = useState<ScannerTab>('camera');
  const [error, setError] = useState<string | null>(null);
  
  const scanner = useScanner();
  const { notifications } = useErrorNotifications();

  // Check camera support and set default tab
  useEffect(() => {
    if (!scanner.camera.isSupported) {
      setActiveTab('upload');
    }
  }, [scanner.camera.isSupported]);

  // Handle document processing completion
  useEffect(() => {
    if (scanner.currentStep === ScannerStep.Complete && scanner.processedDocument) {
      onDocumentProcessed(scanner.processedDocument);
    }
  }, [scanner.currentStep, scanner.processedDocument, onDocumentProcessed]);

  const handleCameraCapture = async (image: Blob) => {
    try {
      setError(null);
      await scanner.processDocument(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process captured image');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      setError(null);
      await scanner.fileUpload.processFiles(files);
      
      // Process the first file for now (multi-file support in later tasks)
      if (files.length > 0) {
        const blob = new Blob([files[0]], { type: files[0].type });
        await scanner.processDocument(blob);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process uploaded files');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const isLoading = scanner.isProcessing || 
    scanner.currentStep === ScannerStep.Processing || 
    scanner.currentStep === ScannerStep.OCR ||
    scanner.currentStep === ScannerStep.Saving;

  return (
    <ScannerErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Notification Container */}
        <NotificationContainer notifications={notifications} position="top-right" />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Document Scanner</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Scan or upload documents to digitize and extract text
                  </p>
                </div>
                
                {/* Status indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">
                      {scanner.currentStep === ScannerStep.Processing && 'Processing image...'}
                      {scanner.currentStep === ScannerStep.OCR && 'Extracting text...'}
                      {scanner.currentStep === ScannerStep.Saving && 'Saving document...'}
                      {scanner.isProcessing && scanner.currentStep === ScannerStep.Idle && 'Loading...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={clearError}
                    className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {scanner.currentStep === ScannerStep.Review && scanner.processedDocument ? (
          // Document Preview/Review Step
          <DocumentPreview
            document={scanner.processedDocument}
            onEdit={(doc) => {
              // Handle document editing
              console.log('Edit document:', doc);
            }}
            onSave={async (doc) => {
              try {
                await scanner.saveProcessedDocument({
                  ...doc,
                  category: defaultCategory || doc.category,
                  clientId: clientId || doc.clientId,
                  projectId: projectId || doc.projectId,
                });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save document');
              }
            }}
            onCancel={() => {
              scanner.reset();
            }}
            showOCRResults={true}
          />
        ) : (
          // Scanner Interface
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('camera')}
                  disabled={!scanner.camera.isSupported || isLoading}
                  className={`${
                    activeTab === 'camera'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${
                    !scanner.camera.isSupported || isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <CameraIcon className="h-5 w-5" />
                  <span>Camera</span>
                  {!scanner.camera.isSupported && (
                    <span className="text-xs text-gray-400">(Not available)</span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('upload')}
                  disabled={isLoading}
                  className={`${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  <span>Upload</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'camera' && (
                <CameraCapture
                  onCapture={handleCameraCapture}
                  onError={handleError}
                />
              )}
              
              {activeTab === 'upload' && (
                <FileUpload
                  onFilesSelected={(files) => {
                    const fileObjects = files.map(f => f.originalFile);
                    handleFileUpload(fileObjects);
                  }}
                  onError={handleError}
                  acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                  multiple={false} // Single file for now
                />
              )}
            </div>
          </div>
        )}

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Current Step: {scanner.currentStep}</p>
              <p>Active Tab: {activeTab}</p>
              <p>Camera Supported: {scanner.camera.isSupported ? 'Yes' : 'No'}</p>
              <p>Is Processing: {isLoading ? 'Yes' : 'No'}</p>
              <p>Default Category: {defaultCategory || 'None'}</p>
              <p>Client ID: {clientId || 'None'}</p>
              <p>Project ID: {projectId || 'None'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </ScannerErrorBoundary>
  );
};

export default ScannerPage;