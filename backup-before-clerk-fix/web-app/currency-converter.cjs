/**
 * Currency Converter Script
 * Converts all dollar signs ($) to euro symbols (€) in the web application
 * Run this script from the project root directory
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = './src';
const BACKUP_DIR = './currency-backup';
const LOG_FILE = './currency-conversion.log';

// Patterns to match and replace
const CURRENCY_PATTERNS = [
  // Direct dollar amounts like $0, $100, $1,000
  {
    pattern: /\$([0-9,]+(?:\.[0-9]{2})?)/g,
    replacement: '€$1',
    description: 'Direct dollar amounts'
  },
  // Dollar signs before template literals like ${amount} - fix the incorrect pattern
  {
    pattern: /€\$\{([^}]+)\}/g,
    replacement: '€{$1}',
    description: 'Fix incorrectly converted template literals'
  },
  // Dollar signs before template literals like ${amount}
  {
    pattern: /\$\{([^}]+\.toLocaleString\(\)[^}]*?)\}/g,
    replacement: '€{$1}',
    description: 'Template literals with toLocaleString()'
  },
  // Dollar signs in strings like 'Budget: $0'
  {
    pattern: /'([^']*?)\$([0-9,]+(?:\.[0-9]{2})?[^']*?)'/g,
    replacement: "'$1€$2'",
    description: 'Dollar amounts in single quotes'
  },
  {
    pattern: /"([^"]*?)\$([0-9,]+(?:\.[0-9]{2})?[^"]*?)"/g,
    replacement: '"$1€$2"',
    description: 'Dollar amounts in double quotes'
  },
  // Standalone dollar signs like <span>$</span>
  {
    pattern: />\$</g,
    replacement: '>€<',
    description: 'Standalone dollar signs in JSX'
  },
  // Dollar signs in template strings
  {
    pattern: /`([^`]*?)\$([0-9,]+(?:\.[0-9]{2})?[^`]*?)`/g,
    replacement: '`$1€$2`',
    description: 'Dollar amounts in template strings'
  },
  // Range patterns like $0 - $10K
  {
    pattern: /\$([0-9]+(?:[KMB])?)(\s*-\s*)\$([0-9]+[KMB]?)/g,
    replacement: '€$1$2€$3',
    description: 'Dollar ranges'
  },
  // Currency symbols in input placeholders
  {
    pattern: /text-gray-500[^>]*>\$</g,
    replacement: function(match) {
      return match.replace('$', '€');
    },
    description: 'Dollar signs in input placeholders'
  }
];

// Files to exclude from conversion
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.log$/,
  /currency-converter\.js$/,
  /currency-conversion\.log$/,
  /currency-backup/
];

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Create backup directory
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

// Check if file should be excluded
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

// Get all JavaScript/JSX files recursively
function getJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (shouldExclude(filePath)) {
      return;
    }
    
    if (stat.isDirectory()) {
      getJSFiles(filePath, fileList);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Backup a file
function backupFile(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
}

// Convert currency in a single file
function convertFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    const changes = [];
    
    // Apply each pattern
    CURRENCY_PATTERNS.forEach(({ pattern, replacement, description }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        hasChanges = true;
        changes.push(`${description}: ${matches.length} replacements`);
      }
    });
    
    if (hasChanges) {
      // Create backup before modifying
      backupFile(filePath);
      
      // Write the modified content
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      log(`✅ Converted: ${filePath}`);
      changes.forEach(change => log(`   - ${change}`));
      
      return { converted: true, changes: changes.length };
    } else {
      log(`⏭️  No changes: ${filePath}`);
      return { converted: false, changes: 0 };
    }
  } catch (error) {
    log(`❌ Error processing ${filePath}: ${error.message}`);
    return { converted: false, changes: 0, error: error.message };
  }
}

// Main conversion function
function convertCurrency() {
  log('🚀 Starting currency conversion from $ to €');
  log(`📁 Source directory: ${SRC_DIR}`);
  log(`💾 Backup directory: ${BACKUP_DIR}`);
  
  // Create backup directory
  createBackup();
  
  // Get all JS/JSX files
  const files = getJSFiles(SRC_DIR);
  log(`📄 Found ${files.length} JavaScript/JSX files`);
  
  // Convert each file
  let totalConverted = 0;
  let totalChanges = 0;
  const errors = [];
  
  files.forEach(file => {
    const result = convertFile(file);
    if (result.converted) {
      totalConverted++;
      totalChanges += result.changes;
    }
    if (result.error) {
      errors.push({ file, error: result.error });
    }
  });
  
  // Summary
  log('\n📊 CONVERSION SUMMARY');
  log(`✅ Files processed: ${files.length}`);
  log(`🔄 Files converted: ${totalConverted}`);
  log(`📝 Total changes: ${totalChanges}`);
  log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    log('\n❌ ERRORS:');
    errors.forEach(({ file, error }) => {
      log(`   ${file}: ${error}`);
    });
  }
  
  log('\n🎉 Currency conversion completed!');
  log(`💾 Backup files saved in: ${BACKUP_DIR}`);
  log(`📋 Full log saved in: ${LOG_FILE}`);
}

// Restore function (in case of issues)
function restoreFromBackup() {
  log('🔄 Restoring files from backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    log('❌ No backup directory found!');
    return;
  }
  
  const backupFiles = getJSFiles(BACKUP_DIR);
  
  backupFiles.forEach(backupFile => {
    const relativePath = path.relative(BACKUP_DIR, backupFile);
    const originalFile = path.join(SRC_DIR, relativePath);
    
    try {
      fs.copyFileSync(backupFile, originalFile);
      log(`✅ Restored: ${originalFile}`);
    } catch (error) {
      log(`❌ Error restoring ${originalFile}: ${error.message}`);
    }
  });
  
  log('🎉 Restore completed!');
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'convert':
      convertCurrency();
      break;
    case 'restore':
      restoreFromBackup();
      break;
    case 'help':
    default:
      console.log('Currency Converter Script');
      console.log('Usage:');
      console.log('  node currency-converter.js convert  - Convert $ to € in all files');
      console.log('  node currency-converter.js restore  - Restore files from backup');
      console.log('  node currency-converter.js help     - Show this help message');
      break;
  }
}

module.exports = {
  convertCurrency,
  restoreFromBackup,
  CURRENCY_PATTERNS
};