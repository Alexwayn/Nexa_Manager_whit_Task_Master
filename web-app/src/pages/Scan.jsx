import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '@components/shared/Footer';
import {
  CameraIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { notify } from '@lib/uiUtils';

export default function Scan() {
  const { t } = useTranslation('scan');
  const fileInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedScanType, setSelectedScanType] = useState('upload');
  const [documentType, setDocumentType] = useState('Invoice');
  const [ocrLanguage, setOcrLanguage] = useState('English');
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [autoEnhance, setAutoEnhance] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Mock data for recent scans
  const recentScans = [
    {
      id: 1,
      name: 'Invoice #1001',
      date: '1 day ago',
      type: 'PDF',
      thumbnail: '/api/placeholder/160/160',
    },
    {
      id: 2,
      name: 'Invoice #1002',
      date: '2 days ago',
      type: 'PDF',
      thumbnail: '/api/placeholder/160/160',
    },
    {
      id: 3,
      name: 'Invoice #1003',
      date: '3 days ago',
      type: 'PDF',
      thumbnail: '/api/placeholder/160/160',
    },
    {
      id: 4,
      name: 'Invoice #1004',
      date: '4 days ago',
      type: 'PDF',
      thumbnail: '/api/placeholder/160/160',
    },
  ];

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    notify.success(t('notifications.filesSelected', { count: files.length }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const steps = [
    { id: 1, name: 'Scan Document', active: currentStep === 1 },
    { id: 2, name: 'Process OCR', active: currentStep === 2 },
    { id: 3, name: 'Review & Export', active: currentStep === 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-blue-50 border-b border-gray-200 px-8 py-5">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Documents</span>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-blue-600">Document Scanner</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-50 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Document Scanner</h1>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors">
              <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
              Help
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-lg mx-6 mb-6 shadow-sm">
        {/* Steps Indicator */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 ${
                  step.active
                    ? 'bg-blue-50 border-b-2 border-blue-600'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center py-4">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                      step.active
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`font-medium ${
                      step.active ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Scan Options */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Scan Options</h3>
              
              {/* Scan Type Options */}
              <div className="space-y-4 mb-6">
                <div
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${
                    selectedScanType === 'camera'
                      ? 'border-blue-200 bg-white'
                      : 'border-blue-200 bg-white'
                  }`}
                  onClick={() => setSelectedScanType('camera')}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <CameraIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Use Camera</div>
                      <div className="text-sm text-gray-600">Capture document using your device camera</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`border-2 rounded-md p-4 cursor-pointer transition-colors ${
                    selectedScanType === 'upload'
                      ? 'border-blue-600 bg-white'
                      : 'border-blue-200 bg-white'
                  }`}
                  onClick={() => setSelectedScanType('upload')}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Upload File</div>
                      <div className="text-sm text-gray-600">Upload document from your device</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${
                    selectedScanType === 'recent'
                      ? 'border-blue-200 bg-white'
                      : 'border-blue-200 bg-white'
                  }`}
                  onClick={() => setSelectedScanType('recent')}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Recent Scans</div>
                      <div className="text-sm text-gray-600">View and reuse your recent scans</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <div className="relative">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Contract">Contract</option>
                    <option value="Report">Report</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* OCR Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OCR Language
                </label>
                <div className="relative">
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="Italian">Italian</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Center - Upload Area */}
            <div className="lg:col-span-2">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CloudArrowUpIcon className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Upload Document</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Drag and drop your document here, or click to browse files. Supported formats: PDF, JPG, PNG, TIFF
                </p>
                <button
                  onClick={handleBrowseFiles}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Browse Files
                </button>
                <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                  <span>Maximum file size: 10MB</span>
                  <span>{uploadedFiles.length} files selected</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back
                </button>
                <button className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Continue
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Options */}
      <div className="mx-6 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Enhancement Options</h3>
          
          {/* Brightness Control */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Brightness</label>
              <span className="text-sm text-gray-700">{brightness}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Contrast Control */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Contrast</label>
              <span className="text-sm text-gray-700">{contrast}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-enhance"
                checked={autoEnhance}
                onChange={(e) => setAutoEnhance(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-enhance" className="ml-2 text-sm text-gray-700">
                Auto-enhance document
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-crop"
                checked={autoCrop}
                onChange={(e) => setAutoCrop(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-crop" className="ml-2 text-sm text-gray-700">
                Auto-crop document edges
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="mx-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Scans</h2>
          <button className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
            View All
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentScans.map((scan) => (
            <div key={scan.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-100 h-40 relative">
                <img
                  src={scan.thumbnail}
                  alt={scan.name}
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-50 transition-colors">
                  <EyeIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1">{scan.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Scanned {scan.date}</span>
                  <div className="flex items-center text-blue-600">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{scan.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
