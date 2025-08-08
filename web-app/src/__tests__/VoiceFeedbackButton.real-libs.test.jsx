// Test with real React Testing Library (bypassing mocks)
import { jest } from '@jest/globals';

// Import real libraries directly from node_modules
const realReact = require('../../../node_modules/react');
const realRTL = require('../../../node_modules/@testing-library/react');
const realJestDom = require('../../../node_modules/@testing-library/jest-dom');
const realUserEvent = require('../../../node_modules/@testing-library/user-event');

// Extend Jest matchers
expect.extend(realJestDom);

// Mock the voice assistant hook
const mockUseVoiceAssistant = jest.fn(() => ({
  state: {
    isEnabled: true,
    isListening: false,
    isProcessing: false,
    error: null,
    feedbackCount: 5,
    voiceState: 'idle',
    lastCommand: 'test command',
    lastConfidence: 0.95,
  },
  startListening: jest.fn(),
  stopListening: jest.fn(),
  clearError: jest.fn(),
}));

// Mock the VoiceFeedbackModal component
const mockVoiceFeedbackModal = jest.fn(({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;
  return realReact.createElement('div', {
    'data-testid': 'voice-feedback-modal',
    children: [
      realReact.createElement('button', {
        key: 'close',
        'data-testid': 'modal-close-button',
        onClick: onClose,
        children: 'Close'
      }),
      realReact.createElement('button', {
        key: 'submit',
        'data-testid': 'modal-submit-button',
        onClick: () => onSubmit({ rating: 5, feedback: 'Test feedback' }),
        children: 'Submit'
      })
    ]
  });
});

// Mock modules using actual file paths
jest.doMock('../providers/VoiceAssistantProvider', () => ({
  useVoiceAssistant: mockUseVoiceAssistant,
  VoiceAssistantProvider: ({ children }) => realReact.createElement('div', { 'data-testid': 'voice-provider' }, children),
}));

jest.doMock('../components/voice/VoiceFeedbackModal', () => ({
  __esModule: true,
  default: mockVoiceFeedbackModal,
}));

// Mock react-router-dom
jest.doMock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => realReact.createElement('div', { 'data-testid': 'browser-router' }, children),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock Heroicons
jest.doMock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftRightIcon: (props) => realReact.createElement('svg', {
    ...props,
    'data-testid': 'feedback-icon',
    children: 'feedback-icon'
  }),
}));

// Import the component after mocking
const VoiceFeedbackButton = require('../components/voice/VoiceFeedbackButton').default;

// Helper function to render with providers
const renderWithProviders = (component, options = {}) => {
  const VoiceAssistantProvider = ({ children }) => {
    return realReact.createElement('div', { 'data-testid': 'voice-provider' }, children);
  };

  const wrapper = ({ children }) => {
    return realReact.createElement(
      'div',
      { 'data-testid': 'browser-router' },
      realReact.createElement(VoiceAssistantProvider, null, children)
    );
  };

  return realRTL.render(component, { wrapper, ...options });
};

describe('VoiceFeedbackButton (Real Libraries)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseVoiceAssistant.mockReturnValue({
      isEnabled: true,
      isListening: false,
      isProcessing: false,
      error: null,
      feedbackCount: 5,
      voiceState: 'idle',
      lastCommand: 'test command',
      lastConfidence: 0.95,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      clearError: jest.fn(),
    });
  });

  test('renders feedback button', () => {
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('voice-feedback-button');
  });

  test('shows correct icon and text', () => {
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const icon = container.querySelector('[data-testid="feedback-icon"]');
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    
    expect(icon).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/feedback/i);
  });

  test('opens feedback modal when clicked', async () => {
    const user = realUserEvent.default.setup();
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    await user.click(button);
    
    const modal = container.querySelector('[data-testid="voice-feedback-modal"]');
    expect(modal).toBeInTheDocument();
  });

  test('handles feedback submission', async () => {
    const user = realUserEvent.default.setup();
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    await user.click(button);
    
    const submitButton = container.querySelector('[data-testid="modal-submit-button"]');
    await user.click(submitButton);
    
    // Modal should close after submission
    const modal = container.querySelector('[data-testid="voice-feedback-modal"]');
    expect(modal).not.toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    const user = realUserEvent.default.setup();
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    await user.click(button);
    
    const closeButton = container.querySelector('[data-testid="modal-close-button"]');
    await user.click(closeButton);
    
    const modal = container.querySelector('[data-testid="voice-feedback-modal"]');
    expect(modal).not.toBeInTheDocument();
  });

  test('applies custom styling', () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton, { style: customStyle })
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toHaveStyle('background-color: red');
  });

  test('displays feedback count', () => {
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton, { showCount: true })
    );
    
    // The component shows count in a span when showCount is true
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('5');
  });

  test('handles rapid clicks gracefully', async () => {
    const user = realUserEvent.default.setup();
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    
    // Click rapidly multiple times
    await user.click(button);
    await user.click(button);
    await user.click(button);
    
    // Should only have one modal
    const modals = container.querySelectorAll('[data-testid="voice-feedback-modal"]');
    expect(modals).toHaveLength(1);
  });

  test('updates when voice state changes', () => {
    const { container, rerender } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton, { showCount: true })
    );
    
    // Update mock to return different state
    mockUseVoiceAssistant.mockReturnValue({
      isEnabled: true,
      isListening: true,
      isProcessing: false,
      error: null,
      feedbackCount: 10,
      voiceState: 'listening',
      lastCommand: 'test command',
      lastConfidence: 0.95,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      clearError: jest.fn(),
    });
    
    rerender(realReact.createElement(VoiceFeedbackButton, { showCount: true }));
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toHaveTextContent('10');
  });

  test('has proper ARIA attributes', () => {
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('aria-describedby');
  });

  test('supports icon-only mode', () => {
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton, { iconOnly: true })
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    const icon = container.querySelector('[data-testid="feedback-icon"]');
    
    expect(button).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    // In icon-only mode, the button should not contain "Feedback" text
    expect(button).not.toHaveTextContent('Feedback');
  });

  test('handles voice assistant disabled state', () => {
    mockUseVoiceAssistant.mockReturnValue({
      isEnabled: false,
      isListening: false,
      isProcessing: false,
      error: null,
      feedbackCount: 0,
      voiceState: 'disabled',
      lastCommand: null,
      lastConfidence: 0,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      clearError: jest.fn(),
    });
    
    const { container } = renderWithProviders(
      realReact.createElement(VoiceFeedbackButton)
    );
    
    const button = container.querySelector('[data-testid="voice-feedback-button"]');
    expect(button).toBeDisabled();
  });
});