#!/usr/bin/env node

/**
 * Architecture Monitoring Script
 * 
 * This script monitors the codebase for architectural rule violations
 * and provides detailed reports on code organization health.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webAppRoot = path.resolve(__dirname, '..');
const srcPath = path.join(webAppRoot, 'src');

class ArchitectureMonitor {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.metrics = {
      totalFiles: 0,
      featuresCount: 0,
      sharedModules: 0,
      circularDependencies: 0,
      deepImports: 0,
      crossFeatureImports: 0
    };
  }

  log(message) {
    console.log(`📊 ${message}`);
  }

  violation(message, file = null, line = null) {
    const violation = { message, file, line, type: 'violation' };
    this.violations.push(violation);
    console.error(`❌ ${message}${file ? ` in ${file}` : ''}${line ? `:${line}` : ''}`);
  }

  warning(message, file = null, line = null) {
    const warning = { message, file, line, type: 'warning' };
    this.warnings.push(warning);
    console.warn(`⚠️  ${message}${file ? ` in ${file}` : ''}${line ? `:${line}` : ''}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  async scanFiles() {
    this.log('Scanning project files...');
    
    const patterns = [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/__tests__/**',
      '!src/**/*.test.*',
      '!src/**/*.spec.*'
    ];

    const files = await glob(patterns, { cwd: webAppRoot });
    this.metrics.totalFiles = files.length;
    
    return files.map(file => path.join(webAppRoot, file));
  }

  async analyzeFeatureStructure() {
    this.log('Analyzing feature structure...');
    
    const featuresPath = path.join(srcPath, 'features');
    
    if (!fs.existsSync(featuresPath)) {
      this.violation('Features directory not found');
      return;
    }

    const features = fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    this.metrics.featuresCount = features.length;

    for (const feature of features) {
      await this.validateFeatureStructure(feature);
    }

    this.success(`Found ${features.length} features`);
  }

  async validateFeatureStructure(featureName) {
    const featurePath = path.join(srcPath, 'features', featureName);
    const expectedDirs = ['components', 'hooks', 'services', 'types'];
    const requiredFiles = ['index.ts', 'README.md'];

    // Check for expected directories
    for (const dir of expectedDirs) {
      const dirPath = path.join(featurePath, dir);
      if (!fs.existsSync(dirPath)) {
        this.warning(`Missing ${dir} directory in feature ${featureName}`);
      }
    }

    // Check for required files
    for (const file of requiredFiles) {
      const filePath = path.join(featurePath, file);
      if (!fs.existsSync(filePath)) {
        this.violation(`Missing ${file} in feature ${featureName}`);
      }
    }

    // Validate index.ts exports
    const indexPath = path.join(featurePath, 'index.ts');
    if (fs.existsSync(indexPath)) {
      await this.validateFeatureExports(featureName, indexPath);
    }
  }

  async validateFeatureExports(featureName, indexPath) {
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for proper export patterns
      const hasExports = content.includes('export');
      if (!hasExports) {
        this.violation(`Feature ${featureName} index.ts has no exports`);
      }

      // Check for internal imports (should not export internal details)
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('export') && line.includes('../')) {
          this.warning(`Feature ${featureName} may be exporting internal details`, indexPath, index + 1);
        }
      });

    } catch (error) {
      this.violation(`Could not read feature index for ${featureName}: ${error.message}`);
    }
  }

  async analyzeImportPatterns(files) {
    this.log('Analyzing import patterns...');
    
    for (const file of files) {
      await this.analyzeFileImports(file);
    }
  }

  async analyzeFileImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = path.relative(webAppRoot, filePath);

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Check for import statements
        if (line.trim().startsWith('import') && line.includes('from')) {
          this.validateImportLine(line, relativePath, lineNumber);
        }
      });

    } catch (error) {
      this.warning(`Could not analyze imports in ${filePath}: ${error.message}`);
    }
  }

  validateImportLine(line, filePath, lineNumber) {
    // Extract import path
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    if (!match) return;

    const importPath = match[1];

    // Check for violations
    this.checkDeepImports(importPath, filePath, lineNumber);
    this.checkCrossFeatureImports(importPath, filePath, lineNumber);
    this.checkRelativeImports(importPath, filePath, lineNumber);
  }

  checkDeepImports(importPath, filePath, lineNumber) {
    // Check for deep imports into shared modules
    if (importPath.includes('@shared/') && importPath.split('/').length > 3) {
      const parts = importPath.split('/');
      if (parts.length > 3 && !parts[parts.length - 1].includes('index')) {
        this.violation('Deep import into shared module', filePath, lineNumber);
        this.metrics.deepImports++;
      }
    }

    // Check for deep imports into features
    if (importPath.includes('@features/') && importPath.split('/').length > 3) {
      const parts = importPath.split('/');
      if (parts.length > 3 && !parts[parts.length - 1].includes('index')) {
        this.violation('Deep import into feature module', filePath, lineNumber);
        this.metrics.deepImports++;
      }
    }
  }

  checkCrossFeatureImports(importPath, filePath, lineNumber) {
    // Check for direct feature-to-feature imports
    if (filePath.includes('src/features/') && importPath.includes('@features/')) {
      const currentFeature = this.extractFeatureName(filePath);
      const importedFeature = this.extractFeatureName(importPath);
      
      if (currentFeature && importedFeature && currentFeature !== importedFeature) {
        this.violation(`Cross-feature import: ${currentFeature} -> ${importedFeature}`, filePath, lineNumber);
        this.metrics.crossFeatureImports++;
      }
    }
  }

  checkRelativeImports(importPath, filePath, lineNumber) {
    // Check for excessive relative imports
    if (importPath.startsWith('../')) {
      const depth = (importPath.match(/\.\.\//g) || []).length;
      if (depth > 2) {
        this.warning(`Deep relative import (${depth} levels)`, filePath, lineNumber);
      }
    }
  }

  extractFeatureName(path) {
    const match = path.match(/features\/([^\/]+)/);
    return match ? match[1] : null;
  }

  async analyzeSharedModules() {
    this.log('Analyzing shared modules...');
    
    const sharedPath = path.join(srcPath, 'shared');
    
    if (!fs.existsSync(sharedPath)) {
      this.violation('Shared directory not found');
      return;
    }

    const sharedModules = fs.readdirSync(sharedPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    this.metrics.sharedModules = sharedModules.length;

    for (const module of sharedModules) {
      await this.validateSharedModule(module);
    }

    this.success(`Found ${sharedModules.length} shared modules`);
  }

  async validateSharedModule(moduleName) {
    const modulePath = path.join(srcPath, 'shared', moduleName);
    const indexPath = path.join(modulePath, 'index.ts');

    // Check for index file
    if (!fs.existsSync(indexPath)) {
      this.warning(`Shared module ${moduleName} missing index.ts`);
    }

    // Check for proper organization
    const allowedDirs = ['components', 'hooks', 'services', 'utils', 'types', 'constants', 'styles'];
    const entries = fs.readdirSync(modulePath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && !allowedDirs.includes(entry.name)) {
        this.warning(`Unexpected directory in shared/${moduleName}: ${entry.name}`);
      }
    }
  }

  async checkCircularDependencies() {
    this.log('Checking for circular dependencies...');
    
    // This is a simplified check - in production, you might want to use a tool like madge
    const dependencyGraph = new Map();
    const files = await this.scanFiles();

    // Build dependency graph
    for (const file of files) {
      const dependencies = await this.extractDependencies(file);
      dependencyGraph.set(file, dependencies);
    }

    // Check for cycles (simplified algorithm)
    for (const [file, deps] of dependencyGraph) {
      for (const dep of deps) {
        if (this.hasCycle(dependencyGraph, dep, file, new Set())) {
          this.violation(`Circular dependency detected involving ${path.relative(webAppRoot, file)}`);
          this.metrics.circularDependencies++;
        }
      }
    }
  }

  async extractDependencies(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dependencies = [];
      const lines = content.split('\n');

      for (const line of lines) {
        if (line.trim().startsWith('import') && line.includes('from')) {
          const match = line.match(/from\s+['"]([^'"]+)['"]/);
          if (match && match[1].startsWith('.')) {
            // Resolve relative path
            const resolvedPath = path.resolve(path.dirname(filePath), match[1]);
            dependencies.push(resolvedPath);
          }
        }
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  hasCycle(graph, current, target, visited) {
    if (current === target) return true;
    if (visited.has(current)) return false;

    visited.add(current);
    const deps = graph.get(current) || [];

    for (const dep of deps) {
      if (this.hasCycle(graph, dep, target, visited)) {
        return true;
      }
    }

    return false;
  }

  async generateReport() {
    this.log('Generating architecture report...');

    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      violations: this.violations,
      warnings: this.warnings,
      summary: {
        totalViolations: this.violations.length,
        totalWarnings: this.warnings.length,
        healthScore: this.calculateHealthScore()
      }
    };

    // Save report to file
    const reportPath = path.join(webAppRoot, 'architecture-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  calculateHealthScore() {
    const maxScore = 100;
    const violationPenalty = 5;
    const warningPenalty = 1;

    const penalty = (this.violations.length * violationPenalty) + 
                   (this.warnings.length * warningPenalty);

    return Math.max(0, maxScore - penalty);
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ARCHITECTURE MONITORING REPORT');
    console.log('='.repeat(60));

    console.log(`📈 Health Score: ${report.summary.healthScore}/100`);
    console.log(`📁 Total Files: ${report.metrics.totalFiles}`);
    console.log(`🏗️  Features: ${report.metrics.featuresCount}`);
    console.log(`📦 Shared Modules: ${report.metrics.sharedModules}`);
    console.log(`❌ Violations: ${report.summary.totalViolations}`);
    console.log(`⚠️  Warnings: ${report.summary.totalWarnings}`);

    if (report.metrics.circularDependencies > 0) {
      console.log(`🔄 Circular Dependencies: ${report.metrics.circularDependencies}`);
    }

    if (report.metrics.deepImports > 0) {
      console.log(`🔍 Deep Imports: ${report.metrics.deepImports}`);
    }

    if (report.metrics.crossFeatureImports > 0) {
      console.log(`🔀 Cross-Feature Imports: ${report.metrics.crossFeatureImports}`);
    }

    // Health assessment
    console.log('\n📋 HEALTH ASSESSMENT:');
    if (report.summary.healthScore >= 90) {
      console.log('🟢 Excellent - Architecture is well maintained');
    } else if (report.summary.healthScore >= 75) {
      console.log('🟡 Good - Minor issues to address');
    } else if (report.summary.healthScore >= 50) {
      console.log('🟠 Fair - Several issues need attention');
    } else {
      console.log('🔴 Poor - Significant architectural problems');
    }

    // Top violations
    if (this.violations.length > 0) {
      console.log('\n❌ TOP VIOLATIONS:');
      this.violations.slice(0, 5).forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.message}`);
        if (violation.file) {
          console.log(`     File: ${violation.file}${violation.line ? `:${violation.line}` : ''}`);
        }
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (report.metrics.crossFeatureImports > 0) {
      console.log('  - Eliminate direct feature-to-feature imports');
    }
    if (report.metrics.deepImports > 0) {
      console.log('  - Use public APIs instead of deep imports');
    }
    if (report.metrics.circularDependencies > 0) {
      console.log('  - Resolve circular dependencies');
    }
    if (this.violations.length > 0) {
      console.log('  - Address architectural violations');
    }
    if (this.warnings.length > 5) {
      console.log('  - Review and fix warnings');
    }

    console.log('\n' + '='.repeat(60));
  }

  async run() {
    console.log('🏗️  Starting Architecture Monitoring...\n');

    try {
      // Scan and analyze
      const files = await this.scanFiles();
      await this.analyzeFeatureStructure();
      await this.analyzeSharedModules();
      await this.analyzeImportPatterns(files);
      await this.checkCircularDependencies();

      // Generate and display report
      const report = await this.generateReport();
      this.printSummary(report);

      // Exit with appropriate code
      if (this.violations.length > 0) {
        console.log('\n❌ Architecture monitoring failed due to violations');
        process.exit(1);
      } else {
        console.log('\n✅ Architecture monitoring completed successfully');
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Architecture monitoring crashed:', error);
      process.exit(1);
    }
  }
}

// Run monitoring
const monitor = new ArchitectureMonitor();
monitor.run();