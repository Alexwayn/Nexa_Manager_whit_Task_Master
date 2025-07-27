#!/usr/bin/env node

/**
 * Feature API Validation Script
 * 
 * This script validates that feature modules properly export their public APIs
 * and follow the established patterns for feature organization.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.resolve(__dirname, '../src');
const featuresPath = path.join(srcPath, 'features');

class FeatureAPIValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateFeatureStructure(featureName, featurePath) {
    console.log(`Validating feature: ${featureName}`);
    
    // Check required directories
    const requiredDirs = ['components', 'hooks', 'services'];
    const optionalDirs = ['types', 'utils', '__tests__'];
    
    requiredDirs.forEach(dir => {
      const dirPath = path.join(featurePath, dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`Feature '${featureName}' is missing required directory: ${dir}`);
      }
    });
    
    // Check for index.ts file
    const indexPath = path.join(featurePath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      this.errors.push(`Feature '${featureName}' is missing index.ts file`);
      return;
    }
    
    // Validate index.ts content
    this.validateIndexFile(featureName, indexPath);
    
    // Check for README.md
    const readmePath = path.join(featurePath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      this.warnings.push(`Feature '${featureName}' is missing README.md file`);
    }
  }

  validateIndexFile(featureName, indexPath) {
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Check for proper exports
      const hasExports = content.includes('export');
      if (!hasExports) {
        this.errors.push(`Feature '${featureName}' index.ts has no exports`);
      }
      
      // Check for organized export sections
      const expectedSections = ['Components', 'Hooks', 'Services'];
      expectedSections.forEach(section => {
        const sectionComment = new RegExp(`//\\s*${section}`, 'i');
        if (!sectionComment.test(content)) {
          this.warnings.push(`Feature '${featureName}' index.ts missing ${section} section comment`);
        }
      });
      
      // Check for re-export types
      if (!content.includes('export type')) {
        this.warnings.push(`Feature '${featureName}' index.ts should re-export types for better TypeScript support`);
      }
      
    } catch (error) {
      this.errors.push(`Error reading index.ts for feature '${featureName}': ${error.message}`);
    }
  }

  validateSharedModules() {
    const sharedPath = path.join(srcPath, 'shared');
    if (!fs.existsSync(sharedPath)) {
      this.errors.push('Missing shared directory');
      return;
    }
    
    const sharedModules = fs.readdirSync(sharedPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    sharedModules.forEach(module => {
      const indexPath = path.join(sharedPath, module, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        this.errors.push(`Shared module '${module}' is missing index.ts file`);
      }
    });
  }

  validateImportPaths() {
    // This would require parsing all TypeScript files
    // For now, we rely on ESLint rules for import validation
    console.log('Import path validation handled by ESLint rules');
  }

  validateNamingConventions(featureName, featurePath) {
    const componentsPath = path.join(featurePath, 'components');
    const hooksPath = path.join(featurePath, 'hooks');
    const servicesPath = path.join(featurePath, 'services');
    
    // Validate component naming
    if (fs.existsSync(componentsPath)) {
      const components = fs.readdirSync(componentsPath)
        .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'));
      
      components.forEach(component => {
        const baseName = path.basename(component, path.extname(component));
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName)) {
          this.warnings.push(`Component '${component}' in feature '${featureName}' should use PascalCase naming`);
        }
      });
    }
    
    // Validate hook naming
    if (fs.existsSync(hooksPath)) {
      const hooks = fs.readdirSync(hooksPath)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      hooks.forEach(hook => {
        const baseName = path.basename(hook, path.extname(hook));
        if (!/^use[A-Z][a-zA-Z0-9]*$/.test(baseName)) {
          this.warnings.push(`Hook '${hook}' in feature '${featureName}' should use 'useXxx' naming convention`);
        }
      });
    }
    
    // Validate service naming
    if (fs.existsSync(servicesPath)) {
      const services = fs.readdirSync(servicesPath)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      services.forEach(service => {
        const baseName = path.basename(service, path.extname(service));
        if (!/^[a-z][a-zA-Z0-9]*Service$/.test(baseName) && !/^[a-z][a-zA-Z0-9]*$/.test(baseName)) {
          this.warnings.push(`Service '${service}' in feature '${featureName}' should use camelCase naming`);
        }
      });
    }
  }

  run() {
    console.log('🔍 Starting Feature API Validation...\n');
    
    if (!fs.existsSync(featuresPath)) {
      this.errors.push('Features directory does not exist');
      this.printResults();
      return;
    }
    
    // Get all features
    const features = fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    if (features.length === 0) {
      this.warnings.push('No features found in features directory');
    }
    
    // Validate each feature
    features.forEach(feature => {
      const featurePath = path.join(featuresPath, feature);
      this.validateFeatureStructure(feature, featurePath);
      this.validateNamingConventions(feature, featurePath);
    });
    
    // Validate shared modules
    this.validateSharedModules();
    
    // Validate import paths
    this.validateImportPaths();
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 Validation Results:');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
      process.exit(0);
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log('❌ Validation failed with errors');
      process.exit(1);
    } else {
      console.log('✅ Validation completed with warnings only');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new FeatureAPIValidator();
validator.run();