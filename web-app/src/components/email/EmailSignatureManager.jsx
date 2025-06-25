import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import emailSignatureService from '@lib/emailSignatureService';

const EmailSignatureManager = () => {
  const [signatures, setSignatures] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSignature, setEditingSignature] = useState(null);
  const [previewSignature, setPreviewSignature] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');

  const [signatureForm, setSignatureForm] = useState({
    name: '',
    template_type: 'professional',
    variables: {
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      website: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [signaturesResult, templatesResult] = await Promise.all([
        emailSignatureService.getSignatures(),
        emailSignatureService.getTemplates()
      ]);

      if (signaturesResult.success) {
        setSignatures(signaturesResult.data);
      }

      if (templatesResult.success) {
        setTemplates(templatesResult.data);
      }
    } catch (error) {
      console.error('Error loading signature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSignature = async () => {
    if (!signatureForm.name.trim()) {
      alert('Please enter a signature name');
      return;
    }

    setLoading(true);
    try {
      const template = templates.find(t => t.id === signatureForm.template_type);
      if (!template) {
        alert('Invalid template selected');
        return;
      }

      const signatureData = {
        name: signatureForm.name,
        html_content: template.html,
        variables: signatureForm.variables,
        template_type: signatureForm.template_type,
        is_default: signatures.length === 0 // First signature is default
      };

      const result = await emailSignatureService.createSignature(signatureData);

      if (result.success) {
        setSignatures(prev => [...prev, result.data]);
        resetForm();
        setShowCreateModal(false);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (signature) => {
    setPreviewSignature(signature);
    setShowPreviewModal(true);
  };

  const resetForm = () => {
    setSignatureForm({
      name: '',
      template_type: 'professional',
      variables: {
        name: '',
        title: '',
        company: '',
        email: '',
        phone: '',
        website: ''
      }
    });
    setEditingSignature(null);
  };

  const updateFormVariable = (key, value) => {
    setSignatureForm(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value
      }
    }));
  };

  const generatePreviewHtml = () => {
    if (!selectedTemplate) return '';
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return '';

    return emailSignatureService.generateSignatureHtml(
      { html_content: template.html, variables: signatureForm.variables },
      signatureForm.variables
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Signatures</h2>
          <p className="text-gray-600">Manage your email signatures and branding</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Signature
        </button>
      </div>

      {/* Signatures List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading signatures...</p>
        </div>
      ) : signatures.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures yet</h3>
          <p className="text-gray-600 mb-4">Create your first email signature to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Signature
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signatures.map((signature) => (
            <div key={signature.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">{signature.name}</h3>
                    {signature.is_default && (
                      <StarIconSolid className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 capitalize">
                    {signature.template_type} template
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded p-2 mb-3 bg-gray-50 max-h-24 overflow-hidden">
                <div 
                  className="text-xs"
                  dangerouslySetInnerHTML={{ 
                    __html: emailSignatureService.generateSignatureHtml(signature) 
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(signature)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingSignature(signature);
                      setSignatureForm({
                        name: signature.name,
                        template_type: signature.template_type,
                        variables: signature.variables
                      });
                      setShowCreateModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      // Handle duplicate
                      alert('Duplicate functionality would clone this signature');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex space-x-2">
                  {!signature.is_default && (
                    <button
                      onClick={() => {
                        // Handle set as default
                        alert('Set as default functionality');
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-500"
                      title="Set as default"
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this signature?')) {
                        // Handle delete
                        alert('Delete functionality would remove this signature');
                      }
                    }}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium">
                {editingSignature ? 'Edit Signature' : 'Create New Signature'}
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature Name
                  </label>
                  <input
                    type="text"
                    value={signatureForm.name}
                    onChange={(e) => setSignatureForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Professional Signature"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={signatureForm.template_type}
                    onChange={(e) => {
                      setSignatureForm(prev => ({ ...prev, template_type: e.target.value }));
                      setSelectedTemplate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variables */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Signature Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signatureForm.variables.name}
                      onChange={(e) => updateFormVariable('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={signatureForm.variables.title}
                      onChange={(e) => updateFormVariable('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senior Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={signatureForm.variables.company}
                      onChange={(e) => updateFormVariable('company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={signatureForm.variables.email}
                      onChange={(e) => updateFormVariable('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@acme.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={signatureForm.variables.phone}
                      onChange={(e) => updateFormVariable('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={signatureForm.variables.website}
                      onChange={(e) => updateFormVariable('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://acme.com"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Preview</h4>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreateSignature}
                disabled={loading || !signatureForm.name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingSignature ? 'Update Signature' : 'Create Signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium">Signature Preview</h3>
              <p className="text-gray-600">{previewSignature.name}</p>
            </div>

            <div className="p-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: emailSignatureService.generateSignatureHtml(previewSignature) 
                  }}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSignatureManager; 