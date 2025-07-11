/**
 * Advanced Filters Component for Reports
 * Provides sophisticated filtering and search capabilities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Calendar,
  Save,
  Trash2,
  RotateCcw,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';

const AdvancedFilters = ({
  onFiltersChange,
  initialFilters = {},
  availableFields = [],
  savedPresets = [],
  onSavePreset,
  onDeletePreset,
  className = ''
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Filter operators for different field types
  const operators = {
    text: [
      { value: 'contains', label: t('filters.contains') },
      { value: 'equals', label: t('filters.equals') },
      { value: 'startsWith', label: t('filters.startsWith') },
      { value: 'endsWith', label: t('filters.endsWith') }
    ],
    number: [
      { value: 'equals', label: t('filters.equals') },
      { value: 'greaterThan', label: t('filters.greaterThan') },
      { value: 'lessThan', label: t('filters.lessThan') },
      { value: 'between', label: t('filters.between') }
    ],
    date: [
      { value: 'equals', label: t('filters.equals') },
      { value: 'after', label: t('filters.after') },
      { value: 'before', label: t('filters.before') },
      { value: 'between', label: t('filters.between') },
      { value: 'last7days', label: t('filters.last7days') },
      { value: 'last30days', label: t('filters.last30days') },
      { value: 'thisMonth', label: t('filters.thisMonth') },
      { value: 'lastMonth', label: t('filters.lastMonth') }
    ],
    select: [
      { value: 'equals', label: t('filters.equals') },
      { value: 'in', label: t('filters.in') },
      { value: 'notIn', label: t('filters.notIn') }
    ]
  };

  // Default filter structure
  const createNewFilter = () => ({
    id: Date.now(),
    field: '',
    operator: 'contains',
    value: '',
    value2: '', // For 'between' operations
    enabled: true
  });

  // Initialize filters if empty
  useEffect(() => {
    if (!filters.conditions || filters.conditions.length === 0) {
      setFilters({
        logic: 'AND',
        conditions: [createNewFilter()]
      });
    }
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      const activeFilters = {
        ...filters,
        searchTerm,
        conditions: filters.conditions?.filter(c => c.enabled && c.field && c.value)
      };
      onFiltersChange(activeFilters);
    }
  }, [filters, searchTerm, onFiltersChange]);

  /**
   * Add new filter condition
   */
  const addFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), createNewFilter()]
    }));
  }, []);

  /**
   * Remove filter condition
   */
  const removeFilter = useCallback((filterId) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.filter(f => f.id !== filterId)
    }));
  }, []);

  /**
   * Update filter condition
   */
  const updateFilter = useCallback((filterId, updates) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.map(f => 
        f.id === filterId ? { ...f, ...updates } : f
      )
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      logic: 'AND',
      conditions: [createNewFilter()]
    });
    setSearchTerm('');
    setActivePreset(null);
  }, []);

  /**
   * Apply saved preset
   */
  const applyPreset = useCallback((preset) => {
    setFilters(preset.filters);
    setSearchTerm(preset.searchTerm || '');
    setActivePreset(preset.id);
  }, []);

  /**
   * Save current filters as preset
   */
  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;
    
    const preset = {
      id: Date.now(),
      name: presetName,
      filters,
      searchTerm,
      createdAt: new Date().toISOString()
    };
    
    if (onSavePreset) {
      onSavePreset(preset);
    }
    
    setPresetName('');
    setShowSaveDialog(false);
    setActivePreset(preset.id);
  }, [presetName, filters, searchTerm, onSavePreset]);

  /**
   * Get available operators for field type
   */
  const getOperatorsForField = useCallback((fieldName) => {
    const field = availableFields.find(f => f.name === fieldName);
    return operators[field?.type || 'text'] || operators.text;
  }, [availableFields]);

  /**
   * Render filter condition
   */
  const renderFilterCondition = useCallback((condition, index) => {
    const field = availableFields.find(f => f.name === condition.field);
    const fieldOperators = getOperatorsForField(condition.field);
    const needsSecondValue = ['between'].includes(condition.operator);

    return (
      <div key={condition.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        {/* Logic operator (AND/OR) */}
        {index > 0 && (
          <select
            value={filters.logic}
            onChange={(e) => setFilters(prev => ({ ...prev, logic: e.target.value }))}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="AND">{t('filters.and')}</option>
            <option value="OR">{t('filters.or')}</option>
          </select>
        )}

        {/* Field selection */}
        <select
          value={condition.field}
          onChange={(e) => updateFilter(condition.id, { 
            field: e.target.value,
            operator: getOperatorsForField(e.target.value)[0]?.value || 'contains'
          })}
          className="px-3 py-2 border rounded-md min-w-[150px]"
        >
          <option value="">{t('filters.selectField')}</option>
          {availableFields.map(field => (
            <option key={field.name} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>

        {/* Operator selection */}
        <select
          value={condition.operator}
          onChange={(e) => updateFilter(condition.id, { operator: e.target.value })}
          className="px-3 py-2 border rounded-md min-w-[120px]"
          disabled={!condition.field}
        >
          {fieldOperators.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Value input */}
        {field?.type === 'select' ? (
          <select
            value={condition.value}
            onChange={(e) => updateFilter(condition.id, { value: e.target.value })}
            className="px-3 py-2 border rounded-md min-w-[150px]"
          >
            <option value="">{t('filters.selectValue')}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field?.type === 'date' ? (
          <input
            type="date"
            value={condition.value}
            onChange={(e) => updateFilter(condition.id, { value: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        ) : (
          <input
            type={field?.type === 'number' ? 'number' : 'text'}
            value={condition.value}
            onChange={(e) => updateFilter(condition.id, { value: e.target.value })}
            placeholder={t('filters.enterValue')}
            className="px-3 py-2 border rounded-md min-w-[150px]"
          />
        )}

        {/* Second value for 'between' operations */}
        {needsSecondValue && (
          <>
            <span className="text-gray-500">{t('filters.and')}</span>
            {field?.type === 'date' ? (
              <input
                type="date"
                value={condition.value2}
                onChange={(e) => updateFilter(condition.id, { value2: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
            ) : (
              <input
                type={field?.type === 'number' ? 'number' : 'text'}
                value={condition.value2}
                onChange={(e) => updateFilter(condition.id, { value2: e.target.value })}
                placeholder={t('filters.enterSecondValue')}
                className="px-3 py-2 border rounded-md min-w-[150px]"
              />
            )}
          </>
        )}

        {/* Enable/disable toggle */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={condition.enabled}
            onChange={(e) => updateFilter(condition.id, { enabled: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">{t('filters.enabled')}</span>
        </label>

        {/* Remove filter */}
        <button
          onClick={() => removeFilter(condition.id)}
          className="p-1 text-red-500 hover:bg-red-50 rounded"
          disabled={filters.conditions?.length <= 1}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }, [availableFields, filters.logic, getOperatorsForField, updateFilter, removeFilter, t]);

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">{t('reports.advancedFilters')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? t('filters.hideAdvanced') : t('filters.showAdvanced')}
          </button>
        </div>
      </div>

      {/* Quick search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('filters.quickSearch')}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Saved presets */}
      {savedPresets.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('filters.savedPresets')}
          </label>
          <div className="flex flex-wrap gap-2">
            {savedPresets.map(preset => (
              <div key={preset.id} className="flex items-center">
                <button
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1 text-sm rounded-l border ${
                    activePreset === preset.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => onDeletePreset && onDeletePreset(preset.id)}
                  className="px-2 py-1 text-red-500 border border-l-0 border-gray-300 rounded-r hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {t('filters.conditions')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={addFilter}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                {t('filters.addCondition')}
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                {t('filters.clear')}
              </button>
            </div>
          </div>

          {/* Filter conditions */}
          <div className="space-y-2">
            {filters.conditions?.map((condition, index) => 
              renderFilterCondition(condition, index)
            )}
          </div>

          {/* Save preset */}
          <div className="flex items-center gap-2 pt-3 border-t">
            {showSaveDialog ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t('filters.presetName')}
                  className="flex-1 px-3 py-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                />
                <button
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                {t('filters.saveAsPreset')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;