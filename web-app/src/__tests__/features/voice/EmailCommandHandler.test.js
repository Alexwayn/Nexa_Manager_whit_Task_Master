import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EmailCommandHandler from '@/features/voice/handlers/EmailCommandHandler';
import { VoiceAssistantProvider } from '@/features/voice/providers/VoiceAssistantProvider';

// Mock email service
const mockEmailService = {
  sendEmail: jest.fn(),
  getEmailTemplates: jest.fn(),
  validateEmailAddress: jest.fn(),
  getContacts: jest.fn()
};

jest.mock('@/services/emailService', () => mockEmailService);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <VoiceAssistantProvider>
        {component}
      </VoiceAssistantProvider>
    </BrowserRouter>
  );
};

describe('EmailCommandHandler', () => {
  const mockHandler = new EmailCommandHandler();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmailService.sendEmail.mockResolvedValue({ success: true });
    mockEmailService.getEmailTemplates.mockResolvedValue([
      { id: 1, name: 'Invoice Template', subject: 'Invoice #{number}' },
      { id: 2, name: 'Quote Template', subject: 'Quote #{number}' }
    ]);
    mockEmailService.validateEmailAddress.mockReturnValue(true);
    mockEmailService.getContacts.mockResolvedValue([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  });

  describe('Command Recognition', () => {
    it('recognizes send email commands', () => {
      const commands = [
        'send email to john@example.com',
        'email john about the project',
        'compose email to jane',
        'send message to client'
      ];

      commands.forEach(command => {
        const result = mockHandler.canHandle(command);
        expect(result).toBe(true);
      });
    });

    it('recognizes email template commands', () => {
      const commands = [
        'send invoice email',
        'email invoice template',
        'send quote email to client'
      ];

      commands.forEach(command => {
        const result = mockHandler.canHandle(command);
        expect(result).toBe(true);
      });
    });

    it('rejects non-email commands', () => {
      const commands = [
        'go to dashboard',
        'create invoice',
        'show reports'
      ];

      commands.forEach(command => {
        const result = mockHandler.canHandle(command);
        expect(result).toBe(false);
      });
    });
  });

  describe('Email Address Extraction', () => {
    it('extracts email addresses from commands', async () => {
      const command = 'send email to john@example.com about the project';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.recipient).toBe('john@example.com');
    });

    it('extracts multiple email addresses', async () => {
      const command = 'send email to john@example.com and jane@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.recipients).toContain('john@example.com');
      expect(result.data.recipients).toContain('jane@example.com');
    });

    it('handles contact names', async () => {
      const command = 'send email to John Doe';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.recipient).toBe('john@example.com');
    });

    it('handles partial contact names', async () => {
      const command = 'send email to John';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.recipient).toBe('john@example.com');
    });
  });

  describe('Subject Extraction', () => {
    it('extracts subject from "about" keyword', async () => {
      const command = 'send email to john@example.com about project update';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.subject).toBe('project update');
    });

    it('extracts subject from "regarding" keyword', async () => {
      const command = 'email jane regarding the meeting';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.subject).toBe('the meeting');
    });

    it('extracts subject from "with subject" phrase', async () => {
      const command = 'send email to client with subject quarterly report';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.subject).toBe('quarterly report');
    });
  });

  describe('Template Handling', () => {
    it('identifies invoice template commands', async () => {
      const command = 'send invoice email to john@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.template).toBe('invoice');
      expect(mockEmailService.getEmailTemplates).toHaveBeenCalled();
    });

    it('identifies quote template commands', async () => {
      const command = 'email quote template to jane@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.template).toBe('quote');
    });

    it('handles template with number', async () => {
      const command = 'send invoice 12345 to client';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(true);
      expect(result.data.template).toBe('invoice');
      expect(result.data.number).toBe('12345');
    });
  });

  describe('Email Validation', () => {
    it('validates email addresses', async () => {
      mockEmailService.validateEmailAddress.mockReturnValue(false);
      
      const command = 'send email to invalid-email';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid email');
    });

    it('handles missing recipient', async () => {
      const command = 'send email about project';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('recipient required');
    });

    it('validates contact existence', async () => {
      mockEmailService.getContacts.mockResolvedValue([]);
      
      const command = 'send email to unknown person';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('contact not found');
    });
  });

  describe('Email Composition', () => {
    it('composes basic email', async () => {
      const command = 'send email to john@example.com about project update';
      const result = await mockHandler.execute(command);

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'project update',
        body: expect.any(String),
        type: 'voice_command'
      });
    });

    it('composes template email', async () => {
      const command = 'send invoice 12345 to john@example.com';
      const result = await mockHandler.execute(command);

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Invoice #12345',
        template: 'invoice',
        templateData: { number: '12345' },
        type: 'voice_command'
      });
    });

    it('handles multiple recipients', async () => {
      const command = 'send email to john@example.com and jane@example.com';
      const result = await mockHandler.execute(command);

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: ['john@example.com', 'jane@example.com'],
        subject: expect.any(String),
        body: expect.any(String),
        type: 'voice_command'
      });
    });
  });

  describe('Error Handling', () => {
    it('handles email service errors', async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error('Service unavailable'));
      
      const command = 'send email to john@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service unavailable');
    });

    it('handles network errors gracefully', async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error('Network error'));
      
      const command = 'send email to john@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('handles template loading errors', async () => {
      mockEmailService.getEmailTemplates.mockRejectedValue(new Error('Templates unavailable'));
      
      const command = 'send invoice email to john@example.com';
      const result = await mockHandler.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Templates unavailable');
    });
  });

  describe('Command Confidence', () => {
    it('returns high confidence for exact matches', () => {
      const command = 'send email to john@example.com';
      const confidence = mockHandler.getConfidence(command);
      
      expect(confidence).toBeGreaterThan(0.9);
    });

    it('returns medium confidence for partial matches', () => {
      const command = 'email john about something';
      const confidence = mockHandler.getConfidence(command);
      
      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThan(0.9);
    });

    it('returns low confidence for unclear commands', () => {
      const command = 'send something to someone';
      const confidence = mockHandler.getConfidence(command);
      
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('Command Suggestions', () => {
    it('provides suggestions for failed commands', () => {
      const command = 'email john';
      const suggestions = mockHandler.getSuggestions(command);
      
      expect(suggestions).toContain('send email to john@example.com');
      expect(suggestions).toContain('send email to john about [subject]');
    });

    it('suggests template commands', () => {
      const command = 'send invoice';
      const suggestions = mockHandler.getSuggestions(command);
      
      expect(suggestions).toContain('send invoice email to [recipient]');
      expect(suggestions).toContain('send invoice [number] to [recipient]');
    });

    it('suggests contact-based commands', () => {
      const command = 'email';
      const suggestions = mockHandler.getSuggestions(command);
      
      expect(suggestions).toContain('send email to John Doe');
      expect(suggestions).toContain('send email to Jane Smith');
    });
  });

  describe('Integration Tests', () => {
    it('handles complete email workflow', async () => {
      const TestComponent = () => {
        const [result, setResult] = React.useState(null);
        
        const handleCommand = async () => {
          const command = 'send invoice 12345 to john@example.com about payment due';
          const result = await mockHandler.execute(command);
          setResult(result);
        };

        return (
          <div>
            <button onClick={handleCommand}>Execute Command</button>
            {result && (
              <div data-testid="result">
                {result.success ? 'Success' : 'Error'}
              </div>
            )}
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      const button = screen.getByRole('button', { name: /execute command/i });
      await userEvent.setup().click(button);

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Success');
      });

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Invoice #12345',
        template: 'invoice',
        templateData: { number: '12345' },
        type: 'voice_command'
      });
    });

    it('handles contact resolution workflow', async () => {
      const TestComponent = () => {
        const [contacts, setContacts] = React.useState([]);
        
        React.useEffect(() => {
          mockEmailService.getContacts().then(setContacts);
        }, []);

        return (
          <div>
            {contacts.map(contact => (
              <div key={contact.id} data-testid={`contact-${contact.id}`}>
                {contact.name}: {contact.email}
              </div>
            ))}
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('contact-1')).toHaveTextContent('John Doe: john@example.com');
        expect(screen.getByTestId('contact-2')).toHaveTextContent('Jane Smith: jane@example.com');
      });
    });
  });

  describe('Performance', () => {
    it('executes commands within reasonable time', async () => {
      const startTime = Date.now();
      
      const command = 'send email to john@example.com about test';
      await mockHandler.execute(command);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles concurrent commands', async () => {
      const commands = [
        'send email to john@example.com',
        'send email to jane@example.com',
        'send invoice email to client@example.com'
      ];

      const promises = commands.map(command => mockHandler.execute(command));
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('provides accessible command descriptions', () => {
      const description = mockHandler.getDescription();
      
      expect(description).toContain('email');
      expect(description).toContain('send');
      expect(description.length).toBeGreaterThan(10);
    });

    it('provides accessible error messages', async () => {
      const command = 'send email to invalid-email';
      mockEmailService.validateEmailAddress.mockReturnValue(false);
      
      const result = await mockHandler.execute(command);
      
      expect(result.error).toBeDefined();
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.accessibleError).toBeDefined();
    });
  });
});