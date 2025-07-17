import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests are completed
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Clean up test data
    await cleanupTestData();

    // Clean up test files
    await cleanupTestFiles();

    // Generate test report summary
    await generateTestSummary();

    // Clean up environment
    cleanupEnvironment();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Clean up test data from browser storage
 */
async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3001');
    
    // Clear test data from localStorage
    await page.evaluate(() => {
      const keysToRemove = [
        'test-reports',
        'test-schedules', 
        'test-metrics',
        'e2e-test-mode',
        'auth-token',
        'user-data',
        'auth-expires'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage as well
      sessionStorage.clear();
    });

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Clean up temporary test files
 */
async function cleanupTestFiles() {
  console.log('📁 Cleaning up test files...');

  const testFilesDir = path.join(process.cwd(), 'test-downloads');
  const tempDir = path.join(process.cwd(), 'temp');
  
  try {
    // Remove test downloads directory
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
      console.log('✅ Test downloads directory cleaned');
    }

    // Remove temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✅ Temp directory cleaned');
    }

    // Clean up any .tmp files in the project
    const projectRoot = process.cwd();
    const tmpFiles = fs.readdirSync(projectRoot)
      .filter(file => file.endsWith('.tmp') || file.endsWith('.temp'));
    
    tmpFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      fs.unlinkSync(filePath);
      console.log(`✅ Removed temp file: ${file}`);
    });

  } catch (error) {
    console.error('❌ Failed to cleanup test files:', error);
  }
}

/**
 * Generate a summary of test results
 */
async function generateTestSummary() {
  console.log('📊 Generating test summary...');

  try {
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          ci: !!process.env.CI
        },
        coverage: await getCoverageInfo()
      };

      // Write summary to file
      const summaryPath = path.join(process.cwd(), 'test-results', 'summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      // Log summary to console
      console.log('\n📋 Test Summary:');
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      
      if (summary.coverage) {
        console.log(`   Coverage: ${summary.coverage.percentage}%`);
      }

      console.log('✅ Test summary generated');
    }
  } catch (error) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

/**
 * Get code coverage information if available
 */
async function getCoverageInfo() {
  try {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      
      return {
        percentage: coverage.total?.statements?.pct || 0,
        statements: coverage.total?.statements || {},
        branches: coverage.total?.branches || {},
        functions: coverage.total?.functions || {},
        lines: coverage.total?.lines || {}
      };
    }
  } catch (error) {
    console.error('❌ Failed to get coverage info:', error);
  }
  
  return null;
}

/**
 * Clean up environment variables and processes
 */
function cleanupEnvironment() {
  console.log('🌍 Cleaning up test environment...');

  // Reset environment variables
  delete process.env.REACT_APP_TEST_MODE;
  delete process.env.MOCK_WEBSOCKET;
  delete process.env.E2E_TEST_MODE;

  // Kill any remaining test processes
  if (process.env.TEST_SERVER_PID) {
    try {
      process.kill(parseInt(process.env.TEST_SERVER_PID));
      delete process.env.TEST_SERVER_PID;
      console.log('✅ Test server process killed');
    } catch (error) {
      console.warn('⚠️ Could not kill test server process:', error.message);
    }
  }

  console.log('✅ Environment cleanup completed');
}

/**
 * Archive test results for future reference
 */
async function archiveTestResults() {
  console.log('📦 Archiving test results...');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(process.cwd(), 'test-archives', timestamp);
    const resultsDir = path.join(process.cwd(), 'test-results');

    if (fs.existsSync(resultsDir)) {
      // Create archive directory
      fs.mkdirSync(archiveDir, { recursive: true });
      
      // Copy test results to archive
      const files = fs.readdirSync(resultsDir);
      files.forEach(file => {
        const srcPath = path.join(resultsDir, file);
        const destPath = path.join(archiveDir, file);
        
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      });

      console.log(`✅ Test results archived to: ${archiveDir}`);
    }
  } catch (error) {
    console.error('❌ Failed to archive test results:', error);
  }
}

/**
 * Send test results to monitoring/reporting systems
 */
async function reportTestResults() {
  console.log('📡 Reporting test results...');

  try {
    const summaryPath = path.join(process.cwd(), 'test-results', 'summary.json');
    
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      
      // In a real scenario, you might send results to:
      // - Slack/Teams notifications
      // - Test reporting dashboards
      // - CI/CD systems
      // - Monitoring tools
      
      if (process.env.CI) {
        console.log('📊 CI Environment detected - results would be sent to monitoring systems');
        
        // Example: Send to webhook
        // await sendToWebhook(summary);
        
        // Example: Update test dashboard
        // await updateTestDashboard(summary);
      }

      console.log('✅ Test results reporting completed');
    }
  } catch (error) {
    console.error('❌ Failed to report test results:', error);
  }
}

/**
 * Cleanup old test artifacts
 */
function cleanupOldArtifacts() {
  console.log('🗂️ Cleaning up old test artifacts...');

  try {
    const archiveDir = path.join(process.cwd(), 'test-archives');
    
    if (fs.existsSync(archiveDir)) {
      const archives = fs.readdirSync(archiveDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days
      
      archives.forEach(archive => {
        const archivePath = path.join(archiveDir, archive);
        const stats = fs.statSync(archivePath);
        
        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          fs.rmSync(archivePath, { recursive: true, force: true });
          console.log(`✅ Removed old archive: ${archive}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to cleanup old artifacts:', error);
  }
}

/**
 * Main teardown execution
 */
async function executeTeardown() {
  await globalTeardown();
  
  // Additional cleanup tasks
  if (process.env.CI) {
    await archiveTestResults();
    await reportTestResults();
  }
  
  cleanupOldArtifacts();
}

// Handle graceful shutdown
process.on('SIGTERM', executeTeardown);
process.on('SIGINT', executeTeardown);

export default globalTeardown;