import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentArrowDownIcon, TableCellsIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import ExportService from '@lib/exportService';

const ExportButtons = ({
  data,
  type = 'transactions',
  filename,
  period = null,
  showReportOptions = false,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Gestisce l'esportazione CSV
  const handleCSVExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      let result;
      const baseFilename = filename || `${type}-${new Date().toISOString().split('T')[0]}`;

      switch (type) {
        case 'transactions':
          result = ExportService.exportTransactionsCSV(data, baseFilename);
          break;
        case 'categories':
          result = ExportService.exportCategoryAnalysisCSV(data, `${baseFilename}-categorie`);
          break;
        case 'vendors':
          result = ExportService.exportVendorsCSV(data, `${baseFilename}-fornitori`);
          break;
        default:
          result = ExportService.exportToCSV(data, baseFilename);
      }

      if (result.success) {
        setExportStatus({ type: 'success', message: result.message });
      } else {
        setExportStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Gestisce l'esportazione PDF
  const handlePDFExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      let result;
      const baseFilename = filename || `${type}-${new Date().toISOString().split('T')[0]}`;

      if (type === 'transactions') {
        const options = {
          showTotals: true,
          ...(period && { startDate: period.startDate, endDate: period.endDate }),
        };
        result = ExportService.exportTransactionsPDF(data, baseFilename, options);
      } else if (type === 'report' && showReportOptions) {
        // Per i report finanziari completi
        result = ExportService.exportFinancialReportPDF(data, `report-${baseFilename}`);
      } else {
        // Fallback per altri tipi
        const options = {
          showTotals: true,
          ...(period && { startDate: period.startDate, endDate: period.endDate }),
        };
        result = ExportService.exportTransactionsPDF(data, baseFilename, options);
      }

      if (result.success) {
        setExportStatus({ type: 'success', message: result.message });
      } else {
        setExportStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Verifica se ci sono dati da esportare
  const hasData = data && data.length > 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pulsante CSV */}
      <button
        onClick={handleCSVExport}
        disabled={!hasData || isExporting}
        className={`
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          transition-colors duration-200
          ${
            hasData && !isExporting
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
        title={t('export.tooltipCsv')}
      >
        <TableCellsIcon className='w-4 h-4' />
        {isExporting ? t('export.exporting') : 'CSV'}
      </button>

      {/* Pulsante PDF */}
      <button
        onClick={handlePDFExport}
        disabled={!hasData || isExporting}
        className={`
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          transition-colors duration-200
          ${
            hasData && !isExporting
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
        title={t('export.tooltipPdf')}
      >
        <DocumentArrowDownIcon className='w-4 h-4' />
        {isExporting ? t('export.exporting') : 'PDF'}
      </button>

      {/* Pulsante Report Completo (solo se abilitato) */}
      {showReportOptions && (
        <button
          onClick={() => handlePDFExport()}
          disabled={!hasData || isExporting}
          className={`
            inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-200
            ${
              hasData && !isExporting
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          title={t('export.tooltipReport')}
        >
          <ChartBarIcon className='w-4 h-4' />
          {isExporting ? t('export.exporting') : t('export.report')}
        </button>
      )}

      {/* Messaggio di stato */}
      {exportStatus && (
        <div
          className={`
          px-3 py-1 rounded-lg text-sm font-medium
          ${
            exportStatus.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }
        `}
        >
          {exportStatus.message}
        </div>
      )}

      {/* Messaggio informativo se non ci sono dati */}
      {!hasData && (
        <span className='text-sm text-gray-500 dark:text-gray-400'>{t('export.noData')}</span>
      )}
    </div>
  );
};

export default ExportButtons;
