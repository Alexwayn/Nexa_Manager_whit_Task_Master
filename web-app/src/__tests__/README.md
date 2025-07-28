# Voice Assistant Testing Documentation

This document provides comprehensive information about testing the voice assistant functionality in the Nexa Manager application.

## Overview

The voice assistant testing suite includes unit tests, integration tests, and performance tests for all voice-related components and services. The tests are designed to ensure reliability, accessibility, and performance of the voice assistant features.

## Test Structure

```
src/__tests__/
├── config/
│   ├── jest.voice.config.json      # Jest configuration for voice tests
│   ├── globalMocks.js              # Global browser API mocks
│   ├── testResultsProcessor.js     # Custom test results processor
│   └── voiceTestSetup.js           # Voice-specific test setup
├── utils/
│   ├── voiceTestUtils.js           # Voice testing utilities
│   └── voiceTestRunner.js          # Test runner with CLI interface
├── __mocks__/
│   └── fileMock.js                 # Static file mock
├── unit/
│   ├── components/                 # Voice component unit tests
│   └── services/                   # Voice service unit tests
└── integration/
    ├── voiceAssistant.integration.test.jsx
    └── voiceCommandProcessing.integration.test.js
```

## Running Tests

### Basic Commands

```bash
# Run all voice tests
npm run test:voice

# Run with watch mode
npm run test:voice:watch

# Run with coverage
npm run test:voice:coverage

# Run only unit tests
npm run test:voice:unit

# Run only integration tests
npm run test:voice:integration

# Run component tests
npm run test:voice:components

# Run service tests
npm run test:voice:services

# Run performance tests
npm run test:voice:performance

# Debug tests
npm run test:voice:debug

# CI mode
npm run test:voice:ci
```

### Advanced Test Runner

The voice test runner provides additional functionality:

```bash
# Run specific test categories
node src/__tests__/utils/voiceTestRunner.js --category=unit
node src/__tests__/utils/voiceTestRunner.js --category=integration

# Performance testing
node src/__tests__/utils/voiceTestRunner.js --mode=performance

# Watch mode with specific patterns
node src/__tests__/utils/voiceTestRunner.js --watch --pattern="VoiceActivation"

# Generate detailed reports
node src/__tests__/utils/voiceTestRunner.js --report=detailed
```

## Test Categories

### Unit Tests

#### Components
- **VoiceActivationButton**: Activation, states, accessibility
- **FloatingMicrophone**: Display, positioning, interactions
- **VoiceIndicator**: Status display, animations, real-time updates
- **VoiceFeedbackButton**: Feedback collection, modal interactions
- **VoiceCommandHelp**: Command display, search, categories
- **VoiceOnboarding**: Step navigation, permissions, practice mode
- **VoiceAssistantDemo**: Demo mode, command execution, progress
- **Voice**: Main component integration, state management

#### Services
- **EmailCommandHandler**: Email command processing, validation
- **helpService**: Command retrieval, search, caching

### Integration Tests

#### Voice Assistant Integration
- Complete workflow testing
- Component synchronization
- State management across components
- Error handling and recovery
- Performance and resource management

#### Command Processing Integration
- Command routing and execution
- Confidence scoring
- Analytics integration
- Error handling

## Test Utilities

### renderWithVoiceProvider

Custom render function for voice components:

```javascript
import { renderWithVoiceProvider } from '../utils/voiceTestUtils';

const { getByRole, simulateVoiceResult } = renderWithVoiceProvider(
  <VoiceActivationButton />
);

// Simulate voice recognition events
simulateVoiceResult('test command', 0.9);
```

### Mock Services

Comprehensive mocking for voice services:

```javascript
import { setupVoiceServiceMocks } from '../utils/voiceTestUtils';

const mocks = setupVoiceServiceMocks();
// All voice services are now mocked with realistic behavior
```

### Test Data Factories

Generate realistic test data:

```javascript
import { 
  createMockVoiceCommand,
  createMockFeedback,
  createMockAnalytics 
} from '../utils/voiceTestUtils';

const command = createMockVoiceCommand({
  text: 'send email',
  confidence: 0.95
});
```

## Coverage Requirements

The voice assistant tests maintain high coverage standards:

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

Coverage is collected from:
- `src/features/voice/**/*.{js,jsx,ts,tsx}`
- `src/shared/services/voice/**/*.{js,jsx,ts,tsx}`
- `src/shared/hooks/voice/**/*.{js,jsx,ts,tsx}`

## Browser API Mocking

Comprehensive mocking of browser APIs:

### Web Speech API
- SpeechRecognition
- SpeechSynthesis
- SpeechGrammarList

### Media APIs
- MediaDevices
- AudioContext
- MediaStream

### Permission API
- navigator.permissions
- Permission states

### Storage APIs
- localStorage
- sessionStorage
- IndexedDB

## Performance Testing

Performance tests ensure the voice assistant meets performance requirements:

### Metrics Tracked
- Component render time
- Voice recognition latency
- Memory usage
- Event handler performance

### Thresholds
- Component mount: < 100ms
- Voice activation: < 200ms
- Command processing: < 500ms
- Memory leaks: None detected

## Accessibility Testing

Voice assistant accessibility is thoroughly tested:

### ARIA Attributes
- Proper labeling
- State announcements
- Role definitions

### Keyboard Navigation
- Tab order
- Keyboard shortcuts
- Focus management

### Screen Reader Support
- Meaningful announcements
- Status updates
- Error messages

## Error Scenarios

Tests cover various error conditions:

### Permission Errors
- Microphone access denied
- Permission revoked during use
- Browser compatibility issues

### Network Errors
- Service unavailability
- Timeout conditions
- Retry mechanisms

### Recognition Errors
- No speech detected
- Unclear speech
- Unsupported commands

## Best Practices

### Writing Voice Tests

1. **Use realistic scenarios**: Test with actual voice commands users would speak
2. **Mock browser APIs properly**: Ensure consistent behavior across test runs
3. **Test accessibility**: Include ARIA attributes and keyboard navigation
4. **Handle async operations**: Use proper async/await patterns
5. **Test error conditions**: Cover permission denials, network failures, etc.

### Test Organization

1. **Group related tests**: Use describe blocks for logical grouping
2. **Use descriptive names**: Test names should clearly indicate what's being tested
3. **Setup and teardown**: Properly clean up after tests
4. **Avoid test interdependence**: Each test should be independent

### Performance Considerations

1. **Mock heavy operations**: Don't perform actual voice recognition in tests
2. **Limit DOM queries**: Use efficient selectors
3. **Clean up resources**: Prevent memory leaks in tests
4. **Parallel execution**: Ensure tests can run in parallel

## Troubleshooting

### Common Issues

#### Tests timing out
- Increase timeout in jest.voice.config.json
- Check for unresolved promises
- Ensure proper cleanup

#### Mock not working
- Verify mock setup in voiceTestSetup.js
- Check import paths
- Ensure mocks are applied before imports

#### Coverage not accurate
- Check collectCoverageFrom patterns
- Verify file paths in configuration
- Ensure all relevant files are included

### Debug Mode

Run tests in debug mode for detailed information:

```bash
npm run test:voice:debug
```

This will:
- Show open handles
- Force exit after completion
- Provide detailed error information
- Display performance metrics

## Continuous Integration

Voice tests are integrated into the CI pipeline:

### Pre-commit Hooks
- Run voice unit tests
- Check coverage thresholds
- Validate test structure

### CI Pipeline
- Full test suite execution
- Coverage reporting
- Performance benchmarking
- Accessibility validation

## Reporting

Test results are processed and formatted into multiple formats:

### Available Reports
- JSON: Machine-readable results
- HTML: Interactive web report
- Markdown: Documentation-friendly format
- CSV: Spreadsheet-compatible data

### Report Contents
- Test suite summaries
- Coverage metrics
- Performance data
- Failure analysis
- Environment information

## Contributing

When adding new voice features:

1. **Write tests first**: Follow TDD principles
2. **Update documentation**: Keep this guide current
3. **Maintain coverage**: Ensure new code meets coverage requirements
4. **Test accessibility**: Include accessibility tests for UI components
5. **Performance testing**: Add performance tests for critical paths

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [ARIA Guidelines](https://www.w3.org/WAI/ARIA/apg/)
- [Performance Testing](https://web.dev/performance/)