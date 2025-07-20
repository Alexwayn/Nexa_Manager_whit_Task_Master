/**
 * Quote PDF Service - Professional Quote PDF Generation with Custom Templates
 *
 * Features:
 * - Professional quote templates with customizable branding
 * - Multiple output formats (download, preview, blob, base64)
 * - Comprehensive quote information display
 * - Client details and itemized billing
 * - Tax calculations and totals
 * - Status indicators and validation dates
 * - Customizable company information and logos
 * - Advanced template system with business profile integration
 * - Custom color schemes and font selections
 * - Template saving and management
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Logger from '@utils/Logger';
import { businessService } from '@lib/businessService';

/**
 * Service class for generating professional quote PDFs with custom templates
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

    // Template configurations with enhanced customization
    this.templateConfigs = {
      default: {
        id: 'default',
        name: 'Default Professional',
        description: 'Clean and professional template with company branding',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#059669',
          text: '#1f2937',
          lightGray: '#f8fafc',
          border: '#e2e8f0',
        },
        fonts: {
          header: 'helvetica',
          body: 'helvetica',
        },
        layout: {
          headerHeight: 70,
          logoSize: { width: 40, height: 20 },
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        companyDefaults: {
          companyName: 'Your Company',
          companyAddress: 'Via Example 123, 00100 Roma RM',
          companyPhone: 'Tel: +39 06 1234 5678',
          companyEmail: 'info@yourcompany.it',
          companyVat: 'VAT: IT12345678901',
          footerText: 'This quote is valid for 30 days from the date of issue.',
        },
      },
      modern: {
        id: 'modern',
        name: 'Modern Business',
        description: 'Contemporary design with bold accents and clean typography',
        colors: {
          primary: '#7c3aed',
          secondary: '#6b7280',
          accent: '#f59e0b',
          text: '#111827',
          lightGray: '#f9fafb',
          border: '#d1d5db',
        },
        fonts: {
          header: 'helvetica',
          body: 'helvetica',
        },
        layout: {
          headerHeight: 80,
          logoSize: { width: 45, height: 25 },
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        companyDefaults: {
          companyName: 'Your Company',
          companyAddress: 'Via Example 123, 00100 Roma RM',
          companyPhone: 'Tel: +39 06 1234 5678',
          companyEmail: 'info@yourcompany.it',
          companyVat: 'VAT: IT12345678901',
          footerText: 'Thank you for choosing our services. This quote is valid for 30 days.',
        },
      },
      minimal: {
        id: 'minimal',
        name: 'Minimal Clean',
        description: 'Minimalist design focusing on content with subtle styling',
        colors: {
          primary: '#374151',
          secondary: '#9ca3af',
          accent: '#10b981',
          text: '#1f2937',
          lightGray: '#ffffff',
          border: '#f3f4f6',
        },
        fonts: {
          header: 'helvetica',
          body: 'helvetica',
        },
        layout: {
          headerHeight: 60,
          logoSize: { width: 35, height: 18 },
          margins: { top: 25, right: 25, bottom: 25, left: 25 },
        },
        companyDefaults: {
          companyName: 'Your Company',
          companyAddress: 'Roma, Italia',
          companyPhone: '+39 06 1234 5678',
          companyEmail: 'info@yourcompany.it',
          footerText: 'Quote valid for 30 days.',
        },
      },
      elegant: {
        id: 'elegant',
        name: 'Elegant Classic',
        description: 'Sophisticated design with elegant typography and refined colors',
        colors: {
          primary: '#1e293b',
          secondary: '#64748b',
          accent: '#dc2626',
          text: '#0f172a',
          lightGray: '#f8fafc',
          border: '#e2e8f0',
        },
        fonts: {
          header: 'times',
          body: 'helvetica',
        },
        layout: {
          headerHeight: 75,
          logoSize: { width: 42, height: 22 },
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        companyDefaults: {
          companyName: 'Your Company',
          companyAddress: 'Via Example 123, 00100 Roma RM',
          companyPhone: 'Tel: +39 06 1234 5678',
          companyEmail: 'info@yourcompany.it',
          companyVat: 'VAT: IT12345678901',
          footerText: 'We appreciate your business. This quote is valid for 30 days.',
        },
      },
      creative: {
        id: 'creative',
        name: 'Creative Bold',
        description: 'Bold and creative design with vibrant colors and modern layout',
        colors: {
          primary: '#ec4899',
          secondary: '#6b7280',
          accent: '#3b82f6',
          text: '#111827',
          lightGray: '#fef7ff',
          border: '#e5e7eb',
        },
        fonts: {
          header: 'helvetica',
          body: 'helvetica',
        },
        layout: {
          headerHeight: 85,
          logoSize: { width: 50, height: 28 },
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        companyDefaults: {
          companyName: 'Your Company',
          companyAddress: 'Via Example 123, 00100 Roma RM',
          companyPhone: 'Tel: +39 06 1234 5678',
          companyEmail: 'info@yourcompany.it',
          companyVat: 'VAT: IT12345678901',
          footerText: 'Thank you for your interest. This quote is valid for 30 days.',
        },
      },
    };
  }

  /**
   * Generate PDF document for a quote with enhanced template support
   * @param {Object} quote - Quote data object
   * @param {Object} options - PDF generation options
   * @param {string} options.templateId - Template ID to use
   * @param {string} options.userId - User ID for business profile integration
   * @param {Object} options.customColors - Custom color overrides
   * @param {Object} options.customFonts - Custom font overrides
   * @param {boolean} options.useBusinessProfile - Whether to auto-load business profile data
   * @returns {Promise<jsPDF>} Generated PDF document
   */
  async generateQuotePdf(quote, options = {}) {
    try {
      // Load template configuration
      const template = await this.loadTemplate(options.templateId || 'default', options);

      // Load business profile data if requested
      if (options.useBusinessProfile !== false && options.userId) {
        const businessProfile = await this.loadBusinessProfile(options.userId);
        if (businessProfile) {
          template.companyData = this.mergeBusinessProfileData(
            template.companyData,
            businessProfile,
          );
        }
      }

      // Apply custom overrides
      if (options.customColors) {
        template.colors = { ...template.colors, ...options.customColors };
      }
      if (options.customFonts) {
        template.fonts = { ...template.fonts, ...options.customFonts };
      }

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set document properties
      doc.setProperties({
        title: `Quote ${quote.quote_number}`,
        author: template.companyData.companyName || 'Nexa Manager',
        creator: 'Nexa Manager',
        subject: `Quote for ${quote.clients?.full_name || 'Client'}`,
        keywords: 'quote, business, nexa',
      });

      // Apply template styling
      this.applyTemplateStyles(doc, template);

      // Add content to PDF using template
      await this.addTemplatedHeader(doc, quote, template);
      this.addTemplatedQuoteInfo(doc, quote, template);
      this.addTemplatedClientInfo(doc, quote, template);
      this.addTemplatedItemsTable(doc, quote, template);
      this.addTemplatedTotals(doc, quote, template);
      this.addTemplatedFooter(doc, quote, template);

      return doc;
    } catch (error) {
      Logger.error('Error generating quote PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Load template configuration
   * @param {string} templateId - Template ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Template configuration
   */
  async loadTemplate(templateId, options = {}) {
    try {
      // Check if it's a predefined template
      if (this.templateConfigs[templateId]) {
        const template = JSON.parse(JSON.stringify(this.templateConfigs[templateId]));
        template.companyData = { ...template.companyDefaults };
        return template;
      }

      // Try to load custom template from database
      const customTemplate = await this.loadCustomTemplate(templateId, options.userId);
      if (customTemplate) {
        return customTemplate;
      }

      // Fallback to default template
      Logger.warn(`Template ${templateId} not found, using default`);
      const template = JSON.parse(JSON.stringify(this.templateConfigs.default));
      template.companyData = { ...template.companyDefaults };
      return template;
    } catch (error) {
      Logger.error('Error loading template:', error);
      const template = JSON.parse(JSON.stringify(this.templateConfigs.default));
      template.companyData = { ...template.companyDefaults };
      return template;
    }
  }

  /**
   * Load custom template from database
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Custom template or null
   */
  async loadCustomTemplate(templateId, userId) {
    try {
      // TODO: Implement database loading of custom templates
      // This would query a quote_templates table similar to email_templates
      return null;
    } catch (error) {
      Logger.error('Error loading custom template:', error);
      return null;
    }
  }

  /**
   * Load business profile data
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Business profile data
   */
  async loadBusinessProfile(userId) {
    try {
      const result = await businessService.getBusinessProfileByUserId(userId);
      return result.data;
    } catch (error) {
      Logger.error('Error loading business profile:', error);
      return null;
    }
  }

  /**
   * Merge business profile data with template defaults
   * @param {Object} templateData - Template company data
   * @param {Object} businessProfile - Business profile data
   * @returns {Object} Merged company data
   */
  mergeBusinessProfileData(templateData, businessProfile) {
    return {
      ...templateData,
      companyName: businessProfile.company_name || templateData.companyName,
      companyAddress: this.formatBusinessAddress(businessProfile),
      companyPhone: businessProfile.phone || templateData.companyPhone,
      companyEmail: businessProfile.email || templateData.companyEmail,
      companyVat: businessProfile.vat_number || templateData.companyVat,
      logo: businessProfile.logo_url || templateData.logo,
      website: businessProfile.website,
      industry: businessProfile.industry,
    };
  }

  /**
   * Format business address from profile data
   * @param {Object} businessProfile - Business profile data
   * @returns {string} Formatted address
   */
  formatBusinessAddress(businessProfile) {
    const parts = [];
    if (businessProfile.address) parts.push(businessProfile.address);
    if (businessProfile.city) parts.push(businessProfile.city);
    if (businessProfile.postal_code) parts.push(businessProfile.postal_code);
    if (businessProfile.country) parts.push(businessProfile.country);
    return parts.join(', ') || 'Company Address';
  }

  /**
   * Apply template styles to PDF document
   * @param {jsPDF} doc - PDF document
   * @param {Object} template - Template configuration
   */
  applyTemplateStyles(doc, template) {
    // Store template for use in other methods
    this.currentTemplate = template;

    // Update colors and fonts from template
    this.colors = { ...this.colors, ...template.colors };
    this.fonts = { ...this.fonts, ...template.fonts };
  }

  /**
   * Add templated header section with company logo and information
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   * @returns {Promise<void>}
   */
  async addTemplatedHeader(doc, quote, template) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const { layout, companyData } = template;

    // Add company logo if provided
    if (companyData.logo) {
      try {
        doc.addImage(
          companyData.logo,
          'PNG',
          layout.margins.left,
          layout.margins.top,
          layout.logoSize.width,
          layout.logoSize.height,
        );
      } catch (error) {
        Logger.warn('Could not add logo to PDF:', error);
      }
    }

    // Company name and info
    doc.setFont(template.fonts.header, 'bold');
    doc.setFontSize(24);
    doc.setTextColor(template.colors.primary);
    doc.text(
      companyData.companyName || 'Your Company',
      pageWidth - layout.margins.right,
      layout.margins.top + 10,
      { align: 'right' },
    );

    // Company details
    doc.setFont(template.fonts.body, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(template.colors.text);

    const companyDetails = [
      companyData.companyAddress,
      companyData.companyPhone,
      companyData.companyEmail,
      companyData.companyVat,
    ].filter(detail => detail);

    let yPos = layout.margins.top + 20;
    companyDetails.forEach(detail => {
      doc.text(detail, pageWidth - layout.margins.right, yPos, { align: 'right' });
      yPos += 5;
    });

    // Add horizontal line
    doc.setDrawColor(template.colors.border);
    doc.setLineWidth(0.5);
    doc.line(
      layout.margins.left,
      layout.headerHeight - 5,
      pageWidth - layout.margins.right,
      layout.headerHeight - 5,
    );
  }

  /**
   * Add templated quote information section
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   */
  addTemplatedQuoteInfo(doc, quote, template) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const { layout } = template;
    const startY = layout.headerHeight + 10;

    // Quote title
    doc.setFont(template.fonts.header, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(template.colors.primary);
    doc.text('QUOTE', layout.margins.left, startY);

    // Quote details in two columns
    doc.setFont(template.fonts.body, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(template.colors.text);

    const infoY = startY + 15;

    // Left column labels
    doc.text('Quote Number:', layout.margins.left, infoY);
    doc.text('Issue Date:', layout.margins.left, infoY + 10);
    doc.text('Valid Until:', layout.margins.left, infoY + 20);
    doc.text('Status:', layout.margins.left, infoY + 30);

    // Right column values
    doc.setFont(template.fonts.body, 'normal');
    const valueX = layout.margins.left + 55;
    doc.text(quote.quote_number || '', valueX, infoY);
    doc.text(this.formatDate(quote.issue_date), valueX, infoY + 10);
    doc.text(this.formatDate(quote.due_date), valueX, infoY + 20);

    // Status with colored background
    const statusColor = this.getTemplatedStatusColor(quote.status, template);
    doc.setFillColor(statusColor.bg);
    doc.roundedRect(valueX - 2, infoY + 25, 30, 6, 2, 2, 'F');
    doc.setTextColor(statusColor.text);
    doc.text(this.getStatusText(quote.status), valueX, infoY + 30);
    doc.setTextColor(template.colors.text);
  }

  /**
   * Add templated client information section
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   */
  addTemplatedClientInfo(doc, quote, template) {
    if (!quote.clients) return;

    const { layout } = template;
    const startY = layout.headerHeight + 70;

    // Client section title
    doc.setFont(template.fonts.header, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(template.colors.primary);
    doc.text('CLIENT', layout.margins.left, startY);

    // Client details
    doc.setFont(template.fonts.body, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(template.colors.text);

    const clientDetails = [
      quote.clients.full_name || quote.clients.company_name,
      quote.clients.email,
      quote.clients.phone,
      this.formatClientAddress(quote.clients),
    ].filter(detail => detail);

    let yPos = startY + 10;
    clientDetails.forEach(detail => {
      doc.text(detail, layout.margins.left, yPos);
      yPos += 5;
    });
  }

  /**
   * Add templated items table
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   */
  addTemplatedItemsTable(doc, quote, template) {
    if (!quote.quote_items || quote.quote_items.length === 0) return;

    const { layout } = template;
    const startY = layout.headerHeight + 130;

    // Prepare table data
    const headers = ['Description', 'Qty', 'Unit Price', 'Amount'];
    const rows = quote.quote_items.map(item => [
      item.description || '',
      this.formatNumber(item.quantity),
      this.formatCurrency(item.unit_price),
      this.formatCurrency(item.quantity * item.unit_price),
    ]);

    // Create table with template styling
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: startY,
      margin: { left: layout.margins.left, right: layout.margins.right },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        font: template.fonts.body,
        textColor: template.colors.text,
      },
      headStyles: {
        fillColor: template.colors.primary,
        textColor: '#ffffff',
        fontStyle: 'bold',
        font: template.fonts.header,
      },
      alternateRowStyles: {
        fillColor: template.colors.lightGray,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });
  }

  /**
   * Add templated totals section
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   */
  addTemplatedTotals(doc, quote, template) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const { layout } = template;

    // Calculate position after table
    const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : layout.headerHeight + 200;

    // Calculate totals
    const subtotal = quote.subtotal || 0;
    const taxAmount = quote.tax_amount || 0;
    const total = quote.total || subtotal + taxAmount;

    // Totals section styling
    doc.setFont(template.fonts.body, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(template.colors.text);

    const totalsX = pageWidth - layout.margins.right - 80;
    let currentY = tableEndY;

    // Subtotal
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(this.formatCurrency(subtotal), pageWidth - layout.margins.right, currentY, {
      align: 'right',
    });

    // Tax
    if (taxAmount > 0) {
      currentY += 8;
      doc.text(`Tax (${quote.tax_rate || 0}%):`, totalsX, currentY);
      doc.text(this.formatCurrency(taxAmount), pageWidth - layout.margins.right, currentY, {
        align: 'right',
      });
    }

    // Total with accent styling
    currentY += 12;
    doc.setFont(template.fonts.header, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(template.colors.accent);

    // Add background for total
    doc.setFillColor(template.colors.lightGray);
    doc.roundedRect(totalsX - 5, currentY - 8, 85, 12, 2, 2, 'F');

    doc.text('TOTAL:', totalsX, currentY);
    doc.text(this.formatCurrency(total), pageWidth - layout.margins.right, currentY, {
      align: 'right',
    });
  }

  /**
   * Add templated footer section
   * @param {jsPDF} doc - PDF document instance
   * @param {Object} quote - Quote data object
   * @param {Object} template - Template configuration
   */
  addTemplatedFooter(doc, quote, template) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const { layout, companyData } = template;

    // Footer background
    doc.setFillColor(template.colors.lightGray);
    doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');

    // Footer text
    doc.setFont(template.fonts.body, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(template.colors.secondary);

    const footerText =
      companyData.footerText || 'This quote is valid for 30 days from the date of issue.';
    doc.text(footerText, pageWidth / 2, pageHeight - 25, {
      align: 'center',
      maxWidth: pageWidth - 40,
    });

    // Additional footer info
    if (companyData.website) {
      doc.text(companyData.website, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }

    // Page number
    doc.setFontSize(8);
    doc.text(`Page 1`, pageWidth - layout.margins.right, pageHeight - 10, { align: 'right' });
  }

  /**
   * Get status color based on template colors
   * @param {string} status - Status code
   * @param {Object} template - Template configuration
   * @returns {Object} Color configuration
   */
  getTemplatedStatusColor(status, template) {
    const baseColors = this.getStatusColor(status);

    // Use template accent color for positive statuses
    if (status === 'accepted' || status === 'converted') {
      return {
        bg: this.hexToRgb(template.colors.accent, 0.1),
        text: template.colors.accent,
      };
    }

    return baseColors;
  }

  /**
   * Convert hex color to RGB with alpha
   * @param {string} hex - Hex color
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGB color string
   */
  hexToRgb(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
  }

  /**
   * Format client address for display
   * @param {Object} client - Client data object
   * @returns {string} Formatted address string
   */
  formatClientAddress(client) {
    const parts = [];
    if (client.address) parts.push(client.address);
    if (client.city) parts.push(client.city);
    if (client.postal_code) parts.push(client.postal_code);
    if (client.country) parts.push(client.country);
    return parts.join(', ');
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
