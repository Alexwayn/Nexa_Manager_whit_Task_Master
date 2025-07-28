import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import VoiceCommandHelp from '@/features/voice/components/VoiceCommandHelp';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';
import helpService from '@/services/helpService';

// Mock the help service
jest.mock('@/services/helpService');

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('VoiceCommandHelp', () => {
  const mockCommands = [
    {
      id: 'nav-dashboard',
      category: 'navigation',
      command: 'go to dashboard',
      description: 'Navigate to the main dashboard',
      examples: ['go to dashboard', 'show dashboard', 'open dashboard'],
      confidence: 0.95
    },
    {
      id: 'create-invoice',
      category: 'action',
      command: 'create invoice',
      description: 'Create a new invoice',
      examples: ['create invoice', 'new invoice', 'add invoice'],
      confidence: 0.90
    },
    {
      id: 'help-commands',
      category: 'help',
      command: 'help',
      description: 'Show available voice commands',
      examples: ['help', 'show commands', 'what can I say'],
      confidence: 0.98
    },
    {
      id: 'system-settings',
      category: 'system',
      command: 'open settings',
      description: 'Open application settings',
      examples: ['open settings', 'show settings', 'preferences'],
      confidence: 0.85
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    helpService.getVoiceCommands.mockResolvedValue({
      success: true,
      data: mockCommands
    });
  });

  it('renders voice command help correctly', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    expect(screen.getByText(/voice commands/i)).toBeInTheDocument();
    expect(screen.getByText(/available commands/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('go to dashboard')).toBeInTheDocument();
      expect(screen.getByText('create invoice')).toBeInTheDocument();
    });
  });

  it('displays commands grouped by category', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/navigation/i)).toBeInTheDocument();
      expect(screen.getByText(/action/i)).toBeInTheDocument();
      expect(screen.getByText(/help/i)).toBeInTheDocument();
      expect(screen.getByText(/system/i)).toBeInTheDocument();
    });
  });

  it('shows command examples when expanded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const expandButton = screen.getByLabelText(/expand go to dashboard/i);
      return user.click(expandButton);
    });

    expect(screen.getByText('show dashboard')).toBeInTheDocument();
    expect(screen.getByText('open dashboard')).toBeInTheDocument();
  });

  it('filters commands by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search commands/i);
      return user.type(searchInput, 'invoice');
    });

    expect(screen.getByText('create invoice')).toBeInTheDocument();
    expect(screen.queryByText('go to dashboard')).not.toBeInTheDocument();
  });

  it('filters commands by category', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const categoryFilter = screen.getByLabelText(/filter by category/i);
      return user.selectOptions(categoryFilter, 'navigation');
    });

    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
    expect(screen.queryByText('create invoice')).not.toBeInTheDocument();
  });

  it('shows confidence levels for commands', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/95%/)).toBeInTheDocument(); // Dashboard command
      expect(screen.getByText(/90%/)).toBeInTheDocument(); // Invoice command
    });
  });

  it('handles loading state', () => {
    helpService.getVoiceCommands.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<VoiceCommandHelp />);

    expect(screen.getByText(/loading commands/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    helpService.getVoiceCommands.mockRejectedValue(
      new Error('Failed to load commands')
    );

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load commands/i)).toBeInTheDocument();
    });
  });

  it('refreshes commands when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/refresh commands/i);
      return user.click(refreshButton);
    });

    expect(helpService.getVoiceCommands).toHaveBeenCalledTimes(2);
  });

  it('copies command to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue()
      }
    });

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const copyButton = screen.getByLabelText(/copy go to dashboard/i);
      return user.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('go to dashboard');
    expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('tries command when try button is clicked', async () => {
    const user = userEvent.setup();
    const mockTryCommand = jest.fn();
    
    renderWithProviders(
      <VoiceCommandHelp onTryCommand={mockTryCommand} />
    );

    await waitFor(() => {
      const tryButton = screen.getByLabelText(/try go to dashboard/i);
      return user.click(tryButton);
    });

    expect(mockTryCommand).toHaveBeenCalledWith('go to dashboard');
  });

  it('shows command descriptions', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText('Navigate to the main dashboard')).toBeInTheDocument();
      expect(screen.getByText('Create a new invoice')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search commands/i);
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });

    // Tab navigation should work
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(screen.getByLabelText(/filter by category/i)).toHaveFocus();
  });

  it('handles empty search results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search commands/i);
      return user.type(searchInput, 'nonexistent command');
    });

    expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search commands/i);
      return user.type(searchInput, 'invoice');
    });

    const clearButton = screen.getByLabelText(/clear search/i);
    await user.click(clearButton);

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('go to dashboard')).toBeInTheDocument();
  });

  it('shows popular commands section', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/popular commands/i)).toBeInTheDocument();
      expect(screen.getByText(/most used/i)).toBeInTheDocument();
    });
  });

  it('displays command usage statistics', async () => {
    const commandsWithStats = mockCommands.map(cmd => ({
      ...cmd,
      usageCount: Math.floor(Math.random() * 100),
      successRate: Math.random()
    }));

    helpService.getVoiceCommands.mockResolvedValue({
      success: true,
      data: commandsWithStats
    });

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/usage:/i)).toBeInTheDocument();
      expect(screen.getByText(/success rate:/i)).toBeInTheDocument();
    });
  });

  it('supports compact view mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const compactToggle = screen.getByLabelText(/compact view/i);
      return user.click(compactToggle);
    });

    expect(screen.getByTestId('commands-list')).toHaveClass('compact');
  });

  it('exports commands list', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const exportButton = screen.getByText(/export commands/i);
      return user.click(exportButton);
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows command aliases', async () => {
    const commandsWithAliases = mockCommands.map(cmd => ({
      ...cmd,
      aliases: ['alias1', 'alias2']
    }));

    helpService.getVoiceCommands.mockResolvedValue({
      success: true,
      data: commandsWithAliases
    });

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/aliases:/i)).toBeInTheDocument();
      expect(screen.getByText('alias1')).toBeInTheDocument();
    });
  });

  it('handles command pronunciation guide', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const pronunciationButton = screen.getByLabelText(/pronunciation guide/i);
      return user.click(pronunciationButton);
    });

    expect(screen.getByText(/how to pronounce/i)).toBeInTheDocument();
  });

  it('shows command difficulty levels', async () => {
    const commandsWithDifficulty = mockCommands.map(cmd => ({
      ...cmd,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
    }));

    helpService.getVoiceCommands.mockResolvedValue({
      success: true,
      data: commandsWithDifficulty
    });

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/easy/i)).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', async () => {
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const commandsList = screen.getByRole('list', { name: /voice commands/i });
      expect(commandsList).toBeInTheDocument();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label');
    });
  });

  it('supports voice command practice mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      const practiceButton = screen.getByText(/practice mode/i);
      return user.click(practiceButton);
    });

    expect(screen.getByText(/practice voice commands/i)).toBeInTheDocument();
    expect(screen.getByText(/say the highlighted command/i)).toBeInTheDocument();
  });

  it('shows command context information', async () => {
    const commandsWithContext = mockCommands.map(cmd => ({
      ...cmd,
      context: ['dashboard', 'invoice-page', 'settings']
    }));

    helpService.getVoiceCommands.mockResolvedValue({
      success: true,
      data: commandsWithContext
    });

    renderWithProviders(<VoiceCommandHelp />);

    await waitFor(() => {
      expect(screen.getByText(/available in:/i)).toBeInTheDocument();
      expect(screen.getByText('dashboard')).toBeInTheDocument();
    });
  });
});