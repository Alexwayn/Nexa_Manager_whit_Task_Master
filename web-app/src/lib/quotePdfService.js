/**
 * Quote PDF Service - Professional Quote PDF Generation
 *
 * Features:
 * - Professional quote templates with customizable branding
 * - Multiple output formats (download, preview, blob, base64)
 * - Comprehensive quote information display
 * - Client details and itemized billing
 * - Tax calculations and totals
 * - Status indicators and validation dates
 * - Customizable company information and logos
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Logger from '@utils/Logger';

/**
 * Service class for generating professional quote PDFs
 */
export class QuotePdfService {
  /**
   * Initialize the QuotePdfService with default styling configuration
   */
  constructor() {
    this.colors = {
      primary: '#2563eb', // Blue
      secondary: '#64748b', // Slate
      accent: '#059669', // Green
      text: '#1f2937', // Gray-800
      lightGray: '#f8fafc', // Gray-50
      border: '#e2e8f0', // Gray-200
    };

    this.fonts = {
      header: 'helvetica',
      body: 'helvetica',
    };
  }

  /**
   * Generate PDF document for a quote
   * @param {Object} quote - Quote data object
   * @param {Object} options - PDF generation options
   * @param {string} options.logo - Company logo image data
   * @param {string} options.companyName - Company name
   * @param {string} options.companyAddress - Company address
   * @param {string} options.companyPhone - Company phone number
   * @param {string} options.companyEmail - Company email
   * @param {string} options.companyVat - Company VAT number
   * @param {string} options.footerText - Custom footer text
   * @returns {Promise<jsPDF>} Generated PDF document
   */
  async generateQuotePdf(quote, options = {}) {
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set document properties
      doc.setProperties({
        title: `Quote ${quote.quote_number}`,
        author: 'Nexa Manager',
        creator: 'Nexa Manager',
        subject: `Quote for ${quote.clients?.full_name || 'Client'}`,
        keywords: 'quote, business, nexa',
      });

      // Add content to PDF
      await this.addHeader(doc, quote, options);
      this.addQuoteInfo(doc, quote);
      this.addClientInfo(doc, quote);
      this.addItemsTable(doc, quote);
      this.addTotals(doc, quote);
      this.addFooter(doc, quote, options);

      return doc;
    } catch (error) {
      Logger.error('Error generating quote PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Add header section with company logo and information
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} options - Header options including company details and logo
   * @returns {Promise<void>}
   */
  async addHeader(doc, quote, options) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add company logo if provided
    if (options.logo) {
      try {
        doc.addImage(options.logo, 'PNG', 20, 20, 40, 20);
      } catch (error) {
        Logger.warn('Could not add logo to PDF:', error);
      }
    }

    // Company name and info
    doc.setFont(this.fonts.header, 'bold');
    doc.setFontSize(24);
    doc.setTextColor(this.colors.primary);
    doc.text(options.companyName || 'Your Company', pageWidth - 20, 30, { align: 'right' });

    // Company details
    doc.setFont(this.fonts.body, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(this.colors.text);

    const companyDetails = [
      options.companyAddress || 'Company Address',
      options.companyPhone || 'Phone: +1234567890',
      options.companyEmail || 'email@company.com',
      options.companyVat || 'VAT: IT12345678901',
    ];

    let yPos = 40;
    companyDetails.forEach((detail) => {
      if (detail) {
        doc.text(detail, pageWidth - 20, yPos, { align: 'right' });
        yPos += 5;
      }
    });

    // Add horizontal line
    doc.setDrawColor(this.colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);
  }

  /**
   * Add quote information section with number, dates, and status
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @returns {void}
   */
  addQuoteInfo(doc, quote) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Quote title
    doc.setFont(this.fonts.header, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(this.colors.primary);
    doc.text('QUOTE', 20, 80);

    // Quote details in two columns
    doc.setFont(this.fonts.body, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(this.colors.text);

    // Left column
    doc.text('Quote Number:', 20, 95);
    doc.text('Issue Date:', 20, 105);
    doc.text('Valid Until:', 20, 115);
    doc.text('Status:', 20, 125);

    // Right column - values
    doc.setFont(this.fonts.body, 'normal');
    doc.text(quote.quote_number || '', 75, 95);
    doc.text(this.formatDate(quote.issue_date), 75, 105);
    doc.text(this.formatDate(quote.due_date), 75, 115);
    doc.text(this.getStatusText(quote.status), 75, 125);

    // Status badge background
    const statusColor = this.getStatusColor(quote.status);
    doc.setFillColor(statusColor.bg);
    doc.roundedRect(73, 120, 30, 6, 2, 2, 'F');
    doc.setTextColor(statusColor.text);
    doc.text(this.getStatusText(quote.status), 75, 125);
    doc.setTextColor(this.colors.text);
  }

  /**
   * Add client information section with contact details
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object containing client information
   * @returns {void}
   */
  addClientInfo(doc, quote) {
    if (!quote.clients) return;

    // Client section title
    doc.setFont(this.fonts.header, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(this.colors.primary);
    doc.text('CLIENT', 20, 145);

    // Client details
    doc.setFont(this.fonts.body, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(this.colors.text);

    const clientDetails = [
      quote.clients.full_name,
      quote.clients.email,
      quote.clients.phone,
      quote.clients.address,
      `${quote.clients.city || ''} ${quote.clients.postal_code || ''}`.trim(),
      quote.clients.province,
      quote.clients.vat_number ? `VAT: ${quote.clients.vat_number}` : null,
      quote.clients.fiscal_code ? `Tax Code: ${quote.clients.fiscal_code}` : null,
    ].filter(Boolean);

    let yPos = 155;
    clientDetails.forEach((detail) => {
      if (detail && yPos < 200) {
        doc.text(detail, 20, yPos);
        yPos += 6;
      }
    });
  }

  /**
   * Add itemized table with quote items, quantities, prices, and totals
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object containing quote items
   * @returns {void}
   */
  addItemsTable(doc, quote) {
    const items = quote.quote_items || [];

    if (items.length === 0) {
      doc.setFont(this.fonts.body, 'italic');
      doc.setFontSize(10);
      doc.setTextColor(this.colors.secondary);
      doc.text('No items present', 20, 220);
      return;
    }

    // Prepare table data
    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.description || '',
      this.formatNumber(item.quantity || 0),
      this.formatCurrency(item.unit_price || 0),
      item.tax_rate ? `${item.tax_rate}%` : '0%',
      this.formatCurrency(item.amount || 0),
    ]);

    // Table configuration
    const tableConfig = {
      startY: 210,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'VAT', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        textColor: this.colors.text,
        lineColor: this.colors.border,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: this.colors.primary,
        textColor: '#ffffff',
        fontStyle: 'bold',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // #
        1: { cellWidth: 80 }, // Description
        2: { cellWidth: 20, halign: 'center' }, // Quantity
        3: { cellWidth: 30, halign: 'right' }, // Unit Price
        4: { cellWidth: 20, halign: 'center' }, // Tax
        5: { cellWidth: 30, halign: 'right' }, // Total
      },
      alternateRowStyles: {
        fillColor: this.colors.lightGray,
      },
      margin: { left: 20, right: 20 },
    };

    doc.autoTable(tableConfig);
  }

  /**
   * Add totals section with subtotal, tax, and grand total
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object containing financial totals
   * @returns {void}
   */
  addTotals(doc, quote) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Get the final Y position from the table
    const finalY = doc.lastAutoTable?.finalY || 250;
    const startY = finalY + 20;

    // Totals box
    const boxWidth = 70;
    const boxHeight = 35;
    const boxX = pageWidth - boxWidth - 20;

    // Draw totals box
    doc.setFillColor(this.colors.lightGray);
    doc.setDrawColor(this.colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, startY, boxWidth, boxHeight, 2, 2, 'FD');

    // Totals content
    doc.setFont(this.fonts.body, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(this.colors.text);

    const subtotal = quote.subtotal || 0;
    const taxAmount = quote.tax_amount || 0;
    const total = quote.total_amount || 0;

    // Subtotal
    doc.text('Subtotal:', boxX + 5, startY + 10);
    doc.text(this.formatCurrency(subtotal), boxX + boxWidth - 5, startY + 10, { align: 'right' });

    // Tax
    doc.text('VAT:', boxX + 5, startY + 18);
    doc.text(this.formatCurrency(taxAmount), boxX + boxWidth - 5, startY + 18, { align: 'right' });

    // Total
    doc.setFont(this.fonts.body, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(this.colors.primary);
    doc.text('TOTAL:', boxX + 5, startY + 28);
    doc.text(this.formatCurrency(total), boxX + boxWidth - 5, startY + 28, { align: 'right' });
  }

  /**
   * Add footer section with notes, terms, and page information
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object containing notes
   * @param {Object} options - Footer options including custom footer text
   * @returns {void}
   */
  addFooter(doc, quote, options) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Notes section if present
    if (quote.notes) {
      doc.setFont(this.fonts.header, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(this.colors.primary);
      doc.text('NOTES:', 20, pageHeight - 60);

      doc.setFont(this.fonts.body, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(this.colors.text);

      const noteLines = doc.splitTextToSize(quote.notes, pageWidth - 40);
      doc.text(noteLines, 20, pageHeight - 50);
    }

    // Footer line
    doc.setDrawColor(this.colors.border);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);

    // Footer text
    doc.setFont(this.fonts.body, 'italic');
    doc.setFontSize(8);
    doc.setTextColor(this.colors.secondary);

    const footerText =
      options.footerText || 'This quote is valid for 30 days from the date of issue.';
    doc.text(footerText, 20, pageHeight - 20);

    // Page number
    const pageCount = doc.internal.getNumberOfPages();
    doc.text(`Page 1 of ${pageCount}`, pageWidth - 20, pageHeight - 20, { align: 'right' });
  }

  /**
   * Save PDF document with custom or default filename
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object for filename generation
   * @param {string|null} filename - Custom filename (optional)
   * @returns {void}
   */
  savePdf(doc, quote, filename = null) {
    const defaultFilename = `Quote_${quote.quote_number}_${this.formatDateForFilename(quote.issue_date)}.pdf`;
    doc.save(filename || defaultFilename);
  }

  /**
   * Preview PDF document in new browser window
   * @param {jsPDF} doc - PDF document instance
   * @returns {void}
   */
  previewPdf(doc) {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  }

  /**
   * Get PDF document as base64 data URI string
   * @param {jsPDF} doc - PDF document instance
   * @returns {string} Base64 data URI string
   */
  getPdfBase64(doc) {
    return doc.output('datauristring');
  }

  /**
   * Get PDF document as blob object
   * @param {jsPDF} doc - PDF document instance
   * @returns {Blob} PDF blob object
   */
  getPdfBlob(doc) {
    return doc.output('blob');
  }

  // Utility methods
  /**
   * Format date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  }

  /**
   * Format date string for filename usage
   * @param {string} dateString - ISO date string
   * @returns {string} Date string formatted as YYYY-MM-DD
   */
  formatDateForFilename(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  /**
   * Format currency amount with Euro symbol
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '€ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format number for display
   * @param {number} number - Number to format
   * @returns {string} Formatted number string
   */
  formatNumber(number) {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  }

  /**
   * Get human-readable status text
   * @param {string} status - Status code
   * @returns {string} Human-readable status text
   */
  getStatusText(status) {
    const statusMap = {
      draft: 'Draft',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
      converted: 'Converted',
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color configuration for visual indicators
   * @param {string} status - Status code
   * @returns {Object} Color configuration with bg and text properties
   */
  getStatusColor(status) {
    const colorMap = {
      draft: { bg: '#f3f4f6', text: '#374151' },
      sent: { bg: '#dbeafe', text: '#1d4ed8' },
      accepted: { bg: '#d1fae5', text: '#065f46' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      expired: { bg: '#fef3c7', text: '#d97706' },
      converted: { bg: '#e0e7ff', text: '#5b21b6' },
    };
    return colorMap[status] || { bg: '#f3f4f6', text: '#374151' };
  }

  /**
   * Static method to generate and download quote PDF
   * @param {Object} quote - Quote data object
   * @param {Object} options - PDF generation options
   * @returns {Promise<jsPDF>} Generated PDF document
   */
  static async generateAndDownload(quote, options = {}) {
    const service = new QuotePdfService();
    const doc = await service.generateQuotePdf(quote, options);
    service.savePdf(doc, quote);
    return doc;
  }

  /**
   * Static method to generate and preview quote PDF
   * @param {Object} quote - Quote data object
   * @param {Object} options - PDF generation options
   * @returns {Promise<jsPDF>} Generated PDF document
   */
  static async generateAndPreview(quote, options = {}) {
    const service = new QuotePdfService();
    const doc = await service.generateQuotePdf(quote, options);
    service.previewPdf(doc);
    return doc;
  }

  /**
   * Static method to generate quote PDF as blob
   * @param {Object} quote - Quote data object
   * @param {Object} options - PDF generation options
   * @returns {Promise<Blob>} PDF blob object
   */
  static async generateBlob(quote, options = {}) {
    const service = new QuotePdfService();
    const doc = await service.generateQuotePdf(quote, options);
    return service.getPdfBlob(doc);
  }

  /**
   * Get predefined template configurations for different quote styles
   * @returns {Object} Template configurations object
   */
  static getTemplateConfigs() {
    return {
      default: {
        companyName: 'Your Company',
        companyAddress: 'Via Example 123, 00100 Roma RM',
        companyPhone: 'Tel: +39 06 1234 5678',
        companyEmail: 'info@yourcompany.it',
        companyVat: 'VAT: IT12345678901',
        footerText: 'This quote is valid for 30 days from the date of issue.',
      },
      modern: {
        companyName: 'Your Company',
        companyAddress: 'Via Example 123, 00100 Roma RM',
        companyPhone: 'Tel: +39 06 1234 5678',
        companyEmail: 'info@yourcompany.it',
        companyVat: 'VAT: IT12345678901',
        footerText: 'Thank you for choosing our services. This quote is valid for 30 days.',
      },
      minimal: {
        companyName: 'Your Company',
        companyAddress: 'Roma, Italia',
        companyPhone: '+39 06 1234 5678',
        companyEmail: 'info@yourcompany.it',
        footerText: 'Quote valid for 30 days.',
      },
    };
  }
}

export default QuotePdfService;
