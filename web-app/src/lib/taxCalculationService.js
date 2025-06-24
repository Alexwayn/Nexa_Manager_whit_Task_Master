/**
 * Tax Calculation Service - Italian Tax System (IVA) Implementation
 *
 * Features:
 * - Italian IVA rates: 22%, 10%, 4%, 0% (exempt)
 * - Reverse charge for EU B2B transactions
 * - Ritenuta d'Acconto (withholding tax) for professionals
 * - Tax-exempt handling and validation
 * - Configurable tax rules by product/service category
 * - Compliance with Italian tax regulations
 */
import Logger from '@utils/Logger';

// Translation function - to be integrated with i18n system
const t = (key, params) => {
  // This is a placeholder function that will be replaced with actual i18n implementation
  const translations = {
    // IVA Labels
    'tax.iva.standard': '22% IVA Ordinaria',
    'tax.iva.reduced': '10% IVA Ridotta',
    'tax.iva.superReduced': '4% IVA Super Ridotta',
    'tax.iva.exempt': 'Esente IVA',
    'tax.iva.outOfScope': 'Fuori Campo IVA',
    'tax.iva.reverseCharge': 'Reverse Charge',
    'tax.iva.custom': '{{rate}}% IVA',

    // Withholding Labels
    'tax.withholding.none': 'Nessuna Ritenuta',
    'tax.withholding.standard': "{{rate}}% Ritenuta d'Acconto",

    // Tax Categories
    'tax.category.servicesProf': 'Servizi Professionali',
    'tax.category.servicesGeneral': 'Servizi Generali',
    'tax.category.goodsStandard': 'Beni Standard',
    'tax.category.goodsFood': 'Prodotti Alimentari',
    'tax.category.goodsEssential': 'Beni di Prima Necessità',
    'tax.category.exempt': 'Operazioni Esenti',

    // Error Messages
    'tax.error.invalidAmount': 'Amount must be a positive number',
    'tax.error.negativeAmounts': 'Tax calculation resulted in negative amounts',
    'tax.error.totalMismatch': 'Tax calculation total mismatch',
    'tax.error.netMismatch': 'Tax calculation net amount mismatch',

    // Tax Notes
    'tax.note.reverseCharge':
      "Operazione non soggetta ad IVA ai sensi dell'art. 7-ter del DPR 633/72 - Reverse Charge",
    'tax.note.exempt': 'Operazione esente da IVA',

    // Compliance Notes
    'tax.compliance.reverseChargeApplied':
      'Reverse Charge applicato per operazione intracomunitaria B2B',
    'tax.compliance.reverseChargeNotApplicable':
      'Reverse Charge non applicabile - verificare requisiti',
    'tax.compliance.exemptVerify': 'Verificare articolo di legge per esenzione IVA',
    'tax.compliance.invoiceReverseCharge':
      'Fattura con operazioni in Reverse Charge - verificare adempimenti cliente',
    'tax.compliance.invoiceExempt':
      'Fattura con operazioni esenti - verificare articoli di legge applicabili',
    'tax.compliance.withholdingPayment':
      "Ritenuta d'Acconto applicata - versamento entro il 16 del mese successivo",
  };

  let translation = translations[key] || key;

  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }

  return translation;
};

// Italian IVA (VAT) rates
export const IVA_RATES = {
  STANDARD: 0.22, // 22% - Aliquota ordinaria
  REDUCED: 0.1, // 10% - Aliquota ridotta (alimentari, libri, etc.)
  SUPER_REDUCED: 0.04, // 4% - Aliquota super ridotta (beni di prima necessità)
  EXEMPT: 0.0, // 0% - Operazioni esenti
  OUT_OF_SCOPE: null, // Fuori campo IVA
};

// Tax rate labels in Italian
export const IVA_LABELS = {
  [IVA_RATES.STANDARD]: t('tax.iva.standard'),
  [IVA_RATES.REDUCED]: t('tax.iva.reduced'),
  [IVA_RATES.SUPER_REDUCED]: t('tax.iva.superReduced'),
  [IVA_RATES.EXEMPT]: t('tax.iva.exempt'),
  [IVA_RATES.OUT_OF_SCOPE]: t('tax.iva.outOfScope'),
};

// Withholding tax rates (Ritenuta d'Acconto)
export const WITHHOLDING_RATES = {
  PROFESSIONALS: 0.2, // 20% per professionisti
  AGENTS: 0.2, // 20% per agenti
  CONSULTANTS: 0.2, // 20% per consulenti
  NONE: 0.0, // Nessuna ritenuta
};

// Tax categories for automatic rate assignment
export const TAX_CATEGORIES = {
  SERVICES_PROFESSIONAL: {
    ivaRate: IVA_RATES.STANDARD,
    withholdingRate: WITHHOLDING_RATES.PROFESSIONALS,
    description: t('tax.category.servicesProf'),
  },
  SERVICES_GENERAL: {
    ivaRate: IVA_RATES.STANDARD,
    withholdingRate: WITHHOLDING_RATES.NONE,
    description: t('tax.category.servicesGeneral'),
  },
  GOODS_STANDARD: {
    ivaRate: IVA_RATES.STANDARD,
    withholdingRate: WITHHOLDING_RATES.NONE,
    description: t('tax.category.goodsStandard'),
  },
  GOODS_FOOD: {
    ivaRate: IVA_RATES.REDUCED,
    withholdingRate: WITHHOLDING_RATES.NONE,
    description: t('tax.category.goodsFood'),
  },
  GOODS_ESSENTIAL: {
    ivaRate: IVA_RATES.SUPER_REDUCED,
    withholdingRate: WITHHOLDING_RATES.NONE,
    description: t('tax.category.goodsEssential'),
  },
  EXEMPT: {
    ivaRate: IVA_RATES.EXEMPT,
    withholdingRate: WITHHOLDING_RATES.NONE,
    description: t('tax.category.exempt'),
  },
};

export class TaxCalculationService {
  // ==================== CORE TAX CALCULATIONS ====================

  /**
   * Calculate taxes for an invoice or invoice item
   * @param {Object} params - Calculation parameters
   * @returns {Object} Tax calculation results
   */
  static calculateTaxes(params) {
    const {
      amount, // Base amount (without tax)
      ivaRate = IVA_RATES.STANDARD,
      withholdingRate = WITHHOLDING_RATES.NONE,
      isReverseCharge = false,
      isExempt = false,
      clientCountry = 'IT',
      clientVatNumber = null,
      supplierVatNumber = null,
    } = params;

    try {
      // Validate input
      if (!amount || amount < 0) {
        throw new Error(t('tax.error.invalidAmount'));
      }

      const baseAmount = parseFloat(amount);
      let result = {
        baseAmount,
        ivaRate,
        withholdingRate,
        isReverseCharge,
        isExempt,

        // Calculated amounts
        ivaAmount: 0,
        withholdingAmount: 0,
        totalAmount: baseAmount,
        netAmount: baseAmount,

        // Additional info
        taxNote: '',
        complianceNotes: [],
      };

      // Handle reverse charge (EU B2B transactions)
      if (isReverseCharge) {
        result = this.calculateReverseCharge(result, clientCountry, clientVatNumber);
      }
      // Handle exempt transactions
      else if (isExempt) {
        result = this.calculateExemptTransaction(result);
      }
      // Standard IVA calculation
      else {
        result.ivaAmount = this.roundCurrency(baseAmount * ivaRate);
        result.totalAmount = baseAmount + result.ivaAmount;
      }

      // Calculate withholding tax (applied to base amount)
      if (withholdingRate > 0) {
        result.withholdingAmount = this.roundCurrency(baseAmount * withholdingRate);
        result.netAmount = result.totalAmount - result.withholdingAmount;
      } else {
        result.netAmount = result.totalAmount;
      }

      // Add tax labels and notes
      result.ivaLabel = this.getIvaLabel(ivaRate, isReverseCharge, isExempt);
      result.withholdingLabel = this.getWithholdingLabel(withholdingRate);

      // Validate calculation
      this.validateTaxCalculation(result);

      return result;
    } catch (error) {
      Logger.error('TaxCalculationService.calculateTaxes error:', error);
      throw error;
    }
  }

  /**
   * Calculate taxes for multiple invoice items
   * @param {Array} items - Array of invoice items
   * @param {Object} invoiceParams - Invoice-level parameters
   * @returns {Object} Aggregated tax calculation
   */
  static calculateInvoiceTaxes(items, invoiceParams = {}) {
    try {
      const {
        clientCountry = 'IT',
        clientVatNumber = null,
        supplierVatNumber = null,
        defaultIvaRate = IVA_RATES.STANDARD,
        defaultWithholdingRate = WITHHOLDING_RATES.NONE,
      } = invoiceParams;

      let totals = {
        baseAmount: 0,
        ivaAmount: 0,
        withholdingAmount: 0,
        totalAmount: 0,
        netAmount: 0,

        // Tax breakdowns
        ivaBreakdown: {},
        withholdingBreakdown: {},

        // Items with calculated taxes
        itemsWithTax: [],

        // Compliance info
        hasReverseCharge: false,
        hasExemptItems: false,
        complianceNotes: [],
      };

      // Calculate tax for each item
      for (const item of items) {
        const itemAmount = parseFloat(item.quantity || 1) * parseFloat(item.unit_price || 0);

        const itemTaxParams = {
          amount: itemAmount,
          ivaRate: item.iva_rate || defaultIvaRate,
          withholdingRate: item.withholding_rate || defaultWithholdingRate,
          isReverseCharge: item.is_reverse_charge || false,
          isExempt: item.is_exempt || false,
          clientCountry,
          clientVatNumber,
          supplierVatNumber,
        };

        const itemTaxResult = this.calculateTaxes(itemTaxParams);

        // Add to totals
        totals.baseAmount += itemTaxResult.baseAmount;
        totals.ivaAmount += itemTaxResult.ivaAmount;
        totals.withholdingAmount += itemTaxResult.withholdingAmount;
        totals.totalAmount += itemTaxResult.totalAmount;
        totals.netAmount += itemTaxResult.netAmount;

        // Track special cases
        if (itemTaxResult.isReverseCharge) totals.hasReverseCharge = true;
        if (itemTaxResult.isExempt) totals.hasExemptItems = true;

        // Build IVA breakdown
        const ivaKey = itemTaxResult.ivaLabel;
        if (!totals.ivaBreakdown[ivaKey]) {
          totals.ivaBreakdown[ivaKey] = {
            rate: itemTaxResult.ivaRate,
            baseAmount: 0,
            taxAmount: 0,
          };
        }
        totals.ivaBreakdown[ivaKey].baseAmount += itemTaxResult.baseAmount;
        totals.ivaBreakdown[ivaKey].taxAmount += itemTaxResult.ivaAmount;

        // Build withholding breakdown
        if (itemTaxResult.withholdingAmount > 0) {
          const withholdingKey = itemTaxResult.withholdingLabel;
          if (!totals.withholdingBreakdown[withholdingKey]) {
            totals.withholdingBreakdown[withholdingKey] = {
              rate: itemTaxResult.withholdingRate,
              baseAmount: 0,
              taxAmount: 0,
            };
          }
          totals.withholdingBreakdown[withholdingKey].baseAmount += itemTaxResult.baseAmount;
          totals.withholdingBreakdown[withholdingKey].taxAmount += itemTaxResult.withholdingAmount;
        }

        // Store item with tax calculation
        totals.itemsWithTax.push({
          ...item,
          taxCalculation: itemTaxResult,
        });
      }

      // Round final totals
      totals.baseAmount = this.roundCurrency(totals.baseAmount);
      totals.ivaAmount = this.roundCurrency(totals.ivaAmount);
      totals.withholdingAmount = this.roundCurrency(totals.withholdingAmount);
      totals.totalAmount = this.roundCurrency(totals.totalAmount);
      totals.netAmount = this.roundCurrency(totals.netAmount);

      // Add compliance notes
      totals.complianceNotes = this.generateComplianceNotes(totals);

      return totals;
    } catch (error) {
      Logger.error('TaxCalculationService.calculateInvoiceTaxes error:', error);
      throw error;
    }
  }

  // ==================== SPECIAL TAX SCENARIOS ====================

  /**
   * Handle reverse charge calculation (EU B2B)
   * @param {Object} result - Base calculation result
   * @param {string} clientCountry - Client country code
   * @param {string} clientVatNumber - Client VAT number
   * @returns {Object} Updated calculation result
   */
  static calculateReverseCharge(result, clientCountry, clientVatNumber) {
    // Reverse charge applies when:
    // 1. Client is in EU but not Italy
    // 2. Client has valid VAT number
    // 3. Transaction is B2B

    const isEUCountry = this.isEUCountry(clientCountry);
    const hasValidVatNumber = clientVatNumber && clientVatNumber.trim().length > 0;

    if (isEUCountry && clientCountry !== 'IT' && hasValidVatNumber) {
      result.ivaAmount = 0;
      result.totalAmount = result.baseAmount;
      result.taxNote = t('tax.note.reverseCharge');
      result.complianceNotes.push(t('tax.compliance.reverseChargeApplied'));
    } else {
      result.isReverseCharge = false;
      result.complianceNotes.push(t('tax.compliance.reverseChargeNotApplicable'));
    }

    return result;
  }

  /**
   * Handle exempt transaction calculation
   * @param {Object} result - Base calculation result
   * @returns {Object} Updated calculation result
   */
  static calculateExemptTransaction(result) {
    result.ivaAmount = 0;
    result.totalAmount = result.baseAmount;
    result.taxNote = t('tax.note.exempt');
    result.complianceNotes.push(t('tax.compliance.exemptVerify'));

    return result;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Round currency to 2 decimal places
   * @param {number} amount - Amount to round
   * @returns {number} Rounded amount
   */
  static roundCurrency(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  /**
   * Get IVA label for display
   * @param {number} rate - IVA rate
   * @param {boolean} isReverseCharge - Is reverse charge
   * @param {boolean} isExempt - Is exempt
   * @returns {string} IVA label
   */
  static getIvaLabel(rate, isReverseCharge, isExempt) {
    if (isReverseCharge) return t('tax.iva.reverseCharge');
    if (isExempt) return t('tax.iva.exempt');
    return IVA_LABELS[rate] || t('tax.iva.custom', { rate: (rate * 100).toFixed(0) });
  }

  /**
   * Get withholding tax label
   * @param {number} rate - Withholding rate
   * @returns {string} Withholding label
   */
  static getWithholdingLabel(rate) {
    if (rate === 0) return '';
    return t('tax.withholding.standard', { rate: (rate * 100).toFixed(0) });
  }

  /**
   * Check if country is in EU
   * @param {string} countryCode - Country code
   * @returns {boolean} Is EU country
   */
  static isEUCountry(countryCode) {
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];
    return euCountries.includes(countryCode?.toUpperCase());
  }

  /**
   * Validate tax calculation
   * @param {Object} result - Tax calculation result
   * @throws {Error} If validation fails
   */
  static validateTaxCalculation(result) {
    // Check for negative amounts
    if (result.baseAmount < 0 || result.ivaAmount < 0 || result.withholdingAmount < 0) {
      throw new Error(t('tax.error.negativeAmounts'));
    }

    // Check total calculation
    const expectedTotal = result.baseAmount + result.ivaAmount;
    if (Math.abs(result.totalAmount - expectedTotal) > 0.01) {
      throw new Error(t('tax.error.totalMismatch'));
    }

    // Check net calculation
    const expectedNet = result.totalAmount - result.withholdingAmount;
    if (Math.abs(result.netAmount - expectedNet) > 0.01) {
      throw new Error(t('tax.error.netMismatch'));
    }
  }

  /**
   * Generate compliance notes for invoice
   * @param {Object} totals - Invoice totals
   * @returns {Array} Compliance notes
   */
  static generateComplianceNotes(totals) {
    const notes = [];

    if (totals.hasReverseCharge) {
      notes.push(t('tax.compliance.invoiceReverseCharge'));
    }

    if (totals.hasExemptItems) {
      notes.push(t('tax.compliance.invoiceExempt'));
    }

    if (totals.withholdingAmount > 0) {
      notes.push(t('tax.compliance.withholdingPayment'));
    }

    return notes;
  }

  // ==================== TAX RATE HELPERS ====================

  /**
   * Get tax category by product/service type
   * @param {string} type - Product/service type
   * @returns {Object} Tax category configuration
   */
  static getTaxCategoryByType(type) {
    const typeMapping = {
      professional_services: TAX_CATEGORIES.SERVICES_PROFESSIONAL,
      consulting: TAX_CATEGORIES.SERVICES_PROFESSIONAL,
      legal_services: TAX_CATEGORIES.SERVICES_PROFESSIONAL,
      general_services: TAX_CATEGORIES.SERVICES_GENERAL,
      products: TAX_CATEGORIES.GOODS_STANDARD,
      food: TAX_CATEGORIES.GOODS_FOOD,
      books: TAX_CATEGORIES.GOODS_FOOD,
      essential_goods: TAX_CATEGORIES.GOODS_ESSENTIAL,
      exempt: TAX_CATEGORIES.EXEMPT,
    };

    return typeMapping[type] || TAX_CATEGORIES.SERVICES_GENERAL;
  }

  /**
   * Get all available IVA rates for UI
   * @returns {Array} Available IVA rates
   */
  static getAvailableIvaRates() {
    return [
      { value: IVA_RATES.STANDARD, label: IVA_LABELS[IVA_RATES.STANDARD] },
      { value: IVA_RATES.REDUCED, label: IVA_LABELS[IVA_RATES.REDUCED] },
      { value: IVA_RATES.SUPER_REDUCED, label: IVA_LABELS[IVA_RATES.SUPER_REDUCED] },
      { value: IVA_RATES.EXEMPT, label: IVA_LABELS[IVA_RATES.EXEMPT] },
    ];
  }

  /**
   * Get all available withholding rates for UI
   * @returns {Array} Available withholding rates
   */
  static getAvailableWithholdingRates() {
    return [
      { value: WITHHOLDING_RATES.NONE, label: t('tax.withholding.none') },
      {
        value: WITHHOLDING_RATES.PROFESSIONALS,
        label: t('tax.withholding.standard', { rate: 20 }),
      },
    ];
  }
}

export default TaxCalculationService;
