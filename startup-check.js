#!/usr/bin/env node
/**
 * Startup Check Script for Nexa Manager
 * This script checks for common issues and provides helpful feedback
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Nexa Manager - Startup Check\n');

// Check 1: Verify project structure
console.log('1️⃣ Checking project structure...');
const requiredDirs = ['web-app', 'web-app/src', 'web-app/src/pages', 'web-app/src/components'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.log('❌ Missing directories:', missingDirs.join(', '));
  process.exit(1);
} else {
  console.log('✅ Project structure looks good');
}

// Check 2: Verify package.json files
console.log('\n2️⃣ Checking package.json files...');
if (!fs.existsSync('package.json')) {
  console.log('❌ Root package.json missing');
  process.exit(1);
}

if (!fs.existsSync('web-app/package.json')) {
  console.log('❌ Web-app package.json missing');
  process.exit(1);
}
console.log('✅ Package.json files found');

// Check 3: Environment variables
console.log('\n3️⃣ Checking environment configuration...');
const envFile = 'web-app/.env.local';
const envExampleFile = 'web-app/env.example';

if (!fs.existsSync(envFile)) {
  console.log('⚠️ No .env.local file found in web-app directory');
  if (fs.existsSync(envExampleFile)) {
    console.log('💡 You can copy env.example to .env.local and update the values');
  } else {
    console.log('💡 Create a .env.local file in web-app directory with your Supabase credentials');
  }
} else {
  console.log('✅ Environment file found');
}

// Check 4: Node modules
console.log('\n4️⃣ Checking dependencies...');
if (!fs.existsSync('web-app/node_modules')) {
  console.log('❌ Dependencies not installed in web-app');
  console.log('💡 Run: npm run install-all');
  process.exit(1);
} else {
  console.log('✅ Dependencies appear to be installed');
}

// Provide helpful commands
console.log('\n🚀 Quick Start Commands:');
console.log('  npm run dev      - Start development server');
console.log('  npm run build    - Build for production');
console.log('  npm run install-all - Install all dependencies');
console.log('  npm run clean    - Clean and reinstall dependencies');

console.log('\n📁 Current working directory:', process.cwd());
console.log('💡 Make sure to run commands from the project root directory');

console.log('\n✅ Startup check completed successfully!');
console.log('\n🔧 Recent Fixes Applied:');
console.log('  ✅ Fixed all CSS undefined class issues (border-border, bg-background, etc.)');
console.log('  ✅ Fixed QuotePdfService import error');
console.log('  ✅ Cleaned up debug HTML files');
console.log('  ✅ Improved Vite scanning performance');
console.log('  ✅ Added proper dark mode support for all components');
console.log('\n💡 If you still see errors, try:');
console.log('  npm run clean    - Clean and reinstall dependencies');
console.log('  npm run check    - Run this diagnostic again'); 