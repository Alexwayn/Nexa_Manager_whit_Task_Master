import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeftIcon, 
  DocumentChartBarIcon, 
  ViewfinderCircleIcon, 
  DocumentArrowDownIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  TableCellsIcon,
  EyeIcon,
  CogIcon,
  BookmarkIcon,
  FunnelIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AVAILABLE_FIELDS, CHART_PRESETS } from '../../data/reportTemplates';

const CustomReportBuilder = ({ onBack, initialTemplate = null }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [reportConfig, setReportConfig] = useState({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    category: initialTemplate?.category || 'custom',
    type: initialTemplate?.type || 'detailed',
    format: initialTemplate?.format || 'mixed',
    
    // Data Configuration
    selectedFields: initialTemplate?.selectedFields || [],
    filters: initialTemplate?.filters || [],
    dateRange: initialTemplate?.dateRange || { 
      preset: 'this_month',
      start: '',
      end: ''
    },
    sorting: initialTemplate?.sorting || [],
    
    // Layout Configuration
    sections: initialTemplate?.sections || [],
    
    // Preview Data
    previewData: null,
    isGenerating: false
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Steps configuration
  const steps = [
    { id: 1, name: 'Data Selection', icon: TableCellsIcon },
    { id: 2, name: 'Filters & Sorting', icon: FunnelIcon },
    { id: 3, name: 'Layout Design', icon: AdjustmentsHorizontalIcon },
    { id: 4, name: 'Preview & Save', icon: EyeIcon }
  ];

  // Get all available fields from all categories
  const allAvailableFields = Object.entries(AVAILABLE_FIELDS).reduce((acc, [category, fields]) => {
    acc[category] = fields.map(field => ({ ...field, category }));
    return acc;
  }, {});

  // Handle field selection
  const handleFieldToggle = (field) => {
    setReportConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.find(f => f.id === field.id)
        ? prev.selectedFields.filter(f => f.id !== field.id)
        : [...prev.selectedFields, field]
    }));
  };

  // Handle drag and drop for layout sections
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReportConfig(prev => {
        const oldIndex = prev.sections.findIndex(section => section.id === active.id);
        const newIndex = prev.sections.findIndex(section => section.id === over.id);

        return {
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex)
        };
      });
    }
  };

  // Add filter
  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: 'equals',
      value: '',
      type: 'string'
    };
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  // Update filter
  const updateFilter = (filterId, updates) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    }));
  };

  // Remove filter
  const removeFilter = (filterId) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId)
    }));
  };

  // Add section to layout
  const addSection = (type) => {
    const newSection = {
      id: Date.now(),
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      type: type,
      order: reportConfig.sections.length + 1,
      config: getDefaultSectionConfig(type)
    };
    
    setReportConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  // Get default configuration for section type
  const getDefaultSectionConfig = (type) => {
    switch (type) {
      case 'kpi':
        return { metrics: [] };
      case 'chart':
        return { 
          chartType: 'bar',
          xField: '',
          yField: '',
          title: 'Chart Title'
        };
      case 'table':
        return { 
          columns: reportConfig.selectedFields.slice(0, 5).map(f => f.id),
          sortBy: '',
          sortDirection: 'asc'
        };
      default:
        return {};
    }
  };

  // Generate preview data
  const generatePreview = async () => {
    setReportConfig(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockData();
      setReportConfig(prev => ({
        ...prev,
        previewData: mockData,
        isGenerating: false
      }));
    }, 1500);
  };

  // Generate mock data for preview
  const generateMockData = () => {
    // This would normally come from the reporting service
    return {
      rows: 25,
      columns: reportConfig.selectedFields.length,
      sampleData: reportConfig.selectedFields.slice(0, 5).map(field => ({
        field: field.name,
        sampleValue: getSampleValue(field.type)
      }))
    };
  };

  const getSampleValue = (type) => {
    switch (type) {
      case 'currency': return '€1,234.56';
      case 'percentage': return '24.5%';
      case 'date': return '2024-01-15';
      case 'number': return '42';
      case 'boolean': return 'Yes';
      default: return 'Sample Value';
    }
  };

  // Sortable Section Component
  const SortableSection = ({ section }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move'
      >
        <div className='flex items-center justify-between mb-3'>
          <h4 className='font-medium text-gray-900'>{section.title}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            section.type === 'kpi' ? 'bg-purple-100 text-purple-800' :
            section.type === 'chart' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {section.type.toUpperCase()}
          </span>
        </div>
        
        <div className='text-sm text-gray-600'>
          Section configuration options would go here based on type.
        </div>
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDataSelection();
      case 2:
        return renderFiltersAndSorting();
      case 3:
        return renderLayoutDesign();
      case 4:
        return renderPreviewAndSave();
      default:
        return null;
    }
  };

  // Step 1: Data Selection
  const renderDataSelection = () => (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
      {/* Available Fields */}
      <div className='lg:col-span-2'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Available Fields</h3>
        <div className='space-y-6'>
          {Object.entries(allAvailableFields).map(([category, fields]) => (
            <div key={category} className='bg-gray-50 rounded-lg p-4'>
              <h4 className='font-medium text-gray-700 mb-3 capitalize'>
                {category} Fields ({fields.length})
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                {fields.map(field => (
                  <label key={field.id} className='flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer transition-colors'>
                    <input 
                      type='checkbox' 
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      checked={reportConfig.selectedFields.some(f => f.id === field.id)}
                      onChange={() => handleFieldToggle(field)}
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-gray-900'>{field.name}</div>
                      <div className='text-xs text-gray-500'>
                        {field.type} {field.aggregatable && '• Aggregatable'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Fields */}
      <div className='lg:col-span-1'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Selected Fields ({reportConfig.selectedFields.length})
        </h3>
        <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
          {reportConfig.selectedFields.length > 0 ? (
            <div className='space-y-2'>
              {reportConfig.selectedFields.map(field => (
                <div key={field.id} className='flex items-center justify-between bg-white p-2 rounded'>
                  <div>
                    <div className='text-sm font-medium text-gray-900'>{field.name}</div>
                    <div className='text-xs text-gray-500'>{field.type}</div>
                  </div>
                  <button
                    onClick={() => handleFieldToggle(field)}
                    className='text-red-500 hover:text-red-700'
                  >
                    <TrashIcon className='h-4 w-4' />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-blue-600 text-sm'>No fields selected yet. Choose from the left panel.</p>
          )}
        </div>
      </div>
    </div>
  );

  // Step 2: Filters and Sorting
  const renderFiltersAndSorting = () => (
    <div className='space-y-8'>
      {/* Basic Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Report Name</label>
          <input
            type='text'
            value={reportConfig.name}
            onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Enter report name...'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Category</label>
          <select
            value={reportConfig.category}
            onChange={(e) => setReportConfig(prev => ({ ...prev, category: e.target.value }))}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='custom'>Custom</option>
            <option value='financial'>Financial</option>
            <option value='client'>Client</option>
            <option value='tax'>Tax & Compliance</option>
            <option value='operational'>Operational</option>
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Date Range</h3>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Preset</label>
              <select
                value={reportConfig.dateRange.preset}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, preset: e.target.value }
                }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='today'>Today</option>
                <option value='yesterday'>Yesterday</option>
                <option value='this_week'>This Week</option>
                <option value='last_week'>Last Week</option>
                <option value='this_month'>This Month</option>
                <option value='last_month'>Last Month</option>
                <option value='this_quarter'>This Quarter</option>
                <option value='this_year'>This Year</option>
                <option value='custom'>Custom Range</option>
              </select>
            </div>
            {reportConfig.dateRange.preset === 'custom' && (
              <>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Start Date</label>
                  <input
                    type='date'
                    value={reportConfig.dateRange.start}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>End Date</label>
                  <input
                    type='date'
                    value={reportConfig.dateRange.end}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Filters</h3>
          <button
            onClick={addFilter}
            className='flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <PlusIcon className='h-4 w-4 mr-2' />
            Add Filter
          </button>
        </div>
        
        <div className='space-y-3'>
          {reportConfig.filters.map(filter => (
            <div key={filter.id} className='bg-gray-50 rounded-lg p-4 flex items-center gap-4'>
              <select
                value={filter.field}
                onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>Select Field</option>
                {reportConfig.selectedFields.map(field => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
              
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='equals'>Equals</option>
                <option value='not_equals'>Not Equals</option>
                <option value='contains'>Contains</option>
                <option value='greater_than'>Greater Than</option>
                <option value='less_than'>Less Than</option>
                <option value='between'>Between</option>
              </select>
              
              <input
                type='text'
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder='Filter value...'
                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
              
              <button
                onClick={() => removeFilter(filter.id)}
                className='p-2 text-red-500 hover:text-red-700 transition-colors'
              >
                <TrashIcon className='h-4 w-4' />
              </button>
            </div>
          ))}
          
          {reportConfig.filters.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              No filters added yet. Click "Add Filter" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Layout Design
  const renderLayoutDesign = () => (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>Report Layout</h3>
        <div className='flex gap-2'>
          <button
            onClick={() => addSection('kpi')}
            className='flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            <PlusIcon className='h-4 w-4 mr-2' />
            Add KPI Section
          </button>
          <button
            onClick={() => addSection('chart')}
            className='flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            <ChartBarIcon className='h-4 w-4 mr-2' />
            Add Chart
          </button>
          <button
            onClick={() => addSection('table')}
            className='flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <TableCellsIcon className='h-4 w-4 mr-2' />
            Add Table
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={reportConfig.sections.map(section => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-4'>
            {reportConfig.sections.map((section) => (
              <SortableSection key={section.id} section={section} />
            ))}
            
            {reportConfig.sections.length === 0 && (
              <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
                <AdjustmentsHorizontalIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900 mb-2'>No sections added yet</h4>
                <p className='text-gray-600 mb-4'>Add KPI, chart, or table sections to build your report layout.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  // Step 4: Preview and Save
  const renderPreviewAndSave = () => (
    <div className='space-y-8'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Report Preview</h3>
        
        {!reportConfig.previewData ? (
          <div className='bg-gray-50 rounded-lg p-8'>
            <DocumentChartBarIcon className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-gray-900 mb-2'>Ready to Preview</h4>
            <p className='text-gray-600 mb-6'>
              Generate a preview of your report with the current configuration.
            </p>
            <button
              onClick={generatePreview}
              disabled={reportConfig.isGenerating}
              className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {reportConfig.isGenerating ? 'Generating Preview...' : 'Generate Preview'}
            </button>
          </div>
        ) : (
          <div className='bg-white border border-gray-200 rounded-lg p-6'>
            <h4 className='font-medium text-gray-900 mb-4'>Preview Results</h4>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>{reportConfig.previewData.rows}</div>
                <div className='text-sm text-blue-800'>Total Rows</div>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>{reportConfig.previewData.columns}</div>
                <div className='text-sm text-green-800'>Columns</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>{reportConfig.sections.length}</div>
                <div className='text-sm text-purple-800'>Sections</div>
              </div>
            </div>
            
            <div className='text-left'>
              <h5 className='font-medium text-gray-900 mb-2'>Sample Data Preview:</h5>
              <div className='bg-gray-50 rounded p-3 text-sm space-y-1'>
                {reportConfig.previewData.sampleData.map((item, index) => (
                  <div key={index} className='flex justify-between'>
                    <span className='font-medium text-gray-700'>{item.field}:</span>
                    <span className='text-gray-600'>{item.sampleValue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Options */}
      <div className='bg-gray-50 rounded-lg p-6'>
        <h4 className='font-medium text-gray-900 mb-4'>Save Options</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <button className='flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
            <BookmarkIcon className='h-5 w-5 mr-2' />
            Save as Template
          </button>
          <button className='flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
            <DocumentArrowDownIcon className='h-5 w-5 mr-2' />
            Generate & Export
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      {/* Header */}
      <button onClick={onBack} className='flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors'>
        <ArrowLeftIcon className='h-4 w-4 mr-2' />
        Back to Reports Dashboard
      </button>

      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-gray-800'>Custom Report Builder</h2>
        <p className='mt-1 text-gray-600'>
          Create a custom report by selecting data fields, applying filters, and designing the layout.
        </p>
      </div>

      {/* Step Navigation */}
      <div className='mb-8'>
        <nav className='flex space-x-8'>
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentStep === step.id 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${currentStep === step.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{step.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Step Content */}
      <div className='mb-8'>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-between pt-6 border-t border-gray-200'>
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className='flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <ArrowLeftIcon className='h-4 w-4 mr-2' />
          Previous
        </button>

        <div className='flex space-x-3'>
          <span className='text-sm text-gray-500 self-center'>
            Step {currentStep} of {steps.length}
          </span>
        </div>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          disabled={currentStep === steps.length}
          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Next
          <ArrowLeftIcon className='h-4 w-4 ml-2 rotate-180' />
        </button>
      </div>
    </div>
  );
};

export default CustomReportBuilder;