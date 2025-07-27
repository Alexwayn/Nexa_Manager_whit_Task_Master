#!/usr/bin/env node

/**
 * Build Validation Script
 * 
 * This script validates that the build process works correctly
 * with the new feature-based structure and all dependencies
 * are properly resolved.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webAppRoot = path.resolve(__dirname, '..');
const distPath = path.join(webAppRoot, 'dist');

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message) {
    console.log(`🔍 ${message}`);
  }

  error(message) {
    this.errors.push(message);
    console.error(`❌ ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`⚠️  ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  async validatePreBuild() {
    this.log('Validating pre-build requirements...');
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(webAppRoot, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      this.error('node_modules directory not found. Run npm install first.');
      return false;
    }
    
    // Check TypeScript configuration
    const tsconfigPath = path.join(webAppRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      this.error('tsconfig.json not found');
      return false;
    }
    
    // Check Vite configuration
    const viteConfigPath = path.join(webAppRoot, 'vite.config.ts');
    if (!fs.existsSync(viteConfigPath)) {
      this.error('vite.config.ts not found');
      return false;
    }
    
    this.success('Pre-build validation passed');
    return true;
  }

  async validateTypeScript() {
    this.log('Running TypeScript type checking...');
    
    try {
      execSync('npm run type-check', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });
      this.success('TypeScript type checking passed');
      return true;
    } catch (error) {
      this.error(`TypeScript type checking failed: ${error.message}`);
      return false;
    }
  }

  async validateLinting() {
    this.log('Running ESLint validation...');
    
    try {
      execSync('npm run lint', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });
      this.success('ESLint validation passed');
      return true;
    } catch (error) {
      this.error(`ESLint validation failed: ${error.message}`);
      return false;
    }
  }

  async validateArchitecture() {
    this.log('Running architectural validation...');
    
    try {
      execSync('npm run test:architecture', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });
      this.success('Architectural validation passed');
      return true;
    } catch (error) {
      this.error(`Architectural validation failed: ${error.message}`);
      return false;
    }
  }

  async validateFeatureAPIs() {
    this.log('Validating feature APIs...');
    
    try {
      execSync('npm run validate:feature-api', { 
        cwd: webAppRoot, 
        stdio: 'pipe' 
      });
      this.success('Feature API validation passed');
      return true;
    } catch (error) {
      this.error(`Feature API validation failed: ${error.message}`);
      return false;
    }
  }

  async runBuild() {
    this.log('Running production build...');
    
    // Clean previous build
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    
    try {
      execSync('npm run build', { 
        cwd: webAppRoot, 
        stdio: 'inherit' 
      });
      this.success('Production build completed');
      return true;
    } catch (error) {
      this.error(`Production build failed: ${error.message}`);
      return false;
    }
  }

  async validateBuildOutput() {
    this.log('Validating build output...');
    
    if (!fs.existsSync(distPath)) {
      this.error('Build output directory (dist/) not found');
      return false;
    }
    
    // Check for essential files
    const essentialFiles = [
      'index.html',
      'assets'
    ];
    
    for (const file of essentialFiles) {
      const filePath = path.join(distPath, file);
      if (!fs.existsSync(filePath)) {
        this.error(`Essential build file missing: ${file}`);
        return false;
      }
    }
    
    // Check assets directory
    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);
    
    // Should have at least one JS and one CSS file
    const hasJS = assetFiles.some(file => file.endsWith('.js'));
    const hasCSS = assetFiles.some(file => file.endsWith('.css'));
    
    if (!hasJS) {
      this.error('No JavaScript files found in build output');
      return false;
    }
    
    if (!hasCSS) {
      this.warn('No CSS files found in build output');
    }
    
    this.success(`Build output validation passed (${assetFiles.length} asset files)`);
    return true;
  }

  async validateChunks() {
    this.log('Validating build chunks...');
    
    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
    
    // Expected chunks based on our configuration
    const expectedChunks = [
      'react-vendor',
      'shared-components',
      'feature-auth',
      'feature-clients',
      'feature-financial',
      'main'
    ];
    
    const foundChunks = [];
    
    for (const jsFile of jsFiles) {
      for (const expectedChunk of expectedChunks) {
        if (jsFile.includes(expectedChunk)) {
          foundChunks.push(expectedChunk);
          break;
        }
      }
    }
    
    const missingChunks = expectedChunks.filter(chunk => !foundChunks.includes(chunk));
    
    if (missingChunks.length > 0) {
      this.warn(`Some expected chunks not found: ${missingChunks.join(', ')}`);
    }
    
    this.success(`Found ${foundChunks.length} expected chunks: ${foundChunks.join(', ')}`);
    return true;
  }

  async validateBundleSize() {
    this.log('Validating bundle sizes...');
    
    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);
    
    let totalSize = 0;
    const fileSizes = [];
    
    for (const file of assetFiles) {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      totalSize += sizeKB;
      fileSizes.push({ file, size: sizeKB });
    }
    
    // Sort by size (largest first)
    fileSizes.sort((a, b) => b.size - a.size);
    
    // Check for overly large files
    const largeFiles = fileSizes.filter(f => f.size > 500); // > 500KB
    
    if (largeFiles.length > 0) {
      this.warn(`Large bundle files detected:`);
      largeFiles.forEach(f => {
        console.warn(`  - ${f.file}: ${f.size}KB`);
      });
    }
    
    this.success(`Total bundle size: ${totalSize}KB`);
    
    // Log top 5 largest files
    console.log('📊 Largest bundle files:');
    fileSizes.slice(0, 5).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.file}: ${f.size}KB`);
    });
    
    return true;
  }

  async validateImportPaths() {
    this.log('Validating import paths in build...');
    
    // This is a basic check - in a real scenario, you might want to
    // parse the built files to ensure all imports are resolved correctly
    
    const indexHtmlPath = path.join(distPath, 'index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if the HTML references the expected assets
    if (!indexHtml.includes('/assets/')) {
      this.error('Build HTML does not reference assets correctly');
      return false;
    }
    
    this.success('Import paths validation passed');
    return true;
  }

  async run() {
    console.log('🚀 Starting Build Validation...\n');
    
    const validations = [
      { name: 'Pre-build', fn: () => this.validatePreBuild() },
      { name: 'TypeScript', fn: () => this.validateTypeScript() },
      { name: 'ESLint', fn: () => this.validateLinting() },
      { name: 'Architecture', fn: () => this.validateArchitecture() },
      { name: 'Feature APIs', fn: () => this.validateFeatureAPIs() },
      { name: 'Build', fn: () => this.runBuild() },
      { name: 'Build Output', fn: () => this.validateBuildOutput() },
      { name: 'Chunks', fn: () => this.validateChunks() },
      { name: 'Bundle Size', fn: () => this.validateBundleSize() },
      { name: 'Import Paths', fn: () => this.validateImportPaths() }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const validation of validations) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Running ${validation.name} validation...`);
      console.log('='.repeat(50));
      
      try {
        const result = await validation.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.error(`${validation.name} validation threw an error: ${error.message}`);
        failed++;
      }
    }
    
    this.printSummary(passed, failed);
  }

  printSummary(passed, failed) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failed > 0) {
      console.log('❌ Build validation failed');
      process.exit(1);
    } else {
      console.log('✅ Build validation passed successfully!');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new BuildValidator();
validator.run().catch(error => {
  console.error('❌ Build validation crashed:', error);
  process.exit(1);
});