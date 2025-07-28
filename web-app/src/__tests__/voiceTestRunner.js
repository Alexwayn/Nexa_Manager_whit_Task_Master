import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Voice Assistant Test Runner
 * Comprehensive test execution and reporting for voice assistant components
 */
class VoiceTestRunner {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      coverage: true,
      watch: false,
      testPattern: 'voice',
      outputDir: './test-results',
      ...options
    };
    
    this.testSuites = [
      'unit',
      'integration',
      'e2e'
    ];
    
    this.testCategories = {
      unit: [
        'voiceAnalyticsService.test.js',
        'voiceFeedbackService.test.js',
        'helpService.test.js',
        'EmailCommandHandler.test.js'
      ],
      components: [
        'Voice.test.jsx',
        'VoiceActivationButton.test.jsx',
        'FloatingMicrophone.test.jsx',
        'VoiceIndicator.test.jsx',
        'VoiceFeedback.test.jsx',
        'VoiceFeedbackModal.test.jsx',
        'VoiceFeedbackButton.test.jsx',
        'FeedbackAnalysisTools.test.jsx',
        'VoiceCommandHelp.test.jsx',
        'VoiceOnboarding.test.jsx',
        'VoiceAssistantDemo.test.jsx'
      ],
      integration: [
        'voiceAssistant.integration.test.jsx',
        'voiceCommandProcessing.integration.test.js'
      ]
    };
  }

  /**
   * Run all voice assistant tests
   */
  async runAllTests() {
    console.log('🎤 Starting Voice Assistant Test Suite...\n');
    
    const results = {
      unit: null,
      components: null,
      integration: null,
      coverage: null,
      summary: null
    };

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Run unit tests
      console.log('📋 Running Unit Tests...');
      results.unit = await this.runUnitTests();

      // Run component tests
      console.log('🧩 Running Component Tests...');
      results.components = await this.runComponentTests();

      // Run integration tests
      console.log('🔗 Running Integration Tests...');
      results.integration = await this.runIntegrationTests();

      // Generate coverage report
      if (this.options.coverage) {
        console.log('📊 Generating Coverage Report...');
        results.coverage = await this.generateCoverageReport();
      }

      // Generate summary
      results.summary = this.generateSummary(results);

      // Save results
      await this.saveResults(results);

      console.log('\n✅ Voice Assistant Test Suite Complete!');
      this.printSummary(results.summary);

      return results;

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      throw error;
    }
  }

  /**
   * Run unit tests
   */
  async runUnitTests() {
    const testFiles = this.testCategories.unit.join(' ');
    const command = this.buildJestCommand({
      testNamePattern: testFiles,
      testPathPattern: 'services|handlers',
      collectCoverage: false
    });

    return this.executeTests(command, 'Unit Tests');
  }

  /**
   * Run component tests
   */
  async runComponentTests() {
    const testFiles = this.testCategories.components.join(' ');
    const command = this.buildJestCommand({
      testNamePattern: testFiles,
      testPathPattern: 'components',
      collectCoverage: false
    });

    return this.executeTests(command, 'Component Tests');
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    const testFiles = this.testCategories.integration.join(' ');
    const command = this.buildJestCommand({
      testNamePattern: testFiles,
      testPathPattern: 'integration',
      collectCoverage: false
    });

    return this.executeTests(command, 'Integration Tests');
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport() {
    const command = this.buildJestCommand({
      collectCoverage: true,
      coverageDirectory: path.join(this.options.outputDir, 'coverage'),
      coverageReporters: ['text', 'html', 'lcov', 'json'],
      testPathPattern: 'voice'
    });

    return this.executeTests(command, 'Coverage Report');
  }

  /**
   * Build Jest command
   */
  buildJestCommand(options = {}) {
    const {
      testNamePattern,
      testPathPattern,
      collectCoverage = false,
      coverageDirectory,
      coverageReporters = ['text'],
      maxWorkers = '50%'
    } = options;

    let command = 'npx jest';

    if (testNamePattern) {
      command += ` --testNamePattern="${testNamePattern}"`;
    }

    if (testPathPattern) {
      command += ` --testPathPattern="${testPathPattern}"`;
    }

    if (collectCoverage) {
      command += ' --coverage';
      
      if (coverageDirectory) {
        command += ` --coverageDirectory="${coverageDirectory}"`;
      }
      
      command += ` --coverageReporters=${coverageReporters.join(',')}`;
      
      // Coverage thresholds
      command += ' --coverageThreshold=\'{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}\'';
    }

    command += ` --maxWorkers=${maxWorkers}`;
    command += ' --detectOpenHandles';
    command += ' --forceExit';

    if (this.options.verbose) {
      command += ' --verbose';
    }

    if (this.options.watch) {
      command += ' --watch';
    }

    return command;
  }

  /**
   * Execute tests
   */
  async executeTests(command, testType) {
    const startTime = Date.now();
    
    try {
      console.log(`  Running: ${command}\n`);
      
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const duration = Date.now() - startTime;
      const result = this.parseTestOutput(output, testType, duration);
      
      console.log(`  ✅ ${testType} completed in ${duration}ms\n`);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result = this.parseTestOutput(error.stdout || error.message, testType, duration, true);
      
      console.log(`  ❌ ${testType} failed in ${duration}ms\n`);
      
      return result;
    }
  }

  /**
   * Parse test output
   */
  parseTestOutput(output, testType, duration, failed = false) {
    const lines = output.split('\n');
    
    // Extract test results using regex patterns
    const testSuitePattern = /Test Suites: (\d+) failed, (\d+) passed, (\d+) total/;
    const testPattern = /Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/;
    const coveragePattern = /All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/;

    let testSuites = { failed: 0, passed: 0, total: 0 };
    let tests = { failed: 0, passed: 0, total: 0 };
    let coverage = { statements: 0, branches: 0, functions: 0, lines: 0 };

    lines.forEach(line => {
      const suiteMatch = line.match(testSuitePattern);
      if (suiteMatch) {
        testSuites = {
          failed: parseInt(suiteMatch[1]),
          passed: parseInt(suiteMatch[2]),
          total: parseInt(suiteMatch[3])
        };
      }

      const testMatch = line.match(testPattern);
      if (testMatch) {
        tests = {
          failed: parseInt(testMatch[1]),
          passed: parseInt(testMatch[2]),
          total: parseInt(testMatch[3])
        };
      }

      const coverageMatch = line.match(coveragePattern);
      if (coverageMatch) {
        coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }
    });

    return {
      testType,
      duration,
      failed,
      testSuites,
      tests,
      coverage,
      output: output.substring(0, 1000) // Truncate for storage
    };
  }

  /**
   * Generate summary
   */
  generateSummary(results) {
    const summary = {
      totalDuration: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      overallCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
      success: true
    };

    Object.values(results).forEach(result => {
      if (result && typeof result === 'object' && result.duration) {
        summary.totalDuration += result.duration;
        summary.totalTests += result.tests.total;
        summary.totalPassed += result.tests.passed;
        summary.totalFailed += result.tests.failed;
        
        if (result.failed) {
          summary.success = false;
        }
      }
    });

    // Calculate overall coverage from coverage result
    if (results.coverage && results.coverage.coverage) {
      summary.overallCoverage = results.coverage.coverage;
    }

    summary.successRate = summary.totalTests > 0 
      ? (summary.totalPassed / summary.totalTests * 100).toFixed(2)
      : 0;

    return summary;
  }

  /**
   * Print summary
   */
  printSummary(summary) {
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.totalPassed}`);
    console.log(`Failed: ${summary.totalFailed}`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log(`Duration: ${summary.totalDuration}ms`);
    
    if (summary.overallCoverage.statements > 0) {
      console.log('\n📈 Coverage:');
      console.log(`Statements: ${summary.overallCoverage.statements}%`);
      console.log(`Branches: ${summary.overallCoverage.branches}%`);
      console.log(`Functions: ${summary.overallCoverage.functions}%`);
      console.log(`Lines: ${summary.overallCoverage.lines}%`);
    }
    
    console.log(`\nOverall: ${summary.success ? '✅ PASSED' : '❌ FAILED'}`);
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Setup environment variables
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_VOICE_ENABLED = 'true';
    process.env.REACT_APP_ANALYTICS_ENABLED = 'false';
  }

  /**
   * Save results
   */
  async saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `voice-test-results-${timestamp}.json`;
    const filepath = path.join(this.options.outputDir, filename);

    const reportData = {
      timestamp: new Date().toISOString(),
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Results saved to: ${filepath}`);
  }

  /**
   * Run specific test category
   */
  async runCategory(category) {
    if (!this.testCategories[category]) {
      throw new Error(`Unknown test category: ${category}`);
    }

    console.log(`🎯 Running ${category} tests...`);
    
    const testFiles = this.testCategories[category].join(' ');
    const command = this.buildJestCommand({
      testNamePattern: testFiles,
      testPathPattern: category
    });

    return this.executeTests(command, `${category} Tests`);
  }

  /**
   * Run tests in watch mode
   */
  async runWatch() {
    this.options.watch = true;
    console.log('👀 Running tests in watch mode...');
    
    const command = this.buildJestCommand({
      testPathPattern: 'voice'
    });

    return this.executeTests(command, 'Watch Mode');
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    
    const command = this.buildJestCommand({
      testNamePattern: 'performance',
      testPathPattern: 'voice',
      maxWorkers: 1 // Single worker for consistent performance measurements
    });

    return this.executeTests(command, 'Performance Tests');
  }

  /**
   * Validate test environment
   */
  validateEnvironment() {
    const requirements = [
      'jest',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event'
    ];

    const missing = [];
    
    requirements.forEach(pkg => {
      try {
        require.resolve(pkg);
      } catch (error) {
        missing.push(pkg);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required packages: ${missing.join(', ')}`);
    }

    console.log('✅ Test environment validated');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--verbose') options.verbose = true;
    if (arg === '--no-coverage') options.coverage = false;
    if (arg === '--watch') options.watch = true;
    if (arg.startsWith('--output=')) options.outputDir = arg.split('=')[1];
  });

  const runner = new VoiceTestRunner(options);
  
  // Validate environment first
  try {
    runner.validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }

  // Run tests based on arguments
  const command = args[0];
  
  switch (command) {
    case 'unit':
      runner.runUnitTests().catch(error => {
        console.error('Unit tests failed:', error);
        process.exit(1);
      });
      break;
      
    case 'components':
      runner.runComponentTests().catch(error => {
        console.error('Component tests failed:', error);
        process.exit(1);
      });
      break;
      
    case 'integration':
      runner.runIntegrationTests().catch(error => {
        console.error('Integration tests failed:', error);
        process.exit(1);
      });
      break;
      
    case 'watch':
      runner.runWatch().catch(error => {
        console.error('Watch mode failed:', error);
        process.exit(1);
      });
      break;
      
    case 'performance':
      runner.runPerformanceTests().catch(error => {
        console.error('Performance tests failed:', error);
        process.exit(1);
      });
      break;
      
    default:
      runner.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
      });
  }
}

export default VoiceTestRunner;