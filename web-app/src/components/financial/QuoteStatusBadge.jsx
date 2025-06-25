import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * QuoteStatusBadge Component
 * Displays quote status with appropriate colors and styling
 */
const QuoteStatusBadge = ({ status, className = '' }) => {
  const { t } = useTranslation();

  // Status configuration with colors and display text
  const statusConfig = {
    draft: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📝',
      label: t('quotes.status.draft', 'Draft')
    },
    sent: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '📤',
      label: t('quotes.status.sent', 'Sent')
    },
    viewed: {
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '👀',
      label: t('quotes.status.viewed', 'Viewed')
    },
    accepted: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      label: t('quotes.status.accepted', 'Accepted')
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '❌',
      label: t('quotes.status.rejected', 'Rejected')
    },
    expired: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⏰',
      label: t('quotes.status.expired', 'Expired')
    },
    converted: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: '🔄',
      label: t('quotes.status.converted', 'Converted')
    },
    cancelled: {
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: '🚫',
      label: t('quotes.status.cancelled', 'Cancelled')
    },
    revision_requested: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '📝',
      label: t('quotes.status.revision_requested', 'Revision Requested')
    }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}
      title={config.label}
    >
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default QuoteStatusBadge; 