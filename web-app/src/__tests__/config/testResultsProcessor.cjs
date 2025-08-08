/**
 * Custom test results processor for voice assistant tests
 * Processes Jest test results and generates enhanced reports
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Process test results and generate enhanced reports
 * @param {Object} results - Jest test results
 * @returns {Object} Processed results
 */
module.exports = function processTestResults(results) {
  const timestamp = new Date().toISOString();
  const outputDir = path.join(process.cwd(), 'coverage', 'voice');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process and enhance results
  const processedResults = {
    timestamp,
    summary: generateSummary(results),
    testSuites: processTestSuites(results.testResults),
    coverage: processCoverage(results.coverageMap),
    performance: analyzePerformance(results.testResults),
    failures: extractFailures(results.testResults),
    warnings: extractWarnings(results.testResults),
    environment: getEnvironmentInfo(),
    metadata: {
      jestVersion: results.jestVersion || 'unknown',
      totalTime: results.runTime || 0,
      startTime: results.startTime || Date.now(),
      success: results.success || false,
      numTotalTestSuites: results.numTotalTestSuites || 0,
      numPassedTestSuites: results.numPassedTestSuites || 0,
      numFailedTestSuites: results.numFailedTestSuites || 0,
      numTotalTests: results.numTotalTests || 0,
      numPassedTests: results.numPassedTests || 0,
      numFailedTests: results.numFailedTests || 0,
      numPendingTests: results.numPendingTests || 0,
      numTodoTests: results.numTodoTests || 0
    }
  };

  // Generate reports
  generateJsonReport(processedResults, outputDir);
  generateHtmlSummary(processedResults, outputDir);
  generateMarkdownReport(processedResults, outputDir);
  generateCsvReport(processedResults, outputDir);

  // Log summary to console
  logSummary(processedResults.summary);

  return results; // Return original results for Jest
}

/**
 * Generate test summary
 */
function generateSummary(results) {
  const totalTests = results.numTotalTests || 0;
  const passedTests = results.numPassedTests || 0;
  const failedTests = results.numFailedTests || 0;
  const pendingTests = results.numPendingTests || 0;
  const todoTests = results.numTodoTests || 0;

  return {
    totalTests,
    passedTests,
    failedTests,
    pendingTests,
    todoTests,
    successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0,
    failureRate: totalTests > 0 ? ((failedTests / totalTests) * 100).toFixed(2) : 0,
    totalTime: results.runTime || 0,
    averageTestTime: totalTests > 0 ? ((results.runTime || 0) / totalTests).toFixed(2) : 0,
    status: results.success ? 'PASSED' : 'FAILED'
  };
}

/**
 * Process test suites
 */
function processTestSuites(testResults) {
  if (!testResults) {
    return [];
  }
  return testResults.map(suite => ({
    name: suite && suite.testFilePath ? path.basename(suite.testFilePath) : 'unknown',
    fullPath: suite.testFilePath || 'unknown',
    status: suite.status || 'unknown',
    duration: suite.perfStats ? suite.perfStats.runtime : 0,
    numTests: suite.numPassingTests + suite.numFailingTests + suite.numPendingTests + suite.numTodoTests,
    numPassing: suite.numPassingTests || 0,
    numFailing: suite.numFailingTests || 0,
    numPending: suite.numPendingTests || 0,
    numTodo: suite.numTodoTests || 0,
    tests: suite.testResults ? suite.testResults.map(test => ({
      title: test.title || 'unknown',
      fullName: test.fullName || 'unknown',
      status: test.status || 'unknown',
      duration: test.duration || 0,
      failureMessages: test.failureMessages || [],
      ancestorTitles: test.ancestorTitles || []
    })) : [],
    failureMessage: suite.failureMessage || null,
    coverage: extractSuiteCoverage(suite)
  }));
}

/**
 * Process coverage information
 */
function processCoverage(coverageMap) {
  if (!coverageMap) return null;

  const summary = {
    statements: { total: 0, covered: 0, percentage: 0 },
    branches: { total: 0, covered: 0, percentage: 0 },
    functions: { total: 0, covered: 0, percentage: 0 },
    lines: { total: 0, covered: 0, percentage: 0 }
  };

  const files = [];

  // Process coverage data if available
  if (coverageMap.getCoverageSummary) {
    const globalSummary = coverageMap.getCoverageSummary();
    
    summary.statements = {
      total: globalSummary.statements.total,
      covered: globalSummary.statements.covered,
      percentage: globalSummary.statements.pct
    };
    
    summary.branches = {
      total: globalSummary.branches.total,
      covered: globalSummary.branches.covered,
      percentage: globalSummary.branches.pct
    };
    
    summary.functions = {
      total: globalSummary.functions.total,
      covered: globalSummary.functions.covered,
      percentage: globalSummary.functions.pct
    };
    
    summary.lines = {
      total: globalSummary.lines.total,
      covered: globalSummary.lines.covered,
      percentage: globalSummary.lines.pct
    };

    // Process individual files
    coverageMap.files().forEach(filePath => {
      const fileCoverage = coverageMap.fileCoverageFor(filePath);
      const fileSummary = fileCoverage.toSummary();
      
      files.push({
        path: filePath,
        name: path.basename(filePath),
        statements: {
          total: fileSummary.statements.total,
          covered: fileSummary.statements.covered,
          percentage: fileSummary.statements.pct
        },
        branches: {
          total: fileSummary.branches.total,
          covered: fileSummary.branches.covered,
          percentage: fileSummary.branches.pct
        },
        functions: {
          total: fileSummary.functions.total,
          covered: fileSummary.functions.covered,
          percentage: fileSummary.functions.pct
        },
        lines: {
          total: fileSummary.lines.total,
          covered: fileSummary.lines.covered,
          percentage: fileSummary.lines.pct
        }
      });
    });
  }

  return { summary, files };
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(testResults) {
  const suitePerformance = testResults.map(suite => ({
    name: path.basename(suite.testFilePath || 'unknown'),
    duration: suite.perfStats ? suite.perfStats.runtime : 0,
    slow: suite.perfStats ? suite.perfStats.slow : false
  }));

  const totalDuration = suitePerformance.reduce((sum, suite) => sum + suite.duration, 0);
  const averageDuration = suitePerformance.length > 0 ? totalDuration / suitePerformance.length : 0;
  const slowestSuite = suitePerformance.reduce((slowest, current) => 
    current.duration > slowest.duration ? current : slowest, 
    { duration: 0 }
  );

  return {
    totalDuration,
    averageDuration: parseFloat(averageDuration.toFixed(2)),
    slowestSuite,
    suitePerformance: suitePerformance.sort((a, b) => b.duration - a.duration)
  };
}

/**
 * Extract test failures
 */
function extractFailures(testResults) {
  const failures = [];

  testResults.forEach(suite => {
    if (suite.testResults) {
      suite.testResults.forEach(test => {
        if (test.status === 'failed') {
          failures.push({
            suite: path.basename(suite.testFilePath || 'unknown'),
            test: test.fullName || test.title || 'unknown',
            messages: test.failureMessages || [],
            duration: test.duration || 0
          });
        }
      });
    }
  });

  return failures;
}

/**
 * Extract warnings
 */
function extractWarnings(testResults) {
  const warnings = [];

  testResults.forEach(suite => {
    if (suite.console) {
      suite.console.forEach(log => {
        if (log.type === 'warn') {
          warnings.push({
            suite: path.basename(suite.testFilePath || 'unknown'),
            message: log.message,
            origin: log.origin
          });
        }
      });
    }
  });

  return warnings;
}

/**
 * Get environment information
 */
function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    cwd: process.cwd(),
    env: process.env.NODE_ENV || 'unknown'
  };
}

/**
 * Extract suite-specific coverage
 */
function extractSuiteCoverage(suite) {
  // This would need to be implemented based on how coverage is tracked per suite
  return null;
}

/**
 * Generate JSON report
 */
function generateJsonReport(results, outputDir) {
  const reportPath = path.join(outputDir, 'voice-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON report saved to: ${reportPath}`);
}

/**
 * Generate HTML summary
 */
function generateHtmlSummary(results, outputDir) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Assistant Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px 20px; border-radius: 4px; font-weight: bold; display: inline-block; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section h3 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .failure { background: #fff5f5; }
        .success { background: #f0fff4; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎤 Voice Assistant Test Results</h1>
            <div class="status ${results.summary.status.toLowerCase()}">${results.summary.status}</div>
            <div class="timestamp">Generated: ${results.timestamp}</div>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${results.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.totalTime}ms</div>
                <div class="metric-label">Total Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.averageTestTime}ms</div>
                <div class="metric-label">Avg Test Time</div>
            </div>
        </div>

        ${results.coverage ? `
        <div class="section">
            <h3>📊 Coverage Summary</h3>
            <table>
                <tr>
                    <th>Type</th>
                    <th>Covered</th>
                    <th>Total</th>
                    <th>Percentage</th>
                </tr>
                <tr>
                    <td>Statements</td>
                    <td>${results.coverage.summary.statements.covered}</td>
                    <td>${results.coverage.summary.statements.total}</td>
                    <td>${results.coverage.summary.statements.percentage}%</td>
                </tr>
                <tr>
                    <td>Branches</td>
                    <td>${results.coverage.summary.branches.covered}</td>
                    <td>${results.coverage.summary.branches.total}</td>
                    <td>${results.coverage.summary.branches.percentage}%</td>
                </tr>
                <tr>
                    <td>Functions</td>
                    <td>${results.coverage.summary.functions.covered}</td>
                    <td>${results.coverage.summary.functions.total}</td>
                    <td>${results.coverage.summary.functions.percentage}%</td>
                </tr>
                <tr>
                    <td>Lines</td>
                    <td>${results.coverage.summary.lines.covered}</td>
                    <td>${results.coverage.summary.lines.total}</td>
                    <td>${results.coverage.summary.lines.percentage}%</td>
                </tr>
            </table>
        </div>
        ` : ''}

        <div class="section">
            <h3>🧪 Test Suites</h3>
            <table>
                <tr>
                    <th>Suite</th>
                    <th>Status</th>
                    <th>Tests</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Duration</th>
                </tr>
                ${results.testSuites.map(suite => `
                <tr class="${suite.status === 'passed' ? 'success' : suite.status === 'failed' ? 'failure' : ''}">
                    <td>${suite.name}</td>
                    <td>${suite.status}</td>
                    <td>${suite.numTests}</td>
                    <td>${suite.numPassing}</td>
                    <td>${suite.numFailing}</td>
                    <td>${suite.duration}ms</td>
                </tr>
                `).join('')}
            </table>
        </div>

        ${results.failures.length > 0 ? `
        <div class="section">
            <h3>❌ Failures</h3>
            ${results.failures.map(failure => `
            <div class="failure" style="margin: 10px 0; padding: 15px; border-radius: 4px;">
                <strong>${failure.suite} - ${failure.test}</strong>
                <pre style="margin: 10px 0; white-space: pre-wrap;">${failure.messages.join('\n')}</pre>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h3>⚡ Performance</h3>
            <p>Total Duration: ${results.performance.totalDuration}ms</p>
            <p>Average Duration: ${results.performance.averageDuration}ms</p>
            <p>Slowest Suite: ${results.performance.slowestSuite.name} (${results.performance.slowestSuite.duration}ms)</p>
        </div>

        <div class="section">
            <h3>🖥️ Environment</h3>
            <table>
                <tr><td>Node Version</td><td>${results.environment.nodeVersion}</td></tr>
                <tr><td>Platform</td><td>${results.environment.platform}</td></tr>
                <tr><td>Architecture</td><td>${results.environment.arch}</td></tr>
                <tr><td>CPUs</td><td>${results.environment.cpus}</td></tr>
                <tr><td>Memory</td><td>${results.environment.memory}</td></tr>
                <tr><td>Environment</td><td>${results.environment.env}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
  `;

  const reportPath = path.join(outputDir, 'voice-test-summary.html');
  fs.writeFileSync(reportPath, html);
  console.log(`📄 HTML summary saved to: ${reportPath}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results, outputDir) {
  const markdown = `
# 🎤 Voice Assistant Test Results

**Status:** ${results.summary.status}  
**Generated:** ${results.timestamp}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.summary.totalTests} |
| Passed | ${results.summary.passedTests} |
| Failed | ${results.summary.failedTests} |
| Success Rate | ${results.summary.successRate}% |
| Total Time | ${results.summary.totalTime}ms |
| Average Test Time | ${results.summary.averageTestTime}ms |

${results.coverage ? `
## 📈 Coverage

| Type | Covered | Total | Percentage |
|------|---------|-------|------------|
| Statements | ${results.coverage.summary.statements.covered} | ${results.coverage.summary.statements.total} | ${results.coverage.summary.statements.percentage}% |
| Branches | ${results.coverage.summary.branches.covered} | ${results.coverage.summary.branches.total} | ${results.coverage.summary.branches.percentage}% |
| Functions | ${results.coverage.summary.functions.covered} | ${results.coverage.summary.functions.total} | ${results.coverage.summary.functions.percentage}% |
| Lines | ${results.coverage.summary.lines.covered} | ${results.coverage.summary.lines.total} | ${results.coverage.summary.lines.percentage}% |
` : ''}

## 🧪 Test Suites

| Suite | Status | Tests | Passed | Failed | Duration |
|-------|--------|-------|--------|--------|----------|
${results.testSuites.map(suite => 
  `| ${suite.name} | ${suite.status} | ${suite.numTests} | ${suite.numPassing} | ${suite.numFailing} | ${suite.duration}ms |`
).join('\n')}

${results.failures.length > 0 ? `
## ❌ Failures

${results.failures.map(failure => `
### ${failure.suite} - ${failure.test}

\`\`\`
${failure.messages.join('\n')}
\`\`\`
`).join('\n')}
` : ''}

## ⚡ Performance

- **Total Duration:** ${results.performance.totalDuration}ms
- **Average Duration:** ${results.performance.averageDuration}ms
- **Slowest Suite:** ${results.performance.slowestSuite.name} (${results.performance.slowestSuite.duration}ms)

## 🖥️ Environment

- **Node Version:** ${results.environment.nodeVersion}
- **Platform:** ${results.environment.platform}
- **Architecture:** ${results.environment.arch}
- **CPUs:** ${results.environment.cpus}
- **Memory:** ${results.environment.memory}
- **Environment:** ${results.environment.env}
  `;

  const reportPath = path.join(outputDir, 'voice-test-report.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`📄 Markdown report saved to: ${reportPath}`);
}

/**
 * Generate CSV report
 */
function generateCsvReport(results, outputDir) {
  const csvData = [
    ['Suite', 'Status', 'Tests', 'Passed', 'Failed', 'Duration'],
    ...results.testSuites.map(suite => [
      suite.name,
      suite.status,
      suite.numTests,
      suite.numPassing,
      suite.numFailing,
      suite.duration
    ])
  ];

  const csv = csvData.map(row => row.join(',')).join('\n');
  const reportPath = path.join(outputDir, 'voice-test-results.csv');
  fs.writeFileSync(reportPath, csv);
  console.log(`📄 CSV report saved to: ${reportPath}`);
}

/**
 * Log summary to console
 */
function logSummary(summary) {
  console.log('\n🎤 Voice Assistant Test Results Summary:');
  console.log('==========================================');
  console.log(`Status: ${summary.status}`);
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passedTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Success Rate: ${summary.successRate}%`);
  console.log(`Total Time: ${summary.totalTime}ms`);
  console.log(`Average Test Time: ${summary.averageTestTime}ms`);
  console.log('==========================================\n');
}
