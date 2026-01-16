import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  PlayIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import {
  UsersIcon,
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';
import { Footer } from '@shared/components';
import { useTranslation } from 'react-i18next';

const Voice = () => {
  const { t } = useTranslation('voice');
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);

  // Handle voice activation
  const handleActivateVoice = () => {
    setIsListening(!isListening);
    // Here you would integrate with actual voice recognition API
  };

  // Navigation Commands
  const navigationCommands = [
    {
      command: '"Go to Dashboard"',
      description: 'Navigate to the Dashboard page',
    },
    {
      command: '"Open Clients"',
      description: 'Navigate to the Clients page',
    },
    {
      command: '"Show Invoices"',
      description: 'Navigate to the Invoices & Quotes page',
    },
    {
      command: '"Open Calendar"',
      description: 'Navigate to the Calendar page',
    },
    {
      command: '"Go to Financial Tracking"',
      description: 'Navigate to the Financial Tracking page',
    },
    {
      command: '"Show Documents"',
      description: 'Navigate to the Documents page',
    },
  ];

  // Document Commands
  const documentCommands = [
    {
      command: '"Create new invoice"',
      description: 'Start creating a new invoice',
    },
    {
      command: '"Generate quote for [client name]"',
      description: 'Create a quote for a specific client',
    },
    {
      command: '"Search for document [keyword]"',
      description: 'Search for documents containing the keyword',
    },
    {
      command: '"Show recent documents"',
      description: 'Display recently accessed documents',
    },
    {
      command: '"Export document as PDF"',
      description: 'Export the current document as PDF',
    },
    {
      command: '"Send document to [email]"',
      description: 'Email the current document to specified address',
    },
  ];

  // Client Management Commands
  const clientCommands = [
    {
      command: '"Add new client"',
      description: 'Start the new client creation process',
    },
    {
      command: '"Find client [name]"',
      description: 'Search for a client by name',
    },
    {
      command: '"Show client details for [name]"',
      description: 'Display detailed information for a client',
    },
    {
      command: '"Update client [name]"',
      description: 'Edit information for an existing client',
    },
    {
      command: '"List all clients"',
      description: 'Show a list of all clients',
    },
    {
      command: '"Filter clients by [criteria]"',
      description: 'Filter clients based on specified criteria',
    },
  ];

  // Settings & System Commands
  const systemCommands = [
    {
      command: '"Open settings"',
      description: 'Navigate to the settings page',
    },
    {
      command: '"Change voice language to [language]"',
      description: 'Switch the voice recognition language',
    },
    {
      command: '"Turn on dark mode"',
      description: 'Switch to dark mode interface',
    },
    {
      command: '"Turn off voice assistant"',
      description: 'Deactivate the voice assistant',
    },
    {
      command: '"What can you do?"',
      description: 'Get a list of available voice commands',
    },
    {
      command: '"Log out"',
      description: 'Log out of the current account',
    },
  ];

  // Tutorials
  const tutorials = [
    {
      title: 'Getting Started with Voice Commands',
      description: 'Learn the basics of using voice commands in Nexa Manager',
      duration: '3:45',
      thumbnail:
        'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=424&h=160&fit=crop&auto=format',
    },
    {
      title: 'Advanced Voice Navigation',
      description: 'Master complex navigation and multi-step commands',
      duration: '5:20',
      thumbnail:
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=424&h=160&fit=crop&auto=format',
    },
    {
      title: 'Voice Document Creation',
      description: 'Create and edit documents using only your voice',
      duration: '4:15',
      thumbnail:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=424&h=160&fit=crop&auto=format',
    },
  ];

  // Tips
  const tips = [
    {
      title: 'Speak Clearly and Naturally',
      description:
        'Speak at a normal pace and volume. The assistant works best when you use natural language rather than robotic commands.',
    },
    {
      title: 'Use Command Keywords',
      description:
        'Start with action words like "open," "create," "show," or "find" followed by the subject of your command.',
    },
    {
      title: 'Quiet Environment',
      description:
        'Use the voice assistant in a quiet environment for optimal recognition accuracy and performance.',
    },
    {
      title: 'Microphone Distance',
      description:
        'Position yourself about 8-12 inches from your microphone for the best voice recognition results.',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Breadcrumb */}
      <div className='bg-blue-50 border-b border-gray-200 py-2 px-4 md:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2 text-base'>
            <button
              onClick={() => navigate('/dashboard')}
              className='flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors'
            >
              <HomeIcon className='h-5 w-5' />
              <span>Dashboard</span>
            </button>
            <ChevronRightIcon className='h-4 w-4 text-gray-400' />
            <span className='text-gray-600 font-bold'>Voice Assistant</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-6 py-8'>
        {/* AI Voice Assistant Section */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm mb-8'>
          <div className='px-8 py-8'>
            {/* Header with buttons */}
            <div className='flex justify-between items-start mb-8'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-900 mb-2'>AI Voice Assistant</h2>
                <p className='text-gray-600 text-sm max-w-md'>
                  Use voice commands to navigate and perform actions in Nexa Manager. Simply
                  activate the voice assistant and speak your command.
                </p>
              </div>

              {/* Right side buttons */}
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2 text-blue-600'>
                  <SpeakerWaveIcon className='w-4 h-4' />
                  <span className='text-sm'>Voice Ready</span>
                </div>
                <button
                  onClick={handleActivateVoice}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors'
                >
                  <MicrophoneIcon className='w-4 h-4' />
                  Activate Voice
                </button>
              </div>
            </div>

            {/* Voice Interface */}
            <div className='text-center mb-8'>
              {/* Voice Assistant Circle */}
              <div className='relative inline-block mb-6'>
                <div
                  className={`w-32 h-32 rounded-full border-4 ${
                    isListening ? 'border-blue-500 animate-pulse' : 'border-blue-300'
                  } bg-white flex items-center justify-center`}
                >
                  <div
                    className='bg-blue-500 rounded-full p-6 cursor-pointer hover:bg-blue-600 transition-colors'
                    onClick={handleActivateVoice}
                  >
                    <MicrophoneIcon className='w-8 h-8 text-white' />
                  </div>
                </div>
              </div>
            </div>

            {/* How to Use Instructions */}
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <div className='flex items-start gap-3 mb-3'>
                <QuestionMarkCircleIcon className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                <h3 className='text-gray-900 font-medium'>How to use voice commands</h3>
              </div>
              <div className='text-left text-gray-600 text-sm leading-6 ml-8 space-y-1'>
                <p>
                  1. Click the "Activate Voice" button or say "Hey Nexa" to activate the voice
                  assistant
                </p>
                <p>2. Wait for the beep sound indicating the assistant is listening</p>
                <p>3. Speak your command clearly (e.g., "Open invoices" or "Create new client")</p>
                <p>4. The assistant will confirm and execute your command</p>
              </div>
            </div>
          </div>
        </div>

        {/* Command Categories */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Navigation Commands */}
          <CommandCard icon={HomeIcon} title='Navigation Commands' commands={navigationCommands} />

          {/* Document Commands */}
          <CommandCard
            icon={DocumentTextIcon}
            title='Document Commands'
            commands={documentCommands}
          />

          {/* Client Management Commands */}
          <CommandCard
            icon={UsersIcon}
            title='Client Management Commands'
            commands={clientCommands}
          />

          {/* Settings & System Commands */}
          <CommandCard
            icon={Cog6ToothIcon}
            title='Settings & System Commands'
            commands={systemCommands}
          />
        </div>

        {/* Voice Assistant Tutorials */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-xl font-semibold text-gray-900'>Voice Assistant Tutorials</h3>
            <button className='flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm'>
              <span>View All</span>
              <ArrowRightIcon className='w-4 h-4' />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {tutorials.map((tutorial, index) => (
              <TutorialCard key={index} tutorial={tutorial} />
            ))}
          </div>
        </div>

        {/* Voice Command Tips */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
          <h3 className='text-xl font-semibold text-gray-900 mb-6'>Voice Command Tips</h3>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            {tips.map((tip, index) => (
              <div key={index} className='bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>{tip.title}</h4>
                <p className='text-gray-600 text-sm leading-6'>{tip.description}</p>
              </div>
            ))}
          </div>

          <div className='text-center'>
            <button className='bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto'>
              <QuestionMarkCircleIcon className='w-5 h-5' />
              Get More Voice Command Help
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

// Command Card Component
const CommandCard = ({ icon: Icon, title, commands }) => {
  return (
    <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
      <div className='flex items-center gap-3 mb-4'>
        <div className='bg-blue-100 rounded-full p-2.5'>
          <Icon className='w-5 h-5 text-blue-600' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900'>{title}</h3>
      </div>

      <div className='space-y-3'>
        {commands.map((command, index) => (
          <div
            key={index}
            className={`flex items-center justify-between py-3 ${
              index < commands.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className='flex-1'>
              <div className='text-blue-600 font-medium mb-1 text-sm'>{command.command}</div>
              <div className='text-xs text-gray-600'>{command.description}</div>
            </div>
            <ChevronRightIcon className='w-4 h-4 text-gray-400 flex-shrink-0 ml-3' />
          </div>
        ))}
      </div>
    </div>
  );
};

// Tutorial Card Component
const TutorialCard = ({ tutorial }) => {
  return (
    <div className='border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer'>
      <div className='relative'>
        <img src={tutorial.thumbnail} alt={tutorial.title} className='w-full h-40 object-cover' />
        <div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
          <div className='bg-white/80 rounded-full p-3'>
            <PlayIcon className='w-6 h-6 text-blue-600' />
          </div>
        </div>
        <div className='absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1'>
          <span className='text-white text-xs'>{tutorial.duration}</span>
        </div>
      </div>
      <div className='p-4'>
        <h4 className='font-medium text-gray-900 mb-1 text-sm'>{tutorial.title}</h4>
        <p className='text-xs text-gray-600'>{tutorial.description}</p>
      </div>
    </div>
  );
};

export default Voice;
