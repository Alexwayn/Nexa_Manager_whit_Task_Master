import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon, PlusCircleIcon, ClockIcon, CogIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import CustomReportBuilder from './CustomReportBuilder';
import ReportViewer from './ReportViewer';
import ScheduledReports from './ScheduledReports';
import ReportSettings from './ReportSettings';
import ReportTemplateBrowser from './ReportTemplateBrowser';

const ReportsDashboard = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Handle template selection from browser
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentView('customReportBuilder');
  };

  // Handle create custom report
  const handleCreateCustom = () => {
    setSelectedTemplate(null);
    setCurrentView('customReportBuilder');
  };

  const renderDashboard = () => (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-semibold text-gray-800'>Reports & Insights</h2>
        <p className='mt-2 text-gray-600'>Manage, create, and schedule your business reports with professional templates.</p>
      </div>

      {/* Quick Stats Row */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
          <div className='text-2xl font-bold'>5</div>
          <div className='text-blue-100 text-sm'>Core Templates</div>
        </div>
        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white'>
          <div className='text-2xl font-bold'>12</div>
          <div className='text-green-100 text-sm'>Saved Reports</div>
        </div>
        <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white'>
          <div className='text-2xl font-bold'>3</div>
          <div className='text-purple-100 text-sm'>Scheduled Reports</div>
        </div>
        <div className='bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white'>
          <div className='text-2xl font-bold'>248</div>
          <div className='text-orange-100 text-sm'>Reports Generated</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
        {/* Card for Template Browser */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300'>
          <div className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4'>
            <RectangleStackIcon className='h-8 w-8 text-white' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>Report Templates</h3>
          <p className='text-sm text-gray-500 mt-1 mb-4'>Browse and use professional report templates.</p>
          <button 
            onClick={() => setCurrentView('templateBrowser')}
            className='mt-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium'
          >
            Browse Templates
          </button>
        </div>

        {/* Card for Viewing Reports */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300'>
          <div className='p-3 bg-blue-100 rounded-full mb-4'>
            <DocumentTextIcon className='h-8 w-8 text-blue-600' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>View Reports</h3>
          <p className='text-sm text-gray-500 mt-1 mb-4'>Access your saved and generated reports.</p>
          <button 
            onClick={() => setCurrentView('reportViewer')}
            className='mt-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium'
          >
            Go to Reports
          </button>
        </div>

        {/* Card for Custom Report Builder */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300'>
          <div className='p-3 bg-green-100 rounded-full mb-4'>
            <PlusCircleIcon className='h-8 w-8 text-green-600' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>Custom Builder</h3>
          <p className='text-sm text-gray-500 mt-1 mb-4'>Build a completely custom report from scratch.</p>
          <button 
            onClick={handleCreateCustom}
            className='mt-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium'
          >
            Open Builder
          </button>
        </div>

        {/* Card for Scheduled Reports */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300'>
          <div className='p-3 bg-yellow-100 rounded-full mb-4'>
            <ClockIcon className='h-8 w-8 text-yellow-600' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>Scheduled Reports</h3>
          <p className='text-sm text-gray-500 mt-1 mb-4'>Manage automated report schedules.</p>
          <button 
            onClick={() => setCurrentView('scheduledReports')}
            className='mt-auto bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium'
          >
            View Schedules
          </button>
        </div>

        {/* Card for Report Settings */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300'>
          <div className='p-3 bg-gray-100 rounded-full mb-4'>
            <CogIcon className='h-8 w-8 text-gray-600' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>Settings</h3>
          <p className='text-sm text-gray-500 mt-1 mb-4'>Configure reporting options and preferences.</p>
          <button 
            onClick={() => setCurrentView('reportSettings')}
            className='mt-auto bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium'
          >
            Configure
          </button>
        </div>
      </div>

      {/* Featured Templates Section */}
      <div className='bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Featured Templates</h3>
            <p className='text-sm text-gray-600'>Popular report templates ready to use</p>
          </div>
          <button 
            onClick={() => setCurrentView('templateBrowser')}
            className='text-blue-600 hover:text-blue-800 font-medium text-sm'
          >
            View All Templates →
          </button>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-2'>
              <div className='p-2 bg-blue-100 rounded-lg mr-3'>
                <DocumentTextIcon className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>Monthly Financial Summary</h4>
                <p className='text-xs text-gray-500'>Revenue, expenses & profit overview</p>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>Financial</span>
              <button 
                onClick={() => setCurrentView('templateBrowser')}
                className='text-blue-600 hover:text-blue-800 text-xs font-medium'
              >
                Use Template
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-2'>
              <div className='p-2 bg-green-100 rounded-lg mr-3'>
                <DocumentTextIcon className='h-5 w-5 text-green-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>Client Portfolio Analysis</h4>
                <p className='text-xs text-gray-500'>Client revenue & project insights</p>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>Client</span>
              <button 
                onClick={() => setCurrentView('templateBrowser')}
                className='text-green-600 hover:text-green-800 text-xs font-medium'
              >
                Use Template
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow'>
            <div className='flex items-center mb-2'>
              <div className='p-2 bg-red-100 rounded-lg mr-3'>
                <DocumentTextIcon className='h-5 w-5 text-red-600' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>IVA Compliance Report</h4>
                <p className='text-xs text-gray-500'>Italian tax compliance & deductions</p>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full'>Tax</span>
              <button 
                onClick={() => setCurrentView('templateBrowser')}
                className='text-red-600 hover:text-red-800 text-xs font-medium'
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'templateBrowser' && (
        <ReportTemplateBrowser 
          onBack={() => setCurrentView('dashboard')} 
          onSelectTemplate={handleSelectTemplate}
          onCreateCustom={handleCreateCustom}
        />
      )}
      {currentView === 'customReportBuilder' && (
        <CustomReportBuilder 
          onBack={() => setCurrentView('dashboard')} 
          initialTemplate={selectedTemplate}
        />
      )}
      {currentView === 'reportViewer' && (
        <ReportViewer onBack={() => setCurrentView('dashboard')} />
      )}
      {currentView === 'scheduledReports' && (
        <ScheduledReports onBack={() => setCurrentView('dashboard')} />
      )}
      {currentView === 'reportSettings' && (
        <ReportSettings onBack={() => setCurrentView('dashboard')} />
      )}
    </div>
  )
};

export default ReportsDashboard;