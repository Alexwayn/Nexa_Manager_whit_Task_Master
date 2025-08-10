// Re-export a singleton instance of EmailCommandHandler for easier mocking in tests
import EmailCommandHandlerClass from '@/features/voice/handlers/EmailCommandHandler';

// Create a single instance so consumers (and tests) can mock methods directly
const EmailCommandHandler = new EmailCommandHandlerClass();

export default EmailCommandHandler;
