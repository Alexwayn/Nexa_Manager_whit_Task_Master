import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  EyeIcon, 
  PrinterIcon, 
  DocumentArrowDownIcon,
  PencilIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ReportPreview = ({ 
  report, 
  onClose, 
  onEdit, 
  onExport,
  className = '' 
}) => {
  const { t } = useTranslation('reports');
  const [previewMode, setPreviewMode] = useState('live'); // 'live', 'print'
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef(null);

  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (onExport) {
      onExport(report, exportFormat);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatValue = (value, type = 'currency') => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value || 0);
    }
    return value;
  };

  const renderReportContent = () => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {report.title || 'Financial Report'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{t('metadata.generated')}: {format(new Date(), 'PPP')}</span>
            <span>{t('metadata.period')}: {report.dateRange?.start && report.dateRange?.end ? `${report.dateRange.start} - ${report.dateRange.end}` : '-'}</span>
            <span>{t('metadata.type')}: {report.type || 'Custom'}</span>
          </div>
        </div>

        {/* Report Summary */}
        {report.summary && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('reportContent.executiveSummary')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {report.summary}
            </p>
          </div>
        )}

        {/* Key Metrics */}
        {report.metrics && report.metrics.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('reportContent.keyMetrics')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {report.metrics.map((metric, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatValue(metric.value, metric.type)}
                  </div>
                  {metric.change && (
                    <div className={`text-sm ${
                      metric.change > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {report.charts && report.charts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('preview.visualAnalysis')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {report.charts.map((chart, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    {chart.title}
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
                    {chart.component || (
                      <span className="text-gray-500 dark:text-gray-400">
                        Chart: {chart.type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Tables */}
        {report.tables && report.tables.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('preview.detailedData')}
            </h2>
            {report.tables.map((table, tableIndex) => (
              <div key={tableIndex} className="mb-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {table.title}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {table.headers?.map((header, index) => (
                          <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {table.rows?.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {typeof cell === 'number' ? formatValue(cell) : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('preview.generatedBy')} - {format(new Date(), 'PPpp')}</p>
          {report.confidential && (
            <p className="mt-1 text-red-600 dark:text-red-400 font-medium">
              {t('preview.confidential')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${
      isFullscreen ? 'bg-white dark:bg-gray-900' : 'bg-black/50'
    } ${className}`}>
      <div className={`flex flex-col h-full ${
        isFullscreen ? '' : 'max-w-6xl mx-auto my-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl'
      }`}>
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('preview.title')}
            </h2>
            
            {/* Preview Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('live')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  previewMode === 'live'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <EyeIcon className="w-4 h-4 inline mr-1" />
                {t('preview.modes.live')}
              </button>
              <button
                onClick={() => setPreviewMode('print')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  previewMode === 'print'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <PrinterIcon className="w-4 h-4 inline mr-1" />
                {t('preview.modes.print')}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Export Format Selector */}
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={t('preview.actions.exportReport')}
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={t('preview.actions.printReport')}
            >
              <PrinterIcon className="w-5 h-5" />
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(report)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={t('preview.actions.editReport')}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={isFullscreen ? t('preview.actions.exitFullscreen') : t('preview.actions.enterFullscreen')}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={t('preview.actions.closePreview')}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          <div 
            ref={previewRef}
            className={`${
              previewMode === 'print' 
                ? 'max-w-4xl mx-auto bg-white text-black p-8 shadow-lg print:shadow-none print:max-w-none print:mx-0' 
                : 'p-6'
            }`}
            style={previewMode === 'print' ? {
              minHeight: '11in',
              width: previewMode === 'print' ? '8.5in' : 'auto'
            } : {}}
          >
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
