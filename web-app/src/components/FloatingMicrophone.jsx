import React, { useState, useEffect } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FloatingMicrophone = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const navigate = useNavigate();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();
      
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';
      
      speechRecognition.onstart = () => {
        setIsListening(true);
        toast.success('Voice recognition started - speak now!');
      };
      
      speechRecognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setTranscript(command);
        executeVoiceCommand(command);
      };
      
      speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };
      
      speechRecognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(speechRecognition);
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  // Execute voice commands
  const executeVoiceCommand = (command) => {
    console.log('Voice command received:', command);
    
    // Navigation commands
    if (command.includes('dashboard') || command.includes('home')) {
      navigate('/dashboard');
      toast.success('Navigating to Dashboard');
    }
    else if (command.includes('client') && !command.includes('new')) {
      navigate('/clients');
      toast.success('Navigating to Clients');
    }
    else if (command.includes('invoice')) {
      navigate('/invoices');
      toast.success('Navigating to Invoices');
    }
    else if (command.includes('quote')) {
      navigate('/quotes');
      toast.success('Navigating to Quotes');
    }
    else if (command.includes('transaction')) {
      navigate('/transactions');
      toast.success('Navigating to Transactions');
    }
    else if (command.includes('inventory')) {
      navigate('/inventory');
      toast.success('Navigating to Inventory');
    }
    else if (command.includes('analytics')) {
      navigate('/analytics');
      toast.success('Navigating to Analytics');
    }
    else if (command.includes('report')) {
      navigate('/reports');
      toast.success('Navigating to Reports');
    }
    else if (command.includes('calendar')) {
      navigate('/calendar');
      toast.success('Navigating to Calendar');
    }
    else if (command.includes('document')) {
      navigate('/documents');
      toast.success('Navigating to Documents');
    }
    else if (command.includes('email')) {
      navigate('/email');
      toast.success('Navigating to Email');
    }
    else if (command.includes('scan')) {
      navigate('/scan');
      toast.success('Navigating to Scan');
    }
    else if (command.includes('voice')) {
      navigate('/voice');
      toast.success('Navigating to Voice Commands');
    }
    else if (command.includes('setting')) {
      navigate('/settings');
      toast.success('Navigating to Settings');
    }
    
    // Action commands
    else if (command.includes('new client') || command.includes('add client')) {
      navigate('/clients');
      toast.success('Ready to add new client');
      // Here you could trigger a modal or form
    }
    else if (command.includes('new invoice') || command.includes('create invoice')) {
      navigate('/invoices');
      toast.success('Ready to create new invoice');
      // Here you could trigger invoice creation
    }
    else if (command.includes('new quote') || command.includes('create quote')) {
      navigate('/quotes');
      toast.success('Ready to create new quote');
    }
    else if (command.includes('help')) {
      navigate('/help');
      toast.success('Opening Help Center');
    }
    else if (command.includes('logout') || command.includes('log out')) {
      toast.success('Logging out...');
      // Here you would implement logout functionality
    }
    else if (command.includes('dark mode')) {
      toast.success('Dark mode toggle requested');
      // Here you would toggle dark mode
    }
    
    // Fallback for unrecognized commands
    else {
      toast.error(`Command "${command}" not recognized. Try "go to dashboard" or "create invoice"`);
    }
  };

  // Handle voice activation
  const handleActivateVoice = () => {
    if (!recognition) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      // Stop listening
      recognition.stop();
      setIsListening(false);
      toast.info('Voice recognition stopped');
    } else {
      // Start listening
      setTranscript('');
      recognition.start();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleActivateVoice}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isListening ? 'Stop Listening - Click to stop voice recognition' : 'Start Voice Command - Click to speak'}
        >
          <MicrophoneIcon className="w-6 h-6 text-white" />
        </button>
        
        {/* Voice Status Indicator */}
        {isListening && (
          <div className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              Listening...
            </div>
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
        
        {/* Transcript Display (for debugging) */}
        {transcript && (
          <div className="absolute -top-20 right-0 bg-blue-900 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap max-w-xs">
            <div className="text-blue-200">Heard: "{transcript}"</div>
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
          </div>
        )}
      </div>

      {/* Voice Commands Help Overlay */}
      {isListening && (
        <div className="fixed bottom-24 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40 max-w-sm">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Say a command:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• "Go to dashboard"</div>
            <div>• "Open clients"</div>
            <div>• "Create new invoice"</div>
            <div>• "Show analytics"</div>
            <div>• "Open settings"</div>
            <div>• "Help"</div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingMicrophone; 