import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TaxCalculationService, { IVA_RATES, WITHHOLDING_RATES } from '../services/taxCalculationService';
import { EnhancedKPICard } from '@features/analytics';

const TaxCalculator = () => {
  const { t } = useTranslation('transactions');
  const [amount, setAmount] = useState('100.00');
  const [ivaRate, setIvaRate] = useState(IVA_RATES.STANDARD);
  const [withholdingRate, setWithholdingRate] = useState(WITHHOLDING_RATES.NONE);
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [isExempt, setIsExempt] = useState(false);
  const [clientCountry, setClientCountry] = useState('IT');
  const [clientVatNumber, setClientVatNumber] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState('');

  // Calculate taxes whenever inputs change
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      try {
        const result = TaxCalculationService.calculateTaxes({
          amount: parseFloat(amount),
          ivaRate,
          withholdingRate,
          isReverseCharge,
          isExempt,
          clientCountry,
          clientVatNumber,
        });
        setCalculation(result);
        setError('');
      } catch (err) {
        setError(err.message);
        setCalculation(null);
      }
    }
  }, [amount, ivaRate, withholdingRate, isReverseCharge, isExempt, clientCountry, clientVatNumber]);

  const availableIvaRates = TaxCalculationService.getAvailableIvaRates();
  const availableWithholdingRates = TaxCalculationService.getAvailableWithholdingRates();

  const formatCurrency = value => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>{t('taxCalculator.title')}</h2>
        <p className='text-gray-600'>{t('taxCalculator.subtitle')}</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Input Section */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-gray-800'>
            {t('taxCalculator.calculationParameters')}
          </h3>

          {/* Base Amount */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('taxCalculator.baseAmount')}
            </label>
            <input
              type='number'
              step='0.01'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder={t('taxCalculator.baseAmountPlaceholder')}
            />
          </div>

          {/* IVA Rate */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('taxCalculator.ivaRate')}
            </label>
            <select
              value={ivaRate}
              onChange={e => setIvaRate(parseFloat(e.target.value))}
              disabled={isReverseCharge || isExempt}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
            >
              {availableIvaRates.map(rate => (
                <option key={rate.value} value={rate.value}>
                  {rate.label}
                </option>
              ))}
            </select>
          </div>

          {/* Withholding Tax */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('taxCalculator.withholdingTax')}
            </label>
            <select
              value={withholdingRate}
              onChange={e => setWithholdingRate(parseFloat(e.target.value))}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {availableWithholdingRates.map(rate => (
                <option key={rate.value} value={rate.value}>
                  {rate.label}
                </option>
              ))}
            </select>
          </div>

          {/* Special Cases */}
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-gray-700'>{t('taxCalculator.specialCases')}</h4>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={isReverseCharge}
                onChange={e => {
                  setIsReverseCharge(e.target.checked);
                  if (e.target.checked) setIsExempt(false);
                }}
                className='mr-2'
              />
              <span className='text-sm text-gray-700'>{t('taxCalculator.reverseCharge')}</span>
            </label>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={isExempt}
                onChange={e => {
                  setIsExempt(e.target.checked);
                  if (e.target.checked) setIsReverseCharge(false);
                }}
                className='mr-2'
              />
              <span className='text-sm text-gray-700'>{t('taxCalculator.exemptOperation')}</span>
            </label>
          </div>

          {/* Client Info for Reverse Charge */}
          {isReverseCharge && (
            <div className='space-y-3 p-4 bg-blue-50 rounded-md'>
              <h4 className='text-sm font-medium text-blue-800'>{t('taxCalculator.clientInfo')}</h4>

              <div>
                <label className='block text-sm font-medium text-blue-700 mb-1'>
                  {t('taxCalculator.clientCountry')}
                </label>
                <select
                  value={clientCountry}
                  onChange={e => setClientCountry(e.target.value)}
                  className='w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='IT'>{t('taxCalculator.countries.IT')}</option>
                  <option value='DE'>{t('taxCalculator.countries.DE')}</option>
                  <option value='FR'>{t('taxCalculator.countries.FR')}</option>
                  <option value='ES'>{t('taxCalculator.countries.ES')}</option>
                  <option value='NL'>{t('taxCalculator.countries.NL')}</option>
                  <option value='US'>{t('taxCalculator.countries.US')}</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-blue-700 mb-1'>
                  {t('taxCalculator.clientVatNumber')}
                </label>
                <input
                  type='text'
                  value={clientVatNumber}
                  onChange={e => setClientVatNumber(e.target.value)}
                  className='w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder={t('taxCalculator.clientVatPlaceholder')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-gray-800'>{t('taxCalculator.results')}</h3>

          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          {calculation && (
            <div className='space-y-4'>
              {/* Main Amounts */}
              <div className='p-4 bg-gray-50 rounded-md space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-700'>{t('taxCalculator.taxableAmount')}</span>
                  <span className='font-medium'>{formatCurrency(calculation.baseAmount)}</span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-700'>
                    {t('taxCalculator.vatAmount', { rate: calculation.ivaLabel })}
                  </span>
                  <span className='font-medium'>{formatCurrency(calculation.ivaAmount)}</span>
                </div>

                {calculation.withholdingAmount > 0 && (
                  <div className='flex justify-between text-red-600'>
                    <span>
                      {t('taxCalculator.withholdingAmount', { rate: calculation.withholdingLabel })}
                    </span>
                    <span className='font-medium'>
                      -{formatCurrency(calculation.withholdingAmount)}
                    </span>
                  </div>
                )}

                <hr className='my-2' />

                <div className='flex justify-between text-lg font-bold'>
                  <span>{t('taxCalculator.totalInvoice')}</span>
                  <span className='text-green-600'>{formatCurrency(calculation.totalAmount)}</span>
                </div>

                {calculation.netAmount !== calculation.totalAmount && (
                  <div className='flex justify-between text-lg font-bold text-blue-600'>
                    <span>{t('taxCalculator.netPayable')}</span>
                    <span>{formatCurrency(calculation.netAmount)}</span>
                  </div>
                )}
              </div>

              {/* Tax Notes */}
              {calculation.taxNote && (
                <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                  <h4 className='text-sm font-medium text-yellow-800 mb-1'>
                    {t('taxCalculator.taxNote')}
                  </h4>
                  <p className='text-sm text-yellow-700'>{calculation.taxNote}</p>
                </div>
              )}

              {/* Compliance Notes */}
              {calculation.complianceNotes && calculation.complianceNotes.length > 0 && (
                <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
                  <h4 className='text-sm font-medium text-blue-800 mb-2'>
                    {t('taxCalculator.complianceNotes')}
                  </h4>
                  <ul className='text-sm text-blue-700 space-y-1'>
                    {calculation.complianceNotes.map((note, index) => (
                      <li key={index} className='flex items-start'>
                        <span className='mr-2'>•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Calculation Details */}
              <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
                <h4 className='text-sm font-medium text-green-800 mb-2'>
                  {t('taxCalculator.calculationDetails')}
                </h4>
                <div className='text-sm text-green-700 space-y-1'>
                  <p>
                    • {t('taxCalculator.taxableAmount')}: {formatCurrency(calculation.baseAmount)}
                  </p>
                  <p>
                    • {t('taxCalculator.vatAmount', { rate: calculation.ivaLabel })}:{' '}
                    {(calculation.ivaRate * 100).toFixed(1)}%
                  </p>
                  {calculation.withholdingRate > 0 && (
                    <p>
                      •{' '}
                      {t('taxCalculator.withholdingAmount', { rate: calculation.withholdingLabel })}
                      : {(calculation.withholdingRate * 100).toFixed(1)}%
                    </p>
                  )}
                  <p>
                    • {t('taxCalculator.reverseCharge')}:{' '}
                    {calculation.isReverseCharge ? 'Sì' : 'No'}
                  </p>
                  <p>
                    • {t('taxCalculator.exemptOperation')}: {calculation.isExempt ? 'Sì' : 'No'}
                  </p>
                </div>
              </div>

              {/* KPIs */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <EnhancedKPICard
                  title={t('taxCalculator.effectiveIVARate')}
                  value={calculation.effectiveIvaRate}
                  format='percentage'
                  previousValue={0}
                  tooltip={t('taxCalculator.effectiveIVARateTooltip')}
                />
                <EnhancedKPICard
                  title={t('taxCalculator.withholdingIncidence')}
                  value={calculation.effectiveWithholdingRate}
                  format='percentage'
                  previousValue={0}
                  tooltip={t('taxCalculator.withholdingIncidenceTooltip')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Scenarios */}
      <div className='mt-8 p-4 bg-gray-50 rounded-md'>
        <h4 className='text-lg font-semibold text-gray-800 mb-6'>
          {t('taxCalculator.exampleScenarios')}
        </h4>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <EnhancedKPICard
            title={t('taxCalculator.standardService')}
            subtitle={t('taxCalculator.standardServiceSubtitle')}
            value={1220}
            icon='🏢'
            format='currency'
            color='blue'
            trend={{ value: 0, positive: true }}
            showTrend={false}
            className='bg-white'
          />

          <EnhancedKPICard
            title={t('taxCalculator.professionalService')}
            subtitle={t('taxCalculator.professionalServiceSubtitle')}
            value={1020}
            icon='👨‍💼'
            format='currency'
            color='purple'
            trend={{ value: 0, positive: true }}
            showTrend={false}
            className='bg-white'
          />

          <EnhancedKPICard
            title={t('taxCalculator.ueB2B')}
            subtitle={t('taxCalculator.ueB2BSubtitle')}
            value={1000}
            icon='🇪🇺'
            format='currency'
            color='green'
            trend={{ value: 0, positive: true }}
            showTrend={false}
            className='bg-white'
          />
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;
