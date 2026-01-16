import React, { useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import clientService from '@/lib/clientService';
import { notify } from '@/lib/uiUtils';
import Logger from '@/utils/Logger';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ClientImportExport({ isOpen, onClose, onImportComplete, clients = [] }) {
  const { t } = useTranslation('clients');
  const [activeTab, setActiveTab] = useState(0);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const csvTemplate = `Nome,Email,Telefono,Indirizzo,Città,Provincia,CAP,Partita IVA,Codice Fiscale,Note
"Mario Rossi","mario.rossi@email.com","123456789","Via Roma 1","Milano","MI","20100","12345678901","RSSMRA80A01H501Z","Cliente importante"
"Giulia Bianchi","giulia.bianchi@email.com","987654321","Via Milano 5","Roma","RM","00100","","BNCGLI85B42H501W","Preventivo richiesto"`;

  const handleFileSelect = file => {
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const isValidType =
      validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      notify.error(t('importExport.import.unsupportedFormat'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error(t('importExport.import.fileTooLarge'));
      return;
    }

    setImportFile(file);
    setImportResults(null);
  };

  const handleFileChange = e => handleFileSelect(e.target.files[0]);
  const handleDragOver = e => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = e => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  };

  const readFileAsText = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file, 'UTF-8');
    });

  const handleImport = async () => {
    if (!importFile) {
      notify.error(t('importExport.import.selectFile'));
      return;
    }
    setImporting(true);
    try {
      const content = await readFileAsText(importFile);
      const result = await clientService.importFromCSV(content);
      setImportResults(result);
      if (result.success) {
        notify.success(t('importExport.import.success', { count: result.imported }));
        if (result.errors.length > 0)
          notify.warning(t('importExport.import.warning', { count: result.errors.length }));
        if (onImportComplete) onImportComplete();
      } else {
        notify.error(t('importExport.import.error'));
      }
    } catch (error) {
      Logger.error('Import error:', error);
      notify.error(t('importExport.import.errorMessage', { message: error.message }));
      setImportResults({ success: false, imported: 0, errors: [error.message] });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      if (clients.length === 0) {
        notify.warning(t('importExport.export.noClients'));
        return;
      }
      const csvContent = clientService.exportToCSV(clients);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clienti_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify.success(t('importExport.export.success', { count: clients.length }));
    } catch (error) {
      Logger.error('Export error:', error);
      notify.error(t('importExport.export.error', { message: error.message }));
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_clienti.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success(t('importExport.import.downloadTemplate'));
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs = [t('importExport.importTab'), t('importExport.exportTab')];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-500/75 transition-opacity' />
        </Transition.Child>
        <div className='fixed inset-0 z-10 overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            >
              <Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6'>
                <div className='absolute right-0 top-0 hidden pr-4 pt-4 sm:block'>
                  <button
                    type='button'
                    className='rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                    onClick={onClose}
                  >
                    <span className='sr-only'>{t('importExport.close')}</span>
                    <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                  </button>
                </div>
                <div className='sm:flex sm:items-start'>
                  <div className='w-full'>
                    <Dialog.Title
                      as='h3'
                      className='text-base font-semibold leading-6 text-gray-900 dark:text-gray-100'
                    >
                      {t('importExport.title')}
                    </Dialog.Title>
                    <div className='mt-6'>
                      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                        <Tab.List className='flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1'>
                          {tabs.map(tab => (
                            <Tab
                              key={tab}
                              className={({ selected }) =>
                                classNames(
                                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 dark:text-gray-300',
                                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60',
                                  selected
                                    ? 'bg-white dark:bg-gray-900 shadow'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/[0.12] hover:text-white',
                                )
                              }
                            >
                              {tab}
                            </Tab>
                          ))}
                        </Tab.List>
                        <Tab.Panels className='mt-2'>
                          <Tab.Panel className='rounded-xl bg-white dark:bg-gray-800 p-3'>
                            {!importResults ? (
                              <div>
                                <div
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop}
                                  className={classNames(
                                    'mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pb-6 pt-5',
                                    dragOver
                                      ? 'border-primary-500'
                                      : 'border-gray-300 dark:border-gray-600',
                                  )}
                                >
                                  <div className='text-center'>
                                    <CloudArrowUpIcon className='mx-auto h-12 w-12 text-gray-400' />
                                    <div className='mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400'>
                                      <label
                                        htmlFor='file-upload'
                                        className='relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500'
                                      >
                                        <span>{t('importExport.import.browse')}</span>
                                        <input
                                          id='file-upload'
                                          name='file-upload'
                                          type='file'
                                          className='sr-only'
                                          onChange={handleFileChange}
                                          ref={fileInputRef}
                                          accept='.csv, .xls, .xlsx'
                                        />
                                      </label>
                                      <p className='pl-1'>
                                        {t('importExport.import.or')}{' '}
                                        {t('importExport.import.dragAndDrop')}
                                      </p>
                                    </div>
                                    {importFile && (
                                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                                        {t('importExport.import.fileSelected')} {importFile.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className='mt-4 flex justify-between items-center'>
                                  <button
                                    type='button'
                                    onClick={downloadTemplate}
                                    className='inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600'
                                  >
                                    <DocumentArrowUpIcon className='-ml-0.5 mr-1.5 h-5 w-5' />
                                    {t('importExport.import.downloadTemplate')}
                                  </button>
                                  <button
                                    type='button'
                                    onClick={handleImport}
                                    disabled={!importFile || importing}
                                    className='inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50'
                                  >
                                    {importing
                                      ? t('importExport.import.importing')
                                      : t('importExport.import.importButton')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className='text-center'>
                                {importResults.success ? (
                                  <CheckCircleIcon className='mx-auto h-12 w-12 text-green-500' />
                                ) : (
                                  <ExclamationTriangleIcon className='mx-auto h-12 w-12 text-red-500' />
                                )}
                                <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-gray-100'>
                                  {t('importExport.import.results')}
                                </h3>
                                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                  {t('importExport.import.success', {
                                    count: importResults.imported,
                                  })}
                                </p>
                                {importResults.errors.length > 0 && (
                                  <div className='mt-4 text-left'>
                                    <p className='text-sm font-medium text-red-600 dark:text-red-400'>
                                      {t('importExport.import.errorsList')}
                                    </p>
                                    <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-red-600 dark:text-red-400 max-h-40 overflow-y-auto'>
                                      {importResults.errors.map((err, i) => (
                                        <li key={i}>
                                          {typeof err === 'string' ? err : JSON.stringify(err)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <button
                                  type='button'
                                  onClick={resetImport}
                                  className='mt-6 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500'
                                >
                                  {t('importExport.import.reImport')}
                                </button>
                              </div>
                            )}
                          </Tab.Panel>
                          <Tab.Panel className='rounded-xl bg-white dark:bg-gray-800 p-3'>
                            <div className='flex flex-col items-center justify-center space-y-4'>
                              <InformationCircleIcon className='h-10 w-10 text-primary-500' />
                              <p className='text-sm text-gray-500 dark:text-gray-400'>
                                {t('importExport.export.success', { count: clients.length })}
                              </p>
                              <button
                                type='button'
                                onClick={handleExport}
                                className='inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500'
                              >
                                <ArrowDownTrayIcon className='-ml-0.5 mr-1.5 h-5 w-5' />
                                {t('importExport.export.exportButton')}
                              </button>
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
