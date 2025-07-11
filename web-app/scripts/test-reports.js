#!/usr/bin/env node

/**
 * Test Runner Script for Reports System
 * Executes all types of tests and generates comprehensive reports
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Test configuration
const TEST_CONFIG = {
  unit: {
    command: 'npm',
    args: ['run', 'test', '--', '--coverage', '--watchAll=false', '--testPathPattern=__tests__/(components|services|hooks)'],
    description: 'Unit Tests'
  },
  integration: {
    command: 'npm',
    args: ['run', 'test', '--', '--coverage', '--watchAll=false', '--testPathPattern=integration'],
    description: 'Integration Tests'
  },
  e2e: {
    command: 'npx',
    args: ['playwright', 'test', 'src/__tests__/e2e/reports.e2e.test.js'],
    description: 'End-to-End Tests'
  },
  performance: {
    command: 'npx',
    args: ['playwright', 'test', 'src/__tests__/performance/reports.performance.test.js'],
    description: 'Performance Tests'
  },
  accessibility: {
    command: 'npx',
    args: ['playwright', 'test', 'src/__tests__/accessibility/reports.accessibility.test.js'],
    description: 'Accessibility Tests'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  },
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  }
};

/**
 * Main test runner function
 */
async function runTests() {
  console.log(`${colors.cyan}${colors.bright}🧪 Reports System Test Runner${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const testTypes = args.length > 0 ? args : Object.keys(TEST_CONFIG);
  
  console.log(`${colors.blue}Running test types: ${testTypes.join(', ')}${colors.reset}\n`);
  
  // Setup test environment
  await setupTestEnvironment();
  
  // Run tests sequentially
  for (const testType of testTypes) {
    if (TEST_CONFIG[testType]) {
      await runTestSuite(testType, TEST_CONFIG[testType]);
    } else {
      console.log(`${colors.yellow}⚠️  Unknown test type: ${testType}${colors.reset}`);
    }
  }
  
  // Generate final report
  const totalDuration = Date.now() - startTime;
  testResults.summary.duration = totalDuration;
  
  await generateTestReport();
  await cleanupTestEnvironment();
  
  // Exit with appropriate code
  const exitCode = testResults.summary.failed > 0 ? 1 : 0;
  
  console.log(`\n${colors.bright}📊 Test Summary:${colors.reset}`);
  console.log(`   Total: ${testResults.summary.total}`);
  console.log(`   ${colors.green}Passed: ${testResults.summary.passed}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${testResults.summary.failed}${colors.reset}`);
  console.log(`   ${colors.yellow}Skipped: ${testResults.summary.skipped}${colors.reset}`);
  console.log(`   Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  
  if (exitCode === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Some tests failed!${colors.reset}`);
  }
  
  process.exit(exitCode);
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log(`${colors.blue}🔧 Setting up test environment...${colors.reset}`);
  
  // Create test directories
  const testDirs = [
    path.join(projectRoot, 'test-results'),
    path.join(projectRoot, 'test-downloads'),
    path.join(projectRoot, 'coverage')
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Set environment variables
  process.env.NODE_ENV = 'test';
  process.env.CI = process.env.CI || 'false';
  process.env.REACT_APP_TEST_MODE = 'true';
  
  console.log(`${colors.green}✅ Test environment ready${colors.reset}\n`);
}

/**
 * Run a specific test suite
 */
async function runTestSuite(testType, config) {
  console.log(`${colors.magenta}${colors.bright}🧪 Running ${config.description}...${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    const result = await executeCommand(config.command, config.args, {
      cwd: projectRoot,
      env: { ...process.env }
    });
    
    const duration = Date.now() - startTime;
    
    testResults.tests[testType] = {
      type: testType,
      description: config.description,
      status: 'passed',
      duration,
      output: result.stdout,
      error: result.stderr
    };
    
    testResults.summary.passed++;
    testResults.summary.total++;
    
    console.log(`${colors.green}✅ ${config.description} completed in ${(duration / 1000).toFixed(2)}s${colors.reset}\n`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.tests[testType] = {
      type: testType,
      description: config.description,
      status: 'failed',
      duration,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
    
    testResults.summary.failed++;
    testResults.summary.total++;
    
    console.log(`${colors.red}❌ ${config.description} failed in ${(duration / 1000).toFixed(2)}s${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
  }
}

/**
 * Execute a command and return promise
 */
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data); // Real-time output
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data); // Real-time output
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        const error = new Error(`Command failed with exit code ${code}`);
        error.stdout = stdout;
        error.stderr = stderr;
        error.code = code;
        reject(error);
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport() {
  console.log(`${colors.blue}📊 Generating test report...${colors.reset}`);
  
  const reportPath = path.join(projectRoot, 'test-results', 'reports-test-summary.json');
  const htmlReportPath = path.join(projectRoot, 'test-results', 'reports-test-summary.html');
  
  // Write JSON report
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHtmlReport();
  fs.writeFileSync(htmlReportPath, htmlReport);
  
  // Generate coverage report if available
  await generateCoverageReport();
  
  console.log(`${colors.green}✅ Test report generated: ${reportPath}${colors.reset}`);
  console.log(`${colors.green}✅ HTML report generated: ${htmlReportPath}${colors.reset}`);
}

/**
 * Generate HTML test report
 */
function generateHtmlReport() {
  const { summary, tests, timestamp, environment } = testResults;
  
  const testRows = Object.values(tests).map(test => `
    <tr class="${test.status}">
      <td>${test.description}</td>
      <td><span class="status ${test.status}">${test.status.toUpperCase()}</span></td>
      <td>${(test.duration / 1000).toFixed(2)}s</td>
      <td>
        ${test.error ? `<details><summary>Error</summary><pre>${escapeHtml(test.error)}</pre></details>` : 'N/A'}
      </td>
    </tr>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports System Test Results</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .passed .metric-value { color: #28a745; }
        .failed .metric-value { color: #dc3545; }
        .total .metric-value { color: #007bff; }
        .duration .metric-value { color: #6f42c1; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .environment { background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 30px; }
        details { margin-top: 10px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Reports System Test Results</h1>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric total">
            <div class="metric-value">${summary.total}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric passed">
            <div class="metric-value">${summary.passed}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric failed">
            <div class="metric-value">${summary.failed}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric duration">
            <div class="metric-value">${(summary.duration / 1000).toFixed(1)}s</div>
            <div class="metric-label">Duration</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Test Suite</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>${testRows}
        </tbody>
    </table>
    
    <div class="environment">
        <h3>Environment</h3>
        <p><strong>Node.js:</strong> ${environment.nodeVersion}</p>
        <p><strong>Platform:</strong> ${environment.platform}</p>
        <p><strong>Architecture:</strong> ${environment.arch}</p>
    </div>
</body>
</html>
  `;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate coverage report
 */
async function generateCoverageReport() {
  try {
    const coveragePath = path.join(projectRoot, 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      
      testResults.coverage = {
        statements: coverage.total.statements.pct,
        branches: coverage.total.branches.pct,
        functions: coverage.total.functions.pct,
        lines: coverage.total.lines.pct
      };
      
      console.log(`${colors.green}✅ Coverage report included${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not generate coverage report: ${error.message}${colors.reset}`);
  }
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment() {
  console.log(`${colors.blue}🧹 Cleaning up test environment...${colors.reset}`);
  
  // Clean up temporary files
  const tempDirs = [
    path.join(projectRoot, 'test-downloads'),
    path.join(projectRoot, 'temp')
  ];
  
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  
  console.log(`${colors.green}✅ Cleanup completed${colors.reset}`);
}

/**
 * Handle process signals
 */
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}🛑 Test run interrupted${colors.reset}`);
  await cleanupTestEnvironment();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log(`\n${colors.yellow}🛑 Test run terminated${colors.reset}`);
  await cleanupTestEnvironment();
  process.exit(1);
});

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error(`${colors.red}💥 Test runner failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export { runTests, TEST_CONFIG };