import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  CommandLineIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  MapIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EnvelopeIcon,
  CogIcon
} from '@heroicons/react/24/solid';
import helpService from '@/services/helpService';

const iconMap = {
  MapIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EnvelopeIcon,
  CogIcon,
  QuestionMarkCircleIcon
};

const VoiceCommandHelp = ({ currentPath = '/' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('commands');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['navigation']));

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return helpService.searchCommands(searchQuery);
  }, [searchQuery]);

  // Get contextual help
  const contextualHelp = helpService.getContextualHelp(currentPath);
  const quickStartGuide = helpService.getQuickStartGuide();
  const troubleshootingGuide = helpService.getTroubleshootingGuide();
  const allCategories = helpService.getAllCategories();

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : <CommandLineIcon className={className} />;
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;

    if (searchResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No commands found for "{searchQuery}"</p>
          <p className="text-sm mt-2">Try searching for terms like "invoice", "client", or "report"</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Search Results ({searchResults.length})
        </h3>
        <div className="space-y-3">
          {searchResults.map((result, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                      "{result.command}"
                    </code>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {result.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                  <p className="text-xs text-gray-500">{result.example}</p>
                  {result.aliases.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Also try: </span>
                      {result.aliases.slice(0, 3).map((alias, i) => (
                        <code key={i} className="text-xs bg-gray-50 text-gray-600 px-1 py-0.5 rounded mr-1">
                          "{alias}"
                        </code>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-4">
                  {result.matchScore}% match
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCommandCategories = () => (
    <div className="space-y-4">
      {allCategories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        return (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {renderIcon(category.icon, "w-5 h-5 text-blue-600")}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {category.commands.map((command, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                        "{command.command}"
                      </code>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{command.description}</p>
                    <p className="text-xs text-gray-500 mb-2">{command.example}</p>
                    {command.aliases.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Alternative phrases: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {command.aliases.map((alias, i) => (
                            <code key={i} className="text-xs bg-white text-gray-600 px-1 py-0.5 rounded border">
                              "{alias}"
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderQuickStart = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpenIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">{quickStartGuide.title}</h3>
        </div>
        
        <div className="space-y-4">
          {quickStartGuide.steps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {step.step}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">{step.title}</h4>
                <p className="text-blue-800 text-sm mb-2">{step.description}</p>
                <p className="text-blue-600 text-xs italic">💡 {step.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Try These Common Commands</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickStartGuide.commonCommands.map((command, index) => (
            <code key={index} className="bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm">
              "{command}"
            </code>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTroubleshooting = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-900">{troubleshootingGuide.title}</h3>
        </div>
        
        <div className="space-y-6">
          {troubleshootingGuide.issues.map((issue, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-amber-200">
              <h4 className="font-medium text-amber-900 mb-3">❌ {issue.problem}</h4>
              <div className="space-y-2">
                {issue.solutions.map((solution, sIndex) => (
                  <div key={sIndex} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold text-sm mt-0.5">✓</span>
                    <p className="text-amber-800 text-sm">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContextualHelp = () => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <QuestionMarkCircleIcon className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-green-900">{contextualHelp.title}</h3>
      </div>
      
      <p className="text-green-800 mb-4">{contextualHelp.description}</p>
      
      <div>
        <h4 className="font-medium text-green-900 mb-2">Suggested Commands for This Page:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {contextualHelp.suggestedCommands.map((command, index) => (
            <code key={index} className="bg-white text-green-700 px-3 py-2 rounded text-sm border border-green-200">
              "{command}"
            </code>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Assistant Help</h1>
        <p className="text-gray-600">
          Learn how to use voice commands to control Nexa Manager efficiently
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search voice commands... (e.g., 'invoice', 'client', 'report')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contextual Help */}
      <div className="mb-6">
        {renderContextualHelp()}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'commands', label: 'Commands', icon: CommandLineIcon },
              { id: 'quickstart', label: 'Quick Start', icon: BookOpenIcon },
              { id: 'troubleshooting', label: 'Troubleshooting', icon: ExclamationTriangleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {searchQuery.trim() ? (
          renderSearchResults()
        ) : (
          <>
            {activeTab === 'commands' && renderCommandCategories()}
            {activeTab === 'quickstart' && renderQuickStart()}
            {activeTab === 'troubleshooting' && renderTroubleshooting()}
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceCommandHelp;
