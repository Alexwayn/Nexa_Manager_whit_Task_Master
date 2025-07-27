import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceService } from '../services/invoiceService';
import Logger from '@utils/Logger';

/**
 * PaymentModal - Component for recording invoice payments
 *
 * Features:
 * - Record full or partial payments
 * - Multiple payment methods support
 * - Payment validation and error handling
 * - Real-time balance calculation
 * - Payment history display
 */
const PaymentModal = ({ isOpen, onClose, invoice, onPaymentRecorded, existingPayments = [] }) => {
  const { t } = useTranslation('invoices');
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState(existingPayments);

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: t('paymentMethods.cash'), icon: '💵' },
    { value: 'bank_transfer', label: t('paymentMethods.bank_transfer'), icon: '🏦' },
    { value: 'credit_card', label: t('paymentMethods.credit_card'), icon: '💳' },
    { value: 'debit_card', label: t('paymentMethods.debit_card'), icon: '💳' },
    { value: 'check', label: t('paymentMethods.check'), icon: '📝' },
    { value: 'paypal', label: t('paymentMethods.paypal'), icon: '🅿️' },
    { value: 'stripe', label: t('paymentMethods.stripe'), icon: '💎' },
    { value: 'other', label: t('paymentMethods.other'), icon: '🔄' },
  ];

  // Calculate payment summary
  const totalPaid = paymentHistory.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || 0),
    0,
  );
  const remainingBalance = parseFloat(invoice?.total_amount || 0) - totalPaid;
  const newAmount = parseFloat(formData.amount || 0);
  const newBalance = remainingBalance - newAmount;

  // Load payment history when modal opens
  useEffect(() => {
    if (isOpen && invoice?.id) {
      loadPaymentHistory();
    }
  }, [isOpen, invoice?.id, loadPaymentHistory]);

  const loadPaymentHistory = async () => {
    try {
      const payments = await InvoiceService.getPaymentHistory(invoice.id);
      setPaymentHistory(payments);
    } catch (error) {
      Logger.error('Error loading payment history:', error);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validatePayment = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return t('paymentModal.errorInvalidAmount');
    }

    if (parseFloat(formData.amount) > remainingBalance) {
      return t('paymentModal.errorAmountExceeds', { balance: remainingBalance.toFixed(2) });
    }

    if (!formData.payment_date) {
      return t('paymentModal.errorDateRequired');
    }

    const paymentDate = new Date(formData.payment_date);
    const today = new Date();
    if (paymentDate > today) {
      return t('paymentModal.errorDateInFuture');
    }

    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await InvoiceService.recordPayment(invoice.id, formData);

      // Update payment history
      await loadPaymentHistory();

      // Notify parent component
      if (onPaymentRecorded) {
        onPaymentRecorded(result);
      }

      // Reset form
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference: '',
        notes: '',
      });

      // Show success message
      alert(t('paymentModal.successMessage'));
    } catch (error) {
      Logger.error('Error recording payment:', error);
      setError(error.message || t('paymentModal.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>{t('paymentModal.title')}</h2>
            <p className='text-sm text-gray-600 mt-1'>
              {t('paymentModal.subtitle', {
                invoiceNumber: invoice?.invoice_number,
                clientName: invoice?.clients?.name,
              })}
            </p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Payment Form */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {t('paymentModal.newPayment')}
              </h3>

              {/* Payment Summary */}
              <div className='bg-gray-50 rounded-lg p-4 mb-6'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>{t('paymentModal.totalInvoice')}</span>
                    <div className='font-semibold'>{formatCurrency(invoice?.total_amount)}</div>
                  </div>
                  <div>
                    <span className='text-gray-600'>{t('paymentModal.alreadyPaid')}</span>
                    <div className='font-semibold text-green-600'>{formatCurrency(totalPaid)}</div>
                  </div>
                  <div>
                    <span className='text-gray-600'>{t('paymentModal.remainingBalance')}</span>
                    <div className='font-semibold text-orange-600'>
                      {formatCurrency(remainingBalance)}
                    </div>
                  </div>
                  {newAmount > 0 && (
                    <div>
                      <span className='text-gray-600'>{t('paymentModal.newBalance')}</span>
                      <div
                        className={`font-semibold ${newBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}
                      >
                        {formatCurrency(newBalance)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 rounded-md p-3 mb-4'>
                  <div className='text-red-800 text-sm'>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Amount */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('paymentModal.paymentAmount')}
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-3 text-gray-500'>€</span>
                    <input
                      type='number'
                      name='amount'
                      value={formData.amount}
                      onChange={handleInputChange}
                      step='0.01'
                      min='0'
                      max={remainingBalance}
                      className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='0.00'
                      required
                    />
                  </div>
                  <div className='mt-1 flex gap-2'>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData(prev => ({ ...prev, amount: remainingBalance.toString() }))
                      }
                      className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200'
                    >
                      {t('paymentModal.fullBalance')}
                    </button>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          amount: (remainingBalance / 2).toString(),
                        }))
                      }
                      className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200'
                    >
                      {t('paymentModal.halfBalance')}
                    </button>
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('paymentModal.paymentDate')}
                  </label>
                  <input
                    type='date'
                    name='payment_date'
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('paymentModal.paymentMethod')}
                  </label>
                  <select
                    name='payment_method'
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.icon} {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('paymentModal.reference')}
                  </label>
                  <input
                    type='text'
                    name='reference'
                    value={formData.reference}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder={t('paymentModal.referencePlaceholder')}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('paymentModal.notes')}
                  </label>
                  <textarea
                    name='notes'
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows='2'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder={t('paymentModal.notesPlaceholder')}
                  ></textarea>
                </div>

                <div className='pt-2'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed'
                  >
                    {loading ? t('paymentModal.recordingPayment') : t('paymentModal.recordPayment')}
                  </button>
                </div>
              </form>
            </div>

            {/* Payment History */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {t('paymentModal.paymentHistory')}
              </h3>
              <div className='border rounded-lg overflow-hidden'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                        {t('paymentModal.date')}
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                        {t('paymentModal.amount')}
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                        {t('paymentModal.method')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan='3' className='px-4 py-4 text-center text-sm text-gray-500'>
                          {t('paymentModal.noPayments')}
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map(payment => (
                        <tr key={payment.id}>
                          <td className='px-4 py-3 text-sm text-gray-700'>
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-900 font-medium'>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-700'>
                            {t(`paymentMethods.${payment.payment_method}`)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className='p-4 bg-gray-50 border-t flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
          >
            {t('paymentModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
