import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from '@shared/components/Footer';
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
  HomeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { notify } from '@/lib/uiUtils';

export default function Scan() {
  const { t } = useTranslation('scan');
  const navigate = useNavigate();
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
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  const handleFileSelect = files => {
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

  const handleDrop = e => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const steps = [
    { id: 1, name: t('steps.scan'), active: currentStep === 1 },
    { id: 2, name: t('steps.process'), active: currentStep === 2 },
    { id: 3, name: t('steps.review'), active: currentStep === 3 },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
        <div className='flex items-center space-x-2 text-sm text-gray-600'>
          <HomeIcon className='h-4 w-4 text-gray-500' />
          <button
            onClick={() => navigate('/dashboard')}
            className='text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            {t('breadcrumb.documents')}
          </button>
          <ChevronRightIcon className='h-4 w-4' />
          <span className='text-gray-900 font-medium'>{t('breadcrumb.scanner')}</span>
        </div>
      </div>

      {/* Header */}
      <div className='bg-gray-50 px-6 py-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold text-gray-900'>{t('header.title')}</h1>
          <div className='flex space-x-3'>
            <button 
              onClick={() => setShowHelpModal(true)}
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors'
            >
              <QuestionMarkCircleIcon className='h-5 w-5 mr-2' />
              {t('actions.help')}
            </button>
            <button 
              onClick={handleBrowseFiles}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              <CloudArrowUpIcon className='h-5 w-5 mr-2' />
              {t('actions.uploadDocument')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='bg-white border border-gray-200 rounded-lg mx-6 mb-6 shadow-sm'>
        {/* Steps Indicator */}
        <div className='border-b border-gray-200'>
          <div className='flex'>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 ${
                  step.active ? 'bg-blue-50 border-b-2 border-blue-600' : 'bg-gray-50'
                }`}
              >
                <div className='flex items-center justify-center py-4'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                      step.active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`font-medium ${step.active ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    {step.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className='p-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Sidebar - Scan Options */}
            <div className='bg-blue-50 rounded-lg p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-6'>{t('scanOptions.title')}</h3>

              {/* Scan Type Options */}
              <div className='space-y-4 mb-6'>
                <div
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${
                    selectedScanType === 'camera'
                      ? 'border-blue-200 bg-white'
                      : 'border-blue-200 bg-white'
                  }`}
                  onClick={() => setSelectedScanType('camera')}
                >
                  <div className='flex items-center'>
                    <div className='bg-blue-100 rounded-full p-2 mr-3'>
                      <CameraIcon className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>{t('scanOptions.camera.title')}</div>
                      <div className='text-sm text-gray-600'>
                        {t('scanOptions.camera.description')}
                      </div>
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
                  <div className='flex items-center'>
                    <div className='bg-blue-100 rounded-full p-2 mr-3'>
                      <CloudArrowUpIcon className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>{t('scanOptions.upload.title')}</div>
                      <div className='text-sm text-gray-600'>{t('scanOptions.upload.description')}</div>
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
                  <div className='flex items-center'>
                    <div className='bg-blue-100 rounded-full p-2 mr-3'>
                      <DocumentDuplicateIcon className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>{t('scanOptions.recent.title')}</div>
                      <div className='text-sm text-gray-600'>{t('scanOptions.recent.description')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Type */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  {t('scanOptions.documentType')}
                </label>
                <div className='relative'>
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none'
                  >
                    <option value='Invoice'>{t('documentTypes.invoice')}</option>
                    <option value='Receipt'>{t('documentTypes.receipt')}</option>
                    <option value='Contract'>{t('documentTypes.contract')}</option>
                    <option value='Report'>{t('documentTypes.report')}</option>
                    <option value='Other'>{t('documentTypes.other')}</option>
                  </select>
                  <ChevronDownIcon className='absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none' />
                </div>
              </div>

              {/* OCR Language */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>{t('scanOptions.ocrLanguage')}</label>
                <div className='relative'>
                  <select
                    value={ocrLanguage}
                    onChange={e => setOcrLanguage(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none'
                  >
                    <option value='English'>{t('languages.english')}</option>
                    <option value='Italian'>{t('languages.italian')}</option>
                    <option value='Spanish'>{t('languages.spanish')}</option>
                    <option value='French'>{t('languages.french')}</option>
                    <option value='German'>{t('languages.german')}</option>
                  </select>
                  <ChevronDownIcon className='absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none' />
                </div>
              </div>
            </div>

            {/* Center - Upload Area */}
            <div className='lg:col-span-2'>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className='bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4'>
                  <CloudArrowUpIcon className='h-10 w-10 text-blue-600' />
                </div>
                <h3 className='text-xl font-medium text-gray-900 mb-2'>{t('upload.title')}</h3>
                <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                  {t('upload.description')}
                </p>
                <button
                  onClick={handleBrowseFiles}
                  className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                >
                  <CloudArrowUpIcon className='h-5 w-5 mr-2' />
                  {t('upload.browseFiles')}
                </button>
                <div className='flex justify-between items-center mt-6 text-sm text-gray-600'>
                  <span>{t('upload.maxFileSize')}</span>
                  <span>{uploadedFiles.length} {t('upload.filesSelected')}</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2 mt-4'>
                  <div className='bg-gray-300 h-2 rounded-full w-0'></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-between mt-6'>
                <button className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'>
                  <ArrowLeftIcon className='h-5 w-5 mr-2' />
                  {t('actions.back')}
                </button>
                <button className='inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
                  {t('actions.continue')}
                  <ArrowRightIcon className='h-5 w-5 ml-2' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Options */}
      <div className='mx-6 mb-6'>
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>{t('enhancementOptions.title')}</h3>

          {/* Brightness Control */}
          <div className='mb-4'>
            <div className='flex justify-between items-center mb-2'>
              <label className='text-sm font-medium text-gray-700'>{t('enhancementOptions.brightness.title')}</label>
              <span className='text-sm text-gray-700'>{brightness}%</span>
            </div>
            <div className='relative'>
              <input
                type='range'
                min='0'
                max='100'
                value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
              />
            </div>
          </div>

          {/* Contrast Control */}
          <div className='mb-6'>
            <div className='flex justify-between items-center mb-2'>
              <label className='text-sm font-medium text-gray-700'>{t('enhancementOptions.contrast.title')}</label>
              <span className='text-sm text-gray-700'>{contrast}%</span>
            </div>
            <div className='relative'>
              <input
                type='range'
                min='0'
                max='100'
                value={contrast}
                onChange={e => setContrast(Number(e.target.value))}
                className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className='space-y-3'>
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='auto-enhance'
                checked={autoEnhance}
                onChange={e => setAutoEnhance(e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label htmlFor='auto-enhance' className='ml-2 text-sm text-gray-700'>
                {t('enhancementOptions.autoEnhance.title')}
              </label>
            </div>
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='auto-crop'
                checked={autoCrop}
                onChange={e => setAutoCrop(e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label htmlFor='auto-crop' className='ml-2 text-sm text-gray-700'>
                {t('enhancementOptions.autoCrop.title')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className='mx-6 mb-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>{t('recentScans.title')}</h2>
          <button className='inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors'>
            {t('recentScans.viewAll')}
            <ChevronRightIcon className='h-4 w-4 ml-1' />
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {recentScans.map(scan => (
            <div
              key={scan.id}
              className='bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow'
            >
              <div className='bg-gray-100 h-40 relative'>
                <img src={scan.thumbnail} alt={scan.name} className='w-full h-full object-cover' />
                <button className='absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-50 transition-colors'>
                  <EyeIcon className='h-5 w-5 text-gray-600' />
                </button>
              </div>
              <div className='p-4'>
                <h4 className='font-medium text-gray-900 mb-1'>{scan.name}</h4>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>{t('recentScans.scanned')} {scan.date}</span>
                  <div className='flex items-center text-blue-600'>
                    <DocumentTextIcon className='h-4 w-4 mr-1' />
                    <span className='text-sm'>{scan.type}</span>
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
        type='file'
        multiple
        accept='image/*,.pdf'
        onChange={handleFileInputChange}
        className='hidden'
      />

      {/* Help Modal */}
      {showHelpModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center p-6 border-b border-gray-200'>
              <h2 className='text-xl font-semibold text-gray-900'>{t('help.modal.title')}</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>
            
            <div className='p-6 space-y-6'>
              {/* Getting Started */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.gettingStarted.title')}</h3>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-blue-800 mb-3'>{t('help.gettingStarted.description')}</p>
                  <h4 className='font-medium text-blue-900 mb-2'>{t('help.gettingStarted.quickSteps.title')}</h4>
                  <ol className='list-decimal list-inside text-blue-800 space-y-1'>
                    <li>{t('help.gettingStarted.quickSteps.step1')}</li>
                    <li>{t('help.gettingStarted.quickSteps.step2')}</li>
                    <li>{t('help.gettingStarted.quickSteps.step3')}</li>
                    <li>{t('help.gettingStarted.quickSteps.step4')}</li>
                    <li>{t('help.gettingStarted.quickSteps.step5')}</li>
                  </ol>
                </div>
              </div>

              {/* Scan Methods */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.scanMethods.title')}</h3>
                <div className='space-y-3'>
                  <div className='flex items-start space-x-3'>
                    <CameraIcon className='h-5 w-5 text-blue-600 mt-0.5' />
                    <div>
                      <h4 className='font-medium text-gray-900'>{t('help.scanMethods.camera.title')}</h4>
                      <p className='text-sm text-gray-600'>{t('help.scanMethods.camera.description')}</p>
                    </div>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <CloudArrowUpIcon className='h-5 w-5 text-blue-600 mt-0.5' />
                    <div>
                      <h4 className='font-medium text-gray-900'>{t('help.scanMethods.upload.title')}</h4>
                      <p className='text-sm text-gray-600'>{t('help.scanMethods.upload.description')}</p>
                    </div>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <DocumentDuplicateIcon className='h-5 w-5 text-blue-600 mt-0.5' />
                    <div>
                      <h4 className='font-medium text-gray-900'>{t('help.scanMethods.recent.title')}</h4>
                      <p className='text-sm text-gray-600'>{t('help.scanMethods.recent.description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Types */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.documentTypes.title')}</h3>
                <p className='text-sm text-gray-600 mb-3'>{t('help.documentTypes.description')}</p>
                <div className='space-y-2 text-sm'>
                  <div className='bg-gray-50 p-2 rounded'>{t('help.documentTypes.receipt')}</div>
                  <div className='bg-gray-50 p-2 rounded'>{t('help.documentTypes.invoice')}</div>
                  <div className='bg-gray-50 p-2 rounded'>{t('help.documentTypes.contract')}</div>
                  <div className='bg-gray-50 p-2 rounded'>{t('help.documentTypes.report')}</div>
                </div>
              </div>

              {/* Enhancement Options */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.enhancementOptions.title')}</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-700'>{t('help.enhancementOptions.brightness.title')}</span>
                    <span className='text-sm text-gray-500'>{t('help.enhancementOptions.brightness.description')}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-700'>{t('help.enhancementOptions.contrast.title')}</span>
                    <span className='text-sm text-gray-500'>{t('help.enhancementOptions.contrast.description')}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-700'>{t('help.enhancementOptions.autoEnhance.title')}</span>
                    <span className='text-sm text-gray-500'>{t('help.enhancementOptions.autoEnhance.description')}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-700'>{t('help.enhancementOptions.autoCrop.title')}</span>
                    <span className='text-sm text-gray-500'>{t('help.enhancementOptions.autoCrop.description')}</span>
                  </div>
                </div>
              </div>

              {/* Supported Formats */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.supportedFormats.title')}</h3>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <h4 className='font-medium text-gray-900 mb-1'>{t('help.supportedFormats.input.title')}</h4>
                      <div className='text-gray-600 space-y-1'>
                        <div>{t('help.supportedFormats.input.pdf')}</div>
                        <div>{t('help.supportedFormats.input.jpeg')}</div>
                        <div>{t('help.supportedFormats.input.png')}</div>
                        <div>{t('help.supportedFormats.input.tiff')}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className='font-medium text-gray-900 mb-1'>{t('help.supportedFormats.output.title')}</h4>
                      <div className='text-gray-600 space-y-1'>
                        <div>{t('help.supportedFormats.output.searchablePdf')}</div>
                        <div>{t('help.supportedFormats.output.plainText')}</div>
                        <div>{t('help.supportedFormats.output.word')}</div>
                        <div>{t('help.supportedFormats.output.excel')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>{t('help.tips.title')}</h3>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <ul className='text-yellow-800 space-y-2 text-sm'>
                    <li>{t('help.tips.goodLighting')}</li>
                    <li>{t('help.tips.flatDocuments')}</li>
                    <li>{t('help.tips.highResolution')}</li>
                    <li>{t('help.tips.correctLanguage')}</li>
                    <li>{t('help.tips.cleanDocuments')}</li>
                    <li>{t('help.tips.maxFileSize')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex justify-end p-6 border-t border-gray-200'>
              <button
                onClick={() => setShowHelpModal(false)}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
              >
                {t('help.modal.gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
