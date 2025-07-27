#!/usr/bin/env node

/**
 * Periodic Health Check Script
 * 
 * This script performs comprehensive health checks on the project
 * structure and reports on overall system health.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webAppRoot = path.resolve(__dirname, '..');

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  log(message) {
    console.log(`🏥 ${message}`);
  }

  async runCheck(name, checkFunction, critical = false) {
    this.log(`Running ${name} check...`);
    
    const check = {
      name,
      critical,
      status: 'running',
      startTime: Date.now(),
      endTime: null,
      duration: null,
      result: null,
      error: null,
      details: {}
    };

    try {
      const result = await checkFunction();
      check.status = result.status || 'passed';
      check.result = result;
      check.details = result.details || {};
      
      if (check.status === 'passed') {
        console.log(`✅ ${name} - PASSED`);
        this.results.summary.passed++;
      } else if (check.status === 'warning') {
        console.log(`⚠️  ${name} - WARNING`);
        this.results.summary.warnings++;
      } else {
        console.log(`❌ ${name} - FAILED`);
        this.results.summary.failed++;
      }

    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      console.log(`❌ ${name} - ERROR: ${error.message}`);
      this.results.summary.failed++;
    }

    check.endTime = Date.now();
    check.duration = check.endTime - check.startTime;
    
    this.results.checks.push(check);
    this.results.summary.total++;
  }

  async checkProjectStructure() {
    const requiredDirs = [
      'src/features',
      'src/shared',
      'src/pages',
      'src/lib',
      'src/utils',
      'docs',
      '.config'
    ];

    const missingDirs = [];
    const existingDirs = [];

    for (const dir of requiredDirs) {
      const dirPath = path.join(webAppRoot, dir);
      if (fs.existsSync(dirPath)) {
        existingDirs.push(dir);
      } else {
        missingDirs.push(dir);
      }
    }

    return {
      status: missingDirs.length === 0 ? 'passed' : 'failed',
      details: {
        requiredDirs: requiredDirs.length,
        existingDirs: existingDirs.length,
        missingDirs,
        existingDirs
      }
    };
  }

  async checkFeatureStructure() {
    const featuresPath = path.join(webAppRoot, 'src/features');
    
    if (!fs.existsSync(featuresPath)) {
      return {
        status: 'failed',
        details: { error: 'Features directory not found' }
      };
    }

    const features = fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const featureHealth = [];
    let healthyFeatures = 0;

    for (const feature of features) {
      const featurePath = path.join(featuresPath, feature);
      const requiredFiles = ['index.ts', 'README.md'];
      const expectedDirs = ['components', 'services'];
      
      const health = {
        name: feature,
        hasIndex: fs.existsSync(path.join(featurePath, 'index.ts')),
        hasReadme: fs.existsSync(path.join(featurePath, 'README.md')),
        hasComponents: fs.existsSync(path.join(featurePath, 'components')),
        hasServices: fs.existsSync(path.join(featurePath, 'services')),
        score: 0
      };

      health.score = [health.hasIndex, health.hasReadme, health.hasComponents, health.hasServices]
        .filter(Boolean).length;

      if (health.score >= 3) healthyFeatures++;
      featureHealth.push(health);
    }

    return {
      status: healthyFeatures === features.length ? 'passed' : 
              healthyFeatures > features.length * 0.8 ? 'warning' : 'failed',
      details: {
        totalFeatures: features.length,
        healthyFeatures,
        featureHealth
      }
    };
  }

  async checkDependencies() {
    try {
      // Check for security vulnerabilities
      const auditResult = execSync('npm audit --json', { 
        cwd: webAppRoot, 
        encoding: 'utf8' 
      });
      
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);

      // Check for outdated packages
      const outdatedResult = execSync('npm outdated --json', { 
        cwd: webAppRoot, 
        encoding: 'utf8' 
      });
      
      const outdated = outdatedResult ? JSON.parse(outdatedResult) : {};
      const outdatedCount = Object.keys(outdated).length;

      return {
        status: totalVulns === 0 && outdatedCount < 5 ? 'passed' : 
                totalVulns === 0 && outdatedCount < 10 ? 'warning' : 'failed',
        details: {
          vulnerabilities: totalVulns,
          outdatedPackages: outdatedCount,
          criticalVulns: vulnerabilities.critical || 0,
          highVulns: vulnerabilities.high || 0,
          moderateVulns: vulnerabilities.moderate || 0,
          lowVulns: vulnerabilities.low || 0
        }
      };

    } catch (error) {
      return {
        status: 'warning',
        details: { error: 'Could not check dependencies', message: error.message }
      };
    }
  }

  async checkCodeQuality() {
    try {
      // Run TypeScript check
      execSync('npm run type-check', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });

      const typeCheckPassed = true;
      let lintPassed = false;
      let lintErrors = 0;

      try {
        execSync('npm run lint', { 
          cwd: webAppRoot, 
          stdio: 'pipe' 
        });
        lintPassed = true;
      } catch (lintError) {
        // Parse lint output to count errors
        const output = lintError.stdout?.toString() || '';
        const errorMatch = output.match(/(\d+) error/);
        lintErrors = errorMatch ? parseInt(errorMatch[1]) : 1;
      }

      return {
        status: typeCheckPassed && lintPassed ? 'passed' : 
                typeCheckPassed && lintErrors < 10 ? 'warning' : 'failed',
        details: {
          typeCheckPassed,
          lintPassed,
          lintErrors
        }
      };

    } catch (error) {
      return {
        status: 'failed',
        details: { error: 'Code quality check failed', message: error.message }
      };
    }
  }

  async checkTestCoverage() {
    try {
      const coverageResult = execSync('npm run test:coverage -- --silent', { 
        cwd: webAppRoot, 
        encoding: 'utf8' 
      });

      // Parse coverage output (simplified)
      const lines = coverageResult.split('\n');
      const summaryLine = lines.find(line => line.includes('All files'));
      
      if (summaryLine) {
        const matches = summaryLine.match(/(\d+\.?\d*)/g);
        if (matches && matches.length >= 4) {
          const [statements, branches, functions, lines] = matches.map(Number);
          const avgCoverage = (statements + branches + functions + lines) / 4;

          return {
            status: avgCoverage >= 80 ? 'passed' : 
                    avgCoverage >= 60 ? 'warning' : 'failed',
            details: {
              statements,
              branches,
              functions,
              lines,
              average: avgCoverage
            }
          };
        }
      }

      return {
        status: 'warning',
        details: { error: 'Could not parse coverage report' }
      };

    } catch (error) {
      return {
        status: 'warning',
        details: { error: 'Test coverage check failed', message: error.message }
      };
    }
  }

  async checkBuildHealth() {
    try {
      // Check if build succeeds
      execSync('npm run build', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });

      // Check build output
      const distPath = path.join(webAppRoot, 'dist');
      if (!fs.existsSync(distPath)) {
        return {
          status: 'failed',
          details: { error: 'Build output directory not found' }
        };
      }

      const assetsPath = path.join(distPath, 'assets');
      const assetFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
      
      // Calculate total bundle size
      let totalSize = 0;
      for (const file of assetFiles) {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      const totalSizeMB = totalSize / (1024 * 1024);

      return {
        status: totalSizeMB < 5 ? 'passed' : 
                totalSizeMB < 10 ? 'warning' : 'failed',
        details: {
          buildSucceeded: true,
          assetFiles: assetFiles.length,
          totalSizeMB: Math.round(totalSizeMB * 100) / 100
        }
      };

    } catch (error) {
      return {
        status: 'failed',
        details: { 
          buildSucceeded: false, 
          error: 'Build failed', 
          message: error.message 
        }
      };
    }
  }

  async checkArchitecture() {
    try {
      // Run architecture monitoring
      execSync('node scripts/architecture-monitor.js', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });

      // Read architecture report
      const reportPath = path.join(webAppRoot, 'architecture-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        return {
          status: report.summary.healthScore >= 90 ? 'passed' : 
                  report.summary.healthScore >= 70 ? 'warning' : 'failed',
          details: {
            healthScore: report.summary.healthScore,
            violations: report.summary.totalViolations,
            warnings: report.summary.totalWarnings,
            features: report.metrics.featuresCount,
            sharedModules: report.metrics.sharedModules
          }
        };
      }

      return {
        status: 'warning',
        details: { error: 'Architecture report not found' }
      };

    } catch (error) {
      return {
        status: 'warning',
        details: { error: 'Architecture check failed', message: error.message }
      };
    }
  }

  async checkPerformance() {
    try {
      // Simple performance checks
      const startTime = Date.now();
      
      // Check development server startup time (simplified)
      const devStartTime = Date.now();
      // In a real scenario, you'd start the dev server and measure startup time
      const devStartupTime = Date.now() - devStartTime;

      // Check build time
      const buildStartTime = Date.now();
      execSync('npm run build', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });
      const buildTime = Date.now() - buildStartTime;

      return {
        status: buildTime < 60000 ? 'passed' : 
                buildTime < 120000 ? 'warning' : 'failed',
        details: {
          buildTimeMs: buildTime,
          buildTimeSeconds: Math.round(buildTime / 1000),
          devStartupTimeMs: devStartupTime
        }
      };

    } catch (error) {
      return {
        status: 'failed',
        details: { error: 'Performance check failed', message: error.message }
      };
    }
  }

  calculateOverallHealth() {
    const { passed, failed, warnings, total } = this.results.summary;
    
    if (total === 0) return 0;
    
    const passedScore = (passed / total) * 100;
    const warningPenalty = (warnings / total) * 10;
    const failedPenalty = (failed / total) * 50;
    
    return Math.max(0, Math.round(passedScore - warningPenalty - failedPenalty));
  }

  generateReport() {
    const overallHealth = this.calculateOverallHealth();
    
    const report = {
      ...this.results,
      overallHealth,
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = path.join(webAppRoot, 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    for (const check of this.results.checks) {
      if (check.status === 'failed') {
        switch (check.name) {
          case 'Project Structure':
            recommendations.push('Fix missing project directories');
            break;
          case 'Feature Structure':
            recommendations.push('Improve feature organization and documentation');
            break;
          case 'Dependencies':
            recommendations.push('Update dependencies and fix security vulnerabilities');
            break;
          case 'Code Quality':
            recommendations.push('Fix TypeScript errors and ESLint violations');
            break;
          case 'Test Coverage':
            recommendations.push('Increase test coverage to at least 80%');
            break;
          case 'Build Health':
            recommendations.push('Fix build issues and optimize bundle size');
            break;
          case 'Architecture':
            recommendations.push('Address architectural violations and improve structure');
            break;
          case 'Performance':
            recommendations.push('Optimize build performance and startup time');
            break;
        }
      }
    }

    return recommendations;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 PROJECT HEALTH CHECK REPORT');
    console.log('='.repeat(60));

    console.log(`🎯 Overall Health Score: ${report.overallHealth}/100`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📊 Total Checks: ${report.summary.total}`);

    // Health status
    console.log('\n🏥 HEALTH STATUS:');
    if (report.overallHealth >= 90) {
      console.log('🟢 Excellent - Project is in great health');
    } else if (report.overallHealth >= 75) {
      console.log('🟡 Good - Minor issues to address');
    } else if (report.overallHealth >= 50) {
      console.log('🟠 Fair - Several issues need attention');
    } else {
      console.log('🔴 Poor - Significant problems require immediate attention');
    }

    // Check details
    console.log('\n📋 CHECK DETAILS:');
    for (const check of report.checks) {
      const status = check.status === 'passed' ? '✅' : 
                    check.status === 'warning' ? '⚠️ ' : '❌';
      const duration = check.duration ? ` (${check.duration}ms)` : '';
      console.log(`  ${status} ${check.name}${duration}`);
      
      if (check.status === 'failed' && check.error) {
        console.log(`      Error: ${check.error}`);
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📄 Detailed report saved to: health-report.json');
    console.log('='.repeat(60));
  }

  async run() {
    console.log('🏥 Starting Project Health Check...\n');

    // Run all health checks
    await this.runCheck('Project Structure', () => this.checkProjectStructure(), true);
    await this.runCheck('Feature Structure', () => this.checkFeatureStructure(), true);
    await this.runCheck('Dependencies', () => this.checkDependencies());
    await this.runCheck('Code Quality', () => this.checkCodeQuality());
    await this.runCheck('Test Coverage', () => this.checkTestCoverage());
    await this.runCheck('Build Health', () => this.checkBuildHealth(), true);
    await this.runCheck('Architecture', () => this.checkArchitecture());
    await this.runCheck('Performance', () => this.checkPerformance());

    // Generate and display report
    const report = this.generateReport();
    this.printSummary(report);

    // Exit with appropriate code
    const criticalFailures = this.results.checks
      .filter(check => check.critical && check.status === 'failed').length;

    if (criticalFailures > 0) {
      console.log('\n❌ Health check failed due to critical issues');
      process.exit(1);
    } else if (report.overallHealth < 50) {
      console.log('\n⚠️  Health check completed with significant issues');
      process.exit(1);
    } else {
      console.log('\n✅ Health check completed successfully');
      process.exit(0);
    }
  }
}

// Run health check
const checker = new HealthChecker();
checker.run().catch(error => {
  console.error('❌ Health check crashed:', error);
  process.exit(1);
});