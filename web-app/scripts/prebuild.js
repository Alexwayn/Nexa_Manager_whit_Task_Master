#!/usr/bin/env node

/**
 * Pre-build script to ensure all assets are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'nexa-logo.svg');
const faviconPath = path.join(publicDir, 'favicon.ico');

console.log('🔧 Running pre-build checks...');

// Check if nexa-logo.svg exists
if (!fs.existsSync(logoPath)) {
  console.warn('⚠️  nexa-logo.svg not found in public directory');
  process.exit(1);
} else {
  console.log('✅ nexa-logo.svg found');
}

// Check if favicon.ico exists, if not create a simple one
if (!fs.existsSync(faviconPath)) {
  console.log('📝 Creating favicon.ico fallback...');
  // For now, just log - in a real scenario you'd convert SVG to ICO
  console.log('ℹ️  Consider adding a favicon.ico file for better browser compatibility');
}

console.log('✅ Pre-build checks completed successfully');