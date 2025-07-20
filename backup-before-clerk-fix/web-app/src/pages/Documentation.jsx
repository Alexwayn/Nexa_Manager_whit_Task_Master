import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Book, Code, Download, ExternalLink, ChevronRight, Play } from 'lucide-react';

const Documentation = () => {
  const { t } = useTranslation('documentation');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', name: t('categories.getting-started'), icon: '🚀' },
    { id: 'user-guide', name: t('categories.user-guide'), icon: '📖' },
    { id: 'api', name: t('categories.api'), icon: '⚡' },
    { id: 'integrations', name: t('categories.integrations'), icon: '🔗' },
    { id: 'advanced', name: t('categories.advanced'), icon: '⚙️' },
  ];

  const documentationData = {
    'getting-started': [
      {
        key: 'initial-setup',
        type: 'guide',
      },
      {
        key: 'dashboard-overview',
        type: 'tutorial',
      },
    ],
    'user-guide': [
      { key: 'client-management', type: 'guide' },
      { key: 'invoicing-system', type: 'guide' },
      { key: 'reports-analytics', type: 'guide' },
    ],
    api: [
      { key: 'api-reference', type: 'reference' },
      { key: 'sdk-libraries', type: 'code' },
    ],
    integrations: [
      { key: 'accounting-integrations', type: 'guide' },
      { key: 'payment-gateway', type: 'guide' },
    ],
    advanced: [
      { key: 'workflow-automation', type: 'guide' },
      { key: 'advanced-customization', type: 'guide' },
    ],
  };

  const documentation = Object.keys(documentationData).reduce((acc, category) => {
    acc[category] = documentationData[category].map(item => ({
      ...item,
      title: t(`docs.${category}.${item.key}.title`),
      description: t(`docs.${category}.${item.key}.description`),
      time: t(`docs.${category}.${item.key}.time`),
      sections: t(`docs.${category}.${item.key}.sections`, { returnObjects: true }),
    }));
    return acc;
  }, {});

  const getTypeIcon = type => {
    switch (type) {
      case 'guide':
        return <Book className='h-5 w-5 text-blue-600' />;
      case 'tutorial':
        return <Play className='h-5 w-5 text-green-600' />;
      case 'reference':
        return <Code className='h-5 w-5 text-purple-600' />;
      case 'code':
        return <Download className='h-5 w-5 text-orange-600' />;
      default:
        return <Book className='h-5 w-5 text-gray-600' />;
    }
  };

  const getTypeColor = type => {
    switch (type) {
      case 'guide':
        return 'bg-blue-100 text-blue-800';
      case 'tutorial':
        return 'bg-green-100 text-green-800';
      case 'reference':
        return 'bg-purple-100 text-purple-800';
      case 'code':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>{t('header.title')}</h1>
            <p className='text-xl text-gray-600 mb-8'>{t('header.subtitle')}</p>

            {/* Search Bar */}
            <div className='max-w-2xl mx-auto relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid lg:grid-cols-4 gap-8'>
          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <nav className='bg-white rounded-lg shadow-sm p-6 sticky top-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                {t('sidebar.categories')}
              </h3>
              <div className='space-y-2'>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className='text-lg'>{category.icon}</span>
                    <span className='font-medium'>{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className='mt-8 pt-6 border-t border-gray-200'>
                <h4 className='text-sm font-semibold text-gray-900 mb-3'>
                  {t('sidebar.quickLinks')}
                </h4>
                <div className='space-y-2'>
                  <a
                    href='#'
                    className='flex items-center text-sm text-gray-600 hover:text-blue-600'
                  >
                    <ExternalLink className='h-4 w-4 mr-2' />
                    {t('sidebar.apiReference')}
                  </a>
                  <a
                    href='#'
                    className='flex items-center text-sm text-gray-600 hover:text-blue-600'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    {t('sidebar.downloadSDK')}
                  </a>
                  <a
                    href='mailto:support@nexamanager.com'
                    className='flex items-center text-sm text-gray-600 hover:text-blue-600'
                  >
                    <ExternalLink className='h-4 w-4 mr-2' />
                    {t('sidebar.contactSupport')}
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className='lg:col-span-3'>
            <div className='space-y-12'>
              {documentation[selectedCategory]
                ?.filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((doc, index) => (
                  <div key={index} className='bg-white rounded-lg shadow-sm p-8'>
                    <div className='flex items-center mb-4'>
                      <div className='mr-4'>{getTypeIcon(doc.type)}</div>
                      <div>
                        <h2 className='text-2xl font-bold text-gray-900'>{doc.title}</h2>
                        <p className='text-gray-600'>{doc.description}</p>
                      </div>
                    </div>

                    <div className='flex items-center space-x-4 mb-6'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          doc.type,
                        )}`}
                      >
                        {t(`types.${doc.type.toLowerCase()}`)}
                      </span>
                      {doc.time !== 'N/A' && (
                        <span className='text-sm text-gray-500'>
                          {t('content.readingTime', { time: doc.time })}
                        </span>
                      )}
                    </div>

                    <div className='prose max-w-none'>
                      <h4 className='font-semibold mb-2'>{t('content.inThisArticle')}</h4>
                      <ul className='list-disc list-inside space-y-1 text-gray-600'>
                        {doc.sections.map((section, i) => (
                          <li key={i}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
