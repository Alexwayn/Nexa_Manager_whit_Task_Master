import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

/**
 * Invoice Settings Service - Advanced Invoice Customization
 *
 * Features:
 * - Invoice settings management with database persistence
 * - Template selection and configuration
 * - Advanced numbering schemes (sequential, date-based, yearly-reset, custom)
 * - Real-time preview generation
 * - User and company-level preferences
 * - Validation and error handling
 */

// Template type constants
export const TEMPLATE_TYPES = {
  PROFESSIONAL: 'professional',
  MINIMAL: 'minimal',
  CREATIVE: 'creative',
  CLASSIC: 'classic',
  DETAILED: 'detailed',
};

// Layout style constants
export const LAYOUT_STYLES = {
  PROFESSIONAL: 'professional',
  MINIMAL: 'minimal',
  CREATIVE: 'creative',
  CLASSIC: 'classic',
};

// Numbering format constants
export const NUMBERING_FORMATS = {
  SEQUENTIAL: 'sequential',
  DATE_BASED: 'date_based',
  YEARLY_RESET: 'yearly_reset',
  CUSTOM: 'custom',
};

// Logo position constants
export const LOGO_POSITIONS = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
};

// Currency constants
export const CURRENCIES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY',
  CHF: 'CHF',
  SEK: 'SEK',
  NOK: 'NOK',
  DKK: 'DKK',
};

// Date format constants
export const DATE_FORMATS = {
  DD_MM_YYYY: 'DD/MM/YYYY',
  MM_DD_YYYY: 'MM/DD/YYYY',
  YYYY_MM_DD: 'YYYY/MM/DD',
  DD_MM_YY: 'DD/MM/YY',
  MM_DD_YY: 'MM/DD/YY',
};

// Number format constants
export const NUMBER_FORMATS = {
  EUROPEAN: 'european', // 1.234,56
  AMERICAN: 'american', // 1,234.56
};

export class InvoiceSettingsService {
  // ==================== SETTINGS MANAGEMENT ====================

  /**
   * Get invoice settings for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Invoice settings
   */
  static async getInvoiceSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select(
          `
          *,
          template:invoice_templates(
            id,
            name,
            description,
            template_type,
            config
          )
        `,
        )
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "row not found"
        throw error;
      }

      // Return default settings if no user settings found
      if (!data) {
        return this.getDefaultSettings(userId);
      }

      return this.formatSettingsResponse(data);
    } catch (error) {
      Logger.error('InvoiceSettingsService.getInvoiceSettings error:', error);
      throw error;
    }
  }

  /**
   * Save invoice settings for a user
   * @param {string} userId - User ID
   * @param {Object} settings - Settings to save
   * @returns {Promise<Object>} Updated settings
   */
  static async saveInvoiceSettings(userId, settings) {
    try {
      // Validate settings
      this.validateSettings(settings);

      // Check if user has existing settings
      const existingSettings = await this.getExistingSettings(userId);

      let result;
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('invoice_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('invoice_settings')
          .insert([
            {
              user_id: userId,
              ...settings,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return this.formatSettingsResponse(result);
    } catch (error) {
      Logger.error('InvoiceSettingsService.saveInvoiceSettings error:', error);
      throw error;
    }
  }

  /**
   * Get default settings for a user
   * @param {string} userId - User ID
   * @returns {Object} Default settings
   */
  static getDefaultSettings(userId) {
    return {
      user_id: userId,
      prefix: 'INV',
      next_number: 1,
      numbering_format: NUMBERING_FORMATS.SEQUENTIAL,
      template_id: null,
      layout_style: LAYOUT_STYLES.PROFESSIONAL,
      logo_position: LOGO_POSITIONS.LEFT,
      payment_terms: 30,
      tax_rate: 22.0,
      currency: CURRENCIES.EUR,
      brand_color: '#2563eb',
      footer_text: 'Thank you for your business!',
      include_notes: true,
      include_tax_breakdown: true,
      auto_reminders: true,
      reminder_days: '7,14,30',
      language: 'en',
      date_format: DATE_FORMATS.DD_MM_YYYY,
      number_format: NUMBER_FORMATS.EUROPEAN,
    };
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get all available templates
   * @returns {Promise<Array>} Available templates
   */
  static async getTemplates() {
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('InvoiceSettingsService.getTemplates error:', error);
      throw error;
    }
  }

  /**
   * Get template configuration by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template configuration
   */
  static async getTemplateConfig(templateId) {
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      Logger.error('InvoiceSettingsService.getTemplateConfig error:', error);
      throw error;
    }
  }

  // ==================== NUMBERING MANAGEMENT ====================

  /**
   * Generate next invoice number based on format
   * @param {string} userId - User ID
   * @param {string} format - Numbering format
   * @param {string} prefix - Invoice prefix
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber(
    userId,
    format = NUMBERING_FORMATS.SEQUENTIAL,
    prefix = 'INV',
    options = {},
  ) {
    try {
      const currentYear = new Date().getFullYear();

      switch (format) {
        case NUMBERING_FORMATS.SEQUENTIAL:
          return await this.generateSequentialNumber(userId, prefix);

        case NUMBERING_FORMATS.DATE_BASED:
          return await this.generateDateBasedNumber(userId, prefix, options.date);

        case NUMBERING_FORMATS.YEARLY_RESET:
          return await this.generateYearlyResetNumber(userId, prefix, currentYear);

        case NUMBERING_FORMATS.CUSTOM:
          return await this.generateCustomNumber(userId, prefix, options);

        default:
          return await this.generateSequentialNumber(userId, prefix);
      }
    } catch (error) {
      Logger.error('InvoiceSettingsService.generateInvoiceNumber error:', error);
      throw error;
    }
  }

  /**
   * Generate sequential number (2025-0001, 2025-0002, etc.)
   * @param {string} userId - User ID
   * @param {string} prefix - Prefix
   * @returns {Promise<string>} Sequential number
   */
  static async generateSequentialNumber(userId, prefix = 'INV') {
    try {
      const currentYear = new Date().getFullYear();

      // Get or create numbering record
      const { data: existing } = await supabase
        .from('invoice_numbering')
        .select('current_number')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('prefix', prefix)
        .single();

      let nextNumber = 1;
      if (existing) {
        nextNumber = existing.current_number + 1;
        // Update existing record
        await supabase
          .from('invoice_numbering')
          .update({ current_number: nextNumber })
          .eq('user_id', userId)
          .eq('year', currentYear)
          .eq('prefix', prefix);
      } else {
        // Create new record
        await supabase.from('invoice_numbering').insert([
          {
            user_id: userId,
            year: currentYear,
            prefix,
            current_number: nextNumber,
          },
        ]);
      }

      return `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      Logger.error('InvoiceSettingsService.generateSequentialNumber error:', error);
      throw error;
    }
  }

  /**
   * Generate date-based number (INV-19-06-2025-0001)
   * @param {string} userId - User ID
   * @param {string} prefix - Prefix
   * @param {Date} date - Date for numbering
   * @returns {Promise<string>} Date-based number
   */
  static async generateDateBasedNumber(userId, prefix = 'INV', date = new Date()) {
    try {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      const datePrefix = `${prefix}-${day}-${month}-${year}`;

      // Get count for this specific date
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .like('invoice_number', `${datePrefix}%`);

      const nextNumber = (count || 0) + 1;
      return `${datePrefix}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      Logger.error('InvoiceSettingsService.generateDateBasedNumber error:', error);
      throw error;
    }
  }

  /**
   * Generate yearly reset number (INV-0001, resets each year)
   * @param {string} userId - User ID
   * @param {string} prefix - Prefix
   * @param {number} year - Year
   * @returns {Promise<string>} Yearly reset number
   */
  static async generateYearlyResetNumber(userId, prefix = 'INV', year = new Date().getFullYear()) {
    try {
      // Get or create numbering record for this year
      const { data: existing } = await supabase
        .from('invoice_numbering')
        .select('current_number')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('prefix', prefix)
        .single();

      let nextNumber = 1;
      if (existing) {
        nextNumber = existing.current_number + 1;
        // Update existing record
        await supabase
          .from('invoice_numbering')
          .update({ current_number: nextNumber })
          .eq('user_id', userId)
          .eq('year', year)
          .eq('prefix', prefix);
      } else {
        // Create new record
        await supabase.from('invoice_numbering').insert([
          {
            user_id: userId,
            year,
            prefix,
            current_number: nextNumber,
          },
        ]);
      }

      return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      Logger.error('InvoiceSettingsService.generateYearlyResetNumber error:', error);
      throw error;
    }
  }

  /**
   * Generate custom number based on user-defined pattern
   * @param {string} userId - User ID
   * @param {string} prefix - Prefix
   * @param {Object} options - Custom options
   * @returns {Promise<string>} Custom number
   */
  static async generateCustomNumber(userId, prefix = 'INV', options = {}) {
    try {
      const { pattern = '{PREFIX}-{YYYY}-{####}' } = options;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Get next sequential number for this pattern
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .like('invoice_number', `${prefix}%`);

      const nextNumber = (count || 0) + 1;

      // Replace pattern variables
      let result = pattern
        .replace('{PREFIX}', prefix)
        .replace('{YYYY}', currentYear.toString())
        .replace('{YY}', currentYear.toString().slice(-2))
        .replace('{MM}', currentMonth.toString().padStart(2, '0'))
        .replace('{####}', nextNumber.toString().padStart(4, '0'))
        .replace('{###}', nextNumber.toString().padStart(3, '0'))
        .replace('{##}', nextNumber.toString().padStart(2, '0'));

      return result;
    } catch (error) {
      Logger.error('InvoiceSettingsService.generateCustomNumber error:', error);
      throw error;
    }
  }

  // ==================== PREVIEW MANAGEMENT ====================

  /**
   * Generate preview data for invoice customization
   * @param {Object} settings - Current settings
   * @param {Object} templateConfig - Template configuration
   * @returns {Object} Preview data
   */
  static generatePreview(settings, templateConfig = {}) {
    try {
      // Generate sample invoice data
      const sampleInvoice = {
        invoice_number: this.formatSampleNumber(settings),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(settings.payment_terms || 30),
        client: {
          full_name: 'Sample Client Ltd.',
          email: 'client@example.com',
          address: '123 Business Street',
          city: 'Business City, 12345',
          vat_number: 'VAT123456789',
        },
        items: [
          {
            description: 'Sample Service 1',
            quantity: 2,
            unit_price: 100.0,
            tax_rate: settings.tax_rate || 22.0,
            amount: 200.0,
          },
          {
            description: 'Sample Service 2',
            quantity: 1,
            unit_price: 150.0,
            tax_rate: settings.tax_rate || 22.0,
            amount: 150.0,
          },
        ],
        subtotal: 350.0,
        tax_amount: 77.0,
        total_amount: 427.0,
        footer_text: settings.footer_text || 'Thank you for your business!',
      };

      // Apply template styling
      const previewData = {
        invoice: sampleInvoice,
        settings: {
          ...settings,
          template_config: templateConfig,
        },
        styling: this.generateStyling(settings, templateConfig),
      };

      return previewData;
    } catch (error) {
      Logger.error('InvoiceSettingsService.generatePreview error:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate settings object
   * @param {Object} settings - Settings to validate
   * @throws {Error} Validation error
   */
  static validateSettings(settings) {
    const requiredFields = ['prefix', 'payment_terms', 'tax_rate', 'currency'];

    for (const field of requiredFields) {
      if (settings[field] === undefined || settings[field] === null) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate specific formats
    if (settings.tax_rate < 0 || settings.tax_rate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }

    if (settings.payment_terms < 1) {
      throw new Error('Payment terms must be at least 1 day');
    }

    if (settings.brand_color && !/^#[0-9A-F]{6}$/i.test(settings.brand_color)) {
      throw new Error('Brand color must be a valid hex color');
    }
  }

  /**
   * Get existing settings without formatting
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Raw settings
   */
  static async getExistingSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format settings response
   * @param {Object} data - Raw database data
   * @returns {Object} Formatted settings
   */
  static formatSettingsResponse(data) {
    return {
      ...data,
      reminder_days: data.reminder_days ? data.reminder_days.split(',') : ['7', '14', '30'],
      template: data.template || null,
    };
  }

  /**
   * Format sample number for preview
   * @param {Object} settings - Current settings
   * @returns {string} Sample number
   */
  static formatSampleNumber(settings) {
    const { numbering_format, prefix } = settings;
    const currentYear = new Date().getFullYear();

    switch (numbering_format) {
      case NUMBERING_FORMATS.SEQUENTIAL:
        return `${currentYear}-0001`;
      case NUMBERING_FORMATS.DATE_BASED:
        return `${prefix}-${new Date().getDate().toString().padStart(2, '0')}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${currentYear}-0001`;
      case NUMBERING_FORMATS.YEARLY_RESET:
        return `${prefix}-0001`;
      case NUMBERING_FORMATS.CUSTOM:
        return `${prefix}-${currentYear}-0001`;
      default:
        return `${prefix}-0001`;
    }
  }

  /**
   * Calculate due date based on payment terms
   * @param {number} paymentTerms - Payment terms in days
   * @returns {string} Due date (YYYY-MM-DD)
   */
  static calculateDueDate(paymentTerms) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Generate styling configuration for preview
   * @param {Object} settings - Current settings
   * @param {Object} templateConfig - Template configuration
   * @returns {Object} Styling configuration
   */
  static generateStyling(settings, templateConfig) {
    return {
      colors: {
        primary: settings.brand_color || templateConfig.colors?.primary || '#2563eb',
        secondary: templateConfig.colors?.secondary || '#64748b',
      },
      fonts: templateConfig.fonts || {
        header: 'Inter',
        body: 'Inter',
      },
      layout: templateConfig.layout || {
        margins: 'normal',
        spacing: 'comfortable',
      },
      logo_position: settings.logo_position || 'left',
    };
  }
}

export default InvoiceSettingsService;
