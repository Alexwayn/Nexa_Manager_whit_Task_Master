import React from 'react';
import { X, Calendar, User, DollarSign, FileText, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ViewInvoiceModal = ({ isOpen, onClose, invoice }) => {
  const { t } = useTranslation();

  if (!isOpen || !invoice) return null;

  const getStatusBadge = status => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: t('status.paid', 'Paid') },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: t('status.pending', 'Pending'),
      },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: t('status.overdue', 'Overdue') },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('status.draft', 'Draft') },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = amount => {
    if (!amount) return '€0.00';
    return `€{parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <FileText className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                {t('invoice.view.title', 'Invoice Details')}
              </h2>
              <p className='text-gray-500'>
                {t('invoice.view.subtitle', 'View invoice information')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
            <X className='w-6 h-6 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-8'>
          {/* Invoice Header Info */}
          <div className='bg-gray-50 rounded-lg p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  {t('invoice.details.title', 'Invoice Information')}
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <FileText className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500'>
                        {t('invoice.number', 'Invoice Number')}
                      </p>
                      <p className='font-semibold text-gray-900'>
                        #{invoice.invoice_number || invoice.id}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <DollarSign className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500'>{t('invoice.amount', 'Total Amount')}</p>
                      <p className='font-semibold text-gray-900 text-lg'>
                        {formatCurrency(invoice.total_amount || invoice.amount)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <Clock className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500'>{t('invoice.status', 'Status')}</p>
                      <div className='mt-1'>{getStatusBadge(invoice.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  {t('invoice.client.title', 'Client Information')}
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <User className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='text-sm text-gray-500'>
                        {t('invoice.client.name', 'Client Name')}
                      </p>
                      <p className='font-semibold text-gray-900'>{invoice.client_name || 'N/A'}</p>
                    </div>
                  </div>
                  {invoice.client_email && (
                    <div className='flex items-center space-x-3'>
                      <div className='w-5 h-5' />
                      <div>
                        <p className='text-sm text-gray-500'>
                          {t('invoice.client.email', 'Email')}
                        </p>
                        <p className='text-gray-900'>{invoice.client_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white border border-gray-200 rounded-lg p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <Calendar className='w-5 h-5 text-blue-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  {t('invoice.dates.issue', 'Issue Date')}
                </h3>
              </div>
              <p className='text-2xl font-bold text-gray-900'>{formatDate(invoice.issue_date)}</p>
            </div>

            <div className='bg-white border border-gray-200 rounded-lg p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <Calendar className='w-5 h-5 text-red-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  {t('invoice.dates.due', 'Due Date')}
                </h3>
              </div>
              <p className='text-2xl font-bold text-gray-900'>{formatDate(invoice.due_date)}</p>
            </div>
          </div>

          {/* Description/Notes Section */}
          {invoice.description && (
            <div className='bg-white border border-gray-200 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                {t('invoice.description', 'Description')}
              </h3>
              <p className='text-gray-700 leading-relaxed'>{invoice.description}</p>
            </div>
          )}

          {/* Items Section (if available) */}
          {invoice.items && invoice.items.length > 0 && (
            <div className='bg-white border border-gray-200 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                {t('invoice.items.title', 'Invoice Items')}
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>
                        {t('invoice.items.description', 'Description')}
                      </th>
                      <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                        {t('invoice.items.quantity', 'Qty')}
                      </th>
                      <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                        {t('invoice.items.price', 'Price')}
                      </th>
                      <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                        {t('invoice.items.total', 'Total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className='border-b border-gray-100'>
                        <td className='py-3 px-4 text-gray-900'>{item.description}</td>
                        <td className='py-3 px-4 text-right text-gray-900'>{item.quantity}</td>
                        <td className='py-3 px-4 text-right text-gray-900'>
                          {formatCurrency(item.price)}
                        </td>
                        <td className='py-3 px-4 text-right font-semibold text-gray-900'>
                          {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50'>
          <button
            onClick={onClose}
            className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium'
          >
            {t('actions.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoiceModal;
