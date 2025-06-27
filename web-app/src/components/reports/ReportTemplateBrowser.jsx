import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  HeartIcon, 
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { 
  CORE_REPORT_TEMPLATES, 
  getTemplatesByCategory, 
  getAvailableCategories 
} from '../../data/reportTemplates';

const ReportTemplateBrowser = ({ onBack, onSelectTemplate, onCreateCustom }) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteTemplates, setFavoriteTemplates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Icon mapping for templates
  const iconMap = {
    ChartBarIcon: ChartBarIcon,
    UsersIcon: UsersIcon,
    DocumentTextIcon: DocumentTextIcon,
    HeartIcon: HeartIcon,
    CreditCardIcon: CreditCardIcon
  };

  // Color classes for template cards
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
    orange: 'border-orange-200 bg-orange-50 text-orange-800'
  };

  // Filter templates based on category and search
  const filteredTemplates = CORE_REPORT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Handle favorite toggle
  const toggleFavorite = (templateId) => {
    setFavoriteTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  // Category stats
  const categories = getAvailableCategories();
  const categoryStats = categories.reduce((acc, category) => {
    acc[category] = getTemplatesByCategory(category).length;
    return acc;
  }, {});

  const getCategoryIcon = (category) => {
    const icons = {
      financial: ChartBarIcon,
      client: UsersIcon,
      tax: DocumentTextIcon,
      operational: HeartIcon
    };
    return icons[category] || ChartBarIcon;
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      {/* Header with back button */}
      <button 
        onClick={onBack} 
        className='flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors'
      >
        <ArrowLeftIcon className='h-4 w-4 mr-2' />
        Back to Reports Dashboard
      </button>

      {/* Title and Description */}
      <div className='mb-6'>
        <h2 className='text-2xl font-semibold text-gray-800'>Report Templates</h2>
        <p className='mt-1 text-gray-600'>
          Choose from pre-built report templates or create your own custom report.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className='flex flex-col md:flex-row gap-4 mb-6'>
        {/* Search Input */}
        <div className='relative flex-1'>
          <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
          <input
            type='text'
            placeholder='Search templates by name, description, or tags...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className='h-5 w-5 mr-2' />
          Filters
        </button>

        {/* Create Custom Button */}
        <button
          onClick={onCreateCustom}
          className='bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium'
        >
          Create Custom Report
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='bg-gray-50 rounded-lg p-4 mb-6'>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>Filter by Category</h3>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All ({CORE_REPORT_TEMPLATES.length})
            </button>
            {categories.map(category => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Icon className='h-4 w-4 mr-1' />
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryStats[category]})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className='mb-4'>
        <p className='text-sm text-gray-600'>
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Template Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredTemplates.map(template => {
          const Icon = iconMap[template.icon] || ChartBarIcon;
          const isFavorite = favoriteTemplates.includes(template.id);
          
          return (
            <div
              key={template.id}
              className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group relative'
            >
              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(template.id);
                }}
                className='absolute top-4 right-4 p-1 text-gray-400 hover:text-yellow-500 transition-colors'
              >
                {isFavorite ? (
                  <StarIconSolid className='h-5 w-5 text-yellow-500' />
                ) : (
                  <StarIcon className='h-5 w-5' />
                )}
              </button>

              {/* Template Icon */}
              <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[template.color]}`}>
                <Icon className='h-8 w-8' />
              </div>

              {/* Template Info */}
              <h3 className='text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
                {template.name}
              </h3>
              
              <p className='text-sm text-gray-600 mb-4 line-clamp-3'>
                {template.description}
              </p>

              {/* Tags */}
              <div className='flex flex-wrap gap-1 mb-4'>
                {template.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Category Badge */}
              <div className='flex items-center justify-between'>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  template.category === 'financial' ? 'bg-blue-100 text-blue-800' :
                  template.category === 'client' ? 'bg-green-100 text-green-800' :
                  template.category === 'tax' ? 'bg-red-100 text-red-800' :
                  template.category === 'operational' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.category}
                </span>

                {/* Use Template Button */}
                <button
                  onClick={() => onSelectTemplate(template)}
                  className='flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100'
                >
                  <PlayIcon className='h-4 w-4 mr-1' />
                  Use Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className='text-center py-12'>
          <MagnifyingGlassIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No templates found</h3>
          <p className='text-gray-600 mb-4'>
            {searchTerm 
              ? `No templates match your search "${searchTerm}"`
              : `No templates available in the ${selectedCategory} category`
            }
          </p>
          <div className='space-y-2'>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Clear filters
            </button>
            <div className='text-gray-400'>or</div>
            <button
              onClick={onCreateCustom}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
            >
              Create your own custom report
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Footer */}
      {filteredTemplates.length > 0 && (
        <div className='mt-8 pt-6 border-t border-gray-200'>
          <div className='flex flex-wrap justify-center gap-8 text-sm text-gray-600'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>{CORE_REPORT_TEMPLATES.length}</div>
              <div>Total Templates</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>{categories.length}</div>
              <div>Categories</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>{favoriteTemplates.length}</div>
              <div>Favorites</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTemplateBrowser; 