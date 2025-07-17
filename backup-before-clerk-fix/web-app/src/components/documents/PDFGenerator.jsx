import React, { useState } from 'react';
import PDFGenerationService from '@lib/pdfGenerationService';
import { useTranslation } from 'react-i18next';

const PDFGenerator = () => {
  const { t } = useTranslation('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState(null);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState('standard');
  const [includeQR, setIncludeQR] = useState(true);
  const [includePaymentSlip, setIncludePaymentSlip] = useState(false);
  const [watermark, setWatermark] = useState('');

  // Generate sample invoice data for preview purposes only
  const generateSampleInvoice = () => ({
    invoice_number: 'FATT-2025-0001',
    issue_date: '2025-01-19',
    due_date: '2025-02-18',
    status: 'issued',
    subtotal: 1000.0,
    tax_amount: 220.0,
    total_amount: 1220.0,
    withholding_amount: 0,
    notes: t('invoiceData.notes'),
    payment_method: t('invoiceData.paymentMethod'),
    payment_terms: t('invoiceData.paymentTerms'),

    // Client information
    client: {
      name: t('invoiceData.clientName'),
      company_name: t('invoiceData.clientCompanyName'),
      email: 'mario.rossi@rossiconsulting.it',
      phone: '+39 02 1234567',
      address: 'Via Roma, 123',
      city: 'Milano',
      postal_code: '20121',
      vat_number: 'IT12345678901',
      fiscal_code: 'RSSMRA80A01F205X',
    },

    // Company information
    company: {
      name: t('invoiceData.companyName'),
      address: 'Via Dante, 456',
      city: 'Milano',
      postal_code: '20122',
      country: 'Italia',
      vat_number: 'IT98765432109',
      fiscal_code: 'NXAMNG23A01F205Y',
      email: 'info@nexamanager.it',
      phone: '+39 02 9876543',
      website: 'www.nexamanager.it',
    },

    // Invoice items
    items: [
      {
        id: 1,
        description: t('invoiceData.item1Description'),
        quantity: 20,
        unit_price: 45.0,
        iva_rate: 0.22,
        amount: 900.0,
      },
      {
        id: 2,
        description: t('invoiceData.item2Description'),
        quantity: 2,
        unit_price: 50.0,
        iva_rate: 0.22,
        amount: 100.0,
      },
    ],

    // Tax details
    taxBreakdown: {
      [t('invoiceData.taxRate')]: {
        rate: 0.22,
        baseAmount: 1000.0,
        taxAmount: 220.0,
      },
    },

    complianceNotes: [t('invoiceData.complianceNote1'), t('invoiceData.complianceNote2')],

    // Bank details
    bank_details: {
      iban: 'IT60 X054 2811 1010 0000 0123 456',
      bic: 'BPMOIT22XXX',
      bank_name: 'Banco BPM',
    },
  });

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedPDF(null);

    try {
      const options = {
        template,
        includeQR,
        includePaymentSlip,
        language: 'it',
        watermark: watermark || null,
      };

      // Use the provided invoice data or generate sample data for preview
      const invoiceToProcess = invoiceData || generateSampleInvoice();
      const result = await PDFGenerationService.generateInvoicePDF(invoiceToProcess, options);

      if (result.success) {
        setGeneratedPDF(result);
      } else {
        setError(result.error || t('errorGeneric'));
      }
    } catch (err) {
      setError(err.message || t('errorUnexpected'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedPDF && generatedPDF.pdf) {
      const link = document.createElement('a');
      link.href = generatedPDF.pdf.dataUri;
      link.download = generatedPDF.metadata.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewPDF = () => {
    if (generatedPDF && generatedPDF.pdf) {
      const newWindow = window.open();
      newWindow.document.write(`
        <iframe 
          src="${generatedPDF.pdf.dataUri}" 
          width="100%" 
          height="100%" 
          style="border: none;">
        </iframe>
      `);
    }
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>{t('title')}</h2>
        <p className='text-gray-600'>{t('subtitle')}</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Configuration Section */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-gray-800'>{t('configTitle')}</h3>

          {/* Template Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('templateLabel')}
            </label>
            <select
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='standard'>{t('templates.standard')}</option>
              <option value='professional'>{t('templates.professional')}</option>
              <option value='minimal'>{t('templates.minimal')}</option>
              <option value='detailed'>{t('templates.detailed')}</option>
            </select>
          </div>

          {/* Options */}
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-gray-700'>{t('optionsLabel')}</h4>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={includeQR}
                onChange={e => setIncludeQR(e.target.checked)}
                className='mr-2'
              />
              <span className='text-sm text-gray-700'>{t('includeQR')}</span>
            </label>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={includePaymentSlip}
                onChange={e => setIncludePaymentSlip(e.target.checked)}
                className='mr-2'
              />
              <span className='text-sm text-gray-700'>{t('includePaymentSlip')}</span>
            </label>
          </div>

          {/* Watermark */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('watermarkLabel')}
            </label>
            <input
              type='text'
              value={watermark}
              onChange={e => setWatermark(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder={t('watermarkPlaceholder')}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className='w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
          >
            {isGenerating ? (
              <div className='flex items-center justify-center'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                {t('generatingButton')}
              </div>
            ) : (
              t('generateButton')
            )}
          </button>

          {/* Sample Invoice Preview */}
          <div className='mt-6 p-4 bg-gray-50 rounded-md'>
            <h4 className='text-sm font-medium text-gray-800 mb-3'>{t('sampleInvoiceTitle')}</h4>
            <div className='text-sm text-gray-600 space-y-1'>
              <p>
                <strong>{t('sampleInvoiceNumber')}:</strong> {sampleInvoice.invoice_number}
              </p>
              <p>
                <strong>{t('sampleInvoiceClient')}:</strong> {sampleInvoice.client.company_name}
              </p>
              <p>
                <strong>{t('sampleInvoiceAmount')}:</strong> €
                {sampleInvoice.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-gray-800'>{t('resultTitle')}</h3>

          {error && (
            <div className='p-4 bg-red-100 text-red-700 rounded-md'>
              <p>{error}</p>
            </div>
          )}

          {generatedPDF && (
            <div className='space-y-4 p-4 border rounded-md'>
              <div className='flex justify-between items-center'>
                <p className='font-medium text-green-600'>PDF generato con successo!</p>
                <div className='flex gap-2'>
                  <button
                    onClick={handleDownloadPDF}
                    className='px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600'
                  >
                    {t('downloadButton')}
                  </button>
                  <button
                    onClick={handleViewPDF}
                    className='px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300'
                  >
                    {t('viewButton')}
                  </button>
                </div>
              </div>

              <div className='text-sm text-gray-600 space-y-1'>
                <p>
                  <strong>{t('pdfDetails.fileName')}:</strong> {generatedPDF.metadata.fileName}
                </p>
                <p>
                  <strong>{t('pdfDetails.size')}:</strong>{' '}
                  {formatFileSize(generatedPDF.metadata.size)}
                </p>
                <p>
                  <strong>{t('pdfDetails.pages')}:</strong> {generatedPDF.metadata.pages}
                </p>
                <p>
                  <strong>{t('pdfDetails.templateUsed')}:</strong> {generatedPDF.metadata.template}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;
