import React, { useState } from 'react';
import { Tab } from '@headlessui/react';

const SimpleTabTest = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: 'Tab 1', content: 'Contenuto del Tab 1' },
    { name: 'Tab 2', content: 'Contenuto del Tab 2' },
    { name: 'Tab 3', content: 'Contenuto del Tab 3' },
  ];

  console.log('🧪 SimpleTabTest - activeTab:', activeTab);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Tab Semplice</h1>
      
      <Tab.Group selectedIndex={activeTab} onChange={(index) => {
        console.log('🔄 SimpleTabTest - Tab changed to:', index);
        setActiveTab(index);
      }}>
        {/* Tab Navigation */}
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60 ${
                  selected
                    ? 'bg-white shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        {/* Tab Panels */}
        <Tab.Panels className="mt-6">
          {tabs.map((tab, index) => (
            <Tab.Panel
              key={index}
              className="rounded-xl bg-white p-6 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {tab.name}
              </h3>
              <div className="text-gray-600">
                <p>{tab.content}</p>
                <p className="mt-2 text-sm">
                  Questo è il pannello {index + 1}. Se vedi questo contenuto, 
                  significa che le tab funzionano correttamente.
                </p>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ Tab {index + 1} caricata con successo!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Timestamp: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default SimpleTabTest; 