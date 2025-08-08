import { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Logger from '@/utils/Logger';

const QuoteLifecycleManager = ({
  isOpen,
  onClose,
  quote,
  onStatusUpdate,
  onQuoteDuplicate,
  onConvertToInvoice,
}) => {
  const { t } = useTranslation('quotes');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  // Quote status workflow configuration
  const statusWorkflow = {
    bozza: {
      name: t('lifecycle.status.bozza.name'),
      color: 'gray',
      description: t('lifecycle.status.bozza.description'),
      allowedTransitions: ['inviato'],
      actions: ['edit', 'send', 'duplicate', 'delete'],
    },
    inviato: {
      name: t('lifecycle.status.inviato.name'),
      color: 'blue',
      description: t('lifecycle.status.inviato.description'),
      allowedTransitions: ['accettato', 'rifiutato', 'scaduto'],
      actions: ['resend', 'duplicate', 'markAccepted', 'markRejected'],
    },
    accettato: {
      name: t('lifecycle.status.accettato.name'),
      color: 'green',
      description: t('lifecycle.status.accettato.description'),
      allowedTransitions: ['convertito'],
      actions: ['convertToInvoice', 'duplicate'],
    },
    rifiutato: {
      name: t('lifecycle.status.rifiutato.name'),
      color: 'red',
      description: t('lifecycle.status.rifiutato.description'),
      allowedTransitions: ['bozza'],
      actions: ['revise', 'duplicate'],
    },
    scaduto: {
      name: t('lifecycle.status.scaduto.name'),
      color: 'amber',
      description: t('lifecycle.status.scaduto.description'),
      allowedTransitions: ['bozza', 'inviato'],
      actions: ['renew', 'duplicate'],
    },
    convertito: {
      name: t('lifecycle.status.convertito.name'),
      color: 'purple',
      description: t('lifecycle.status.convertito.description'),
      allowedTransitions: [],
      actions: ['duplicate', 'viewInvoice'],
    },
  };

  const currentStatus = statusWorkflow[quote?.status || 'bozza'];

  const getStatusIcon = status => {
    const iconMap = {
      bozza: ClockIcon,
      inviato: PaperAirplaneIcon,
      accettato: CheckCircleIcon,
      rifiutato: XCircleIcon,
      scaduto: ExclamationTriangleIcon,
      convertito: DocumentDuplicateIcon,
    };
    const Icon = iconMap[status] || ClockIcon;
    return <Icon className='h-5 w-5' />;
  };

  const getStatusColor = status => {
    const colorMap = {
      bozza: 'bg-gray-100 text-gray-800 border-gray-200',
      inviato: 'bg-blue-100 text-blue-800 border-blue-200',
      accettato: 'bg-green-100 text-green-800 border-green-200',
      rifiutato: 'bg-red-100 text-red-800 border-red-200',
      scaduto: 'bg-amber-100 text-amber-800 border-amber-200',
      convertito: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTransitionActions = () => {
    const actions = [];
    const status = quote?.status || 'bozza';

    switch (status) {
      case 'bozza':
        actions.push({
          id: 'send',
          label: t('lifecycle.actions.send.label'),
          description: t('lifecycle.actions.send.description'),
          icon: PaperAirplaneIcon,
          color: 'blue',
          newStatus: 'inviato',
        });
        break;

      case 'inviato':
        actions.push(
          {
            id: 'markAccepted',
            label: t('lifecycle.actions.markAccepted.label'),
            description: t('lifecycle.actions.markAccepted.description'),
            icon: CheckCircleIcon,
            color: 'green',
            newStatus: 'accettato',
          },
          {
            id: 'markRejected',
            label: t('lifecycle.actions.markRejected.label'),
            description: t('lifecycle.actions.markRejected.description'),
            icon: XCircleIcon,
            color: 'red',
            newStatus: 'rifiutato',
          },
          {
            id: 'markExpired',
            label: t('lifecycle.actions.markExpired.label'),
            description: t('lifecycle.actions.markExpired.description'),
            icon: ExclamationTriangleIcon,
            color: 'amber',
            newStatus: 'scaduto',
          },
        );
        break;

      case 'accettato':
        actions.push({
          id: 'convertToInvoice',
          label: t('lifecycle.actions.convertToInvoice.label'),
          description: t('lifecycle.actions.convertToInvoice.description'),
          icon: DocumentDuplicateIcon,
          color: 'purple',
          newStatus: 'convertito',
        });
        break;

      case 'rifiutato':
      case 'scaduto':
        actions.push({
          id: 'revise',
          label: t('lifecycle.actions.revise.label'),
          description: t('lifecycle.actions.revise.description'),
          icon: ArrowPathIcon,
          color: 'blue',
          newStatus: 'bozza',
        });
        break;

      default:
        break;
    }

    // Add common actions
    if (status !== 'convertito') {
      actions.push({
        id: 'duplicate',
        label: t('lifecycle.actions.duplicate.label'),
        description: t('lifecycle.actions.duplicate.description'),
        icon: DocumentDuplicateIcon,
        color: 'gray',
        action: 'duplicate',
      });
    }

    return actions;
  };

  const handleActionClick = action => {
    setSelectedAction(action);
    setActionNotes('');

    if (action.action === 'duplicate') {
      handleDuplicateQuote();
    } else if (action.id === 'convertToInvoice') {
      handleConvertToInvoice();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setLoading(true);
    try {
      await onStatusUpdate(quote.id, selectedAction.newStatus, actionNotes);
      setShowConfirmDialog(false);
      onClose();
    } catch (error) {
      Logger.error('Error updating quote status:', error);
      alert(t('lifecycle.errors.statusUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateQuote = async () => {
    setLoading(true);
    try {
      await onQuoteDuplicate(quote.id);
      onClose();
    } catch (error) {
      Logger.error('Error duplicating quote:', error);
      alert(t('lifecycle.errors.duplication'));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = () => {
    onConvertToInvoice(quote);
    onClose();
  };

  const getWorkflowSteps = () => {
    const allStatuses = ['bozza', 'inviato', 'accettato', 'convertito'];
    const currentIndex = allStatuses.indexOf(quote?.status || 'bozza');

    return allStatuses.map((status, index) => ({
      status,
      ...statusWorkflow[status],
      isActive: index <= currentIndex,
      isCurrent: status === quote?.status,
    }));
  };

  if (!quote) return null;

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
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
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all'>
                  <div className='flex items-center justify-between mb-6'>
                    <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-white'>
                      {t('lifecycle.title')}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className='rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500'
                    >
                      <XMarkIcon className='h-6 w-6' />
                    </button>
                  </div>

                  {/* Quote Info */}
                  <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-medium text-gray-900 dark:text-white'>
                          {quote.quote_number || quote.number}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          Cliente: {quote.client_name || quote.client}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          Importo:{' '}
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(quote.total_amount || quote.amount)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}
                        >
                          {getStatusIcon(quote.status)}
                          <span className='ml-1'>{currentStatus.name}</span>
                        </div>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                          {currentStatus.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className='mb-6'>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-3'>
                      {t('lifecycle.workflow')}
                    </h4>
                    <div className='flex items-center space-x-2'>
                      {getWorkflowSteps().map((step, index) => (
                        <Fragment key={step.status}>
                          <div className='flex flex-col items-center'>
                            <div
                              className={`
                              flex items-center justify-center w-10 h-10 rounded-full border-2 
                              ${
                                step.isCurrent
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : step.isActive
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-300 bg-gray-100 text-gray-400'
                              }
                            `}
                            >
                              {getStatusIcon(step.status)}
                            </div>
                            <span className='text-xs font-medium text-gray-600 dark:text-gray-400 mt-1'>
                              {step.name}
                            </span>
                          </div>
                          {index < getWorkflowSteps().length - 1 && (
                            <div
                              className={`h-0.5 flex-1 ${
                                step.isActive ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Available Actions */}
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-3'>
                      {t('lifecycle.nextActions')}
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {getTransitionActions().map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          disabled={loading}
                          className={`
                            p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md
                            ${
                              action.color === 'blue'
                                ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                                : action.color === 'green'
                                  ? 'border-green-200 hover:border-green-300 hover:bg-green-50'
                                  : action.color === 'red'
                                    ? 'border-red-200 hover:border-red-300 hover:bg-red-50'
                                    : action.color === 'amber'
                                      ? 'border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                                      : action.color === 'purple'
                                        ? 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          <div className='flex items-start'>
                            <action.icon
                              className={`
                              h-5 w-5 mt-0.5 mr-3
                              ${
                                action.color === 'blue'
                                  ? 'text-blue-600'
                                  : action.color === 'green'
                                    ? 'text-green-600'
                                    : action.color === 'red'
                                      ? 'text-red-600'
                                      : action.color === 'amber'
                                        ? 'text-amber-600'
                                        : action.color === 'purple'
                                          ? 'text-purple-600'
                                          : 'text-gray-600'
                              }
                            `}
                            />
                            <div>
                              <div className='font-medium text-gray-900 dark:text-white'>
                                {action.label}
                              </div>
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                {action.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700'>
                    <button
                      onClick={onClose}
                      className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    >
                      {t('lifecycle.closeButton')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Confirmation Dialog */}
      {selectedAction && (
        <Transition appear show={showConfirmDialog} as={Fragment}>
          <Dialog as='div' className='relative z-50' onClose={() => setShowConfirmDialog(false)}>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <div className='fixed inset-0 bg-black bg-opacity-25' />
            </Transition.Child>

            <div className='fixed inset-0 overflow-y-auto'>
              <div className='flex min-h-full items-center justify-center p-4 text-center'>
                <Transition.Child
                  as={Fragment}
                  enter='ease-out duration-300'
                  enterFrom='opacity-0 scale-95'
                  enterTo='opacity-100 scale-100'
                  leave='ease-in duration-200'
                  leaveFrom='opacity-100 scale-100'
                  leaveTo='opacity-0 scale-95'
                >
                  <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all'>
                    <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
                      {t('lifecycle.confirmAction.title')}
                    </Dialog.Title>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('lifecycle.confirmAction.message', { status: selectedAction.newStatus })}
                      </p>
                    </div>

                    <div className='mt-4'>
                      <label className='block text-sm font-medium text-gray-700'>
                        {t('lifecycle.confirmAction.notesLabel')}
                      </label>
                      <textarea
                        rows={3}
                        className='w-full mt-1 border border-gray-300 rounded-md p-2'
                        value={actionNotes}
                        onChange={e => setActionNotes(e.target.value)}
                        placeholder={t('lifecycle.confirmAction.notesPlaceholder')}
                      />
                    </div>

                    <div className='mt-6 flex justify-end space-x-3'>
                      <button
                        type='button'
                        className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                        onClick={() => setShowConfirmDialog(false)}
                      >
                        {t('lifecycle.confirmAction.cancelButton')}
                      </button>
                      <button
                        type='button'
                        className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50'
                        onClick={handleConfirmAction}
                        disabled={loading}
                      >
                        {loading ? '...' : t('lifecycle.confirmAction.confirmButton')}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default QuoteLifecycleManager;
