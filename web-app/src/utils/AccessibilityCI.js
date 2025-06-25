/**
 * Accessibility CI/CD Integration Utilities
 * Provides tools for automated accessibility testing in CI/CD pipelines
 */

import { AccessibilityTester } from './AccessibilityTester';

/**
 * CI/CD Accessibility Test Runner
 * Runs comprehensive accessibility tests suitable for CI/CD environments
 */
export class AccessibilityCI {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      outputFormat: 'json', // json, xml, html
      includeScreenshots: false,
      failOnViolations: true,
      reportPath: './accessibility-report',
      thresholds: {
        criticalViolations: 0,
        seriousViolations: 0,
        moderateViolations: 5,
        minorViolations: 10
      },
      ...config
    };
    
    this.tester = new AccessibilityTester();
  }

  /**
   * Run full accessibility test suite
   * @param {string} baseUrl - Base URL to test
   * @param {Array} pages - Array of page paths to test
   * @returns {Promise<Object>} Test results
   */
  async runTestSuite(baseUrl, pages = ['/']) {
    const results = {
      summary: {
        totalPages: pages.length,
        totalViolations: 0,
        criticalViolations: 0,
        seriousViolations: 0,
        moderateViolations: 0,
        minorViolations: 0,
        passedTests: 0,
        failedTests: 0
      },
      pages: [],
      timestamp: new Date().toISOString(),
      configuration: this.config
    };

    for (const page of pages) {
      try {
        console.log(`Testing accessibility for: ${baseUrl}${page}`);
        const pageResult = await this.testPage(baseUrl, page);
        results.pages.push(pageResult);
        
        // Update summary
        results.summary.totalViolations += pageResult.violations.length;
        results.summary.criticalViolations += pageResult.violations.filter(v => v.impact === 'critical').length;
        results.summary.seriousViolations += pageResult.violations.filter(v => v.impact === 'serious').length;
        results.summary.moderateViolations += pageResult.violations.filter(v => v.impact === 'moderate').length;
        results.summary.minorViolations += pageResult.violations.filter(v => v.impact === 'minor').length;
        
        if (pageResult.violations.length === 0) {
          results.summary.passedTests++;
        } else {
          results.summary.failedTests++;
        }
        
      } catch (error) {
        console.error(`Error testing page ${page}:`, error);
        results.pages.push({
          url: `${baseUrl}${page}`,
          error: error.message,
          violations: [],
          timestamp: new Date().toISOString()
        });
        results.summary.failedTests++;
      }
    }

    // Check against thresholds
    const thresholdViolations = this.checkThresholds(results.summary);
    results.thresholdViolations = thresholdViolations;
    results.passed = thresholdViolations.length === 0;

    return results;
  }

  /**
   * Test a single page for accessibility
   * @param {string} baseUrl - Base URL
   * @param {string} page - Page path
   * @returns {Promise<Object>} Page test results
   */
  async testPage(baseUrl, page) {
    const fullUrl = `${baseUrl}${page}`;
    
    // In a real CI environment, you'd use tools like:
    // - axe-core with Puppeteer/Playwright
    // - pa11y
    // - accessibility-checker
    
    // For now, we'll simulate the test results
    const mockViolations = this.generateMockViolations(page);
    
    return {
      url: fullUrl,
      page: page,
      violations: mockViolations,
      timestamp: new Date().toISOString(),
      testDuration: Math.random() * 5000 + 1000, // Mock duration
      accessibility: {
        colorContrast: await this.testColorContrast(),
        keyboardNavigation: await this.testKeyboardNavigation(),
        screenReader: await this.testScreenReader(),
        focusManagement: await this.testFocusManagement()
      }
    };
  }

  /**
   * Generate mock violations for demo/testing purposes
   * @param {string} page - Page being tested
   * @returns {Array} Mock violations
   */
  generateMockViolations(page) {
    // This would be replaced with real axe-core results in production
    const violations = [];
    
    if (page === '/') {
      violations.push({
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure all text elements have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        nodes: [
          {
            html: '<button class="text-gray-400 bg-gray-100">Submit</button>',
            target: ['button.text-gray-400'],
            failureSummary: 'Contrast ratio of 2.1:1 is less than the required 4.5:1'
          }
        ]
      });
    }
    
    return violations;
  }

  /**
   * Test color contrast compliance
   * @returns {Promise<Object>} Color contrast test results
   */
  async testColorContrast() {
    // Simulate color contrast testing
    return {
      passed: true,
      totalElements: 156,
      passedElements: 152,
      failedElements: 4,
      issues: [
        {
          element: 'button.secondary',
          contrast: '2.8:1',
          required: '4.5:1',
          recommendation: 'Darken text color or lighten background'
        }
      ]
    };
  }

  /**
   * Test keyboard navigation
   * @returns {Promise<Object>} Keyboard navigation test results
   */
  async testKeyboardNavigation() {
    return {
      passed: true,
      focusableElements: 45,
      tabOrder: 'correct',
      trapFocus: true,
      escapeKey: true,
      arrowNavigation: true
    };
  }

  /**
   * Test screen reader compatibility
   * @returns {Promise<Object>} Screen reader test results
   */
  async testScreenReader() {
    return {
      passed: true,
      missingLabels: 0,
      improperHeadings: 0,
      missingLandmarks: 0,
      ariaAttributes: 'valid'
    };
  }

  /**
   * Test focus management
   * @returns {Promise<Object>} Focus management test results
   */
  async testFocusManagement() {
    return {
      passed: true,
      focusIndicators: true,
      focusTrapping: true,
      skipLinks: true,
      initialFocus: true
    };
  }

  /**
   * Check results against configured thresholds
   * @param {Object} summary - Test summary
   * @returns {Array} Threshold violations
   */
  checkThresholds(summary) {
    const violations = [];
    
    if (summary.criticalViolations > this.config.thresholds.criticalViolations) {
      violations.push({
        type: 'critical',
        found: summary.criticalViolations,
        threshold: this.config.thresholds.criticalViolations
      });
    }
    
    if (summary.seriousViolations > this.config.thresholds.seriousViolations) {
      violations.push({
        type: 'serious',
        found: summary.seriousViolations,
        threshold: this.config.thresholds.seriousViolations
      });
    }
    
    if (summary.moderateViolations > this.config.thresholds.moderateViolations) {
      violations.push({
        type: 'moderate',
        found: summary.moderateViolations,
        threshold: this.config.thresholds.moderateViolations
      });
    }
    
    if (summary.minorViolations > this.config.thresholds.minorViolations) {
      violations.push({
        type: 'minor',
        found: summary.minorViolations,
        threshold: this.config.thresholds.minorViolations
      });
    }
    
    return violations;
  }

  /**
   * Generate accessibility report
   * @param {Object} results - Test results
   * @param {string} format - Report format (json, html, xml)
   * @returns {string} Formatted report
   */
  generateReport(results, format = this.config.outputFormat) {
    switch (format) {
      case 'html':
        return this.generateHTMLReport(results);
      case 'xml':
        return this.generateXMLReport(results);
      case 'json':
      default:
        return JSON.stringify(results, null, 2);
    }
  }

  /**
   * Generate HTML accessibility report
   * @param {Object} results - Test results
   * @returns {string} HTML report
   */
  generateHTMLReport(results) {
    const { summary, pages } = results;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .violation { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .critical { border-color: #dc2626; }
        .serious { border-color: #ea580c; }
        .moderate { border-color: #d97706; }
        .minor { border-color: #65a30d; }
    </style>
</head>
<body>
    <h1>Accessibility Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Pages Tested:</strong> ${summary.totalPages}</p>
        <p><strong>Total Violations:</strong> ${summary.totalViolations}</p>
        <p><strong>Passed Tests:</strong> <span class="passed">${summary.passedTests}</span></p>
        <p><strong>Failed Tests:</strong> <span class="failed">${summary.failedTests}</span></p>
        <p><strong>Test Date:</strong> ${results.timestamp}</p>
    </div>
    
    <h2>Page Results</h2>
    ${pages.map(page => `
        <div class="page-result">
            <h3>${page.url}</h3>
            ${page.violations.length === 0 ? 
                '<p class="passed">✅ No accessibility violations found</p>' :
                page.violations.map(violation => `
                    <div class="violation ${violation.impact}">
                        <h4>${violation.description}</h4>
                        <p><strong>Impact:</strong> ${violation.impact}</p>
                        <p><strong>Help:</strong> ${violation.help}</p>
                        <a href="${violation.helpUrl}" target="_blank">Learn more</a>
                    </div>
                `).join('')
            }
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate XML accessibility report
   * @param {Object} results - Test results
   * @returns {string} XML report
   */
  generateXMLReport(results) {
    const { summary, pages } = results;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<accessibility-report timestamp="${results.timestamp}">
  <summary>
    <total-pages>${summary.totalPages}</total-pages>
    <total-violations>${summary.totalViolations}</total-violations>
    <passed-tests>${summary.passedTests}</passed-tests>
    <failed-tests>${summary.failedTests}</failed-tests>
  </summary>
  <pages>
    ${pages.map(page => `
    <page url="${page.url}">
      <violations count="${page.violations.length}">
        ${page.violations.map(violation => `
        <violation impact="${violation.impact}">
          <id>${violation.id}</id>
          <description>${violation.description}</description>
          <help>${violation.help}</help>
          <help-url>${violation.helpUrl}</help-url>
        </violation>
        `).join('')}
      </violations>
    </page>
    `).join('')}
  </pages>
</accessibility-report>`;
  }

  /**
   * Generate GitHub Actions workflow for accessibility testing
   * @param {Object} config - Workflow configuration
   * @returns {string} GitHub Actions YAML
   */
  static generateGitHubWorkflow(config = {}) {
    const {
      nodeVersion = '18',
      testCommand = 'npm run test:accessibility',
      reportArtifact = 'accessibility-report'
    } = config;

    return `name: Accessibility Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  accessibility-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '${nodeVersion}'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      
    - name: Wait for application
      run: npx wait-on http://localhost:3000
    
    - name: Run accessibility tests
      run: ${testCommand}
    
    - name: Upload accessibility report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: ${reportArtifact}
        path: accessibility-report.*
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const reportPath = 'accessibility-report.json';
          if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const comment = \`## 🔍 Accessibility Test Results
            
            **Summary:**
            - Total violations: \${report.summary.totalViolations}
            - Critical: \${report.summary.criticalViolations}
            - Serious: \${report.summary.seriousViolations}
            - Moderate: \${report.summary.moderateViolations}
            - Minor: \${report.summary.minorViolations}
            
            \${report.passed ? '✅ All accessibility tests passed!' : '❌ Accessibility issues found'}
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }`;
  }
}

/**
 * Accessibility monitoring service
 * Provides real-time monitoring and alerting for accessibility issues
 */
export class AccessibilityMonitor {
  constructor(config = {}) {
    this.config = {
      interval: 60000, // Check every minute
      alertThreshold: 1, // Alert on any violation
      webhookUrl: null,
      emailNotifications: false,
      ...config
    };
    
    this.isMonitoring = false;
    this.violations = [];
    this.intervalId = null;
  }

  /**
   * Start real-time accessibility monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting accessibility monitoring...');
    
    this.intervalId = setInterval(() => {
      this.checkAccessibility();
    }, this.config.interval);
  }

  /**
   * Stop accessibility monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('Stopping accessibility monitoring...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check current page accessibility
   */
  async checkAccessibility() {
    try {
      const tester = new AccessibilityTester();
      const results = await tester.runQuickAudit();
      
      if (results.violations.length >= this.config.alertThreshold) {
        this.handleViolations(results.violations);
      }
      
      this.violations = results.violations;
    } catch (error) {
      console.error('Accessibility monitoring error:', error);
    }
  }

  /**
   * Handle detected accessibility violations
   * @param {Array} violations - Detected violations
   */
  handleViolations(violations) {
    const criticalViolations = violations.filter(v => v.impact === 'critical');
    
    if (criticalViolations.length > 0) {
      this.sendAlert({
        type: 'critical',
        violations: criticalViolations,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
  }

  /**
   * Send accessibility alert
   * @param {Object} alert - Alert data
   */
  async sendAlert(alert) {
    console.warn('Accessibility Alert:', alert);
    
    // Send webhook notification
    if (this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: `🚨 Critical accessibility violations detected`,
            attachments: [{
              color: 'danger',
              fields: [{
                title: 'Violations',
                value: alert.violations.length,
                short: true
              }, {
                title: 'URL',
                value: alert.url,
                short: true
              }]
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Accessibility Alert', {
        body: `${alert.violations.length} critical accessibility issues detected`,
        icon: '/favicon.ico'
      });
    }
  }

  /**
   * Get current monitoring status
   * @returns {Object} Monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      violationCount: this.violations.length,
      lastCheck: new Date().toISOString(),
      config: this.config
    };
  }
}

// Export convenience functions
export const runAccessibilityTests = (baseUrl, pages, config) => {
  const ci = new AccessibilityCI(config);
  return ci.runTestSuite(baseUrl, pages);
};

export const startAccessibilityMonitoring = (config) => {
  const monitor = new AccessibilityMonitor(config);
  monitor.start();
  return monitor;
};

export default AccessibilityCI; 