#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Nexa Manager - Startup Check');
console.log('================================');

// Check if web-app directory exists
const webAppPath = path.join(process.cwd(), 'web-app');
if (!fs.existsSync(webAppPath)) {
  console.error('❌ Error: web-app directory not found');
  process.exit(1);
}

// Check if web-app package.json exists
const webAppPackageJson = path.join(webAppPath, 'package.json');
if (!fs.existsSync(webAppPackageJson)) {
  console.error('❌ Error: web-app/package.json not found');
  process.exit(1);
}

// Check if node_modules exists in web-app
const webAppNodeModules = path.join(webAppPath, 'node_modules');
if (!fs.existsSync(webAppNodeModules)) {
  console.log('⚠️  Warning: web-app/node_modules not found');
  console.log('   Run "npm run install-all" to install dependencies');
  process.exit(1);
}

// Check for environment files
const envFiles = ['.env', '.env.local', '.env.development'];
let envFound = false;
for (const envFile of envFiles) {
  if (fs.existsSync(path.join(webAppPath, envFile))) {
    envFound = true;
    console.log(`✅ Found environment file: ${envFile}`);
    break;
  }
}

if (!envFound) {
  console.log('⚠️  No environment files found in web-app/');
  console.log('   You may need to set up environment variables for Supabase, Clerk, etc.');
}

// Check for TaskMaster setup
const taskmasterPath = path.join(process.cwd(), '.taskmaster');
if (fs.existsSync(taskmasterPath)) {
  console.log('✅ TaskMaster setup detected');
} else {
  console.log('ℹ️  TaskMaster not initialized (this is optional)');
}

console.log('✅ Startup checks passed - launching development server...');
console.log(''); 