import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { QuoteApprovalService } from '../services/quoteApprovalService';
import Logger from '@utils/Logger';

/**
 * DigitalSignature Component
 * Handles digital signature capture for quote approvals
 */
const DigitalSignature = ({ quoteId, onSignatureComplete, className = '' }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    title: '',
    company: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    clearSignature();
  }, []);

  const startDrawing = e => {
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = e => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(
      0,
      0,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio,
    );
    setIsEmpty(true);
  };

  const handleInputChange = (field, value) => {
    setSignerInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateSignature = () => {
    if (isEmpty) {
      alert(t('quotes.signature.errors.empty', 'Please provide a signature'));
      return false;
    }

    if (!signerInfo.name.trim()) {
      alert(t('quotes.signature.errors.name_required', 'Please enter your name'));
      return false;
    }

    if (!signerInfo.email.trim()) {
      alert(t('quotes.signature.errors.email_required', 'Please enter your email'));
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerInfo.email)) {
      alert(t('quotes.signature.errors.invalid_email', 'Please enter a valid email address'));
      return false;
    }

    return true;
  };

  const captureSignature = async () => {
    if (!validateSignature()) return;

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');

      const signatureMetadata = {
        signature_data: signatureData,
        timestamp: new Date().toISOString(),
        ip_address: 'client', // Would be captured server-side in real implementation
        user_agent: navigator.userAgent,
        canvas_dimensions: {
          width: canvas.width,
          height: canvas.height,
        },
      };

      await QuoteApprovalService.captureDigitalSignature(
        quoteId,
        user?.id || 'client',
        signatureMetadata,
        signerInfo,
      );

      Logger.info('Digital signature captured successfully:', { quoteId });

      if (onSignatureComplete) {
        onSignatureComplete({
          signature: signatureMetadata,
          signer: signerInfo,
        });
      }

      alert(t('quotes.signature.success', 'Signature captured successfully!'));
    } catch (error) {
      Logger.error('Failed to capture digital signature:', error);
      alert(
        t(
          'quotes.signature.errors.capture_failed',
          'Failed to capture signature. Please try again.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className='text-lg font-medium text-gray-900'>
        {t('quotes.signature.title', 'Digital Signature')}
      </h3>

      {/* Signer Information */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700'>
            {t('quotes.signature.name', 'Full Name')} *
          </label>
          <input
            type='text'
            value={signerInfo.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder={t('quotes.signature.name_placeholder', 'Enter your full name')}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            {t('quotes.signature.email', 'Email Address')} *
          </label>
          <input
            type='email'
            value={signerInfo.email}
            onChange={e => handleInputChange('email', e.target.value)}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder={t('quotes.signature.email_placeholder', 'Enter your email')}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            {t('quotes.signature.title', 'Job Title')}
          </label>
          <input
            type='text'
            value={signerInfo.title}
            onChange={e => handleInputChange('title', e.target.value)}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder={t('quotes.signature.title_placeholder', 'Your job title')}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>
            {t('quotes.signature.company', 'Company')}
          </label>
          <input
            type='text'
            value={signerInfo.company}
            onChange={e => handleInputChange('company', e.target.value)}
            className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            placeholder={t('quotes.signature.company_placeholder', 'Company name')}
          />
        </div>
      </div>

      {/* Signature Canvas */}
      <div className='space-y-2'>
        <label className='block text-sm font-medium text-gray-700'>
          {t('quotes.signature.canvas_label', 'Signature')} *
        </label>
        <div className='border border-gray-300 rounded-md p-2 bg-white'>
          <canvas
            ref={canvasRef}
            className='w-full h-32 cursor-crosshair'
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>
        <div className='text-xs text-gray-500'>
          {t('quotes.signature.canvas_help', 'Click and drag to sign above')}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-between'>
        <button
          type='button'
          onClick={clearSignature}
          className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          {t('quotes.signature.clear', 'Clear')}
        </button>

        <button
          type='button'
          onClick={captureSignature}
          disabled={isLoading || isEmpty}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
              {t('common.processing', 'Processing...')}
            </>
          ) : (
            t('quotes.signature.submit', 'Submit Signature')
          )}
        </button>
      </div>

      {/* Legal Notice */}
      <div className='text-xs text-gray-500 bg-gray-50 p-3 rounded-md'>
        {t(
          'quotes.signature.legal_notice',
          'By signing above, you acknowledge that you have read and agree to the terms of this quote. Your signature will be securely stored and legally binding.',
        )}
      </div>
    </div>
  );
};

export default DigitalSignature;
