import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/providers/VoiceAssistantProvider';

/**
 * Voice Assistant Demo component for showcasing voice commands
 */
const VoiceAssistantDemo = ({ 
  commands = [],
  title = "Voice Assistant Demo",
  mode = "interactive",
  onComplete,
  className = '',
  ...props 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [completedCommands, setCompletedCommands] = useState([]);
  const [demoStats, setDemoStats] = useState({
    commandsCompleted: 0,
    successRate: 0,
    totalTime: 0
  });

  const {
    isListening,
    isProcessing,
    command,
    response,
    error,
    startListening,
    stopListening
  } = useVoiceAssistant();

  const defaultCommands = [
    {
      id: 'demo-nav',
      command: 'go to dashboard',
      description: 'Navigate to the main dashboard',
      category: 'navigation',
      expectedResult: 'Navigates to dashboard page'
    },
    {
      id: 'demo-create',
      command: 'create new invoice',
      description: 'Create a new invoice',
      category: 'action',
      expectedResult: 'Opens invoice creation form'
    },
    {
      id: 'demo-help',
      command: 'help',
      description: 'Show available commands',
      category: 'help',
      expectedResult: 'Displays command list'
    }
  ];

  const demoCommands = commands.length > 0 ? commands : defaultCommands;

  const startDemo = () => {
    setIsActive(true);
    setCurrentCommandIndex(0);
    setCompletedCommands([]);
    setDemoStats({ commandsCompleted: 0, successRate: 0, totalTime: 0 });
  };

  const stopDemo = () => {
    setIsActive(false);
    stopListening();
  };

  const nextCommand = () => {
    if (currentCommandIndex < demoCommands.length - 1) {
      setCurrentCommandIndex(currentCommandIndex + 1);
    } else {
      completeDemo();
    }
  };

  const completeDemo = () => {
    setIsActive(false);
    const stats = {
      commandsCompleted: completedCommands.length,
      successRate: (completedCommands.length / demoCommands.length) * 100,
      totalTime: Date.now() - demoStats.startTime
    };
    setDemoStats(stats);
    onComplete?.(stats);
  };

  const executeCommand = (commandText) => {
    // Simulate command execution
    setCompletedCommands([...completedCommands, commandText]);
    setTimeout(() => {
      nextCommand();
    }, 1000);
  };

  const getCurrentCommand = () => {
    return demoCommands[currentCommandIndex];
  };

  return (
    <div 
      className={`voice-assistant-demo p-6 bg-white rounded-lg shadow-lg ${className}`}
      data-testid="voice-assistant-demo"
      {...props}
    >
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {!isActive ? (
        <div className="demo-start">
          <p className="text-gray-600 mb-4">Try these commands:</p>
          <ul className="space-y-2 mb-6" role="list" aria-label="Demo commands">
            {demoCommands.map((cmd, index) => (
              <li 
                key={cmd.id}
                className="p-3 bg-gray-50 rounded border"
                data-testid={`demo-command-${index}`}
              >
                <strong>"{cmd.command}"</strong> - {cmd.description}
              </li>
            ))}
          </ul>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={startDemo}
            role="button"
            aria-label="Start demo"
          >
            Start Demo
          </button>
        </div>
      ) : (
        <div className="demo-active">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Demo Active</span>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
                onClick={stopDemo}
                role="button"
                aria-label="Stop demo"
              >
                Stop Demo
              </button>
            </div>
            <div 
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-valuenow={currentCommandIndex}
              aria-valuemax={demoCommands.length}
            >
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentCommandIndex / demoCommands.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="current-command mb-4">
            <p className="text-gray-600 mb-2">Say one of the commands below:</p>
            {getCurrentCommand() && (
              <div 
                className="p-4 bg-blue-50 border-l-4 border-blue-500 highlighted"
                data-testid={`demo-command-${currentCommandIndex}`}
              >
                <strong>"{getCurrentCommand().command}"</strong>
                <p className="text-sm text-gray-600 mt-1">{getCurrentCommand().description}</p>
                <p className="text-sm text-green-600 mt-1">Expected: {getCurrentCommand().expectedResult}</p>
              </div>
            )}
          </div>

          <div className="demo-controls flex gap-2 mb-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => executeCommand(getCurrentCommand()?.command)}
              role="button"
              aria-label={`Execute ${getCurrentCommand()?.command}`}
            >
              Execute {getCurrentCommand()?.command}
            </button>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              onClick={nextCommand}
              role="button"
              aria-label="Next command"
            >
              Next Command
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={nextCommand}
              role="button"
              aria-label="Skip command"
            >
              Skip Command
            </button>
          </div>

          {isListening && (
            <div className="listening-indicator mb-4">
              <div className="flex items-center text-blue-600">
                <div className="animate-pulse mr-2" data-testid="listening-indicator">🎤</div>
                <span>Listening...</span>
              </div>
            </div>
          )}

          {command && (
            <div className="command-recognized mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">Command recognized: "{command}"</p>
              <p className="text-sm text-gray-600">Confidence: 95%</p>
            </div>
          )}

          {error && (
            <div className="demo-error mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700">Command failed: {error}</p>
              <div data-testid="error-indicator">❌</div>
            </div>
          )}

          <div className="demo-tips p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm"><strong>Tip:</strong> Speak clearly and wait for the listening indicator.</p>
          </div>
        </div>
      )}

      {demoStats.commandsCompleted > 0 && !isActive && (
        <div className="demo-completed mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Demo Completed!</h3>
          <div className="demo-statistics">
            <p><strong>Commands completed:</strong> {demoStats.commandsCompleted}</p>
            <p><strong>Success rate:</strong> {demoStats.successRate}%</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={startDemo}
              role="button"
              aria-label="Restart demo"
            >
              Restart Demo
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              role="button"
              aria-label="Rate demo"
            >
              Rate Demo
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">How was the demo?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistantDemo;
