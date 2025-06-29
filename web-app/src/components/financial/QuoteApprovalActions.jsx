import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import { QuoteApprovalService } from '@lib/quoteApprovalService';
import Logger from '@utils/Logger';

/**
 * QuoteApprovalActions Component
 * Provides action buttons for quote status transitions
 */
const QuoteApprovalActions = ({ quote, onStatusUpdate, className = '' }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  // Get available transitions for current status
  const availableTransitions = QuoteApprovalService.getAvailableTransitions(quote.status);

  // Action configuration with display properties
  const actionConfig = {
    sent: {
      label: t('quotes.actions.send', 'Send Quote'),
      icon: '📤',
      variant: 'primary',
      confirmMessage: t('quotes.confirm.send', 'Are you sure you want to send this quote to the client?')
    },
    accepted: {
      label: t('quotes.actions.accept', 'Mark as Accepted'),
      icon: '✅',
      variant: 'success',
      confirmMessage: t('quotes.confirm.accept', 'Mark this quote as accepted?')
    },
    rejected: {
      label: t('quotes.actions.reject', 'Mark as Rejected'),
      icon: '❌',
      variant: 'danger',
      confirmMessage: t('quotes.confirm.reject', 'Mark this quote as rejected?')
    },
    expired: {
      label: t('quotes.actions.expire', 'Mark as Expired'),
      icon: '⏰',
      variant: 'warning',
      confirmMessage: t('quotes.confirm.expire', 'Mark this quote as expired?')
    },
    converted: {
      label: t('quotes.actions.convert', 'Convert to Invoice'),
      icon: '🔄',
      variant: 'primary',
      confirmMessage: t('quotes.confirm.convert', 'Convert this quote to an invoice?')
    },
    cancelled: {
      label: t('quotes.actions.cancel', 'Cancel Quote'),
      icon: '🚫',
      variant: 'danger',
      confirmMessage: t('quotes.confirm.cancel', 'Are you sure you want to cancel this quote?')
    },
    revision_requested: {
      label: t('quotes.actions.request_revision', 'Request Revision'),
      icon: '📝',
      variant: 'warning',
      confirmMessage: t('quotes.confirm.request_revision', 'Request revision for this quote?')
    },
    viewed: {
      label: t('quotes.actions.mark_viewed', 'Mark as Viewed'),
      icon: '👀',
      variant: 'secondary',
      confirmMessage: t('quotes.confirm.mark_viewed', 'Mark this quote as viewed by client?')
    }
  };

  // Button variant styles
  const buttonVariants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600'
  };

  const handleStatusChange = async (newStatus) => {
    if (!user?.id) {
      Logger.error('User not authenticated');
      return;
    }

    const action = actionConfig[newStatus];
    if (action?.confirmMessage && !window.confirm(action.confirmMessage)) {
      return;
    }

    setIsLoading(true);
    setSelectedAction(newStatus);

    try {
      const updatedQuote = await QuoteApprovalService.updateQuoteStatus(
        quote.id,
        user.id,
        newStatus,
        {
          notes: `Status changed to ${newStatus} via UI`,
          automated: false
        }
      );

      Logger.info('Quote status updated successfully:', { quoteId: quote.id, newStatus });
      
      if (onStatusUpdate) {
        onStatusUpdate(updatedQuote);
      }
    } catch (error) {
      Logger.error('Failed to update quote status:', error);
      alert(t('quotes.errors.status_update_failed', 'Failed to update quote status. Please try again.'));
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

  if (availableTransitions.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        {t('quotes.no_actions_available', 'No actions available for this status')}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">
        {t('quotes.available_actions', 'Available Actions')}:
      </div>
      
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((transition) => {
          const action = actionConfig[transition];
          if (!action) return null;

          const isProcessing = isLoading && selectedAction === transition;
          const buttonStyle = buttonVariants[action.variant] || buttonVariants.secondary;

          return (
            <button
              key={transition}
              onClick={() => handleStatusChange(transition)}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border 
                transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${buttonStyle}
              `}
              title={action.label}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('common.processing', 'Processing...')}
                </>
              ) : (
                <>
                  <span>{action.icon}</span>
                  {action.label}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Special handling for draft status */}
      {quote.status === 'draft' && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>{t('quotes.draft_info.title', 'Draft Quote')}:</strong>{' '}
            {t('quotes.draft_info.description', 'This quote is in draft mode. Send it to the client to begin the approval process.')}
          </div>
        </div>
      )}

      {/* Expiry warning for sent quotes */}
      {quote.status === 'sent' && quote.acceptance_deadline && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-800">
            <strong>{t('quotes.expiry_warning.title', 'Expiry Date')}:</strong>{' '}
            {t('quotes.expiry_warning.description', 'This quote will expire on')} {new Date(quote.acceptance_deadline).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteApprovalActions; 