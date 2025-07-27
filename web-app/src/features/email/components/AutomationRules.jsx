import React, { useState } from 'react';
import {
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useEmailAutomation } from '@features/email';

const AutomationRules = () => {
  const { rules, loading, createRule, updateRule, deleteRule, toggleRule } = useEmailAutomation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());

  const ruleTypes = [
    { value: 'filter', label: 'Filter & Label', description: 'Automatically label emails based on criteria' },
    { value: 'forward', label: 'Forward', description: 'Forward emails to another address' },
    { value: 'move', label: 'Move to Folder', description: 'Move emails to a specific folder' },
    { value: 'mark_read', label: 'Mark as Read', description: 'Automatically mark emails as read' },
    { value: 'star', label: 'Star Important', description: 'Star emails that match criteria' },
    { value: 'auto_reply', label: 'Auto Reply', description: 'Send automatic replies' },
    { value: 'delete', label: 'Delete', description: 'Delete emails that match criteria' }
  ];

  const conditionFields = [
    { value: 'from', label: 'From' },
    { value: 'to', label: 'To' },
    { value: 'subject', label: 'Subject' },
    { value: 'body', label: 'Body' },
    { value: 'has_attachments', label: 'Has Attachments' }
  ];

  const operators = [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' }
  ];

  const toggleExpanded = (ruleId) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const handleToggleRule = async (ruleId, isActive) => {
    try {
      await toggleRule(ruleId, isActive);
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this automation rule?')) {
      try {
        await deleteRule(ruleId);
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const formatConditions = (conditions) => {
    if (!conditions || conditions.length === 0) return 'No conditions';
    
    return conditions.map(condition => {
      const field = conditionFields.find(f => f.value === condition.field)?.label || condition.field;
      const operator = operators.find(o => o.value === condition.operator)?.label || condition.operator;
      return `${field} ${operator} "${condition.value}"`;
    }).join(' AND ');
  };

  const formatActions = (actions) => {
    if (!actions || actions.length === 0) return 'No actions';
    
    return actions.map(action => {
      const actionType = ruleTypes.find(t => t.value === action.type)?.label || action.type;
      return action.value ? `${actionType}: ${action.value}` : actionType;
    }).join(', ');
  };

  if (loading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CogIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Rule</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No automation rules</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first automation rule to automatically manage your emails.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Rule
              </button>
            </div>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`border rounded-lg p-4 ${
                rule.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleExpanded(rule.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedRules.has(rule.id) ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {rule.is_active ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rule.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => handleToggleRule(rule.id, !rule.is_active)}
                    className={`p-1 rounded ${
                      rule.is_active 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={rule.is_active ? 'Disable rule' : 'Enable rule'}
                  >
                    <PowerIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit rule"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete rule"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedRules.has(rule.id) && (
                <div className="mt-4 pl-8 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Conditions:</h4>
                    <p className="text-sm text-gray-600">{formatConditions(rule.conditions)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Actions:</h4>
                    <p className="text-sm text-gray-600">{formatActions(rule.actions)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Priority: {rule.priority}</span>
                    <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Rule Modal */}
      {(showCreateForm || editingRule) && (
        <RuleFormModal
          rule={editingRule}
          isOpen={showCreateForm || !!editingRule}
          onClose={() => {
            setShowCreateForm(false);
            setEditingRule(null);
          }}
          onSave={async (ruleData) => {
            try {
              if (editingRule) {
                await updateRule(editingRule.id, ruleData);
              } else {
                await createRule(ruleData);
              }
              setShowCreateForm(false);
              setEditingRule(null);
            } catch (error) {
              console.error('Failed to save rule:', error);
            }
          }}
          ruleTypes={ruleTypes}
          conditionFields={conditionFields}
          operators={operators}
        />
      )}
    </div>
  );
};

// Rule Form Modal Component
const RuleFormModal = ({ 
  rule, 
  isOpen, 
  onClose, 
  onSave, 
  ruleTypes, 
  conditionFields, 
  operators 
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    isActive: rule?.is_active !== false,
    priority: rule?.priority || 1,
    conditions: rule?.conditions || [{ field: 'from', operator: 'contains', value: '' }],
    actions: rule?.actions || [{ type: 'label', value: '' }]
  });

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'from', operator: 'contains', value: '' }]
    }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'label', value: '' }]
    }));
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {rule ? 'Edit Automation Rule' : 'Create Automation Rule'}
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Enable this rule immediately
              </label>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Conditions</h4>
                <button
                  type="button"
                  onClick={addCondition}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Condition
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {conditionFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {operators.map(operator => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {formData.conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Actions</h4>
                <button
                  type="button"
                  onClick={addAction}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Action
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.actions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ruleTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={action.value}
                      onChange={(e) => updateAction(index, 'value', e.target.value)}
                      placeholder="Value (e.g., folder name, label, email address)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {formData.actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutomationRules;