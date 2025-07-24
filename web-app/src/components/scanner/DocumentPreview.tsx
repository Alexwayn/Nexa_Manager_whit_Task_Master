// Document preview component for reviewing scanned documents
import React, { useState, useRef, useCallback } from 'react';
import { 
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import DocumentMetadataForm from './DocumentMetadataForm';
import type { DocumentPreviewProps } from './types';

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  showOriginal: boolean;
  showOCR: boolean;
}

interface EditState {
  isEditingMetadata: boolean;
  isEditingText: boolean;
  textContent: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onEdit: _onEdit,
  onSave,
  onCancel,
  showOCRResults = true
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    showOriginal: false,
    showOCR: showOCRResults
  });

  const [editState, setEditState] = useState<EditState>({
    isEditingMetadata: false,
    isEditingText: false,
    textContent: document.textContent
  });

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  }, []);

  const resetZoom = useCallback(() => {
    setViewState(prev => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
  }, []);

  // Rotation controls
  const rotateLeft = useCallback(() => {
    setViewState(prev => ({ ...prev, rotation: prev.rotation - 90 }));
  }, []);

  const rotateRight = useCallback(() => {
    setViewState(prev => ({ ...prev, rotation: prev.rotation + 90 }));
  }, []);

  // Pan controls
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (viewState.zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: event.clientX - viewState.panX, y: event.clientY - viewState.panY });
    }
  }, [viewState.zoom, viewState.panX, viewState.panY]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      setViewState(prev => ({
        ...prev,
        panX: event.clientX - dragStart.x,
        panY: event.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Toggle views
  const toggleOriginal = useCallback(() => {
    setViewState(prev => ({ ...prev, showOriginal: !prev.showOriginal }));
  }, []);

  const toggleOCR = useCallback(() => {
    setViewState(prev => ({ ...prev, showOCR: !prev.showOCR }));
  }, []);

  // Edit controls
  const startEditingMetadata = useCallback(() => {
    setEditState(prev => ({ ...prev, isEditingMetadata: true }));
  }, []);

  const cancelEditingMetadata = useCallback(() => {
    setEditState(prev => ({ ...prev, isEditingMetadata: false }));
  }, []);

  const startEditingText = useCallback(() => {
    setEditState(prev => ({ ...prev, isEditingText: true }));
  }, []);

  const cancelEditingText = useCallback(() => {
    setEditState(prev => ({ 
      ...prev, 
      isEditingText: false,
      textContent: document.textContent
    }));
  }, [document.textContent]);

  const saveTextChanges = useCallback(() => {
    const updatedDocument = {
      ...document,
      textContent: editState.textContent,
      updatedAt: new Date()
    };
    
    onSave(updatedDocument);
    setEditState(prev => ({ ...prev, isEditingText: false }));
  }, [document, editState.textContent, onSave]);

  // Get image URL based on view state
  const getImageUrl = useCallback(() => {
    return viewState.showOriginal ? document.originalFile.url : document.enhancedFile.url;
  }, [viewState.showOriginal, document.originalFile.url, document.enhancedFile.url]);

  // Format confidence score
  const formatConfidence = useCallback((confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Preview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and edit the scanned document before saving
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {!editState.isEditingMetadata && (
              <button
                onClick={startEditingMetadata}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Info
              </button>
            )}
            
            <button
              onClick={onCancel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            
            {!editState.isEditingMetadata && (
              <button
                onClick={() => onSave(document)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Preview */}
          <div className="space-y-4">
            {/* Image Controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Image</h3>
              
              <div className="flex items-center space-x-2">
                {/* Zoom controls */}
                <button
                  onClick={zoomOut}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title="Zoom out"
                >
                  <MagnifyingGlassMinusIcon className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                  {Math.round(viewState.zoom * 100)}%
                </span>
                
                <button
                  onClick={zoomIn}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title="Zoom in"
                >
                  <MagnifyingGlassPlusIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={resetZoom}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title="Reset zoom"
                >
                  <PhotoIcon className="h-4 w-4" />
                </button>
                
                {/* Rotation controls */}
                <button
                  onClick={rotateLeft}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title="Rotate left"
                >
                  <ArrowPathIcon className="h-4 w-4 transform scale-x-[-1]" />
                </button>
                
                <button
                  onClick={rotateRight}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  title="Rotate right"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                
                {/* View toggle */}
                <button
                  onClick={toggleOriginal}
                  className={`p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
                    viewState.showOriginal ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={viewState.showOriginal ? 'Show enhanced' : 'Show original'}
                >
                  {viewState.showOriginal ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Image Container */}
            <div
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[4/3] cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={getImageUrl()}
                alt={document.title}
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${viewState.zoom}) translate(${viewState.panX / viewState.zoom}px, ${viewState.panY / viewState.zoom}px) rotate(${viewState.rotation}deg)`,
                  cursor: viewState.zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                draggable={false}
              />
              
              {/* Image info overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {viewState.showOriginal ? 'Original' : 'Enhanced'} • {formatFileSize(viewState.showOriginal ? document.originalFile.size : document.enhancedFile.size)}
              </div>
            </div>
            
            {/* Image metadata */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Original: {document.originalFile.name} ({formatFileSize(document.originalFile.size)})</p>
              <p>Enhanced: {formatFileSize(document.enhancedFile.size)}</p>
              <p>OCR Confidence: {formatConfidence(document.ocrConfidence)}</p>
              <p>Language: {document.ocrLanguage}</p>
            </div>
          </div>

          {/* Document Information and OCR Results */}
          <div className="space-y-6">
            {/* Document Metadata */}
            {editState.isEditingMetadata ? (
              <DocumentMetadataForm
                document={document}
                onSave={(updatedDocument) => {
                  onSave(updatedDocument);
                  setEditState(prev => ({ ...prev, isEditingMetadata: false }));
                }}
                onCancel={cancelEditingMetadata}
                isLoading={false}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.title}</dd>
                  </div>
                  
                  {document.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{document.description}</dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{document.category}</dd>
                  </div>
                  
                  {document.clientId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client</dt>
                      <dd className="mt-1 text-sm text-gray-900">{document.clientId}</dd>
                    </div>
                  )}
                  
                  {document.projectId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Project</dt>
                      <dd className="mt-1 text-sm text-gray-900">{document.projectId}</dd>
                    </div>
                  )}
                  
                  {document.tags.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tags</dt>
                      <dd className="mt-1 flex flex-wrap gap-1">
                        {document.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OCR Results */}
            {showOCRResults && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Extracted Text
                  </h3>
                  <div className="flex items-center space-x-3">
                    {!editState.isEditingText && (
                      <button
                        onClick={startEditingText}
                        className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                      >
                        Edit Text
                      </button>
                    )}
                    <button
                      onClick={toggleOCR}
                      className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                    >
                      {viewState.showOCR ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                {viewState.showOCR && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Confidence: {formatConfidence(document.ocrConfidence)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {(editState.isEditingText ? editState.textContent : document.textContent).length} characters
                        </span>
                      </div>
                      
                      {editState.isEditingText ? (
                        <div className="space-y-3">
                          <textarea
                            value={editState.textContent}
                            onChange={(e) => setEditState(prev => ({ ...prev, textContent: e.target.value }))}
                            rows={10}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                            placeholder="Extracted text will appear here..."
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={saveTextChanges}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Save Text
                            </button>
                            <button
                              onClick={cancelEditingText}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {document.textContent || 'No text extracted'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;