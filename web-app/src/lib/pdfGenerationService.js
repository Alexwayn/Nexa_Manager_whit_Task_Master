/**
 * PDF Generation Service - Professional Invoice PDFs with Italian Tax Compliance
 *
 * Features:
 * - Professional invoice templates with Italian legal compliance
 * - Company branding and customization
 * - QR codes for digital verification
 * - Multiple output formats (PDF, print-ready)
 * - Email attachment support
 * - Multilingual support (English interface with Italian tax compliance)
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import Logger from '@utils/Logger';

export class PDFGenerationService {
  // ==================== PDF CONFIGURATION ====================

  static PDF_CONFIG = {
    format: 'a4',
    unit: 'mm',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#64748b', // Gray
      accent: '#059669', // Green
      text: '#1f2937', // Dark gray
      light: '#f8fafc', // Light gray
      border: '#e2e8f0', // Border gray
    },
    fonts: {
      primary: 'helvetica',
      bold: 'helvetica',
      size: {
        title: 16,
        subtitle: 12,
        body: 10,
        small: 8,
      },
    },
  };

  // Italian legal text templates (preserved for tax compliance)
  static LEGAL_TEMPLATES = {
    reverseCharge:
      "Operazione non soggetta ad IVA ai sensi dell'art. 7-ter del DPR 633/72 - Reverse Charge",
    exempt: "Operazione esente da IVA ai sensi dell'art. 10 del DPR 633/72",
    withholding: "Ritenuta d'Acconto del 20% ai sensi dell'art. 25 del DPR 600/73",
    paymentTerms: 'Payment due within {days} days from issue date',
    latePayment:
      'In caso di ritardato pagamento verranno applicati gli interessi di mora previsti dal D.Lgs. 231/2002',
  };

  // ==================== MAIN PDF GENERATION ====================

  /**
   * Generate invoice PDF
   * @param {Object} invoice - Invoice data
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} PDF generation result
   */
  static async generateInvoicePDF(invoice, options = {}) {
    try {
      const {
        template = 'standard',
        includeQR = true,
        includePaymentSlip = false,
        language = 'en',
        watermark = null,
        customBranding = null,
      } = options;

      // Initialize PDF document
      const pdf = new jsPDF({
        format: this.PDF_CONFIG.format,
        unit: this.PDF_CONFIG.unit,
        orientation: this.PDF_CONFIG.orientation,
      });

      // Set document properties
      this.setDocumentProperties(pdf, invoice);

      // Generate content based on template
      switch (template) {
        case 'professional':
          await this.generateProfessionalTemplate(pdf, invoice, options);
          break;
        case 'minimal':
          await this.generateMinimalTemplate(pdf, invoice, options);
          break;
        case 'detailed':
          await this.generateDetailedTemplate(pdf, invoice, options);
          break;
        default:
          await this.generateStandardTemplate(pdf, invoice, options);
      }

      // Add watermark if specified
      if (watermark) {
        this.addWatermark(pdf, watermark);
      }

      // Generate output
      const pdfBlob = pdf.output('blob');
      const pdfDataUri = pdf.output('datauristring');
      const pdfArrayBuffer = pdf.output('arraybuffer');

      return {
        success: true,
        pdf: {
          blob: pdfBlob,
          dataUri: pdfDataUri,
          arrayBuffer: pdfArrayBuffer,
          base64: pdfDataUri.split(',')[1],
        },
        metadata: {
          fileName: this.generateFileName(invoice),
          size: pdfBlob.size,
          pages: pdf.getNumberOfPages(),
          template,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('PDFGenerationService.generateInvoicePDF error:', error);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  // ==================== TEMPLATE IMPLEMENTATIONS ====================

  /**
   * Generate standard invoice template
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {Object} options - Generation options
   */
  static async generateStandardTemplate(pdf, invoice, options) {
    let yPosition = this.PDF_CONFIG.margins.top;

    // Header with company info and logo
    yPosition = await this.addHeader(pdf, invoice, yPosition, options);
    yPosition += 10;

    // Invoice title and basic info
    yPosition = this.addInvoiceTitle(pdf, invoice, yPosition);
    yPosition += 10;

    // Client information
    yPosition = this.addClientInfo(pdf, invoice, yPosition);
    yPosition += 15;

    // Invoice items table
    yPosition = this.addItemsTable(pdf, invoice, yPosition);
    yPosition += 10;

    // Tax summary and totals
    yPosition = this.addTaxSummary(pdf, invoice, yPosition);
    yPosition += 15;

    // Payment information
    yPosition = this.addPaymentInfo(pdf, invoice, yPosition);
    yPosition += 10;

    // Legal notes and compliance
    yPosition = this.addLegalNotes(pdf, invoice, yPosition);

    // QR code if enabled
    if (options.includeQR) {
      await this.addQRCode(pdf, invoice, yPosition);
    }

    // Footer
    this.addFooter(pdf, invoice);
  }

  /**
   * Generate professional template with enhanced branding
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {Object} options - Generation options
   */
  static async generateProfessionalTemplate(pdf, invoice, options) {
    let yPosition = this.PDF_CONFIG.margins.top;

    // Enhanced header with branding
    yPosition = await this.addEnhancedHeader(pdf, invoice, yPosition, options);
    yPosition += 15;

    // Invoice details in professional layout
    yPosition = this.addProfessionalInvoiceInfo(pdf, invoice, yPosition);
    yPosition += 10;

    // Enhanced client section
    yPosition = this.addEnhancedClientInfo(pdf, invoice, yPosition);
    yPosition += 20;

    // Professional items table
    yPosition = this.addProfessionalItemsTable(pdf, invoice, yPosition);
    yPosition += 15;

    // Enhanced tax breakdown
    yPosition = this.addEnhancedTaxSummary(pdf, invoice, yPosition);
    yPosition += 20;

    // Professional payment section
    yPosition = this.addProfessionalPaymentInfo(pdf, invoice, yPosition);

    // QR code and verification
    if (options.includeQR) {
      await this.addProfessionalQRCode(pdf, invoice);
    }

    // Professional footer
    this.addProfessionalFooter(pdf, invoice);
  }

  // ==================== HEADER SECTIONS ====================

  /**
   * Add standard header with company information
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @param {Object} options - Generation options
   * @returns {number} Updated Y position
   */
  static async addHeader(pdf, invoice, yPosition, options) {
    const { margins } = this.PDF_CONFIG;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Company logo (if available)
    if (options.customBranding?.logo) {
      try {
        const logoHeight = 20;
        pdf.addImage(options.customBranding.logo, 'PNG', margins.left, yPosition, 40, logoHeight);
      } catch (error) {
        Logger.warn('Failed to add logo:', error);
      }
    }

    // Company information
    const companyInfo = invoice.company || {};
    const companyX = pageWidth - margins.right - 80;

    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.subtitle);
    pdf.text(companyInfo.name || 'Nexa Manager', companyX, yPosition + 5);

    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    let companyY = yPosition + 12;
    if (companyInfo.address) {
      pdf.text(companyInfo.address, companyX, companyY);
      companyY += 5;
    }
    if (companyInfo.city) {
      pdf.text(`${companyInfo.city} ${companyInfo.postal_code || ''}`, companyX, companyY);
      companyY += 5;
    }
    if (companyInfo.vat_number) {
      pdf.text(`VAT: ${companyInfo.vat_number}`, companyX, companyY);
      companyY += 5;
    }
    if (companyInfo.email) {
      pdf.text(`Email: ${companyInfo.email}`, companyX, companyY);
    }

    return Math.max(yPosition + 30, companyY + 5);
  }

  /**
   * Add enhanced header for professional template
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @param {Object} options - Generation options
   * @returns {number} Updated Y position
   */
  static async addEnhancedHeader(pdf, invoice, yPosition, options) {
    const { margins, colors } = this.PDF_CONFIG;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header background
    pdf.setFillColor(colors.primary);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Company logo and name in white
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(18);

    const companyName = invoice.company?.name || 'Nexa Manager';
    pdf.text(companyName, margins.left, yPosition + 15);

    // Invoice type in top right
    pdf.setFontSize(14);
    pdf.text('INVOICE', pageWidth - margins.right - 30, yPosition + 15);

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    return 45;
  }

  // ==================== INVOICE INFO SECTIONS ====================

  /**
   * Add invoice title and basic information
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addInvoiceTitle(pdf, invoice, yPosition) {
    const { margins } = this.PDF_CONFIG;

    // Invoice title
    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.title);
    pdf.text('INVOICE', margins.left, yPosition);

    // Invoice number and date
    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    const invoiceDate = new Date(invoice.issue_date).toLocaleDateString('en-US');
    pdf.text(`Number: ${invoice.invoice_number}`, margins.left, yPosition + 10);
    pdf.text(`Date: ${invoiceDate}`, margins.left, yPosition + 17);

    if (invoice.due_date) {
      const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US');
      pdf.text(`Due Date: ${dueDate}`, margins.left, yPosition + 24);
    }

    return yPosition + 30;
  }

  /**
   * Add professional invoice information layout
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addProfessionalInvoiceInfo(pdf, invoice, yPosition) {
    const { margins, colors } = this.PDF_CONFIG;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Info box background
    pdf.setFillColor(colors.light);
    pdf.rect(margins.left, yPosition, pageWidth - margins.left - margins.right, 25, 'F');

    // Invoice details in box
    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    const invoiceDate = new Date(invoice.issue_date).toLocaleDateString('en-US');
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('en-US')
      : 'N/A';

    pdf.text('INVOICE N°', margins.left + 5, yPosition + 8);
    pdf.text('ISSUE DATE', margins.left + 60, yPosition + 8);
    pdf.text('DUE DATE', margins.left + 120, yPosition + 8);

    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.text(invoice.invoice_number, margins.left + 5, yPosition + 16);
    pdf.text(invoiceDate, margins.left + 60, yPosition + 16);
    pdf.text(dueDate, margins.left + 120, yPosition + 16);

    return yPosition + 30;
  }

  // ==================== CLIENT INFO SECTIONS ====================

  /**
   * Add client information section
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addClientInfo(pdf, invoice, yPosition) {
    const { margins } = this.PDF_CONFIG;

    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.subtitle);
    pdf.text('Bill To:', margins.left, yPosition);

    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    const client = invoice.client || {};
    let clientY = yPosition + 8;

    if (client.company_name) {
      pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
      pdf.text(client.company_name, margins.left, clientY);
      clientY += 6;
      pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    }

    if (client.name) {
      pdf.text(client.name, margins.left, clientY);
      clientY += 6;
    }

    if (client.address) {
      pdf.text(client.address, margins.left, clientY);
      clientY += 6;
    }

    if (client.city) {
      pdf.text(`${client.city} ${client.postal_code || ''}`, margins.left, clientY);
      clientY += 6;
    }

    if (client.vat_number) {
      pdf.text(`VAT: ${client.vat_number}`, margins.left, clientY);
      clientY += 6;
    }

    if (client.fiscal_code) {
      pdf.text(`Tax Code: ${client.fiscal_code}`, margins.left, clientY);
      clientY += 6;
    }

    return clientY + 5;
  }

  // ==================== ITEMS TABLE SECTIONS ====================

  /**
   * Add invoice items table
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addItemsTable(pdf, invoice, yPosition) {
    const items = invoice.items || [];

    // Prepare table data
    const tableHeaders = ['Description', 'Qty', 'Unit Price', 'VAT', 'Total'];
    const tableData = items.map((item) => {
      const quantity = parseFloat(item.quantity || 1);
      const unitPrice = parseFloat(item.unit_price || 0);
      const total = quantity * unitPrice;
      const ivaRate = item.iva_rate ? `${(item.iva_rate * 100).toFixed(0)}%` : '22%';

      return [
        item.description || '',
        quantity.toString(),
        `€ ${unitPrice.toFixed(2)}`,
        ivaRate,
        `€ ${total.toFixed(2)}`,
      ];
    });

    // Add table
    pdf.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      margin: { left: this.PDF_CONFIG.margins.left, right: this.PDF_CONFIG.margins.right },
      styles: {
        fontSize: this.PDF_CONFIG.fonts.size.body,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: this.PDF_CONFIG.colors.primary,
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: this.PDF_CONFIG.colors.light,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    return pdf.lastAutoTable.finalY + 5;
  }

  // ==================== TAX SUMMARY SECTIONS ====================

  /**
   * Add tax summary and totals
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addTaxSummary(pdf, invoice, yPosition) {
    const { margins } = this.PDF_CONFIG;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const summaryX = pageWidth - margins.right - 80;

    // Tax breakdown
    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    let summaryY = yPosition;

    // Subtotal
    pdf.text('Subtotal:', summaryX, summaryY);
    pdf.text(`€ ${parseFloat(invoice.subtotal || 0).toFixed(2)}`, summaryX + 40, summaryY);
    summaryY += 6;

    // VAT
    const ivaAmount = parseFloat(invoice.tax_amount || 0);
    pdf.text('VAT:', summaryX, summaryY);
    pdf.text(`€ ${ivaAmount.toFixed(2)}`, summaryX + 40, summaryY);
    summaryY += 6;

    // Withholding tax if applicable
    if (invoice.withholding_amount && parseFloat(invoice.withholding_amount) > 0) {
      pdf.text('Withholding:', summaryX, summaryY);
      pdf.text(`-€ ${parseFloat(invoice.withholding_amount).toFixed(2)}`, summaryX + 40, summaryY);
      summaryY += 6;
    }

    // Total line
    pdf.setDrawColor(0, 0, 0);
    pdf.line(summaryX, summaryY + 2, summaryX + 60, summaryY + 2);
    summaryY += 8;

    // Total amount
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.subtitle);
    pdf.text('TOTAL:', summaryX, summaryY);
    pdf.text(`€ ${parseFloat(invoice.total_amount || 0).toFixed(2)}`, summaryX + 40, summaryY);

    return summaryY + 10;
  }

  // ==================== PAYMENT INFO SECTIONS ====================

  /**
   * Add payment information
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addPaymentInfo(pdf, invoice, yPosition) {
    const { margins } = this.PDF_CONFIG;

    pdf.setFont(this.PDF_CONFIG.fonts.bold, 'bold');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.subtitle);
    pdf.text('Payment Information:', margins.left, yPosition);

    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.body);

    let paymentY = yPosition + 8;

    // Payment method
    const paymentMethod = invoice.payment_method || 'Bank transfer';
    pdf.text(`Method: ${paymentMethod}`, margins.left, paymentY);
    paymentY += 6;

    // Payment terms
    if (invoice.payment_terms) {
      pdf.text(`Terms: ${invoice.payment_terms}`, margins.left, paymentY);
      paymentY += 6;
    }

    // Bank details if bank transfer
    if (paymentMethod.toLowerCase().includes('transfer') && invoice.bank_details) {
      pdf.text('Bank Details:', margins.left, paymentY);
      paymentY += 6;

      if (invoice.bank_details.iban) {
        pdf.text(`IBAN: ${invoice.bank_details.iban}`, margins.left + 5, paymentY);
        paymentY += 6;
      }

      if (invoice.bank_details.bic) {
        pdf.text(`BIC/SWIFT: ${invoice.bank_details.bic}`, margins.left + 5, paymentY);
        paymentY += 6;
      }
    }

    return paymentY + 5;
  }

  // ==================== LEGAL NOTES SECTIONS ====================

  /**
   * Add legal notes and compliance information
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   * @returns {number} Updated Y position
   */
  static addLegalNotes(pdf, invoice, yPosition) {
    const { margins } = this.PDF_CONFIG;

    pdf.setFont(this.PDF_CONFIG.fonts.primary, 'normal');
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.small);

    let notesY = yPosition;

    // Add tax-specific legal notes
    if (invoice.tax_notes) {
      const notes = Array.isArray(invoice.tax_notes) ? invoice.tax_notes : [invoice.tax_notes];
      for (const note of notes) {
        pdf.text(note, margins.left, notesY);
        notesY += 5;
      }
    }

    // Standard legal disclaimer (preserved in Italian for tax compliance)
    const disclaimer = 'Fattura emessa ai sensi del DPR 633/72 e successive modificazioni.';
    pdf.text(disclaimer, margins.left, notesY);
    notesY += 5;

    // Late payment interest notice (preserved in Italian for legal compliance)
    const latePaymentNote = this.LEGAL_TEMPLATES.latePayment;
    const wrappedText = pdf.splitTextToSize(latePaymentNote, 170);
    pdf.text(wrappedText, margins.left, notesY);

    return notesY + wrappedText.length * 4 + 5;
  }

  // ==================== QR CODE SECTIONS ====================

  /**
   * Add QR code for digital verification
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   * @param {number} yPosition - Current Y position
   */
  static async addQRCode(pdf, invoice, yPosition) {
    try {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const { margins } = this.PDF_CONFIG;

      // Generate QR code data
      const qrData = this.generateQRData(invoice);

      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Add QR code to PDF
      const qrSize = 25;
      const qrX = pageWidth - margins.right - qrSize;
      const qrY = yPosition;

      pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add QR code label
      pdf.setFontSize(this.PDF_CONFIG.fonts.size.small);
      pdf.text('Digital Verification', qrX, qrY + qrSize + 5);
    } catch (error) {
      Logger.warn('Failed to add QR code:', error);
    }
  }

  // ==================== FOOTER SECTIONS ====================

  /**
   * Add footer with page numbers and additional info
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   */
  static addFooter(pdf, invoice) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const { margins } = this.PDF_CONFIG;

    const footerY = pageHeight - margins.bottom + 5;

    // Page number
    pdf.setFontSize(this.PDF_CONFIG.fonts.size.small);
    pdf.text(
      `Page ${pdf.getCurrentPageInfo().pageNumber}`,
      pageWidth - margins.right - 20,
      footerY,
    );

    // Generation timestamp
    const timestamp = new Date().toLocaleString('en-US');
    pdf.text(`Generated on ${timestamp}`, margins.left, footerY);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Set PDF document properties
   * @param {jsPDF} pdf - PDF document
   * @param {Object} invoice - Invoice data
   */
  static setDocumentProperties(pdf, invoice) {
    pdf.setProperties({
      title: `Invoice ${invoice.invoice_number}`,
      subject: `Invoice for ${invoice.client?.name || 'Client'}`,
      author: invoice.company?.name || 'Nexa Manager',
      creator: 'Nexa Manager - Invoice System',
      producer: 'jsPDF',
      keywords: 'invoice, pdf, billing',
    });
  }

  /**
   * Generate QR code data for invoice verification
   * @param {Object} invoice - Invoice data
   * @returns {string} QR code data
   */
  static generateQRData(invoice) {
    const data = {
      type: 'invoice',
      number: invoice.invoice_number,
      date: invoice.issue_date,
      amount: invoice.total_amount,
      client: invoice.client?.name || '',
      hash: this.generateInvoiceHash(invoice),
    };

    return JSON.stringify(data);
  }

  /**
   * Generate simple hash for invoice verification
   * @param {Object} invoice - Invoice data
   * @returns {string} Invoice hash
   */
  static generateInvoiceHash(invoice) {
    const hashData = `${invoice.invoice_number}-${invoice.issue_date}-${invoice.total_amount}`;
    return btoa(hashData).substring(0, 16);
  }

  /**
   * Generate filename for PDF
   * @param {Object} invoice - Invoice data
   * @returns {string} PDF filename
   */
  static generateFileName(invoice) {
    const date = new Date(invoice.issue_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `Invoice_${invoice.invoice_number}_${year}${month}.pdf`;
  }

  /**
   * Add watermark to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {string} watermark - Watermark text
   */
  static addWatermark(pdf, watermark) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setGState(new pdf.GState({ opacity: 0.1 }));
    pdf.setFontSize(50);
    pdf.setTextColor(128, 128, 128);

    // Rotate and center watermark
    pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center',
    });

    // Reset state
    pdf.setGState(new pdf.GState({ opacity: 1 }));
    pdf.setTextColor(0, 0, 0);
  }
}

export default PDFGenerationService;
