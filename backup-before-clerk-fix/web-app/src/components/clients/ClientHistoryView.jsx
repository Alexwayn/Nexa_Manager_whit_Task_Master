import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import clientService from '@lib/clientService';
import { notify } from '@lib/uiUtils';

export default function ClientHistoryView() {
  const { clientId } = useParams();
  const { t } = useTranslation('clients');
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (clientId) {
      loadClientHistory();
    }
  }, [clientId, loadClientHistory]);

  const loadClientHistory = async () => {
    setLoading(true);
    try {
      const result = await clientService.getClientHistory(clientId);
      if (result.error) {
        setError(result.error.message);
        notify.error(t('history.loadingError'));
      } else {
        setHistoryData(result.data);
      }
    } catch (err) {
      setError(err.message);
      notify.error(t('history.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
      </div>
    );
  }

  if (error || !historyData) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4'>
            <div className='flex'>
              <XCircleIcon className='h-5 w-5 text-red-400' aria-hidden='true' />
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800 dark:text-red-400'>
                  {t('history.loadingError')}
                </h3>
                <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
                  {error || t('history.loadingErrorMsg')}
                </div>
              </div>
            </div>
          </div>
          <div className='mt-4'>
            <Link
              to='/clients'
              className='inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500'
            >
              <ArrowLeftIcon className='h-4 w-4 mr-1' />
              {t('history.back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, invoices, quotes, appointments, totalRevenue } = historyData;

  const timelineEntries = [
    ...invoices.map(invoice => ({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      title: t('history.invoiceTitle', { number: invoice.invoice_number }),
      date: new Date(invoice.created_at),
      status: invoice.status,
      amount: invoice.total_amount,
      data: invoice,
    })),
    ...quotes.map(quote => ({
      id: `quote-${quote.id}`,
      type: 'quote',
      title: t('history.quoteTitle', { number: quote.quote_number }),
      date: new Date(quote.created_at),
      status: quote.status,
      amount: quote.total_amount,
      data: quote,
    })),
    ...appointments.map(appointment => ({
      id: `appointment-${appointment.id}`,
      type: 'appointment',
      title: appointment.title,
      date: new Date(appointment.start_time),
      status: appointment.status,
      data: appointment,
    })),
  ].sort((a, b) => b.date - a.date);

  const getStatusInfo = (type, status) => {
    const statusConfigs = {
      invoice: {
        draft: { color: 'gray', icon: ClockIcon, label: t('history.status.draft') },
        sent: { color: 'blue', icon: ExclamationCircleIcon, label: t('history.status.sent') },
        paid: { color: 'green', icon: CheckCircleIcon, label: t('history.status.paid') },
        overdue: { color: 'red', icon: XCircleIcon, label: t('history.status.overdue') },
        cancelled: { color: 'red', icon: XCircleIcon, label: t('history.status.cancelled') },
      },
      quote: {
        draft: { color: 'gray', icon: ClockIcon, label: t('history.status.draft') },
        sent: { color: 'blue', icon: ExclamationCircleIcon, label: t('history.status.sent') },
        accepted: { color: 'green', icon: CheckCircleIcon, label: t('history.status.accepted') },
        rejected: { color: 'red', icon: XCircleIcon, label: t('history.status.rejected') },
        expired: {
          color: 'yellow',
          icon: ExclamationCircleIcon,
          label: t('history.status.expired'),
        },
      },
      appointment: {
        scheduled: { color: 'blue', icon: ClockIcon, label: t('history.status.scheduled') },
        completed: { color: 'green', icon: CheckCircleIcon, label: t('history.status.completed') },
        cancelled: { color: 'red', icon: XCircleIcon, label: t('history.status.cancelled') },
      },
    };

    return statusConfigs[type]?.[status] || { color: 'gray', icon: ClockIcon, label: status };
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  };

  const tabs = [
    { id: 'timeline', name: t('history.timeline'), count: timelineEntries.length },
    { id: 'invoices', name: t('history.invoices'), count: invoices.length },
    { id: 'quotes', name: t('history.quotes'), count: quotes.length },
    { id: 'appointments', name: t('history.appointments'), count: appointments.length },
  ];

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='bg-white dark:bg-gray-800 shadow'>
        <div className='px-4 py-6 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                to='/clients'
                className='flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              >
                <ArrowLeftIcon className='h-4 w-4 mr-1' />
                {t('breadcrumb')}
              </Link>
              <div className='text-sm text-gray-400'>/</div>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {client.displayName}
              </h1>
            </div>

            <div className='flex items-center space-x-4'>
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                >
                  <PhoneIcon className='h-4 w-4 mr-2' />
                  {t('history.call')}
                </a>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                >
                  <EnvelopeIcon className='h-4 w-4 mr-2' />
                  {t('history.email')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <ReceiptPercentIcon className='h-6 w-6 text-green-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>
                      {t('history.totalRevenue')}
                    </dt>
                    <dd className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                      {formatCurrency(totalRevenue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <DocumentTextIcon className='h-6 w-6 text-blue-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>
                      {t('history.invoices')}
                    </dt>
                    <dd className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                      {invoices.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <BanknotesIcon className='h-6 w-6 text-purple-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>
                      {t('history.quotes')}
                    </dt>
                    <dd className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                      {quotes.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <CalendarDaysIcon className='h-6 w-6 text-yellow-500' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>
                      {t('history.appointments')}
                    </dt>
                    <dd className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                      {appointments.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='sm:hidden'>
          <label htmlFor='tabs' className='sr-only'>
            Select a tab
          </label>
          <select
            id='tabs'
            name='tabs'
            className='block w-full focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md'
            defaultValue={tabs.find(tab => tab.id === activeTab).name}
            onChange={e => setActiveTab(tabs.find(tab => tab.name === e.target.value).id)}
          >
            {tabs.map(tab => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className='hidden sm:block'>
          <div className='border-b border-gray-200 dark:border-gray-700'>
            <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    tab.id === activeTab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  aria-current={tab.id === activeTab ? 'page' : undefined}
                >
                  {tab.name}
                  {tab.count ? (
                    <span
                      className={`${
                        tab.id === activeTab
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
                      } hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        {activeTab === 'timeline' && (
          <div className='flow-root'>
            <ul className='-mb-8'>
              {timelineEntries.map((entry, entryIdx) => {
                const { color, icon: Icon, label } = getStatusInfo(entry.type, entry.status);
                const isLast = entryIdx === timelineEntries.length - 1;

                return (
                  <li key={entry.id}>
                    <div className='relative pb-8'>
                      {!isLast ? (
                        <span
                          className='absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700'
                          aria-hidden='true'
                        />
                      ) : null}
                      <div className='relative flex items-start space-x-3'>
                        <div>
                          <div
                            className={`h-8 w-8 rounded-full bg-${color}-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800`}
                          >
                            {entry.type === 'invoice' && (
                              <DocumentTextIcon className='h-5 w-5 text-white' />
                            )}
                            {entry.type === 'quote' && (
                              <ReceiptPercentIcon className='h-5 w-5 text-white' />
                            )}
                            {entry.type === 'appointment' && (
                              <CalendarDaysIcon className='h-5 w-5 text-white' />
                            )}
                          </div>
                        </div>
                        <div className='min-w-0 flex-1 pt-1.5'>
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            <Link
                              to={
                                entry.type === 'invoice'
                                  ? `/invoices/${entry.data.id}`
                                  : entry.type === 'quote'
                                    ? `/quotes/${entry.data.id}`
                                    : '#'
                              }
                              className='font-medium text-gray-900 dark:text-gray-100'
                            >
                              {entry.title}
                            </Link>
                          </div>
                          <p className='mt-0.5 text-sm text-gray-500 dark:text-gray-400'>
                            {new Date(entry.date).toLocaleDateString('it-IT', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className='text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}
                          >
                            <Icon className={`-ml-0.5 mr-1.5 h-4 w-4 text-${color}-500`} />
                            {label}
                          </span>
                          {entry.amount && (
                            <div className='mt-1 text-gray-900 dark:text-gray-100 font-medium'>
                              {formatCurrency(entry.amount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* Render other tab content similarly */}
      </div>
    </div>
  );
}
