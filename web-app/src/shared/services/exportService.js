// Export Service for managing data exports
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Logger from '@/utils/Logger';

/**
 * Service for handling various data export operations including CSV and PDF generation
 * Provides methods for exporting transactions, financial reports, category analysis, and vendor data
 */
class ExportService {
  /**
   * Formats currency amounts using English locale
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string in EUR
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  }

  /**
   * Formats dates using English locale
   * @param {string|Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US');
  }

  /**
   * Generic CSV export functionality
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Name for the exported file (without extension)
   * @param {Array|null} headers - Optional custom headers array
   * @returns {Object} Export result with success status and message
   */
  exportToCSV(data, filename, headers = null) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // If no headers provided, use keys from first object
      const csvHeaders = headers || Object.keys(data[0]);

      // Create CSV content
      const csvContent = [
        // Header
        csvHeaders.join(','),
        // Data
        ...data.map(row =>
          csvHeaders
            .map(header => {
              let value = row[header] || '';
              // Handle values with commas or quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(','),
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: 'CSV file exported successfully' };
    } catch (error) {
      Logger.error('Error in CSV export:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export transactions to CSV format
   * @param {Array} transactions - Array of transaction objects
   * @param {string} filename - Filename for the export (default: 'transactions')
   * @returns {Object} Export result with success status and message
   */
  exportTransactionsCSV(transactions, filename = 'transactions') {
    const headers = [
      'Date',
      'Type',
      'Description',
      'Category',
      'Amount',
      'Payment Method',
      'Vendor',
      'Tax Deductible',
      'Reference',
      'Notes',
    ];

    const formattedData = transactions.map(transaction => ({
      Date: this.formatDate(transaction.date),
      Type: transaction.type === 'income' ? 'Income' : 'Expense',
      Description: transaction.description || '',
      Category: transaction.category || '',
      Amount: this.formatCurrency(transaction.amount),
      'Payment Method': transaction.payment_method || '',
      Vendor: transaction.vendor || '',
      'Tax Deductible': transaction.tax_deductible ? 'Yes' : 'No',
      Reference: transaction.reference || '',
      Notes: transaction.notes || '',
    }));

    return this.exportToCSV(formattedData, filename, headers);
  }

  /**
   * Export financial report to PDF format
   * @param {Object} reportData - Financial report data object
   * @param {string} filename - Filename for the export (default: 'financial-report')
   * @returns {Object} Export result with success status and message
   */
  exportFinancialReportPDF(reportData, filename = 'financial-report') {
    try {
      const doc = new jsPDF();

      // Document configuration
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Financial Report', margin, yPosition);
      yPosition += 10;

      // Report period
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      const periodText = `Period: ${this.formatDate(reportData.startDate)} - ${this.formatDate(reportData.endDate)}`;
      doc.text(periodText, margin, yPosition);
      yPosition += 15;

      // Financial summary
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Financial Summary', margin, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Income', this.formatCurrency(reportData.totalIncome)],
        ['Total Expenses', this.formatCurrency(reportData.totalExpenses)],
        ['Net Profit', this.formatCurrency(reportData.netProfit)],
        ['Profit Margin', `${reportData.profitMargin?.toFixed(2) || 0}%`],
        ['Tax Deductible Expenses', this.formatCurrency(reportData.taxDeductibleAmount)],
        ['Estimated Tax Savings', this.formatCurrency(reportData.estimatedTaxSavings)],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: margin, right: margin },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Check for new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }

      // Income by category
      if (reportData.incomeByCategory && reportData.incomeByCategory.length > 0) {
        doc.setFontSize(16);
        doc.text('Income by Category', margin, yPosition);
        yPosition += 5;

        const incomeData = reportData.incomeByCategory.map(item => [
          item.category,
          this.formatCurrency(item.amount),
          `${item.percentage?.toFixed(1) || 0}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Amount', 'Percentage']],
          body: incomeData,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113] },
          margin: { left: margin, right: margin },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Check for new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }

      // Expenses by category
      if (reportData.expensesByCategory && reportData.expensesByCategory.length > 0) {
        doc.setFontSize(16);
        doc.text('Expenses by Category', margin, yPosition);
        yPosition += 5;

        const expenseData = reportData.expensesByCategory.map(item => [
          item.category,
          this.formatCurrency(item.amount),
          `${item.percentage?.toFixed(1) || 0}%`,
          item.tax_deductible_amount ? this.formatCurrency(item.tax_deductible_amount) : 'N/A',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Amount', 'Percentage', 'Tax Deductible']],
          body: expenseData,
          theme: 'striped',
          headStyles: { fillColor: [231, 76, 60] },
          margin: { left: margin, right: margin },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Check for new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }

      // Top vendors
      if (reportData.topVendors && reportData.topVendors.length > 0) {
        doc.setFontSize(16);
        doc.text('Top Vendors', margin, yPosition);
        yPosition += 5;

        const vendorData = reportData.topVendors
          .slice(0, 10)
          .map(vendor => [
            vendor.vendor,
            this.formatCurrency(vendor.total_amount),
            vendor.transaction_count.toString(),
          ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Vendor', 'Total Spent', 'Transactions']],
          body: vendorData,
          theme: 'striped',
          headStyles: { fillColor: [155, 89, 182] },
          margin: { left: margin, right: margin },
        });
      }

      // Footer with generation date
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-US')} - Page ${i} of ${pageCount}`,
          margin,
          doc.internal.pageSize.height - 10,
        );
      }

      // Save file
      doc.save(`${filename}.pdf`);

      return { success: true, message: 'PDF report exported successfully' };
    } catch (error) {
      Logger.error('Error in PDF export:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export transactions to PDF format
   * @param {Array} transactions - Array of transaction objects
   * @param {string} filename - Filename for the export (default: 'transactions')
   * @param {Object} options - Export options including date range and totals display
   * @returns {Object} Export result with success status and message
   */
  exportTransactionsPDF(transactions, filename = 'transactions', options = {}) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Transaction List', margin, margin);

      // Period if specified
      if (options.startDate && options.endDate) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const periodText = `Period: ${this.formatDate(options.startDate)} - ${this.formatDate(options.endDate)}`;
        doc.text(periodText, margin, margin + 10);
      }

      // Prepare data for table
      const tableData = transactions.map(transaction => [
        this.formatDate(transaction.date),
        transaction.type === 'income' ? 'Income' : 'Expense',
        transaction.description || '',
        transaction.category || '',
        this.formatCurrency(transaction.amount),
        transaction.vendor || '',
        transaction.tax_deductible ? 'Yes' : 'No',
      ]);

      // Create table
      autoTable(doc, {
        startY: options.startDate ? margin + 20 : margin + 15,
        head: [['Date', 'Type', 'Description', 'Category', 'Amount', 'Vendor', 'Tax Deductible']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
      });

      // Totals if requested
      if (options.showTotals) {
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const netAmount = totalIncome - totalExpenses;

        const totalsData = [
          ['Total Income', this.formatCurrency(totalIncome)],
          ['Total Expenses', this.formatCurrency(totalExpenses)],
          ['Net Amount', this.formatCurrency(netAmount)],
        ];

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['', 'Amount']],
          body: totalsData,
          theme: 'plain',
          headStyles: { fillColor: [236, 240, 241] },
          margin: { left: pageWidth - 120, right: margin },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-US')} - Page ${i} of ${pageCount}`,
          margin,
          doc.internal.pageSize.height - 10,
        );
      }

      doc.save(`${filename}.pdf`);

      return { success: true, message: 'Transaction list PDF exported successfully' };
    } catch (error) {
      Logger.error('Error in transaction PDF export:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export category analysis data to CSV format
   * @param {Array} categoryData - Array of category analysis objects
   * @param {string} filename - Filename for the export (default: 'category-analysis')
   * @returns {Object} Export result with success status and message
   */
  exportCategoryAnalysisCSV(categoryData, filename = 'category-analysis') {
    const headers = [
      'Category',
      'Type',
      'Total Amount',
      'Percentage',
      'Transaction Count',
      'Average Amount',
      'Tax Deductible',
    ];

    const formattedData = categoryData.map(category => ({
      Category: category.category || '',
      Type: category.type === 'income' ? 'Income' : 'Expense',
      'Total Amount': this.formatCurrency(category.amount),
      Percentage: `${category.percentage?.toFixed(2) || 0}%`,
      'Transaction Count': category.count || 0,
      'Average Amount': this.formatCurrency(category.average || 0),
      'Tax Deductible': category.tax_deductible_amount
        ? this.formatCurrency(category.tax_deductible_amount)
        : 'N/A',
    }));

    return this.exportToCSV(formattedData, filename, headers);
  }

  /**
   * Export vendor data to CSV format
   * @param {Array} vendorData - Array of vendor data objects
   * @param {string} filename - Filename for the export (default: 'vendors')
   * @returns {Object} Export result with success status and message
   */
  exportVendorsCSV(vendorData, filename = 'vendors') {
    const headers = [
      'Vendor',
      'Total Amount',
      'Transaction Count',
      'Average Amount',
      'First Transaction',
      'Last Transaction',
    ];

    const formattedData = vendorData.map(vendor => ({
      Vendor: vendor.vendor || '',
      'Total Amount': this.formatCurrency(vendor.total_amount),
      'Transaction Count': vendor.transaction_count || 0,
      'Average Amount': this.formatCurrency(vendor.average_amount || 0),
      'First Transaction': this.formatDate(vendor.first_transaction),
      'Last Transaction': this.formatDate(vendor.last_transaction),
    }));

    return this.exportToCSV(formattedData, filename, headers);
  }
}

// Export a singleton instance of the service
export default new ExportService();
