import {
  TaxCalculationService,
  IVA_RATES,
  WITHHOLDING_RATES,
  TAX_CATEGORIES,
} from '@lib/taxCalculationService';
import Logger from '@utils/Logger';

// Mock Logger
jest.mock('../../utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

describe('TaxCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTaxes', () => {
    it('should calculate standard IVA correctly', () => {
      const params = {
        amount: 100,
        ivaRate: IVA_RATES.STANDARD,
        withholdingRate: WITHHOLDING_RATES.NONE,
      };

      const result = TaxCalculationService.calculateTaxes(params);

      expect(result.baseAmount).toBe(100);
      expect(result.ivaAmount).toBe(22);
      expect(result.totalAmount).toBe(122);
      expect(result.withholdingAmount).toBe(0);
      expect(result.netAmount).toBe(122);
    });

    it('should calculate reduced IVA correctly', () => {
      const params = {
        amount: 100,
        ivaRate: IVA_RATES.REDUCED,
        withholdingRate: WITHHOLDING_RATES.NONE,
      };

      const result = TaxCalculationService.calculateTaxes(params);

      expect(result.baseAmount).toBe(100);
      expect(result.ivaAmount).toBe(10);
      expect(result.totalAmount).toBe(110);
      expect(result.withholdingAmount).toBe(0);
      expect(result.netAmount).toBe(110);
    });

    it('should calculate withholding tax correctly', () => {
      const params = {
        amount: 100,
        ivaRate: IVA_RATES.STANDARD,
        withholdingRate: WITHHOLDING_RATES.PROFESSIONALS,
      };

      const result = TaxCalculationService.calculateTaxes(params);

      expect(result.baseAmount).toBe(100);
      expect(result.ivaAmount).toBe(22);
      expect(result.totalAmount).toBe(122);
      expect(result.withholdingAmount).toBe(20);
      expect(result.netAmount).toBe(102);
    });

    it('should handle exempt transactions', () => {
      const params = {
        amount: 100,
        ivaRate: IVA_RATES.EXEMPT,
        withholdingRate: WITHHOLDING_RATES.NONE,
        isExempt: true,
      };

      const result = TaxCalculationService.calculateTaxes(params);

      expect(result.baseAmount).toBe(100);
      expect(result.ivaAmount).toBe(0);
      expect(result.totalAmount).toBe(100);
      expect(result.withholdingAmount).toBe(0);
      expect(result.netAmount).toBe(100);
      expect(result.taxNote).toBe('Operazione esente da IVA');
    });

    it('should handle reverse charge for EU B2B', () => {
      const params = {
        amount: 100,
        ivaRate: IVA_RATES.STANDARD,
        withholdingRate: WITHHOLDING_RATES.NONE,
        isReverseCharge: true,
        clientCountry: 'DE',
        clientVatNumber: 'DE123456789',
      };

      const result = TaxCalculationService.calculateTaxes(params);

      expect(result.baseAmount).toBe(100);
      expect(result.ivaAmount).toBe(0);
      expect(result.totalAmount).toBe(100);
      expect(result.withholdingAmount).toBe(0);
      expect(result.netAmount).toBe(100);
      expect(result.taxNote).toBe(
        "Operazione non soggetta ad IVA ai sensi dell'art. 7-ter del DPR 633/72 - Reverse Charge",
      );
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        TaxCalculationService.calculateTaxes({ amount: -50 });
      }).toThrow('Amount must be a positive number');
    });

    it('should throw error for zero amount', () => {
      expect(() => {
        TaxCalculationService.calculateTaxes({ amount: 0 });
      }).toThrow('Amount must be a positive number');
    });
  });

  describe('calculateInvoiceTaxes', () => {
    it('should calculate taxes for multiple items', () => {
      const items = [
        { quantity: 1, unit_price: 100, iva_rate: IVA_RATES.STANDARD },
        { quantity: 2, unit_price: 50, iva_rate: IVA_RATES.REDUCED },
      ];

      const result = TaxCalculationService.calculateInvoiceTaxes(items);

      expect(result.baseAmount).toBe(200); // 100 + (2*50)
      expect(result.ivaAmount).toBe(32); // 22 + 10
      expect(result.totalAmount).toBe(232);
      expect(result.netAmount).toBe(232);
    });

    it('should handle mixed reverse charge and standard items', () => {
      const items = [
        { quantity: 1, unit_price: 100, iva_rate: IVA_RATES.STANDARD },
        {
          quantity: 1,
          unit_price: 200,
          iva_rate: IVA_RATES.STANDARD,
          is_reverse_charge: true,
        },
      ];

      const invoiceParams = {
        clientCountry: 'DE',
        clientVatNumber: 'DE123456789',
      };

      const result = TaxCalculationService.calculateInvoiceTaxes(items, invoiceParams);

      expect(result.baseAmount).toBe(300);
      expect(result.ivaAmount).toBe(22); // Only first item has IVA
      expect(result.totalAmount).toBe(322);
      expect(result.hasReverseCharge).toBe(true);
    });
  });

  describe('getTaxCategoryByType', () => {
    it('should return correct tax category for professional services', () => {
      const category = TaxCalculationService.getTaxCategoryByType('professional_services');
      expect(category.ivaRate).toBe(IVA_RATES.STANDARD);
      expect(category.withholdingRate).toBe(WITHHOLDING_RATES.PROFESSIONALS);
    });

    it('should return correct tax category for food products', () => {
      const category = TaxCalculationService.getTaxCategoryByType('food');
      expect(category.ivaRate).toBe(IVA_RATES.REDUCED);
      expect(category.withholdingRate).toBe(WITHHOLDING_RATES.NONE);
    });

    it('should return default category for unknown type', () => {
      const category = TaxCalculationService.getTaxCategoryByType('unknown_type');
      expect(category).toBe(TAX_CATEGORIES.SERVICES_GENERAL);
    });
  });

  describe('getAvailableIvaRates', () => {
    it('should return all available IVA rates', () => {
      const rates = TaxCalculationService.getAvailableIvaRates();

      expect(rates).toHaveLength(4);
      expect(rates).toContainEqual({
        value: IVA_RATES.STANDARD,
        label: '22% IVA Ordinaria',
      });
      expect(rates).toContainEqual({
        value: IVA_RATES.REDUCED,
        label: '10% IVA Ridotta',
      });
    });
  });

  describe('getAvailableWithholdingRates', () => {
    it('should return all available withholding rates', () => {
      const rates = TaxCalculationService.getAvailableWithholdingRates();

      expect(rates).toHaveLength(2);
      expect(rates).toContainEqual({
        value: WITHHOLDING_RATES.NONE,
        label: 'Nessuna Ritenuta',
      });
      expect(rates).toContainEqual({
        value: WITHHOLDING_RATES.PROFESSIONALS,
        label: "20% Ritenuta d'Acconto",
      });
    });
  });

  describe('roundCurrency', () => {
    it('should round currency to 2 decimal places', () => {
      expect(TaxCalculationService.roundCurrency(10.234)).toBe(10.23);
      expect(TaxCalculationService.roundCurrency(10.235)).toBe(10.24);
      expect(TaxCalculationService.roundCurrency(10.236)).toBe(10.24);
    });
  });

  describe('isEUCountry', () => {
    it('should identify EU countries correctly', () => {
      expect(TaxCalculationService.isEUCountry('IT')).toBe(true);
      expect(TaxCalculationService.isEUCountry('DE')).toBe(true);
      expect(TaxCalculationService.isEUCountry('FR')).toBe(true);
      expect(TaxCalculationService.isEUCountry('US')).toBe(false);
      expect(TaxCalculationService.isEUCountry('UK')).toBe(false);
    });
  });
});
