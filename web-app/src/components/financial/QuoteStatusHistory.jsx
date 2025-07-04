import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserBypass as useUser } from '@hooks/useClerkBypass';
import { QuoteApprovalService } from '@lib/quoteApprovalService';
import QuoteStatusBadge from './QuoteStatusBadge';
import Logger from '@utils/Logger';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  Ban, 
  RotateCcw, 
  FileText 
} from 'lucide-react';

/**
 * QuoteStatusHistory Component
 * Displays the status change history for a quote
 */
const QuoteStatusHistory = ({ quoteId, className = '' }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatusHistory();
  }, [quoteId, user?.id]);

  const loadStatusHistory = async () => {
    if (!user?.id || !quoteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const historyData = await QuoteApprovalService.getQuoteStatusHistory(quoteId, user.id);
      setHistory(historyData || []);
    } catch (error) {
      Logger.error('Failed to load quote status history:', error);
      setError(t('quotes.errors.history_load_failed', 'Failed to load status history'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getChangeIcon = (oldStatus, newStatus) => {
    if (!oldStatus) return Plus; // New quote
    if (newStatus === 'accepted') return CheckCircle;
    if (newStatus === 'rejected') return XCircle;
    if (newStatus === 'expired') return Clock;
    if (newStatus === 'sent') return Send;
    if (newStatus === 'cancelled') return Ban;
    if (newStatus === 'converted') return RotateCcw;
    return FileText;
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">
          {t('quotes.status_history.title', 'Status History')}
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">
            {t('common.loading', 'Loading...')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">
          {t('quotes.status_history.title', 'Status History')}
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">{error}</div>
          <button
            onClick={loadStatusHistory}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">
          {t('quotes.status_history.title', 'Status History')}
        </h3>
        <div className="text-sm text-gray-500 py-4">
          {t('quotes.status_history.no_history', 'No status changes recorded yet.')}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">
        {t('quotes.status_history.title', 'Status History')}
      </h3>

      <div className="space-y-3">
        {history.map((entry, index) => (
          <div
            key={entry.id || index}
            className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {React.createElement(getChangeIcon(entry.old_status, entry.new_status), {
                className: "w-5 h-5 text-gray-600"
              })}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Status badges */}
                {entry.old_status && (
                  <>
                    <QuoteStatusBadge status={entry.old_status} />
                    <span className="text-gray-400">→</span>
                  </>
                )}
                <QuoteStatusBadge status={entry.new_status} />

                {/* Automated flag */}
                {entry.automated && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {t('quotes.status_history.automated', 'Auto')}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {entry.old_status 
                      ? t('quotes.status_history.changed', 'Status changed')
                      : t('quotes.status_history.created', 'Quote created')
                    }
                  </span>
                  <span>•</span>
                  <span>{formatDate(entry.created_at)}</span>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <div className="mt-1 text-xs text-gray-500 italic">
                    "{entry.notes}"
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={loadStatusHistory}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          {t('common.refresh', 'Refresh')}
        </button>
      </div>
    </div>
  );
};

export default QuoteStatusHistory;