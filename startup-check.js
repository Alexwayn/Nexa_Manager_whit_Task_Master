#!/usr/bin/env node

/**
 * Startup Check Script for Nexa Manager
 * Verifies environment setup and prerequisites before starting development
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Running Nexa Manager startup checks...');

// Check if web-app directory exists
const webAppPath = path.join(__dirname, 'web-app');
if (!fs.existsSync(webAppPath)) {
  console.error('❌ web-app directory not found');
  process.exit(1);
}

// Check if package.json exists in web-app
const webAppPackageJson = path.join(webAppPath, 'package.json');
if (!fs.existsSync(webAppPackageJson)) {
  console.error('❌ web-app/package.json not found');
  process.exit(1);
}

// Check if .env file exists in web-app
const envFile = path.join(webAppPath, '.env');
if (!fs.existsSync(envFile)) {
  console.warn('⚠️  .env file not found in web-app directory');
  console.warn('   Please create a .env file with required environment variables');
} else {
  console.log('✅ Environment file found');
}

// Check for node_modules in web-app
const nodeModules = path.join(webAppPath, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.warn('⚠️  node_modules not found in web-app');
  console.warn('   Please run: cd web-app && npm install');
} else {
  console.log('✅ Dependencies installed');
}

console.log('✅ Startup checks completed successfully');
console.log('📁 Starting development server in web-app directory...\n'); 