import React from 'react';
import { render, screen } from '@testing-library/react';
import VoiceFeedbackModal from '../components/voice/VoiceFeedbackModal';
import fs from 'fs';

// Mock the voice feedback service
jest.mock('../services/voiceFeedbackService', () => ({
  __esModule: true,
  default: {
    collectFeedback: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('VoiceFeedbackModal Simple Test', () => {
  it('should render modal when isOpen is true', () => {
    const mockOnClose = jest.fn();
    const commandData = { id: 'test', command: 'test command', action: 'test action' };
    
    const { container } = render(
      <VoiceFeedbackModal 
        isOpen={true} 
        onClose={mockOnClose} 
        commandData={commandData} 
      />
    );

    // Check if modal is rendered
    const modal = screen.getByTestId('voice-feedback-modal');
    expect(modal).toBeInTheDocument();
    
    // Check if title is present
    const title = screen.getByText('Voice Command Feedback');
    expect(title).toBeInTheDocument();
    
    // Check if command is displayed
    const command = screen.getByTestId('modal-command');
    expect(command).toBeInTheDocument();
    expect(command).toHaveTextContent('"test command"');
    
    // List all text content to see what's rendered
    console.log('Modal text content:', container.textContent);
    
    // Write to file for debugging
    const debugInfo = {
      textContent: container.textContent,
      innerHTML: container.innerHTML,
      allButtons: screen.getAllByRole('button').map(btn => ({
        text: btn.textContent,
        className: btn.className,
        disabled: btn.disabled,
        type: btn.type
      }))
    };
    
    fs.writeFileSync('debug-modal-output.json', JSON.stringify(debugInfo, null, 2));
  });
});