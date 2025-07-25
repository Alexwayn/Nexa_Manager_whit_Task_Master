// Document metadata form component for categorization and tagging
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TagIcon, UserIcon, FolderIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import clientService from '@/lib/clientService';
import type { ProcessedDocument } from '@/types/scanner';

interface DocumentMetadataFormProps {
  document: ProcessedDocument;
  onSave: (document: ProcessedDocument) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  clientId: string;
  projectId: string;
}

const DOCUMENT_CATEGORIES = [
  { value: 'invoice', label: 'Invoice', icon: DocumentTextIcon },
  { value: 'receipt', label: 'Receipt', icon: DocumentTextIcon },
  { value: 'contract', label: 'Contract', icon: DocumentTextIcon },
  { value: 'quote', label: 'Quote', icon: DocumentTextIcon },
  { value: 'business-card', label: 'Business Card', icon: UserIcon },
  { value: 'id-document', label: 'ID Document', icon: UserIcon },
  { value: 'report', label: 'Report', icon: FolderIcon },
  { value: 'letter', label: 'Letter', icon: DocumentTextIcon },
  { value: 'form', label: 'Form', icon: DocumentTextIcon },
  { value: 'other', label: 'Other', icon: DocumentTextIcon }
];

const COMMON_TAGS = [
  'urgent', 'important', 'tax', 'expense', 'income', 'legal', 'personal', 
  'business', 'financial', 'medical', 'insurance', 'warranty', 'reference'
];

const DocumentMetadataForm: React.FC<DocumentMetadataFormProps> = ({
  document,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<FormData>({
    defaultValues: {
      title: document.title || '',
      description: document.description || '',
      category: document.category || 'other',
      tags: document.tags || [],
      clientId: document.clientId || '',
      projectId: document.projectId || ''
    }
  });

  const watchedTags = watch('tags');
  const watchedClientId = watch('clientId');

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load projects when client changes
  useEffect(() => {
    if (watchedClientId) {
      loadProjects(watchedClientId);
    } else {
      setProjects([]);
    }
  }, [watchedClientId]);

  // Update suggested tags based on category and existing tags
  useEffect(() => {
    const category = watch('category');
    const currentTags = watchedTags || [];
    
    let categoryTags: string[] = [];
    switch (category) {
      case 'invoice':
      case 'receipt':
        categoryTags = ['expense', 'financial', 'tax'];
        break;
      case 'contract':
        categoryTags = ['legal', 'business', 'important'];
        break;
      case 'quote':
        categoryTags = ['business', 'financial'];
        break;
      case 'business-card':
        categoryTags = ['contact', 'business', 'reference'];
        break;
      case 'id-document':
        categoryTags = ['personal', 'important', 'reference'];
        break;
      default:
        categoryTags = [];
    }

    const suggested = [...categoryTags, ...COMMON_TAGS]
      .filter(tag => !currentTags.includes(tag))
      .slice(0, 8);

    setSuggestedTags(suggested);
  }, [watch('category'), watchedTags]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const result = await clientService.getClients({
        limit: 100,
        sortBy: 'full_name',
        ascending: true
      });

      if (result.data) {
        setClients(Array.isArray(result.data) ? result.data : [result.data]);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadProjects = async (clientId: string) => {
    // TODO: Implement project loading when project service is available
    // For now, we'll use mock data
    setProjects([
      { id: 'proj1', name: 'Project Alpha', client_id: clientId },
      { id: 'proj2', name: 'Project Beta', client_id: clientId }
    ]);
  };

  const addTag = (tag: string) => {
    const currentTags = watchedTags || [];
    if (!currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag], { shouldDirty: true });
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watchedTags || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase());
    }
  };

  const onSubmit = (data: FormData) => {
    const updatedDocument: ProcessedDocument = {
      ...document,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      clientId: data.clientId || undefined,
      projectId: data.projectId || undefined,
      updatedAt: new Date()
    };

    onSave(updatedDocument);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add metadata to organize and categorize your document
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="title"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter document title"
              />
            )}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional description"
              />
            )}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <Controller
            name="category"
            control={control}
            rules={{ required: 'Category is required' }}
            render={({ field }) => (
              <select
                {...field}
                id="category"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Client Selection */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="clientId"
                disabled={loadingClients}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">Select a client (optional)</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName || client.full_name}
                  </option>
                ))}
              </select>
            )}
          />
          {loadingClients && (
            <p className="mt-1 text-sm text-gray-500">Loading clients...</p>
          )}
        </div>

        {/* Project Selection */}
        {watchedClientId && (
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
              Project
            </label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="projectId"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a project (optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          
          {/* Current Tags */}
          {watchedTags && watchedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {watchedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="mt-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="Type a tag and press Enter"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentMetadataForm;